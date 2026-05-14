-- 创建角色表
CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT true NOT NULL,
    is_system BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 创建用户-角色关联表（如果不存在）
CREATE TABLE IF NOT EXISTS user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    assigned_by UUID REFERENCES users(id),
    UNIQUE(user_id, role_id)
);

-- 创建权限表（如果不存在）
CREATE TABLE IF NOT EXISTS permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(100) NOT NULL UNIQUE,
    resource VARCHAR(50),
    action VARCHAR(50),
    description TEXT,
    parent_id UUID REFERENCES permissions(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 创建角色-权限关联表（如果不存在）
CREATE TABLE IF NOT EXISTS role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    UNIQUE(role_id, permission_id)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON user_roles(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id ON role_permissions(permission_id);
CREATE INDEX IF NOT EXISTS idx_permissions_resource_action ON permissions(resource, action);

-- 插入默认角色
INSERT INTO roles (name, code, description, is_active, is_system) VALUES
('超级管理员', 'admin', '拥有系统所有权限，可以管理所有功能', true, true),
('内容管理员', 'content_admin', '管理所有内容，可以审核和发布内容', true, true),
('内容编辑', 'editor', '可以创建和编辑内容，等待审核后发布', true, true),
('普通用户', 'user', '查看内容和发起申请', true, true)
ON CONFLICT (code) DO NOTHING;

-- 插入默认权限
INSERT INTO permissions (name, code, resource, action, description) VALUES
-- 用户权限
('查看用户', 'user:read', 'user', 'read', '查看用户列表和详情'),
('创建用户', 'user:create', 'user', 'create', '创建新用户'),
('更新用户', 'user:update', 'user', 'update', '更新用户信息'),
('删除用户', 'user:delete', 'user', 'delete', '删除用户'),
('管理用户状态', 'user:manage_status', 'user', 'manage_status', '审批、激活、禁用用户'),

-- 角色权限
('查看角色', 'role:read', 'role', 'read', '查看角色列表和详情'),
('创建角色', 'role:create', 'role', 'create', '创建新角色'),
('更新角色', 'role:update', 'role', 'update', '更新角色信息'),
('删除角色', 'role:delete', 'role', 'delete', '删除角色'),
('分配角色权限', 'role:assign_permissions', 'role', 'assign_permissions', '为角色分配权限'),

-- 内容权限
('查看内容', 'content:read', 'content', 'read', '查看内容列表和详情'),
('创建内容', 'content:create', 'content', 'create', '创建新内容'),
('更新内容', 'content:update', 'content', 'update', '更新内容'),
('删除内容', 'content:delete', 'content', 'delete', '删除内容'),
('发布内容', 'content:publish', 'content', 'publish', '发布内容'),
('审核内容', 'content:review', 'content', 'review', '审核内容并决定是否发布'),

-- 审批权限
('查看审批', 'approval:read', 'approval', 'read', '查看审批列表'),
('发起审批', 'approval:create', 'approval', 'create', '发起审批申请'),
('审批操作', 'approval:approve', 'approval', 'approve', '审批通过或拒绝'),

-- 系统权限
('系统设置', 'system:settings', 'system', 'settings', '修改系统设置')
ON CONFLICT (code) DO NOTHING;

-- 为管理员角色分配所有权限
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p WHERE r.code = 'admin'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- 为内容管理员分配内容相关权限
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.code = 'content_admin' AND p.code IN (
    'content:read', 'content:create', 'content:update', 'content:delete', 'content:publish', 'content:review',
    'approval:read', 'approval:approve'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- 为内容编辑分配基本内容权限
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.code = 'editor' AND p.code IN (
    'content:read', 'content:create', 'content:update',
    'approval:read', 'approval:create'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- 为普通用户分配查看权限
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.code = 'user' AND p.code IN (
    'content:read', 'approval:read', 'approval:create'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- 将现有管理员用户分配给管理员角色
INSERT INTO user_roles (user_id, role_id, assigned_at, assigned_by)
SELECT u.id, r.id, CURRENT_TIMESTAMP, u.id
FROM users u, roles r
WHERE u.is_superuser = true AND r.code = 'admin'
ON CONFLICT (user_id, role_id) DO NOTHING;