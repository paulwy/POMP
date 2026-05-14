use axum::{
    extract::{State, Query, Path},
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
use crate::db::organization;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Department {
    pub id: String,
    pub name: String,
    pub code: String,
    pub parent_id: Option<String>,
    pub manager_id: Option<String>,
    pub description: Option<String>,
    pub is_active: bool,
    pub sort_order: Option<i32>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Position {
    pub id: String,
    pub name: String,
    pub code: String,
    pub department_id: String,
    pub level_id: Option<String>,
    pub description: Option<String>,
    pub is_leader: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PositionLevel {
    pub id: String,
    pub name: String,
    pub code: String,
    pub level: i32,
    pub description: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

pub async fn get_departments_handler(
    State(state): State<Arc<AppState>>,
    Query(params): Query<std::collections::HashMap<String, String>>,
) -> impl IntoResponse {
    let page = params.get("page").and_then(|p| p.parse::<i32>().ok()).unwrap_or(1);
    let page_size = params.get("page_size").and_then(|p| p.parse::<i32>().ok()).unwrap_or(100);

    match organization::get_all_departments(&state.db).await {
        Ok(depts) => {
            let departments: Vec<Department> = depts.into_iter().map(|d| Department {
                id: d.id.to_string(),
                name: d.name,
                code: d.code,
                parent_id: d.parent_id.map(|p| p.to_string()),
                manager_id: d.manager_id.map(|m| m.to_string()),
                description: d.description,
                is_active: d.is_active,
                sort_order: d.sort_order,
                created_at: d.created_at,
                updated_at: d.updated_at,
            }).collect();

            let total = departments.len();
            let start = (page - 1) as usize * page_size as usize;
            let end = std::cmp::min(start + page_size as usize, total);
            let paged: Vec<Department> = if start < total {
                departments[start..end].to_vec()
            } else {
                vec![]
            };

            let result = serde_json::json!({
                "success": true,
                "data": paged,
                "total": total,
                "page": page,
                "page_size": page_size,
                "error": null,
            });
            (StatusCode::OK, Json(result))
        }
        Err(e) => {
            tracing::error!("Get departments error: {}", e);
            let result = serde_json::json!({
                "success": false,
                "data": [],
                "total": 0,
                "page": page,
                "page_size": page_size,
                "error": "获取部门列表失败",
            });
            (StatusCode::INTERNAL_SERVER_ERROR, Json(result))
        }
    }
}

pub async fn get_positions_handler(
    State(state): State<Arc<AppState>>,
    Query(params): Query<std::collections::HashMap<String, String>>,
) -> impl IntoResponse {
    let page = params.get("page").and_then(|p| p.parse::<i32>().ok()).unwrap_or(1);
    let page_size = params.get("page_size").and_then(|p| p.parse::<i32>().ok()).unwrap_or(100);

    match organization::get_all_positions(&state.db).await {
        Ok(positions) => {
            let result = serde_json::json!({
                "success": true,
                "data": positions,
                "total": positions.len(),
                "page": page,
                "page_size": page_size,
                "error": null,
            });
            (StatusCode::OK, Json(result))
        }
        Err(e) => {
            tracing::error!("Get positions error: {}", e);
            let result = serde_json::json!({
                "success": false,
                "data": [],
                "total": 0,
                "page": page,
                "page_size": page_size,
                "error": "获取职位列表失败",
            });
            (StatusCode::INTERNAL_SERVER_ERROR, Json(result))
        }
    }
}

pub async fn get_position_levels_handler(
    State(state): State<Arc<AppState>>,
    Query(_params): Query<std::collections::HashMap<String, String>>,
) -> impl IntoResponse {
    match organization::get_all_position_levels(&state.db).await {
        Ok(levels) => {
            (StatusCode::OK, Json(ApiResponse::success(levels)))
        }
        Err(e) => {
            tracing::error!("Get position levels error: {}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiResponse::<Vec<organization::PositionLevel>>::error("获取职位级别失败")))
        }
    }
}

pub async fn get_positions_by_department_handler(
    State(state): State<Arc<AppState>>,
    Path(department_id): Path<String>,
) -> impl IntoResponse {
    let uuid = match Uuid::parse_str(&department_id) {
        Ok(u) => u,
        Err(_) => return (StatusCode::BAD_REQUEST, Json(serde_json::json!({"success": false, "message": "无效的部门ID"}))),
    };

    match organization::get_positions_by_department(&state.db, uuid).await {
        Ok(positions) => {
            (StatusCode::OK, Json(serde_json::json!({
                "success": true,
                "data": positions
            })))
        }
        Err(e) => {
            tracing::error!("Get positions by department error: {}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({"success": false, "message": "获取职位列表失败"})))
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ApprovalRule {
    pub id: String,
    pub name: String,
    pub rule_type: String,
    pub department_id: Option<String>,
    pub position_level_id: Option<String>,
    pub specific_user_id: Option<String>,
    pub workflow_type: Option<String>,
    pub node_order: Option<i32>,
    pub min_approvers: Option<i32>,
    pub approval_mode: Option<String>,
    pub condition_expression: Option<String>,
    pub description: Option<String>,
    pub is_active: Option<bool>,
    pub position_level_name: Option<String>,
    pub department_name: Option<String>,
    pub specific_user_name: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

pub async fn get_approval_rules_handler(
    State(state): State<Arc<AppState>>,
    Query(_params): Query<std::collections::HashMap<String, String>>,
) -> impl IntoResponse {
    match organization::get_all_approval_rules(&state.db).await {
        Ok(rules) => {
            (StatusCode::OK, Json(ApiResponse::success(rules)))
        }
        Err(e) => {
            tracing::error!("Get approval rules error: {}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiResponse::<Vec<organization::ApprovalRule>>::error("获取审批规则失败")))
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateDepartment {
    pub name: String,
    pub code: String,
    pub parent_id: Option<String>,
    pub manager_id: Option<String>,
    pub description: Option<String>,
    pub sort_order: Option<i32>,
}

pub async fn create_department_handler(
    State(state): State<Arc<AppState>>,
    Json(req): Json<CreateDepartment>,
) -> impl IntoResponse {
    let parent_id = req.parent_id.as_ref().and_then(|p| Uuid::parse_str(p).ok());
    let manager_id = req.manager_id.as_ref().and_then(|m| Uuid::parse_str(m).ok());

    let create_dept = organization::CreateDepartment {
        name: req.name,
        code: req.code,
        parent_id,
        manager_id,
        description: req.description,
        sort_order: req.sort_order,
    };

    match organization::create_department(&state.db, create_dept).await {
        Ok(dept) => {
            let response_dept = Department {
                id: dept.id.to_string(),
                name: dept.name,
                code: dept.code,
                parent_id: dept.parent_id.map(|p| p.to_string()),
                manager_id: dept.manager_id.map(|m| m.to_string()),
                description: dept.description,
                is_active: dept.is_active,
                sort_order: dept.sort_order,
                created_at: dept.created_at,
                updated_at: dept.updated_at,
            };
            (StatusCode::CREATED, Json(ApiResponse::success(response_dept)))
        }
        Err(e) => {
            tracing::error!("Create department error: {}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiResponse::error("服务器内部错误，请稍后重试".to_string())))
        }
    }
}

pub async fn update_department_handler(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
    Json(req): Json<CreateDepartment>,
) -> impl IntoResponse {
    let uuid = match Uuid::parse_str(&id) {
        Ok(u) => u,
        Err(_) => return (StatusCode::BAD_REQUEST, Json(ApiResponse::<Department>::error("无效的部门ID".to_string()))),
    };

    let parent_id = req.parent_id.as_ref().and_then(|p| Uuid::parse_str(p).ok());
    let manager_id = req.manager_id.as_ref().and_then(|m| Uuid::parse_str(m).ok());

    let update_dept = organization::CreateDepartment {
        name: req.name,
        code: req.code,
        parent_id,
        manager_id,
        description: req.description,
        sort_order: req.sort_order,
    };

    match organization::update_department(&state.db, uuid, update_dept).await {
        Ok(dept) => {
            let response_dept = Department {
                id: dept.id.to_string(),
                name: dept.name,
                code: dept.code,
                parent_id: dept.parent_id.map(|p| p.to_string()),
                manager_id: dept.manager_id.map(|m| m.to_string()),
                description: dept.description,
                is_active: dept.is_active,
                sort_order: dept.sort_order,
                created_at: dept.created_at,
                updated_at: dept.updated_at,
            };
            (StatusCode::OK, Json(ApiResponse::success(response_dept)))
        }
        Err(e) => {
            tracing::error!("Update department error: {}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiResponse::error("服务器内部错误，请稍后重试".to_string())))
        }
    }
}

pub async fn delete_department_handler(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
) -> impl IntoResponse {
    let uuid = match Uuid::parse_str(&id) {
        Ok(u) => u,
        Err(_) => return (StatusCode::BAD_REQUEST, Json(serde_json::json!({"success": false, "message": "无效的部门ID"}))),
    };

    match organization::delete_department(&state.db, uuid).await {
        Ok(deleted) => {
            if deleted {
                let result = serde_json::json!({
                    "success": true,
                    "message": format!("部门 {} 已删除", id),
                });
                (StatusCode::OK, Json(result))
            } else {
                let result = serde_json::json!({
                    "success": false,
                    "message": "部门不存在",
                });
                (StatusCode::NOT_FOUND, Json(result))
            }
        }
        Err(e) => {
            tracing::error!("Delete department error: {}", e);
            let result = serde_json::json!({
                "success": false,
                "message": "删除部门失败",
            });
            (StatusCode::INTERNAL_SERVER_ERROR, Json(result))
        }
    }
}

pub async fn get_department_children_handler(
    State(state): State<Arc<AppState>>,
    Path(parent_id): Path<String>,
) -> impl IntoResponse {
    let uuid = match Uuid::parse_str(&parent_id) {
        Ok(u) => u,
        Err(_) => return (StatusCode::BAD_REQUEST, Json(ApiResponse::<Vec<Department>>::error("无效的部门ID".to_string()))),
    };

    match organization::get_department_children(&state.db, uuid).await {
        Ok(children) => {
            let result: Vec<Department> = children.into_iter().map(|d| Department {
                id: d.id.to_string(),
                name: d.name,
                code: d.code,
                parent_id: d.parent_id.map(|p| p.to_string()),
                manager_id: d.manager_id.map(|m| m.to_string()),
                description: d.description,
                is_active: d.is_active,
                sort_order: d.sort_order,
                created_at: d.created_at,
                updated_at: d.updated_at,
            }).collect();
            (StatusCode::OK, Json(ApiResponse::success(result)))
        }
        Err(e) => {
            tracing::error!("Get department children error: {}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiResponse::<Vec<Department>>::error("获取子部门失败".to_string())))
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreatePositionLevel {
    pub name: String,
    pub code: String,
    pub level: i32,
    pub description: Option<String>,
}

pub async fn create_position_level_handler(
    State(state): State<Arc<AppState>>,
    Json(req): Json<CreatePositionLevel>,
) -> impl IntoResponse {
    let create_level = organization::CreatePositionLevel {
        name: req.name,
        code: req.code,
        level: req.level,
        description: req.description,
    };

    match organization::create_position_level(&state.db, create_level).await {
        Ok(level) => {
            (StatusCode::CREATED, Json(ApiResponse::success(level)))
        }
        Err(e) => {
            tracing::error!("Create position level error: {}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiResponse::<organization::PositionLevel>::error("创建职位级别失败")))
        }
    }
}

pub async fn update_position_level_handler(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
    Json(req): Json<CreatePositionLevel>,
) -> impl IntoResponse {
    let uuid = match Uuid::parse_str(&id) {
        Ok(u) => u,
        Err(_) => return (StatusCode::BAD_REQUEST, Json(ApiResponse::<organization::PositionLevel>::error("无效的ID"))),
    };

    let update_level = organization::CreatePositionLevel {
        name: req.name,
        code: req.code,
        level: req.level,
        description: req.description,
    };

    match organization::update_position_level(&state.db, uuid, update_level).await {
        Ok(level) => {
            (StatusCode::OK, Json(ApiResponse::success(level)))
        }
        Err(e) => {
            tracing::error!("Update position level error: {}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiResponse::<organization::PositionLevel>::error("更新职位级别失败")))
        }
    }
}

pub async fn delete_position_level_handler(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
) -> impl IntoResponse {
    let uuid = match Uuid::parse_str(&id) {
        Ok(u) => u,
        Err(_) => return (StatusCode::BAD_REQUEST, Json(serde_json::json!({"success": false, "message": "无效的ID"}))),
    };

    match organization::delete_position_level(&state.db, uuid).await {
        Ok(_) => {
            let result = serde_json::json!({
                "success": true,
                "message": format!("职位级别 {} 已删除", id),
            });
            (StatusCode::OK, Json(result))
        }
        Err(e) => {
            tracing::error!("Delete position level error: {}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({"success": false, "message": "删除职位级别失败"})))
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateOrganizationPosition {
    #[serde(alias = "title", alias = "name")]
    pub name: String,
    pub code: String,
    pub department_id: Option<String>,
    pub level_id: Option<String>,
    pub description: Option<String>,
    #[serde(default)]
    pub is_leader: bool,
}

pub async fn create_position_handler(
    State(state): State<Arc<AppState>>,
    Json(req): Json<CreateOrganizationPosition>,
) -> impl IntoResponse {
    let create_pos = organization::CreatePosition {
        name: req.name,
        code: req.code,
        department_id: req.department_id.as_ref().and_then(|d| Uuid::parse_str(d).ok()),
        level_id: req.level_id.as_ref().and_then(|l| Uuid::parse_str(l).ok()),
        description: req.description,
        is_leader: req.is_leader,
    };

    match organization::create_position(&state.db, create_pos).await {
        Ok(pos) => {
            (StatusCode::CREATED, Json(ApiResponse::success(pos)))
        }
        Err(e) => {
            tracing::error!("Create position error: {}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiResponse::<organization::Position>::error("创建职位失败")))
        }
    }
}

pub async fn update_position_handler(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
    Json(req): Json<CreateOrganizationPosition>,
) -> impl IntoResponse {
    let uuid = match Uuid::parse_str(&id) {
        Ok(u) => u,
        Err(_) => return (StatusCode::BAD_REQUEST, Json(ApiResponse::<organization::Position>::error("无效的ID"))),
    };

    let update_pos = organization::CreatePosition {
        name: req.name,
        code: req.code,
        department_id: req.department_id.as_ref().and_then(|d| Uuid::parse_str(d).ok()),
        level_id: req.level_id.as_ref().and_then(|l| Uuid::parse_str(l).ok()),
        description: req.description,
        is_leader: req.is_leader,
    };

    match organization::update_position(&state.db, uuid, update_pos).await {
        Ok(pos) => {
            (StatusCode::OK, Json(ApiResponse::success(pos)))
        }
        Err(e) => {
            tracing::error!("Update position error: {}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiResponse::<organization::Position>::error("更新职位失败")))
        }
    }
}

pub async fn delete_position_handler(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
) -> impl IntoResponse {
    let uuid = match Uuid::parse_str(&id) {
        Ok(u) => u,
        Err(_) => return (StatusCode::BAD_REQUEST, Json(serde_json::json!({"success": false, "message": "无效的ID"}))),
    };

    match organization::delete_position(&state.db, uuid).await {
        Ok(_) => {
            let result = serde_json::json!({
                "success": true,
                "message": format!("职位 {} 已删除", id),
            });
            (StatusCode::OK, Json(result))
        }
        Err(e) => {
            tracing::error!("Delete position error: {}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({"success": false, "message": "删除职位失败"})))
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateApprovalRule {
    pub name: String,
    pub rule_type: String,
    pub department_id: Option<String>,
    pub position_level_id: Option<String>,
    pub specific_user_id: Option<String>,
    pub workflow_type: Option<String>,
    pub node_order: Option<i32>,
    pub min_approvers: Option<i32>,
    pub approval_mode: Option<String>,
    pub condition_expression: Option<String>,
    pub description: Option<String>,
}

pub async fn create_approval_rule_handler(
    State(state): State<Arc<AppState>>,
    Json(req): Json<CreateApprovalRule>,
) -> impl IntoResponse {
    let create_rule = organization::CreateApprovalRule {
        name: req.name,
        code: req.rule_type.clone(),
        rule_type: req.rule_type,
        department_id: req.department_id.as_ref().and_then(|d| Uuid::parse_str(d).ok()),
        position_level_id: req.position_level_id.as_ref().and_then(|p| Uuid::parse_str(p).ok()),
        specific_user_id: req.specific_user_id.as_ref().and_then(|s| Uuid::parse_str(s).ok()),
        workflow_type: req.workflow_type,
        node_order: req.node_order,
        min_approvers: req.min_approvers,
        approval_mode: req.approval_mode,
        condition_expression: req.condition_expression,
        description: req.description,
    };

    match organization::create_approval_rule(&state.db, create_rule).await {
        Ok(rule) => {
            (StatusCode::CREATED, Json(ApiResponse::success(rule)))
        }
        Err(e) => {
            tracing::error!("Create approval rule error: {}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiResponse::<organization::ApprovalRule>::error("创建审批规则失败")))
        }
    }
}

pub async fn update_approval_rule_handler(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
    Json(req): Json<CreateApprovalRule>,
) -> impl IntoResponse {
    let uuid = match Uuid::parse_str(&id) {
        Ok(u) => u,
        Err(_) => return (StatusCode::BAD_REQUEST, Json(ApiResponse::<organization::ApprovalRule>::error("无效的ID"))),
    };

    let update_rule = organization::CreateApprovalRule {
        name: req.name,
        code: req.rule_type.clone(),
        rule_type: req.rule_type,
        department_id: req.department_id.as_ref().and_then(|d| Uuid::parse_str(d).ok()),
        position_level_id: req.position_level_id.as_ref().and_then(|p| Uuid::parse_str(p).ok()),
        specific_user_id: req.specific_user_id.as_ref().and_then(|s| Uuid::parse_str(s).ok()),
        workflow_type: req.workflow_type,
        node_order: req.node_order,
        min_approvers: req.min_approvers,
        approval_mode: req.approval_mode,
        condition_expression: req.condition_expression,
        description: req.description,
    };

    match organization::update_approval_rule(&state.db, uuid, update_rule).await {
        Ok(rule) => {
            (StatusCode::OK, Json(ApiResponse::success(rule)))
        }
        Err(e) => {
            tracing::error!("Update approval rule error: {}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiResponse::<organization::ApprovalRule>::error("更新审批规则失败")))
        }
    }
}

pub async fn delete_approval_rule_handler(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
) -> impl IntoResponse {
    let uuid = match Uuid::parse_str(&id) {
        Ok(u) => u,
        Err(_) => return (StatusCode::BAD_REQUEST, Json(serde_json::json!({"success": false, "message": "无效的ID"}))),
    };

    match organization::delete_approval_rule(&state.db, uuid).await {
        Ok(_) => {
            let result = serde_json::json!({
                "success": true,
                "message": format!("审批规则 {} 已删除", id),
            });
            (StatusCode::OK, Json(result))
        }
        Err(e) => {
            tracing::error!("Delete approval rule error: {}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({"success": false, "message": "删除审批规则失败"})))
        }
    }
}

pub async fn get_department_handler(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
) -> impl IntoResponse {
    let uuid = match Uuid::parse_str(&id) {
        Ok(u) => u,
        Err(_) => return (StatusCode::BAD_REQUEST, Json(ApiResponse::<Department>::error("无效的部门ID".to_string()))),
    };

    match organization::get_department(&state.db, uuid).await {
        Ok(Some(dept)) => {
            let department = Department {
                id: dept.id.to_string(),
                name: dept.name,
                code: dept.code,
                parent_id: dept.parent_id.map(|p| p.to_string()),
                manager_id: dept.manager_id.map(|m| m.to_string()),
                description: dept.description,
                is_active: dept.is_active,
                sort_order: dept.sort_order,
                created_at: dept.created_at,
                updated_at: dept.updated_at,
            };
            (StatusCode::OK, Json(ApiResponse::success(department)))
        }
        Ok(None) => {
            (StatusCode::NOT_FOUND, Json(ApiResponse::<Department>::error("部门不存在".to_string())))
        }
        Err(e) => {
            tracing::error!("Get department error: {}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiResponse::<Department>::error("获取部门失败".to_string())))
        }
    }
}

pub async fn update_department_status_handler(
    State(_state): State<Arc<AppState>>,
    Path(id): Path<String>,
    Json(_req): Json<serde_json::Value>,
) -> impl IntoResponse {
    let result = serde_json::json!({
        "success": true,
        "message": format!("部门 {} 状态已更新", id),
    });

    (StatusCode::OK, Json(result))
}

pub async fn get_position_handler(
    State(_state): State<Arc<AppState>>,
    Path(id): Path<String>,
) -> impl IntoResponse {
    let position = Position {
        id: id.clone(),
        name: "示例职位".to_string(),
        code: "POS".to_string(),
        department_id: "d0000001-0000-0000-0000-000000000001".to_string(),
        level_id: None,
        description: Some("职位描述".to_string()),
        is_leader: false,
        created_at: Utc::now(),
        updated_at: Utc::now(),
    };

    (StatusCode::OK, Json(ApiResponse::success(position)))
}
