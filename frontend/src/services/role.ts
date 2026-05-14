import apiClient from '@/api/client';

const API_BASE_URL = '/v1';

export interface Role {
  id: string;
  name: string;
  code: string;
  description?: string;
  is_active: boolean;
  is_system?: boolean;
  sort_order?: number;
  created_at: string;
  updated_at: string;
  user_count?: number;
}

export interface Permission {
  id: string;
  name: string;
  code: string;
  resource?: string;
  action?: string;
  description?: string;
  parent_id?: string;
  children?: Permission[];
}

export interface CreateRoleRequest {
  name: string;
  code: string;
  description?: string;
  sort_order?: number;
}

export interface UpdateRoleRequest {
  name?: string;
  code?: string;
  description?: string;
  is_active?: boolean;
  sort_order?: number;
}

export interface AssignPermissionsRequest {
  permission_ids: string[];
}

export interface PaginationResponse<T> {
  data: T[];
  total: number;
  page: number;
  page_size: number;
}

export const roleApi = {
  getRoles: async (page: number = 1, pageSize: number = 10): Promise<PaginationResponse<Role>> => {
    const response = await apiClient.get(`${API_BASE_URL}/roles`, {
      params: { page, page_size: pageSize }
    });
    return response.data.data;
  },

  getRole: async (id: string): Promise<Role> => {
    const response = await apiClient.get(`${API_BASE_URL}/roles/${id}`);
    return response.data.data;
  },

  createRole: async (data: CreateRoleRequest): Promise<Role> => {
    const response = await apiClient.post(`${API_BASE_URL}/roles`, data);
    return response.data.data;
  },

  updateRole: async (id: string, data: UpdateRoleRequest): Promise<Role> => {
    const response = await apiClient.put(`${API_BASE_URL}/roles/${id}`, data);
    return response.data.data;
  },

  deleteRole: async (id: string): Promise<void> => {
    await apiClient.delete(`${API_BASE_URL}/roles/${id}`);
  },

  updateRoleStatus: async (id: string, isActive: boolean): Promise<Role> => {
    const response = await apiClient.patch(`${API_BASE_URL}/roles/${id}/status`, { is_active: isActive });
    return response.data.data;
  },

  getRolePermissions: async (id: string): Promise<Permission[]> => {
    const response = await apiClient.get(`${API_BASE_URL}/roles/${id}/permissions`);
    return response.data.data;
  },

  assignRolePermissions: async (id: string, permissionIds: string[]): Promise<void> => {
    await apiClient.post(`${API_BASE_URL}/roles/${id}/permissions`, { permission_ids: permissionIds });
  },

  getAllPermissions: async (): Promise<Permission[]> => {
    const response = await apiClient.get(`${API_BASE_URL}/permissions`);
    return response.data.data;
  },

  getUserRoles: async (userId: string): Promise<Role[]> => {
    const response = await apiClient.get(`${API_BASE_URL}/users/${userId}/roles`);
    return response.data.data;
  },

  assignUserRoles: async (userId: string, roleIds: string[]): Promise<void> => {
    await apiClient.post(`${API_BASE_URL}/users/${userId}/roles`, { role_ids: roleIds });
  },

  removeUserRole: async (userId: string, roleId: string): Promise<void> => {
    await apiClient.delete(`${API_BASE_URL}/users/${userId}/roles/${roleId}`);
  },
};

export const PERMISSION_TEMPLATES = {
  admin: {
    name: '管理员',
    description: '系统管理员，拥有所有权限',
    permissions: ['*']
  },
  hr: {
    name: '人事专员',
    description: '人力资源管理权限',
    permissions: ['user:read', 'user:create', 'user:update', 'department:read', 'department:manage']
  },
  finance: {
    name: '财务专员',
    description: '财务管理权限',
    permissions: ['expense:read', 'expense:create', 'expense:approve']
  },
  content: {
    name: '内容编辑',
    description: '内容管理权限',
    permissions: ['content:read', 'content:create', 'content:update', 'content:delete']
  },
  production: {
    name: '生产文档编辑',
    description: '生产文档管理权限',
    permissions: ['production:read', 'production:create', 'production:update', 'production:delete', 'production:review']
  }
};

export const PERMISSION_GROUPS = [
  {
    group: '用户管理',
    permissions: [
      { code: 'user:read', name: '查看用户', action: 'read' },
      { code: 'user:create', name: '创建用户', action: 'create' },
      { code: 'user:update', name: '更新用户', action: 'update' },
      { code: 'user:delete', name: '删除用户', action: 'delete' },
      { code: 'user:manage', name: '管理用户', action: 'manage' },
    ]
  },
  {
    group: '角色权限',
    permissions: [
      { code: 'role:read', name: '查看角色', action: 'read' },
      { code: 'role:create', name: '创建角色', action: 'create' },
      { code: 'role:update', name: '更新角色', action: 'update' },
      { code: 'role:delete', name: '删除角色', action: 'delete' },
    ]
  },
  {
    group: '部门管理',
    permissions: [
      { code: 'department:read', name: '查看部门', action: 'read' },
      { code: 'department:manage', name: '管理部门', action: 'manage' },
    ]
  },
  {
    group: '审批流程',
    permissions: [
      { code: 'approval:read', name: '查看审批', action: 'read' },
      { code: 'approval:create', name: '创建审批', action: 'create' },
      { code: 'approval:approve', name: '审批', action: 'approve' },
      { code: 'approval:reject', name: '拒绝', action: 'reject' },
    ]
  },
  {
    group: '内容管理',
    permissions: [
      { code: 'content:read', name: '查看内容', action: 'read' },
      { code: 'content:create', name: '创建内容', action: 'create' },
      { code: 'content:update', name: '更新内容', action: 'update' },
      { code: 'content:delete', name: '删除内容', action: 'delete' },
      { code: 'content:publish', name: '发布内容', action: 'publish' },
    ]
  },
  {
    group: '财务管理',
    permissions: [
      { code: 'expense:read', name: '查看费用', action: 'read' },
      { code: 'expense:create', name: '创建费用', action: 'create' },
      { code: 'expense:approve', name: '审批费用', action: 'approve' },
      { code: 'finance:report', name: '财务报表', action: 'report' },
    ]
  },
  {
    group: '系统设置',
    permissions: [
      { code: 'settings:read', name: '查看设置', action: 'read' },
      { code: 'settings:update', name: '更新设置', action: 'update' },
      { code: 'workflow:manage', name: '工作流管理', action: 'manage' },
      { code: 'dict:manage', name: '字典管理', action: 'manage' },
    ]
  },
  {
    group: '生产管理',
    permissions: [
      { code: 'production:read', name: '查看生产文档', action: 'read' },
      { code: 'production:create', name: '创建生产文档', action: 'create' },
      { code: 'production:update', name: '更新生产文档', action: 'update' },
      { code: 'production:delete', name: '删除生产文档', action: 'delete' },
      { code: 'production:review', name: '审核生产文档', action: 'review' },
    ]
  },
];
