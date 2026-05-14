-- 创建工作流表（如果不存在）
CREATE TABLE IF NOT EXISTS workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    code VARCHAR(50),
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    is_system BOOLEAN DEFAULT false,
    system_required BOOLEAN DEFAULT false,
    allow_customization BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 创建工作流步骤表（如果不存在）
CREATE TABLE IF NOT EXISTS workflow_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id VARCHAR(255) NOT NULL,
    step_number INTEGER NOT NULL,
    name VARCHAR(100) NOT NULL,
    approver_type VARCHAR(30) NOT NULL, -- assigned_user, role, department_head, creator_manager, previous_approver
    approver_id UUID REFERENCES users(id),
    role_code VARCHAR(50),
    department_id UUID,
    timeout_days INTEGER,
    deadline_at TIMESTAMPTZ,
    can_skip BOOLEAN DEFAULT false NOT NULL,
    is_optional BOOLEAN DEFAULT false NOT NULL,
    next_step_id UUID REFERENCES workflow_steps(id),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 添加唯一约束（仅当不存在时）
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.table_constraints WHERE table_name = 'workflow_steps' AND constraint_name = 'workflow_steps_workflow_id_step_number_key') THEN
        ALTER TABLE workflow_steps ADD CONSTRAINT workflow_steps_workflow_id_step_number_key UNIQUE (workflow_id, step_number);
    END IF;
END $$;

-- 创建审批任务表（如果不存在）
CREATE TABLE IF NOT EXISTS approval_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id VARCHAR(255) NOT NULL,
    workflow_code VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(30) DEFAULT 'pending' NOT NULL, -- pending, processing, approved, rejected, cancelled, timeout
    current_step INTEGER DEFAULT 1 NOT NULL,
    max_steps INTEGER NOT NULL,
    creator_id UUID NOT NULL REFERENCES users(id),
    creator_name VARCHAR(100) NOT NULL,
    current_approver_id UUID REFERENCES users(id),
    current_approver_name VARCHAR(100),
    data JSONB,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    completed_at TIMESTAMPTZ
);

-- 创建审批记录表（如果不存在）
CREATE TABLE IF NOT EXISTS approval_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES approval_tasks(id) ON DELETE CASCADE,
    step_number INTEGER NOT NULL,
    approver_id UUID NOT NULL REFERENCES users(id),
    approver_name VARCHAR(100) NOT NULL,
    action VARCHAR(30) NOT NULL, -- approved, rejected, skipped, assigned, escalated
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 创建审批模板表（如果不存在）
CREATE TABLE IF NOT EXISTS approval_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    workflow_code VARCHAR(50) NOT NULL,
    title_template TEXT NOT NULL,
    description_template TEXT,
    default_data JSONB,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 添加唯一约束（仅当不存在时）
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.table_constraints WHERE table_name = 'approval_templates' AND constraint_name = 'approval_templates_name_workflow_code_key') THEN
        ALTER TABLE approval_templates ADD CONSTRAINT approval_templates_name_workflow_code_key UNIQUE (name, workflow_code);
    END IF;
END $$;

-- 创建索引（如果不存在）
CREATE INDEX IF NOT EXISTS idx_workflow_steps_workflow_id ON workflow_steps(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_steps_step_number ON workflow_steps(workflow_id, step_number);
CREATE INDEX IF NOT EXISTS idx_approval_tasks_workflow_id ON approval_tasks(workflow_id);
CREATE INDEX IF NOT EXISTS idx_approval_tasks_status ON approval_tasks(status);
CREATE INDEX IF NOT EXISTS idx_approval_tasks_current_approver ON approval_tasks(current_approver_id);
CREATE INDEX IF NOT EXISTS idx_approval_tasks_creator ON approval_tasks(creator_id);
CREATE INDEX IF NOT EXISTS idx_approval_records_task_id ON approval_records(task_id);
CREATE INDEX IF NOT EXISTS idx_approval_records_approver_id ON approval_records(approver_id);
CREATE INDEX IF NOT EXISTS idx_approval_templates_workflow_code ON approval_templates(workflow_code);