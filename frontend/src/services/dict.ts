import apiClient from '@/api/client';

export interface DictType {
  id: string;
  code: string;
  name: string;
  description?: string;
  category: string;
  parent_id?: string;
  sort_order: number;
  is_system: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DictItem {
  id: string;
  dict_type_id: string;
  code: string;
  name: string;
  value?: string;
  sort_order: number;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DictTypeWithItems {
  dict_type: DictType;
  items: DictItem[];
}

export interface CreateDictType {
  code: string;
  name: string;
  description?: string;
  category: string;
  parent_id?: string;
  sort_order?: number;
  is_system?: boolean;
}

export interface UpdateDictType {
  name?: string;
  description?: string;
  sort_order?: number;
  is_active?: boolean;
}

export interface CreateDictItem {
  dict_type_id: string;
  code: string;
  name: string;
  value?: string;
  sort_order?: number;
  is_default?: boolean;
}

export interface UpdateDictItem {
  name?: string;
  value?: string;
  sort_order?: number;
  is_default?: boolean;
  is_active?: boolean;
}

const API_BASE_URL = '/v1';

export const dictService = {
  async getDictTypes(category?: string, isActive?: boolean): Promise<DictType[]> {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (isActive !== undefined) params.append('is_active', String(isActive));
    const response = await apiClient.get(`${API_BASE_URL}/dicts/categories?${params.toString()}`);
    const result = response.data;
    if (result && result.success && result.data) {
      return result.data;
    }
    return [];
  },

  async getDictType(id: string): Promise<DictType> {
    const response = await apiClient.get(`${API_BASE_URL}/dicts/types/${id}`);
    const result = response.data;
    if (result && result.success && result.data) {
      return result.data;
    }
    throw new Error('获取字典类型失败');
  },

  async getDictTypeWithItems(id: string): Promise<DictTypeWithItems> {
    const response = await apiClient.get(`${API_BASE_URL}/dicts/categories/${id}/with-items`);
    const result = response.data;
    if (result && result.success && result.data) {
      return result.data;
    }
    throw new Error('获取字典类型及项失败');
  },

  async createDictType(data: CreateDictType): Promise<DictType> {
    const response = await apiClient.post(`${API_BASE_URL}/dicts/categories`, data);
    const result = response.data;
    if (result && result.success && result.data) {
      return result.data;
    }
    throw new Error('创建字典类型失败');
  },

  async updateDictType(id: string, data: UpdateDictType): Promise<DictType> {
    const response = await apiClient.put(`${API_BASE_URL}/dicts/categories/${id}`, data);
    const result = response.data;
    if (result && result.success && result.data) {
      return result.data;
    }
    throw new Error('更新字典类型失败');
  },

  async deleteDictType(id: string): Promise<void> {
    await apiClient.delete(`${API_BASE_URL}/dicts/categories/${id}`);
  },

  async getDictItems(dictTypeId: string): Promise<DictItem[]> {
    const response = await apiClient.get(`${API_BASE_URL}/dicts/items?dict_type_id=${dictTypeId}`);
    const result = response.data;
    if (result && result.success && result.data) {
      return result.data;
    }
    return [];
  },

  async getDictItemsByCode(code: string): Promise<DictItem[]> {
    const response = await apiClient.get(`${API_BASE_URL}/dicts/categories/code/${code}/items`);
    const result = response.data;
    if (result && result.success && result.data) {
      return result.data;
    }
    return [];
  },

  async createDictItem(data: CreateDictItem): Promise<DictItem> {
    const response = await apiClient.post(`${API_BASE_URL}/dicts/items`, data);
    const result = response.data;
    if (result && result.success && result.data) {
      return result.data;
    }
    throw new Error('创建字典项失败');
  },

  async updateDictItem(id: string, data: UpdateDictItem): Promise<DictItem> {
    const response = await apiClient.put(`${API_BASE_URL}/dicts/items/${id}`, data);
    const result = response.data;
    if (result && result.success && result.data) {
      return result.data;
    }
    throw new Error('更新字典项失败');
  },

  async deleteDictItem(id: string): Promise<void> {
    await apiClient.delete(`${API_BASE_URL}/dicts/items/${id}`);
  },

  async getAllDicts(): Promise<DictTypeWithItems[]> {
    const response = await apiClient.get(`${API_BASE_URL}/dicts/all`);
    const result = response.data;
    if (result && result.success && result.data) {
      return result.data;
    }
    return [];
  },

  async initDefaultDicts(): Promise<void> {
    await apiClient.post(`${API_BASE_URL}/dicts/init-defaults`);
  },

  async getItemsByCategory(code: string): Promise<DictItem[]> {
    const response = await apiClient.get(`${API_BASE_URL}/dicts/categories/code/${code}/items`);
    const result = response.data;
    if (result && result.success && result.data) {
      return result.data;
    }
    return [];
  },
};

export const dictApi = dictService;