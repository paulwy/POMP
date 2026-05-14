use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    response::IntoResponse,
    Json,
};
use serde::{Deserialize, Serialize};
use sqlx::types::Uuid;
use std::sync::Arc;

use crate::db::role::{CreateRole, Role, UpdateRole};
use crate::db::role_repo;
use crate::errors::ApiResponse;
use crate::state::AppState;

#[derive(Debug, Deserialize)]
pub struct PaginationParams {
    pub page: Option<i64>,
    pub page_size: Option<i64>,
}

#[derive(Debug, Deserialize)]
pub struct AssignPermissionsRequest {
    pub permission_ids: Vec<Uuid>,
}

#[derive(Debug, Serialize)]
pub struct RoleListResponse {
    pub data: Vec<Role>,
    pub total: i64,
    pub page: i64,
    pub page_size: i64,
}

pub async fn get_roles_handler(
    State(state): State<Arc<AppState>>,
    Query(params): Query<PaginationParams>,
) -> impl IntoResponse {
    let page = params.page.unwrap_or(1).max(1);
    let page_size = params.page_size.unwrap_or(10).min(100);

    match role_repo::get_all_roles(&state.db).await {
        Ok(roles) => {
            let total = roles.len() as i64;
            let start = ((page - 1) * page_size) as usize;
            let end = (start + page_size as usize).min(roles.len());
            let paginated_roles = if start < roles.len() {
                &roles[start..end]
            } else {
                &[]
            };

            (
                StatusCode::OK,
                Json(ApiResponse::success(RoleListResponse {
                    data: paginated_roles.to_vec(),
                    total,
                    page,
                    page_size,
                })),
            )
        }
        Err(e) => {
            tracing::error!("Get roles error: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiResponse::error("获取角色列表失败".to_string())),
            )
        }
    }
}

pub async fn get_active_roles_handler(State(state): State<Arc<AppState>>) -> impl IntoResponse {
    match role_repo::get_active_roles(&state.db).await {
        Ok(roles) => (StatusCode::OK, Json(ApiResponse::success(roles))),
        Err(e) => {
            tracing::error!("Get active roles error: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiResponse::error("获取角色列表失败".to_string())),
            )
        }
    }
}

pub async fn get_role_handler(
    State(state): State<Arc<AppState>>,
    Path(role_id): Path<String>,
) -> impl IntoResponse {
    let role_uuid = match Uuid::parse_str(&role_id) {
        Ok(id) => id,
        Err(_) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(ApiResponse::error("无效的角色ID".to_string())),
            )
        }
    };

    match role_repo::get_role_by_id(&state.db, role_uuid).await {
        Ok(role) => (StatusCode::OK, Json(ApiResponse::success(role))),
        Err(e) => {
            tracing::error!("Get role error: {}", e);
            (
                StatusCode::NOT_FOUND,
                Json(ApiResponse::error("角色不存在".to_string())),
            )
        }
    }
}

#[derive(Debug, Deserialize)]
pub struct CreateRoleRequest {
    pub name: String,
    pub code: String,
    pub description: Option<String>,
}

pub async fn create_role_handler(
    State(state): State<Arc<AppState>>,
    Json(req): Json<CreateRoleRequest>,
) -> impl IntoResponse {
    if req.name.trim().is_empty() || req.code.trim().is_empty() {
        return (
            StatusCode::BAD_REQUEST,
            Json(ApiResponse::error("角色名称和代码不能为空".to_string())),
        );
    }

    if let Ok(Some(_)) = role_repo::get_role_by_code(&state.db, &req.code).await {
        return (
            StatusCode::BAD_REQUEST,
            Json(ApiResponse::error("角色代码已存在".to_string())),
        );
    }

    let role = CreateRole {
        name: req.name.trim().to_string(),
        code: req.code.trim().to_lowercase(),
        description: req.description,
        is_active: Some(true),
        is_system: Some(false),
    };

    match role_repo::create_role(&state.db, role).await {
        Ok(created_role) => (
            StatusCode::CREATED,
            Json(ApiResponse::success(created_role)),
        ),
        Err(e) => {
            tracing::error!("Create role error: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiResponse::error("创建角色失败".to_string())),
            )
        }
    }
}

#[derive(Debug, Deserialize)]
pub struct UpdateRoleRequest {
    pub name: Option<String>,
    pub code: Option<String>,
    pub description: Option<String>,
    pub is_active: Option<bool>,
}

pub async fn update_role_handler(
    State(state): State<Arc<AppState>>,
    Path(role_id): Path<String>,
    Json(req): Json<UpdateRoleRequest>,
) -> impl IntoResponse {
    let role_uuid = match Uuid::parse_str(&role_id) {
        Ok(id) => id,
        Err(_) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(ApiResponse::error("无效的角色ID".to_string())),
            )
        }
    };

    if let Ok(existing) = role_repo::get_role_by_id(&state.db, role_uuid).await {
        if existing.is_system {
            return (
                StatusCode::FORBIDDEN,
                Json(ApiResponse::error("系统内置角色不能修改".to_string())),
            );
        }
    }

    let update = UpdateRole {
        name: req.name.map(|n| n.trim().to_string()),
        code: req.code.map(|c| c.trim().to_lowercase()),
        description: req.description,
        is_active: req.is_active,
    };

    match role_repo::update_role(&state.db, role_uuid, update).await {
        Ok(role) => (StatusCode::OK, Json(ApiResponse::success(role))),
        Err(e) => {
            tracing::error!("Update role error: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiResponse::error("更新角色失败".to_string())),
            )
        }
    }
}

pub async fn delete_role_handler(
    State(state): State<Arc<AppState>>,
    Path(role_id): Path<String>,
) -> impl IntoResponse {
    let role_uuid = match Uuid::parse_str(&role_id) {
        Ok(id) => id,
        Err(_) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(ApiResponse::error("无效的角色ID".to_string())),
            )
        }
    };

    if let Ok(existing) = role_repo::get_role_by_id(&state.db, role_uuid).await {
        if existing.is_system {
            return (
                StatusCode::FORBIDDEN,
                Json(ApiResponse::error("系统内置角色不能删除".to_string())),
            );
        }
    }

    match role_repo::delete_role(&state.db, role_uuid).await {
        Ok(_) => (
            StatusCode::OK,
            Json(ApiResponse::success(
                serde_json::json!({"message": "角色删除成功"}),
            )),
        ),
        Err(e) => {
            tracing::error!("Delete role error: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiResponse::error("删除角色失败".to_string())),
            )
        }
    }
}

pub async fn get_role_permissions_handler(
    State(state): State<Arc<AppState>>,
    Path(role_id): Path<String>,
) -> impl IntoResponse {
    let role_uuid = match Uuid::parse_str(&role_id) {
        Ok(id) => id,
        Err(_) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(ApiResponse::error("无效的角色ID".to_string())),
            )
        }
    };

    match role_repo::get_role_permissions(&state.db, role_uuid).await {
        Ok(permissions) => (StatusCode::OK, Json(ApiResponse::success(permissions))),
        Err(e) => {
            tracing::error!("Get role permissions error: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiResponse::error("获取角色权限失败".to_string())),
            )
        }
    }
}

pub async fn assign_permissions_handler(
    State(state): State<Arc<AppState>>,
    Path(role_id): Path<String>,
    Json(req): Json<AssignPermissionsRequest>,
) -> impl IntoResponse {
    let role_uuid = match Uuid::parse_str(&role_id) {
        Ok(id) => id,
        Err(_) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(ApiResponse::error("无效的角色ID".to_string())),
            )
        }
    };

    if let Ok(existing) = role_repo::get_role_by_id(&state.db, role_uuid).await {
        if existing.is_system {
            return (
                StatusCode::FORBIDDEN,
                Json(ApiResponse::error("系统内置角色的权限不能修改".to_string())),
            );
        }
    }

    match role_repo::set_role_permissions(&state.db, role_uuid, req.permission_ids).await {
        Ok(_) => (
            StatusCode::OK,
            Json(ApiResponse::success(
                serde_json::json!({"message": "权限分配成功"}),
            )),
        ),
        Err(e) => {
            tracing::error!("Assign permissions error: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiResponse::error("分配权限失败".to_string())),
            )
        }
    }
}

pub async fn get_all_permissions_handler(State(state): State<Arc<AppState>>) -> impl IntoResponse {
    match role_repo::get_all_permissions(&state.db).await {
        Ok(permissions) => (StatusCode::OK, Json(ApiResponse::success(permissions))),
        Err(e) => {
            tracing::error!("Get all permissions error: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiResponse::error("获取权限列表失败".to_string())),
            )
        }
    }
}
