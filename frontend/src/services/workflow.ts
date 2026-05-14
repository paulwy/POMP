import apiClient from '@/api/client';

export const API_BASE_URL = '/v1';

export interface ApprovalTask {
    task_id: string;
    workflow_instance_id: string;
    workflow_name: string;
    workflow_code?: string;
    node_id: string;
    node_name: string;
    applicant_id: string;
    applicant_name: string;
    applicant_department: string;
    applicant_email?: string;
    business_type: string;
    business_id: string;
    business_title: string;
    status: string;
    priority: string;
    created_at: string;
    deadline_at?: string;
    is_overdue: boolean;
    remaining_hours?: number;
    current_step?: number;
    max_steps?: number;
    current_approver_id?: string;
    current_approver_name?: string;
}

export interface ApprovalRecord {
    id: string;
    task_id: string;
    step_number: number;
    step_name?: string;
    approver_id: string;
    approver_name: string;
    action: string;
    comment?: string;
    created_at: string;
}

export interface WorkflowStep {
    id: string;
    workflow_id: string;
    step_number: number;
    name: string;
    approver_type: string;
    approver_id?: string;
    approver_name?: string;
    role_code?: string;
    timeout_days?: number;
}

export interface ApproveRequest {
    user_id: string;
    approved: boolean;
    comment?: string;
}

export interface Workflow {
    id: string;
    name: string;
    workflow_name?: string;
    code?: string;
    description?: string;
    is_active: boolean;
    is_system?: boolean;
    created_at: string;
    updated_at: string;
}

export interface WorkflowNode {
    id: string;
    workflow_id: string;
    name: string;
    node_type: string;
    node_order: number;
    approver_role?: string;
    approver_user?: string;
    is_multiple?: boolean;
    min_approve?: number;
    timeout_days?: number;
    created_at: string;
    updated_at: string;
}

export interface CreateWorkflowRequest {
    name: string;
    description?: string;
}

export interface UpdateWorkflowRequest {
    name: string;
    description?: string;
    is_active: boolean;
}

export interface CreateWorkflowNodeRequest {
    workflow_id: string;
    name: string;
    node_type: string;
    node_order: number;
    approver_role?: string;
    approver_user?: string;
    is_multiple?: boolean;
    min_approve?: number;
    timeout_days?: number;
}

export interface UpdateWorkflowNodeRequest {
    name: string;
    node_type: string;
    node_order: number;
    approver_role?: string;
    approver_user?: string;
    is_multiple?: boolean;
    min_approve?: number;
    timeout_days?: number;
}

export interface User {
    id: string;
    username: string;
    name?: string;
    email: string;
}

export interface CreateApprovalTaskRequest {
    workflow_code: string;
    title: string;
    description?: string;
    data?: Record<string, unknown>;
    creator_id: string;
    creator_name: string;
}

export const workflowApi = {
    getMyTasks: async (userId: string): Promise<ApprovalTask[]> => {
        const response = await apiClient.get(`${API_BASE_URL}/workflow/tasks/my`, {
            params: { user_id: userId }
        });
        return response.data?.success ? (response.data?.data || []) : (response.data?.data || []);
    },

    getMyInitiatedTasks: async (userId: string): Promise<ApprovalTask[]> => {
        const response = await apiClient.get(`${API_BASE_URL}/workflow/tasks/initiated`, {
            params: { user_id: userId }
        });
        return response.data?.success ? (response.data?.data || []) : (response.data?.data || []);
    },

    getTaskDetail: async (taskId: string): Promise<ApprovalTask> => {
        const response = await apiClient.get(`${API_BASE_URL}/workflow/tasks/${taskId}`);
        return response.data?.success ? response.data?.data : response.data;
    },

    approveTask: async (taskId: string, data: ApproveRequest): Promise<void> => {
        await apiClient.post(`${API_BASE_URL}/workflow/tasks/${taskId}/approve`, data);
    },

    createApprovalTask: async (data: CreateApprovalTaskRequest): Promise<ApprovalTask> => {
        const response = await apiClient.post(`${API_BASE_URL}/workflow/tasks`, data);
        return response.data?.success ? response.data?.data : response.data;
    },

    getWorkflows: async (): Promise<{ data: Workflow[]; total: number }> => {
        const response = await apiClient.get(`${API_BASE_URL}/workflows`);
        const data = response.data?.success ? response.data?.data : response.data;
        return { data: Array.isArray(data) ? data : [], total: Array.isArray(data) ? data.length : 0 };
    },

    getWorkflow: async (id: string): Promise<Workflow> => {
        const response = await apiClient.get(`${API_BASE_URL}/workflows/${id}`);
        return response.data;
    },

    getWorkflowNodes: async (workflowId: string): Promise<WorkflowNode[]> => {
        const response = await apiClient.get(`${API_BASE_URL}/workflows/${workflowId}/nodes`);
        const data = response.data?.success ? response.data?.data : response.data;
        return Array.isArray(data) ? data : [];
    },

    createWorkflow: async (data: CreateWorkflowRequest): Promise<Workflow> => {
        const response = await apiClient.post(`${API_BASE_URL}/workflows`, data);
        return response.data?.success ? response.data?.data : response.data;
    },

    updateWorkflow: async (id: string, data: UpdateWorkflowRequest): Promise<Workflow> => {
        const response = await apiClient.put(`${API_BASE_URL}/workflows/${id}`, data);
        return response.data?.success ? response.data?.data : response.data;
    },

    deleteWorkflow: async (id: string): Promise<void> => {
        await apiClient.delete(`${API_BASE_URL}/workflows/${id}`);
    },

    createWorkflowNode: async (data: CreateWorkflowNodeRequest): Promise<WorkflowNode> => {
        const response = await apiClient.post(`${API_BASE_URL}/workflows/nodes`, data);
        return response.data?.success ? response.data?.data : response.data;
    },

    updateWorkflowNode: async (id: string, data: UpdateWorkflowNodeRequest): Promise<WorkflowNode> => {
        const response = await apiClient.put(`${API_BASE_URL}/workflows/nodes/${id}`, data);
        return response.data?.success ? response.data?.data : response.data;
    },

    deleteWorkflowNode: async (id: string): Promise<void> => {
        await apiClient.delete(`${API_BASE_URL}/workflows/nodes/${id}`);
    },

    initDefaultWorkflows: async (): Promise<void> => {
        await apiClient.post(`${API_BASE_URL}/workflows/init-defaults`);
    },

    getAllUsers: async (): Promise<User[]> => {
        const response = await apiClient.get(`${API_BASE_URL}/users/all`);
        const data = response.data?.success ? response.data?.data : response.data;
        return Array.isArray(data) ? data : [];
    },

    getApprovalHistory: async (userId: string): Promise<ApprovalTask[]> => {
        const response = await apiClient.get(`${API_BASE_URL}/workflow/history`, {
            params: { user_id: userId }
        });
        let result;
        if (response.data?.success && response.data.data) {
            result = response.data.data;
        } else if (response.data?.data) {
            result = response.data.data;
        } else {
            result = response.data;
        }
        return Array.isArray(result) ? result : [];
    },

    getMyInitiatedHistory: async (userId: string): Promise<ApprovalTask[]> => {
        const response = await apiClient.get(`${API_BASE_URL}/workflow/history/my-initiated`, {
            params: { user_id: userId }
        });
        let result;
        if (response.data?.success && response.data.data) {
            result = response.data.data;
        } else if (response.data?.data) {
            result = response.data.data;
        } else {
            result = response.data;
        }
        return Array.isArray(result) ? result : [];
    },

    getWorkflowSteps: async (workflowId: string): Promise<WorkflowStep[]> => {
        const response = await apiClient.get(`${API_BASE_URL}/workflows/${workflowId}/nodes`);
        const data = response.data?.success ? response.data?.data : response.data;
        return Array.isArray(data) ? data : [];
    },

    getApprovalRecords: async (taskId: string): Promise<ApprovalRecord[]> => {
        const response = await apiClient.get(`${API_BASE_URL}/workflow/tasks/${taskId}/records`);
        const data = response.data?.success ? response.data?.data : response.data;
        return Array.isArray(data) ? data : [];
    },
};
