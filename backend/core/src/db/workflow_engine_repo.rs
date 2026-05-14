use chrono::{DateTime, Utc};
use sqlx::{types::Uuid, PgPool, Row};

use super::workflow_engine::{
    ApprovalRecord, ApprovalTask, ApprovalTemplate, CreateStepRequest, CreateWorkflowRequest,
    UpdateWorkflowRequest, Workflow, WorkflowStep,
};
use crate::errors::AppError;

pub async fn create_workflow(
    pool: &PgPool,
    req: CreateWorkflowRequest,
) -> Result<Workflow, AppError> {
    let now = Utc::now();

    let workflow = sqlx::query(
        r#"INSERT INTO workflows (name, code, description, is_active, is_system, system_required, allow_customization, created_at, updated_at)
           VALUES ($1, $2, $3, true, false, false, true, $4, $5)
           RETURNING id, name, code, description, is_active, is_system, system_required, allow_customization, created_at, updated_at"#
    )
    .bind(&req.name)
    .bind(&req.code)
    .bind(&req.description)
    .bind(now)
    .bind(now)
    .fetch_one(pool)
    .await
    .map_err(AppError::DatabaseError)?;

    let workflow_id: Uuid = workflow.get("id");

    for step_req in req.steps {
        create_workflow_step(pool, workflow_id, step_req).await?;
    }

    Ok(Workflow {
        id: workflow.get("id"),
        name: workflow.get("name"),
        code: workflow.get("code"),
        description: workflow.get("description"),
        is_active: workflow.get("is_active"),
        is_system: workflow.get("is_system"),
        system_required: workflow.get("system_required"),
        allow_customization: workflow.get("allow_customization"),
        created_at: workflow.get("created_at"),
        updated_at: workflow.get("updated_at"),
    })
}

pub async fn create_workflow_step(
    pool: &PgPool,
    workflow_id: Uuid,
    req: CreateStepRequest,
) -> Result<WorkflowStep, AppError> {
    let now = Utc::now();

    let step = sqlx::query(
        r#"INSERT INTO workflow_steps (workflow_id, step_number, name, approver_type, approver_id, role_code, department_id, timeout_days, can_skip, is_optional, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
           RETURNING id, workflow_id, step_number, name, approver_type, approver_id, role_code, department_id, timeout_days, deadline_at, can_skip, is_optional, next_step_id, created_at, updated_at"#
    )
    .bind(workflow_id)
    .bind(req.step_number)
    .bind(&req.name)
    .bind(&req.approver_type)
    .bind(req.approver_id)
    .bind(&req.role_code)
    .bind(req.department_id)
    .bind(req.timeout_days)
    .bind(req.can_skip.unwrap_or(false))
    .bind(req.is_optional.unwrap_or(false))
    .bind(now)
    .bind(now)
    .fetch_one(pool)
    .await
    .map_err(AppError::DatabaseError)?;

    Ok(WorkflowStep {
        id: step.get("id"),
        workflow_id: step.get("workflow_id"),
        step_number: step.get("step_number"),
        name: step.get("name"),
        approver_type: step.get("approver_type"),
        approver_id: step.get("approver_id"),
        role_code: step.get("role_code"),
        department_id: step.get("department_id"),
        timeout_days: step.get("timeout_days"),
        deadline_at: step.get("deadline_at"),
        can_skip: step.get("can_skip"),
        is_optional: step.get("is_optional"),
        next_step_id: step.get("next_step_id"),
        created_at: step.get("created_at"),
        updated_at: step.get("updated_at"),
    })
}

pub async fn get_workflow_by_id(pool: &PgPool, workflow_id: &str) -> Result<Workflow, AppError> {
    let workflow = sqlx::query(
        "SELECT id, name, code, description, is_active, is_system, system_required, allow_customization, created_at, updated_at
         FROM workflows WHERE id = $1"
    )
    .bind(workflow_id)
    .fetch_one(pool)
    .await
    .map_err(AppError::DatabaseError)?;

    Ok(Workflow {
        id: workflow.get("id"),
        name: workflow.get("name"),
        code: workflow.get("code"),
        description: workflow.get("description"),
        is_active: workflow.get("is_active"),
        is_system: workflow.get("is_system"),
        system_required: workflow.get("system_required"),
        allow_customization: workflow.get("allow_customization"),
        created_at: workflow.get("created_at"),
        updated_at: workflow.get("updated_at"),
    })
}

pub async fn get_workflow_by_code(pool: &PgPool, code: &str) -> Result<Workflow, AppError> {
    let workflow = sqlx::query(
        "SELECT id, name, code, description, is_active, is_system, system_required, allow_customization, created_at, updated_at
         FROM workflows WHERE code = $1"
    )
    .bind(code)
    .fetch_one(pool)
    .await
    .map_err(AppError::DatabaseError)?;

    Ok(Workflow {
        id: workflow.get("id"),
        name: workflow.get("name"),
        code: workflow.get("code"),
        description: workflow.get("description"),
        is_active: workflow.get("is_active"),
        is_system: workflow.get("is_system"),
        system_required: workflow.get("system_required"),
        allow_customization: workflow.get("allow_customization"),
        created_at: workflow.get("created_at"),
        updated_at: workflow.get("updated_at"),
    })
}

pub async fn get_all_workflows(pool: &PgPool) -> Result<Vec<Workflow>, AppError> {
    let results = sqlx::query(
        "SELECT id, name, code, description, is_active, is_system, system_required, allow_customization, created_at, updated_at
         FROM workflows ORDER BY is_system DESC, created_at DESC"
    )
    .fetch_all(pool)
    .await
    .map_err(AppError::DatabaseError)?;

    let mut workflows = Vec::new();
    for row in results {
        workflows.push(Workflow {
            id: row.get("id"),
            name: row.get("name"),
            code: row.get("code"),
            description: row.get("description"),
            is_active: row.get("is_active"),
            is_system: row.get("is_system"),
            system_required: row.get("system_required"),
            allow_customization: row.get("allow_customization"),
            created_at: row.get("created_at"),
            updated_at: row.get("updated_at"),
        });
    }
    Ok(workflows)
}

pub async fn get_system_workflows(pool: &PgPool) -> Result<Vec<Workflow>, AppError> {
    let results = sqlx::query(
        "SELECT id, name, code, description, is_active, is_system, system_required, allow_customization, created_at, updated_at
         FROM workflows WHERE is_system = true ORDER BY created_at DESC"
    )
    .fetch_all(pool)
    .await
    .map_err(AppError::DatabaseError)?;

    let mut workflows = Vec::new();
    for row in results {
        workflows.push(Workflow {
            id: row.get("id"),
            name: row.get("name"),
            code: row.get("code"),
            description: row.get("description"),
            is_active: row.get("is_active"),
            is_system: row.get("is_system"),
            system_required: row.get("system_required"),
            allow_customization: row.get("allow_customization"),
            created_at: row.get("created_at"),
            updated_at: row.get("updated_at"),
        });
    }
    Ok(workflows)
}

pub async fn get_custom_workflows(pool: &PgPool) -> Result<Vec<Workflow>, AppError> {
    let results = sqlx::query(
        "SELECT id, name, code, description, is_active, is_system, system_required, allow_customization, created_at, updated_at
         FROM workflows WHERE is_system = false ORDER BY created_at DESC"
    )
    .fetch_all(pool)
    .await
    .map_err(AppError::DatabaseError)?;

    let mut workflows = Vec::new();
    for row in results {
        workflows.push(Workflow {
            id: row.get("id"),
            name: row.get("name"),
            code: row.get("code"),
            description: row.get("description"),
            is_active: row.get("is_active"),
            is_system: row.get("is_system"),
            system_required: row.get("system_required"),
            allow_customization: row.get("allow_customization"),
            created_at: row.get("created_at"),
            updated_at: row.get("updated_at"),
        });
    }
    Ok(workflows)
}

pub async fn update_workflow(
    pool: &PgPool,
    workflow_id: Uuid,
    req: UpdateWorkflowRequest,
) -> Result<Workflow, AppError> {
    let now = Utc::now();

    let workflow = sqlx::query(
        r#"UPDATE workflows
           SET name = COALESCE($1, name),
               description = COALESCE($2, description),
               is_active = COALESCE($3, is_active),
               updated_at = $4
           WHERE id = $5
           RETURNING id, name, code, description, is_active, is_system, system_required, allow_customization, created_at, updated_at"#
    )
    .bind(&req.name)
    .bind(&req.description)
    .bind(req.is_active)
    .bind(now)
    .bind(workflow_id)
    .fetch_one(pool)
    .await
    .map_err(AppError::DatabaseError)?;

    Ok(Workflow {
        id: workflow.get("id"),
        name: workflow.get("name"),
        code: workflow.get("code"),
        description: workflow.get("description"),
        is_active: workflow.get("is_active"),
        is_system: workflow.get("is_system"),
        system_required: workflow.get("system_required"),
        allow_customization: workflow.get("allow_customization"),
        created_at: workflow.get("created_at"),
        updated_at: workflow.get("updated_at"),
    })
}

pub async fn delete_workflow(pool: &PgPool, workflow_id: &str) -> Result<(), AppError> {
    sqlx::query("DELETE FROM workflows WHERE id = $1 AND is_system = false")
        .bind(workflow_id)
        .execute(pool)
        .await
        .map_err(AppError::DatabaseError)?;

    Ok(())
}

pub async fn get_workflow_steps(
    pool: &PgPool,
    workflow_id: &str,
) -> Result<Vec<WorkflowStep>, AppError> {
    let results = sqlx::query(
        "SELECT id, workflow_id, step_number, name, approver_type, approver_id, role_code, department_id, timeout_days, deadline_at, can_skip, is_optional, next_step_id, created_at, updated_at
         FROM workflow_steps WHERE workflow_id = $1 ORDER BY step_number"
    )
    .bind(workflow_id)
    .fetch_all(pool)
    .await
    .map_err(AppError::DatabaseError)?;

    let mut steps = Vec::new();
    for row in results {
        steps.push(WorkflowStep {
            id: row.get("id"),
            workflow_id: row.get("workflow_id"),
            step_number: row.get("step_number"),
            name: row.get("name"),
            approver_type: row.get("approver_type"),
            approver_id: row.get("approver_id"),
            role_code: row.get("role_code"),
            department_id: row.get("department_id"),
            timeout_days: row.get("timeout_days"),
            deadline_at: row.get("deadline_at"),
            can_skip: row.get("can_skip"),
            is_optional: row.get("is_optional"),
            next_step_id: row.get("next_step_id"),
            created_at: row.get("created_at"),
            updated_at: row.get("updated_at"),
        });
    }
    Ok(steps)
}

pub async fn update_step_approver(
    pool: &PgPool,
    step_id: Uuid,
    approver_id: Option<Uuid>,
    role_code: Option<String>,
    department_id: Option<Uuid>,
) -> Result<WorkflowStep, AppError> {
    let now = Utc::now();

    let step = sqlx::query(
        r#"UPDATE workflow_steps
           SET approver_id = $1,
               role_code = $2,
               department_id = $3,
               updated_at = $4
           WHERE id = $5
           RETURNING id, workflow_id, step_number, name, approver_type, approver_id, role_code, department_id, timeout_days, deadline_at, can_skip, is_optional, next_step_id, created_at, updated_at"#
    )
    .bind(approver_id)
    .bind(&role_code)
    .bind(department_id)
    .bind(now)
    .bind(step_id)
    .fetch_one(pool)
    .await
    .map_err(AppError::DatabaseError)?;

    Ok(WorkflowStep {
        id: step.get("id"),
        workflow_id: step.get("workflow_id"),
        step_number: step.get("step_number"),
        name: step.get("name"),
        approver_type: step.get("approver_type"),
        approver_id: step.get("approver_id"),
        role_code: step.get("role_code"),
        department_id: step.get("department_id"),
        timeout_days: step.get("timeout_days"),
        deadline_at: step.get("deadline_at"),
        can_skip: step.get("can_skip"),
        is_optional: step.get("is_optional"),
        next_step_id: step.get("next_step_id"),
        created_at: step.get("created_at"),
        updated_at: step.get("updated_at"),
    })
}

pub async fn update_step_timeout(
    pool: &PgPool,
    step_id: Uuid,
    timeout_days: Option<i32>,
    deadline_at: Option<DateTime<Utc>>,
) -> Result<WorkflowStep, AppError> {
    let now = Utc::now();

    let step = sqlx::query(
        r#"UPDATE workflow_steps
           SET timeout_days = $1,
               deadline_at = $2,
               updated_at = $3
           WHERE id = $4
           RETURNING id, workflow_id, step_number, name, approver_type, approver_id, role_code, department_id, timeout_days, deadline_at, can_skip, is_optional, next_step_id, created_at, updated_at"#
    )
    .bind(timeout_days)
    .bind(deadline_at)
    .bind(now)
    .bind(step_id)
    .fetch_one(pool)
    .await
    .map_err(AppError::DatabaseError)?;

    Ok(WorkflowStep {
        id: step.get("id"),
        workflow_id: step.get("workflow_id"),
        step_number: step.get("step_number"),
        name: step.get("name"),
        approver_type: step.get("approver_type"),
        approver_id: step.get("approver_id"),
        role_code: step.get("role_code"),
        department_id: step.get("department_id"),
        timeout_days: step.get("timeout_days"),
        deadline_at: step.get("deadline_at"),
        can_skip: step.get("can_skip"),
        is_optional: step.get("is_optional"),
        next_step_id: step.get("next_step_id"),
        created_at: step.get("created_at"),
        updated_at: step.get("updated_at"),
    })
}

pub async fn reset_step_config(pool: &PgPool, step_id: Uuid) -> Result<WorkflowStep, AppError> {
    let now = Utc::now();

    let step = sqlx::query(
        r#"UPDATE workflow_steps
           SET approver_id = NULL,
               department_id = NULL,
               deadline_at = NULL,
               updated_at = $1
           WHERE id = $2
           RETURNING id, workflow_id, step_number, name, approver_type, approver_id, role_code, department_id, timeout_days, deadline_at, can_skip, is_optional, next_step_id, created_at, updated_at"#
    )
    .bind(now)
    .bind(step_id)
    .fetch_one(pool)
    .await
    .map_err(AppError::DatabaseError)?;

    Ok(WorkflowStep {
        id: step.get("id"),
        workflow_id: step.get("workflow_id"),
        step_number: step.get("step_number"),
        name: step.get("name"),
        approver_type: step.get("approver_type"),
        approver_id: step.get("approver_id"),
        role_code: step.get("role_code"),
        department_id: step.get("department_id"),
        timeout_days: step.get("timeout_days"),
        deadline_at: step.get("deadline_at"),
        can_skip: step.get("can_skip"),
        is_optional: step.get("is_optional"),
        next_step_id: step.get("next_step_id"),
        created_at: step.get("created_at"),
        updated_at: step.get("updated_at"),
    })
}

pub async fn create_task(
    pool: &PgPool,
    workflow_id: &str,
    workflow_code: &str,
    title: &str,
    description: Option<String>,
    creator_id: Uuid,
    creator_name: &str,
    current_approver_id: Option<Uuid>,
    current_approver_name: Option<String>,
    data: serde_json::Value,
    max_steps: i32,
) -> Result<ApprovalTask, AppError> {
    let now = Utc::now();

    let task = sqlx::query(
        r#"INSERT INTO approval_tasks (workflow_id, workflow_code, title, description, status, current_step, max_steps, creator_id, creator_name, current_approver_id, current_approver_name, data, created_at, updated_at)
           VALUES ($1, $2, $3, $4, 'pending', 1, $5, $6, $7, $8, $9, $10, $11, $11)
           RETURNING id, workflow_id, workflow_code, title, description, status, current_step, max_steps, creator_id, creator_name, current_approver_id, current_approver_name, data, created_at, updated_at, completed_at"#
    )
    .bind(workflow_id)
    .bind(workflow_code)
    .bind(title)
    .bind(description)
    .bind(max_steps)
    .bind(creator_id)
    .bind(creator_name)
    .bind(current_approver_id)
    .bind(current_approver_name)
    .bind(data)
    .bind(now)
    .fetch_one(pool)
    .await
    .map_err(AppError::DatabaseError)?;

    Ok(ApprovalTask {
        id: task.get("id"),
        workflow_id: task.get("workflow_id"),
        workflow_code: task.get("workflow_code"),
        title: task.get("title"),
        description: task.get("description"),
        status: task.get("status"),
        current_step: task.get("current_step"),
        max_steps: task.get("max_steps"),
        creator_id: task.get("creator_id"),
        creator_name: task.get("creator_name"),
        current_approver_id: task.get("current_approver_id"),
        current_approver_name: task.get("current_approver_name"),
        data: task.get("data"),
        created_at: task.get("created_at"),
        updated_at: task.get("updated_at"),
        completed_at: task.get("completed_at"),
    })
}

pub async fn get_task_by_id(pool: &PgPool, task_id: Uuid) -> Result<ApprovalTask, AppError> {
    let task = sqlx::query(
        "SELECT id, workflow_id, workflow_code, title, description, status, current_step, max_steps, creator_id, creator_name, current_approver_id, current_approver_name, data, created_at, updated_at, completed_at
         FROM approval_tasks WHERE id = $1"
    )
    .bind(task_id)
    .fetch_one(pool)
    .await
    .map_err(AppError::DatabaseError)?;

    Ok(ApprovalTask {
        id: task.get("id"),
        workflow_id: task.get("workflow_id"),
        workflow_code: task.get("workflow_code"),
        title: task.get("title"),
        description: task.get("description"),
        status: task.get("status"),
        current_step: task.get("current_step"),
        max_steps: task.get("max_steps"),
        creator_id: task.get("creator_id"),
        creator_name: task.get("creator_name"),
        current_approver_id: task.get("current_approver_id"),
        current_approver_name: task.get("current_approver_name"),
        data: task.get("data"),
        created_at: task.get("created_at"),
        updated_at: task.get("updated_at"),
        completed_at: task.get("completed_at"),
    })
}

pub async fn get_tasks_by_approver(
    pool: &PgPool,
    approver_id: Uuid,
) -> Result<Vec<ApprovalTask>, AppError> {
    let results = sqlx::query(
        "SELECT id, workflow_id, workflow_code, title, description, status, current_step, max_steps, creator_id, creator_name, current_approver_id, current_approver_name, data, created_at, updated_at, completed_at
         FROM approval_tasks WHERE current_approver_id = $1 AND status IN ('pending', 'processing') ORDER BY created_at DESC"
    )
    .bind(approver_id)
    .fetch_all(pool)
    .await
    .map_err(AppError::DatabaseError)?;

    let mut tasks = Vec::new();
    for row in results {
        tasks.push(ApprovalTask {
            id: row.get("id"),
            workflow_id: row.get("workflow_id"),
            workflow_code: row.get("workflow_code"),
            title: row.get("title"),
            description: row.get("description"),
            status: row.get("status"),
            current_step: row.get("current_step"),
            max_steps: row.get("max_steps"),
            creator_id: row.get("creator_id"),
            creator_name: row.get("creator_name"),
            current_approver_id: row.get("current_approver_id"),
            current_approver_name: row.get("current_approver_name"),
            data: row.get("data"),
            created_at: row.get("created_at"),
            updated_at: row.get("updated_at"),
            completed_at: row.get("completed_at"),
        });
    }
    Ok(tasks)
}

pub async fn get_tasks_by_creator(
    pool: &PgPool,
    creator_id: Uuid,
) -> Result<Vec<ApprovalTask>, AppError> {
    let results = sqlx::query(
        "SELECT id, workflow_id, workflow_code, title, description, status, current_step, max_steps, creator_id, creator_name, current_approver_id, current_approver_name, data, created_at, updated_at, completed_at
         FROM approval_tasks WHERE creator_id = $1 ORDER BY created_at DESC"
    )
    .bind(creator_id)
    .fetch_all(pool)
    .await
    .map_err(AppError::DatabaseError)?;

    let mut tasks = Vec::new();
    for row in results {
        tasks.push(ApprovalTask {
            id: row.get("id"),
            workflow_id: row.get("workflow_id"),
            workflow_code: row.get("workflow_code"),
            title: row.get("title"),
            description: row.get("description"),
            status: row.get("status"),
            current_step: row.get("current_step"),
            max_steps: row.get("max_steps"),
            creator_id: row.get("creator_id"),
            creator_name: row.get("creator_name"),
            current_approver_id: row.get("current_approver_id"),
            current_approver_name: row.get("current_approver_name"),
            data: row.get("data"),
            created_at: row.get("created_at"),
            updated_at: row.get("updated_at"),
            completed_at: row.get("completed_at"),
        });
    }
    Ok(tasks)
}

pub async fn approve_task(
    pool: &PgPool,
    task_id: Uuid,
    comment: Option<String>,
    approver_id: Uuid,
    approver_name: &str,
) -> Result<ApprovalTask, AppError> {
    let _now = Utc::now();

    let task = get_task_by_id(pool, task_id).await?;

    // 创建审批记录
    create_record(
        pool,
        task_id,
        task.current_step,
        approver_id,
        approver_name,
        "approved",
        comment,
    )
    .await?;

    if task.current_step >= task.max_steps {
        // 流程结束，标记为已通过
        complete_task(pool, task_id, "approved").await
    } else {
        // 进入下一步
        advance_task(pool, task_id, task.current_step + 1).await
    }
}

pub async fn reject_task(
    pool: &PgPool,
    task_id: Uuid,
    comment: Option<String>,
    approver_id: Uuid,
    approver_name: &str,
) -> Result<ApprovalTask, AppError> {
    // 创建审批记录
    create_record(
        pool,
        task_id,
        0,
        approver_id,
        approver_name,
        "rejected",
        comment,
    )
    .await?;

    // 标记为已拒绝
    complete_task(pool, task_id, "rejected").await
}

pub async fn create_record(
    pool: &PgPool,
    task_id: Uuid,
    step_number: i32,
    approver_id: Uuid,
    approver_name: &str,
    action: &str,
    comment: Option<String>,
) -> Result<ApprovalRecord, AppError> {
    let now = Utc::now();

    let record = sqlx::query(
        "INSERT INTO approval_records (task_id, step_number, approver_id, approver_name, action, comment, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id, task_id, step_number, approver_id, approver_name, action, comment, created_at"
    )
    .bind(task_id)
    .bind(step_number)
    .bind(approver_id)
    .bind(approver_name)
    .bind(action)
    .bind(comment)
    .bind(now)
    .fetch_one(pool)
    .await
    .map_err(AppError::DatabaseError)?;

    Ok(ApprovalRecord {
        id: record.get("id"),
        task_id: record.get("task_id"),
        step_number: record.get("step_number"),
        approver_id: record.get("approver_id"),
        approver_name: record.get("approver_name"),
        action: record.get("action"),
        comment: record.get("comment"),
        created_at: record.get("created_at"),
    })
}

pub async fn get_task_records(
    pool: &PgPool,
    task_id: Uuid,
) -> Result<Vec<ApprovalRecord>, AppError> {
    let results = sqlx::query(
        "SELECT id, task_id, step_number, approver_id, approver_name, action, comment, created_at
         FROM approval_records WHERE task_id = $1 ORDER BY created_at DESC",
    )
    .bind(task_id)
    .fetch_all(pool)
    .await
    .map_err(AppError::DatabaseError)?;

    let mut records = Vec::new();
    for row in results {
        records.push(ApprovalRecord {
            id: row.get("id"),
            task_id: row.get("task_id"),
            step_number: row.get("step_number"),
            approver_id: row.get("approver_id"),
            approver_name: row.get("approver_name"),
            action: row.get("action"),
            comment: row.get("comment"),
            created_at: row.get("created_at"),
        });
    }
    Ok(records)
}

pub async fn complete_task(
    pool: &PgPool,
    task_id: Uuid,
    status: &str,
) -> Result<ApprovalTask, AppError> {
    let now = Utc::now();

    let task = sqlx::query(
        r#"UPDATE approval_tasks
           SET status = $1,
               completed_at = $2,
               updated_at = $3
           WHERE id = $4
           RETURNING id, workflow_id, workflow_code, title, description, status, current_step, max_steps, creator_id, creator_name, current_approver_id, current_approver_name, data, created_at, updated_at, completed_at"#
    )
    .bind(status)
    .bind(now)
    .bind(now)
    .bind(task_id)
    .fetch_one(pool)
    .await
    .map_err(AppError::DatabaseError)?;

    Ok(ApprovalTask {
        id: task.get("id"),
        workflow_id: task.get("workflow_id"),
        workflow_code: task.get("workflow_code"),
        title: task.get("title"),
        description: task.get("description"),
        status: task.get("status"),
        current_step: task.get("current_step"),
        max_steps: task.get("max_steps"),
        creator_id: task.get("creator_id"),
        creator_name: task.get("creator_name"),
        current_approver_id: task.get("current_approver_id"),
        current_approver_name: task.get("current_approver_name"),
        data: task.get("data"),
        created_at: task.get("created_at"),
        updated_at: task.get("updated_at"),
        completed_at: task.get("completed_at"),
    })
}

pub async fn advance_task(
    pool: &PgPool,
    task_id: Uuid,
    next_step: i32,
) -> Result<ApprovalTask, AppError> {
    let task = get_task_by_id(pool, task_id).await?;
    let steps = get_workflow_steps(pool, &task.workflow_id).await?;

    let next_step_data = steps.iter().find(|s| s.step_number == next_step);

    if let Some(step) = next_step_data {
        // 解析下一个审批人（简化实现，默认使用管理员）
        let next_approver_id = step.approver_id;
        let next_approver_name: Option<String> = None; // 需要从数据库查询

        let now = Utc::now();

        let updated_task = sqlx::query(
            r#"UPDATE approval_tasks
               SET current_step = $1,
                   current_approver_id = $2,
                   current_approver_name = $3,
                   status = 'processing',
                   updated_at = $4
               WHERE id = $5
               RETURNING id, workflow_id, workflow_code, title, description, status, current_step, max_steps, creator_id, creator_name, current_approver_id, current_approver_name, data, created_at, updated_at, completed_at"#
        )
        .bind(next_step)
        .bind(next_approver_id)
        .bind(next_approver_name)
        .bind(now)
        .bind(task_id)
        .fetch_one(pool)
        .await
        .map_err(AppError::DatabaseError)?;

        Ok(ApprovalTask {
            id: updated_task.get("id"),
            workflow_id: updated_task.get("workflow_id"),
            workflow_code: updated_task.get("workflow_code"),
            title: updated_task.get("title"),
            description: updated_task.get("description"),
            status: updated_task.get("status"),
            current_step: updated_task.get("current_step"),
            max_steps: updated_task.get("max_steps"),
            creator_id: updated_task.get("creator_id"),
            creator_name: updated_task.get("creator_name"),
            current_approver_id: updated_task.get("current_approver_id"),
            current_approver_name: updated_task.get("current_approver_name"),
            data: updated_task.get("data"),
            created_at: updated_task.get("created_at"),
            updated_at: updated_task.get("updated_at"),
            completed_at: updated_task.get("completed_at"),
        })
    } else {
        Err(AppError::BadRequest("找不到下一步".to_string()))
    }
}

pub async fn get_all_tasks(pool: &PgPool) -> Result<Vec<ApprovalTask>, AppError> {
    let results = sqlx::query(
        "SELECT id, workflow_id, workflow_code, title, description, status, current_step, max_steps, creator_id, creator_name, current_approver_id, current_approver_name, data, created_at, updated_at, completed_at
         FROM approval_tasks ORDER BY created_at DESC"
    )
    .fetch_all(pool)
    .await
    .map_err(AppError::DatabaseError)?;

    let mut tasks = Vec::new();
    for row in results {
        tasks.push(ApprovalTask {
            id: row.get("id"),
            workflow_id: row.get("workflow_id"),
            workflow_code: row.get("workflow_code"),
            title: row.get("title"),
            description: row.get("description"),
            status: row.get("status"),
            current_step: row.get("current_step"),
            max_steps: row.get("max_steps"),
            creator_id: row.get("creator_id"),
            creator_name: row.get("creator_name"),
            current_approver_id: row.get("current_approver_id"),
            current_approver_name: row.get("current_approver_name"),
            data: row.get("data"),
            created_at: row.get("created_at"),
            updated_at: row.get("updated_at"),
            completed_at: row.get("completed_at"),
        });
    }
    Ok(tasks)
}

pub async fn create_template(
    pool: &PgPool,
    name: &str,
    workflow_code: &str,
    title_template: &str,
    description_template: Option<String>,
    default_data: serde_json::Value,
) -> Result<ApprovalTemplate, AppError> {
    let now = Utc::now();

    let template = sqlx::query(
        "INSERT INTO approval_templates (name, workflow_code, title_template, description_template, default_data, is_active, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, true, $6, $7)
         RETURNING id, name, workflow_code, title_template, description_template, default_data, is_active, created_at, updated_at"
    )
    .bind(name)
    .bind(workflow_code)
    .bind(title_template)
    .bind(description_template)
    .bind(default_data)
    .bind(now)
    .bind(now)
    .fetch_one(pool)
    .await
    .map_err(AppError::DatabaseError)?;

    Ok(ApprovalTemplate {
        id: template.get("id"),
        name: template.get("name"),
        workflow_code: template.get("workflow_code"),
        title_template: template.get("title_template"),
        description_template: template.get("description_template"),
        default_data: template.get("default_data"),
        is_active: template.get("is_active"),
        created_at: template.get("created_at"),
        updated_at: template.get("updated_at"),
    })
}

pub async fn get_all_templates(pool: &PgPool) -> Result<Vec<ApprovalTemplate>, AppError> {
    let results = sqlx::query(
        "SELECT id, name, workflow_code, title_template, description_template, default_data, is_active, created_at, updated_at
         FROM approval_templates WHERE is_active = true ORDER BY created_at DESC"
    )
    .fetch_all(pool)
    .await
    .map_err(AppError::DatabaseError)?;

    let mut templates = Vec::new();
    for row in results {
        templates.push(ApprovalTemplate {
            id: row.get("id"),
            name: row.get("name"),
            workflow_code: row.get("workflow_code"),
            title_template: row.get("title_template"),
            description_template: row.get("description_template"),
            default_data: row.get("default_data"),
            is_active: row.get("is_active"),
            created_at: row.get("created_at"),
            updated_at: row.get("updated_at"),
        });
    }
    Ok(templates)
}

pub async fn get_template_by_id(
    pool: &PgPool,
    template_id: Uuid,
) -> Result<ApprovalTemplate, AppError> {
    let template = sqlx::query(
        "SELECT id, name, workflow_code, title_template, description_template, default_data, is_active, created_at, updated_at
         FROM approval_templates WHERE id = $1"
    )
    .bind(template_id)
    .fetch_one(pool)
    .await
    .map_err(AppError::DatabaseError)?;

    Ok(ApprovalTemplate {
        id: template.get("id"),
        name: template.get("name"),
        workflow_code: template.get("workflow_code"),
        title_template: template.get("title_template"),
        description_template: template.get("description_template"),
        default_data: template.get("default_data"),
        is_active: template.get("is_active"),
        created_at: template.get("created_at"),
        updated_at: template.get("updated_at"),
    })
}

pub async fn delete_template(pool: &PgPool, template_id: Uuid) -> Result<(), AppError> {
    sqlx::query("UPDATE approval_templates SET is_active = false WHERE id = $1")
        .bind(template_id)
        .execute(pool)
        .await
        .map_err(AppError::DatabaseError)?;

    Ok(())
}
