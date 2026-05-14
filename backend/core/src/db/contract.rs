use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct ContractTemplate {
    pub id: Uuid,
    pub code: String,
    pub name: String,
    pub description: Option<String>,
    pub contract_type: String,
    pub category: String,
    pub content: String,
    pub variables: Option<String>,
    pub version: String,
    pub is_active: bool,
    pub is_system: bool,
    pub sort_order: i32,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateContractTemplate {
    pub code: String,
    pub name: String,
    pub description: Option<String>,
    pub contract_type: String,
    pub category: String,
    pub content: String,
    pub variables: Option<String>,
    pub version: Option<String>,
    pub is_active: Option<bool>,
    pub is_system: Option<bool>,
    pub sort_order: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateContractTemplate {
    pub name: Option<String>,
    pub description: Option<String>,
    pub contract_type: Option<String>,
    pub category: Option<String>,
    pub content: Option<String>,
    pub variables: Option<String>,
    pub version: Option<String>,
    pub is_active: Option<bool>,
    pub sort_order: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Contract {
    pub id: Uuid,
    pub code: String,
    pub name: String,
    pub description: Option<String>,
    pub contract_type: String,
    pub category: String,
    pub content: String,
    pub content_rendered: String,
    pub status: String,
    pub first_party: String,
    pub second_party: String,
    pub amount: Option<f64>,
    pub currency: String,
    pub start_date: Option<DateTime<Utc>>,
    pub end_date: Option<DateTime<Utc>>,
    pub sign_date: Option<DateTime<Utc>>,
    pub project_id: Option<Uuid>,
    pub created_by: Option<Uuid>,
    pub risk_level: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateContract {
    pub code: Option<String>,
    pub name: String,
    pub description: Option<String>,
    pub contract_type: String,
    pub category: String,
    pub content: Option<String>,
    pub template_id: Option<Uuid>,
    pub content_rendered: Option<String>,
    pub first_party: String,
    pub second_party: String,
    pub amount: Option<f64>,
    pub currency: Option<String>,
    pub start_date: Option<DateTime<Utc>>,
    pub end_date: Option<DateTime<Utc>>,
    pub sign_date: Option<DateTime<Utc>>,
    pub project_id: Option<Uuid>,
    pub created_by: Option<Uuid>,
    pub risk_level: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateContract {
    pub name: Option<String>,
    pub description: Option<String>,
    pub contract_type: Option<String>,
    pub category: Option<String>,
    pub content: Option<String>,
    pub content_rendered: Option<String>,
    pub first_party: Option<String>,
    pub second_party: Option<String>,
    pub amount: Option<f64>,
    pub currency: Option<String>,
    pub start_date: Option<DateTime<Utc>>,
    pub end_date: Option<DateTime<Utc>>,
    pub sign_date: Option<DateTime<Utc>>,
    pub project_id: Option<Uuid>,
    pub status: Option<String>,
    pub risk_level: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ContractVariableValue {
    pub id: Uuid,
    pub contract_id: Uuid,
    pub variable_key: String,
    pub variable_value: String,
    pub variable_type: String,
    pub created_at: DateTime<Utc>,
}
