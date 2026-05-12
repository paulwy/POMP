-- =========================================
-- SKSFEMS 系统快速初始化脚本（修正版）
-- 运行前请确保数据库已创建并连接正常
-- 使用方式: psql -h localhost -U sksfems -d sksfems -f init_system_fixed.sql
-- =========================================

-- 1. 创建审批流程所需角色
INSERT INTO roles (id, name, code, description, is_system, created_at, updated_at)
VALUES
  (uuid_generate_v4(), '主管', 'manager', '直属上级，可审批下属申请', false, NOW(), NOW()),
  (uuid_generate_v4(), '部门经理', 'department_manager', '部门负责人，可审批部门内重要事项', false, NOW(), NOW()),
  (uuid_generate_v4(), '财务', 'finance', '财务人员，可审批涉及费用的申请', false, NOW(), NOW()),
  (uuid_generate_v4(), '内容初审', 'content_reviewer', '审核内容准确性和合规性', false, NOW(), NOW()),
  (uuid_generate_v4(), '编辑', 'editor', '审核格式、标点、排版等', false, NOW(), NOW()),
  (uuid_generate_v4(), '主编', 'chief_editor', '最终内容发布审批', false, NOW(), NOW()),
  (uuid_generate_v4(), '人事专员', 'hr_specialist', '负责人事日常审批工作', false, NOW(), NOW()),
  (uuid_generate_v4(), '人事经理', 'hr_manager', '负责人事重要事项审批', false, NOW(), NOW()),
  (uuid_generate_v4(), '项目经理', 'project_manager', '负责项目管理相关审批', false, NOW(), NOW()),
  (uuid_generate_v4(), '技术总监', 'tech_director', '负责技术方案审批', false, NOW(), NOW())
ON CONFLICT (code) DO NOTHING;

-- 2. 创建部门结构
DO $$
DECLARE
  dept_root_id UUID;
  dept_admin_id UUID;
  dept_hr_id UUID;
  dept_finance_id UUID;
  dept_tech_id UUID;
  dept_market_id UUID;
  dept_editorial_id UUID;
  dept_sales_id UUID;
BEGIN
  -- 创建总公司
  INSERT INTO departments (id, name, description, order_num, created_at, updated_at)
  VALUES (uuid_generate_v4(), '总公司', '公司总部', 0, NOW(), NOW())
  RETURNING id INTO dept_root_id;

  -- 创建行政管理部
  INSERT INTO departments (id, name, parent_id, description, order_num, created_at, updated_at)
  VALUES (uuid_generate_v4(), '行政管理部', dept_root_id, '负责公司行政事务', 1, NOW(), NOW())
  RETURNING id INTO dept_admin_id;

  -- 创建人力资源部
  INSERT INTO departments (id, name, parent_id, description, order_num, created_at, updated_at)
  VALUES (uuid_generate_v4(), '人力资源部', dept_root_id, '负责人员招聘、培训等', 2, NOW(), NOW())
  RETURNING id INTO dept_hr_id;

  -- 创建财务部
  INSERT INTO departments (id, name, parent_id, description, order_num, created_at, updated_at)
  VALUES (uuid_generate_v4(), '财务部', dept_root_id, '负责财务核算、管理', 3, NOW(), NOW())
  RETURNING id INTO dept_finance_id;

  -- 创建技术部
  INSERT INTO departments (id, name, parent_id, description, order_num, created_at, updated_at)
  VALUES (uuid_generate_v4(), '技术部', dept_root_id, '负责技术研发', 4, NOW(), NOW())
  RETURNING id INTO dept_tech_id;

  -- 创建市场部
  INSERT INTO departments (id, name, parent_id, description, order_num, created_at, updated_at)
  VALUES (uuid_generate_v4(), '市场部', dept_root_id, '负责市场推广', 5, NOW(), NOW())
  RETURNING id INTO dept_market_id;

  -- 创建编辑部
  INSERT INTO departments (id, name, parent_id, description, order_num, created_at, updated_at)
  VALUES (uuid_generate_v4(), '编辑部', dept_root_id, '负责内容生产', 6, NOW(), NOW())
  RETURNING id INTO dept_editorial_id;

  -- 创建销售部
  INSERT INTO departments (id, name, parent_id, description, order_num, created_at, updated_at)
  VALUES (uuid_generate_v4(), '销售部', dept_root_id, '负责产品销售', 7, NOW(), NOW())
  RETURNING id INTO dept_sales_id;

  RAISE NOTICE '部门创建成功: 总公司(%), 行政管理部(%), 人力资源部(%), 财务部(%), 技术部(%), 市场部(%), 编辑部(%), 销售部(%)',
    dept_root_id, dept_admin_id, dept_hr_id, dept_finance_id, dept_tech_id, dept_market_id, dept_editorial_id, dept_sales_id;
END $$;

-- 3. 验证结果
\echo ''
\echo '========================================='
\echo '角色创建结果:'
\echo '========================================='
SELECT name, code FROM roles ORDER BY created_at DESC;

\echo ''
\echo '========================================='
\echo '部门创建结果:'
\echo '========================================='
SELECT name, parent_id IS NOT NULL AS has_parent FROM departments ORDER BY order_num;

\echo ''
\echo '========================================='
\echo '工作流列表:'
\echo '========================================='
SELECT name, is_active FROM workflows;

\echo ''
\echo '========================================='
\echo '文章审核工作流节点:'
\echo '========================================='
SELECT wn.name, wn.node_order, wn.approver_role
FROM workflow_nodes wn
JOIN workflows w ON wn.workflow_id = w.id
WHERE w.name = '文章审核审批'
ORDER BY wn.node_order;

\echo ''
\echo '========================================='
\echo '系统初始化完成！'
\echo '========================================='
\echo ''
\echo '下一步操作：'
\echo '1. 为用户分配角色（特别是编辑、主编等审批角色）'
\echo '2. 将用户分配到相应部门'
\echo '3. 为用户设置直接上级（用于审批流程）'
\echo '4. 详细配置请参阅: docs/系统配置指引手册.md'
\echo ''
