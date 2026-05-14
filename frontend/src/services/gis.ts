import apiClient from '@/api/client';

export interface GisCustomer {
  id: string;
  name: string;
  longitude: number;
  latitude: number;
  customer_type?: string;
  contact_person?: string;
  contact_phone?: string;
  address?: string;
  level?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface CreateGisCustomerRequest {
  name: string;
  longitude: number;
  latitude: number;
  customer_type?: string;
  contact_person?: string;
  contact_phone?: string;
  address?: string;
  level?: string;
}

export interface UpdateGisCustomerRequest {
  name?: string;
  longitude?: number;
  latitude?: number;
  customer_type?: string;
  contact_person?: string;
  contact_phone?: string;
  address?: string;
  level?: string;
  status?: string;
}

export interface GisProject {
  id: string;
  name: string;
  longitude: number;
  latitude: number;
  project_type?: string;
  status: string;
  customer_id?: string;
  start_date?: string;
  end_date?: string;
  budget?: number;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateGisProjectRequest {
  name: string;
  longitude: number;
  latitude: number;
  project_type?: string;
  customer_id?: string;
  start_date?: string;
  end_date?: string;
  budget?: number;
  description?: string;
}

export interface UpdateGisProjectRequest {
  name?: string;
  longitude?: number;
  latitude?: number;
  project_type?: string;
  status?: string;
  customer_id?: string;
  start_date?: string;
  end_date?: string;
  budget?: number;
  description?: string;
}

export interface GisWarehouse {
  id: string;
  name: string;
  longitude: number;
  latitude: number;
  warehouse_type?: string;
  capacity?: string;
  address?: string;
  manager_name?: string;
  manager_phone?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface CreateGisWarehouseRequest {
  name: string;
  longitude: number;
  latitude: number;
  warehouse_type?: string;
  capacity?: string;
  address?: string;
  manager_name?: string;
  manager_phone?: string;
}

export interface UpdateGisWarehouseRequest {
  name?: string;
  longitude?: number;
  latitude?: number;
  warehouse_type?: string;
  capacity?: string;
  address?: string;
  manager_name?: string;
  manager_phone?: string;
  status?: string;
}

export interface GisPersonnel {
  id: string;
  name: string;
  longitude: number;
  latitude: number;
  personnel_type: string;
  position?: string;
  department?: string;
  phone?: string;
  status: string;
  last_location_time?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateGisPersonnelRequest {
  name: string;
  longitude: number;
  latitude: number;
  personnel_type: string;
  position?: string;
  department?: string;
  phone?: string;
}

export interface UpdateGisPersonnelRequest {
  name?: string;
  longitude?: number;
  latitude?: number;
  personnel_type?: string;
  position?: string;
  department?: string;
  phone?: string;
  status?: string;
  last_location_time?: string;
}

export interface UpdateLocationRequest {
  longitude: number;
  latitude: number;
}

export const gisApi = {
  async getCustomers(status?: string, markerType?: string): Promise<GisCustomer[]> {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (markerType) params.append('marker_type', markerType);
    const response = await apiClient.get(`/v1/gis/customers?${params.toString()}`);
    return response.data?.data || response.data || [];
  },

  async getCustomer(id: string): Promise<GisCustomer> {
    const response = await apiClient.get(`/v1/gis/customers/${id}`);
    return response.data?.data || response.data;
  },

  async createCustomer(data: CreateGisCustomerRequest): Promise<GisCustomer> {
    const response = await apiClient.post('/v1/gis/customers', data);
    return response.data?.data || response.data;
  },

  async updateCustomer(id: string, data: UpdateGisCustomerRequest): Promise<GisCustomer> {
    const response = await apiClient.put(`/v1/gis/customers/${id}`, data);
    return response.data?.data || response.data;
  },

  async deleteCustomer(id: string): Promise<void> {
    await apiClient.delete(`/v1/gis/customers/${id}`);
  },

  async getProjects(status?: string, markerType?: string): Promise<GisProject[]> {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (markerType) params.append('marker_type', markerType);
    const response = await apiClient.get(`/v1/gis/projects?${params.toString()}`);
    return response.data?.data || response.data || [];
  },

  async getProject(id: string): Promise<GisProject> {
    const response = await apiClient.get(`/v1/gis/projects/${id}`);
    return response.data?.data || response.data;
  },

  async createProject(data: CreateGisProjectRequest): Promise<GisProject> {
    const response = await apiClient.post('/v1/gis/projects', data);
    return response.data?.data || response.data;
  },

  async updateProject(id: string, data: UpdateGisProjectRequest): Promise<GisProject> {
    const response = await apiClient.put(`/v1/gis/projects/${id}`, data);
    return response.data?.data || response.data;
  },

  async deleteProject(id: string): Promise<void> {
    await apiClient.delete(`/v1/gis/projects/${id}`);
  },

  async getWarehouses(status?: string, markerType?: string): Promise<GisWarehouse[]> {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (markerType) params.append('marker_type', markerType);
    const response = await apiClient.get(`/v1/gis/warehouses?${params.toString()}`);
    return response.data?.data || response.data || [];
  },

  async getWarehouse(id: string): Promise<GisWarehouse> {
    const response = await apiClient.get(`/v1/gis/warehouses/${id}`);
    return response.data?.data || response.data;
  },

  async createWarehouse(data: CreateGisWarehouseRequest): Promise<GisWarehouse> {
    const response = await apiClient.post('/v1/gis/warehouses', data);
    return response.data?.data || response.data;
  },

  async updateWarehouse(id: string, data: UpdateGisWarehouseRequest): Promise<GisWarehouse> {
    const response = await apiClient.put(`/v1/gis/warehouses/${id}`, data);
    return response.data?.data || response.data;
  },

  async deleteWarehouse(id: string): Promise<void> {
    await apiClient.delete(`/v1/gis/warehouses/${id}`);
  },

  async getPersonnel(status?: string, markerType?: string): Promise<GisPersonnel[]> {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (markerType) params.append('marker_type', markerType);
    const response = await apiClient.get(`/v1/gis/personnel?${params.toString()}`);
    return response.data?.data || response.data || [];
  },

  async getPersonnelById(id: string): Promise<GisPersonnel> {
    const response = await apiClient.get(`/v1/gis/personnel/${id}`);
    return response.data?.data || response.data;
  },

  async createPersonnel(data: CreateGisPersonnelRequest): Promise<GisPersonnel> {
    const response = await apiClient.post('/v1/gis/personnel', data);
    return response.data?.data || response.data;
  },

  async updatePersonnel(id: string, data: UpdateGisPersonnelRequest): Promise<GisPersonnel> {
    const response = await apiClient.put(`/v1/gis/personnel/${id}`, data);
    return response.data?.data || response.data;
  },

  async deletePersonnel(id: string): Promise<void> {
    await apiClient.delete(`/v1/gis/personnel/${id}`);
  },

  async updatePersonnelLocation(id: string, data: UpdateLocationRequest): Promise<GisPersonnel> {
    const response = await apiClient.put(`/v1/gis/personnel/${id}/location`, data);
    return response.data?.data || response.data;
  },
};
