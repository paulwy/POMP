use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::types::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Workflow {
    pub id: String,
    pub name: String,
    pub code: Option<String>,
    pub description: Option<String>,
    pub is_active: bool,
    pub is_system: bool,
    pub system_required: bool,
    pub allow_customization: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkflowStep {
    pub id: Uuid,
    pub workflow_id: String,
    pub step_number: i32,
    pub name: String,
    pub approver_type: String,
    pub approver_id: Option<Uuid>,
    pub role_code: Option<String>,
    pub department_id: Option<Uuid>,
    pub timeout_days: Option<i32>,
    pub deadline_at: Option<DateTime<Utc>>,
    pub can_skip: bool,
    pub is_optional: bool,
    pub next_step_id: Option<Uuid>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ApprovalTask {
    pub id: Uuid,
    pub workflow_id: String,
    pub workflow_code: String,
    pub title: String,
    pub description: Option<String>,
    pub status: String,
    pub current_step: i32,
    pub max_steps: i32,
    pub creator_id: Uuid,
    pub creator_name: String,
    pub current_approver_id: Option<Uuid>,
    pub current_approver_name: Option<String>,
    pub data: serde_json::Value,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub completed_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ApprovalRecord {
    pub id: Uuid,
    pub task_id: Uuid,
    pub step_number: i32,
    pub approver_id: Uuid,
    pub approver_name: String,
    pub action: String,
    pub comment: Option<String>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ApprovalTemplate {
    pub id: Uuid,
    pub name: String,
    pub workflow_code: String,
    pub title_template: String,
    pub description_template: Option<String>,
    pub default_data: serde_json::Value,
    pub is_active: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateWorkflowRequest {
    pub name: String,
    pub code: String,
    pub description: Option<String>,
    pub steps: Vec<CreateStepRequest>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateStepRequest {
    pub step_number: i32,
    pub name: String,
    pub approver_type: String,
    pub approver_id: Option<Uuid>,
    pub role_code: Option<String>,
    pub department_id: Option<Uuid>,
    pub timeout_days: Option<i32>,
    pub can_skip: Option<bool>,
    pub is_optional: Option<bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateWorkflowRequest {
    pub name: Option<String>,
    pub description: Option<String>,
    pub is_active: Option<bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AdjustApproverRequest {
    pub step_id: Uuid,
    pub approver_id: Option<Uuid>,
    pub role_code: Option<String>,
    pub department_id: Option<Uuid>,
    pub clear_customization: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AdjustTimeoutRequest {
    pub step_id: Uuid,
    pub timeout_days: Option<i32>,
    pub deadline_at: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateTaskRequest {
    pub workflow_code: String,
    pub title: String,
    pub description: Option<String>,
    pub data: serde_json::Value,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ApproveRequest {
    pub comment: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ApplyTemplateRequest {
    pub template_id: Uuid,
    pub data: serde_json::Value,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateTemplateRequest {
    pub name: String,
    pub workflow_code: String,
    pub title_template: String,
    pub description_template: Option<String>,
    pub default_data: Option<serde_json::Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkflowListResponse {
    pub data: Vec<Workflow>,
    pub total: i64,
    pub page: i64,
    pub page_size: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TaskListResponse {
    pub data: Vec<ApprovalTask>,
    pub total: i64,
    pub page: i64,
    pub page_size: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TaskWithRecords {
    pub task: ApprovalTask,
    pub records: Vec<ApprovalRecord>,
}
