-- =========================================
-- SKSFEMS 系统快速初始化脚本
-- 运行前请确保数据库已创建并连接正常
-- 使用方式: psql -h localhost -U sksfems -d sksfems -f init_system.sql
-- =========================================

-- 1. 创建审批流程所需角色
INSERT INTO roles (id, name, code, description, is_active, created_at, updated_at)
VALUES
  (gen_random_uuid(), '主管', 'manager', '直属上级，可审批下属申请', true, NOW(), NOW()),
  (gen_random_uuid(), '部门经理', 'department_manager', '部门负责人，可审批部门内重要事项', true, NOW(), NOW()),
  (gen_random_uuid(), '财务', 'finance', '财务人员，可审批涉及费用的申请', true, NOW(), NOW()),
  (gen_random_uuid(), '内容初审', 'content_reviewer', '审核内容准确性和合规性', true, NOW(), NOW()),
  (gen_random_uuid(), '编辑', 'editor', '审核格式、标点、排版等', true, NOW(), NOW()),
  (gen_random_uuid(), '主编', 'chief_editor', '最终内容发布审批', true, NOW(), NOW()),
  (gen_random_uuid(), '人事专员', 'hr_specialist', '负责人事日常审批工作', true, NOW(), NOW()),
  (gen_random_uuid(), '人事经理', 'hr_manager', '负责人事重要事项审批', true, NOW(), NOW()),
  (gen_random_uuid(), '项目经理', 'project_manager', '负责项目管理相关审批', true, NOW(), NOW()),
  (gen_random_uuid(), '技术总监', 'tech_director', '负责技术方案审批', true, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- 2. 创建部门结构
-- 检查 departments 表结构
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
  INSERT INTO departments (id, name, description, is_active, created_at, updated_at)
  VALUES (gen_random_uuid(), '总公司', '公司总部', true, NOW(), NOW())
  RETURNING id INTO dept_root_id;

  -- 创建行政管理部
  INSERT INTO departments (id, name, parent_id, description, is_active, created_at, updated_at)
  VALUES (gen_random_uuid(), '行政管理部', dept_root_id, '负责公司行政事务', true, NOW(), NOW())
  RETURNING id INTO dept_admin_id;

  -- 创建人力资源部
  INSERT INTO departments (id, name, parent_id, description, is_active, created_at, updated_at)
  VALUES (gen_random_uuid(), '人力资源部', dept_root_id, '负责人员招聘、培训等', true, NOW(), NOW())
  RETURNING id INTO dept_hr_id;

  -- 创建财务部
  INSERT INTO departments (id, name, parent_id, description, is_active, created_at, updated_at)
  VALUES (gen_random_uuid(), '财务部', dept_root_id, '负责财务核算、管理', true, NOW(), NOW())
  RETURNING id INTO dept_finance_id;

  -- 创建技术部
  INSERT INTO departments (id, name, parent_id, description, is_active, created_at, updated_at)
  VALUES (gen_random_uuid(), '技术部', dept_root_id, '负责技术研发', true, NOW(), NOW())
  RETURNING id INTO dept_tech_id;

  -- 创建市场部
  INSERT INTO departments (id, name, parent_id, description, is_active, created_at, updated_at)
  VALUES (gen_random_uuid(), '市场部', dept_root_id, '负责市场推广', true, NOW(), NOW())
  RETURNING id INTO dept_market_id;

  -- 创建编辑部
  INSERT INTO departments (id, name, parent_id, description, is_active, created_at, updated_at)
  VALUES (gen_random_uuid(), '编辑部', dept_root_id, '负责内容生产', true, NOW(), NOW())
  RETURNING id INTO dept_editorial_id;

  -- 创建销售部
  INSERT INTO departments (id, name, parent_id, description, is_active, created_at, updated_at)
  VALUES (gen_random_uuid(), '销售部', dept_root_id, '负责产品销售', true, NOW(), NOW())
  RETURNING id INTO dept_sales_id;

  RAISE NOTICE '部门创建成功';
END $$;

-- 3. 创建岗位级别
INSERT INTO position_levels (id, level_name, level_order, description, is_active, created_at, updated_at)
VALUES
  (gen_random_uuid(), '普通员工', 1, '基础岗位', true, NOW(), NOW()),
  (gen_random_uuid(), '主管', 2, '初级管理', true, NOW(), NOW()),
  (gen_random_uuid(), '经理', 3, '中级管理', true, NOW(), NOW()),
  (gen_random_uuid(), '高级经理', 4, '高级管理', true, NOW(), NOW()),
  (gen_random_uuid(), '总监', 5, '高层管理', true, NOW(), NOW()),
  (gen_random_uuid(), '副总裁', 6, '最高管理层', true, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- 4. 创建文章审核工作流
-- 检查工作流是否已存在
DO $$
DECLARE
  wf_article_id UUID;
  node1_id UUID;
  node2_id UUID;
  node3_id UUID;
BEGIN
  -- 检查文章审核工作流是否已存在
  SELECT id INTO wf_article_id FROM workflows WHERE name = '文章审核审批';
  
  IF wf_article_id IS NULL THEN
    -- 创建文章审核工作流
    INSERT INTO workflows (id, name, description, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), '文章审核审批', '文章发布前的多级审核工作流', true, NOW(), NOW())
    RETURNING id INTO wf_article_id;

    -- 获取角色ID
    -- 第一级：内容初审
    INSERT INTO workflow_nodes (id, workflow_id, name, node_type, node_order, approver_role, is_multiple, min_approve, timeout_days, created_at, updated_at)
    VALUES (
      gen_random_uuid(),
      wf_article_id,
      '内容初审',
      'approval',
      1,
      'content_reviewer',
      false,
      1,
      1,
      NOW(),
      NOW()
    );

    -- 第二级：编辑审核
    INSERT INTO workflow_nodes (id, workflow_id, name, node_type, node_order, approver_role, is_multiple, min_approve, timeout_days, created_at, updated_at)
    VALUES (
      gen_random_uuid(),
      wf_article_id,
      '编辑审核',
      'approval',
      2,
      'editor',
      false,
      1,
      2,
      NOW(),
      NOW()
    );

    -- 第三级：主编终审
    INSERT INTO workflow_nodes (id, workflow_id, name, node_type, node_order, approver_role, is_multiple, min_approve, timeout_days, created_at, updated_at)
    VALUES (
      gen_random_uuid(),
      wf_article_id,
      '主编终审',
      'approval',
      3,
      'chief_editor',
      false,
      1,
      3,
      NOW(),
      NOW()
    );

    RAISE NOTICE '文章审核工作流创建成功';
  ELSE
    RAISE NOTICE '文章审核工作流已存在，跳过创建';
  END IF;
END $$;

-- 5. 验证结果
SELECT '角色创建结果:' AS info;
SELECT name, code FROM roles ORDER BY created_at DESC LIMIT 10;

SELECT '部门创建结果:' AS info;
SELECT name FROM departments;

SELECT '工作流创建结果:' AS info;
SELECT name, is_active FROM workflows;

SELECT '文章审核工作流节点:' AS info;
SELECT wn.name, wn.node_order, wn.approver_role
FROM workflow_nodes wn
JOIN workflows w ON wn.workflow_id = w.id
WHERE w.name = '文章审核审批'
ORDER BY wn.node_order;

-- 6. 输出后续步骤说明
\echo ''
\echo '========================================='
\echo '系统快速初始化完成！'
\echo '========================================='
\echo ''
\echo '下一步操作：'
\echo '1. 为用户分配角色（特别是编辑、主编等审批角色）'
\echo '2. 将用户分配到相应部门'
\echo '3. 为用户设置直接上级（用于审批流程）'
\echo '4. 详细配置请参阅: docs/系统配置指引手册.md'
\echo ''
