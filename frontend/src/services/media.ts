import apiClient from '@/api/client';
import { API_BASE_URL } from './workflow';

const MEDIA_API_BASE = `${API_BASE_URL}/media`;

export interface MediaFile {
  id: string;
  name: string;
  file_url: string;
  file_size: number;
  created_at: string;
}

export interface UploadResponse {
  success: boolean;
  file_url?: string;
  message?: string;
}

export const mediaApi = {
  uploadImage: async (file: File): Promise<UploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await apiClient.post(`${MEDIA_API_BASE}/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    // 后端返回的数据格式是 { success: boolean, data: { success: boolean, file_url: string, message: string } }
    return response.data?.data || response.data;
  },

  getMediaList: async (): Promise<MediaFile[]> => {
    const response = await apiClient.get(MEDIA_API_BASE);
    return response.data?.data || [];
  },
};

export default mediaApi;
