use axum::{extract::Path, http::StatusCode, response::IntoResponse, Json};
use serde_json::json;
use uuid::Uuid;

use crate::db::{project::*, project_repo::ProjectRepo, DbPool};

pub async fn create_project_handler(
    pool: axum::extract::Extension<DbPool>,
    Json(data): Json<CreateProject>,
) -> impl IntoResponse {
    match ProjectRepo::create_project(&pool, data).await {
        Ok(project) => (StatusCode::CREATED, Json(project)).into_response(),
        Err(e) => {
            tracing::error!("Failed to create project: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({"error": "Failed to create project"})),
            )
                .into_response()
        }
    }
}

pub async fn get_project_handler(
    pool: axum::extract::Extension<DbPool>,
    Path(id): Path<String>,
) -> impl IntoResponse {
    match Uuid::parse_str(&id) {
        Ok(uuid) => match ProjectRepo::get_project_by_id(&pool, uuid).await {
            Ok(Some(project)) => (StatusCode::OK, Json(project)).into_response(),
            Ok(None) => (
                StatusCode::NOT_FOUND,
                Json(json!({"error": "Project not found"})),
            )
                .into_response(),
            Err(e) => {
                tracing::error!("Failed to get project: {}", e);
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(json!({"error": "Failed to get project"})),
                )
                    .into_response()
            }
        },
        Err(_) => (
            StatusCode::BAD_REQUEST,
            Json(json!({"error": "Invalid project ID"})),
        )
            .into_response(),
    }
}

pub async fn search_projects_handler(
    pool: axum::extract::Extension<DbPool>,
    params: axum::extract::Query<ProjectSearchParams>,
) -> impl IntoResponse {
    match ProjectRepo::search_projects(&pool, params.0).await {
        Ok(projects) => (StatusCode::OK, Json(projects)).into_response(),
        Err(e) => {
            tracing::error!("Failed to search projects: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({"error": "Failed to search projects"})),
            )
                .into_response()
        }
    }
}

pub async fn update_project_handler(
    pool: axum::extract::Extension<DbPool>,
    Path(id): Path<String>,
    Json(data): Json<UpdateProject>,
) -> impl IntoResponse {
    match Uuid::parse_str(&id) {
        Ok(uuid) => match ProjectRepo::update_project(&pool, uuid, data).await {
            Ok(Some(project)) => (StatusCode::OK, Json(project)).into_response(),
            Ok(None) => (
                StatusCode::NOT_FOUND,
                Json(json!({"error": "Project not found"})),
            )
                .into_response(),
            Err(e) => {
                tracing::error!("Failed to update project: {}", e);
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(json!({"error": "Failed to update project"})),
                )
                    .into_response()
            }
        },
        Err(_) => (
            StatusCode::BAD_REQUEST,
            Json(json!({"error": "Invalid project ID"})),
        )
            .into_response(),
    }
}

pub async fn delete_project_handler(
    pool: axum::extract::Extension<DbPool>,
    Path(id): Path<String>,
) -> impl IntoResponse {
    match Uuid::parse_str(&id) {
        Ok(uuid) => match ProjectRepo::delete_project(&pool, uuid).await {
            Ok(true) => StatusCode::NO_CONTENT.into_response(),
            Ok(false) => (
                StatusCode::NOT_FOUND,
                Json(json!({"error": "Project not found"})),
            )
                .into_response(),
            Err(e) => {
                tracing::error!("Failed to delete project: {}", e);
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(json!({"error": "Failed to delete project"})),
                )
                    .into_response()
            }
        },
        Err(_) => (
            StatusCode::BAD_REQUEST,
            Json(json!({"error": "Invalid project ID"})),
        )
            .into_response(),
    }
}

pub async fn get_project_stats_handler(pool: axum::extract::Extension<DbPool>) -> impl IntoResponse {
    match ProjectRepo::get_project_stats(&pool).await {
        Ok(stats) => (StatusCode::OK, Json(stats)).into_response(),
        Err(e) => {
            tracing::error!("Failed to get project stats: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({"error": "Failed to get project stats"})),
            )
                .into_response()
        }
    }
}

pub async fn create_phase_handler(
    pool: axum::extract::Extension<DbPool>,
    Path(project_id): Path<String>,
    Json(data): Json<CreateProjectPhase>,
) -> impl IntoResponse {
    match Uuid::parse_str(&project_id) {
        Ok(uuid) => match ProjectRepo::create_phase(&pool, uuid, data).await {
            Ok(phase) => (StatusCode::CREATED, Json(phase)).into_response(),
            Err(e) => {
                tracing::error!("Failed to create phase: {}", e);
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(json!({"error": "Failed to create phase"})),
                )
                    .into_response()
            }
        },
        Err(_) => (
            StatusCode::BAD_REQUEST,
            Json(json!({"error": "Invalid project ID"})),
        )
            .into_response(),
    }
}

pub async fn get_phases_handler(
    pool: axum::extract::Extension<DbPool>,
    Path(project_id): Path<String>,
) -> impl IntoResponse {
    match Uuid::parse_str(&project_id) {
        Ok(uuid) => match ProjectRepo::get_phases_by_project(&pool, uuid).await {
            Ok(phases) => (StatusCode::OK, Json(phases)).into_response(),
            Err(e) => {
                tracing::error!("Failed to get phases: {}", e);
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(json!({"error": "Failed to get phases"})),
                )
                    .into_response()
            }
        },
        Err(_) => (
            StatusCode::BAD_REQUEST,
            Json(json!({"error": "Invalid project ID"})),
        )
            .into_response(),
    }
}

pub async fn update_phase_handler(
    pool: axum::extract::Extension<DbPool>,
    Path(id): Path<String>,
    Json(data): Json<UpdateProjectPhase>,
) -> impl IntoResponse {
    match Uuid::parse_str(&id) {
        Ok(uuid) => match ProjectRepo::update_phase(&pool, uuid, data).await {
            Ok(Some(phase)) => (StatusCode::OK, Json(phase)).into_response(),
            Ok(None) => (
                StatusCode::NOT_FOUND,
                Json(json!({"error": "Phase not found"})),
            )
                .into_response(),
            Err(e) => {
                tracing::error!("Failed to update phase: {}", e);
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(json!({"error": "Failed to update phase"})),
                )
                    .into_response()
            }
        },
        Err(_) => (
            StatusCode::BAD_REQUEST,
            Json(json!({"error": "Invalid phase ID"})),
        )
            .into_response(),
    }
}

pub async fn delete_phase_handler(
    pool: axum::extract::Extension<DbPool>,
    Path(id): Path<String>,
) -> impl IntoResponse {
    match Uuid::parse_str(&id) {
        Ok(uuid) => match ProjectRepo::delete_phase(&pool, uuid).await {
            Ok(true) => StatusCode::NO_CONTENT.into_response(),
            Ok(false) => (
                StatusCode::NOT_FOUND,
                Json(json!({"error": "Phase not found"})),
            )
                .into_response(),
            Err(e) => {
                tracing::error!("Failed to delete phase: {}", e);
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(json!({"error": "Failed to delete phase"})),
                )
                    .into_response()
            }
        },
        Err(_) => (
            StatusCode::BAD_REQUEST,
            Json(json!({"error": "Invalid phase ID"})),
        )
            .into_response(),
    }
}

pub async fn create_task_handler(
    pool: axum::extract::Extension<DbPool>,
    Path(project_id): Path<String>,
    Json(data): Json<CreateProjectTask>,
) -> impl IntoResponse {
    match Uuid::parse_str(&project_id) {
        Ok(uuid) => match ProjectRepo::create_task(&pool, uuid, data).await {
            Ok(task) => (StatusCode::CREATED, Json(task)).into_response(),
            Err(e) => {
                tracing::error!("Failed to create task: {}", e);
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(json!({"error": "Failed to create task"})),
                )
                    .into_response()
            }
        },
        Err(_) => (
            StatusCode::BAD_REQUEST,
            Json(json!({"error": "Invalid project ID"})),
        )
            .into_response(),
    }
}

pub async fn get_tasks_handler(
    pool: axum::extract::Extension<DbPool>,
    Path(project_id): Path<String>,
) -> impl IntoResponse {
    match Uuid::parse_str(&project_id) {
        Ok(uuid) => match ProjectRepo::get_tasks_by_project(&pool, uuid).await {
            Ok(tasks) => (StatusCode::OK, Json(tasks)).into_response(),
            Err(e) => {
                tracing::error!("Failed to get tasks: {}", e);
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(json!({"error": "Failed to get tasks"})),
                )
                    .into_response()
            }
        },
        Err(_) => (
            StatusCode::BAD_REQUEST,
            Json(json!({"error": "Invalid project ID"})),
        )
            .into_response(),
    }
}

pub async fn get_task_handler(
    pool: axum::extract::Extension<DbPool>,
    Path(id): Path<String>,
) -> impl IntoResponse {
    match Uuid::parse_str(&id) {
        Ok(uuid) => match ProjectRepo::get_task_by_id(&pool, uuid).await {
            Ok(Some(task)) => (StatusCode::OK, Json(task)).into_response(),
            Ok(None) => (
                StatusCode::NOT_FOUND,
                Json(json!({"error": "Task not found"})),
            )
                .into_response(),
            Err(e) => {
                tracing::error!("Failed to get task: {}", e);
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(json!({"error": "Failed to get task"})),
                )
                    .into_response()
            }
        },
        Err(_) => (
            StatusCode::BAD_REQUEST,
            Json(json!({"error": "Invalid task ID"})),
        )
            .into_response(),
    }
}

pub async fn update_task_handler(
    pool: axum::extract::Extension<DbPool>,
    Path(id): Path<String>,
    Json(data): Json<UpdateProjectTask>,
) -> impl IntoResponse {
    match Uuid::parse_str(&id) {
        Ok(uuid) => match ProjectRepo::update_task(&pool, uuid, data).await {
            Ok(Some(task)) => (StatusCode::OK, Json(task)).into_response(),
            Ok(None) => (
                StatusCode::NOT_FOUND,
                Json(json!({"error": "Task not found"})),
            )
                .into_response(),
            Err(e) => {
                tracing::error!("Failed to update task: {}", e);
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(json!({"error": "Failed to update task"})),
                )
                    .into_response()
            }
        },
        Err(_) => (
            StatusCode::BAD_REQUEST,
            Json(json!({"error": "Invalid task ID"})),
        )
            .into_response(),
    }
}

pub async fn delete_task_handler(
    pool: axum::extract::Extension<DbPool>,
    Path(id): Path<String>,
) -> impl IntoResponse {
    match Uuid::parse_str(&id) {
        Ok(uuid) => match ProjectRepo::delete_task(&pool, uuid).await {
            Ok(true) => StatusCode::NO_CONTENT.into_response(),
            Ok(false) => (
                StatusCode::NOT_FOUND,
                Json(json!({"error": "Task not found"})),
            )
                .into_response(),
            Err(e) => {
                tracing::error!("Failed to delete task: {}", e);
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(json!({"error": "Failed to delete task"})),
                )
                    .into_response()
            }
        },
        Err(_) => (
            StatusCode::BAD_REQUEST,
            Json(json!({"error": "Invalid task ID"})),
        )
            .into_response(),
    }
}

pub async fn add_team_member_handler(
    pool: axum::extract::Extension<DbPool>,
    Path(project_id): Path<String>,
    Json(data): Json<CreateProjectTeam>,
) -> impl IntoResponse {
    match Uuid::parse_str(&project_id) {
        Ok(uuid) => match ProjectRepo::add_team_member(&pool, uuid, data).await {
            Ok(member) => (StatusCode::CREATED, Json(member)).into_response(),
            Err(e) => {
                tracing::error!("Failed to add team member: {}", e);
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(json!({"error": "Failed to add team member"})),
                )
                    .into_response()
            }
        },
        Err(_) => (
            StatusCode::BAD_REQUEST,
            Json(json!({"error": "Invalid project ID"})),
        )
            .into_response(),
    }
}

pub async fn get_team_handler(
    pool: axum::extract::Extension<DbPool>,
    Path(project_id): Path<String>,
) -> impl IntoResponse {
    match Uuid::parse_str(&project_id) {
        Ok(uuid) => match ProjectRepo::get_team_by_project(&pool, uuid).await {
            Ok(team) => (StatusCode::OK, Json(team)).into_response(),
            Err(e) => {
                tracing::error!("Failed to get team: {}", e);
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(json!({"error": "Failed to get team"})),
                )
                    .into_response()
            }
        },
        Err(_) => (
            StatusCode::BAD_REQUEST,
            Json(json!({"error": "Invalid project ID"})),
        )
            .into_response(),
    }
}

pub async fn update_team_member_handler(
    pool: axum::extract::Extension<DbPool>,
    Path(id): Path<String>,
    Json(data): Json<UpdateProjectTeam>,
) -> impl IntoResponse {
    match Uuid::parse_str(&id) {
        Ok(uuid) => match ProjectRepo::update_team_member(&pool, uuid, data).await {
            Ok(Some(member)) => (StatusCode::OK, Json(member)).into_response(),
            Ok(None) => (
                StatusCode::NOT_FOUND,
                Json(json!({"error": "Team member not found"})),
            )
                .into_response(),
            Err(e) => {
                tracing::error!("Failed to update team member: {}", e);
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(json!({"error": "Failed to update team member"})),
                )
                    .into_response()
            }
        },
        Err(_) => (
            StatusCode::BAD_REQUEST,
            Json(json!({"error": "Invalid team member ID"})),
        )
            .into_response(),
    }
}

pub async fn remove_team_member_handler(
    pool: axum::extract::Extension<DbPool>,
    Path(id): Path<String>,
) -> impl IntoResponse {
    match Uuid::parse_str(&id) {
        Ok(uuid) => match ProjectRepo::remove_team_member(&pool, uuid).await {
            Ok(true) => StatusCode::NO_CONTENT.into_response(),
            Ok(false) => (
                StatusCode::NOT_FOUND,
                Json(json!({"error": "Team member not found"})),
            )
                .into_response(),
            Err(e) => {
                tracing::error!("Failed to remove team member: {}", e);
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(json!({"error": "Failed to remove team member"})),
                )
                    .into_response()
            }
        },
        Err(_) => (
            StatusCode::BAD_REQUEST,
            Json(json!({"error": "Invalid team member ID"})),
        )
            .into_response(),
    }
}

pub async fn create_milestone_handler(
    pool: axum::extract::Extension<DbPool>,
    Path(project_id): Path<String>,
    Json(data): Json<CreateProjectMilestone>,
) -> impl IntoResponse {
    match Uuid::parse_str(&project_id) {
        Ok(uuid) => match ProjectRepo::create_milestone(&pool, uuid, data).await {
            Ok(milestone) => (StatusCode::CREATED, Json(milestone)).into_response(),
            Err(e) => {
                tracing::error!("Failed to create milestone: {}", e);
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(json!({"error": "Failed to create milestone"})),
                )
                    .into_response()
            }
        },
        Err(_) => (
            StatusCode::BAD_REQUEST,
            Json(json!({"error": "Invalid project ID"})),
        )
            .into_response(),
    }
}

pub async fn get_milestones_handler(
    pool: axum::extract::Extension<DbPool>,
    Path(project_id): Path<String>,
) -> impl IntoResponse {
    match Uuid::parse_str(&project_id) {
        Ok(uuid) => match ProjectRepo::get_milestones_by_project(&pool, uuid).await {
            Ok(milestones) => (StatusCode::OK, Json(milestones)).into_response(),
            Err(e) => {
                tracing::error!("Failed to get milestones: {}", e);
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(json!({"error": "Failed to get milestones"})),
                )
                    .into_response()
            }
        },
        Err(_) => (
            StatusCode::BAD_REQUEST,
            Json(json!({"error": "Invalid project ID"})),
        )
            .into_response(),
    }
}

pub async fn update_milestone_handler(
    pool: axum::extract::Extension<DbPool>,
    Path(id): Path<String>,
    Json(data): Json<UpdateProjectMilestone>,
) -> impl IntoResponse {
    match Uuid::parse_str(&id) {
        Ok(uuid) => match ProjectRepo::update_milestone(&pool, uuid, data).await {
            Ok(Some(milestone)) => (StatusCode::OK, Json(milestone)).into_response(),
            Ok(None) => (
                StatusCode::NOT_FOUND,
                Json(json!({"error": "Milestone not found"})),
            )
                .into_response(),
            Err(e) => {
                tracing::error!("Failed to update milestone: {}", e);
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(json!({"error": "Failed to update milestone"})),
                )
                    .into_response()
            }
        },
        Err(_) => (
            StatusCode::BAD_REQUEST,
            Json(json!({"error": "Invalid milestone ID"})),
        )
            .into_response(),
    }
}

pub async fn delete_milestone_handler(
    pool: axum::extract::Extension<DbPool>,
    Path(id): Path<String>,
) -> impl IntoResponse {
    match Uuid::parse_str(&id) {
        Ok(uuid) => match ProjectRepo::delete_milestone(&pool, uuid).await {
            Ok(true) => StatusCode::NO_CONTENT.into_response(),
            Ok(false) => (
                StatusCode::NOT_FOUND,
                Json(json!({"error": "Milestone not found"})),
            )
                .into_response(),
            Err(e) => {
                tracing::error!("Failed to delete milestone: {}", e);
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(json!({"error": "Failed to delete milestone"})),
                )
                    .into_response()
            }
        },
        Err(_) => (
            StatusCode::BAD_REQUEST,
            Json(json!({"error": "Invalid milestone ID"})),
        )
            .into_response(),
    }
}

pub async fn create_risk_handler(
    pool: axum::extract::Extension<DbPool>,
    Path(project_id): Path<String>,
    Json(data): Json<CreateProjectRisk>,
) -> impl IntoResponse {
    match Uuid::parse_str(&project_id) {
        Ok(uuid) => match ProjectRepo::create_risk(&pool, uuid, data).await {
            Ok(risk) => (StatusCode::CREATED, Json(risk)).into_response(),
            Err(e) => {
                tracing::error!("Failed to create risk: {}", e);
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(json!({"error": "Failed to create risk"})),
                )
                    .into_response()
            }
        },
        Err(_) => (
            StatusCode::BAD_REQUEST,
            Json(json!({"error": "Invalid project ID"})),
        )
            .into_response(),
    }
}

pub async fn get_risks_handler(
    pool: axum::extract::Extension<DbPool>,
    Path(project_id): Path<String>,
) -> impl IntoResponse {
    match Uuid::parse_str(&project_id) {
        Ok(uuid) => match ProjectRepo::get_risks_by_project(&pool, uuid).await {
            Ok(risks) => (StatusCode::OK, Json(risks)).into_response(),
            Err(e) => {
                tracing::error!("Failed to get risks: {}", e);
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(json!({"error": "Failed to get risks"})),
                )
                    .into_response()
            }
        },
        Err(_) => (
            StatusCode::BAD_REQUEST,
            Json(json!({"error": "Invalid project ID"})),
        )
            .into_response(),
    }
}

pub async fn update_risk_handler(
    pool: axum::extract::Extension<DbPool>,
    Path(id): Path<String>,
    Json(data): Json<UpdateProjectRisk>,
) -> impl IntoResponse {
    match Uuid::parse_str(&id) {
        Ok(uuid) => match ProjectRepo::update_risk(&pool, uuid, data).await {
            Ok(Some(risk)) => (StatusCode::OK, Json(risk)).into_response(),
            Ok(None) => (
                StatusCode::NOT_FOUND,
                Json(json!({"error": "Risk not found"})),
            )
                .into_response(),
            Err(e) => {
                tracing::error!("Failed to update risk: {}", e);
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(json!({"error": "Failed to update risk"})),
                )
                    .into_response()
            }
        },
        Err(_) => (
            StatusCode::BAD_REQUEST,
            Json(json!({"error": "Invalid risk ID"})),
        )
            .into_response(),
    }
}

pub async fn delete_risk_handler(
    pool: axum::extract::Extension<DbPool>,
    Path(id): Path<String>,
) -> impl IntoResponse {
    match Uuid::parse_str(&id) {
        Ok(uuid) => match ProjectRepo::delete_risk(&pool, uuid).await {
            Ok(true) => StatusCode::NO_CONTENT.into_response(),
            Ok(false) => (
                StatusCode::NOT_FOUND,
                Json(json!({"error": "Risk not found"})),
            )
                .into_response(),
            Err(e) => {
                tracing::error!("Failed to delete risk: {}", e);
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(json!({"error": "Failed to delete risk"})),
                )
                    .into_response()
            }
        },
        Err(_) => (
            StatusCode::BAD_REQUEST,
            Json(json!({"error": "Invalid risk ID"})),
        )
            .into_response(),
    }
}

pub async fn create_issue_handler(
    pool: axum::extract::Extension<DbPool>,
    Path(project_id): Path<String>,
    Json(data): Json<CreateProjectIssue>,
) -> impl IntoResponse {
    match Uuid::parse_str(&project_id) {
        Ok(uuid) => match ProjectRepo::create_issue(&pool, uuid, data).await {
            Ok(issue) => (StatusCode::CREATED, Json(issue)).into_response(),
            Err(e) => {
                tracing::error!("Failed to create issue: {}", e);
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(json!({"error": "Failed to create issue"})),
                )
                    .into_response()
            }
        },
        Err(_) => (
            StatusCode::BAD_REQUEST,
            Json(json!({"error": "Invalid project ID"})),
        )
            .into_response(),
    }
}

pub async fn get_issues_handler(
    pool: axum::extract::Extension<DbPool>,
    Path(project_id): Path<String>,
) -> impl IntoResponse {
    match Uuid::parse_str(&project_id) {
        Ok(uuid) => match ProjectRepo::get_issues_by_project(&pool, uuid).await {
            Ok(issues) => (StatusCode::OK, Json(issues)).into_response(),
            Err(e) => {
                tracing::error!("Failed to get issues: {}", e);
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(json!({"error": "Failed to get issues"})),
                )
                    .into_response()
            }
        },
        Err(_) => (
            StatusCode::BAD_REQUEST,
            Json(json!({"error": "Invalid project ID"})),
        )
            .into_response(),
    }
}

pub async fn update_issue_handler(
    pool: axum::extract::Extension<DbPool>,
    Path(id): Path<String>,
    Json(data): Json<UpdateProjectIssue>,
) -> impl IntoResponse {
    match Uuid::parse_str(&id) {
        Ok(uuid) => match ProjectRepo::update_issue(&pool, uuid, data).await {
            Ok(Some(issue)) => (StatusCode::OK, Json(issue)).into_response(),
            Ok(None) => (
                StatusCode::NOT_FOUND,
                Json(json!({"error": "Issue not found"})),
            )
                .into_response(),
            Err(e) => {
                tracing::error!("Failed to update issue: {}", e);
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(json!({"error": "Failed to update issue"})),
                )
                    .into_response()
            }
        },
        Err(_) => (
            StatusCode::BAD_REQUEST,
            Json(json!({"error": "Invalid issue ID"})),
        )
            .into_response(),
    }
}

pub async fn delete_issue_handler(
    pool: axum::extract::Extension<DbPool>,
    Path(id): Path<String>,
) -> impl IntoResponse {
    match Uuid::parse_str(&id) {
        Ok(uuid) => match ProjectRepo::delete_issue(&pool, uuid).await {
            Ok(true) => StatusCode::NO_CONTENT.into_response(),
            Ok(false) => (
                StatusCode::NOT_FOUND,
                Json(json!({"error": "Issue not found"})),
            )
                .into_response(),
            Err(e) => {
                tracing::error!("Failed to delete issue: {}", e);
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(json!({"error": "Failed to delete issue"})),
                )
                    .into_response()
            }
        },
        Err(_) => (
            StatusCode::BAD_REQUEST,
            Json(json!({"error": "Invalid issue ID"})),
        )
            .into_response(),
    }
}

pub async fn add_cost_handler(
    pool: axum::extract::Extension<DbPool>,
    Path(project_id): Path<String>,
    Json(data): Json<CreateProjectCost>,
) -> impl IntoResponse {
    match Uuid::parse_str(&project_id) {
        Ok(uuid) => match ProjectRepo::add_cost(&pool, uuid, data).await {
            Ok(cost) => (StatusCode::CREATED, Json(cost)).into_response(),
            Err(e) => {
                tracing::error!("Failed to add cost: {}", e);
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(json!({"error": "Failed to add cost"})),
                )
                    .into_response()
            }
        },
        Err(_) => (
            StatusCode::BAD_REQUEST,
            Json(json!({"error": "Invalid project ID"})),
        )
            .into_response(),
    }
}

pub async fn get_costs_handler(
    pool: axum::extract::Extension<DbPool>,
    Path(project_id): Path<String>,
) -> impl IntoResponse {
    match Uuid::parse_str(&project_id) {
        Ok(uuid) => match ProjectRepo::get_costs_by_project(&pool, uuid).await {
            Ok(costs) => (StatusCode::OK, Json(costs)).into_response(),
            Err(e) => {
                tracing::error!("Failed to get costs: {}", e);
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(json!({"error": "Failed to get costs"})),
                )
                    .into_response()
            }
        },
        Err(_) => (
            StatusCode::BAD_REQUEST,
            Json(json!({"error": "Invalid project ID"})),
        )
            .into_response(),
    }
}

pub async fn delete_cost_handler(
    pool: axum::extract::Extension<DbPool>,
    Path(id): Path<String>,
) -> impl IntoResponse {
    match Uuid::parse_str(&id) {
        Ok(uuid) => match ProjectRepo::delete_cost(&pool, uuid).await {
            Ok(true) => StatusCode::NO_CONTENT.into_response(),
            Ok(false) => (
                StatusCode::NOT_FOUND,
                Json(json!({"error": "Cost not found"})),
            )
                .into_response(),
            Err(e) => {
                tracing::error!("Failed to delete cost: {}", e);
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(json!({"error": "Failed to delete cost"})),
                )
                    .into_response()
            }
        },
        Err(_) => (
            StatusCode::BAD_REQUEST,
            Json(json!({"error": "Invalid cost ID"})),
        )
            .into_response(),
    }
}