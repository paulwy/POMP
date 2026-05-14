import apiClient from '../api/client';

export interface GenerateMinutesRequest {
  meeting_title: string;
  meeting_date?: string;
  attendees?: string[];
  meeting_content: string;
  style?: string;
  include_action_items?: boolean;
  include_decisions?: boolean;
}

export interface MeetingMinutesResponse {
  summary: string;
  action_items: string[];
  decisions: string[];
  next_meeting?: string;
  key_points: string[];
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export const meetingMinutesApi = {
  async generateMinutes(
    request: GenerateMinutesRequest
  ): Promise<MeetingMinutesResponse> {
    const response = await apiClient.post<ApiResponse<MeetingMinutesResponse>>(
      '/v1/meeting-minutes/generate',
      request
    );
    if (!response.data.success) {
      throw new Error(response.data.error || '会议纪要生成失败');
    }
    return response.data.data!;
  },

  async optimizeMinutes(
    originalMinutes: string,
    style?: string
  ): Promise<string> {
    const response = await apiClient.post<ApiResponse<string>>(
      '/v1/meeting-minutes/optimize',
      {
        original_minutes: originalMinutes,
        style,
      }
    );
    if (!response.data.success) {
      throw new Error(response.data.error || '会议纪要优化失败');
    }
    return response.data.data!;
  },
};
