import apiClient from '@/api/client';

export interface ContractTemplate {
  id: string;
  code: string;
  name: string;
  description?: string;
  contract_type: string;
  category: string;
  content: string;
  variables?: string;
  version: string;
  is_active: boolean;
  is_system: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface CreateContractTemplate {
  code: string;
  name: string;
  description?: string;
  contract_type: string;
  category: string;
  content: string;
  variables?: string;
  version?: string;
  is_active?: boolean;
  is_system?: boolean;
  sort_order?: number;
}

export interface UpdateContractTemplate {
  name?: string;
  description?: string;
  contract_type?: string;
  category?: string;
  content?: string;
  variables?: string;
  version?: string;
  is_active?: boolean;
  sort_order?: number;
}

export interface Contract {
  id: string;
  code: string;
  name: string;
  description?: string;
  contract_type: string;
  category: string;
  content?: string;
  content_rendered?: string;
  status: string;
  first_party: string;
  second_party: string;
  amount?: number;
  currency: string;
  start_date?: string;
  end_date?: string;
  sign_date?: string;
  project_id?: string;
  created_by?: string;
  risk_level?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateContract {
  code?: string;
  name: string;
  description?: string;
  contract_type: string;
  category: string;
  content?: string;
  template_id?: string;
  content_rendered?: string;
  first_party: string;
  second_party: string;
  amount?: number;
  currency?: string;
  start_date?: string;
  end_date?: string;
  sign_date?: string;
  project_id?: string;
  created_by?: string;
  risk_level?: string;
  status?: string;
}

export interface UpdateContract {
  name?: string;
  description?: string;
  contract_type?: string;
  category?: string;
  content?: string;
  content_rendered?: string;
  first_party?: string;
  second_party?: string;
  amount?: number;
  currency?: string;
  start_date?: string;
  end_date?: string;
  sign_date?: string;
  project_id?: string;
  status?: string;
  risk_level?: string;
}

const API_BASE_URL = '/v1';

export const contractService = {
  async getContractTemplates(contractType?: string, category?: string, isActive?: boolean): Promise<ContractTemplate[]> {
    const params = new URLSearchParams();
    if (contractType) params.append('contract_type', contractType);
    if (category) params.append('category', category);
    if (isActive !== undefined) params.append('is_active', String(isActive));
    const response = await apiClient.get(`${API_BASE_URL}/contracts/templates?${params.toString()}`);
    return response.data?.data || response.data || [];
  },

  async getContractTemplate(id: string): Promise<ContractTemplate> {
    const response = await apiClient.get(`${API_BASE_URL}/contracts/templates/${id}`);
    return response.data?.data || response.data;
  },

  async createContractTemplate(data: CreateContractTemplate): Promise<ContractTemplate> {
    const response = await apiClient.post(`${API_BASE_URL}/contracts/templates`, data);
    return response.data?.data || response.data;
  },

  async updateContractTemplate(id: string, data: UpdateContractTemplate): Promise<ContractTemplate> {
    const response = await apiClient.patch(`${API_BASE_URL}/contracts/templates/${id}`, data);
    return response.data?.data || response.data;
  },

  async deleteContractTemplate(id: string): Promise<void> {
    await apiClient.delete(`${API_BASE_URL}/contracts/templates/${id}`);
  },

  async getContracts(status?: string, contractType?: string, category?: string, page?: number, pageSize?: number): Promise<Contract[]> {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (contractType) params.append('contract_type', contractType);
    if (category) params.append('category', category);
    if (page !== undefined) params.append('page', String(page));
    if (pageSize !== undefined) params.append('page_size', String(pageSize));
    const response = await apiClient.get(`${API_BASE_URL}/contracts?${params.toString()}`);
    return response.data?.data || response.data || [];
  },

  async getContract(id: string): Promise<Contract> {
    const response = await apiClient.get(`${API_BASE_URL}/contracts/${id}`);
    return response.data?.data || response.data;
  },

  async createContract(data: CreateContract): Promise<Contract> {
    const response = await apiClient.post(`${API_BASE_URL}/contracts`, data);
    return response.data?.data || response.data;
  },

  async updateContract(id: string, data: UpdateContract): Promise<Contract> {
    const response = await apiClient.patch(`${API_BASE_URL}/contracts/${id}`, data);
    return response.data?.data || response.data;
  },

  async deleteContract(id: string): Promise<void> {
    await apiClient.delete(`${API_BASE_URL}/contracts/${id}`);
  },
};

export const contractApi = contractService;
