use crate::db::dict::{
    CreateDictItem, CreateDictType, DictItem, DictType, DictTypeWithItems, UpdateDictItem,
    UpdateDictType,
};
use crate::db::DbPool;
use sqlx::{query, query_as};
use uuid::Uuid;

pub async fn create_dict_type(pool: &DbPool, data: CreateDictType) -> sqlx::Result<DictType> {
    let sql = r#"
        INSERT INTO dict_types (code, name, description, category, parent_id, sort_order, is_system)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id, code, name, description, category, parent_id, sort_order, is_system, is_active, created_at, updated_at
    "#;

    let result = query_as::<_, DictType>(sql)
        .bind(data.code)
        .bind(data.name)
        .bind(data.description)
        .bind(data.category)
        .bind(data.parent_id)
        .bind(data.sort_order.unwrap_or(0))
        .bind(data.is_system.unwrap_or(false))
        .fetch_one(pool)
        .await?;

    Ok(result)
}

pub async fn get_dict_type_by_id(pool: &DbPool, id: Uuid) -> sqlx::Result<DictType> {
    let sql = r#"
        SELECT id, code, name, description, category, parent_id, sort_order, is_system, is_active, created_at, updated_at
        FROM dict_types
        WHERE id = $1
    "#;

    query_as::<_, DictType>(sql).bind(id).fetch_one(pool).await
}

pub async fn get_dict_type_by_code(pool: &DbPool, code: &str) -> sqlx::Result<Option<DictType>> {
    let sql = r#"
        SELECT id, code, name, description, category, parent_id, sort_order, is_system, is_active, created_at, updated_at
        FROM dict_types
        WHERE code = $1 AND is_active = true
    "#;

    let result = query_as::<_, DictType>(sql)
        .bind(code)
        .fetch_optional(pool)
        .await?;
    Ok(result)
}

pub async fn get_dict_types(
    pool: &DbPool,
    category: Option<String>,
    is_active: Option<bool>,
) -> sqlx::Result<Vec<DictType>> {
    let sql = if category.is_some() && is_active.is_some() {
        let sql = r#"
            SELECT id, code, name, description, category, parent_id, sort_order, is_system, is_active, created_at, updated_at
            FROM dict_types
            WHERE category = $1 AND is_active = $2
            ORDER BY sort_order, created_at
        "#;
        query_as::<_, DictType>(sql)
            .bind(category.unwrap())
            .bind(is_active.unwrap())
            .fetch_all(pool)
            .await
    } else if category.is_some() {
        let sql = r#"
            SELECT id, code, name, description, category, parent_id, sort_order, is_system, is_active, created_at, updated_at
            FROM dict_types
            WHERE category = $1
            ORDER BY sort_order, created_at
        "#;
        query_as::<_, DictType>(sql)
            .bind(category.unwrap())
            .fetch_all(pool)
            .await
    } else if is_active.is_some() {
        let sql = r#"
            SELECT id, code, name, description, category, parent_id, sort_order, is_system, is_active, created_at, updated_at
            FROM dict_types
            WHERE is_active = $1
            ORDER BY sort_order, created_at
        "#;
        query_as::<_, DictType>(sql)
            .bind(is_active.unwrap())
            .fetch_all(pool)
            .await
    } else {
        let sql = r#"
            SELECT id, code, name, description, category, parent_id, sort_order, is_system, is_active, created_at, updated_at
            FROM dict_types
            ORDER BY sort_order, created_at
        "#;
        query_as::<_, DictType>(sql).fetch_all(pool).await
    }?;

    Ok(sql)
}

pub async fn get_dict_type_with_items(pool: &DbPool, id: Uuid) -> sqlx::Result<DictTypeWithItems> {
    let dict_type = get_dict_type_by_id(pool, id).await?;
    let items = get_dict_items_by_type(pool, id).await?;

    Ok(DictTypeWithItems { dict_type, items })
}

pub async fn update_dict_type(
    pool: &DbPool,
    id: Uuid,
    data: UpdateDictType,
) -> sqlx::Result<DictType> {
    let sql = r#"
        UPDATE dict_types
        SET 
            name = COALESCE($2, name),
            description = COALESCE($3, description),
            sort_order = COALESCE($4, sort_order),
            is_active = COALESCE($5, is_active),
            updated_at = NOW()
        WHERE id = $1
        RETURNING id, code, name, description, category, parent_id, sort_order, is_system, is_active, created_at, updated_at
    "#;

    let result = query_as::<_, DictType>(sql)
        .bind(id)
        .bind(data.name)
        .bind(data.description)
        .bind(data.sort_order)
        .bind(data.is_active)
        .fetch_one(pool)
        .await?;

    Ok(result)
}

pub async fn delete_dict_type(pool: &DbPool, id: Uuid) -> sqlx::Result<()> {
    query(r#"DELETE FROM dict_types WHERE id = $1 AND is_system = false"#)
        .bind(id)
        .execute(pool)
        .await?;

    Ok(())
}

pub async fn create_dict_item(pool: &DbPool, data: CreateDictItem) -> sqlx::Result<DictItem> {
    let sql = r#"
        INSERT INTO dict_items (dict_type_id, code, name, value, sort_order, is_default)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, dict_type_id, code, name, value, sort_order, is_default, is_active, created_at, updated_at
    "#;

    let result = query_as::<_, DictItem>(sql)
        .bind(data.dict_type_id)
        .bind(data.code)
        .bind(data.name)
        .bind(data.value)
        .bind(data.sort_order.unwrap_or(0))
        .bind(data.is_default.unwrap_or(false))
        .fetch_one(pool)
        .await?;

    Ok(result)
}

pub async fn get_dict_item_by_id(pool: &DbPool, id: Uuid) -> sqlx::Result<DictItem> {
    let sql = r#"
        SELECT id, dict_type_id, code, name, value, sort_order, is_default, is_active, created_at, updated_at
        FROM dict_items
        WHERE id = $1
    "#;

    query_as::<_, DictItem>(sql).bind(id).fetch_one(pool).await
}

pub async fn get_dict_items_by_type(
    pool: &DbPool,
    dict_type_id: Uuid,
) -> sqlx::Result<Vec<DictItem>> {
    let sql = r#"
        SELECT id, dict_type_id, code, name, value, sort_order, is_default, is_active, created_at, updated_at
        FROM dict_items
        WHERE dict_type_id = $1 AND is_active = true
        ORDER BY sort_order, created_at
    "#;

    query_as::<_, DictItem>(sql)
        .bind(dict_type_id)
        .fetch_all(pool)
        .await
}

pub async fn get_dict_items_by_type_all(
    pool: &DbPool,
    dict_type_id: Uuid,
) -> sqlx::Result<Vec<DictItem>> {
    let sql = r#"
        SELECT id, dict_type_id, code, name, value, sort_order, is_default, is_active, created_at, updated_at
        FROM dict_items
        WHERE dict_type_id = $1
        ORDER BY sort_order, created_at
    "#;

    query_as::<_, DictItem>(sql)
        .bind(dict_type_id)
        .fetch_all(pool)
        .await
}

pub async fn get_dict_items_by_code(
    pool: &DbPool,
    dict_type_code: &str,
) -> sqlx::Result<Vec<DictItem>> {
    let sql = r#"
        SELECT di.id, di.dict_type_id, di.code, di.name, di.value, di.sort_order, di.is_default, di.is_active, di.created_at, di.updated_at
        FROM dict_items di
        JOIN dict_types dt ON di.dict_type_id = dt.id
        WHERE dt.code = $1 AND di.is_active = true
        ORDER BY di.sort_order, di.created_at
    "#;

    query_as::<_, DictItem>(sql)
        .bind(dict_type_code)
        .fetch_all(pool)
        .await
}

pub async fn update_dict_item(
    pool: &DbPool,
    id: Uuid,
    data: UpdateDictItem,
) -> sqlx::Result<DictItem> {
    let sql = r#"
        UPDATE dict_items
        SET 
            name = COALESCE($2, name),
            value = COALESCE($3, value),
            sort_order = COALESCE($4, sort_order),
            is_default = COALESCE($5, is_default),
            is_active = COALESCE($6, is_active),
            updated_at = NOW()
        WHERE id = $1
        RETURNING id, dict_type_id, code, name, value, sort_order, is_default, is_active, created_at, updated_at
    "#;

    let result = query_as::<_, DictItem>(sql)
        .bind(id)
        .bind(data.name)
        .bind(data.value)
        .bind(data.sort_order)
        .bind(data.is_default)
        .bind(data.is_active)
        .fetch_one(pool)
        .await?;

    Ok(result)
}

pub async fn delete_dict_item(pool: &DbPool, id: Uuid) -> sqlx::Result<()> {
    query(r#"DELETE FROM dict_items WHERE id = $1"#)
        .bind(id)
        .execute(pool)
        .await?;

    Ok(())
}

pub async fn get_all_active_dict_types(pool: &DbPool) -> sqlx::Result<Vec<DictTypeWithItems>> {
    let types = get_dict_types(pool, None, Some(true)).await?;

    let mut result = Vec::new();
    for dict_type in types {
        let items = get_dict_items_by_type(pool, dict_type.id).await?;
        result.push(DictTypeWithItems { dict_type, items });
    }

    Ok(result)
}
