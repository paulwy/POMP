-- 工作流定义表（如果不存在）
CREATE TABLE IF NOT EXISTS workflow_definitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    business_type VARCHAR(100) NOT NULL,
    version VARCHAR(50) NOT NULL DEFAULT '1.0',
    is_active BOOLEAN DEFAULT true,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workflow_definitions_code ON workflow_definitions(code);
CREATE INDEX IF NOT EXISTS idx_workflow_definitions_business_type ON workflow_definitions(business_type);
CREATE INDEX IF NOT EXISTS idx_workflow_definitions_is_active ON workflow_definitions(is_active);

-- 工作流节点表（如果不存在）
CREATE TABLE IF NOT EXISTS workflow_nodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID NOT NULL REFERENCES workflow_definitions(id) ON DELETE CASCADE,
    node_code VARCHAR(100) NOT NULL,
    node_name VARCHAR(200) NOT NULL,
    node_type VARCHAR(50) NOT NULL,
    approval_type VARCHAR(50) NOT NULL,
    approver_type VARCHAR(50) NOT NULL,
    approver_config TEXT,
    sort_order INTEGER DEFAULT 0,
    is_required BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workflow_nodes_workflow_id ON workflow_nodes(workflow_id);

-- 工作流实例表（如果不存在）
CREATE TABLE IF NOT EXISTS workflow_instances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID NOT NULL REFERENCES workflow_definitions(id) ON DELETE CASCADE,
    initiator_id UUID NOT NULL REFERENCES users(id),
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    business_id VARCHAR(100),
    business_type VARCHAR(100),
    business_title VARCHAR(500),
    data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_workflow_instances_business_id ON workflow_instances(business_id);
CREATE INDEX IF NOT EXISTS idx_workflow_instances_business_type ON workflow_instances(business_type);
CREATE INDEX IF NOT EXISTS idx_workflow_instances_applicant_id ON workflow_instances(initiator_id);
CREATE INDEX IF NOT EXISTS idx_workflow_instances_status ON workflow_instances(status);

-- 工作流任务表（如果不存在）
CREATE TABLE IF NOT EXISTS workflow_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    instance_id UUID NOT NULL REFERENCES workflow_instances(id) ON DELETE CASCADE,
    node_id UUID REFERENCES workflow_nodes(id),
    node_code VARCHAR(100) NOT NULL,
    node_name VARCHAR(200),
    assignee_id UUID REFERENCES users(id),
    assignee_name VARCHAR(200),
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    comment TEXT,
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workflow_tasks_instance_id ON workflow_tasks(instance_id);
CREATE INDEX IF NOT EXISTS idx_workflow_tasks_assignee_id ON workflow_tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_workflow_tasks_status ON workflow_tasks(status);

-- 创建更新时间触发器（如果不存在）
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_trigger WHERE tgname = 'update_workflow_definitions_updated_at') THEN
        CREATE TRIGGER update_workflow_definitions_updated_at
            BEFORE UPDATE ON workflow_definitions
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT FROM pg_trigger WHERE tgname = 'update_workflow_nodes_updated_at') THEN
        CREATE TRIGGER update_workflow_nodes_updated_at
            BEFORE UPDATE ON workflow_nodes
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT FROM pg_trigger WHERE tgname = 'update_workflow_instances_updated_at') THEN
        CREATE TRIGGER update_workflow_instances_updated_at
            BEFORE UPDATE ON workflow_instances
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT FROM pg_trigger WHERE tgname = 'update_workflow_tasks_updated_at') THEN
        CREATE TRIGGER update_workflow_tasks_updated_at
            BEFORE UPDATE ON workflow_tasks
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;