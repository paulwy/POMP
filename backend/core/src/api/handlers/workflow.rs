use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    response::IntoResponse,
    Json,
};
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use serde_json;
use std::sync::Arc;
use uuid::Uuid;

use crate::errors::ApiResponse;
use crate::AppState;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ApprovalTask {
    pub task_id: String,
    pub workflow_instance_id: String,
    pub workflow_name: String,
    pub workflow_code: String,
    pub node_id: String,
    pub node_name: String,
    pub applicant_id: String,
    pub applicant_name: String,
    pub applicant_department: String,
    pub business_type: String,
    pub business_id: String,
    pub business_title: String,
    pub status: String,
    pub priority: String,
    pub created_at: DateTime<Utc>,
    pub deadline_at: Option<DateTime<Utc>>,
    pub is_overdue: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkflowSimple {
    pub id: String,
    pub name: String,
    pub code: Option<String>,
    pub description: Option<String>,
    pub is_active: bool,
    pub is_system: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkflowNodeSimple {
    pub id: String,
    pub workflow_id: String,
    pub name: String,
    pub node_type: String,
    pub node_order: i32,
    pub approver_role: Option<String>,
    pub approver_user: Option<String>,
    pub is_multiple: Option<bool>,
    pub min_approve: Option<i32>,
    pub timeout_days: Option<i32>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateWorkflowRequest {
    pub name: String,
    pub description: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateWorkflowRequest {
    pub name: String,
    pub description: Option<String>,
    pub is_active: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateWorkflowNodeRequest {
    pub workflow_id: String,
    pub name: String,
    pub node_type: String,
    pub node_order: i32,
    pub approver_role: Option<String>,
    pub approver_user: Option<String>,
    pub is_multiple: Option<bool>,
    pub min_approve: Option<i32>,
    pub timeout_days: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateWorkflowNodeRequest {
    pub name: String,
    pub node_type: String,
    pub node_order: i32,
    pub approver_role: Option<String>,
    pub approver_user: Option<String>,
    pub is_multiple: Option<bool>,
    pub min_approve: Option<i32>,
    pub timeout_days: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserSimple {
    pub id: String,
    pub username: String,
    pub name: Option<String>,
    pub email: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ApproveRequest {
    pub user_id: String,
    pub approved: bool,
    pub comment: Option<String>,
}

pub async fn get_my_tasks_handler(
    State(state): State<Arc<AppState>>,
    Query(params): Query<std::collections::HashMap<String, String>>,
) -> impl IntoResponse {
    let user_id_str = params.get("user_id").cloned().unwrap_or_default();
    let user_id = user_id_str.parse::<Uuid>().unwrap_or_else(|_| Uuid::nil());

    let tasks = match sqlx::query!(
        r#"SELECT
            wt.id, wt.workflow_id, wt.workflow_code, wt.title, wt.description, wt.status, wt.current_step, wt.max_steps,
            wt.creator_id, wt.creator_name, wt.current_approver_id, wt.current_approver_name,
            wt.created_at, wt.updated_at, wt.completed_at,
            ar.id as record_id, ar.approver_id, ar.approver_name, ar.action, ar.comment, ar.created_at as record_created_at
        FROM approval_tasks wt
        LEFT JOIN approval_records ar ON wt.id = ar.task_id
        WHERE wt.current_approver_id = $1::UUID
        ORDER BY wt.created_at DESC"#,
        user_id,
    )
    .fetch_all(&state.db)
    .await
    {
        Ok(records) => records
            .into_iter()
            .map(|r| ApprovalTask {
                task_id: r.id.to_string(),
                workflow_instance_id: r.workflow_id.clone(),
                workflow_name: r.title.clone(),
                workflow_code: r.workflow_code.clone(),
                node_id: r.workflow_code.clone(),
                node_name: format!("步骤 {}/{}", r.current_step, r.max_steps),
                applicant_id: r.creator_id.to_string(),
                applicant_name: r.creator_name.clone(),
                applicant_department: "".to_string(),
                business_type: r.workflow_id.clone(),
                business_id: r.id.to_string(),
                business_title: r.title.clone(),
                status: r.status.clone(),
                priority: "0".to_string(),
                created_at: r.created_at,
                deadline_at: None,
                is_overdue: false,
            })
            .collect::<Vec<_>>(),
        Err(e) => {
            eprintln!("Error fetching approval tasks: {}", e);
            vec![]
        }
    };

    (StatusCode::OK, Json(ApiResponse::success(tasks)))
}

pub async fn get_my_initiated_handler(
    State(state): State<Arc<AppState>>,
    Query(params): Query<std::collections::HashMap<String, String>>,
) -> impl IntoResponse {
    let user_id = params.get("user_id").cloned();

    let tasks = if let Some(uid) = user_id {
        match sqlx::query!(
            r#"SELECT
                wt.id, wt.workflow_id, wt.workflow_code, wt.title, wt.description, wt.status, wt.current_step, wt.max_steps,
                wt.creator_id, wt.creator_name, wt.current_approver_id, wt.current_approver_name,
                wt.created_at, wt.updated_at, wt.completed_at
            FROM approval_tasks wt
            WHERE wt.creator_id::TEXT = $1
            ORDER BY wt.created_at DESC"#,
            uid,
        )
        .fetch_all(&state.db)
        .await
        {
            Ok(records) => records
                .into_iter()
                .map(|r| ApprovalTask {
                    task_id: r.id.to_string(),
                    workflow_instance_id: r.workflow_id.clone(),
                    workflow_name: r.title.clone(),
                    workflow_code: r.workflow_code.clone(),
                    node_id: r.workflow_code.clone(),
                    node_name: format!("步骤 {}/{}", r.current_step, r.max_steps),
                    applicant_id: r.creator_id.to_string(),
                    applicant_name: r.creator_name.clone(),
                    applicant_department: "".to_string(),
                    business_type: r.workflow_id.clone(),
                    business_id: r.id.to_string(),
                    business_title: r.title.clone(),
                    status: r.status.clone(),
                    priority: "0".to_string(),
                    created_at: r.created_at,
                    deadline_at: None,
                    is_overdue: false,
                })
                .collect::<Vec<ApprovalTask>>(),
            Err(e) => {
                eprintln!("Error fetching initiated tasks: {}", e);
                vec![]
            }
        }
    } else {
        vec![]
    };

    (StatusCode::OK, Json(ApiResponse::success(tasks)))
}

pub async fn approve_task_handler(
    State(state): State<Arc<AppState>>,
    Path(task_id): Path<String>,
    Json(req): Json<ApproveRequest>,
) -> impl IntoResponse {
    let task_id_uuid = match task_id.parse::<Uuid>() {
        Ok(uuid) => uuid,
        Err(_) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(ApiResponse::error("无效的任务ID".to_string())),
            )
        }
    };

    let new_status = if req.approved { "approved" } else { "rejected" };

    match sqlx::query!(
        r#"UPDATE approval_tasks SET status = $1, updated_at = $2 WHERE id = $3"#,
        new_status,
        Utc::now(),
        task_id_uuid
    )
    .execute(&state.db)
    .await
    {
        Ok(result) => {
            if result.rows_affected() == 0 {
                (
                    StatusCode::NOT_FOUND,
                    Json(ApiResponse::error("任务不存在".to_string())),
                )
            } else {
                let result = serde_json::json!({
                    "task_id": task_id,
                    "status": new_status,
                    "comment": req.comment,
                    "processed_at": Utc::now(),
                    "processed_by": req.user_id,
                });
                (StatusCode::OK, Json(ApiResponse::success(result)))
            }
        }
        Err(e) => {
            tracing::error!("Error approving task: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiResponse::error("审批任务失败".to_string())),
            )
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ApprovalRecord {
    pub id: String,
    pub task_id: String,
    pub step_number: i32,
    pub step_name: Option<String>,
    pub approver_id: String,
    pub approver_name: String,
    pub action: String,
    pub comment: Option<String>,
    pub created_at: DateTime<Utc>,
}

pub async fn get_task_records_handler(
    State(state): State<Arc<AppState>>,
    Path(task_id): Path<String>,
) -> impl IntoResponse {
    let task_id_uuid = match task_id.parse::<Uuid>() {
        Ok(uuid) => uuid,
        Err(_) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(ApiResponse::error("无效的任务ID".to_string())),
            );
        }
    };

    let records = match sqlx::query!(
        r#"SELECT id, task_id, step_number, approver_id, approver_name, action, comment, created_at
        FROM approval_records
        WHERE task_id = $1
        ORDER BY created_at DESC"#,
        task_id_uuid,
    )
    .fetch_all(&state.db)
    .await
    {
        Ok(records) => records
            .into_iter()
            .map(|r| ApprovalRecord {
                id: r.id.to_string(),
                task_id: r.task_id.to_string(),
                step_number: r.step_number,
                step_name: None,
                approver_id: r.approver_id.to_string(),
                approver_name: r.approver_name,
                action: r.action,
                comment: r.comment,
                created_at: r.created_at,
            })
            .collect::<Vec<ApprovalRecord>>(),
        Err(e) => {
            tracing::error!("Error fetching task records: {}", e);
            return (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiResponse::error("获取审批记录失败".to_string())));
        }
    };

    (StatusCode::OK, Json(ApiResponse::success(records)))
}

pub async fn get_task_detail_handler(
    State(state): State<Arc<AppState>>,
    Path(task_id): Path<String>,
) -> impl IntoResponse {
    let task_id_uuid = match task_id.parse::<Uuid>() {
        Ok(uuid) => uuid,
        Err(_) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(ApiResponse::error("无效的任务ID".to_string())),
            );
        }
    };

    let task = match sqlx::query!(
        r#"SELECT
            wt.id, wt.workflow_id, wt.workflow_code, wt.title, wt.description, wt.status, wt.current_step, wt.max_steps,
            wt.creator_id, wt.creator_name, wt.current_approver_id, wt.current_approver_name,
            wt.created_at, wt.updated_at, wt.completed_at
        FROM approval_tasks wt
        WHERE wt.id = $1::UUID"#,
        task_id_uuid,
    )
    .fetch_optional(&state.db)
    .await
    {
        Ok(Some(r)) => ApprovalTask {
            task_id: r.id.to_string(),
            workflow_instance_id: r.workflow_id.clone(),
            workflow_name: r.title.clone(),
            workflow_code: r.workflow_code.clone(),
            node_id: r.workflow_code.clone(),
            node_name: format!("步骤 {}/{}", r.current_step, r.max_steps),
            applicant_id: r.creator_id.to_string(),
            applicant_name: r.creator_name.clone(),
            applicant_department: "".to_string(),
            business_type: r.workflow_id.clone(),
            business_id: r.id.to_string(),
            business_title: r.title.clone(),
            status: r.status.clone(),
            priority: "0".to_string(),
            created_at: r.created_at,
            deadline_at: None,
            is_overdue: false,
        },
        Ok(None) => {
            return (StatusCode::NOT_FOUND, Json(ApiResponse::error("任务不存在".to_string())));
        }
        Err(e) => {
            eprintln!("Error fetching task detail: {}", e);
            return (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiResponse::error("获取任务详情失败".to_string())));
        }
    };

    (StatusCode::OK, Json(ApiResponse::success(task)))
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ApprovalHistory {
    pub history_id: String,
    pub task_id: String,
    pub workflow_instance_id: String,
    pub workflow_name: String,
    pub node_id: String,
    pub node_name: String,
    pub applicant_id: String,
    pub applicant_name: String,
    pub business_type: String,
    pub business_id: String,
    pub business_title: String,
    pub status: String,
    pub comment: Option<String>,
    pub processor_id: Option<String>,
    pub processor_name: Option<String>,
    pub processed_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
}

pub async fn get_approval_history_handler(
    State(state): State<Arc<AppState>>,
    Query(params): Query<std::collections::HashMap<String, String>>,
) -> impl IntoResponse {
    let user_id = params.get("user_id").cloned();

    let history = if let Some(uid) = user_id {
        match sqlx::query!(
            r#"SELECT id, workflow_id, workflow_code, title, status, creator_id, creator_name, created_at, updated_at, completed_at
            FROM approval_tasks
            WHERE current_approver_id::TEXT = $1
            ORDER BY created_at DESC
            LIMIT 100"#,
            uid
        )
        .fetch_all(&state.db)
        .await
        {
            Ok(records) => records
                .into_iter()
                .map(|r| ApprovalHistory {
                    history_id: r.id.to_string(),
                    task_id: r.id.to_string(),
                    workflow_instance_id: r.workflow_id.clone(),
                    workflow_name: r.title.clone(),
                    node_id: r.workflow_code,
                    node_name: "审批节点".to_string(),
                    applicant_id: r.creator_id.to_string(),
                    applicant_name: r.creator_name,
                    business_type: r.workflow_id.clone(),
                    business_id: r.id.to_string(),
                    business_title: r.title.clone(),
                    status: r.status,
                    comment: None,
                    processor_id: None,
                    processor_name: None,
                    processed_at: r.completed_at,
                    created_at: r.created_at,
                })
                .collect::<Vec<ApprovalHistory>>(),
            Err(e) => {
                tracing::error!("Error fetching approval history: {}", e);
                vec![]
            }
        }
    } else {
        match sqlx::query!(
            r#"SELECT id, workflow_id, workflow_code, title, status, creator_id, creator_name, created_at, updated_at, completed_at
            FROM approval_tasks
            ORDER BY created_at DESC
            LIMIT 100"#
        )
        .fetch_all(&state.db)
        .await
        {
            Ok(records) => records
                .into_iter()
                .map(|r| ApprovalHistory {
                    history_id: r.id.to_string(),
                    task_id: r.id.to_string(),
                    workflow_instance_id: r.workflow_id.clone(),
                    workflow_name: r.title.clone(),
                    node_id: r.workflow_code,
                    node_name: "审批节点".to_string(),
                    applicant_id: r.creator_id.to_string(),
                    applicant_name: r.creator_name,
                    business_type: r.workflow_id.clone(),
                    business_id: r.id.to_string(),
                    business_title: r.title.clone(),
                    status: r.status,
                    comment: None,
                    processor_id: None,
                    processor_name: None,
                    processed_at: r.completed_at,
                    created_at: r.created_at,
                })
                .collect::<Vec<ApprovalHistory>>(),
            Err(e) => {
                tracing::error!("Error fetching approval history: {}", e);
                vec![]
            }
        }
    };

    (StatusCode::OK, Json(ApiResponse::success(history)))
}

pub async fn get_my_initiated_history_handler(
    State(state): State<Arc<AppState>>,
    Query(params): Query<std::collections::HashMap<String, String>>,
) -> impl IntoResponse {
    let user_id = params.get("user_id").cloned();

    let history = if let Some(uid) = user_id {
        match sqlx::query!(
            r#"SELECT id, workflow_id, workflow_code, title, status, creator_id, creator_name, created_at, updated_at, completed_at
            FROM approval_tasks
            WHERE creator_id::TEXT = $1
            ORDER BY created_at DESC
            LIMIT 100"#,
            uid
        )
        .fetch_all(&state.db)
        .await
        {
            Ok(records) => records
                .into_iter()
                .map(|r| ApprovalHistory {
                    history_id: r.id.to_string(),
                    task_id: r.id.to_string(),
                    workflow_instance_id: r.workflow_id.clone(),
                    workflow_name: r.title.clone(),
                    node_id: r.workflow_code,
                    node_name: "审批节点".to_string(),
                    applicant_id: r.creator_id.to_string(),
                    applicant_name: r.creator_name,
                    business_type: r.workflow_id.clone(),
                    business_id: r.id.to_string(),
                    business_title: r.title.clone(),
                    status: r.status,
                    comment: None,
                    processor_id: None,
                    processor_name: None,
                    processed_at: r.completed_at,
                    created_at: r.created_at,
                })
                .collect::<Vec<ApprovalHistory>>(),
            Err(e) => {
                tracing::error!("Error fetching initiated history: {}", e);
                vec![]
            }
        }
    } else {
        match sqlx::query!(
            r#"SELECT id, workflow_id, workflow_code, title, status, creator_id, creator_name, created_at, updated_at, completed_at
            FROM approval_tasks
            ORDER BY created_at DESC
            LIMIT 100"#
        )
        .fetch_all(&state.db)
        .await
        {
            Ok(records) => records
                .into_iter()
                .map(|r| ApprovalHistory {
                    history_id: r.id.to_string(),
                    task_id: r.id.to_string(),
                    workflow_instance_id: r.workflow_id.clone(),
                    workflow_name: r.title.clone(),
                    node_id: r.workflow_code,
                    node_name: "审批节点".to_string(),
                    applicant_id: r.creator_id.to_string(),
                    applicant_name: r.creator_name,
                    business_type: r.workflow_id.clone(),
                    business_id: r.id.to_string(),
                    business_title: r.title.clone(),
                    status: r.status,
                    comment: None,
                    processor_id: None,
                    processor_name: None,
                    processed_at: r.completed_at,
                    created_at: r.created_at,
                })
                .collect::<Vec<ApprovalHistory>>(),
            Err(e) => {
                tracing::error!("Error fetching initiated history: {}", e);
                vec![]
            }
        }
    };

    (StatusCode::OK, Json(ApiResponse::success(history)))
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Workflow {
    pub workflow_id: String,
    pub workflow_name: String,
    pub workflow_code: String,
    pub description: Option<String>,
    pub is_active: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

pub async fn get_workflows_handler(State(state): State<Arc<AppState>>) -> impl IntoResponse {
    let workflows = match sqlx::query!(
        r#"SELECT id, name, code, description, is_active, is_system, created_at, updated_at
        FROM workflows
        ORDER BY created_at DESC"#
    )
    .fetch_all(&state.db)
    .await
    {
        Ok(records) => records
            .into_iter()
            .map(|r| WorkflowSimple {
                id: r.id.to_string(),
                name: r.name,
                code: r.code,
                description: r.description,
                is_active: r.is_active.unwrap_or(true),
                is_system: r.is_system.unwrap_or(false),
                created_at: r.created_at.unwrap_or_else(Utc::now),
                updated_at: r.updated_at.unwrap_or_else(Utc::now),
            })
            .collect::<Vec<WorkflowSimple>>(),
        Err(e) => {
            eprintln!("Error fetching workflows: {}", e);
            vec![]
        }
    };

    (StatusCode::OK, Json(ApiResponse::success(workflows)))
}

pub async fn get_all_users_handler(State(state): State<Arc<AppState>>) -> impl IntoResponse {
    let users = match sqlx::query!(
        r#"SELECT id, username, name, email FROM users ORDER BY created_at DESC"#
    )
    .fetch_all(&state.db)
    .await
    {
        Ok(records) => records
            .into_iter()
            .map(|r| UserSimple {
                id: r.id.to_string(),
                username: r.username,
                name: r.name,
                email: r.email.unwrap_or_default(),
            })
            .collect::<Vec<UserSimple>>(),
        Err(e) => {
            eprintln!("Error fetching users: {}", e);
            vec![]
        }
    };

    (StatusCode::OK, Json(ApiResponse::success(users)))
}

pub async fn create_workflow_handler(
    State(state): State<Arc<AppState>>,
    Json(req): Json<CreateWorkflowRequest>,
) -> impl IntoResponse {
    if req.name.trim().is_empty() {
        return (
            StatusCode::BAD_REQUEST,
            Json(ApiResponse::error("工作流名称不能为空".to_string())),
        );
    }

    let workflow_id = Uuid::new_v4();
    let now = Utc::now();

    match sqlx::query!(
        r#"INSERT INTO workflows (id, name, description, is_active, is_system, created_at, updated_at)
        VALUES ($1, $2, $3, true, false, $4, $5)
        RETURNING id, name, description, is_active, is_system, created_at, updated_at"#,
        workflow_id,
        req.name,
        req.description,
        now,
        now,
    )
    .fetch_one(&state.db)
    .await
    {
        Ok(r) => {
            let workflow = WorkflowSimple {
                id: r.id.to_string(),
                name: r.name,
                code: None,
                description: r.description,
                is_active: r.is_active.unwrap_or(true),
                is_system: r.is_system.unwrap_or(false),
                created_at: r.created_at.unwrap_or_else(Utc::now),
                updated_at: r.updated_at.unwrap_or_else(Utc::now),
            };
            (StatusCode::CREATED, Json(ApiResponse::success(workflow)))
        }
        Err(e) => {
            tracing::error!("Error creating workflow: {}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiResponse::error("创建工作流失败".to_string())))
        }
    }
}

pub async fn update_workflow_handler(
    State(state): State<Arc<AppState>>,
    Path(workflow_id): Path<String>,
    Json(req): Json<UpdateWorkflowRequest>,
) -> impl IntoResponse {
    let id = match Uuid::parse_str(&workflow_id) {
        Ok(uuid) => uuid,
        Err(_) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(ApiResponse::error("无效的工作流ID".to_string())),
            )
        }
    };

    let now = Utc::now();
    match sqlx::query!(
        r#"UPDATE workflows
        SET name = $1, description = $2, is_active = $3, updated_at = $4
        WHERE id = $5
        RETURNING id, name, description, is_active, is_system, created_at, updated_at"#,
        req.name,
        req.description,
        req.is_active,
        now,
        id,
    )
    .fetch_one(&state.db)
    .await
    {
        Ok(r) => {
            let workflow = WorkflowSimple {
                id: r.id.to_string(),
                name: r.name,
                code: None,
                description: r.description,
                is_active: r.is_active.unwrap_or(true),
                is_system: r.is_system.unwrap_or(false),
                created_at: r.created_at.unwrap_or_else(Utc::now),
                updated_at: r.updated_at.unwrap_or_else(Utc::now),
            };
            (StatusCode::OK, Json(ApiResponse::success(workflow)))
        }
        Err(e) => {
            tracing::error!("Error updating workflow: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiResponse::error("更新工作流失败".to_string())),
            )
        }
    }
}

pub async fn delete_workflow_handler(
    State(state): State<Arc<AppState>>,
    Path(workflow_id): Path<String>,
) -> impl IntoResponse {
    let id = match Uuid::parse_str(&workflow_id) {
        Ok(uuid) => uuid,
        Err(_) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(ApiResponse::error("无效的工作流ID".to_string())),
            )
        }
    };

    match sqlx::query!("DELETE FROM workflows WHERE id = $1", id)
        .execute(&state.db)
        .await
    {
        Ok(_) => (
            StatusCode::OK,
            Json(ApiResponse::success(
                serde_json::json!({"message": "删除成功"}),
            )),
        ),
        Err(e) => {
            tracing::error!("Error deleting workflow: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiResponse::error("删除工作流失败".to_string())),
            )
        }
    }
}

pub async fn get_workflow_nodes_handler(
    State(state): State<Arc<AppState>>,
    Path(workflow_id): Path<String>,
) -> impl IntoResponse {
    let _id = match Uuid::parse_str(&workflow_id) {
        Ok(uuid) => uuid,
        Err(_) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(ApiResponse::error("无效的工作流ID".to_string())),
            )
        }
    };

    let nodes = match sqlx::query!(
        r#"SELECT id, workflow_id, name, step_number, approver_type, approver_id, role_code,
        department_id, timeout_days, can_skip, is_optional, created_at, updated_at
        FROM workflow_steps
        WHERE workflow_id = $1::TEXT
        ORDER BY step_number"#,
        workflow_id,
    )
    .fetch_all(&state.db)
    .await
    {
        Ok(records) => records
            .into_iter()
            .map(|r| WorkflowNodeSimple {
                id: r.id.to_string(),
                workflow_id: r.workflow_id,
                name: r.name,
                node_type: "approval".to_string(),
                node_order: r.step_number,
                approver_role: r.role_code,
                approver_user: r.approver_id.map(|id| id.to_string()),
                is_multiple: None,
                min_approve: None,
                timeout_days: r.timeout_days,
                created_at: r.created_at,
                updated_at: r.updated_at,
            })
            .collect::<Vec<WorkflowNodeSimple>>(),
        Err(e) => {
            eprintln!("Error fetching workflow nodes: {}", e);
            vec![]
        }
    };

    (StatusCode::OK, Json(ApiResponse::success(nodes)))
}

pub async fn create_workflow_node_handler(
    State(state): State<Arc<AppState>>,
    Json(req): Json<CreateWorkflowNodeRequest>,
) -> impl IntoResponse {
    if req.name.trim().is_empty() {
        return (
            StatusCode::BAD_REQUEST,
            Json(ApiResponse::error("节点名称不能为空".to_string())),
        );
    }

    let _workflow_id = match Uuid::parse_str(&req.workflow_id) {
        Ok(uuid) => uuid,
        Err(_) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(ApiResponse::error("无效的工作流ID".to_string())),
            )
        }
    };

    let approver_id = req.approver_user.and_then(|s| Uuid::parse_str(&s).ok());
    let now = Utc::now();
    let node_id = Uuid::new_v4();

    match sqlx::query!(
        r#"INSERT INTO workflow_steps
        (id, workflow_id, step_number, name, approver_type, approver_id, role_code, timeout_days, can_skip, is_optional, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING id, workflow_id, step_number, name, approver_type, approver_id, role_code, timeout_days, created_at, updated_at"#,
        node_id,
        req.workflow_id,
        req.node_order,
        req.name,
        "assigned_user",
        approver_id,
        req.approver_role,
        req.timeout_days,
        false,
        false,
        now,
        now,
    )
    .fetch_one(&state.db)
    .await
    {
        Ok(r) => {
            let node = WorkflowNodeSimple {
                id: r.id.to_string(),
                workflow_id: r.workflow_id,
                name: r.name,
                node_type: "approval".to_string(),
                node_order: r.step_number,
                approver_role: r.role_code,
                approver_user: r.approver_id.map(|id| id.to_string()),
                is_multiple: None,
                min_approve: None,
                timeout_days: r.timeout_days,
                created_at: r.created_at,
                updated_at: r.updated_at,
            };
            (StatusCode::CREATED, Json(ApiResponse::success(node)))
        }
        Err(e) => {
            tracing::error!("Error creating workflow node: {}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiResponse::error("创建工作流节点失败".to_string())))
        }
    }
}

pub async fn update_workflow_node_handler(
    State(state): State<Arc<AppState>>,
    Path(node_id): Path<String>,
    Json(req): Json<UpdateWorkflowNodeRequest>,
) -> impl IntoResponse {
    let id = match Uuid::parse_str(&node_id) {
        Ok(uuid) => uuid,
        Err(_) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(ApiResponse::error("无效的节点ID".to_string())),
            )
        }
    };

    let approver_id = req.approver_user.and_then(|s| Uuid::parse_str(&s).ok());
    let now = Utc::now();

    match sqlx::query!(
        r#"UPDATE workflow_steps
        SET name = $1, step_number = $2, approver_id = $3, role_code = $4, timeout_days = $5, updated_at = $6
        WHERE id = $7
        RETURNING id, workflow_id, step_number, name, approver_type, approver_id, role_code, timeout_days, created_at, updated_at"#,
        req.name,
        req.node_order,
        approver_id,
        req.approver_role,
        req.timeout_days,
        now,
        id,
    )
    .fetch_one(&state.db)
    .await
    {
        Ok(r) => {
            let node = WorkflowNodeSimple {
                id: r.id.to_string(),
                workflow_id: r.workflow_id,
                name: r.name,
                node_type: "approval".to_string(),
                node_order: r.step_number,
                approver_role: r.role_code,
                approver_user: r.approver_id.map(|id| id.to_string()),
                is_multiple: None,
                min_approve: None,
                timeout_days: r.timeout_days,
                created_at: r.created_at,
                updated_at: r.updated_at,
            };
            (StatusCode::OK, Json(ApiResponse::success(node)))
        }
        Err(e) => {
            tracing::error!("Error updating workflow node: {}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiResponse::error("更新工作流节点失败".to_string())))
        }
    }
}

pub async fn delete_workflow_node_handler(
    State(state): State<Arc<AppState>>,
    Path(node_id): Path<String>,
) -> impl IntoResponse {
    let id = match Uuid::parse_str(&node_id) {
        Ok(uuid) => uuid,
        Err(_) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(ApiResponse::error("无效的节点ID".to_string())),
            )
        }
    };

    match sqlx::query!("DELETE FROM workflow_steps WHERE id = $1", id)
        .execute(&state.db)
        .await
    {
        Ok(_) => (
            StatusCode::OK,
            Json(ApiResponse::success(
                serde_json::json!({"message": "删除成功"}),
            )),
        ),
        Err(e) => {
            tracing::error!("Error deleting workflow node: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiResponse::error("删除工作流节点失败".to_string())),
            )
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateApprovalTaskRequest {
    pub workflow_code: String,
    pub title: String,
    pub description: Option<String>,
    pub data: Option<serde_json::Value>,
    pub creator_id: String,
    pub creator_name: String,
}

pub async fn create_approval_task_handler(
    State(state): State<Arc<AppState>>,
    Json(req): Json<CreateApprovalTaskRequest>,
) -> impl IntoResponse {
    let creator_id = match Uuid::parse_str(&req.creator_id) {
        Ok(uuid) => uuid,
        Err(_) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(ApiResponse::error("无效的创建者ID".to_string())),
            )
        }
    };

    let workflow = match sqlx::query!(
        r#"SELECT id, code FROM workflows WHERE code = $1 OR name = $1 LIMIT 1"#,
        req.workflow_code
    )
    .fetch_optional(&state.db)
    .await
    {
        Ok(Some(w)) => w,
        Ok(None) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(ApiResponse::error("工作流不存在".to_string())),
            )
        }
        Err(e) => {
            tracing::error!("Error finding workflow: {}", e);
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiResponse::error("查询工作流失败".to_string())),
            );
        }
    };

    let steps = match sqlx::query!(
        r#"SELECT id, step_number, approver_id, name FROM workflow_steps WHERE workflow_id = $1 ORDER BY step_number"#,
        workflow.id.to_string()
    )
    .fetch_all(&state.db)
    .await
    {
        Ok(s) => s,
        Err(e) => {
            tracing::error!("Error fetching workflow steps: {}", e);
            return (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiResponse::error("查询工作流步骤失败".to_string())));
        }
    };

    let first_approver_id = steps.first().and_then(|s| s.approver_id);
    let first_step_name = steps
        .first()
        .map(|s| s.name.clone())
        .unwrap_or_else(|| "发起".to_string());
    let max_steps = steps.len() as i32;

    let task_id = Uuid::new_v4();
    let now = Utc::now();

    match sqlx::query!(
        r#"INSERT INTO approval_tasks
        (id, workflow_id, workflow_code, title, description, status, current_step, max_steps,
         creator_id, creator_name, current_approver_id, current_approver_name, data, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, 'pending', 1, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING id, workflow_id, workflow_code, title, description, status, current_step, max_steps,
                 creator_id, creator_name, current_approver_id, current_approver_name, data, created_at, updated_at"#,
        task_id,
        workflow.id.to_string(),
        workflow.code.as_deref().unwrap_or(&req.workflow_code),
        req.title,
        req.description,
        max_steps,
        creator_id,
        req.creator_name,
        first_approver_id,
        None::<String>,
        req.data.unwrap_or(serde_json::json!({})),
        now,
        now,
    )
    .fetch_one(&state.db)
    .await
    {
        Ok(r) => {
            let task = ApprovalTask {
                task_id: r.id.to_string(),
                workflow_instance_id: r.workflow_id,
                workflow_name: r.title.clone(),
                workflow_code: r.workflow_code.clone(),
                node_id: "1".to_string(),
                node_name: first_step_name,
                applicant_id: r.creator_id.to_string(),
                applicant_name: r.creator_name,
                applicant_department: "".to_string(),
                business_type: r.workflow_code,
                business_id: r.id.to_string(),
                business_title: r.title,
                status: r.status,
                priority: "0".to_string(),
                created_at: r.created_at,
                deadline_at: None,
                is_overdue: false,
            };
            (StatusCode::CREATED, Json(ApiResponse::success(task)))
        }
        Err(e) => {
            tracing::error!("Error creating approval task: {}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiResponse::error("创建审批任务失败".to_string())))
        }
    }
}

pub async fn init_default_workflows_handler(
    State(state): State<Arc<AppState>>,
) -> impl IntoResponse {
    let now = Utc::now();
    let mut tx = match state.db.begin().await {
        Ok(tx) => tx,
        Err(e) => {
            tracing::error!("Error starting transaction: {}", e);
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiResponse::error("开始事务失败".to_string())),
            );
        }
    };

    let default_workflows = vec![
        ("leave", "请假审批流程", "员工请假审批流程"),
        ("expense", "报销审批流程", "费用报销审批流程"),
        ("purchase", "采购审批流程", "物资采购审批流程"),
        ("contract", "合同审批流程", "合同审批流程"),
    ];

    let mut created_count = 0;

    for (code, name, desc) in default_workflows {
        let existing = sqlx::query!(r#"SELECT id FROM workflows WHERE code = $1"#, code)
            .fetch_optional(&mut *tx)
            .await;

        if let Ok(None) = existing {
            let workflow_id = Uuid::new_v4();

            match sqlx::query!(
                r#"INSERT INTO workflows (id, name, code, description, is_active, is_system, created_at, updated_at)
                VALUES ($1, $2, $3, $4, true, true, $5, $6)"#,
                workflow_id,
                name,
                code,
                Some(desc),
                now,
                now,
            )
            .execute(&mut *tx)
            .await
            {
                Ok(_) => {
                    created_count += 1;

                    let steps = match code {
                        "leave" => vec![
                            (1, "部门主管审批"),
                            (2, "HR审批"),
                        ],
                        "expense" => vec![
                            (1, "部门主管审批"),
                            (2, "财务审批"),
                            (3, "总经理审批"),
                        ],
                        "purchase" => vec![
                            (1, "部门主管审批"),
                            (2, "财务审批"),
                            (3, "总经理审批"),
                        ],
                        "contract" => vec![
                            (1, "法务审批"),
                            (2, "财务审批"),
                            (3, "总经理审批"),
                        ],
                        _ => vec![(1, "审批")],
                    };

                    for (step_num, step_name) in steps {
                        let step_id = Uuid::new_v4();
                        let _ = sqlx::query!(
                            r#"INSERT INTO workflow_steps
                            (id, workflow_id, step_number, name, approver_type, timeout_days, can_skip, is_optional, created_at, updated_at)
                            VALUES ($1, $2, $3, $4, 'role', 3, false, false, $5, $6)"#,
                            step_id,
                            workflow_id.to_string(),
                            step_num,
                            step_name,
                            now,
                            now,
                        )
                        .execute(&mut *tx)
                        .await;
                    }
                }
                Err(e) => {
                    tracing::error!("Error creating workflow {}: {}", code, e);
                }
            }
        }
    }

    if let Err(e) = tx.commit().await {
        tracing::error!("Error committing transaction: {}", e);
        return (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ApiResponse::error("提交事务失败".to_string())),
        );
    }

    (
        StatusCode::OK,
        Json(ApiResponse::success(serde_json::json!({
            "message": format!("初始化完成，创建了 {} 个工作流", created_count),
            "count": created_count
        }))),
    )
}
