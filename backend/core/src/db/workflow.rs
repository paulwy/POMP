use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct WorkflowDefinition {
    pub id: Uuid,
    pub code: String,
    pub name: String,
    pub description: Option<String>,
    pub business_type: String,
    pub version: String,
    pub is_active: bool,
    pub is_default: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateWorkflowDefinition {
    pub code: String,
    pub name: String,
    pub description: Option<String>,
    pub business_type: String,
    pub version: Option<String>,
    pub is_active: Option<bool>,
    pub is_default: Option<bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateWorkflowDefinition {
    pub name: Option<String>,
    pub description: Option<String>,
    pub business_type: Option<String>,
    pub version: Option<String>,
    pub is_active: Option<bool>,
    pub is_default: Option<bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct WorkflowNode {
    pub id: Uuid,
    pub workflow_id: Uuid,
    pub node_code: String,
    pub node_name: String,
    pub node_type: String,
    pub approval_type: String,
    pub approver_type: String,
    pub approver_config: Option<String>,
    pub sort_order: i32,
    pub is_required: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateWorkflowNode {
    pub workflow_id: Uuid,
    pub node_code: String,
    pub node_name: String,
    pub node_type: String,
    pub approval_type: String,
    pub approver_type: String,
    pub approver_config: Option<String>,
    pub sort_order: Option<i32>,
    pub is_required: Option<bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateWorkflowNode {
    pub node_name: Option<String>,
    pub node_type: Option<String>,
    pub approval_type: Option<String>,
    pub approver_type: Option<String>,
    pub approver_config: Option<String>,
    pub sort_order: Option<i32>,
    pub is_required: Option<bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct WorkflowInstance {
    pub id: Uuid,
    pub workflow_id: Uuid,
    pub workflow_code: String,
    pub business_id: String,
    pub business_type: String,
    pub business_title: String,
    pub status: String,
    pub applicant_id: Option<Uuid>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct WorkflowTask {
    pub id: Uuid,
    pub instance_id: Uuid,
    pub node_id: Uuid,
    pub node_name: String,
    pub assignee_id: Option<Uuid>,
    pub assignee_name: Option<String>,
    pub status: String,
    pub comment: Option<String>,
    pub created_at: DateTime<Utc>,
    pub processed_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ApprovalAction {
    pub task_id: Uuid,
    pub user_id: Uuid,
    pub approved: bool,
    pub comment: Option<String>,
}
