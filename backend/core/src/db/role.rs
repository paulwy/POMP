use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::types::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Role {
    pub id: Uuid,
    pub name: String,
    pub code: String,
    pub description: Option<String>,
    pub is_active: bool,
    pub is_system: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateRole {
    pub name: String,
    pub code: String,
    pub description: Option<String>,
    pub is_active: Option<bool>,
    pub is_system: Option<bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateRole {
    pub name: Option<String>,
    pub code: Option<String>,
    pub description: Option<String>,
    pub is_active: Option<bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Permission {
    pub id: Uuid,
    pub name: String,
    pub code: String,
    pub resource: Option<String>,
    pub action: Option<String>,
    pub description: Option<String>,
    pub parent_id: Option<Uuid>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserRole {
    pub id: Uuid,
    pub user_id: Uuid,
    pub role_id: Uuid,
    pub assigned_at: DateTime<Utc>,
    pub assigned_by: Option<Uuid>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RoleWithPermissions {
    pub id: Uuid,
    pub name: String,
    pub code: String,
    pub description: Option<String>,
    pub is_active: bool,
    pub is_system: bool,
    pub permissions: Vec<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserWithRoles {
    pub id: Uuid,
    pub username: String,
    pub email: Option<String>,
    pub name: Option<String>,
    pub phone: Option<String>,
    pub avatar: Option<String>,
    pub is_superuser: bool,
    pub is_active: bool,
    pub status: String,
    pub roles: Vec<RoleWithPermissions>,
    pub permissions: Vec<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}
