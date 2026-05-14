import apiClient from '@/api/client';

const API_BASE_URL = '/v1/schedule';

export interface ScheduleEvent {
  id: string;
  title: string;
  description?: string;
  event_type: string;
  start_time: string;
  end_time: string;
  is_all_day: boolean;
  location?: string;
  organizer_id: string;
  participant_ids: string[];
  reminder_minutes?: number;
  is_recurring: boolean;
  recurrence_rule?: string;
  status: string;
  color: string;
  created_at: string;
  updated_at: string;
}

export interface CreateScheduleEventRequest {
  title: string;
  description?: string;
  event_type?: string;
  start_time: string;
  end_time: string;
  is_all_day?: boolean;
  location?: string;
  organizer_id: string;
  participant_ids?: string[];
  reminder_minutes?: number;
  is_recurring?: boolean;
  recurrence_rule?: string;
  color?: string;
}

export interface UpdateScheduleEventRequest {
  title?: string;
  description?: string;
  event_type?: string;
  start_time?: string;
  end_time?: string;
  is_all_day?: boolean;
  location?: string;
  participant_ids?: string[];
  reminder_minutes?: number;
  is_recurring?: boolean;
  recurrence_rule?: string;
  status?: string;
  color?: string;
}

export interface ScheduleQueryParams {
  organizer_id?: string;
  start_date?: string;
  end_date?: string;
  status?: string;
  page?: number;
  page_size?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

export interface ListResponse<T> {
  success: boolean;
  data: T[];
  error?: string;
  total?: number;
}

const scheduleApi = {
  getEvents: async (params?: ScheduleQueryParams): Promise<ListResponse<ScheduleEvent>> => {
    const response = await apiClient.get(`${API_BASE_URL}/events`, { params });
    return response.data;
  },

  getEvent: async (id: string): Promise<ApiResponse<ScheduleEvent>> => {
    const response = await apiClient.get(`${API_BASE_URL}/events/${id}`);
    return response.data;
  },

  createEvent: async (event: CreateScheduleEventRequest): Promise<ApiResponse<ScheduleEvent>> => {
    const response = await apiClient.post(`${API_BASE_URL}/events`, event);
    return response.data;
  },

  updateEvent: async (id: string, event: UpdateScheduleEventRequest): Promise<ApiResponse<ScheduleEvent>> => {
    const response = await apiClient.put(`${API_BASE_URL}/events/${id}`, event);
    return response.data;
  },

  deleteEvent: async (id: string): Promise<ApiResponse<boolean>> => {
    const response = await apiClient.delete(`${API_BASE_URL}/events/${id}`);
    return response.data;
  },
};

export default scheduleApi;
