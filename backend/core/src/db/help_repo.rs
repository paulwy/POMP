use crate::db::help::{
    CreateHelpArticle, CreateHelpCategory, HelpArticle, HelpCategory, HelpCategoryWithArticles,
    UpdateHelpArticle, UpdateHelpCategory,
};
use crate::db::DbPool;
use sqlx::{query, query_as};
use uuid::Uuid;

pub async fn create_help_category(
    pool: &DbPool,
    data: CreateHelpCategory,
) -> sqlx::Result<HelpCategory> {
    let sql = r#"
        INSERT INTO help_categories (code, name, icon, description, sort_order)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, code, name, icon, description, sort_order, is_active, created_at, updated_at
    "#;

    query_as::<_, HelpCategory>(sql)
        .bind(data.code)
        .bind(data.name)
        .bind(data.icon)
        .bind(data.description)
        .bind(data.sort_order.unwrap_or(0))
        .fetch_one(pool)
        .await
}

pub async fn get_help_category_by_id(pool: &DbPool, id: Uuid) -> sqlx::Result<HelpCategory> {
    let sql = r#"
        SELECT id, code, name, icon, description, sort_order, is_active, created_at, updated_at
        FROM help_categories
        WHERE id = $1
    "#;

    query_as::<_, HelpCategory>(sql)
        .bind(id)
        .fetch_one(pool)
        .await
}

pub async fn get_help_categories(
    pool: &DbPool,
    is_active: Option<bool>,
) -> sqlx::Result<Vec<HelpCategory>> {
    let sql = if let Some(active) = is_active {
        let sql = r#"
            SELECT id, code, name, icon, description, sort_order, is_active, created_at, updated_at
            FROM help_categories
            WHERE is_active = $1
            ORDER BY sort_order, created_at
        "#;
        query_as::<_, HelpCategory>(sql)
            .bind(active)
            .fetch_all(pool)
            .await
    } else {
        let sql = r#"
            SELECT id, code, name, icon, description, sort_order, is_active, created_at, updated_at
            FROM help_categories
            ORDER BY sort_order, created_at
        "#;
        query_as::<_, HelpCategory>(sql).fetch_all(pool).await
    }?;

    Ok(sql)
}

pub async fn update_help_category(
    pool: &DbPool,
    id: Uuid,
    data: UpdateHelpCategory,
) -> sqlx::Result<HelpCategory> {
    let sql = r#"
        UPDATE help_categories
        SET 
            name = COALESCE($2, name),
            icon = COALESCE($3, icon),
            description = COALESCE($4, description),
            sort_order = COALESCE($5, sort_order),
            is_active = COALESCE($6, is_active),
            updated_at = NOW()
        WHERE id = $1
        RETURNING id, code, name, icon, description, sort_order, is_active, created_at, updated_at
    "#;

    query_as::<_, HelpCategory>(sql)
        .bind(id)
        .bind(data.name)
        .bind(data.icon)
        .bind(data.description)
        .bind(data.sort_order)
        .bind(data.is_active)
        .fetch_one(pool)
        .await
}

pub async fn delete_help_category(pool: &DbPool, id: Uuid) -> sqlx::Result<()> {
    query(r#"DELETE FROM help_categories WHERE id = $1"#)
        .bind(id)
        .execute(pool)
        .await?;

    Ok(())
}

pub async fn create_help_article(
    pool: &DbPool,
    data: CreateHelpArticle,
) -> sqlx::Result<HelpArticle> {
    let sql = r#"
        INSERT INTO help_articles (category_id, slug, title, content, author, tags, is_published, is_featured, sort_order)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id, category_id, slug, title, content, author, tags, view_count, is_published, is_featured, sort_order, created_at, updated_at
    "#;

    query_as::<_, HelpArticle>(sql)
        .bind(data.category_id)
        .bind(data.slug)
        .bind(data.title)
        .bind(data.content)
        .bind(data.author)
        .bind(data.tags)
        .bind(data.is_published.unwrap_or(true))
        .bind(data.is_featured.unwrap_or(false))
        .bind(data.sort_order.unwrap_or(0))
        .fetch_one(pool)
        .await
}

pub async fn get_help_article_by_id(pool: &DbPool, id: Uuid) -> sqlx::Result<HelpArticle> {
    let sql = r#"
        SELECT id, category_id, slug, title, content, author, tags, view_count, is_published, is_featured, sort_order, created_at, updated_at
        FROM help_articles
        WHERE id = $1
    "#;

    query_as::<_, HelpArticle>(sql)
        .bind(id)
        .fetch_one(pool)
        .await
}

pub async fn get_help_article_by_slug(
    pool: &DbPool,
    slug: &str,
) -> sqlx::Result<Option<HelpArticle>> {
    let sql = r#"
        SELECT id, category_id, slug, title, content, author, tags, view_count, is_published, is_featured, sort_order, created_at, updated_at
        FROM help_articles
        WHERE slug = $1 AND is_published = true
    "#;

    let result = query_as::<_, HelpArticle>(sql)
        .bind(slug)
        .fetch_optional(pool)
        .await?;

    Ok(result)
}

pub async fn get_help_articles_by_category(
    pool: &DbPool,
    category_id: Uuid,
    is_published: Option<bool>,
) -> sqlx::Result<Vec<HelpArticle>> {
    let sql = if let Some(published) = is_published {
        let sql = r#"
            SELECT id, category_id, slug, title, content, author, tags, view_count, is_published, is_featured, sort_order, created_at, updated_at
            FROM help_articles
            WHERE category_id = $1 AND is_published = $2
            ORDER BY sort_order, created_at
        "#;
        query_as::<_, HelpArticle>(sql)
            .bind(category_id)
            .bind(published)
            .fetch_all(pool)
            .await
    } else {
        let sql = r#"
            SELECT id, category_id, slug, title, content, author, tags, view_count, is_published, is_featured, sort_order, created_at, updated_at
            FROM help_articles
            WHERE category_id = $1
            ORDER BY sort_order, created_at
        "#;
        query_as::<_, HelpArticle>(sql)
            .bind(category_id)
            .fetch_all(pool)
            .await
    }?;

    Ok(sql)
}

pub async fn get_all_published_articles(pool: &DbPool) -> sqlx::Result<Vec<HelpArticle>> {
    let sql = r#"
        SELECT id, category_id, slug, title, content, author, tags, view_count, is_published, is_featured, sort_order, created_at, updated_at
        FROM help_articles
        WHERE is_published = true
        ORDER BY created_at DESC
    "#;

    query_as::<_, HelpArticle>(sql).fetch_all(pool).await
}

pub async fn update_help_article(
    pool: &DbPool,
    id: Uuid,
    data: UpdateHelpArticle,
) -> sqlx::Result<HelpArticle> {
    let sql = r#"
        UPDATE help_articles
        SET 
            category_id = COALESCE($2, category_id),
            title = COALESCE($3, title),
            content = COALESCE($4, content),
            author = COALESCE($5, author),
            tags = COALESCE($6, tags),
            is_published = COALESCE($7, is_published),
            is_featured = COALESCE($8, is_featured),
            sort_order = COALESCE($9, sort_order),
            updated_at = NOW()
        WHERE id = $1
        RETURNING id, category_id, slug, title, content, author, tags, view_count, is_published, is_featured, sort_order, created_at, updated_at
    "#;

    query_as::<_, HelpArticle>(sql)
        .bind(id)
        .bind(data.category_id)
        .bind(data.title)
        .bind(data.content)
        .bind(data.author)
        .bind(data.tags)
        .bind(data.is_published)
        .bind(data.is_featured)
        .bind(data.sort_order)
        .fetch_one(pool)
        .await
}

pub async fn delete_help_article(pool: &DbPool, id: Uuid) -> sqlx::Result<()> {
    query(r#"DELETE FROM help_articles WHERE id = $1"#)
        .bind(id)
        .execute(pool)
        .await?;

    Ok(())
}

pub async fn increment_view_count(pool: &DbPool, id: Uuid) -> sqlx::Result<()> {
    query(r#"UPDATE help_articles SET view_count = view_count + 1 WHERE id = $1"#)
        .bind(id)
        .execute(pool)
        .await?;

    Ok(())
}

pub async fn get_category_with_articles(
    pool: &DbPool,
    category_id: Uuid,
) -> sqlx::Result<HelpCategoryWithArticles> {
    let category = get_help_category_by_id(pool, category_id).await?;
    let articles = get_help_articles_by_category(pool, category_id, Some(true)).await?;

    Ok(HelpCategoryWithArticles { category, articles })
}

pub async fn search_help_articles(
    pool: &DbPool,
    keyword: &str,
    category_id: Option<Uuid>,
) -> sqlx::Result<Vec<HelpArticle>> {
    let search_pattern = format!("%{}%", keyword);

    let sql = if let Some(cat_id) = category_id {
        let sql = r#"
            SELECT id, category_id, slug, title, content, author, tags, view_count, is_published, is_featured, sort_order, created_at, updated_at
            FROM help_articles
            WHERE is_published = true 
            AND category_id = $2
            AND (title ILIKE $1 OR content ILIKE $1 OR tags ILIKE $1)
            ORDER BY view_count DESC, created_at DESC
        "#;
        query_as::<_, HelpArticle>(sql)
            .bind(&search_pattern)
            .bind(cat_id)
            .fetch_all(pool)
            .await
    } else {
        let sql = r#"
            SELECT id, category_id, slug, title, content, author, tags, view_count, is_published, is_featured, sort_order, created_at, updated_at
            FROM help_articles
            WHERE is_published = true 
            AND (title ILIKE $1 OR content ILIKE $1 OR tags ILIKE $1)
            ORDER BY view_count DESC, created_at DESC
        "#;
        query_as::<_, HelpArticle>(sql)
            .bind(&search_pattern)
            .fetch_all(pool)
            .await
    }?;

    Ok(sql)
}
