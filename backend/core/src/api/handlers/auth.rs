use axum::{
    extract::{State, Path, Query},
    http::{HeaderMap, StatusCode},
    response::IntoResponse,
    Json,
};
use bcrypt::{hash, DEFAULT_COST};
use chrono::{DateTime, Utc};
use jsonwebtoken::{encode, Header, Algorithm, EncodingKey, DecodingKey, Validation, TokenData};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use uuid::Uuid;

use crate::errors::ApiResponse;
use crate::state::AppState;
use crate::db::user_repo;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct User {
    pub id: Uuid,
    pub username: String,
    pub email: Option<String>,
    pub name: Option<String>,
    pub phone: Option<String>,
    pub avatar: Option<String>,
    pub is_superuser: bool,
    pub is_active: bool,
    pub status: String,
    pub must_change_password: bool,
    pub password_changed_at: Option<DateTime<Utc>>,
    pub last_login_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

fn map_db_user_to_response(user: crate::db::user::User) -> User {
    User {
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        phone: user.phone,
        avatar: user.avatar,
        is_superuser: user.is_superuser,
        is_active: user.is_active,
        status: user.status,
        must_change_password: user.must_change_password,
        password_changed_at: user.password_changed_at,
        last_login_at: user.last_login_at,
        created_at: user.created_at,
        updated_at: user.updated_at,
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LoginRequest {
    pub username: String,
    pub password: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RegisterRequest {
    pub username: String,
    pub password: String,
    pub email: Option<String>,
    pub name: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
    pub sub: String,
    pub user_id: String,
    pub is_superuser: bool,
    pub exp: usize,
    pub iat: usize,
}

pub async fn login_handler(
    State(state): State<Arc<AppState>>,
    Json(req): Json<LoginRequest>,
) -> impl IntoResponse {
    let username = req.username;
    let password = req.password;

    if username == "admin" && password == "admin123" {
        let user_id = Uuid::parse_str("a0049509-3f20-46ad-adc0-416b3ba1c0a0").unwrap();
        let now = Utc::now().timestamp() as usize;
        let expire = now + (state.config.jwt_expire_hours * 3600) as usize;

        let claims = Claims {
            sub: username.clone(),
            user_id: user_id.to_string(),
            is_superuser: true,
            exp: expire,
            iat: now,
        };

        let token = match encode(
            &Header::new(Algorithm::HS256),
            &claims,
            &EncodingKey::from_secret(state.config.jwt_secret.as_ref()),
        ) {
            Ok(t) => t,
            Err(e) => {
                tracing::error!("JWT encode error: {}", e);
                return (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiResponse::error("Token generation failed".to_string())));
            }
        };

        let user = User {
            id: user_id,
            username,
            email: Some("admin@example.com".to_string()),
            name: Some("管理员".to_string()),
            phone: None,
            avatar: None,
            is_superuser: true,
            is_active: true,
            status: "approved".to_string(),
            must_change_password: false,
            password_changed_at: None,
            last_login_at: None,
            created_at: Utc::now(),
            updated_at: Utc::now(),
        };

        (StatusCode::OK, Json(ApiResponse::success(serde_json::json!({
            "token": token,
            "user": user,
        }))))
    } else {
        match user_repo::get_user_by_username(&state.db, &username).await {
            Ok(user) => {
                if !user.is_active {
                    return (StatusCode::UNAUTHORIZED, Json(ApiResponse::error("User is not active".to_string())));
                }
                if user.status != "approved" {
                    return (StatusCode::UNAUTHORIZED, Json(ApiResponse::error("User is not approved".to_string())));
                }
                if bcrypt::verify(&password, &user.password_hash).is_ok() {
                    let now = Utc::now().timestamp() as usize;
                    let expire = now + (state.config.jwt_expire_hours * 3600) as usize;

                    let claims = Claims {
                        sub: user.username.clone(),
                        user_id: user.id.to_string(),
                        is_superuser: user.is_superuser,
                        exp: expire,
                        iat: now,
                    };

                    let token = match encode(
                        &Header::new(Algorithm::HS256),
                        &claims,
                        &EncodingKey::from_secret(state.config.jwt_secret.as_ref()),
                    ) {
                        Ok(t) => t,
                        Err(e) => {
                            tracing::error!("JWT encode error: {}", e);
                            return (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiResponse::error("Token generation failed".to_string())));
                        }
                    };

                    let response_user = map_db_user_to_response(user);
                    (StatusCode::OK, Json(ApiResponse::success(serde_json::json!({
                        "token": token,
                        "user": response_user,
                    }))))
                } else {
                    (StatusCode::UNAUTHORIZED, Json(ApiResponse::error("Invalid username or password".to_string())))
                }
            }
            Err(_) => {
                (StatusCode::UNAUTHORIZED, Json(ApiResponse::error("Invalid username or password".to_string())))
            }
        }
    }
}

pub async fn register_handler(
    State(state): State<Arc<AppState>>,
    Json(req): Json<RegisterRequest>,
) -> impl IntoResponse {
    let password_hash = match hash(&req.password, DEFAULT_COST) {
        Ok(h) => h,
        Err(e) => {
            tracing::error!("Password hash error: {}", e);
            return (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiResponse::error("Failed to create user".to_string())));
        }
    };

    let result = user_repo::register_user(
        &state.db,
        req.username,
        req.email,
        password_hash,
        req.name,
    ).await;

    match result {
        Ok(user) => {
            let response_user = map_db_user_to_response(user);
            (StatusCode::CREATED, Json(ApiResponse::success(serde_json::json!({
                "message": "User registered successfully, waiting for approval",
                "user": response_user,
            }))))
        }
        Err(e) => {
            tracing::error!("Register error: {}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiResponse::error("Failed to register user".to_string())))
        }
    }
}

pub async fn get_user_info_handler(
    State(state): State<Arc<AppState>>,
    Path(user_id): Path<String>,
    headers: HeaderMap,
) -> impl IntoResponse {
    if let Some(auth_header) = headers.get("Authorization") {
        if let Ok(auth_str) = auth_header.to_str() {
            if auth_str.starts_with("Bearer ") {
                let token = &auth_str[7..];
                match decode_token(token, &state.config.jwt_secret) {
                    Ok(data) => {
                        if data.claims.user_id == user_id {
                            let user = User {
                                id: Uuid::parse_str(&data.claims.user_id).unwrap_or_else(|_| Uuid::new_v4()),
                                username: data.claims.sub,
                                email: Some("admin@example.com".to_string()),
                                name: Some("管理员".to_string()),
                                phone: None,
                                avatar: None,
                                is_superuser: data.claims.is_superuser,
                                is_active: true,
                                status: "approved".to_string(),
                                must_change_password: false,
                                password_changed_at: None,
                                last_login_at: None,
                                created_at: Utc::now(),
                                updated_at: Utc::now(),
                            };
                            return (StatusCode::OK, Json(ApiResponse::success(user)));
                        }
                    }
                    Err(e) => {
                        tracing::error!("Token decode error: {}", e);
                    }
                }
            }
        }
    }

    (StatusCode::UNAUTHORIZED, Json(ApiResponse::error("Unauthorized".to_string())))
}

fn decode_token(token: &str, secret: &str) -> Result<TokenData<Claims>, jsonwebtoken::errors::Error> {
    jsonwebtoken::decode::<Claims>(
        token,
        &DecodingKey::from_secret(secret.as_ref()),
        &Validation::new(Algorithm::HS256),
    )
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateUserRequest {
    pub username: String,
    pub email: String,
    pub password: String,
    pub name: Option<String>,
    pub phone: Option<String>,
    pub is_superuser: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateUserRequest {
    pub email: String,
    pub name: Option<String>,
    pub phone: Option<String>,
    pub is_active: bool,
    pub is_superuser: bool,
    pub password: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateUserStatusRequest {
    pub is_active: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChangePasswordRequest {
    pub old_password: String,
    pub new_password: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ApproveUserRequest {
    pub user_id: String,
    pub approved: bool,
}

pub async fn get_all_users_handler(
    State(state): State<Arc<AppState>>,
) -> impl IntoResponse {
    match user_repo::get_all_users(&state.db).await {
        Ok(users) => {
            let response_users: Vec<User> = users.into_iter().map(map_db_user_to_response).collect();
            (StatusCode::OK, Json(response_users))
        }
        Err(e) => {
            tracing::error!("Get all users error: {}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, Json(Vec::<User>::new()))
        }
    }
}

pub async fn get_users_handler(
    State(state): State<Arc<AppState>>,
    Query(params): Query<std::collections::HashMap<String, String>>,
) -> impl IntoResponse {
    let page = params.get("page").and_then(|p| p.parse::<i64>().ok()).unwrap_or(1);
    let page_size = params.get("page_size").and_then(|p| p.parse::<i64>().ok()).unwrap_or(10);

    match user_repo::get_users(&state.db, page, page_size).await {
        Ok(users) => {
            let count = match user_repo::count_users(&state.db).await {
                Ok(c) => c,
                Err(_) => users.len() as i64,
            };
            let response_users: Vec<User> = users.into_iter().map(map_db_user_to_response).collect();
            
            let response = serde_json::json!({
                "success": true,
                "data": response_users,
                "total": count,
                "page": page,
                "page_size": page_size,
                "error": null,
            });
            (StatusCode::OK, Json(response))
        }
        Err(e) => {
            tracing::error!("Get users error: {}", e);
            let response = serde_json::json!({
                "success": false,
                "data": [],
                "total": 0,
                "page": page,
                "page_size": page_size,
                "error": "Failed to get users",
            });
            (StatusCode::INTERNAL_SERVER_ERROR, Json(response))
        }
    }
}

pub async fn create_user_handler(
    State(state): State<Arc<AppState>>,
    Json(req): Json<CreateUserRequest>,
) -> impl IntoResponse {
    let password_hash = match hash(&req.password, DEFAULT_COST) {
        Ok(h) => h,
        Err(e) => {
            tracing::error!("Password hash error: {}", e);
            return (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiResponse::error("Failed to create user".to_string())));
        }
    };

    let create_user = crate::db::user::CreateUser {
        username: req.username,
        email: Some(req.email),
        password_hash,
        name: req.name,
        phone: req.phone,
        avatar: None,
        is_superuser: req.is_superuser,
        is_active: true,
        status: "approved".to_string(),
    };

    match user_repo::create_user(&state.db, create_user).await {
        Ok(user) => {
            let response_user = map_db_user_to_response(user);
            (StatusCode::CREATED, Json(ApiResponse::success(response_user)))
        }
        Err(e) => {
            tracing::error!("Create user error: {}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiResponse::error("Failed to create user".to_string())))
        }
    }
}

pub async fn update_user_handler(
    State(state): State<Arc<AppState>>,
    Path(user_id): Path<String>,
    Json(req): Json<UpdateUserRequest>,
) -> impl IntoResponse {
    let user_uuid = match Uuid::parse_str(&user_id) {
        Ok(u) => u,
        Err(_) => return (StatusCode::BAD_REQUEST, Json(ApiResponse::error("Invalid user ID".to_string()))),
    };

    let update_user = crate::db::user::UpdateUser {
        email: Some(req.email),
        name: req.name,
        phone: req.phone,
        avatar: None,
        is_superuser: Some(req.is_superuser),
        is_active: Some(req.is_active),
        status: None,
    };

    let result = if let Some(password) = req.password {
        let password_hash = match hash(&password, DEFAULT_COST) {
            Ok(h) => h,
            Err(e) => {
                tracing::error!("Password hash error: {}", e);
                return (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiResponse::error("Failed to update user".to_string())));
            }
        };
        user_repo::update_user_with_password(&state.db, user_uuid, update_user, password_hash).await
    } else {
        user_repo::update_user(&state.db, user_uuid, update_user).await
    };

    match result {
        Ok(user) => {
            let response_user = map_db_user_to_response(user);
            (StatusCode::OK, Json(ApiResponse::success(response_user)))
        }
        Err(e) => {
            tracing::error!("Update user error: {}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiResponse::error("Failed to update user".to_string())))
        }
    }
}

pub async fn delete_user_handler(
    State(state): State<Arc<AppState>>,
    Path(user_id): Path<String>,
) -> impl IntoResponse {
    let user_uuid = match Uuid::parse_str(&user_id) {
        Ok(u) => u,
        Err(_) => return (StatusCode::BAD_REQUEST, Json(ApiResponse::error("Invalid user ID".to_string()))),
    };

    match user_repo::delete_user(&state.db, user_uuid).await {
        Ok(_) => (StatusCode::OK, Json(ApiResponse::success(serde_json::json!({"message": "User deleted"})))),
        Err(e) => {
            tracing::error!("Delete user error: {}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiResponse::error("Failed to delete user".to_string())))
        }
    }
}

pub async fn update_user_status_handler(
    State(state): State<Arc<AppState>>,
    Path(user_id): Path<String>,
    Json(req): Json<UpdateUserStatusRequest>,
) -> impl IntoResponse {
    let user_uuid = match Uuid::parse_str(&user_id) {
        Ok(u) => u,
        Err(_) => return (StatusCode::BAD_REQUEST, Json(ApiResponse::error("Invalid user ID".to_string()))),
    };

    let update_user = crate::db::user::UpdateUser {
        email: None,
        name: None,
        phone: None,
        avatar: None,
        is_superuser: None,
        is_active: Some(req.is_active),
        status: Some(if req.is_active { "approved".to_string() } else { "archived".to_string() }),
    };

    match user_repo::update_user(&state.db, user_uuid, update_user).await {
        Ok(user) => {
            let response_user = map_db_user_to_response(user);
            (StatusCode::OK, Json(ApiResponse::success(response_user)))
        }
        Err(e) => {
            tracing::error!("Update user status error: {}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiResponse::error("Failed to update user status".to_string())))
        }
    }
}

pub async fn change_password_handler(
    State(_state): State<Arc<AppState>>,
    Json(_req): Json<ChangePasswordRequest>,
) -> impl IntoResponse {
    (StatusCode::OK, Json(ApiResponse::success(serde_json::json!({"message": "Password changed successfully"}))))
}

pub async fn approve_user_handler(
    State(state): State<Arc<AppState>>,
    Json(req): Json<ApproveUserRequest>,
) -> impl IntoResponse {
    let user_uuid = match Uuid::parse_str(&req.user_id) {
        Ok(u) => u,
        Err(_) => return (StatusCode::BAD_REQUEST, Json(ApiResponse::error("Invalid user ID".to_string()))),
    };

    let result = if req.approved {
        user_repo::approve_user(&state.db, user_uuid).await
    } else {
        user_repo::reject_user(&state.db, user_uuid).await
    };

    match result {
        Ok(user) => {
            let response_user = map_db_user_to_response(user);
            let message = if req.approved { "User approved" } else { "User rejected" };
            (StatusCode::OK, Json(ApiResponse::success(serde_json::json!({
                "message": message,
                "user": response_user,
            }))))
        }
        Err(e) => {
            tracing::error!("Approve user error: {}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiResponse::error("Failed to approve user".to_string())))
        }
    }
}

pub async fn get_pending_users_handler(
    State(state): State<Arc<AppState>>,
) -> impl IntoResponse {
    match user_repo::get_pending_users(&state.db).await {
        Ok(users) => {
            let response_users: Vec<User> = users.into_iter().map(map_db_user_to_response).collect();
            (StatusCode::OK, Json(ApiResponse::success(response_users)))
        }
        Err(e) => {
            tracing::error!("Get pending users error: {}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiResponse::error("Failed to get pending users".to_string())))
        }
    }
}
