use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct HelpCategory {
    pub id: Uuid,
    pub code: String,
    pub name: String,
    pub icon: Option<String>,
    pub description: Option<String>,
    pub sort_order: i32,
    pub is_active: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct HelpArticle {
    pub id: Uuid,
    pub category_id: Uuid,
    pub slug: String,
    pub title: String,
    pub content: String,
    pub author: Option<String>,
    pub tags: Option<String>,
    pub view_count: i32,
    pub is_published: bool,
    pub is_featured: bool,
    pub sort_order: i32,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HelpCategoryWithArticles {
    pub category: HelpCategory,
    pub articles: Vec<HelpArticle>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateHelpCategory {
    pub code: String,
    pub name: String,
    pub icon: Option<String>,
    pub description: Option<String>,
    pub sort_order: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateHelpCategory {
    pub name: Option<String>,
    pub icon: Option<String>,
    pub description: Option<String>,
    pub sort_order: Option<i32>,
    pub is_active: Option<bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateHelpArticle {
    pub category_id: Uuid,
    pub slug: String,
    pub title: String,
    pub content: String,
    pub author: Option<String>,
    pub tags: Option<String>,
    pub is_published: Option<bool>,
    pub is_featured: Option<bool>,
    pub sort_order: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateHelpArticle {
    pub category_id: Option<Uuid>,
    pub title: Option<String>,
    pub content: Option<String>,
    pub author: Option<String>,
    pub tags: Option<String>,
    pub is_published: Option<bool>,
    pub is_featured: Option<bool>,
    pub sort_order: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HelpSearchQuery {
    pub keyword: Option<String>,
    pub category_id: Option<Uuid>,
    pub is_published: Option<bool>,
}
