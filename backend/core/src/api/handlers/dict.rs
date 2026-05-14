use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    response::IntoResponse,
    Json,
};
use serde::Deserialize;
use std::sync::Arc;
use uuid::Uuid;

use crate::db::dict::{CreateDictItem, CreateDictType, UpdateDictItem, UpdateDictType};
use crate::errors::ApiResponse;
use crate::state::AppState;

#[derive(Debug, Deserialize)]
pub struct DictQuery {
    pub category: Option<String>,
    pub is_active: Option<bool>,
}

#[derive(Debug, Deserialize)]
pub struct DictItemQuery {
    pub dict_type_id: Option<String>,
}

pub async fn get_dict_categories_handler(
    State(state): State<Arc<AppState>>,
    Query(query): Query<DictQuery>,
) -> impl IntoResponse {
    match state
        .dict_service
        .get_dict_types(query.category, query.is_active)
        .await
    {
        Ok(dicts) => (StatusCode::OK, Json(ApiResponse::success(dicts))),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ApiResponse::error(e.to_string())),
        ),
    }
}

pub async fn create_dict_category_handler(
    State(state): State<Arc<AppState>>,
    Json(data): Json<CreateDictType>,
) -> impl IntoResponse {
    match state.dict_service.create_dict_type(data).await {
        Ok(dict) => (StatusCode::CREATED, Json(ApiResponse::success(dict))),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ApiResponse::error(e.to_string())),
        ),
    }
}

pub async fn get_dict_category_by_code_handler(
    State(state): State<Arc<AppState>>,
    Path(code): Path<String>,
) -> impl IntoResponse {
    match state.dict_service.get_dict_items_by_code(&code).await {
        Ok(items) => (StatusCode::OK, Json(ApiResponse::success(items))),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ApiResponse::error(e.to_string())),
        ),
    }
}

pub async fn get_dict_type_handler(
    State(state): State<Arc<AppState>>,
    Path(id): Path<Uuid>,
) -> impl IntoResponse {
    match state.dict_service.get_dict_type(id).await {
        Ok(dict) => (StatusCode::OK, Json(ApiResponse::success(dict))),
        Err(e) => (
            StatusCode::NOT_FOUND,
            Json(ApiResponse::error(e.to_string())),
        ),
    }
}

pub async fn get_dict_type_with_items_handler(
    State(state): State<Arc<AppState>>,
    Path(id): Path<Uuid>,
) -> impl IntoResponse {
    match state.dict_service.get_dict_type_with_items(id).await {
        Ok(result) => (StatusCode::OK, Json(ApiResponse::success(result))),
        Err(e) => (
            StatusCode::NOT_FOUND,
            Json(ApiResponse::error(e.to_string())),
        ),
    }
}

pub async fn update_dict_type_handler(
    State(state): State<Arc<AppState>>,
    Path(id): Path<Uuid>,
    Json(data): Json<UpdateDictType>,
) -> impl IntoResponse {
    match state.dict_service.update_dict_type(id, data).await {
        Ok(dict) => (StatusCode::OK, Json(ApiResponse::success(dict))),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ApiResponse::error(e.to_string())),
        ),
    }
}

pub async fn delete_dict_type_handler(
    State(state): State<Arc<AppState>>,
    Path(id): Path<Uuid>,
) -> impl IntoResponse {
    match state.dict_service.delete_dict_type(id).await {
        Ok(()) => (StatusCode::OK, Json(ApiResponse::success(()))),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ApiResponse::error(e.to_string())),
        ),
    }
}

pub async fn get_dict_items_handler(
    State(state): State<Arc<AppState>>,
    Query(query): Query<DictItemQuery>,
) -> impl IntoResponse {
    let result = if let Some(dict_type_id) = query.dict_type_id {
        if let Ok(uuid) = Uuid::parse_str(&dict_type_id) {
            state.dict_service.get_dict_items_by_type(uuid).await
        } else {
            state
                .dict_service
                .get_dict_items_by_code(&dict_type_id)
                .await
        }
    } else {
        Ok(vec![])
    };

    match result {
        Ok(items) => (StatusCode::OK, Json(ApiResponse::success(items))),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ApiResponse::error(e.to_string())),
        ),
    }
}

pub async fn get_dict_items_by_category_handler(
    State(state): State<Arc<AppState>>,
    Path(code): Path<String>,
) -> impl IntoResponse {
    match state.dict_service.get_dict_items_by_code(&code).await {
        Ok(items) => (StatusCode::OK, Json(ApiResponse::success(items))),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ApiResponse::error(e.to_string())),
        ),
    }
}

pub async fn create_dict_item_handler(
    State(state): State<Arc<AppState>>,
    Json(data): Json<CreateDictItem>,
) -> impl IntoResponse {
    match state.dict_service.create_dict_item(data).await {
        Ok(item) => (StatusCode::CREATED, Json(ApiResponse::success(item))),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ApiResponse::error(e.to_string())),
        ),
    }
}

pub async fn update_dict_item_handler(
    State(state): State<Arc<AppState>>,
    Path(id): Path<Uuid>,
    Json(data): Json<UpdateDictItem>,
) -> impl IntoResponse {
    match state.dict_service.update_dict_item(id, data).await {
        Ok(item) => (StatusCode::OK, Json(ApiResponse::success(item))),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ApiResponse::error(e.to_string())),
        ),
    }
}

pub async fn delete_dict_item_handler(
    State(state): State<Arc<AppState>>,
    Path(id): Path<Uuid>,
) -> impl IntoResponse {
    match state.dict_service.delete_dict_item(id).await {
        Ok(()) => (StatusCode::OK, Json(ApiResponse::success(()))),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ApiResponse::error(e.to_string())),
        ),
    }
}

pub async fn get_all_dicts_handler(State(state): State<Arc<AppState>>) -> impl IntoResponse {
    match state.dict_service.get_all_active_dict_types().await {
        Ok(result) => (StatusCode::OK, Json(ApiResponse::success(result))),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ApiResponse::error(e.to_string())),
        ),
    }
}

pub async fn init_default_dicts_handler(State(state): State<Arc<AppState>>) -> impl IntoResponse {
    match state.dict_service.init_default_dicts().await {
        Ok(()) => (StatusCode::OK, Json(ApiResponse::success(()))),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ApiResponse::error(e.to_string())),
        ),
    }
}
