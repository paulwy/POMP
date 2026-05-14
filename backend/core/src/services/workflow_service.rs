use crate::db::workflow::*;
use crate::db::workflow_repo;
use crate::db::DbPool;
use crate::errors::AppError;

pub async fn create_workflow_definition(
    pool: &DbPool,
    data: CreateWorkflowDefinition,
) -> Result<WorkflowDefinition, AppError> {
    let existing = workflow_repo::get_workflow_definitions(pool, None, None).await?;
    if existing.iter().any(|w| w.code == data.code) {
        return Err(AppError::ValidationError(format!(
            "工作流编码 {} 已存在",
            data.code
        )));
    }

    workflow_repo::create_workflow_definition(pool, data)
        .await
        .map_err(AppError::DatabaseError)
}

pub async fn get_workflow_definitions(
    pool: &DbPool,
    business_type: Option<&str>,
    is_active: Option<bool>,
) -> Result<Vec<WorkflowDefinition>, AppError> {
    workflow_repo::get_workflow_definitions(pool, business_type, is_active)
        .await
        .map_err(AppError::DatabaseError)
}

pub async fn get_workflow_definition_by_id(
    pool: &DbPool,
    id: uuid::Uuid,
) -> Result<WorkflowDefinition, AppError> {
    workflow_repo::get_workflow_definition_by_id(pool, id)
        .await
        .map_err(AppError::DatabaseError)
}

pub async fn update_workflow_definition(
    pool: &DbPool,
    id: uuid::Uuid,
    data: UpdateWorkflowDefinition,
) -> Result<WorkflowDefinition, AppError> {
    workflow_repo::update_workflow_definition(pool, id, data)
        .await
        .map_err(AppError::DatabaseError)
}

pub async fn delete_workflow_definition(pool: &DbPool, id: uuid::Uuid) -> Result<(), AppError> {
    workflow_repo::delete_workflow_definition(pool, id)
        .await
        .map_err(AppError::DatabaseError)
}

pub async fn create_workflow_node(
    pool: &DbPool,
    data: CreateWorkflowNode,
) -> Result<WorkflowNode, AppError> {
    workflow_repo::create_workflow_node(pool, data)
        .await
        .map_err(AppError::DatabaseError)
}

pub async fn get_workflow_nodes(
    pool: &DbPool,
    workflow_id: uuid::Uuid,
) -> Result<Vec<WorkflowNode>, AppError> {
    workflow_repo::get_workflow_nodes(pool, workflow_id)
        .await
        .map_err(AppError::DatabaseError)
}

pub async fn update_workflow_node(
    pool: &DbPool,
    id: uuid::Uuid,
    data: UpdateWorkflowNode,
) -> Result<WorkflowNode, AppError> {
    workflow_repo::update_workflow_node(pool, id, data)
        .await
        .map_err(AppError::DatabaseError)
}

pub async fn delete_workflow_node(pool: &DbPool, id: uuid::Uuid) -> Result<(), AppError> {
    workflow_repo::delete_workflow_node(pool, id)
        .await
        .map_err(AppError::DatabaseError)
}

pub async fn init_default_workflows(pool: &DbPool) -> Result<(), AppError> {
    let default_workflows = vec![
        CreateWorkflowDefinition {
            code: "leave".to_string(),
            name: "请假审批流程".to_string(),
            description: Some("员工请假审批流程".to_string()),
            business_type: "hr".to_string(),
            version: Some("1.0".to_string()),
            is_active: Some(true),
            is_default: Some(true),
        },
        CreateWorkflowDefinition {
            code: "expense".to_string(),
            name: "报销审批流程".to_string(),
            description: Some("费用报销审批流程".to_string()),
            business_type: "finance".to_string(),
            version: Some("1.0".to_string()),
            is_active: Some(true),
            is_default: Some(true),
        },
        CreateWorkflowDefinition {
            code: "purchase".to_string(),
            name: "采购审批流程".to_string(),
            description: Some("物资采购审批流程".to_string()),
            business_type: "supply".to_string(),
            version: Some("1.0".to_string()),
            is_active: Some(true),
            is_default: Some(true),
        },
        CreateWorkflowDefinition {
            code: "contract".to_string(),
            name: "合同审批流程".to_string(),
            description: Some("合同审批流程".to_string()),
            business_type: "contract".to_string(),
            version: Some("1.0".to_string()),
            is_active: Some(true),
            is_default: Some(true),
        },
    ];

    for wf in default_workflows {
        let existing = workflow_repo::get_workflow_definitions(pool, None, None).await?;
        if !existing.iter().any(|w| w.code == wf.code) {
            let wf_def = workflow_repo::create_workflow_definition(pool, wf).await?;

            if wf_def.code == "leave" {
                let nodes = vec![
                    CreateWorkflowNode {
                        workflow_id: wf_def.id,
                        node_code: "start".to_string(),
                        node_name: "发起申请".to_string(),
                        node_type: "start".to_string(),
                        approval_type: "auto".to_string(),
                        approver_type: "applicant".to_string(),
                        approver_config: None,
                        sort_order: Some(1),
                        is_required: Some(true),
                    },
                    CreateWorkflowNode {
                        workflow_id: wf_def.id,
                        node_code: "supervisor".to_string(),
                        node_name: "部门主管审批".to_string(),
                        node_type: "approval".to_string(),
                        approval_type: "single".to_string(),
                        approver_type: "department_supervisor".to_string(),
                        approver_config: None,
                        sort_order: Some(2),
                        is_required: Some(true),
                    },
                    CreateWorkflowNode {
                        workflow_id: wf_def.id,
                        node_code: "hr".to_string(),
                        node_name: "HR审批".to_string(),
                        node_type: "approval".to_string(),
                        approval_type: "single".to_string(),
                        approver_type: "role".to_string(),
                        approver_config: Some(r#"{"role": "hr_manager"}"#.to_string()),
                        sort_order: Some(3),
                        is_required: Some(false),
                    },
                    CreateWorkflowNode {
                        workflow_id: wf_def.id,
                        node_code: "end".to_string(),
                        node_name: "结束".to_string(),
                        node_type: "end".to_string(),
                        approval_type: "auto".to_string(),
                        approver_type: "system".to_string(),
                        approver_config: None,
                        sort_order: Some(10),
                        is_required: Some(true),
                    },
                ];

                for node in nodes {
                    workflow_repo::create_workflow_node(pool, node).await?;
                }
            }
        }
    }

    Ok(())
}
