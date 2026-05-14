use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    response::IntoResponse,
    Json,
};
use serde::Deserialize;
use std::sync::Arc;
use uuid::Uuid;

use crate::db::help::{
    CreateHelpArticle, CreateHelpCategory, UpdateHelpArticle, UpdateHelpCategory,
};
use crate::errors::ApiResponse;
use crate::state::AppState;

#[derive(Debug, Deserialize)]
pub struct HelpSearchQuery {
    pub keyword: Option<String>,
    pub category_id: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct ArticleQuery {
    pub category_id: Option<String>,
    pub is_published: Option<bool>,
}

pub async fn get_categories_handler(State(state): State<Arc<AppState>>) -> impl IntoResponse {
    match state.help_service.get_categories(Some(true)).await {
        Ok(categories) => (StatusCode::OK, Json(ApiResponse::success(categories))),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ApiResponse::error(e.to_string())),
        ),
    }
}

pub async fn get_category_handler(
    State(state): State<Arc<AppState>>,
    Path(id): Path<Uuid>,
) -> impl IntoResponse {
    match state.help_service.get_category(id).await {
        Ok(category) => (StatusCode::OK, Json(ApiResponse::success(category))),
        Err(e) => (
            StatusCode::NOT_FOUND,
            Json(ApiResponse::error(e.to_string())),
        ),
    }
}

pub async fn get_category_with_articles_handler(
    State(state): State<Arc<AppState>>,
    Path(id): Path<Uuid>,
) -> impl IntoResponse {
    match state.help_service.get_category_with_articles(id).await {
        Ok(result) => (StatusCode::OK, Json(ApiResponse::success(result))),
        Err(e) => (
            StatusCode::NOT_FOUND,
            Json(ApiResponse::error(e.to_string())),
        ),
    }
}

pub async fn create_category_handler(
    State(state): State<Arc<AppState>>,
    Json(data): Json<CreateHelpCategory>,
) -> impl IntoResponse {
    match state.help_service.create_category(data).await {
        Ok(category) => (StatusCode::CREATED, Json(ApiResponse::success(category))),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ApiResponse::error(e.to_string())),
        ),
    }
}

pub async fn update_category_handler(
    State(state): State<Arc<AppState>>,
    Path(id): Path<Uuid>,
    Json(data): Json<UpdateHelpCategory>,
) -> impl IntoResponse {
    match state.help_service.update_category(id, data).await {
        Ok(category) => (StatusCode::OK, Json(ApiResponse::success(category))),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ApiResponse::error(e.to_string())),
        ),
    }
}

pub async fn delete_category_handler(
    State(state): State<Arc<AppState>>,
    Path(id): Path<Uuid>,
) -> impl IntoResponse {
    match state.help_service.delete_category(id).await {
        Ok(()) => (StatusCode::OK, Json(ApiResponse::success(()))),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ApiResponse::error(e.to_string())),
        ),
    }
}

pub async fn get_articles_handler(
    State(state): State<Arc<AppState>>,
    Query(query): Query<ArticleQuery>,
) -> impl IntoResponse {
    let result = if let Some(cat_id_str) = query.category_id {
        if let Ok(cat_id) = Uuid::parse_str(&cat_id_str) {
            state.help_service.get_articles_by_category(cat_id).await
        } else {
            state.help_service.get_all_articles().await
        }
    } else {
        state.help_service.get_all_articles().await
    };

    match result {
        Ok(articles) => (StatusCode::OK, Json(ApiResponse::success(articles))),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ApiResponse::error(e.to_string())),
        ),
    }
}

pub async fn get_article_handler(
    State(state): State<Arc<AppState>>,
    Path(id): Path<Uuid>,
) -> impl IntoResponse {
    match state.help_service.get_article(id).await {
        Ok(article) => {
            let _ = state.help_service.increment_view_count(id).await;
            (StatusCode::OK, Json(ApiResponse::success(article)))
        }
        Err(e) => (
            StatusCode::NOT_FOUND,
            Json(ApiResponse::error(e.to_string())),
        ),
    }
}

pub async fn get_article_by_slug_handler(
    State(state): State<Arc<AppState>>,
    Path(slug): Path<String>,
) -> impl IntoResponse {
    match state.help_service.get_article_by_slug(&slug).await {
        Ok(Some(article)) => (StatusCode::OK, Json(ApiResponse::success(article))),
        Ok(None) => (
            StatusCode::NOT_FOUND,
            Json(ApiResponse::error("文章不存在")),
        ),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ApiResponse::error(e.to_string())),
        ),
    }
}

pub async fn create_article_handler(
    State(state): State<Arc<AppState>>,
    Json(data): Json<CreateHelpArticle>,
) -> impl IntoResponse {
    match state.help_service.create_article(data).await {
        Ok(article) => (StatusCode::CREATED, Json(ApiResponse::success(article))),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ApiResponse::error(e.to_string())),
        ),
    }
}

pub async fn update_article_handler(
    State(state): State<Arc<AppState>>,
    Path(id): Path<Uuid>,
    Json(data): Json<UpdateHelpArticle>,
) -> impl IntoResponse {
    match state.help_service.update_article(id, data).await {
        Ok(article) => (StatusCode::OK, Json(ApiResponse::success(article))),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ApiResponse::error(e.to_string())),
        ),
    }
}

pub async fn delete_article_handler(
    State(state): State<Arc<AppState>>,
    Path(id): Path<Uuid>,
) -> impl IntoResponse {
    match state.help_service.delete_article(id).await {
        Ok(()) => (StatusCode::OK, Json(ApiResponse::success(()))),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ApiResponse::error(e.to_string())),
        ),
    }
}

pub async fn search_help_handler(
    State(state): State<Arc<AppState>>,
    Query(query): Query<HelpSearchQuery>,
) -> impl IntoResponse {
    let keyword = query.keyword.unwrap_or_default();
    let category_id = query.category_id.and_then(|id| Uuid::parse_str(&id).ok());

    match state
        .help_service
        .search_articles(&keyword, category_id)
        .await
    {
        Ok(articles) => (StatusCode::OK, Json(ApiResponse::success(articles))),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ApiResponse::error(e.to_string())),
        ),
    }
}

pub async fn init_default_help_handler(State(state): State<Arc<AppState>>) -> impl IntoResponse {
    match state.help_service.init_default_help_content().await {
        Ok(()) => (StatusCode::OK, Json(ApiResponse::success(()))),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ApiResponse::error(e.to_string())),
        ),
    }
}
