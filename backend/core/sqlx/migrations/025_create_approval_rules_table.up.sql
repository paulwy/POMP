-- 创建审批规则表（如果不存在）
CREATE TABLE IF NOT EXISTS approval_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    code VARCHAR(50),
    rule_type VARCHAR(50),
    workflow_type VARCHAR(50),
    node_order INTEGER DEFAULT 0,
    position_level_id UUID,
    department_id UUID,
    specific_user_id UUID,
    min_approvers INTEGER DEFAULT 1,
    approval_mode VARCHAR(20) DEFAULT 'any',
    condition_expression TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引（如果不存在）
CREATE INDEX IF NOT EXISTS idx_approval_rules_code ON approval_rules(code);
CREATE INDEX IF NOT EXISTS idx_approval_rules_rule_type ON approval_rules(rule_type);
CREATE INDEX IF NOT EXISTS idx_approval_rules_workflow_type ON approval_rules(workflow_type);
CREATE INDEX IF NOT EXISTS idx_approval_rules_is_active ON approval_rules(is_active);

-- 添加外键约束（仅当目标表存在时）
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'position_levels') THEN
        IF NOT EXISTS (SELECT FROM information_schema.table_constraints WHERE table_name = 'approval_rules' AND constraint_name = 'fk_approval_rules_position_level') THEN
            ALTER TABLE approval_rules ADD CONSTRAINT fk_approval_rules_position_level FOREIGN KEY (position_level_id) REFERENCES position_levels(id);
        END IF;
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'departments') THEN
        IF NOT EXISTS (SELECT FROM information_schema.table_constraints WHERE table_name = 'approval_rules' AND constraint_name = 'fk_approval_rules_department') THEN
            ALTER TABLE approval_rules ADD CONSTRAINT fk_approval_rules_department FOREIGN KEY (department_id) REFERENCES departments(id);
        END IF;
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users') THEN
        IF NOT EXISTS (SELECT FROM information_schema.table_constraints WHERE table_name = 'approval_rules' AND constraint_name = 'fk_approval_rules_user') THEN
            ALTER TABLE approval_rules ADD CONSTRAINT fk_approval_rules_user FOREIGN KEY (specific_user_id) REFERENCES users(id);
        END IF;
    END IF;
END $$;