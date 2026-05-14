use axum::{
    extract::{Json, Path, State},
    http::StatusCode,
    response::IntoResponse,
};
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::sync::Arc;

use crate::errors::ApiResponse;
use crate::AppState;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DocumentCategory {
    pub id: String,
    pub name: String,
    pub code: String,
    pub description: Option<String>,
    pub sort_order: i32,
    pub is_active: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct ProductionDocument {
    pub id: String,
    pub title: String,
    pub content: Option<String>,
    pub category_id: String,
    pub category_name: Option<String>,
    pub author_id: String,
    pub author_name: String,
    pub status: String,
    pub version: String,
    pub approved_by: Option<String>,
    pub approved_at: Option<DateTime<Utc>>,
    pub comment: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct CreateDocumentCategory {
    pub name: String,
    pub code: String,
    pub description: Option<String>,
    pub sort_order: Option<i32>,
}

#[derive(Debug, Deserialize)]
pub struct CreateProductionDocument {
    pub title: String,
    pub content: Option<String>,
    pub category_id: String,
    pub version: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateProductionDocument {
    pub title: String,
    pub content: Option<String>,
    pub category_id: String,
}

#[derive(Debug, Deserialize)]
pub struct SubmitReviewRequest {
    pub comment: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct ReviewDocumentRequest {
    pub approved: bool,
    pub comment: String,
}

pub async fn get_document_categories_handler(
    State(state): State<Arc<AppState>>,
) -> impl IntoResponse {
    match sqlx::query!(
        r#"SELECT id, name, code, description, sort_order, is_active, created_at, updated_at FROM document_categories ORDER BY sort_order, created_at"#
    )
    .fetch_all(&state.db)
    .await
    {
        Ok(records) => {
            let categories: Vec<DocumentCategory> = records
                .into_iter()
                .map(|r| DocumentCategory {
                    id: r.id,
                    name: r.name,
                    code: r.code.unwrap_or_default(),
                    description: r.description,
                    sort_order: r.sort_order.unwrap_or(0),
                    is_active: r.is_active.unwrap_or(true),
                    created_at: r.created_at.unwrap_or_else(Utc::now),
                    updated_at: r.updated_at.unwrap_or_else(Utc::now),
                })
                .collect();
            (StatusCode::OK, axum::Json(ApiResponse::success(categories)))
        }
        Err(e) => {
            tracing::error!("Error fetching document categories: {}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, axum::Json(ApiResponse::error("获取文档分类失败".to_string())))
        }
    }
}

pub async fn create_document_category_handler(
    State(state): State<Arc<AppState>>,
    Json(req): Json<CreateDocumentCategory>,
) -> impl IntoResponse {
    let id = uuid::Uuid::new_v4().to_string();
    let sort_order = req.sort_order.unwrap_or(0);

    match sqlx::query!(
        r#"INSERT INTO document_categories (id, name, code, description, sort_order, is_active, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, true, $6, $7)"#,
        id,
        req.name,
        req.code,
        req.description,
        sort_order,
        Utc::now(),
        Utc::now()
    )
    .execute(&state.db)
    .await
    {
        Ok(_) => {
            let category = DocumentCategory {
                id,
                name: req.name,
                code: req.code,
                description: req.description,
                sort_order,
                is_active: true,
                created_at: Utc::now(),
                updated_at: Utc::now(),
            };
            (StatusCode::CREATED, axum::Json(ApiResponse::success(category)))
        }
        Err(e) => {
            tracing::error!("Error creating document category: {}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, axum::Json(ApiResponse::error("创建文档分类失败".to_string())))
        }
    }
}

pub async fn get_production_documents_handler(
    State(state): State<Arc<AppState>>,
) -> impl IntoResponse {
    match sqlx::query_as::<_, ProductionDocument>(
        r#"
        SELECT 
            pd.id, pd.title, pd.content, pd.category_id, dc.name as category_name,
            pd.author_id, pd.author_name, pd.status, pd.version,
            pd.approved_by, pd.approved_at, pd.comment, pd.created_at, pd.updated_at
        FROM production_documents pd
        LEFT JOIN document_categories dc ON pd.category_id = dc.id
        ORDER BY pd.created_at DESC
        "#
    )
    .fetch_all(&state.db)
    .await
    {
        Ok(documents) => {
            (StatusCode::OK, axum::Json(ApiResponse::success(documents)))
        }
        Err(e) => {
            tracing::error!("Error fetching production documents: {}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, axum::Json(ApiResponse::error("获取生产文档失败".to_string())))
        }
    }
}

pub async fn create_production_document_handler(
    State(state): State<Arc<AppState>>,
    Json(req): Json<CreateProductionDocument>,
) -> impl IntoResponse {
    let id = uuid::Uuid::new_v4().to_string();
    let version = req.version.unwrap_or_else(|| "1.0".to_string());
    let now = Utc::now();
    let author_id = "current_user".to_string();

    match sqlx::query!(
        r#"
        INSERT INTO production_documents 
            (id, title, content, category_id, author_id, author_name, status, version, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, 'draft', $7, $8, $9)
        "#,
        id,
        req.title,
        req.content,
        req.category_id,
        author_id,
        "当前用户",
        version,
        now,
        now,
    )
    .execute(&state.db)
    .await
    {
        Ok(_) => {
            let category_name = match sqlx::query!(
                r#"SELECT name FROM document_categories WHERE id = $1"#,
                req.category_id
            )
            .fetch_optional(&state.db)
            .await
            {
                Ok(Some(c)) => Some(c.name),
                _ => None,
            };

            let document = ProductionDocument {
                id,
                title: req.title,
                content: req.content,
                category_id: req.category_id,
                category_name,
                author_id,
                author_name: "当前用户".to_string(),
                status: "draft".to_string(),
                version,
                approved_by: None,
                approved_at: None,
                comment: None,
                created_at: now,
                updated_at: now,
            };

            (StatusCode::CREATED, axum::Json(ApiResponse::success(document)))
        }
        Err(e) => {
            tracing::error!("Error creating production document: {}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, axum::Json(ApiResponse::error("创建生产文档失败".to_string())))
        }
    }
}

pub async fn get_production_document_handler(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
) -> impl IntoResponse {
    match sqlx::query_as::<_, ProductionDocument>(
        r#"
        SELECT 
            pd.id, pd.title, pd.content, pd.category_id, dc.name as category_name,
            pd.author_id, pd.author_name, pd.status, pd.version,
            pd.approved_by, pd.approved_at, pd.comment, pd.created_at, pd.updated_at
        FROM production_documents pd
        LEFT JOIN document_categories dc ON pd.category_id = dc.id
        WHERE pd.id = $1
        "#
    )
    .bind(id)
    .fetch_optional(&state.db)
    .await
    {
        Ok(Some(document)) => {
            (StatusCode::OK, axum::Json(ApiResponse::success(document)))
        }
        Ok(None) => {
            (StatusCode::NOT_FOUND, axum::Json(ApiResponse::error("文档不存在".to_string())))
        }
        Err(e) => {
            tracing::error!("Error fetching production document: {}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, axum::Json(ApiResponse::error("获取文档失败".to_string())))
        }
    }
}

pub async fn get_document_category_by_code_handler(
    State(_state): State<Arc<AppState>>,
    Path(code): Path<String>,
) -> impl IntoResponse {
    let category = DocumentCategory {
        id: "mock_id".to_string(),
        code: code.clone(),
        name: format!("分类 - {}", code),
        description: Some("通过编码获取的分类".to_string()),
        sort_order: 1,
        is_active: true,
        created_at: Utc::now(),
        updated_at: Utc::now(),
    };

    (StatusCode::OK, axum::Json(ApiResponse::success(category)))
}

pub async fn get_for_review_documents_handler(
    State(state): State<Arc<AppState>>,
) -> impl IntoResponse {
    match sqlx::query_as::<_, ProductionDocument>(
        r#"
        SELECT 
            pd.id, pd.title, pd.content, pd.category_id, dc.name as category_name,
            pd.author_id, pd.author_name, pd.status, pd.version,
            pd.approved_by, pd.approved_at, pd.comment, pd.created_at, pd.updated_at
        FROM production_documents pd
        LEFT JOIN document_categories dc ON pd.category_id = dc.id
        WHERE pd.status = 'pending_review'
        ORDER BY pd.created_at DESC
        "#
    )
    .fetch_all(&state.db)
    .await
    {
        Ok(documents) => {
            (StatusCode::OK, axum::Json(ApiResponse::success(documents)))
        }
        Err(e) => {
            tracing::error!("Error fetching documents for review: {}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, axum::Json(ApiResponse::error("获取待审核文档失败".to_string())))
        }
    }
}

pub async fn update_production_document_handler(
    State(_state): State<Arc<AppState>>,
    Path(id): Path<String>,
    Json(req): Json<UpdateProductionDocument>,
) -> impl IntoResponse {
    let document = ProductionDocument {
        id,
        title: req.title,
        content: req.content,
        category_id: req.category_id,
        category_name: Some("操作规程".to_string()),
        author_id: "current_user".to_string(),
        author_name: "当前用户".to_string(),
        status: "draft".to_string(),
        version: "1.1".to_string(),
        approved_by: None,
        approved_at: None,
        comment: None,
        created_at: Utc::now() - chrono::Duration::days(30),
        updated_at: Utc::now(),
    };

    (StatusCode::OK, axum::Json(ApiResponse::success(document)))
}

pub async fn delete_production_document_handler(
    State(_state): State<Arc<AppState>>,
    Path(id): Path<String>,
) -> impl IntoResponse {
    let result = serde_json::json!({
        "success": true,
        "message": format!("文档 {} 已删除", id),
    });

    (StatusCode::OK, axum::Json(result))
}

pub async fn submit_review_document_handler(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
    Json(req): Json<SubmitReviewRequest>,
) -> impl IntoResponse {
    let now = Utc::now();

    match sqlx::query_as::<_, ProductionDocument>(
        r#"
        UPDATE production_documents 
        SET status = 'pending_review', comment = $1, updated_at = $2
        WHERE id = $3
        RETURNING id, title, content, category_id, NULL as category_name, author_id, author_name, status, version,
                  approved_by, approved_at, comment, created_at, updated_at
        "#
    )
    .bind(req.comment)
    .bind(now)
    .bind(id)
    .fetch_optional(&state.db)
    .await
    {
        Ok(Some(mut document)) => {
            let category_name = match sqlx::query!(
                r#"SELECT name FROM document_categories WHERE id = $1"#,
                &document.category_id
            )
            .fetch_optional(&state.db)
            .await
            {
                Ok(Some(c)) => Some(c.name),
                _ => None,
            };
            document.category_name = category_name;
            
            (StatusCode::OK, axum::Json(ApiResponse::success(document)))
        }
        Ok(None) => {
            (StatusCode::NOT_FOUND, axum::Json(ApiResponse::error("文档不存在".to_string())))
        }
        Err(e) => {
            tracing::error!("Error submitting document for review: {}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, axum::Json(ApiResponse::error("提交审核失败".to_string())))
        }
    }
}

pub async fn review_document_handler(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
    Json(req): Json<ReviewDocumentRequest>,
) -> impl IntoResponse {
    let status = if req.approved { "published" } else { "rejected" };
    let now = Utc::now();
    let reviewer_id = "reviewer".to_string();

    match sqlx::query_as::<_, ProductionDocument>(
        r#"
        UPDATE production_documents 
        SET status = $1, approved_by = $2, approved_at = $3, comment = $4, updated_at = $5
        WHERE id = $6
        RETURNING id, title, content, category_id, NULL as category_name, author_id, author_name, status, version,
                  approved_by, approved_at, comment, created_at, updated_at
        "#
    )
    .bind(status)
    .bind(reviewer_id)
    .bind(now)
    .bind(req.comment)
    .bind(now)
    .bind(id)
    .fetch_optional(&state.db)
    .await
    {
        Ok(Some(mut document)) => {
            let category_name = match sqlx::query!(
                r#"SELECT name FROM document_categories WHERE id = $1"#,
                &document.category_id
            )
            .fetch_optional(&state.db)
            .await
            {
                Ok(Some(c)) => Some(c.name),
                _ => None,
            };
            document.category_name = category_name;
            
            (StatusCode::OK, axum::Json(ApiResponse::success(document)))
        }
        Ok(None) => {
            (StatusCode::NOT_FOUND, axum::Json(ApiResponse::error("文档不存在".to_string())))
        }
        Err(e) => {
            tracing::error!("Error reviewing document: {}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, axum::Json(ApiResponse::error("审核失败".to_string())))
        }
    }
}
