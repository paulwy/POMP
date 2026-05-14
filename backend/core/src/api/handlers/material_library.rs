use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    response::IntoResponse,
    Json,
};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tracing::info;
use uuid::Uuid;

use crate::{
    db::material_library::{
        create_material, delete_material, get_material, list_materials, update_material,
        CreateMaterialItem, MaterialItem, MaterialListResponse, MaterialSearchParams,
        UpdateMaterialItem,
    },
    errors::ApiResponse,
    services::content_crawler::{ContentCrawlerService, CrawlRequest, CrawlResult},
    state::AppState,
};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateMaterialRequest {
    pub name: String,
    pub material_type: String,
    pub category: Option<String>,
    pub content: Option<String>,
    pub url: Option<String>,
    pub description: Option<String>,
    pub tags: Option<Vec<String>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateMaterialRequest {
    pub name: Option<String>,
    pub category: Option<String>,
    pub description: Option<String>,
    pub tags: Option<Vec<String>>,
    pub is_favorite: Option<bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MaterialQueryParams {
    pub material_type: Option<String>,
    pub category: Option<String>,
    pub keyword: Option<String>,
    #[serde(default = "default_page")]
    pub page: i64,
    #[serde(default = "default_page_size")]
    pub page_size: i64,
}

fn default_page() -> i64 {
    1
}

fn default_page_size() -> i64 {
    10
}

pub async fn create_material_handler(
    State(state): State<Arc<AppState>>,
    Json(request): Json<CreateMaterialRequest>,
) -> impl IntoResponse {
    let create_item = CreateMaterialItem {
        name: request.name,
        material_type: request.material_type,
        category: request.category,
        content: request.content,
        url: request.url,
        file_path: None,
        file_size: None,
        file_type: None,
        description: request.description,
        tags: request.tags,
        source_url: None,
        ai_summary: None,
        created_by: None,
    };

    match create_material(&state.db, create_item).await {
        Ok(material) => {
            info!("素材创建成功: {}", material.id);
            (StatusCode::CREATED, Json(ApiResponse::success(material)))
        }
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ApiResponse::<MaterialItem>::error(e)),
        ),
    }
}

pub async fn get_material_handler(
    State(state): State<Arc<AppState>>,
    Path(id): Path<Uuid>,
) -> impl IntoResponse {
    match get_material(&state.db, id).await {
        Ok(Some(material)) => (StatusCode::OK, Json(ApiResponse::success(material))),
        Ok(None) => (
            StatusCode::NOT_FOUND,
            Json(ApiResponse::<MaterialItem>::error("素材不存在")),
        ),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ApiResponse::<MaterialItem>::error(e)),
        ),
    }
}

pub async fn list_materials_handler(
    State(state): State<Arc<AppState>>,
    Query(query): Query<MaterialQueryParams>,
) -> impl IntoResponse {
    let params = MaterialSearchParams {
        material_type: query.material_type,
        category: query.category,
        keyword: query.keyword,
        page: query.page,
        page_size: query.page_size,
    };

    match list_materials(&state.db, params).await {
        Ok(result) => (StatusCode::OK, Json(ApiResponse::success(result))),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ApiResponse::<MaterialListResponse>::error(e)),
        ),
    }
}

pub async fn update_material_handler(
    State(state): State<Arc<AppState>>,
    Path(id): Path<Uuid>,
    Json(request): Json<UpdateMaterialRequest>,
) -> impl IntoResponse {
    let update_item = UpdateMaterialItem {
        name: request.name,
        category: request.category,
        description: request.description,
        tags: request.tags,
        is_favorite: request.is_favorite,
    };

    match update_material(&state.db, id, update_item).await {
        Ok(Some(material)) => (StatusCode::OK, Json(ApiResponse::success(material))),
        Ok(None) => (
            StatusCode::NOT_FOUND,
            Json(ApiResponse::<MaterialItem>::error("素材不存在")),
        ),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ApiResponse::<MaterialItem>::error(e)),
        ),
    }
}

pub async fn delete_material_handler(
    State(state): State<Arc<AppState>>,
    Path(id): Path<Uuid>,
) -> impl IntoResponse {
    match delete_material(&state.db, id).await {
        Ok(true) => (
            StatusCode::OK,
            Json(ApiResponse::success("删除成功".to_string())),
        ),
        Ok(false) => (
            StatusCode::NOT_FOUND,
            Json(ApiResponse::<String>::error("素材不存在")),
        ),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ApiResponse::<String>::error(e)),
        ),
    }
}

pub async fn crawl_url_handler(
    State(_state): State<Arc<AppState>>,
    Json(request): Json<CrawlRequest>,
) -> impl IntoResponse {
    info!("抓取URL: {}", request.url);

    let crawler = ContentCrawlerService::new();

    match crawler.crawl_url(request).await {
        Ok(result) => {
            info!("抓取成功");
            (StatusCode::OK, Json(ApiResponse::success(result)))
        }
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ApiResponse::<CrawlResult>::error(e)),
        ),
    }
}
