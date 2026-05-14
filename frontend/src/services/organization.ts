import apiClient from '@/api/client';

const API_BASE_URL = '/v1/organization';
const DEPARTMENT_API_BASE_URL = '/v1/departments';

export interface Department {
  id: string;
  name: string;
  code: string;
  parent_id?: string;
  manager_id?: string;
  description?: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface CreateDepartmentRequest {
  name: string;
  code: string;
  parent_id?: string;
  manager_id?: string;
  description?: string;
  sort_order?: number;
}

export interface UpdateDepartmentRequest {
  name?: string;
  code?: string;
  parent_id?: string;
  manager_id?: string;
  description?: string;
  is_active?: boolean;
  sort_order?: number;
}

export interface PositionLevel {
  id: string;
  code: string;
  name: string;
  level: number;
  level_order: number;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface Position {
  id: string;
  name: string;
  code: string;
  position_level_id?: string;
  level_id?: string;
  department_id?: string;
  description?: string;
  is_leader: boolean;
  sort_order: number;
  level_name?: string;
  department_name?: string;
  created_at: string;
  updated_at: string;
}

export interface ApprovalRule {
  id: string;
  name: string;
  workflow_type?: string;
  node_order?: number;
  rule_type: string;
  position_level_id?: string;
  department_id?: string;
  specific_user_id?: string;
  min_approvers?: number;
  approval_mode?: string;
  condition_expression?: string;
  is_active?: boolean;
  position_level_name?: string;
  department_name?: string;
  specific_user_name?: string;
  created_at: string;
  updated_at: string;
}

export interface CreatePositionLevelRequest {
  code: string;
  name: string;
  level_order: number;
  description?: string;
}

export interface CreatePositionRequest {
  title: string;
  code: string;
  position_level_id?: string;
  department_id?: string;
  description?: string;
  is_leader?: boolean;
  sort_order?: number;
}

export interface CreateApprovalRuleRequest {
  name: string;
  workflow_type?: string;
  node_order?: number;
  rule_type: string;
  position_level_id?: string;
  department_id?: string;
  specific_user_id?: string;
  min_approvers?: number;
  approval_mode?: string;
  condition_expression?: string;
}

export interface PaginationResponse<T> {
  data: T[];
  total: number;
  page: number;
  page_size: number;
}

export const organizationApi = {
  getPositionLevels: async (): Promise<PositionLevel[]> => {
    const response = await apiClient.get(`${API_BASE_URL}/position-levels`);
    return response.data.data || [];
  },

  createPositionLevel: async (data: CreatePositionLevelRequest): Promise<PositionLevel> => {
    const payload = { ...data, level: data.level_order };
    const response = await apiClient.post(`${API_BASE_URL}/position-levels`, payload);
    return response.data;
  },

  updatePositionLevel: async (id: string, data: Partial<CreatePositionLevelRequest>): Promise<PositionLevel> => {
    const payload = { ...data, level: data.level_order };
    const response = await apiClient.put(`${API_BASE_URL}/position-levels/${id}`, payload);
    return response.data;
  },

  deletePositionLevel: async (id: string): Promise<void> => {
    await apiClient.delete(`${API_BASE_URL}/position-levels/${id}`);
  },

  getPositions: async (): Promise<Position[]> => {
    const response = await apiClient.get(`${API_BASE_URL}/positions`);
    return response.data.data || [];
  },

  getPositionsByDepartment: async (departmentId: string): Promise<Position[]> => {
    const response = await apiClient.get(`${API_BASE_URL}/positions/department/${departmentId}`);
    return response.data.data || [];
  },

  createPosition: async (data: CreatePositionRequest): Promise<Position> => {
    const cleanData = {
      ...data,
      position_level_id: data.position_level_id || undefined,
      department_id: data.department_id || undefined,
    };
    const response = await apiClient.post(`${API_BASE_URL}/positions`, cleanData);
    return response.data;
  },

  updatePosition: async (id: string, data: Partial<CreatePositionRequest>): Promise<Position> => {
    const response = await apiClient.put(`${API_BASE_URL}/positions/${id}`, data);
    return response.data;
  },

  deletePosition: async (id: string): Promise<void> => {
    await apiClient.delete(`${API_BASE_URL}/positions/${id}`);
  },

  getApprovalRules: async (): Promise<ApprovalRule[]> => {
    const response = await apiClient.get(`${API_BASE_URL}/approval-rules`);
    return response.data.data || [];
  },

  createApprovalRule: async (data: CreateApprovalRuleRequest): Promise<ApprovalRule> => {
    const response = await apiClient.post(`${API_BASE_URL}/approval-rules`, data);
    return response.data;
  },

  updateApprovalRule: async (id: string, data: Partial<CreateApprovalRuleRequest>): Promise<ApprovalRule> => {
    const response = await apiClient.put(`${API_BASE_URL}/approval-rules/${id}`, data);
    return response.data;
  },

  deleteApprovalRule: async (id: string): Promise<void> => {
    await apiClient.delete(`${API_BASE_URL}/approval-rules/${id}`);
  },
};

export const POSITION_LEVEL_TEMPLATES = [
  { code: 'intern', name: '实习生', level_order: 1, description: '实习人员' },
  { code: 'junior', name: '初级', level_order: 2, description: '初级员工' },
  { code: 'intermediate', name: '中级', level_order: 3, description: '中级员工' },
  { code: 'senior', name: '高级', level_order: 4, description: '高级员工' },
  { code: 'supervisor', name: '主管', level_order: 5, description: '部门主管' },
  { code: 'manager', name: '经理', level_order: 6, description: '部门经理' },
  { code: 'director', name: '总监', level_order: 7, description: '部门总监' },
  { code: 'vp', name: '副总裁', level_order: 8, description: '公司副总裁' },
  { code: 'ceo', name: '总裁', level_order: 9, description: '公司总裁' },
];

export const RULE_TYPES = [
  { value: 'position_level', label: '职位级别审批' },
  { value: 'department', label: '部门主管审批' },
  { value: 'specific_user', label: '指定人员审批' },
  { value: 'any_approver', label: '任意一人审批' },
  { value: 'all_approvers', label: '所有人审批' },
];

export const APPROVAL_MODES = [
  { value: 'any', label: '任意一人即可' },
  { value: 'all', label: '所有人同意' },
  { value: 'majority', label: '超过半数同意' },
];

export const departmentApi = {
  getDepartments: async (page: number = 1, pageSize: number = 100): Promise<{ data: Department[], total: number }> => {
    const response = await apiClient.get(DEPARTMENT_API_BASE_URL, {
      params: { page, page_size: pageSize }
    });
    const result = response.data;
    // 后端返回格式: { success: true, data: [...], total: N }
    if (result.data && Array.isArray(result.data)) {
      return { data: result.data, total: result.total || 0 };
    }
    return { data: [], total: 0 };
  },

  getDepartment: async (id: string): Promise<Department> => {
    const response = await apiClient.get(`${DEPARTMENT_API_BASE_URL}/${id}`);
    return response.data;
  },

  getDepartmentChildren: async (id: string): Promise<Department[]> => {
    const response = await apiClient.get(`${DEPARTMENT_API_BASE_URL}/${id}/children`);
    const result = response.data;
    return Array.isArray(result) ? result : (result.data || []);
  },

  createDepartment: async (data: CreateDepartmentRequest): Promise<Department> => {
    const response = await apiClient.post(DEPARTMENT_API_BASE_URL, data);
    return response.data;
  },

  updateDepartment: async (id: string, data: UpdateDepartmentRequest): Promise<Department> => {
    const response = await apiClient.put(`${DEPARTMENT_API_BASE_URL}/${id}`, data);
    return response.data;
  },

  updateDepartmentStatus: async (id: string, isActive: boolean): Promise<Department> => {
    const response = await apiClient.patch(`${DEPARTMENT_API_BASE_URL}/${id}/status`, { is_active: isActive });
    return response.data;
  },

  deleteDepartment: async (id: string): Promise<void> => {
    await apiClient.delete(`${DEPARTMENT_API_BASE_URL}/${id}`);
  },
};

export const DEPARTMENT_TEMPLATES = [
  { name: '总经理办公室', code: 'gm_office', sort_order: 1, description: '公司最高决策和管理机构' },
  { name: '行政部', code: 'admin', sort_order: 2, description: '后勤保障、行政管理、接待事务、档案管理' },
  { name: '人力资源部', code: 'hr', sort_order: 3, description: '人员招聘、培训、薪资福利、绩效考核' },
  { name: '财务部', code: 'finance', sort_order: 4, description: '财务核算、预算管理、成本控制、税务管理' },
  { name: '生产部', code: 'production', sort_order: 5, description: '生产计划、车间管理、生产调度' },
  { name: '质量部', code: 'quality', sort_order: 6, description: '质量检验、质量体系、质量改进' },
  { name: '技术部', code: 'tech', sort_order: 7, description: '工艺设计、技术研发、设备管理' },
  { name: '采购部', code: 'purchasing', sort_order: 8, description: '原材料采购、供应商管理' },
  { name: '仓储物流部', code: 'warehouse_logistics', sort_order: 9, description: '仓储管理、成品发运、物流协调' },
  { name: '安全环保部', code: 'safety_env', sort_order: 10, description: '安全生产、环境保护、职业健康' },
  { name: '销售部', code: 'sales', sort_order: 11, description: '市场推广、客户销售、订单管理' },
];

export const APPROVAL_RULE_TEMPLATES = [
  {
    name: '请假审批',
    code: 'leave_approval',
    workflow_type: 'leave',
    rule_type: 'department',
    approval_mode: 'any',
    min_approvers: 1,
    description: '员工请假需要部门主管审批',
    condition_expression: 'days <= 3'
  },
  {
    name: '长期请假审批',
    code: 'long_leave_approval',
    workflow_type: 'leave',
    rule_type: 'position_level',
    approval_mode: 'all',
    min_approvers: 2,
    description: '超过3天的请假需要部门主管和HR审批',
    condition_expression: 'days > 3'
  },
  {
    name: '报销审批',
    code: 'expense_approval',
    workflow_type: 'expense',
    rule_type: 'any_approver',
    approval_mode: 'any',
    min_approvers: 1,
    description: '费用报销审批流程',
    condition_expression: 'amount <= 1000'
  },
  {
    name: '大额报销审批',
    code: 'large_expense_approval',
    workflow_type: 'expense',
    rule_type: 'specific_user',
    approval_mode: 'all',
    min_approvers: 2,
    description: '超过1000元的报销需要财务主管和部门经理审批',
    condition_expression: 'amount > 1000'
  },
  {
    name: '采购审批',
    code: 'purchase_approval',
    workflow_type: 'purchase',
    rule_type: 'department',
    approval_mode: 'any',
    min_approvers: 1,
    description: '物料采购审批流程'
  },
  {
    name: '合同审批',
    code: 'contract_approval',
    workflow_type: 'contract',
    rule_type: 'position_level',
    approval_mode: 'all',
    min_approvers: 3,
    description: '合同签署需要法务、部门经理和总经理审批'
  }
];

export const POSITION_TEMPLATES = [
  {
    title: '董事长',
    code: 'chairman',
    description: '公司最高决策者，负责制定公司战略方向、重大决策和董事会管理',
    is_leader: true
  },
  {
    title: 'CEO/总经理',
    code: 'ceo',
    description: '负责公司日常运营管理，执行董事会决议，带领团队实现公司目标',
    is_leader: true
  },
  {
    title: '副总经理',
    code: 'vice_president',
    description: '协助总经理管理公司，分管特定业务领域，推动业务发展',
    is_leader: true
  },
  {
    title: '财务总监',
    code: 'cfo',
    description: '负责公司财务管理、资金运作、财务报表和风险控制',
    is_leader: true
  },
  {
    title: '技术总监',
    code: 'cto',
    description: '负责公司技术战略、研发管理和技术创新工作',
    is_leader: true
  },
  {
    title: '人力资源总监',
    code: 'hr_director',
    description: '负责人力资源战略、人才发展、组织建设和企业文化',
    is_leader: true
  },
  {
    title: '生产主管',
    code: 'production_supervisor',
    description: '负责车间生产计划、调度和人员管理，确保生产任务按时完成',
    is_leader: true
  },
  {
    title: '质量检验员',
    code: 'quality_inspector',
    description: '负责产品质量检验，包括原材料、半成品和成品的质量把关',
    is_leader: false
  },
  {
    title: '车间操作工',
    code: 'shop_floor_operator',
    description: '负责生产设备的操作和日常维护，完成生产任务',
    is_leader: false
  },
  {
    title: '设备维修工',
    code: 'equipment_maintenance',
    description: '负责生产设备的维修、保养和故障排查工作',
    is_leader: false
  },
  {
    title: '仓库管理员',
    code: 'warehouse_supervisor',
    description: '负责原材料、半成品和成品的仓储管理，包括入库、出库和库存盘点',
    is_leader: false
  },
  {
    title: '采购专员',
    code: 'purchasing_specialist',
    description: '负责生产原材料、设备和备件的采购工作，确保供应链稳定',
    is_leader: false
  },
  {
    title: '安全管理员',
    code: 'safety_officer',
    description: '负责生产现场安全管理、员工安全教育和事故预防工作',
    is_leader: false
  },
  {
    title: '工艺工程师',
    code: 'process_engineer',
    description: '负责生产工艺优化、流程改进和工艺标准制定',
    is_leader: false
  },
  {
    title: '生产经理',
    code: 'production_manager',
    description: '负责全面生产管理，包括生产计划、质量控制和成本优化',
    is_leader: true
  },
  {
    title: '物流专员',
    code: 'logistics_specialist',
    description: '负责产品发货、物流安排和运输协调工作',
    is_leader: false
  }
];
