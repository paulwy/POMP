-- 为 dict_types 表添加唯一约束（如果不存在）
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.table_constraints WHERE table_name = 'dict_types' AND constraint_name = 'dict_types_code_key') THEN
        ALTER TABLE dict_types ADD CONSTRAINT dict_types_code_key UNIQUE (code);
    END IF;
END $$;

-- 为 dict_items 表添加唯一约束（如果不存在）
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.table_constraints WHERE table_name = 'dict_items' AND constraint_name = 'dict_items_dict_type_id_code_key') THEN
        ALTER TABLE dict_items ADD CONSTRAINT dict_items_dict_type_id_code_key UNIQUE (dict_type_id, code);
    END IF;
END $$;

-- 插入默认字典类型
INSERT INTO dict_types (name, code, description, category, is_system) VALUES
('用户状态', 'user_status', '用户账号状态', 'system', true),
('用户角色', 'user_role', '用户角色类型', 'system', true),
('审批状态', 'approval_status', '审批流程状态', 'workflow', true),
('合同状态', 'contract_status', '合同状态', 'contract', true),
('文章状态', 'article_status', '文章状态', 'cms', true),
('优先级', 'priority', '优先级等级', 'common', true),
('部门类型', 'department_type', '部门类型', 'organization', true),
('岗位等级', 'position_level', '岗位等级', 'organization', true)
ON CONFLICT (code) DO NOTHING;

-- 插入用户状态字典项
INSERT INTO dict_items (dict_type_id, code, name, value, sort_order)
SELECT id, 'pending', '待审核', 'pending', 1 FROM dict_types WHERE code = 'user_status'
ON CONFLICT (dict_type_id, code) DO NOTHING;

INSERT INTO dict_items (dict_type_id, code, name, value, sort_order)
SELECT id, 'approved', '已通过', 'approved', 2 FROM dict_types WHERE code = 'user_status'
ON CONFLICT (dict_type_id, code) DO NOTHING;

INSERT INTO dict_items (dict_type_id, code, name, value, sort_order)
SELECT id, 'rejected', '已拒绝', 'rejected', 3 FROM dict_types WHERE code = 'user_status'
ON CONFLICT (dict_type_id, code) DO NOTHING;

INSERT INTO dict_items (dict_type_id, code, name, value, sort_order)
SELECT id, 'disabled', '已禁用', 'disabled', 4 FROM dict_types WHERE code = 'user_status'
ON CONFLICT (dict_type_id, code) DO NOTHING;

-- 插入审批状态字典项
INSERT INTO dict_items (dict_type_id, code, name, value, sort_order)
SELECT id, 'pending', '待审批', 'pending', 1 FROM dict_types WHERE code = 'approval_status'
ON CONFLICT (dict_type_id, code) DO NOTHING;

INSERT INTO dict_items (dict_type_id, code, name, value, sort_order)
SELECT id, 'processing', '审批中', 'processing', 2 FROM dict_types WHERE code = 'approval_status'
ON CONFLICT (dict_type_id, code) DO NOTHING;

INSERT INTO dict_items (dict_type_id, code, name, value, sort_order)
SELECT id, 'approved', '已通过', 'approved', 3 FROM dict_types WHERE code = 'approval_status'
ON CONFLICT (dict_type_id, code) DO NOTHING;

INSERT INTO dict_items (dict_type_id, code, name, value, sort_order)
SELECT id, 'rejected', '已拒绝', 'rejected', 4 FROM dict_types WHERE code = 'approval_status'
ON CONFLICT (dict_type_id, code) DO NOTHING;

INSERT INTO dict_items (dict_type_id, code, name, value, sort_order)
SELECT id, 'cancelled', '已撤销', 'cancelled', 5 FROM dict_types WHERE code = 'approval_status'
ON CONFLICT (dict_type_id, code) DO NOTHING;

-- 插入合同状态字典项
INSERT INTO dict_items (dict_type_id, code, name, value, sort_order)
SELECT id, 'draft', '草稿', 'draft', 1 FROM dict_types WHERE code = 'contract_status'
ON CONFLICT (dict_type_id, code) DO NOTHING;

INSERT INTO dict_items (dict_type_id, code, name, value, sort_order)
SELECT id, 'pending', '待审批', 'pending', 2 FROM dict_types WHERE code = 'contract_status'
ON CONFLICT (dict_type_id, code) DO NOTHING;

INSERT INTO dict_items (dict_type_id, code, name, value, sort_order)
SELECT id, 'active', '已生效', 'active', 3 FROM dict_types WHERE code = 'contract_status'
ON CONFLICT (dict_type_id, code) DO NOTHING;

INSERT INTO dict_items (dict_type_id, code, name, value, sort_order)
SELECT id, 'terminated', '已终止', 'terminated', 4 FROM dict_types WHERE code = 'contract_status'
ON CONFLICT (dict_type_id, code) DO NOTHING;

-- 插入文章状态字典项
INSERT INTO dict_items (dict_type_id, code, name, value, sort_order)
SELECT id, 'draft', '草稿', 'draft', 1 FROM dict_types WHERE code = 'article_status'
ON CONFLICT (dict_type_id, code) DO NOTHING;

INSERT INTO dict_items (dict_type_id, code, name, value, sort_order)
SELECT id, 'pending_review', '待审核', 'pending_review', 2 FROM dict_types WHERE code = 'article_status'
ON CONFLICT (dict_type_id, code) DO NOTHING;

INSERT INTO dict_items (dict_type_id, code, name, value, sort_order)
SELECT id, 'published', '已发布', 'published', 3 FROM dict_types WHERE code = 'article_status'
ON CONFLICT (dict_type_id, code) DO NOTHING;

INSERT INTO dict_items (dict_type_id, code, name, value, sort_order)
SELECT id, 'withdrawn', '已撤回', 'withdrawn', 4 FROM dict_types WHERE code = 'article_status'
ON CONFLICT (dict_type_id, code) DO NOTHING;

-- 插入优先级字典项
INSERT INTO dict_items (dict_type_id, code, name, value, sort_order)
SELECT id, 'low', '低', 'low', 1 FROM dict_types WHERE code = 'priority'
ON CONFLICT (dict_type_id, code) DO NOTHING;

INSERT INTO dict_items (dict_type_id, code, name, value, sort_order)
SELECT id, 'medium', '中', 'medium', 2 FROM dict_types WHERE code = 'priority'
ON CONFLICT (dict_type_id, code) DO NOTHING;

INSERT INTO dict_items (dict_type_id, code, name, value, sort_order)
SELECT id, 'high', '高', 'high', 3 FROM dict_types WHERE code = 'priority'
ON CONFLICT (dict_type_id, code) DO NOTHING;

INSERT INTO dict_items (dict_type_id, code, name, value, sort_order)
SELECT id, 'urgent', '紧急', 'urgent', 4 FROM dict_types WHERE code = 'priority'
ON CONFLICT (dict_type_id, code) DO NOTHING;