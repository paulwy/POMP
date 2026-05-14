-- 添加审批规则ID字段（如果不存在）
ALTER TABLE IF EXISTS workflow_steps ADD COLUMN IF NOT EXISTS approval_rule_id UUID;

-- 添加外键约束（仅当 approval_rules 表存在时）
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'approval_rules') THEN
        IF NOT EXISTS (SELECT FROM information_schema.table_constraints WHERE table_name = 'workflow_steps' AND constraint_name = 'fk_workflow_step_approval_rule') THEN
            ALTER TABLE workflow_steps ADD CONSTRAINT fk_workflow_step_approval_rule FOREIGN KEY (approval_rule_id) REFERENCES approval_rules(id);
        END IF;
    END IF;
END $$;
