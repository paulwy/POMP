use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    response::IntoResponse,
    Json,
};
use serde::Deserialize;
use std::sync::Arc;
use uuid::Uuid;

use crate::db::contract::{
    Contract, ContractTemplate, CreateContract, CreateContractTemplate,
    UpdateContract, UpdateContractTemplate,
};
use crate::db::contract_repo;
use crate::errors::{ApiResponse, AppError};
use crate::AppState;

#[derive(Deserialize)]
pub struct GetTemplatesQuery {
    contract_type: Option<String>,
    category: Option<String>,
    is_active: Option<bool>,
}

pub async fn get_contract_templates(
    State(state): State<Arc<AppState>>,
    Query(query): Query<GetTemplatesQuery>,
) -> Result<Json<ApiResponse<Vec<ContractTemplate>>>, AppError> {
    let templates = contract_repo::get_contract_templates(
        &state.db,
        query.contract_type.as_deref(),
        query.category.as_deref(),
        query.is_active,
    )
    .await
    .map_err(AppError::DatabaseError)?;

    Ok(Json(ApiResponse::success(templates)))
}

pub async fn get_contract_template(
    State(state): State<Arc<AppState>>,
    Path(id): Path<Uuid>,
) -> Result<Json<ApiResponse<ContractTemplate>>, AppError> {
    let template = contract_repo::get_contract_template_by_id(&state.db, id)
        .await
        .map_err(AppError::DatabaseError)?;

    match template {
        Some(t) => Ok(Json(ApiResponse::success(t))),
        None => Err(AppError::NotFound("Contract template not found".to_string())),
    }
}

pub async fn create_contract_template(
    State(state): State<Arc<AppState>>,
    Json(data): Json<CreateContractTemplate>,
) -> Result<(StatusCode, Json<ApiResponse<ContractTemplate>>), AppError> {
    let template = contract_repo::create_contract_template(&state.db, data)
        .await
        .map_err(AppError::DatabaseError)?;

    Ok((StatusCode::CREATED, Json(ApiResponse::success(template))))
}

pub async fn update_contract_template(
    State(state): State<Arc<AppState>>,
    Path(id): Path<Uuid>,
    Json(data): Json<UpdateContractTemplate>,
) -> Result<Json<ApiResponse<ContractTemplate>>, AppError> {
    let template = contract_repo::update_contract_template(&state.db, id, data)
        .await
        .map_err(AppError::DatabaseError)?;

    Ok(Json(ApiResponse::success(template)))
}

pub async fn delete_contract_template(
    State(state): State<Arc<AppState>>,
    Path(id): Path<Uuid>,
) -> Result<impl IntoResponse, AppError> {
    contract_repo::delete_contract_template(&state.db, id)
        .await
        .map_err(AppError::DatabaseError)?;

    Ok(StatusCode::NO_CONTENT)
}

#[derive(Deserialize)]
pub struct GetContractsQuery {
    status: Option<String>,
    contract_type: Option<String>,
    category: Option<String>,
    page: Option<i32>,
    page_size: Option<i32>,
}

pub async fn get_contracts(
    State(state): State<Arc<AppState>>,
    Query(query): Query<GetContractsQuery>,
) -> Result<Json<ApiResponse<Vec<Contract>>>, AppError> {
    let contracts = contract_repo::get_contracts(
        &state.db,
        query.status.as_deref(),
        query.contract_type.as_deref(),
        query.category.as_deref(),
        query.page,
        query.page_size,
    )
    .await
    .map_err(AppError::DatabaseError)?;

    Ok(Json(ApiResponse::success(contracts)))
}

pub async fn get_contract(
    State(state): State<Arc<AppState>>,
    Path(id): Path<Uuid>,
) -> Result<Json<ApiResponse<Contract>>, AppError> {
    let contract = contract_repo::get_contract_by_id(&state.db, id)
        .await
        .map_err(AppError::DatabaseError)?;

    match contract {
        Some(c) => Ok(Json(ApiResponse::success(c))),
        None => Err(AppError::NotFound("Contract not found".to_string())),
    }
}

pub async fn create_contract(
    State(state): State<Arc<AppState>>,
    Json(data): Json<CreateContract>,
) -> Result<(StatusCode, Json<ApiResponse<Contract>>), AppError> {
    let contract = contract_repo::create_contract(&state.db, data)
        .await
        .map_err(AppError::DatabaseError)?;

    Ok((StatusCode::CREATED, Json(ApiResponse::success(contract))))
}

pub async fn update_contract(
    State(state): State<Arc<AppState>>,
    Path(id): Path<Uuid>,
    Json(data): Json<UpdateContract>,
) -> Result<Json<ApiResponse<Contract>>, AppError> {
    let contract = contract_repo::update_contract(&state.db, id, data)
        .await
        .map_err(AppError::DatabaseError)?;

    Ok(Json(ApiResponse::success(contract)))
}

pub async fn delete_contract(
    State(state): State<Arc<AppState>>,
    Path(id): Path<Uuid>,
) -> Result<impl IntoResponse, AppError> {
    contract_repo::delete_contract(&state.db, id)
        .await
        .map_err(AppError::DatabaseError)?;

    Ok(StatusCode::NO_CONTENT)
}
