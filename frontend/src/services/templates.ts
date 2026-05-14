import apiClient from '@/api/client';

export interface Template {
  id: string;
  code: string;
  name: string;
  description?: string;
  category: string;
  template_type: string;
  content: any;
  variables?: any[];
  version: string;
  is_active: boolean;
  is_system: boolean;
  is_default: boolean;
  sort_order: number;
  tags: string[];
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface TemplateWithStats {
  template: Template;
  usage_count: number;
  is_favorite: boolean;
}

export interface TemplateVersion {
  id: string;
  template_id: string;
  version_number: number;
  version_name?: string;
  content: any;
  description?: string;
  created_by?: string;
  created_at: string;
}

export interface TemplatePermission {
  id: string;
  template_id: string;
  permission_type: 'organization' | 'department' | 'role' | 'user';
  target_id: string;
  target_name?: string;
  access_level: 'read' | 'write' | 'admin';
  created_at: string;
}

export interface CreateTemplateRequest {
  code: string;
  name: string;
  description?: string;
  category: string;
  template_type: string;
  content: any;
  variables?: any[];
  version?: string;
  is_active?: boolean;
  is_default?: boolean;
  sort_order?: number;
  tags?: string[];
  created_by?: string;
}

export interface UpdateTemplateRequest {
  name?: string;
  description?: string;
  category?: string;
  content?: any;
  variables?: any[];
  version?: string;
  is_active?: boolean;
  is_default?: boolean;
  sort_order?: number;
  tags?: string[];
}

export const templateService = {
  async getTemplates(params?: {
    category?: string;
    template_type?: string;
    is_active?: boolean;
    user_id?: string;
  }): Promise<TemplateWithStats[]> {
    const response = await apiClient.get('/v1/templates', { params });
    return response.data;
  },

  async getTemplate(id: string): Promise<Template> {
    const response = await apiClient.get(`/v1/templates/${id}`);
    return response.data;
  },

  async getTemplateByCode(code: string): Promise<Template> {
    const response = await apiClient.get(`/v1/templates/code/${code}`);
    return response.data;
  },

  async createTemplate(data: CreateTemplateRequest): Promise<Template> {
    const response = await apiClient.post('/v1/templates', data);
    return response.data;
  },

  async updateTemplate(id: string, data: UpdateTemplateRequest): Promise<Template> {
    const response = await apiClient.put(`/v1/templates/${id}`, data);
    return response.data;
  },

  async deleteTemplate(id: string): Promise<{ success: boolean }> {
    const response = await apiClient.delete(`/v1/templates/${id}`);
    return response.data;
  },

  async getCategories(): Promise<string[]> {
    const response = await apiClient.get('/v1/templates/categories');
    return response.data;
  },

  async recordUsage(data: {
    template_id: string;
    business_type?: string;
    business_id?: string;
    used_by?: string;
  }): Promise<{ success: boolean }> {
    const response = await apiClient.post('/v1/templates/usage', data);
    return response.data;
  },

  async initDefaults(): Promise<{ success: boolean }> {
    const response = await apiClient.post('/v1/templates/init-defaults');
    return response.data;
  },

  async toggleFavorite(template_id: string, user_id: string): Promise<{ success: boolean; is_favorite: boolean }> {
    const response = await apiClient.post('/v1/templates/favorites/toggle', { template_id, user_id });
    return response.data;
  },

  async getFavorites(user_id: string, category?: string): Promise<Template[]> {
    const response = await apiClient.get('/v1/templates/favorites', { params: { user_id, category } });
    return response.data;
  },

  async getVersions(template_id: string): Promise<TemplateVersion[]> {
    const response = await apiClient.get(`/v1/templates/${template_id}/versions`);
    return response.data;
  },

  async createVersion(template_id: string, data: {
    version_name?: string;
    description?: string;
    created_by?: string;
  }): Promise<TemplateVersion> {
    const response = await apiClient.post(`/v1/templates/${template_id}/versions`, data);
    return response.data;
  },

  async getVersion(template_id: string, version_number: number): Promise<TemplateVersion> {
    const response = await apiClient.get(`/v1/templates/${template_id}/versions/${version_number}`);
    return response.data;
  },

  async rollbackVersion(template_id: string, version_number: number): Promise<Template> {
    const response = await apiClient.post(`/v1/templates/${template_id}/versions/${version_number}/rollback`);
    return response.data;
  },

  async deleteVersion(template_id: string, version_number: number): Promise<{ success: boolean }> {
    const response = await apiClient.delete(`/v1/templates/${template_id}/versions/${version_number}`);
    return response.data;
  },

  async getPermissions(template_id: string): Promise<TemplatePermission[]> {
    const response = await apiClient.get(`/v1/templates/${template_id}/permissions`);
    return response.data;
  },

  async addPermission(template_id: string, data: {
    permission_type: 'organization' | 'department' | 'role' | 'user';
    target_id: string;
    target_name?: string;
    access_level: 'read' | 'write' | 'admin';
  }): Promise<TemplatePermission> {
    const response = await apiClient.post(`/v1/templates/${template_id}/permissions`, data);
    return response.data;
  },

  async removePermission(permission_id: string): Promise<{ success: boolean }> {
    const response = await apiClient.delete(`/v1/templates/permissions/${permission_id}`);
    return response.data;
  },

  async checkAccess(template_id: string, user_id: string, required_level: 'read' | 'write' | 'admin'): Promise<{ has_access: boolean }> {
    const response = await apiClient.post(`/v1/templates/${template_id}/check-access`, { user_id, required_level });
    return response.data;
  },
};

// 预定义的模板分类和类型
export const TEMPLATE_CATEGORIES = [
  { value: '组织架构', label: '组织架构' },
  { value: '工作流', label: '工作流' },
  { value: '合同', label: '合同' },
  { value: '物料', label: '物料' },
  { value: '内容管理', label: '内容管理' },
  { value: 'AI助手', label: 'AI助手' },
  { value: '其他', label: '其他' },
];

export const TEMPLATE_TYPES: Record<string, { value: string; label: string }[]> = {
  '组织架构': [
    { value: 'department', label: '部门' },
    { value: 'position', label: '职位' },
    { value: 'position_level', label: '职级' },
    { value: 'approval_rule', label: '审批规则' },
  ],
  '工作流': [
    { value: 'workflow', label: '工作流' },
  ],
  '合同': [
    { value: 'contract', label: '合同模板' },
  ],
  '物料': [
    { value: 'material', label: '物料' },
  ],
  '内容管理': [
    { value: 'cms_content', label: '内容模板' },
    { value: 'cms_category', label: '分类模板' },
  ],
  'AI助手': [
    { value: 'ai_prompt', label: 'AI提示词' },
    { value: 'ai_optimize', label: 'AI优化模板' },
  ],
  '其他': [
    { value: 'other', label: '其他' },
  ],
};

// 获取类型标签
export const getCategoryLabel = (category: string): string => {
  return TEMPLATE_CATEGORIES.find(c => c.value === category)?.label || category;
};

export const getTypeLabel = (category: string, type: string): string => {
  const types = TEMPLATE_TYPES[category] || [];
  return types.find(t => t.value === type)?.label || type;
};

// 变量替换工具
export const applyTemplate = (template: Template, variables: Record<string, any>): any => {
  let content = JSON.stringify(template.content);
  
  // 简单的变量替换 {variable_name}
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`\\{${key}\\}`, 'g');
    content = content.replace(regex, String(value));
  });
  
  return JSON.parse(content);
};
