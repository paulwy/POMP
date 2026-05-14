use bigdecimal::{BigDecimal, ToPrimitive};
use chrono::{DateTime, NaiveDate, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Project {
    pub id: Uuid,
    pub name: String,
    pub code: String,
    pub description: Option<String>,
    pub project_type: String,
    pub status: String,
    pub priority: String,
    pub budget: Option<bigdecimal::BigDecimal>,
    pub actual_cost: Option<bigdecimal::BigDecimal>,
    pub start_date: Option<DateTime<Utc>>,
    pub end_date: Option<DateTime<Utc>>,
    pub completed_date: Option<DateTime<Utc>>,
    pub progress: i32,
    pub customer_id: Option<Uuid>,
    pub manager_id: Option<Uuid>,
    pub department_id: Option<Uuid>,
    pub parent_project_id: Option<Uuid>,
    pub created_by: Uuid,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateProject {
    pub name: String,
    pub code: String,
    pub description: Option<String>,
    pub project_type: String,
    pub priority: String,
    pub budget: Option<f64>,
    pub start_date: DateTime<Utc>,
    pub end_date: Option<DateTime<Utc>>,
    pub customer_id: Option<String>,
    pub manager_id: Option<String>,
    pub department_id: Option<String>,
    pub parent_project_id: Option<String>,
    pub created_by: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateProject {
    pub name: Option<String>,
    pub description: Option<String>,
    pub status: Option<String>,
    pub priority: Option<String>,
    pub budget: Option<f64>,
    pub end_date: Option<DateTime<Utc>>,
    pub manager_id: Option<String>,
    pub progress: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct ProjectPhase {
    pub id: Uuid,
    pub project_id: Uuid,
    pub name: String,
    pub description: Option<String>,
    pub order: i32,
    pub status: String,
    pub start_date: Option<DateTime<Utc>>,
    pub end_date: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateProjectPhase {
    pub name: String,
    pub description: Option<String>,
    pub order: i32,
    pub start_date: Option<DateTime<Utc>>,
    pub end_date: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateProjectPhase {
    pub name: Option<String>,
    pub description: Option<String>,
    pub status: Option<String>,
    pub end_date: Option<DateTime<Utc>>,
    pub completed_date: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct ProjectTask {
    pub id: Uuid,
    pub project_id: Uuid,
    pub phase_id: Option<Uuid>,
    pub name: String,
    pub description: Option<String>,
    pub status: String,
    pub priority: String,
    pub assignee_id: Option<Uuid>,
    pub start_date: Option<DateTime<Utc>>,
    pub due_date: Option<DateTime<Utc>>,
    pub completed_date: Option<DateTime<Utc>>,
    pub progress: i32,
    pub estimated_hours: Option<f64>,
    pub actual_hours: Option<f64>,
    pub parent_task_id: Option<Uuid>,
    pub created_by: Uuid,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateProjectTask {
    pub phase_id: Option<String>,
    pub name: String,
    pub description: Option<String>,
    pub priority: String,
    pub assignee_id: Option<String>,
    pub start_date: Option<DateTime<Utc>>,
    pub due_date: Option<DateTime<Utc>>,
    pub estimated_hours: Option<f64>,
    pub parent_task_id: Option<String>,
    pub created_by: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateProjectTask {
    pub name: Option<String>,
    pub description: Option<String>,
    pub status: Option<String>,
    pub priority: Option<String>,
    pub assignee_id: Option<String>,
    pub due_date: Option<DateTime<Utc>>,
    pub completed_date: Option<DateTime<Utc>>,
    pub progress: Option<i32>,
    pub actual_hours: Option<f64>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct ProjectTeam {
    pub id: Uuid,
    pub project_id: Uuid,
    pub user_id: Uuid,
    pub role: String,
    pub responsibility: Option<String>,
    pub join_date: NaiveDate,
    pub leave_date: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateProjectTeam {
    pub user_id: String,
    pub role: String,
    pub responsibility: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateProjectTeam {
    pub role: Option<String>,
    pub responsibility: Option<String>,
    pub leave_date: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct ProjectResource {
    pub id: Uuid,
    pub project_id: Uuid,
    pub resource_type: String,
    pub resource_id: Uuid,
    pub allocation: f64,
    pub start_date: DateTime<Utc>,
    pub end_date: Option<DateTime<Utc>>,
    pub cost: Option<bigdecimal::BigDecimal>,
    pub description: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateProjectResource {
    pub resource_type: String,
    pub resource_id: String,
    pub allocation: f64,
    pub start_date: DateTime<Utc>,
    pub end_date: Option<DateTime<Utc>>,
    pub cost: Option<f64>,
    pub description: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateProjectResource {
    pub allocation: Option<f64>,
    pub end_date: Option<DateTime<Utc>>,
    pub cost: Option<f64>,
    pub description: Option<String>,
}

#[derive(Debug, Clone, FromRow)]
pub struct ProjectRisk {
    pub id: Uuid,
    pub project_id: Uuid,
    pub title: String,
    pub description: Option<String>,
    pub risk_level: String,
    pub probability: BigDecimal,
    pub impact: String,
    pub mitigation_plan: Option<String>,
    pub owner_id: Option<Uuid>,
    pub status: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

impl Serialize for ProjectRisk {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        use serde::ser::SerializeStruct;
        let mut state = serializer.serialize_struct("ProjectRisk", 12)?;
        state.serialize_field("id", &self.id)?;
        state.serialize_field("project_id", &self.project_id)?;
        state.serialize_field("title", &self.title)?;
        state.serialize_field("description", &self.description)?;
        state.serialize_field("risk_level", &self.risk_level)?;
        state.serialize_field("probability", &self.probability.to_f64().unwrap_or(0.0))?;
        state.serialize_field("impact", &self.impact)?;
        state.serialize_field("mitigation_plan", &self.mitigation_plan)?;
        state.serialize_field("owner_id", &self.owner_id)?;
        state.serialize_field("status", &self.status)?;
        state.serialize_field("created_at", &self.created_at)?;
        state.serialize_field("updated_at", &self.updated_at)?;
        state.end()
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateProjectRisk {
    pub title: String,
    pub description: Option<String>,
    pub probability: f64,
    pub impact: String,
    pub risk_level: String,
    pub mitigation_plan: Option<String>,
    pub owner_id: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateProjectRisk {
    pub title: Option<String>,
    pub description: Option<String>,
    pub probability: Option<f64>,
    pub impact: Option<String>,
    pub risk_level: Option<String>,
    pub mitigation_plan: Option<String>,
    pub owner_id: Option<String>,
    pub status: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct ProjectMilestone {
    pub id: Uuid,
    pub project_id: Uuid,
    pub name: String,
    pub description: Option<String>,
    pub target_date: DateTime<Utc>,
    pub actual_date: Option<DateTime<Utc>>,
    pub status: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateProjectMilestone {
    pub name: String,
    pub description: Option<String>,
    pub target_date: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateProjectMilestone {
    pub name: Option<String>,
    pub description: Option<String>,
    pub target_date: Option<DateTime<Utc>>,
    pub actual_date: Option<DateTime<Utc>>,
    pub status: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct ProjectCost {
    pub id: Uuid,
    pub project_id: Uuid,
    pub category: String,
    pub description: Option<String>,
    pub amount: bigdecimal::BigDecimal,
    pub currency: String,
    pub cost_date: NaiveDate,
    pub created_by: Uuid,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateProjectCost {
    pub category: String,
    pub description: Option<String>,
    pub amount: f64,
    pub currency: String,
    pub cost_date: NaiveDate,
    pub created_by: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct ProjectIssue {
    pub id: Uuid,
    pub project_id: Uuid,
    pub title: String,
    pub description: Option<String>,
    pub issue_type: String,
    pub severity: String,
    pub status: String,
    pub assignee_id: Option<Uuid>,
    pub created_by: Uuid,
    pub reporter_id: Option<Uuid>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub resolved_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateProjectIssue {
    pub title: String,
    pub description: Option<String>,
    pub issue_type: String,
    pub severity: String,
    pub assignee_id: Option<String>,
    pub reporter_id: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateProjectIssue {
    pub title: Option<String>,
    pub description: Option<String>,
    pub status: Option<String>,
    pub assignee_id: Option<String>,
    pub resolved_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProjectSearchParams {
    pub status: Option<String>,
    pub project_type: Option<String>,
    pub priority: Option<String>,
    pub department_id: Option<String>,
    pub manager_id: Option<String>,
    pub page: Option<i32>,
    pub page_size: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProjectStats {
    pub total_projects: i64,
    pub active_projects: i64,
    pub completed_projects: i64,
    pub in_progress_projects: i64,
    pub total_budget: Option<bigdecimal::BigDecimal>,
    pub total_cost: Option<bigdecimal::BigDecimal>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProjectTimelineItem {
    pub id: Uuid,
    pub project_id: Uuid,
    pub item_type: String,
    pub title: String,
    pub start_date: DateTime<Utc>,
    pub end_date: Option<DateTime<Utc>>,
    pub status: String,
}

pub enum ProjectStatus {
    Planning,
    InProgress,
    Review,
    Completed,
    Cancelled,
    OnHold,
}

impl ProjectStatus {
    pub fn as_str(&self) -> &'static str {
        match self {
            ProjectStatus::Planning => "planning",
            ProjectStatus::InProgress => "in_progress",
            ProjectStatus::Review => "review",
            ProjectStatus::Completed => "completed",
            ProjectStatus::Cancelled => "cancelled",
            ProjectStatus::OnHold => "on_hold",
        }
    }

    pub fn from_str(s: &str) -> Option<ProjectStatus> {
        match s {
            "planning" => Some(ProjectStatus::Planning),
            "in_progress" => Some(ProjectStatus::InProgress),
            "review" => Some(ProjectStatus::Review),
            "completed" => Some(ProjectStatus::Completed),
            "cancelled" => Some(ProjectStatus::Cancelled),
            "on_hold" => Some(ProjectStatus::OnHold),
            _ => None,
        }
    }
}

pub enum TaskStatus {
    Todo,
    InProgress,
    Review,
    Done,
    Blocked,
}

impl TaskStatus {
    pub fn as_str(&self) -> &'static str {
        match self {
            TaskStatus::Todo => "todo",
            TaskStatus::InProgress => "in_progress",
            TaskStatus::Review => "review",
            TaskStatus::Done => "done",
            TaskStatus::Blocked => "blocked",
        }
    }
}