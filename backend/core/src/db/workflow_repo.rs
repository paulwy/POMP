use crate::db::workflow::*;
use crate::db::DbPool;
use sqlx::{query, query_as};
use uuid::Uuid;

pub async fn create_workflow_definition(
    pool: &DbPool,
    data: CreateWorkflowDefinition,
) -> sqlx::Result<WorkflowDefinition> {
    let sql = r#"
        INSERT INTO workflow_definitions (
            code, name, description, business_type, version, is_active, is_default
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id, code, name, description, business_type, version, 
            is_active, is_default, created_at, updated_at
    "#;

    query_as::<_, WorkflowDefinition>(sql)
        .bind(data.code)
        .bind(data.name)
        .bind(data.description)
        .bind(data.business_type)
        .bind(data.version.unwrap_or_else(|| "1.0".to_string()))
        .bind(data.is_active.unwrap_or(true))
        .bind(data.is_default.unwrap_or(false))
        .fetch_one(pool)
        .await
}

pub async fn get_workflow_definition_by_id(
    pool: &DbPool,
    id: Uuid,
) -> sqlx::Result<WorkflowDefinition> {
    let sql = r#"
        SELECT id, code, name, description, business_type, version, 
            is_active, is_default, created_at, updated_at
        FROM workflow_definitions
        WHERE id = $1
    "#;

    query_as::<_, WorkflowDefinition>(sql)
        .bind(id)
        .fetch_one(pool)
        .await
}

pub async fn get_workflow_definitions(
    pool: &DbPool,
    business_type: Option<&str>,
    is_active: Option<bool>,
) -> sqlx::Result<Vec<WorkflowDefinition>> {
    let sql = match (business_type, is_active) {
        (Some(_bt), Some(_ia)) => {
            r#"
            SELECT id, code, name, description, business_type, version, 
                is_active, is_default, created_at, updated_at
            FROM workflow_definitions
            WHERE business_type = $1 AND is_active = $2
            ORDER BY is_default DESC, created_at DESC
        "#
        }
        (Some(_bt), None) => {
            r#"
            SELECT id, code, name, description, business_type, version, 
                is_active, is_default, created_at, updated_at
            FROM workflow_definitions
            WHERE business_type = $1
            ORDER BY is_default DESC, created_at DESC
        "#
        }
        (None, Some(_ia)) => {
            r#"
            SELECT id, code, name, description, business_type, version, 
                is_active, is_default, created_at, updated_at
            FROM workflow_definitions
            WHERE is_active = $1
            ORDER BY is_default DESC, created_at DESC
        "#
        }
        _ => {
            r#"
            SELECT id, code, name, description, business_type, version, 
                is_active, is_default, created_at, updated_at
            FROM workflow_definitions
            ORDER BY is_default DESC, created_at DESC
        "#
        }
    };

    let mut qb = query_as::<_, WorkflowDefinition>(sql);

    if let Some(bt) = business_type {
        qb = qb.bind(bt);
    }
    if let Some(ia) = is_active {
        qb = qb.bind(ia);
    }

    qb.fetch_all(pool).await
}

pub async fn update_workflow_definition(
    pool: &DbPool,
    id: Uuid,
    data: UpdateWorkflowDefinition,
) -> sqlx::Result<WorkflowDefinition> {
    let sql = r#"
        UPDATE workflow_definitions
        SET 
            name = COALESCE($2, name),
            description = COALESCE($3, description),
            business_type = COALESCE($4, business_type),
            version = COALESCE($5, version),
            is_active = COALESCE($6, is_active),
            is_default = COALESCE($7, is_default),
            updated_at = NOW()
        WHERE id = $1
        RETURNING id, code, name, description, business_type, version, 
            is_active, is_default, created_at, updated_at
    "#;

    query_as::<_, WorkflowDefinition>(sql)
        .bind(id)
        .bind(data.name)
        .bind(data.description)
        .bind(data.business_type)
        .bind(data.version)
        .bind(data.is_active)
        .bind(data.is_default)
        .fetch_one(pool)
        .await
}

pub async fn delete_workflow_definition(pool: &DbPool, id: Uuid) -> sqlx::Result<()> {
    query(r#"DELETE FROM workflow_definitions WHERE id = $1"#)
        .bind(id)
        .execute(pool)
        .await?;

    Ok(())
}

pub async fn create_workflow_node(
    pool: &DbPool,
    data: CreateWorkflowNode,
) -> sqlx::Result<WorkflowNode> {
    let sql = r#"
        INSERT INTO workflow_nodes (
            workflow_id, node_code, node_name, node_type, approval_type,
            approver_type, approver_config, sort_order, is_required
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id, workflow_id, node_code, node_name, node_type, approval_type,
            approver_type, approver_config, sort_order, is_required, created_at, updated_at
    "#;

    query_as::<_, WorkflowNode>(sql)
        .bind(data.workflow_id)
        .bind(data.node_code)
        .bind(data.node_name)
        .bind(data.node_type)
        .bind(data.approval_type)
        .bind(data.approver_type)
        .bind(data.approver_config)
        .bind(data.sort_order.unwrap_or(0))
        .bind(data.is_required.unwrap_or(true))
        .fetch_one(pool)
        .await
}

pub async fn get_workflow_nodes(
    pool: &DbPool,
    workflow_id: Uuid,
) -> sqlx::Result<Vec<WorkflowNode>> {
    let sql = r#"
        SELECT id, workflow_id, node_code, node_name, node_type, approval_type,
            approver_type, approver_config, sort_order, is_required, created_at, updated_at
        FROM workflow_nodes
        WHERE workflow_id = $1
        ORDER BY sort_order ASC
    "#;

    query_as::<_, WorkflowNode>(sql)
        .bind(workflow_id)
        .fetch_all(pool)
        .await
}

pub async fn update_workflow_node(
    pool: &DbPool,
    id: Uuid,
    data: UpdateWorkflowNode,
) -> sqlx::Result<WorkflowNode> {
    let sql = r#"
        UPDATE workflow_nodes
        SET 
            node_name = COALESCE($2, node_name),
            node_type = COALESCE($3, node_type),
            approval_type = COALESCE($4, approval_type),
            approver_type = COALESCE($5, approver_type),
            approver_config = COALESCE($6, approver_config),
            sort_order = COALESCE($7, sort_order),
            is_required = COALESCE($8, is_required),
            updated_at = NOW()
        WHERE id = $1
        RETURNING id, workflow_id, node_code, node_name, node_type, approval_type,
            approver_type, approver_config, sort_order, is_required, created_at, updated_at
    "#;

    query_as::<_, WorkflowNode>(sql)
        .bind(id)
        .bind(data.node_name)
        .bind(data.node_type)
        .bind(data.approval_type)
        .bind(data.approver_type)
        .bind(data.approver_config)
        .bind(data.sort_order)
        .bind(data.is_required)
        .fetch_one(pool)
        .await
}

pub async fn delete_workflow_node(pool: &DbPool, id: Uuid) -> sqlx::Result<()> {
    query(r#"DELETE FROM workflow_nodes WHERE id = $1"#)
        .bind(id)
        .execute(pool)
        .await?;

    Ok(())
}
