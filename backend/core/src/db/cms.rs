use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Category {
    pub id: Uuid,
    pub name: String,
    pub code: String,
    pub description: Option<String>,
    pub parent_id: Option<Uuid>,
    pub department_id: Option<Uuid>,
    pub sort_order: i32,
    pub is_active: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateCategory {
    pub name: String,
    pub code: String,
    pub description: Option<String>,
    pub parent_id: Option<Uuid>,
    pub department_id: Option<Uuid>,
    pub sort_order: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateCategory {
    pub name: Option<String>,
    pub description: Option<String>,
    pub sort_order: Option<i32>,
    pub is_active: Option<bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Article {
    pub id: Uuid,
    pub category_id: Uuid,
    pub title: String,
    pub slug: String,
    pub summary: Option<String>,
    pub content: Option<String>,
    pub cover_image: Option<String>,
    pub author_id: Uuid,
    pub department_id: Option<Uuid>,
    pub status: String,
    pub view_count: i32,
    pub is_top: bool,
    pub published_at: Option<DateTime<Utc>>,
    pub review_timeout_days: Option<i32>,
    pub review_reminded_at: Option<DateTime<Utc>>,
    pub current_reviewer_id: Option<Uuid>,
    pub review_stage: Option<i32>,
    pub max_review_stages: Option<i32>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateArticle {
    pub category_code: String,
    pub title: String,
    pub summary: Option<String>,
    pub content: Option<String>,
    pub cover_image: Option<String>,
    pub author_id: Uuid,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateArticle {
    pub title: Option<String>,
    pub summary: Option<String>,
    pub content: Option<String>,
    pub cover_image: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct ArticleReview {
    pub id: Uuid,
    pub article_id: Uuid,
    pub reviewer_id: Uuid,
    pub status: String,
    pub comment: Option<String>,
    pub reviewed_at: Option<DateTime<Utc>>,
    pub review_stage: i32,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ReviewArticle {
    pub status: String,
    pub comment: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ArticleSearchParams {
    pub status: Option<String>,
    pub category_code: Option<String>,
    pub page: Option<i32>,
    pub page_size: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct ReviewAssignment {
    pub id: Uuid,
    pub article_id: Uuid,
    pub reviewer_id: Uuid,
    pub stage: i32,
    pub assigned_at: DateTime<Utc>,
    pub is_completed: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ReviewStats {
    pub total_pending: i64,
    pub total_reviewing: i64,
    pub total_approved: i64,
    pub total_rejected: i64,
    pub total_draft: i64,
}

pub enum ArticleStatus {
    Draft,
    PendingReview,
    Reviewing,
    Approved,
    Rejected,
    Published,
    Archived,
}

impl ArticleStatus {
    pub fn as_str(&self) -> &'static str {
        match self {
            ArticleStatus::Draft => "draft",
            ArticleStatus::PendingReview => "pending_review",
            ArticleStatus::Reviewing => "reviewing",
            ArticleStatus::Approved => "approved",
            ArticleStatus::Rejected => "rejected",
            ArticleStatus::Published => "published",
            ArticleStatus::Archived => "archived",
        }
    }

    pub fn from_str(s: &str) -> Option<ArticleStatus> {
        match s {
            "draft" => Some(ArticleStatus::Draft),
            "pending_review" => Some(ArticleStatus::PendingReview),
            "reviewing" => Some(ArticleStatus::Reviewing),
            "approved" => Some(ArticleStatus::Approved),
            "rejected" => Some(ArticleStatus::Rejected),
            "published" => Some(ArticleStatus::Published),
            "archived" => Some(ArticleStatus::Archived),
            _ => None,
        }
    }
}

pub fn is_valid_status_transition(from: &str, to: &str) -> bool {
    let from_status = ArticleStatus::from_str(from);
    let to_status = ArticleStatus::from_str(to);

    if let (Some(from), Some(to)) = (from_status, to_status) {
        match from {
            ArticleStatus::Draft => matches!(to, ArticleStatus::PendingReview | ArticleStatus::Archived),
            ArticleStatus::PendingReview => matches!(to, ArticleStatus::Reviewing | ArticleStatus::Draft | ArticleStatus::Archived),
            ArticleStatus::Reviewing => matches!(to, ArticleStatus::Approved | ArticleStatus::Rejected | ArticleStatus::PendingReview),
            ArticleStatus::Approved => matches!(to, ArticleStatus::Published | ArticleStatus::Archived),
            ArticleStatus::Rejected => matches!(to, ArticleStatus::Draft | ArticleStatus::Archived),
            ArticleStatus::Published => matches!(to, ArticleStatus::Archived),
            ArticleStatus::Archived => matches!(to, ArticleStatus::Draft),
        }
    } else {
        false
    }
}