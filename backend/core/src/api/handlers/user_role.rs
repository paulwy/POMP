use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::IntoResponse,
    Json,
};
use serde::{Deserialize, Serialize};
use sqlx::types::Uuid;
use std::sync::Arc;

use crate::db::role::RoleWithPermissions;
use crate::db::role_repo;
use crate::errors::ApiResponse;
use crate::state::AppState;

#[derive(Debug, Deserialize)]
pub struct AssignRolesRequest {
    pub role_ids: Vec<Uuid>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UserRolesResponse {
    pub roles: Vec<RoleWithPermissions>,
    pub permissions: Vec<String>,
}

pub async fn get_user_roles_handler(
    State(state): State<Arc<AppState>>,
    Path(user_id): Path<String>,
) -> impl IntoResponse {
    let user_uuid = match Uuid::parse_str(&user_id) {
        Ok(id) => id,
        Err(_) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(ApiResponse::error("无效的用户ID".to_string())),
            )
        }
    };

    match role_repo::get_user_roles(&state.db, user_uuid).await {
        Ok(roles) => {
            let permissions = role_repo::get_user_permission_codes(&state.db, user_uuid)
                .await
                .unwrap_or_default();
            (
                StatusCode::OK,
                Json(ApiResponse::success(UserRolesResponse {
                    roles,
                    permissions,
                })),
            )
        }
        Err(e) => {
            tracing::error!("Get user roles error: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiResponse::error("获取用户角色失败".to_string())),
            )
        }
    }
}

pub async fn assign_roles_to_user_handler(
    State(state): State<Arc<AppState>>,
    Path(user_id): Path<String>,
    Json(req): Json<AssignRolesRequest>,
) -> impl IntoResponse {
    let user_uuid = match Uuid::parse_str(&user_id) {
        Ok(id) => id,
        Err(_) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(ApiResponse::error("无效的用户ID".to_string())),
            )
        }
    };

    for role_id in &req.role_ids {
        if let Err(e) = role_repo::assign_role_to_user(&state.db, user_uuid, *role_id, None).await {
            tracing::error!("Assign role error: {}", e);
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiResponse::error("分配角色失败".to_string())),
            );
        }
    }

    match role_repo::get_user_roles(&state.db, user_uuid).await {
        Ok(roles) => {
            let permissions = role_repo::get_user_permission_codes(&state.db, user_uuid)
                .await
                .unwrap_or_default();
            (
                StatusCode::OK,
                Json(ApiResponse::success(UserRolesResponse {
                    roles,
                    permissions,
                })),
            )
        }
        Err(e) => {
            tracing::error!("Get user roles error: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiResponse::error("获取用户角色失败".to_string())),
            )
        }
    }
}

pub async fn remove_role_from_user_handler(
    State(state): State<Arc<AppState>>,
    Path((user_id, role_id)): Path<(String, String)>,
) -> impl IntoResponse {
    let user_uuid = match Uuid::parse_str(&user_id) {
        Ok(id) => id,
        Err(_) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(ApiResponse::error("无效的用户ID".to_string())),
            )
        }
    };

    let role_uuid = match Uuid::parse_str(&role_id) {
        Ok(id) => id,
        Err(_) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(ApiResponse::error("无效的角色ID".to_string())),
            )
        }
    };

    match role_repo::remove_role_from_user(&state.db, user_uuid, role_uuid).await {
        Ok(_) => (
            StatusCode::OK,
            Json(ApiResponse::success(
                serde_json::json!({"message": "移除角色成功"}),
            )),
        ),
        Err(e) => {
            tracing::error!("Remove role error: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiResponse::error("移除角色失败".to_string())),
            )
        }
    }
}

pub async fn check_user_admin_handler(
    State(state): State<Arc<AppState>>,
    Path(user_id): Path<String>,
) -> impl IntoResponse {
    let user_uuid = match Uuid::parse_str(&user_id) {
        Ok(id) => id,
        Err(_) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(ApiResponse::error("无效的用户ID".to_string())),
            )
        }
    };

    match role_repo::is_user_admin(&state.db, user_uuid).await {
        Ok(is_admin) => (
            StatusCode::OK,
            Json(ApiResponse::success(
                serde_json::json!({"is_admin": is_admin}),
            )),
        ),
        Err(e) => {
            tracing::error!("Check admin error: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiResponse::error("检查管理员权限失败".to_string())),
            )
        }
    }
}
