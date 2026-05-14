use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::IntoResponse,
    Json,
};
use chrono::DateTime;
use serde::Deserialize;
use sqlx::types::Uuid;
use std::sync::Arc;

use crate::db::workflow_engine::{
    AdjustApproverRequest, AdjustTimeoutRequest, ApproveRequest, CreateTaskRequest,
    CreateTemplateRequest, CreateWorkflowRequest, TaskWithRecords, UpdateWorkflowRequest,
};
use crate::db::workflow_engine_repo;
use crate::errors::ApiResponse;
use crate::state::AppState;

#[derive(Debug, Deserialize)]
pub struct PaginationParams {
    pub page: Option<i64>,
    pub page_size: Option<i64>,
}

// ==================== 工作流管理 API ====================

pub async fn get_workflows_handler(State(state): State<Arc<AppState>>) -> impl IntoResponse {
    match workflow_engine_repo::get_all_workflows(&state.db).await {
        Ok(workflows) => (StatusCode::OK, Json(ApiResponse::success(workflows))),
        Err(e) => {
            tracing::error!("Get workflows error: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiResponse::error("获取工作流列表失败".to_string())),
            )
        }
    }
}

pub async fn get_system_workflows_handler(State(state): State<Arc<AppState>>) -> impl IntoResponse {
    match workflow_engine_repo::get_system_workflows(&state.db).await {
        Ok(workflows) => (StatusCode::OK, Json(ApiResponse::success(workflows))),
        Err(e) => {
            tracing::error!("Get system workflows error: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiResponse::error("获取系统工作流失败".to_string())),
            )
        }
    }
}

pub async fn get_custom_workflows_handler(State(state): State<Arc<AppState>>) -> impl IntoResponse {
    match workflow_engine_repo::get_custom_workflows(&state.db).await {
        Ok(workflows) => (StatusCode::OK, Json(ApiResponse::success(workflows))),
        Err(e) => {
            tracing::error!("Get custom workflows error: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiResponse::error("获取自定义工作流失败".to_string())),
            )
        }
    }
}

pub async fn get_workflow_handler(
    State(state): State<Arc<AppState>>,
    Path(workflow_id): Path<String>,
) -> impl IntoResponse {
    match workflow_engine_repo::get_workflow_by_id(&state.db, &workflow_id).await {
        Ok(workflow) => {
            let steps = workflow_engine_repo::get_workflow_steps(&state.db, &workflow_id)
                .await
                .unwrap_or_default();
            let result = serde_json::json!({
                "workflow": workflow,
                "steps": steps
            });
            (StatusCode::OK, Json(ApiResponse::success(result)))
        }
        Err(e) => {
            tracing::error!("Get workflow error: {}", e);
            (
                StatusCode::NOT_FOUND,
                Json(ApiResponse::error("工作流不存在".to_string())),
            )
        }
    }
}

pub async fn create_workflow_handler(
    State(state): State<Arc<AppState>>,
    Json(req): Json<CreateWorkflowRequest>,
) -> impl IntoResponse {
    if req.name.trim().is_empty() || req.code.trim().is_empty() {
        return (
            StatusCode::BAD_REQUEST,
            Json(ApiResponse::error("工作流名称和编码不能为空".to_string())),
        );
    }

    if req.steps.is_empty() {
        return (
            StatusCode::BAD_REQUEST,
            Json(ApiResponse::error("工作流至少需要一个步骤".to_string())),
        );
    }

    if workflow_engine_repo::get_workflow_by_code(&state.db, &req.code)
        .await
        .is_ok()
    {
        return (
            StatusCode::BAD_REQUEST,
            Json(ApiResponse::error("工作流编码已存在".to_string())),
        );
    }

    match workflow_engine_repo::create_workflow(&state.db, req).await {
        Ok(workflow) => (StatusCode::CREATED, Json(ApiResponse::success(workflow))),
        Err(e) => {
            tracing::error!("Create workflow error: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiResponse::error("创建工作流失败".to_string())),
            )
        }
    }
}

pub async fn update_workflow_handler(
    State(state): State<Arc<AppState>>,
    Path(workflow_id): Path<String>,
    Json(req): Json<UpdateWorkflowRequest>,
) -> impl IntoResponse {
    let id = match Uuid::parse_str(&workflow_id) {
        Ok(id) => id,
        Err(_) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(ApiResponse::error("无效的工作流ID".to_string())),
            )
        }
    };

    match workflow_engine_repo::update_workflow(&state.db, id, req).await {
        Ok(workflow) => (StatusCode::OK, Json(ApiResponse::success(workflow))),
        Err(e) => {
            tracing::error!("Update workflow error: {}", e);
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
    let workflow = match workflow_engine_repo::get_workflow_by_id(&state.db, &workflow_id).await {
        Ok(w) => w,
        Err(_) => {
            return (
                StatusCode::NOT_FOUND,
                Json(ApiResponse::error("工作流不存在".to_string())),
            )
        }
    };

    if workflow.is_system {
        return (
            StatusCode::FORBIDDEN,
            Json(ApiResponse::error("系统工作流不能删除".to_string())),
        );
    }

    match workflow_engine_repo::delete_workflow(&state.db, &workflow_id).await {
        Ok(_) => (
            StatusCode::OK,
            Json(ApiResponse::success(
                serde_json::json!({"message": "工作流删除成功"}),
            )),
        ),
        Err(e) => {
            tracing::error!("Delete workflow error: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiResponse::error("删除工作流失败".to_string())),
            )
        }
    }
}

// ==================== 工作流步骤管理 API ====================

pub async fn get_workflow_steps_handler(
    State(state): State<Arc<AppState>>,
    Path(workflow_id): Path<String>,
) -> impl IntoResponse {
    match workflow_engine_repo::get_workflow_steps(&state.db, &workflow_id).await {
        Ok(steps) => (StatusCode::OK, Json(ApiResponse::success(steps))),
        Err(e) => {
            tracing::error!("Get workflow steps error: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiResponse::error("获取工作流步骤失败".to_string())),
            )
        }
    }
}

pub async fn adjust_approver_handler(
    State(state): State<Arc<AppState>>,
    Json(req): Json<AdjustApproverRequest>,
) -> impl IntoResponse {
    if req.clear_customization {
        match workflow_engine_repo::reset_step_config(&state.db, req.step_id).await {
            Ok(_) => (
                StatusCode::OK,
                Json(ApiResponse::success(
                    serde_json::json!({"message": "审批人配置已恢复默认"}),
                )),
            ),
            Err(e) => {
                tracing::error!("Reset step config error: {}", e);
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(ApiResponse::error("恢复配置失败".to_string())),
                )
            }
        }
    } else {
        match workflow_engine_repo::update_step_approver(
            &state.db,
            req.step_id,
            req.approver_id,
            req.role_code,
            req.department_id,
        )
        .await
        {
            Ok(_) => (
                StatusCode::OK,
                Json(ApiResponse::success(
                    serde_json::json!({"message": "审批人调整成功"}),
                )),
            ),
            Err(e) => {
                tracing::error!("Update step approver error: {}", e);
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(ApiResponse::error("调整审批人失败".to_string())),
                )
            }
        }
    }
}

pub async fn adjust_timeout_handler(
    State(state): State<Arc<AppState>>,
    Json(req): Json<AdjustTimeoutRequest>,
) -> impl IntoResponse {
    let deadline = req.deadline_at.map(|d| {
        DateTime::parse_from_rfc3339(&d)
            .unwrap()
            .with_timezone(&chrono::Utc)
    });

    match workflow_engine_repo::update_step_timeout(
        &state.db,
        req.step_id,
        req.timeout_days,
        deadline,
    )
    .await
    {
        Ok(_) => (
            StatusCode::OK,
            Json(ApiResponse::success(
                serde_json::json!({"message": "超时设置调整成功"}),
            )),
        ),
        Err(e) => {
            tracing::error!("Update step timeout error: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiResponse::error("调整超时设置失败".to_string())),
            )
        }
    }
}

// ==================== 审批任务 API ====================

pub async fn create_task_handler(
    State(state): State<Arc<AppState>>,
    Json(req): Json<CreateTaskRequest>,
) -> impl IntoResponse {
    let workflow =
        match workflow_engine_repo::get_workflow_by_code(&state.db, &req.workflow_code).await {
            Ok(w) => w,
            Err(_) => {
                return (
                    StatusCode::BAD_REQUEST,
                    Json(ApiResponse::error("工作流不存在".to_string())),
                )
            }
        };

    let steps = workflow_engine_repo::get_workflow_steps(&state.db, &workflow.id)
        .await
        .unwrap_or_default();
    let max_steps = steps.len() as i32;

    if steps.is_empty() {
        return (
            StatusCode::BAD_REQUEST,
            Json(ApiResponse::error("工作流没有配置步骤".to_string())),
        );
    }

    let first_step = steps.first().unwrap();

    let creator_id = Uuid::new_v4();
    let creator_name = "系统用户".to_string();
    let current_approver_id = first_step.approver_id;
    let current_approver_name = None;

    match workflow_engine_repo::create_task(
        &state.db,
        &workflow.id,
        workflow.code.as_deref().unwrap_or(""),
        &req.title,
        req.description,
        creator_id,
        &creator_name,
        current_approver_id,
        current_approver_name,
        req.data,
        max_steps,
    )
    .await
    {
        Ok(task) => (StatusCode::CREATED, Json(ApiResponse::success(task))),
        Err(e) => {
            tracing::error!("Create task error: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiResponse::error("创建审批任务失败".to_string())),
            )
        }
    }
}

pub async fn get_task_handler(
    State(state): State<Arc<AppState>>,
    Path(task_id): Path<String>,
) -> impl IntoResponse {
    let id = match Uuid::parse_str(&task_id) {
        Ok(id) => id,
        Err(_) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(ApiResponse::error("无效的任务ID".to_string())),
            )
        }
    };

    match workflow_engine_repo::get_task_by_id(&state.db, id).await {
        Ok(task) => {
            let records = workflow_engine_repo::get_task_records(&state.db, id)
                .await
                .unwrap_or_default();
            let result = TaskWithRecords { task, records };
            (StatusCode::OK, Json(ApiResponse::success(result)))
        }
        Err(e) => {
            tracing::error!("Get task error: {}", e);
            (
                StatusCode::NOT_FOUND,
                Json(ApiResponse::error("任务不存在".to_string())),
            )
        }
    }
}

pub async fn get_my_tasks_handler(
    State(state): State<Arc<AppState>>,
    Path(user_id): Path<String>,
) -> impl IntoResponse {
    let id = match Uuid::parse_str(&user_id) {
        Ok(id) => id,
        Err(_) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(ApiResponse::error("无效的用户ID".to_string())),
            )
        }
    };

    match workflow_engine_repo::get_tasks_by_approver(&state.db, id).await {
        Ok(tasks) => (StatusCode::OK, Json(ApiResponse::success(tasks))),
        Err(e) => {
            tracing::error!("Get my tasks error: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiResponse::error("获取我的审批任务失败".to_string())),
            )
        }
    }
}

pub async fn get_created_tasks_handler(
    State(state): State<Arc<AppState>>,
    Path(user_id): Path<String>,
) -> impl IntoResponse {
    let id = match Uuid::parse_str(&user_id) {
        Ok(id) => id,
        Err(_) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(ApiResponse::error("无效的用户ID".to_string())),
            )
        }
    };

    match workflow_engine_repo::get_tasks_by_creator(&state.db, id).await {
        Ok(tasks) => (StatusCode::OK, Json(ApiResponse::success(tasks))),
        Err(e) => {
            tracing::error!("Get created tasks error: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiResponse::error("获取我发起的任务失败".to_string())),
            )
        }
    }
}

pub async fn get_all_tasks_handler(State(state): State<Arc<AppState>>) -> impl IntoResponse {
    match workflow_engine_repo::get_all_tasks(&state.db).await {
        Ok(tasks) => (StatusCode::OK, Json(ApiResponse::success(tasks))),
        Err(e) => {
            tracing::error!("Get all tasks error: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiResponse::error("获取审批任务失败".to_string())),
            )
        }
    }
}

pub async fn approve_task_handler(
    State(state): State<Arc<AppState>>,
    Path(task_id): Path<String>,
    Json(req): Json<ApproveRequest>,
) -> impl IntoResponse {
    let id = match Uuid::parse_str(&task_id) {
        Ok(id) => id,
        Err(_) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(ApiResponse::error("无效的任务ID".to_string())),
            )
        }
    };

    let approver_id = Uuid::new_v4();
    let approver_name = "审批用户".to_string();

    match workflow_engine_repo::approve_task(
        &state.db,
        id,
        req.comment,
        approver_id,
        &approver_name,
    )
    .await
    {
        Ok(task) => (StatusCode::OK, Json(ApiResponse::success(task))),
        Err(e) => {
            tracing::error!("Approve task error: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiResponse::error("审批失败".to_string())),
            )
        }
    }
}

pub async fn reject_task_handler(
    State(state): State<Arc<AppState>>,
    Path(task_id): Path<String>,
    Json(req): Json<ApproveRequest>,
) -> impl IntoResponse {
    let id = match Uuid::parse_str(&task_id) {
        Ok(id) => id,
        Err(_) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(ApiResponse::error("无效的任务ID".to_string())),
            )
        }
    };

    let approver_id = Uuid::new_v4();
    let approver_name = "审批用户".to_string();

    match workflow_engine_repo::reject_task(&state.db, id, req.comment, approver_id, &approver_name)
        .await
    {
        Ok(task) => (StatusCode::OK, Json(ApiResponse::success(task))),
        Err(e) => {
            tracing::error!("Reject task error: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiResponse::error("拒绝失败".to_string())),
            )
        }
    }
}

// ==================== 审批模板 API ====================

pub async fn get_templates_handler(State(state): State<Arc<AppState>>) -> impl IntoResponse {
    match workflow_engine_repo::get_all_templates(&state.db).await {
        Ok(templates) => (StatusCode::OK, Json(ApiResponse::success(templates))),
        Err(e) => {
            tracing::error!("Get templates error: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiResponse::error("获取审批模板失败".to_string())),
            )
        }
    }
}

pub async fn create_template_handler(
    State(state): State<Arc<AppState>>,
    Json(req): Json<CreateTemplateRequest>,
) -> impl IntoResponse {
    if req.name.trim().is_empty()
        || req.workflow_code.trim().is_empty()
        || req.title_template.trim().is_empty()
    {
        return (
            StatusCode::BAD_REQUEST,
            Json(ApiResponse::error(
                "模板名称、工作流编码和标题模板不能为空".to_string(),
            )),
        );
    }

    let default_data = req.default_data.unwrap_or(serde_json::json!({}));

    match workflow_engine_repo::create_template(
        &state.db,
        &req.name,
        &req.workflow_code,
        &req.title_template,
        req.description_template,
        default_data,
    )
    .await
    {
        Ok(template) => (StatusCode::CREATED, Json(ApiResponse::success(template))),
        Err(e) => {
            tracing::error!("Create template error: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiResponse::error("创建审批模板失败".to_string())),
            )
        }
    }
}

pub async fn delete_template_handler(
    State(state): State<Arc<AppState>>,
    Path(template_id): Path<String>,
) -> impl IntoResponse {
    let id = match Uuid::parse_str(&template_id) {
        Ok(id) => id,
        Err(_) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(ApiResponse::error("无效的模板ID".to_string())),
            )
        }
    };

    match workflow_engine_repo::delete_template(&state.db, id).await {
        Ok(_) => (
            StatusCode::OK,
            Json(ApiResponse::success(
                serde_json::json!({"message": "模板删除成功"}),
            )),
        ),
        Err(e) => {
            tracing::error!("Delete template error: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiResponse::error("删除模板失败".to_string())),
            )
        }
    }
}

pub async fn apply_template_handler(
    State(state): State<Arc<AppState>>,
    Path(template_id): Path<String>,
    Json(req): Json<serde_json::Value>,
) -> impl IntoResponse {
    let id = match Uuid::parse_str(&template_id) {
        Ok(id) => id,
        Err(_) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(ApiResponse::error("无效的模板ID".to_string())),
            )
        }
    };

    let template = match workflow_engine_repo::get_template_by_id(&state.db, id).await {
        Ok(t) => t,
        Err(_) => {
            return (
                StatusCode::NOT_FOUND,
                Json(ApiResponse::error("模板不存在".to_string())),
            )
        }
    };

    let workflow = match workflow_engine_repo::get_workflow_by_code(
        &state.db,
        &template.workflow_code,
    )
    .await
    {
        Ok(w) => w,
        Err(_) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(ApiResponse::error("关联的工作流不存在".to_string())),
            )
        }
    };

    let steps = workflow_engine_repo::get_workflow_steps(&state.db, &workflow.id)
        .await
        .unwrap_or_default();
    let max_steps = steps.len() as i32;

    let mut title = template.title_template.clone();
    for (key, value) in req.as_object().unwrap_or(&serde_json::Map::new()) {
        title = title.replace(&format!("{{{{{}}}}}", key), &value.to_string());
    }

    let creator_id = Uuid::new_v4();
    let creator_name = "系统用户".to_string();
    let current_approver_id = steps.first().and_then(|s| s.approver_id);
    let current_approver_name = None;

    match workflow_engine_repo::create_task(
        &state.db,
        &workflow.id,
        workflow.code.as_deref().unwrap_or(""),
        &title,
        None,
        creator_id,
        &creator_name,
        current_approver_id,
        current_approver_name,
        req,
        max_steps,
    )
    .await
    {
        Ok(task) => (StatusCode::CREATED, Json(ApiResponse::success(task))),
        Err(e) => {
            tracing::error!("Apply template error: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiResponse::error("应用模板失败".to_string())),
            )
        }
    }
}
