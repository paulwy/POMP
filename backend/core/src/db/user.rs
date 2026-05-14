use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct User {
    pub id: Uuid,
    pub username: String,
    pub email: Option<String>,
    pub password_hash: String,
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

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateUser {
    pub username: String,
    pub email: Option<String>,
    pub password_hash: String,
    pub name: Option<String>,
    pub phone: Option<String>,
    pub avatar: Option<String>,
    pub is_superuser: bool,
    pub is_active: bool,
    pub status: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateUser {
    pub email: Option<String>,
    pub name: Option<String>,
    pub phone: Option<String>,
    pub avatar: Option<String>,
    pub is_superuser: Option<bool>,
    pub is_active: Option<bool>,
    pub status: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RegisterUser {
    pub username: String,
    pub email: Option<String>,
    pub password_hash: String,
    pub name: Option<String>,
}
