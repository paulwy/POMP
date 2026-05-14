use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use serde_json;
use sqlx::FromRow;
use uuid::Uuid;

use super::DbPool;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct MaterialItem {
    pub id: Uuid,
    pub name: String,
    pub material_type: String,
    pub category: Option<String>,
    pub content: Option<String>,
    pub url: Option<String>,
    pub file_path: Option<String>,
    pub file_size: Option<i64>,
    pub file_type: Option<String>,
    pub description: Option<String>,
    #[sqlx(default)]
    pub tags: Option<serde_json::Value>,
    pub source_url: Option<String>,
    pub ai_summary: Option<String>,
    pub is_favorite: bool,
    pub created_by: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateMaterialItem {
    pub name: String,
    pub material_type: String,
    pub category: Option<String>,
    pub content: Option<String>,
    pub url: Option<String>,
    pub file_path: Option<String>,
    pub file_size: Option<i64>,
    pub file_type: Option<String>,
    pub description: Option<String>,
    pub tags: Option<Vec<String>>,
    pub source_url: Option<String>,
    pub ai_summary: Option<String>,
    pub created_by: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateMaterialItem {
    pub name: Option<String>,
    pub category: Option<String>,
    pub description: Option<String>,
    pub tags: Option<Vec<String>>,
    pub is_favorite: Option<bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MaterialSearchParams {
    pub material_type: Option<String>,
    pub category: Option<String>,
    pub keyword: Option<String>,
    pub page: i64,
    pub page_size: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MaterialListResponse {
    pub items: Vec<MaterialItem>,
    pub total: i64,
    pub page: i64,
    pub page_size: i64,
}

pub async fn create_material(
    pool: &DbPool,
    item: CreateMaterialItem,
) -> Result<MaterialItem, sqlx::Error> {
    let now = Utc::now();
    let id = Uuid::new_v4();
    let tags_value = item
        .tags
        .as_ref()
        .map(|t| serde_json::to_value(t).unwrap_or(serde_json::Value::Array(vec![])));

    let result = sqlx::query_as::<_, MaterialItem>(
        r#"
        INSERT INTO materials (id, name, material_type, category, content, url, file_path, file_size, file_type, description, tags, source_url, ai_summary, is_favorite, created_by, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
        RETURNING id, name, material_type, category, content, url, file_path, file_size, file_type, description, tags, source_url, ai_summary, is_favorite, created_by, created_at, updated_at
        "#
    )
    .bind(id)
    .bind(&item.name)
    .bind(&item.material_type)
    .bind(&item.category)
    .bind(&item.content)
    .bind(&item.url)
    .bind(&item.file_path)
    .bind(item.file_size)
    .bind(&item.file_type)
    .bind(&item.description)
    .bind(&tags_value)
    .bind(&item.source_url)
    .bind(&item.ai_summary)
    .bind(false)
    .bind(&item.created_by)
    .bind(now)
    .bind(now)
    .fetch_one(pool)
    .await?;

    Ok(result)
}

pub async fn get_material(pool: &DbPool, id: Uuid) -> Result<Option<MaterialItem>, sqlx::Error> {
    let result = sqlx::query_as::<_, MaterialItem>(
        r#"
        SELECT id, name, material_type, category, content, url, file_path, file_size, file_type, description, tags, source_url, ai_summary, is_favorite, created_by, created_at, updated_at
        FROM materials
        WHERE id = $1
        "#
    )
    .bind(id)
    .fetch_optional(pool)
    .await?;

    Ok(result)
}

pub async fn list_materials(
    pool: &DbPool,
    params: MaterialSearchParams,
) -> Result<MaterialListResponse, sqlx::Error> {
    let offset = (params.page - 1) * params.page_size;

    let items = sqlx::query_as::<_, MaterialItem>(
        r#"
        SELECT id, name, material_type, category, content, url, file_path, file_size, file_type, description, tags, source_url, ai_summary, is_favorite, created_by, created_at, updated_at
        FROM materials
        WHERE ($1::text IS NULL OR material_type = $1)
          AND ($2::text IS NULL OR category = $2)
          AND ($3::text IS NULL OR name ILIKE '%' || $3 || '%' OR description ILIKE '%' || $3 || '%')
        ORDER BY created_at DESC
        LIMIT $4 OFFSET $5
        "#
    )
    .bind(&params.material_type)
    .bind(&params.category)
    .bind(&params.keyword)
    .bind(params.page_size)
    .bind(offset)
    .fetch_all(pool)
    .await?;

    let total: (i64,) = sqlx::query_as(
        r#"
        SELECT COUNT(*) FROM materials
        WHERE ($1::text IS NULL OR material_type = $1)
          AND ($2::text IS NULL OR category = $2)
          AND ($3::text IS NULL OR name ILIKE '%' || $3 || '%' OR description ILIKE '%' || $3 || '%')
        "#
    )
    .bind(&params.material_type)
    .bind(&params.category)
    .bind(&params.keyword)
    .fetch_one(pool)
    .await?;

    Ok(MaterialListResponse {
        items,
        total: total.0,
        page: params.page,
        page_size: params.page_size,
    })
}

pub async fn update_material(
    pool: &DbPool,
    id: Uuid,
    item: UpdateMaterialItem,
) -> Result<Option<MaterialItem>, sqlx::Error> {
    let existing = get_material(pool, id).await?;

    if existing.is_none() {
        return Ok(None);
    }

    let existing = existing.unwrap();
    let tags_value = match item.tags {
        Some(tags_vec) => {
            Some(serde_json::to_value(tags_vec).unwrap_or(serde_json::Value::Array(vec![])))
        }
        None => existing.tags,
    };

    let result = sqlx::query_as::<_, MaterialItem>(
        r#"
        UPDATE materials
        SET name = $1, category = $2, description = $3, tags = $4, is_favorite = $5, updated_at = $6
        WHERE id = $7
        RETURNING id, name, material_type, category, content, url, file_path, file_size, file_type, description, tags, source_url, ai_summary, is_favorite, created_by, created_at, updated_at
        "#
    )
    .bind(item.name.unwrap_or(existing.name))
    .bind(item.category.or(existing.category))
    .bind(item.description.or(existing.description))
    .bind(&tags_value)
    .bind(item.is_favorite.unwrap_or(existing.is_favorite))
    .bind(Utc::now())
    .bind(id)
    .fetch_optional(pool)
    .await?;

    Ok(result)
}

pub async fn delete_material(pool: &DbPool, id: Uuid) -> Result<bool, sqlx::Error> {
    let result = sqlx::query(
        r#"
        DELETE FROM materials WHERE id = $1
        "#,
    )
    .bind(id)
    .execute(pool)
    .await?;

    Ok(result.rows_affected() > 0)
}
