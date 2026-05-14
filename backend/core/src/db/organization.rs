use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::{FromRow, PgPool};
use uuid::Uuid;

#[derive(Debug, Clone, FromRow)]
pub struct Department {
    pub id: Uuid,
    pub name: String,
    pub code: String,
    pub parent_id: Option<Uuid>,
    pub manager_id: Option<Uuid>,
    pub description: Option<String>,
    pub is_active: bool,
    pub sort_order: Option<i32>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone)]
pub struct CreateDepartment {
    pub name: String,
    pub code: String,
    pub parent_id: Option<Uuid>,
    pub manager_id: Option<Uuid>,
    pub description: Option<String>,
    pub sort_order: Option<i32>,
}

#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct PositionLevel {
    pub id: Uuid,
    pub name: String,
    pub code: Option<String>,
    pub level: i32,
    pub description: Option<String>,
    pub is_active: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreatePositionLevel {
    pub name: String,
    pub code: String,
    pub level: i32,
    pub description: Option<String>,
}

#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct Position {
    pub id: Uuid,
    pub name: String,
    pub code: Option<String>,
    pub department_id: Option<Uuid>,
    pub level_id: Option<Uuid>,
    pub description: Option<String>,
    pub is_leader: bool,
    pub is_active: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreatePosition {
    pub name: String,
    pub code: String,
    pub department_id: Option<Uuid>,
    pub level_id: Option<Uuid>,
    pub description: Option<String>,
    pub is_leader: bool,
}

#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct ApprovalRule {
    pub id: Uuid,
    pub name: String,
    pub code: Option<String>,
    pub rule_type: String,
    pub department_id: Option<Uuid>,
    pub position_level_id: Option<Uuid>,
    pub specific_user_id: Option<Uuid>,
    pub workflow_type: Option<String>,
    pub node_order: Option<i32>,
    pub min_approvers: Option<i32>,
    pub approval_mode: Option<String>,
    pub condition_expression: Option<String>,
    pub description: Option<String>,
    pub is_active: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateApprovalRule {
    pub name: String,
    pub code: String,
    pub rule_type: String,
    pub department_id: Option<Uuid>,
    pub position_level_id: Option<Uuid>,
    pub specific_user_id: Option<Uuid>,
    pub workflow_type: Option<String>,
    pub node_order: Option<i32>,
    pub min_approvers: Option<i32>,
    pub approval_mode: Option<String>,
    pub condition_expression: Option<String>,
    pub description: Option<String>,
}

pub async fn create_department(
    pool: &PgPool,
    req: CreateDepartment,
) -> Result<Department, sqlx::Error> {
    if let Some(parent_id) = req.parent_id {
        let parent_exists = sqlx::query_scalar::<_, bool>(
            "SELECT EXISTS(SELECT 1 FROM departments WHERE id = $1)"
        )
        .bind(parent_id)
        .fetch_one(pool)
        .await?;

        if !parent_exists {
            return Err(sqlx::Error::Protocol(
                "Parent department does not exist".into(),
            ));
        }
    }

    let id = Uuid::new_v4();
    let now = Utc::now();
    let sort_order = req.sort_order.unwrap_or(0);

    let dept = sqlx::query_as::<_, Department>(
        r#"
        INSERT INTO departments (id, name, code, parent_id, manager_id, description, is_active, sort_order, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, true, $7, $8, $8)
        RETURNING id, name, code, parent_id, manager_id, description, is_active, sort_order, created_at, updated_at
        "#,
    )
    .bind(id)
    .bind(&req.name)
    .bind(&req.code)
    .bind(req.parent_id)
    .bind(req.manager_id)
    .bind(&req.description)
    .bind(sort_order)
    .bind(now)
    .fetch_one(pool)
    .await?;

    Ok(dept)
}

pub async fn get_department(
    pool: &PgPool,
    id: Uuid,
) -> Result<Option<Department>, sqlx::Error> {
    let dept = sqlx::query_as::<_, Department>(
        r#"
        SELECT id, name, code, parent_id, manager_id, description, is_active, sort_order, created_at, updated_at
        FROM departments
        WHERE id = $1
        "#,
    )
    .bind(id)
    .fetch_optional(pool)
    .await?;

    Ok(dept)
}

pub async fn get_all_departments(pool: &PgPool) -> Result<Vec<Department>, sqlx::Error> {
    let depts = sqlx::query_as::<_, Department>(
        r#"
        SELECT id, name, code, parent_id, manager_id, description, is_active, sort_order, created_at, updated_at
        FROM departments
        ORDER BY parent_id ASC NULLS FIRST, sort_order ASC NULLS LAST, created_at ASC
        "#,
    )
    .fetch_all(pool)
    .await?;

    Ok(depts)
}

pub async fn update_department(
    pool: &PgPool,
    id: Uuid,
    req: CreateDepartment,
) -> Result<Department, sqlx::Error> {
    if let Some(parent_id) = req.parent_id {
        if parent_id == id {
            return Err(sqlx::Error::Protocol(
                "Department cannot be its own parent".into(),
            ));
        }

        let parent_exists = sqlx::query_scalar::<_, bool>(
            "SELECT EXISTS(SELECT 1 FROM departments WHERE id = $1)"
        )
        .bind(parent_id)
        .fetch_one(pool)
        .await?;

        if !parent_exists {
            return Err(sqlx::Error::Protocol(
                "Parent department does not exist".into(),
            ));
        }
    }

    let sort_order = req.sort_order.unwrap_or(0);

    let dept = sqlx::query_as::<_, Department>(
        r#"
        UPDATE departments
        SET name = $2, code = $3, parent_id = $4, manager_id = $5, description = $6, sort_order = $7, updated_at = NOW()
        WHERE id = $1
        RETURNING id, name, code, parent_id, manager_id, description, is_active, sort_order, created_at, updated_at
        "#,
    )
    .bind(id)
    .bind(&req.name)
    .bind(&req.code)
    .bind(req.parent_id)
    .bind(req.manager_id)
    .bind(&req.description)
    .bind(sort_order)
    .fetch_one(pool)
    .await?;

    Ok(dept)
}

pub async fn delete_department(pool: &PgPool, id: Uuid) -> Result<bool, sqlx::Error> {
    let result = sqlx::query("DELETE FROM departments WHERE id = $1")
        .bind(id)
        .execute(pool)
        .await?;

    Ok(result.rows_affected() > 0)
}

pub async fn get_department_children(
    pool: &PgPool,
    parent_id: Uuid,
) -> Result<Vec<Department>, sqlx::Error> {
    let children = sqlx::query_as::<_, Department>(
        r#"
        SELECT id, name, code, parent_id, manager_id, description, is_active, sort_order, created_at, updated_at
        FROM departments
        WHERE parent_id = $1
        ORDER BY sort_order ASC NULLS LAST, name ASC
        "#,
    )
    .bind(parent_id)
    .fetch_all(pool)
    .await?;

    Ok(children)
}

pub async fn get_all_position_levels(pool: &PgPool) -> Result<Vec<PositionLevel>, sqlx::Error> {
    let levels = sqlx::query_as::<_, PositionLevel>(
        r#"SELECT id, name, code, level, description, is_active, created_at, updated_at FROM position_levels ORDER BY level ASC"#
    )
    .fetch_all(pool)
    .await?;
    Ok(levels)
}

pub async fn create_position_level(pool: &PgPool, req: CreatePositionLevel) -> Result<PositionLevel, sqlx::Error> {
    let id = Uuid::new_v4();
    let now = Utc::now();
    let level = sqlx::query_as::<_, PositionLevel>(
        r#"INSERT INTO position_levels (id, name, code, level, description, is_active, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, true, $6, $6)
           RETURNING id, name, code, level, description, is_active, created_at, updated_at"#
    )
    .bind(id)
    .bind(&req.name)
    .bind(&req.code)
    .bind(req.level)
    .bind(&req.description)
    .bind(now)
    .fetch_one(pool)
    .await?;
    Ok(level)
}

pub async fn update_position_level(pool: &PgPool, id: Uuid, req: CreatePositionLevel) -> Result<PositionLevel, sqlx::Error> {
    let level = sqlx::query_as::<_, PositionLevel>(
        r#"UPDATE position_levels SET name = $2, code = $3, level = $4, description = $5, updated_at = NOW()
           WHERE id = $1
           RETURNING id, name, code, level, description, is_active, created_at, updated_at"#
    )
    .bind(id)
    .bind(&req.name)
    .bind(&req.code)
    .bind(req.level)
    .bind(&req.description)
    .fetch_one(pool)
    .await?;
    Ok(level)
}

pub async fn delete_position_level(pool: &PgPool, id: Uuid) -> Result<bool, sqlx::Error> {
    let result = sqlx::query("DELETE FROM position_levels WHERE id = $1")
        .bind(id)
        .execute(pool)
        .await?;
    Ok(result.rows_affected() > 0)
}

pub async fn get_all_positions(pool: &PgPool) -> Result<Vec<Position>, sqlx::Error> {
    let positions = sqlx::query_as::<_, Position>(
        r#"SELECT id, name, code, department_id, level_id, description, is_leader, is_active, created_at, updated_at FROM positions ORDER BY created_at ASC"#
    )
    .fetch_all(pool)
    .await?;
    Ok(positions)
}

pub async fn create_position(pool: &PgPool, req: CreatePosition) -> Result<Position, sqlx::Error> {
    let id = Uuid::new_v4();
    let now = Utc::now();
    let position = sqlx::query_as::<_, Position>(
        r#"INSERT INTO positions (id, name, code, department_id, level_id, description, is_leader, is_active, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, true, $8, $8)
           RETURNING id, name, code, department_id, level_id, description, is_leader, is_active, created_at, updated_at"#
    )
    .bind(id)
    .bind(&req.name)
    .bind(&req.code)
    .bind(req.department_id)
    .bind(req.level_id)
    .bind(&req.description)
    .bind(req.is_leader)
    .bind(now)
    .fetch_one(pool)
    .await?;
    Ok(position)
}

pub async fn update_position(pool: &PgPool, id: Uuid, req: CreatePosition) -> Result<Position, sqlx::Error> {
    let position = sqlx::query_as::<_, Position>(
        r#"UPDATE positions SET name = $2, code = $3, department_id = $4, level_id = $5, description = $6, is_leader = $7, updated_at = NOW()
           WHERE id = $1
           RETURNING id, name, code, department_id, level_id, description, is_leader, is_active, created_at, updated_at"#
    )
    .bind(id)
    .bind(&req.name)
    .bind(&req.code)
    .bind(req.department_id)
    .bind(req.level_id)
    .bind(&req.description)
    .bind(req.is_leader)
    .fetch_one(pool)
    .await?;
    Ok(position)
}

pub async fn delete_position(pool: &PgPool, id: Uuid) -> Result<bool, sqlx::Error> {
    let result = sqlx::query("DELETE FROM positions WHERE id = $1")
        .bind(id)
        .execute(pool)
        .await?;
    Ok(result.rows_affected() > 0)
}

pub async fn get_positions_by_department(pool: &PgPool, department_id: Uuid) -> Result<Vec<Position>, sqlx::Error> {
    let positions = sqlx::query_as::<_, Position>(
        r#"SELECT id, name, code, department_id, level_id, description, 
           is_supervisor, created_at, updated_at
           FROM positions 
           WHERE department_id = $1 
           ORDER BY created_at DESC"#
    )
    .bind(department_id)
    .fetch_all(pool)
    .await?;
    Ok(positions)
}

pub async fn get_all_approval_rules(pool: &PgPool) -> Result<Vec<ApprovalRule>, sqlx::Error> {
    let rules = sqlx::query_as::<_, ApprovalRule>(
        r#"SELECT id, name, code, rule_type, department_id, position_level_id, specific_user_id,
           workflow_type, node_order, min_approvers, approval_mode, condition_expression, 
           NULL::text as description, is_active, created_at, updated_at
           FROM approval_rules ORDER BY created_at DESC"#
    )
    .fetch_all(pool)
    .await?;
    Ok(rules)
}

pub async fn create_approval_rule(pool: &PgPool, req: CreateApprovalRule) -> Result<ApprovalRule, sqlx::Error> {
    let id = Uuid::new_v4();
    let now = Utc::now();
    let rule = sqlx::query_as::<_, ApprovalRule>(
        r#"INSERT INTO approval_rules (id, name, code, rule_type, department_id, position_level_id, specific_user_id,
           workflow_type, node_order, min_approvers, approval_mode, condition_expression, is_active, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, true, $13, $13)
           RETURNING id, name, code, rule_type, department_id, position_level_id, specific_user_id,
           workflow_type, node_order, min_approvers, approval_mode, condition_expression, 
           NULL::text as description, is_active, created_at, updated_at"#
    )
    .bind(id)
    .bind(&req.name)
    .bind(&req.code)
    .bind(&req.rule_type)
    .bind(req.department_id)
    .bind(req.position_level_id)
    .bind(req.specific_user_id)
    .bind(&req.workflow_type)
    .bind(req.node_order)
    .bind(req.min_approvers)
    .bind(&req.approval_mode)
    .bind(&req.condition_expression)
    .bind(now)
    .fetch_one(pool)
    .await?;
    Ok(rule)
}

pub async fn update_approval_rule(pool: &PgPool, id: Uuid, req: CreateApprovalRule) -> Result<ApprovalRule, sqlx::Error> {
    let rule = sqlx::query_as::<_, ApprovalRule>(
        r#"UPDATE approval_rules SET name = $2, code = $3, rule_type = $4, department_id = $5, position_level_id = $6,
           specific_user_id = $7, workflow_type = $8, node_order = $9, min_approvers = $10, approval_mode = $11,
           condition_expression = $12, updated_at = NOW()
           WHERE id = $1
           RETURNING id, name, code, rule_type, department_id, position_level_id, specific_user_id,
           workflow_type, node_order, min_approvers, approval_mode, condition_expression, 
           NULL::text as description, is_active, created_at, updated_at"#
    )
    .bind(id)
    .bind(&req.name)
    .bind(&req.code)
    .bind(&req.rule_type)
    .bind(req.department_id)
    .bind(req.position_level_id)
    .bind(req.specific_user_id)
    .bind(&req.workflow_type)
    .bind(req.node_order)
    .bind(req.min_approvers)
    .bind(&req.approval_mode)
    .bind(&req.condition_expression)
    .fetch_one(pool)
    .await?;
    Ok(rule)
}

pub async fn delete_approval_rule(pool: &PgPool, id: Uuid) -> Result<bool, sqlx::Error> {
    let result = sqlx::query("DELETE FROM approval_rules WHERE id = $1")
        .bind(id)
        .execute(pool)
        .await?;
    Ok(result.rows_affected() > 0)
}