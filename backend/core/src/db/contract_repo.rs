use crate::db::contract::{
    Contract, ContractTemplate, CreateContract, CreateContractTemplate, UpdateContract,
    UpdateContractTemplate,
};
use crate::db::DbPool;
use sqlx::{query, query_as};
use uuid::Uuid;

pub async fn create_contract_template(
    pool: &DbPool,
    data: CreateContractTemplate,
) -> sqlx::Result<ContractTemplate> {
    let sql = r#"
        INSERT INTO contract_templates (
            code, name, description, contract_type, category,
            content, variables, version, is_active, is_system, sort_order
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING id, code, name, description, contract_type, category,
            content, variables, version, is_active, is_system, sort_order,
            created_at, updated_at
    "#;

    query_as::<_, ContractTemplate>(sql)
        .bind(data.code)
        .bind(data.name)
        .bind(data.description)
        .bind(data.contract_type)
        .bind(data.category)
        .bind(data.content)
        .bind(data.variables)
        .bind(data.version.unwrap_or_else(|| "1.0".to_string()))
        .bind(data.is_active.unwrap_or(true))
        .bind(data.is_system.unwrap_or(false))
        .bind(data.sort_order.unwrap_or(0))
        .fetch_one(pool)
        .await
}

pub async fn get_contract_template_by_id(
    pool: &DbPool,
    id: Uuid,
) -> sqlx::Result<Option<ContractTemplate>> {
    let sql = r#"
        SELECT id, code, name, description, contract_type, category,
            content, variables, version, is_active, is_system, sort_order,
            created_at, updated_at
        FROM contract_templates
        WHERE id = $1
    "#;

    query_as::<_, ContractTemplate>(sql)
        .bind(id)
        .fetch_optional(pool)
        .await
}

pub async fn get_contract_template_by_code(
    pool: &DbPool,
    code: &str,
) -> sqlx::Result<Option<ContractTemplate>> {
    let sql = r#"
        SELECT id, code, name, description, contract_type, category,
            content, variables, version, is_active, is_system, sort_order,
            created_at, updated_at
        FROM contract_templates
        WHERE code = $1
    "#;

    query_as::<_, ContractTemplate>(sql)
        .bind(code)
        .fetch_optional(pool)
        .await
}

pub async fn get_contract_templates(
    pool: &DbPool,
    contract_type: Option<&str>,
    category: Option<&str>,
    is_active: Option<bool>,
) -> sqlx::Result<Vec<ContractTemplate>> {
    let sql = match (contract_type, category, is_active) {
        (Some(_t), Some(_c), Some(_a)) => {
            r#"
            SELECT id, code, name, description, contract_type, category,
                content, variables, version, is_active, is_system, sort_order,
                created_at, updated_at
            FROM contract_templates
            WHERE contract_type = $1 AND category = $2 AND is_active = $3
            ORDER BY sort_order, created_at
        "#
        }
        (Some(_t), Some(_c), None) => {
            r#"
            SELECT id, code, name, description, contract_type, category,
                content, variables, version, is_active, is_system, sort_order,
                created_at, updated_at
            FROM contract_templates
            WHERE contract_type = $1 AND category = $2
            ORDER BY sort_order, created_at
        "#
        }
        (Some(_t), None, Some(_a)) => {
            r#"
            SELECT id, code, name, description, contract_type, category,
                content, variables, version, is_active, is_system, sort_order,
                created_at, updated_at
            FROM contract_templates
            WHERE contract_type = $1 AND is_active = $2
            ORDER BY sort_order, created_at
        "#
        }
        (Some(_t), None, None) => {
            r#"
            SELECT id, code, name, description, contract_type, category,
                content, variables, version, is_active, is_system, sort_order,
                created_at, updated_at
            FROM contract_templates
            WHERE contract_type = $1
            ORDER BY sort_order, created_at
        "#
        }
        (None, Some(_c), Some(_a)) => {
            r#"
            SELECT id, code, name, description, contract_type, category,
                content, variables, version, is_active, is_system, sort_order,
                created_at, updated_at
            FROM contract_templates
            WHERE category = $1 AND is_active = $2
            ORDER BY sort_order, created_at
        "#
        }
        (None, Some(_c), None) => {
            r#"
            SELECT id, code, name, description, contract_type, category,
                content, variables, version, is_active, is_system, sort_order,
                created_at, updated_at
            FROM contract_templates
            WHERE category = $1
            ORDER BY sort_order, created_at
        "#
        }
        (None, None, Some(_a)) => {
            r#"
            SELECT id, code, name, description, contract_type, category,
                content, variables, version, is_active, is_system, sort_order,
                created_at, updated_at
            FROM contract_templates
            WHERE is_active = $1
            ORDER BY sort_order, created_at
        "#
        }
        _ => {
            r#"
            SELECT id, code, name, description, contract_type, category,
                content, variables, version, is_active, is_system, sort_order,
                created_at, updated_at
            FROM contract_templates
            ORDER BY sort_order, created_at
        "#
        }
    };

    let mut query = query_as::<_, ContractTemplate>(sql);

    if let Some(t) = contract_type {
        query = query.bind(t);
    }
    if let Some(c) = category {
        query = query.bind(c);
    }
    if let Some(a) = is_active {
        query = query.bind(a);
    }

    query.fetch_all(pool).await
}

pub async fn update_contract_template(
    pool: &DbPool,
    id: Uuid,
    data: UpdateContractTemplate,
) -> sqlx::Result<ContractTemplate> {
    let sql = r#"
        UPDATE contract_templates
        SET 
            name = COALESCE($2, name),
            description = COALESCE($3, description),
            contract_type = COALESCE($4, contract_type),
            category = COALESCE($5, category),
            content = COALESCE($6, content),
            variables = COALESCE($7, variables),
            version = COALESCE($8, version),
            is_active = COALESCE($9, is_active),
            sort_order = COALESCE($10, sort_order),
            updated_at = NOW()
        WHERE id = $1
        RETURNING id, code, name, description, contract_type, category,
            content, variables, version, is_active, is_system, sort_order,
            created_at, updated_at
    "#;

    query_as::<_, ContractTemplate>(sql)
        .bind(id)
        .bind(data.name)
        .bind(data.description)
        .bind(data.contract_type)
        .bind(data.category)
        .bind(data.content)
        .bind(data.variables)
        .bind(data.version)
        .bind(data.is_active)
        .bind(data.sort_order)
        .fetch_one(pool)
        .await
}

pub async fn delete_contract_template(pool: &DbPool, id: Uuid) -> sqlx::Result<()> {
    query(r#"DELETE FROM contract_templates WHERE id = $1 AND is_system = false"#)
        .bind(id)
        .execute(pool)
        .await?;

    Ok(())
}

pub async fn create_contract(pool: &DbPool, data: CreateContract) -> sqlx::Result<Contract> {
    let sql = r#"
        INSERT INTO contracts (
            code, name, description, contract_type, category,
            content, content_rendered, status, first_party, second_party,
            amount, currency, start_date, end_date, sign_date,
            project_id, created_by, risk_level
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
        RETURNING id, code, name, description, contract_type, category,
            content, content_rendered, status, first_party, second_party,
            amount, currency, start_date, end_date, sign_date,
            project_id, created_by, risk_level, created_at, updated_at
    "#;

    let generated_code = data
        .code
        .unwrap_or_else(|| format!("CONT-{}", chrono::Utc::now().format("%Y%m%d%H%M%S")));

    let content = data.content.unwrap_or_default();
    let content_rendered = data.content_rendered.unwrap_or_else(|| content.clone());

    query_as::<_, Contract>(sql)
        .bind(generated_code)
        .bind(data.name)
        .bind(data.description)
        .bind(data.contract_type)
        .bind(data.category)
        .bind(content)
        .bind(content_rendered)
        .bind("DRAFT".to_string())
        .bind(data.first_party)
        .bind(data.second_party)
        .bind(data.amount)
        .bind(data.currency.unwrap_or("CNY".to_string()))
        .bind(data.start_date)
        .bind(data.end_date)
        .bind(data.sign_date)
        .bind(data.project_id)
        .bind(data.created_by)
        .bind(data.risk_level)
        .fetch_one(pool)
        .await
}

pub async fn get_contract_by_id(pool: &DbPool, id: Uuid) -> sqlx::Result<Option<Contract>> {
    let sql = r#"
        SELECT id, code, name, description, contract_type, category,
            content, content_rendered, status, first_party, second_party,
            amount, currency, start_date, end_date, sign_date,
            project_id, created_by, risk_level, created_at, updated_at
        FROM contracts
        WHERE id = $1
    "#;

    query_as::<_, Contract>(sql).bind(id).fetch_optional(pool).await
}

pub async fn get_contracts(
    pool: &DbPool,
    status: Option<&str>,
    contract_type: Option<&str>,
    category: Option<&str>,
    page: Option<i32>,
    page_size: Option<i32>,
) -> sqlx::Result<Vec<Contract>> {
    let limit = page_size.unwrap_or(20);
    let offset = ((page.unwrap_or(1) - 1) * limit) as i64;

    let sql = r#"
        SELECT id, code, name, description, contract_type, category,
            content, content_rendered, status, first_party, second_party,
            amount, currency, start_date, end_date, sign_date,
            project_id, created_by, risk_level, created_at, updated_at
        FROM contracts
        WHERE ($1::VARCHAR IS NULL OR status = $1)
            AND ($2::VARCHAR IS NULL OR contract_type = $2)
            AND ($3::VARCHAR IS NULL OR category = $3)
        ORDER BY created_at DESC
        LIMIT $4 OFFSET $5
    "#;

    query_as::<_, Contract>(sql)
        .bind(status)
        .bind(contract_type)
        .bind(category)
        .bind(limit)
        .bind(offset)
        .fetch_all(pool)
        .await
}

pub async fn update_contract(
    pool: &DbPool,
    id: Uuid,
    data: UpdateContract,
) -> sqlx::Result<Contract> {
    let sql = r#"
        UPDATE contracts
        SET 
            name = COALESCE($2, name),
            description = COALESCE($3, description),
            contract_type = COALESCE($4, contract_type),
            category = COALESCE($5, category),
            content = COALESCE($6, content),
            content_rendered = COALESCE($7, content_rendered),
            first_party = COALESCE($8, first_party),
            second_party = COALESCE($9, second_party),
            amount = COALESCE($10, amount),
            currency = COALESCE($11, currency),
            start_date = COALESCE($12, start_date),
            end_date = COALESCE($13, end_date),
            sign_date = COALESCE($14, sign_date),
            project_id = COALESCE($15, project_id),
            status = COALESCE($16, status),
            risk_level = COALESCE($17, risk_level),
            updated_at = NOW()
        WHERE id = $1
        RETURNING id, code, name, description, contract_type, category,
            content, content_rendered, status, first_party, second_party,
            amount, currency, start_date, end_date, sign_date,
            project_id, created_by, risk_level, created_at, updated_at
    "#;

    query_as::<_, Contract>(sql)
        .bind(id)
        .bind(data.name)
        .bind(data.description)
        .bind(data.contract_type)
        .bind(data.category)
        .bind(data.content)
        .bind(data.content_rendered)
        .bind(data.first_party)
        .bind(data.second_party)
        .bind(data.amount)
        .bind(data.currency)
        .bind(data.start_date)
        .bind(data.end_date)
        .bind(data.sign_date)
        .bind(data.project_id)
        .bind(data.status)
        .bind(data.risk_level)
        .fetch_one(pool)
        .await
}

pub async fn delete_contract(pool: &DbPool, id: Uuid) -> sqlx::Result<()> {
    query(r#"DELETE FROM contracts WHERE id = $1"#)
        .bind(id)
        .execute(pool)
        .await?;

    Ok(())
}
