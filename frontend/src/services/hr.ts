import apiClient from '@/api/client';

const API_BASE_URL = '/v1/hr';

export interface Employee {
  id: string;
  user_id: string;
  name: string;
  email: string;
  username?: string;
  phone?: string;
  position_id?: string;
  position_name?: string;
  department_id?: string;
  department_name?: string;
  employee_no: string;
  hire_date?: string;
  sort_order?: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Position {
  id: string;
  name: string;
  code?: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface AttendanceRecord {
  id: string;
  employee_id: string;
  attendance_date: string;
  check_in?: string;
  check_out?: string;
  check_in_location?: string;
  check_out_location?: string;
  status?: string;
  work_hours?: number;
  overtime_hours?: number;
  late_minutes?: number;
  early_leave_minutes?: number;
  created_at: string;
  updated_at: string;
}

export interface LeaveRequest {
  id: string;
  employee_id: string;
  employee_name?: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  total_days: number;
  reason?: string;
  status: string;
  approved_by?: string;
  approved_at?: string;
  remark?: string;
  created_at: string;
  updated_at: string;
}

export interface AttendanceStatistics {
  total_days: number;
  work_days: number;
  leave_days: number;
  late_count: number;
  early_leave_count: number;
  overtime_hours: number;
}

export interface CheckInRequest {
  location?: string;
  latitude?: number;
  longitude?: number;
}

export interface CreateEmployeeRequest {
  name: string;
  email: string;
  username: string;
  phone?: string;
  position_id?: string;
  department_id?: string;
  employee_no: string;
  hire_date?: string;
}

export interface UpdateEmployeeRequest {
  name?: string;
  email?: string;
  phone?: string;
  position_id?: string;
  department_id?: string;
  employee_no?: string;
  hire_date?: string;
  status?: string;
}

export interface CreatePositionRequest {
  name: string;
  code?: string;
  description?: string;
}

export interface UpdatePositionRequest {
  name?: string;
  code?: string;
  description?: string;
}

export interface CreateLeaveRequest {
  leave_type: string;
  start_date: string;
  end_date: string;
  reason?: string;
}

export interface UpdateLeaveRequest {
  leave_type?: string;
  start_date?: string;
  end_date?: string;
  reason?: string;
  status?: string;
}

export interface PaginationResponse<T> {
  data: T[];
  total: number;
  page: number;
  page_size: number;
}

function unwrapEmployeeListPayload(raw: unknown): PaginationResponse<Employee> {
  const r = raw as Record<string, unknown> | null | undefined;
  if (!r || typeof r !== 'object') {
    return { data: [], total: 0, page: 1, page_size: 10 };
  }
  let rows: Employee[] = [];
  const bodyData = r.data;
  if (Array.isArray(bodyData)) {
    rows = bodyData as Employee[];
  } else if (bodyData && typeof bodyData === 'object' && 'data' in bodyData && Array.isArray((bodyData as { data: unknown }).data)) {
    rows = (bodyData as { data: Employee[] }).data;
  }
  return {
    data: rows,
    total: Number(r.total ?? 0),
    page: Number(r.page ?? 1),
    page_size: Number(r.page_size ?? 10),
  };
}

export const hrApi = {
  getEmployees: async (page: number = 1, pageSize: number = 10): Promise<PaginationResponse<Employee>> => {
    const response = await apiClient.get(`${API_BASE_URL}/employees`, {
      params: { page, page_size: pageSize }
    });
    return unwrapEmployeeListPayload(response.data);
  },

  getEmployee: async (id: string): Promise<Employee> => {
    const response = await apiClient.get(`${API_BASE_URL}/employees/${id}`);
    const raw = response.data as { success?: boolean; data?: Employee } | Employee;
    if (raw && typeof raw === 'object' && 'data' in raw && raw.data && typeof raw.data === 'object' && 'id' in raw.data) {
      return raw.data as Employee;
    }
    return raw as Employee;
  },

  createEmployee: async (data: CreateEmployeeRequest): Promise<Employee> => {
    const response = await apiClient.post(`${API_BASE_URL}/employees`, data);
    return response.data;
  },

  updateEmployee: async (id: string, data: UpdateEmployeeRequest): Promise<Employee> => {
    const response = await apiClient.put(`${API_BASE_URL}/employees/${id}`, data);
    return response.data;
  },

  deleteEmployee: async (id: string): Promise<void> => {
    await apiClient.delete(`${API_BASE_URL}/employees/${id}`);
  },

  getPositions: async (page: number = 1, pageSize: number = 10): Promise<PaginationResponse<Position>> => {
    const response = await apiClient.get(`${API_BASE_URL}/positions`, {
      params: { page, page_size: pageSize }
    });
    return response.data;
  },

  getPosition: async (id: string): Promise<Position> => {
    const response = await apiClient.get(`${API_BASE_URL}/positions/${id}`);
    return response.data;
  },

  createPosition: async (data: CreatePositionRequest): Promise<Position> => {
    const response = await apiClient.post(`${API_BASE_URL}/positions`, data);
    return response.data;
  },

  updatePosition: async (id: string, data: UpdatePositionRequest): Promise<Position> => {
    const response = await apiClient.put(`${API_BASE_URL}/positions/${id}`, data);
    return response.data;
  },

  deletePosition: async (id: string): Promise<void> => {
    await apiClient.delete(`${API_BASE_URL}/positions/${id}`);
  },

  checkIn: async (data: CheckInRequest): Promise<AttendanceRecord> => {
    const response = await apiClient.post(`${API_BASE_URL}/attendance/check-in`, data);
    return response.data;
  },

  checkOut: async (data: CheckInRequest): Promise<AttendanceRecord> => {
    const response = await apiClient.post(`${API_BASE_URL}/attendance/check-out`, data);
    return response.data;
  },

  getAttendanceRecords: async (page: number = 1, pageSize: number = 10): Promise<PaginationResponse<AttendanceRecord>> => {
    const response = await apiClient.get(`${API_BASE_URL}/attendance/records`, {
      params: { page, page_size: pageSize }
    });
    return response.data;
  },

  getTodayAttendance: async (): Promise<AttendanceRecord | null> => {
    const response = await apiClient.get(`${API_BASE_URL}/attendance/today`);
    return response.data;
  },

  getMonthAttendance: async (year?: number, month?: number): Promise<AttendanceRecord[]> => {
    const response = await apiClient.get(`${API_BASE_URL}/attendance/month`, {
      params: { year, month }
    });
    return response.data;
  },

  getAttendanceStatistics: async (year?: number, month?: number): Promise<AttendanceStatistics> => {
    const response = await apiClient.get(`${API_BASE_URL}/attendance/statistics`, {
      params: { year, month }
    });
    return response.data;
  },

  getMyLeaveRequests: async (page: number = 1, pageSize: number = 10): Promise<PaginationResponse<LeaveRequest>> => {
    const response = await apiClient.get(`${API_BASE_URL}/leave`, {
      params: { page, page_size: pageSize }
    });
    return response.data;
  },

  getLeaveRequest: async (id: string): Promise<LeaveRequest> => {
    const response = await apiClient.get(`${API_BASE_URL}/leave/${id}`);
    return response.data;
  },

  createLeaveRequest: async (data: CreateLeaveRequest): Promise<LeaveRequest> => {
    const response = await apiClient.post(`${API_BASE_URL}/leave`, data);
    return response.data;
  },

  updateLeaveRequest: async (id: string, data: UpdateLeaveRequest): Promise<LeaveRequest> => {
    const response = await apiClient.put(`${API_BASE_URL}/leave/${id}`, data);
    return response.data;
  },

  deleteLeaveRequest: async (id: string): Promise<void> => {
    await apiClient.delete(`${API_BASE_URL}/leave/${id}`);
  },
};
