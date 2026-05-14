import apiClient from '../api/client';

export interface MaterialItem {
  id: string;
  name: string;
  material_type: string;
  category: string | null;
  content: string | null;
  url: string | null;
  file_path: string | null;
  file_size: number | null;
  file_type: string | null;
  description: string | null;
  tags: string[] | null;
  source_url: string | null;
  ai_summary: string | null;
  is_favorite: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface MaterialListResponse {
  items: MaterialItem[];
  total: number;
  page: number;
  page_size: number;
}

export interface CreateMaterialRequest {
  name: string;
  material_type: string;
  category?: string;
  content?: string;
  url?: string;
  description?: string;
  tags?: string[];
}

export interface UpdateMaterialRequest {
  name?: string;
  category?: string;
  description?: string;
  tags?: string[];
  is_favorite?: boolean;
}

export interface CrawlRequest {
  url: string;
}

export interface CrawlResult {
  url: string;
  title: string;
  content: string;
  images: string[];
  summary: string | null;
  status: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: string | null;
}

export const materialService = {
  async list(params: {
    material_type?: string;
    category?: string;
    keyword?: string;
    page?: number;
    page_size?: number;
  }): Promise<MaterialListResponse> {
    const response = await apiClient.get('/v1/materials', { params });
    return response.data.data;
  },

  async get(id: string): Promise<MaterialItem> {
    const response = await apiClient.get(`/v1/materials/${id}`);
    return response.data.data;
  },

  async create(data: CreateMaterialRequest): Promise<MaterialItem> {
    const response = await apiClient.post('/v1/materials', data);
    return response.data.data;
  },

  async update(id: string, data: UpdateMaterialRequest): Promise<MaterialItem> {
    const response = await apiClient.put(`/v1/materials/${id}`, data);
    return response.data.data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/v1/materials/${id}`);
  },

  async crawl(url: string): Promise<CrawlResult> {
    const response = await apiClient.post('/v1/materials/crawl', { url });
    return response.data.data;
  },
};
