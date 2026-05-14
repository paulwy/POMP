use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    response::IntoResponse,
    routing::{delete, get, patch, post},
    Json, Router,
};
use serde::Deserialize;
use std::sync::Arc;
use uuid::Uuid;

use crate::db::workflow::*;
use crate::db::DbPool;
use crate::error::AppError;
use crate::services::workflow_service;

pub fn router() -> Router<Arc<DbPool>> {
    Router::new()
        .route("/definitions", get(get_workflow_definitions).post(create_workflow_definition))
        .route("/definitions/:id", get(get_workflow_definition).patch(update_workflow_definition).delete(delete_workflow_definition))
        .route("/definitions/:id/nodes", get(get_workflow_nodes).post(create_workflow_node))
        .route("/nodes/:id", patch(update_workflow_node).delete(delete_workflow_node))
}

#[derive(Deserialize)]
struct GetDefinitionsQuery {
    business_type: Option<String>,
    is_active: Option<bool>,
}

async fn get_workflow_definitions(
    State(pool): State<Arc<DbPool>>,
    Query(query): Query<GetDefinitionsQuery>,
) -> Result<Json<Vec<WorkflowDefinition>>, AppError> {
    let definitions = workflow_service::get_workflow_definitions(
        &pool,
        query.business_type.as_deref(),
        query.is_active,
    )
    .await?;

    Ok(Json(definitions))
}

async fn get_workflow_definition(
    State(pool): State<Arc<DbPool>>,
    Path(id): Path<Uuid>,
) -> Result<Json<WorkflowDefinition>, AppError> {
    let definition = workflow_service::get_workflow_definition_by_id(&pool, id).await?;

    Ok(Json(definition))
}

async fn create_workflow_definition(
    State(pool): State<Arc<DbPool>>,
    Json(data): Json<CreateWorkflowDefinition>,
) -> Result<(StatusCode, Json<WorkflowDefinition>), AppError> {
    let definition = workflow_service::create_workflow_definition(&pool, data).await?;

    Ok((StatusCode::CREATED, Json(definition)))
}

async fn update_workflow_definition(
    State(pool): State<Arc<DbPool>>,
    Path(id): Path<Uuid>,
    Json(data): Json<UpdateWorkflowDefinition>,
) -> Result<Json<WorkflowDefinition>, AppError> {
    let definition = workflow_service::update_workflow_definition(&pool, id, data).await?;

    Ok(Json(definition))
}

async fn delete_workflow_definition(
    State(pool): State<Arc<DbPool>>,
    Path(id): Path<Uuid>,
) -> Result<impl IntoResponse, AppError> {
    workflow_service::delete_workflow_definition(&pool, id).await?;

    Ok(StatusCode::NO_CONTENT)
}

async fn get_workflow_nodes(
    State(pool): State<Arc<DbPool>>,
    Path(id): Path<Uuid>,
) -> Result<Json<Vec<WorkflowNode>>, AppError> {
    let nodes = workflow_service::get_workflow_nodes(&pool, id).await?;

    Ok(Json(nodes))
}

async fn create_workflow_node(
    State(pool): State<Arc<DbPool>>,
    Path(_): Path<Uuid>,
    Json(data): Json<CreateWorkflowNode>,
) -> Result<(StatusCode, Json<WorkflowNode>), AppError> {
    let node = workflow_service::create_workflow_node(&pool, data).await?;

    Ok((StatusCode::CREATED, Json(node)))
}

async fn update_workflow_node(
    State(pool): State<Arc<DbPool>>,
    Path(id): Path<Uuid>,
    Json(data): Json<UpdateWorkflowNode>,
) -> Result<Json<WorkflowNode>, AppError> {
    let node = workflow_service::update_workflow_node(&pool, id, data).await?;

    Ok(Json(node))
}

async fn delete_workflow_node(
    State(pool): State<Arc<DbPool>>,
    Path(id): Path<Uuid>,
) -> Result<impl IntoResponse, AppError> {
    workflow_service::delete_workflow_node(&pool, id).await?;

    Ok(StatusCode::NO_CONTENT)
}
