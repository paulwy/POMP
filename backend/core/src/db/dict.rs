use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct DictType {
    pub id: Uuid,
    pub code: String,
    pub name: String,
    pub description: Option<String>,
    pub category: String,
    pub parent_id: Option<Uuid>,
    pub sort_order: i32,
    pub is_system: bool,
    pub is_active: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct DictItem {
    pub id: Uuid,
    pub dict_type_id: Uuid,
    pub code: String,
    pub name: String,
    pub value: Option<String>,
    pub sort_order: i32,
    pub is_default: bool,
    pub is_active: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DictTypeWithItems {
    pub dict_type: DictType,
    pub items: Vec<DictItem>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateDictType {
    pub code: String,
    pub name: String,
    pub description: Option<String>,
    pub category: String,
    pub parent_id: Option<Uuid>,
    pub sort_order: Option<i32>,
    pub is_system: Option<bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateDictType {
    pub name: Option<String>,
    pub description: Option<String>,
    pub sort_order: Option<i32>,
    pub is_active: Option<bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateDictItem {
    pub dict_type_id: Uuid,
    pub code: String,
    pub name: String,
    pub value: Option<String>,
    pub sort_order: Option<i32>,
    pub is_default: Option<bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateDictItem {
    pub name: Option<String>,
    pub value: Option<String>,
    pub sort_order: Option<i32>,
    pub is_default: Option<bool>,
    pub is_active: Option<bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DictQuery {
    pub category: Option<String>,
    pub keyword: Option<String>,
    pub is_active: Option<bool>,
}
