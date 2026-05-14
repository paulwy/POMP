import apiClient from '@/api/client';

export interface LocationInfo {
  latitude: number;
  longitude: number;
  location_name?: string;
  address?: string;
}

export interface FieldRecord {
  id: string;
  user_id: string;
  task_title: string;
  task_description?: string;
  latitude: number;
  longitude: number;
  location_name?: string;
  address?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface PhotoEvidence {
  id: string;
  field_record_id: string;
  file_name: string;
  file_path: string;
  file_size?: number;
  content_type?: string;
  description?: string;
  latitude?: number;
  longitude?: number;
  created_at: string;
}

export interface AudioEvidence {
  id: string;
  field_record_id: string;
  file_name: string;
  file_path: string;
  file_size?: number;
  duration?: number;
  content_type?: string;
  description?: string;
  latitude?: number;
  longitude?: number;
  created_at: string;
}

export interface CreateRecordRequest {
  task_title: string;
  task_description?: string;
  latitude: number;
  longitude: number;
  location_name?: string;
  address?: string;
}

export interface UpdateRecordRequest {
  task_title?: string;
  task_description?: string;
  status?: string;
}

export interface UploadEvidenceRequest {
  description?: string;
  latitude?: number;
  longitude?: number;
}

const API_BASE_URL = '/v1/field';

export const fieldService = {
  async createRecord(request: CreateRecordRequest): Promise<FieldRecord> {
    const response = await apiClient.post(`${API_BASE_URL}/records`, request);
    return response.data?.data || response.data;
  },

  async getRecord(id: string): Promise<FieldRecord> {
    const response = await apiClient.get(`${API_BASE_URL}/records/${id}`);
    return response.data?.data || response.data;
  },

  async getUserRecords(): Promise<FieldRecord[]> {
    const response = await apiClient.get(`${API_BASE_URL}/records`);
    const data = response.data?.data || response.data;
    return Array.isArray(data) ? data : [];
  },

  async getAllRecords(): Promise<FieldRecord[]> {
    const response = await apiClient.get(`${API_BASE_URL}/records/all`);
    const data = response.data?.data || response.data;
    return Array.isArray(data) ? data : [];
  },

  async updateRecord(id: string, request: UpdateRecordRequest): Promise<FieldRecord> {
    const response = await apiClient.put(`${API_BASE_URL}/records/${id}`, request);
    return response.data?.data || response.data;
  },

  async deleteRecord(id: string): Promise<void> {
    await apiClient.delete(`${API_BASE_URL}/records/${id}`);
  },

  async uploadPhoto(
    recordId: string,
    file: File,
    description?: string,
    latitude?: number,
    longitude?: number
  ): Promise<void> {
    const formData = new FormData();
    formData.append('file', file);
    if (description) formData.append('description', description);
    if (latitude !== undefined) formData.append('latitude', latitude.toString());
    if (longitude !== undefined) formData.append('longitude', longitude.toString());

    await apiClient.post(`${API_BASE_URL}/records/${recordId}/photos`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  async getPhotos(recordId: string): Promise<PhotoEvidence[]> {
    const response = await apiClient.get(`${API_BASE_URL}/records/${recordId}/photos`);
    const data = response.data?.data || response.data;
    return Array.isArray(data) ? data : [];
  },

  async deletePhoto(recordId: string, photoId: string): Promise<void> {
    await apiClient.delete(`${API_BASE_URL}/records/${recordId}/photos/${photoId}`);
  },

  async uploadAudio(
    recordId: string,
    file: File,
    duration?: number,
    description?: string,
    latitude?: number,
    longitude?: number
  ): Promise<void> {
    const formData = new FormData();
    formData.append('file', file);
    if (duration !== undefined) formData.append('duration', duration.toString());
    if (description) formData.append('description', description);
    if (latitude !== undefined) formData.append('latitude', latitude.toString());
    if (longitude !== undefined) formData.append('longitude', longitude.toString());

    await apiClient.post(`${API_BASE_URL}/records/${recordId}/audios`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  async deleteAudio(recordId: string, audioId: string): Promise<void> {
    await apiClient.delete(`${API_BASE_URL}/records/${recordId}/audio/${audioId}`);
  },

  async getCurrentLocation(): Promise<LocationInfo> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('您的浏览器不支持地理定位'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          reject(new Error(`获取位置失败: ${error.message}`));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    });
  },
};
