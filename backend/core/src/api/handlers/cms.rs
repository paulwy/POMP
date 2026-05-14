use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    response::IntoResponse,
    Json,
};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use uuid::Uuid;

use crate::db::cms::{
    Article, ArticleReview, CreateArticle, CreateCategory, ReviewArticle, ReviewStats,
};
use crate::db::cms_repo::{
    archive_article, assign_reviewer, create_article, create_category, get_article,
    get_article_reviews, get_articles, get_categories, get_pending_review_articles,
    get_review_assignments, get_review_stats, get_reviewing_articles, get_reviewed_articles,
    publish_article, review_article, restore_article_from_archive, submit_article_for_review,
    update_article,
};
use crate::errors::ApiResponse;
use crate::state::AppState;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CategoryQueryParams {
    pub department_id: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ArticleQueryParams {
    pub status: Option<String>,
    pub category: Option<String>,
    pub page: Option<i32>,
    pub page_size: Option<i32>,
}

pub async fn get_categories_handler(
    State(state): State<Arc<AppState>>,
    Query(params): Query<CategoryQueryParams>,
) -> impl IntoResponse {
    let department_id = params
        .department_id
        .and_then(|id| Uuid::parse_str(&id).ok());

    match get_categories(&state.db, department_id).await {
        Ok(categories) => (StatusCode::OK, Json(ApiResponse::success(categories))),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ApiResponse::<Vec<crate::db::cms::Category>>::error(
                e.to_string(),
            )),
        ),
    }
}

pub async fn create_category_handler(
    State(state): State<Arc<AppState>>,
    Json(req): Json<CreateCategoryRequest>,
) -> impl IntoResponse {
    let create_req = CreateCategory {
        name: req.name,
        code: req.code,
        description: req.description,
        parent_id: req.parent_id.and_then(|id| Uuid::parse_str(&id).ok()),
        department_id: req.department_id.and_then(|id| Uuid::parse_str(&id).ok()),
        sort_order: req.sort_order,
    };

    match create_category(&state.db, create_req).await {
        Ok(category) => (StatusCode::CREATED, Json(ApiResponse::success(category))),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ApiResponse::<crate::db::cms::Category>::error(
                e.to_string(),
            )),
        ),
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateCategoryRequest {
    pub name: String,
    pub code: String,
    pub description: Option<String>,
    pub parent_id: Option<String>,
    pub department_id: Option<String>,
    pub sort_order: Option<i32>,
}

pub async fn get_articles_handler(
    State(state): State<Arc<AppState>>,
    Query(params): Query<ArticleQueryParams>,
) -> impl IntoResponse {
    let search_params = crate::db::cms::ArticleSearchParams {
        status: params.status,
        category_code: params.category,
        page: params.page,
        page_size: params.page_size,
    };

    match get_articles(&state.db, search_params).await {
        Ok(articles) => (StatusCode::OK, Json(ApiResponse::success(articles))),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ApiResponse::<Vec<Article>>::error(e.to_string())),
        ),
    }
}

pub async fn get_article_handler(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
) -> impl IntoResponse {
    let article_id = match Uuid::parse_str(&id) {
        Ok(uuid) => uuid,
        Err(_) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(ApiResponse::<Article>::error(
                    "Invalid article ID".to_string(),
                )),
            )
        }
    };

    match get_article(&state.db, article_id).await {
        Ok(Some(article)) => (StatusCode::OK, Json(ApiResponse::success(article))),
        Ok(None) => (
            StatusCode::NOT_FOUND,
            Json(ApiResponse::<Article>::error(
                "Article not found".to_string(),
            )),
        ),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ApiResponse::<Article>::error(e.to_string())),
        ),
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateArticleRequest {
    pub category_code: String,
    pub title: String,
    pub summary: Option<String>,
    pub content: Option<String>,
    pub cover_image: Option<String>,
    pub author_id: Option<String>,
}

pub async fn create_article_handler(
    State(state): State<Arc<AppState>>,
    Json(req): Json<CreateArticleRequest>,
) -> impl IntoResponse {
    let author_id = req
        .author_id
        .and_then(|id| Uuid::parse_str(&id).ok())
        .unwrap_or_else(|| Uuid::parse_str("7f6d2c08-7e18-41ea-81f1-7b1682995352").unwrap());

    let create_req = CreateArticle {
        category_code: req.category_code,
        title: req.title,
        summary: req.summary,
        content: req.content,
        cover_image: req.cover_image,
        author_id,
    };

    match create_article(&state.db, create_req).await {
        Ok(article) => (StatusCode::CREATED, Json(ApiResponse::success(article))),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ApiResponse::<Article>::error(e.to_string())),
        ),
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateArticleRequest {
    pub title: Option<String>,
    pub summary: Option<String>,
    pub content: Option<String>,
    pub cover_image: Option<String>,
}

pub async fn update_article_handler(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
    Json(req): Json<UpdateArticleRequest>,
) -> impl IntoResponse {
    let article_id = match Uuid::parse_str(&id) {
        Ok(uuid) => uuid,
        Err(_) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(ApiResponse::<Article>::error(
                    "Invalid article ID".to_string(),
                )),
            )
        }
    };

    let update_req = crate::db::cms::UpdateArticle {
        title: req.title,
        summary: req.summary,
        content: req.content,
        cover_image: req.cover_image,
    };

    match update_article(&state.db, article_id, update_req).await {
        Ok(Some(article)) => (StatusCode::OK, Json(ApiResponse::success(article))),
        Ok(None) => (
            StatusCode::NOT_FOUND,
            Json(ApiResponse::<Article>::error(
                "Article not found or cannot be updated".to_string(),
            )),
        ),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ApiResponse::<Article>::error(e.to_string())),
        ),
    }
}

pub async fn submit_article_for_review_handler(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
) -> impl IntoResponse {
    let article_id = match Uuid::parse_str(&id) {
        Ok(uuid) => uuid,
        Err(_) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(ApiResponse::<Article>::error(
                    "Invalid article ID".to_string(),
                )),
            )
        }
    };

    let user_id = Uuid::parse_str("7f6d2c08-7e18-41ea-81f1-7b1682995352").unwrap();

    match submit_article_for_review(&state.db, article_id, user_id).await {
        Ok(Some(article)) => (StatusCode::OK, Json(ApiResponse::success(article))),
        Ok(None) => (
            StatusCode::NOT_FOUND,
            Json(ApiResponse::<Article>::error(
                "Article not found".to_string(),
            )),
        ),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ApiResponse::<Article>::error(e.to_string())),
        ),
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AssignReviewerRequest {
    pub reviewer_id: String,
}

pub async fn assign_reviewer_handler(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
    Json(req): Json<AssignReviewerRequest>,
) -> impl IntoResponse {
    let article_id = match Uuid::parse_str(&id) {
        Ok(uuid) => uuid,
        Err(_) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(ApiResponse::<Article>::error(
                    "Invalid article ID".to_string(),
                )),
            )
        }
    };

    let reviewer_id = match Uuid::parse_str(&req.reviewer_id) {
        Ok(uuid) => uuid,
        Err(_) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(ApiResponse::<Article>::error(
                    "Invalid reviewer ID".to_string(),
                )),
            )
        }
    };

    match assign_reviewer(&state.db, article_id, reviewer_id).await {
        Ok(Some(article)) => (StatusCode::OK, Json(ApiResponse::success(article))),
        Ok(None) => (
            StatusCode::NOT_FOUND,
            Json(ApiResponse::<Article>::error(
                "Article not found or not pending review".to_string(),
            )),
        ),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ApiResponse::<Article>::error(e.to_string())),
        ),
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ReviewArticleRequest {
    pub status: String,
    pub comment: Option<String>,
}

pub async fn review_article_handler(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
    Json(req): Json<ReviewArticleRequest>,
) -> impl IntoResponse {
    let article_id = match Uuid::parse_str(&id) {
        Ok(uuid) => uuid,
        Err(_) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(ApiResponse::<ArticleReview>::error(
                    "Invalid article ID".to_string(),
                )),
            )
        }
    };

    let reviewer_id = Uuid::parse_str("7f6d2c08-7e18-41ea-81f1-7b1682995352").unwrap();

    let review_req = ReviewArticle {
        status: req.status,
        comment: req.comment,
    };

    match review_article(&state.db, article_id, reviewer_id, review_req).await {
        Ok(Some(review)) => (StatusCode::OK, Json(ApiResponse::success(review))),
        Ok(None) => (
            StatusCode::NOT_FOUND,
            Json(ApiResponse::<ArticleReview>::error(
                "Article not found".to_string(),
            )),
        ),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ApiResponse::<ArticleReview>::error(e.to_string())),
        ),
    }
}

pub async fn publish_article_handler(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
) -> impl IntoResponse {
    let article_id = match Uuid::parse_str(&id) {
        Ok(uuid) => uuid,
        Err(_) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(ApiResponse::<Article>::error(
                    "Invalid article ID".to_string(),
                )),
            )
        }
    };

    match publish_article(&state.db, article_id).await {
        Ok(Some(article)) => (StatusCode::OK, Json(ApiResponse::success(article))),
        Ok(None) => (
            StatusCode::NOT_FOUND,
            Json(ApiResponse::<Article>::error(
                "Article not found or not approved".to_string(),
            )),
        ),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ApiResponse::<Article>::error(e.to_string())),
        ),
    }
}

pub async fn archive_article_handler(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
) -> impl IntoResponse {
    let article_id = match Uuid::parse_str(&id) {
        Ok(uuid) => uuid,
        Err(_) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(ApiResponse::<Article>::error(
                    "Invalid article ID".to_string(),
                )),
            )
        }
    };

    match archive_article(&state.db, article_id).await {
        Ok(Some(article)) => (StatusCode::OK, Json(ApiResponse::success(article))),
        Ok(None) => (
            StatusCode::NOT_FOUND,
            Json(ApiResponse::<Article>::error(
                "Article not found".to_string(),
            )),
        ),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ApiResponse::<Article>::error(e.to_string())),
        ),
    }
}

pub async fn restore_article_handler(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
) -> impl IntoResponse {
    let article_id = match Uuid::parse_str(&id) {
        Ok(uuid) => uuid,
        Err(_) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(ApiResponse::<Article>::error(
                    "Invalid article ID".to_string(),
                )),
            )
        }
    };

    match restore_article_from_archive(&state.db, article_id).await {
        Ok(Some(article)) => (StatusCode::OK, Json(ApiResponse::success(article))),
        Ok(None) => (
            StatusCode::NOT_FOUND,
            Json(ApiResponse::<Article>::error(
                "Article not found or not archived".to_string(),
            )),
        ),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ApiResponse::<Article>::error(e.to_string())),
        ),
    }
}

pub async fn get_article_reviews_handler(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
) -> impl IntoResponse {
    let article_id = match Uuid::parse_str(&id) {
        Ok(uuid) => uuid,
        Err(_) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(ApiResponse::<Vec<ArticleReview>>::error(
                    "Invalid article ID".to_string(),
                )),
            )
        }
    };

    match get_article_reviews(&state.db, article_id).await {
        Ok(reviews) => (StatusCode::OK, Json(ApiResponse::success(reviews))),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ApiResponse::<Vec<ArticleReview>>::error(e.to_string())),
        ),
    }
}

pub async fn get_pending_review_articles_handler(
    State(state): State<Arc<AppState>>,
) -> impl IntoResponse {
    match get_pending_review_articles(&state.db).await {
        Ok(articles) => (StatusCode::OK, Json(ApiResponse::success(articles))),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ApiResponse::<Vec<Article>>::error(e.to_string())),
        ),
    }
}

pub async fn get_reviewing_articles_handler(
    State(state): State<Arc<AppState>>,
) -> impl IntoResponse {
    match get_reviewing_articles(&state.db, None).await {
        Ok(articles) => (StatusCode::OK, Json(ApiResponse::success(articles))),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ApiResponse::<Vec<Article>>::error(e.to_string())),
        ),
    }
}

pub async fn get_reviewed_articles_handler(
    State(state): State<Arc<AppState>>,
) -> impl IntoResponse {
    match get_reviewed_articles(&state.db).await {
        Ok(articles) => (StatusCode::OK, Json(ApiResponse::success(articles))),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ApiResponse::<Vec<Article>>::error(e.to_string())),
        ),
    }
}

pub async fn get_review_stats_handler(
    State(state): State<Arc<AppState>>,
) -> impl IntoResponse {
    match get_review_stats(&state.db).await {
        Ok(stats) => (StatusCode::OK, Json(ApiResponse::success(stats))),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ApiResponse::<ReviewStats>::error(e.to_string())),
        ),
    }
}

pub async fn get_review_assignments_handler(
    State(state): State<Arc<AppState>>,
) -> impl IntoResponse {
    let reviewer_id = Uuid::parse_str("7f6d2c08-7e18-41ea-81f1-7b1682995352").unwrap();

    match get_review_assignments(&state.db, reviewer_id).await {
        Ok(assignments) => (StatusCode::OK, Json(ApiResponse::success(assignments))),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ApiResponse::<Vec<crate::db::cms::ReviewAssignment>>::error(e.to_string())),
        ),
    }
}

pub async fn get_public_articles_handler(
    State(state): State<Arc<AppState>>,
    Query(params): Query<ArticleQueryParams>,
) -> impl IntoResponse {
    let search_params = crate::db::cms::ArticleSearchParams {
        status: Some("published".to_string()),
        category_code: params.category,
        page: params.page,
        page_size: params.page_size,
    };

    match get_articles(&state.db, search_params).await {
        Ok(articles) => (StatusCode::OK, Json(ApiResponse::success(articles))),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ApiResponse::<Vec<Article>>::error(e.to_string())),
        ),
    }
}