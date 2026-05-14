use crate::db::cms::{
    Article, ArticleReview, ArticleSearchParams, Category, CreateArticle, CreateCategory,
    ReviewArticle, ReviewAssignment, ReviewStats, UpdateArticle, is_valid_status_transition,
};
use crate::db::DbPool;
use anyhow::Result;
use chrono::Utc;
use sqlx::{query, query_as, Row};
use uuid::Uuid;

pub async fn get_categories(pool: &DbPool, department_id: Option<Uuid>) -> Result<Vec<Category>> {
    let sql = r#"
        SELECT id, name, code, description, parent_id, department_id, sort_order, is_active, created_at, updated_at
        FROM cms_categories
        WHERE ($1::UUID IS NULL OR department_id = $1)
        ORDER BY sort_order, name
    "#;

    let categories = query_as::<_, Category>(sql)
        .bind(department_id)
        .fetch_all(pool)
        .await?;

    Ok(categories)
}

pub async fn get_category_by_code(pool: &DbPool, code: &str) -> Result<Option<Category>> {
    let sql = r#"
        SELECT id, name, code, description, parent_id, department_id, sort_order, is_active, created_at, updated_at
        FROM cms_categories
        WHERE code = $1
    "#;

    let category = query_as::<_, Category>(sql)
        .bind(code)
        .fetch_optional(pool)
        .await?;

    Ok(category)
}

pub async fn create_category(pool: &DbPool, category: CreateCategory) -> Result<Category> {
    let id = Uuid::new_v4();
    let now = Utc::now();
    let sort_order = category.sort_order.unwrap_or(0);

    let sql = r#"
        INSERT INTO cms_categories (id, name, code, description, parent_id, department_id, sort_order, is_active, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, true, $8, $9)
        RETURNING id, name, code, description, parent_id, department_id, sort_order, is_active, created_at, updated_at
    "#;

    let new_category = query_as::<_, Category>(sql)
        .bind(id)
        .bind(category.name)
        .bind(category.code)
        .bind(category.description)
        .bind(category.parent_id)
        .bind(category.department_id)
        .bind(sort_order)
        .bind(now)
        .bind(now)
        .fetch_one(pool)
        .await?;

    Ok(new_category)
}

pub async fn get_articles(pool: &DbPool, params: ArticleSearchParams) -> Result<Vec<Article>> {
    let sql = r#"
        SELECT id, category_id, title, slug, summary, content, cover_image, author_id, 
               department_id, status, view_count, is_top, published_at, 
               review_timeout_days, review_reminded_at, current_reviewer_id,
               review_stage, max_review_stages, created_at, updated_at
        FROM cms_articles
        WHERE ($1::TEXT IS NULL OR status = $1)
          AND ($2::TEXT IS NULL OR EXISTS (
              SELECT 1 FROM cms_categories c WHERE c.id = cms_articles.category_id AND c.code = $2
          ))
        ORDER BY is_top DESC, created_at DESC
        LIMIT $3 OFFSET $4
    "#;

    let page = params.page.unwrap_or(1);
    let page_size = params.page_size.unwrap_or(50);
    let offset = (page - 1) * page_size;

    let articles = query_as::<_, Article>(sql)
        .bind(params.status)
        .bind(params.category_code)
        .bind(page_size)
        .bind(offset)
        .fetch_all(pool)
        .await?;

    Ok(articles)
}

pub async fn get_article(pool: &DbPool, id: Uuid) -> Result<Option<Article>> {
    let sql = r#"
        SELECT id, category_id, title, slug, summary, content, cover_image, author_id, 
               department_id, status, view_count, is_top, published_at, 
               review_timeout_days, review_reminded_at, current_reviewer_id,
               review_stage, max_review_stages, created_at, updated_at
        FROM cms_articles
        WHERE id = $1
    "#;

    let article = query_as::<_, Article>(sql)
        .bind(id)
        .fetch_optional(pool)
        .await?;

    Ok(article)
}

pub async fn create_article(pool: &DbPool, article: CreateArticle) -> Result<Article> {
    let id = Uuid::new_v4();
    let now = Utc::now();
    let slug = format!("article-{}", id.to_string().replace("-", ""));

    let mut category = get_category_by_code(pool, &article.category_code).await?;
    if category.is_none() {
        let category_names: std::collections::HashMap<&str, &str> = [
            ("products", "产品中心"),
            ("news", "新闻动态"),
            ("about", "关于我们"),
            ("services", "服务项目"),
            ("cases", "案例展示"),
            ("contact", "联系我们"),
            ("career", "人才招聘"),
            ("faq", "常见问题"),
        ]
        .iter()
        .cloned()
        .collect();

        let category_code_str = article.category_code.as_str();
        let category_name = category_names
            .get(category_code_str)
            .copied()
            .unwrap_or(category_code_str);

        let new_category = CreateCategory {
            name: category_name.to_string(),
            code: article.category_code.clone(),
            description: None,
            parent_id: None,
            department_id: None,
            sort_order: None,
        };

        category = Some(create_category(pool, new_category).await?);
    }

    let category_id = category
        .ok_or_else(|| anyhow::anyhow!("Category not found"))?
        .id;

    let sql = r#"
        INSERT INTO cms_articles (
            id, category_id, title, slug, summary, content, cover_image, author_id,
            status, view_count, is_top, review_stage, max_review_stages, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'draft', 0, false, 0, 1, $9, $10)
        RETURNING id, category_id, title, slug, summary, content, cover_image, author_id,
                  department_id, status, view_count, is_top, published_at,
                  review_timeout_days, review_reminded_at, current_reviewer_id,
                  review_stage, max_review_stages, created_at, updated_at
    "#;

    let new_article = query_as::<_, Article>(sql)
        .bind(id)
        .bind(category_id)
        .bind(article.title)
        .bind(slug)
        .bind(article.summary)
        .bind(article.content)
        .bind(article.cover_image)
        .bind(article.author_id)
        .bind(now)
        .bind(now)
        .fetch_one(pool)
        .await?;

    Ok(new_article)
}

pub async fn update_article(
    pool: &DbPool,
    id: Uuid,
    update: UpdateArticle,
) -> Result<Option<Article>> {
    let now = Utc::now();

    let sql = r#"
        UPDATE cms_articles
        SET title = COALESCE($1, title),
            summary = COALESCE($2, summary),
            content = COALESCE($3, content),
            cover_image = COALESCE($4, cover_image),
            updated_at = $5
        WHERE id = $6 AND status = 'draft'
        RETURNING id, category_id, title, slug, summary, content, cover_image, author_id,
                  department_id, status, view_count, is_top, published_at,
                  review_timeout_days, review_reminded_at, current_reviewer_id,
                  review_stage, max_review_stages, created_at, updated_at
    "#;

    let article = query_as::<_, Article>(sql)
        .bind(update.title)
        .bind(update.summary)
        .bind(update.content)
        .bind(update.cover_image)
        .bind(now)
        .bind(id)
        .fetch_optional(pool)
        .await?;

    Ok(article)
}

pub async fn submit_article_for_review(
    pool: &DbPool,
    id: Uuid,
    user_id: Uuid,
) -> Result<Option<Article>> {
    let now = Utc::now();

    let current_article = get_article(pool, id).await?;
    if let Some(article) = current_article {
        if !is_valid_status_transition(&article.status, "pending_review") {
            return Err(anyhow::anyhow!("Cannot submit article for review from current status"));
        }
    } else {
        return Ok(None);
    }

    let sql = r#"
        UPDATE cms_articles
        SET status = 'pending_review',
            review_stage = 1,
            updated_at = $1
        WHERE id = $2
        RETURNING id, category_id, title, slug, summary, content, cover_image, author_id,
                  department_id, status, view_count, is_top, published_at,
                  review_timeout_days, review_reminded_at, current_reviewer_id,
                  review_stage, max_review_stages, created_at, updated_at
    "#;

    let article = query_as::<_, Article>(sql)
        .bind(now)
        .bind(id)
        .fetch_optional(pool)
        .await?;

    Ok(article)
}

pub async fn assign_reviewer(
    pool: &DbPool,
    article_id: Uuid,
    reviewer_id: Uuid,
) -> Result<Option<Article>> {
    let now = Utc::now();

    let sql = r#"
        UPDATE cms_articles
        SET status = 'reviewing',
            current_reviewer_id = $1,
            updated_at = $2
        WHERE id = $3 AND status = 'pending_review'
        RETURNING id, category_id, title, slug, summary, content, cover_image, author_id,
                  department_id, status, view_count, is_top, published_at,
                  review_timeout_days, review_reminded_at, current_reviewer_id,
                  review_stage, max_review_stages, created_at, updated_at
    "#;

    let article = query_as::<_, Article>(sql)
        .bind(reviewer_id)
        .bind(now)
        .bind(article_id)
        .fetch_optional(pool)
        .await?;

    Ok(article)
}

pub async fn review_article(
    pool: &DbPool,
    id: Uuid,
    reviewer_id: Uuid,
    review: ReviewArticle,
) -> Result<Option<ArticleReview>> {
    let review_id = Uuid::new_v4();
    let now = Utc::now();

    let current_article = get_article(pool, id).await?;
    let article = match &current_article {
        Some(a) => {
            if a.current_reviewer_id != Some(reviewer_id) {
                return Err(anyhow::anyhow!("User is not assigned as reviewer for this article"));
            }
            a
        }
        None => return Ok(None),
    };

    let review_stage = article.review_stage.unwrap_or(1);

    let sql = r#"
        INSERT INTO cms_article_reviews (id, article_id, reviewer_id, status, comment, reviewed_at, review_stage, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id, article_id, reviewer_id, status, comment, reviewed_at, review_stage, created_at
    "#;

    let new_review = query_as::<_, ArticleReview>(sql)
        .bind(review_id)
        .bind(id)
        .bind(reviewer_id)
        .bind(&review.status)
        .bind(review.comment)
        .bind(now)
        .bind(review_stage)
        .bind(now)
        .fetch_one(pool)
        .await?;

    let (article_status, next_stage) = if review.status == "approved" {
        let max_stages = article.max_review_stages.unwrap_or(1);
        if review_stage >= max_stages {
            ("approved", None)
        } else {
            ("pending_review", Some(review_stage + 1))
        }
    } else {
        ("rejected", None)
    };

    let update_sql = if let Some(stage) = next_stage {
        r#"
            UPDATE cms_articles
            SET status = $1,
                review_stage = $2,
                current_reviewer_id = NULL,
                updated_at = $3
            WHERE id = $4
        "#
    } else {
        r#"
            UPDATE cms_articles
            SET status = $1,
                published_at = CASE WHEN $1 = 'approved' THEN $2 ELSE published_at END,
                updated_at = $2
            WHERE id = $3
        "#
    };

    if next_stage.is_some() {
        query(update_sql)
            .bind(article_status)
            .bind(next_stage.unwrap())
            .bind(now)
            .bind(id)
            .execute(pool)
            .await?;
    } else {
        query(update_sql)
            .bind(article_status)
            .bind(now)
            .bind(id)
            .execute(pool)
            .await?;
    }

    Ok(Some(new_review))
}

pub async fn publish_article(pool: &DbPool, id: Uuid) -> Result<Option<Article>> {
    let now = Utc::now();

    let current_article = get_article(pool, id).await?;
    if let Some(article) = current_article {
        if !is_valid_status_transition(&article.status, "published") {
            return Err(anyhow::anyhow!("Cannot publish article from current status"));
        }
    } else {
        return Ok(None);
    }

    let sql = r#"
        UPDATE cms_articles
        SET status = 'published',
            published_at = $1,
            updated_at = $2
        WHERE id = $3 AND status = 'approved'
        RETURNING id, category_id, title, slug, summary, content, cover_image, author_id,
                  department_id, status, view_count, is_top, published_at,
                  review_timeout_days, review_reminded_at, current_reviewer_id,
                  review_stage, max_review_stages, created_at, updated_at
    "#;

    let article = query_as::<_, Article>(sql)
        .bind(now)
        .bind(now)
        .bind(id)
        .fetch_optional(pool)
        .await?;

    Ok(article)
}

pub async fn archive_article(pool: &DbPool, id: Uuid) -> Result<Option<Article>> {
    let now = Utc::now();

    let current_article = get_article(pool, id).await?;
    if let Some(article) = current_article {
        if !is_valid_status_transition(&article.status, "archived") {
            return Err(anyhow::anyhow!("Cannot archive article from current status"));
        }
    } else {
        return Ok(None);
    }

    let sql = r#"
        UPDATE cms_articles
        SET status = 'archived',
            updated_at = $1
        WHERE id = $2
        RETURNING id, category_id, title, slug, summary, content, cover_image, author_id,
                  department_id, status, view_count, is_top, published_at,
                  review_timeout_days, review_reminded_at, current_reviewer_id,
                  review_stage, max_review_stages, created_at, updated_at
    "#;

    let article = query_as::<_, Article>(sql)
        .bind(now)
        .bind(id)
        .fetch_optional(pool)
        .await?;

    Ok(article)
}

pub async fn restore_article_from_archive(pool: &DbPool, id: Uuid) -> Result<Option<Article>> {
    let now = Utc::now();

    let sql = r#"
        UPDATE cms_articles
        SET status = 'draft',
            updated_at = $1
        WHERE id = $2 AND status = 'archived'
        RETURNING id, category_id, title, slug, summary, content, cover_image, author_id,
                  department_id, status, view_count, is_top, published_at,
                  review_timeout_days, review_reminded_at, current_reviewer_id,
                  review_stage, max_review_stages, created_at, updated_at
    "#;

    let article = query_as::<_, Article>(sql)
        .bind(now)
        .bind(id)
        .fetch_optional(pool)
        .await?;

    Ok(article)
}

pub async fn get_article_reviews(pool: &DbPool, article_id: Uuid) -> Result<Vec<ArticleReview>> {
    let sql = r#"
        SELECT id, article_id, reviewer_id, status, comment, reviewed_at, review_stage, created_at
        FROM cms_article_reviews
        WHERE article_id = $1
        ORDER BY review_stage, created_at DESC
    "#;

    let reviews = query_as::<_, ArticleReview>(sql)
        .bind(article_id)
        .fetch_all(pool)
        .await?;

    Ok(reviews)
}

pub async fn get_pending_review_articles(pool: &DbPool) -> Result<Vec<Article>> {
    let sql = r#"
        SELECT id, category_id, title, slug, summary, content, cover_image, author_id, 
               department_id, status, view_count, is_top, published_at, 
               review_timeout_days, review_reminded_at, current_reviewer_id,
               review_stage, max_review_stages, created_at, updated_at
        FROM cms_articles
        WHERE status = 'pending_review'
        ORDER BY created_at DESC
    "#;

    let articles = query_as::<_, Article>(sql).fetch_all(pool).await?;

    Ok(articles)
}

pub async fn get_reviewing_articles(pool: &DbPool, reviewer_id: Option<Uuid>) -> Result<Vec<Article>> {
    let sql = r#"
        SELECT id, category_id, title, slug, summary, content, cover_image, author_id, 
               department_id, status, view_count, is_top, published_at, 
               review_timeout_days, review_reminded_at, current_reviewer_id,
               review_stage, max_review_stages, created_at, updated_at
        FROM cms_articles
        WHERE status = 'reviewing'
          AND ($1::UUID IS NULL OR current_reviewer_id = $1)
        ORDER BY created_at DESC
    "#;

    let articles = query_as::<_, Article>(sql)
        .bind(reviewer_id)
        .fetch_all(pool)
        .await?;

    Ok(articles)
}

pub async fn get_reviewed_articles(pool: &DbPool) -> Result<Vec<Article>> {
    let sql = r#"
        SELECT id, category_id, title, slug, summary, content, cover_image, author_id, 
               department_id, status, view_count, is_top, published_at, 
               review_timeout_days, review_reminded_at, current_reviewer_id,
               review_stage, max_review_stages, created_at, updated_at
        FROM cms_articles
        WHERE status IN ('approved', 'rejected', 'archived')
        ORDER BY created_at DESC
    "#;

    let articles = query_as::<_, Article>(sql).fetch_all(pool).await?;

    Ok(articles)
}

pub async fn get_review_stats(pool: &DbPool) -> Result<ReviewStats> {
    let sql = r#"
        SELECT 
            COALESCE(SUM(CASE WHEN status = 'pending_review' THEN 1 ELSE 0 END), 0) as total_pending,
            COALESCE(SUM(CASE WHEN status = 'reviewing' THEN 1 ELSE 0 END), 0) as total_reviewing,
            COALESCE(SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END), 0) as total_approved,
            COALESCE(SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END), 0) as total_rejected,
            COALESCE(SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END), 0) as total_draft
        FROM cms_articles
    "#;

    let row = query(sql).fetch_one(pool).await?;
    
    let stats = ReviewStats {
        total_pending: row.get("total_pending"),
        total_reviewing: row.get("total_reviewing"),
        total_approved: row.get("total_approved"),
        total_rejected: row.get("total_rejected"),
        total_draft: row.get("total_draft"),
    };

    Ok(stats)
}

pub async fn get_review_assignments(pool: &DbPool, reviewer_id: Uuid) -> Result<Vec<ReviewAssignment>> {
    let sql = r#"
        SELECT 
            a.id as article_id,
            a.current_reviewer_id as reviewer_id,
            a.review_stage as stage,
            a.updated_at as assigned_at,
            false as is_completed
        FROM cms_articles a
        WHERE a.status = 'reviewing' AND a.current_reviewer_id = $1
        ORDER BY a.created_at DESC
    "#;

    let assignments = query_as::<_, ReviewAssignment>(sql)
        .bind(reviewer_id)
        .fetch_all(pool)
        .await?;

    Ok(assignments)
}