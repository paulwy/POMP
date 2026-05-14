import apiClient from '../api/client';

export interface GenerateImageRequest {
  prompt: string;
  width?: number;
  height?: number;
  num_images?: number;
  style?: string;
}

export interface GenerateImageResponse {
  images: string[];
  backend: string;
  prompt: string;
}

export interface AiServiceStatus {
  together_ai: boolean;
  huggingface: boolean;
  available_backends: string[];
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export const aiService = {
  async generateImage(request: GenerateImageRequest): Promise<GenerateImageResponse> {
    const response = await apiClient.post<ApiResponse<GenerateImageResponse>>(
      '/v1/ai/generate-image',
      request
    );
    if (!response.data.success) {
      throw new Error(response.data.error || '图片生成失败');
    }
    return response.data.data!;
  },

  async getStatus(): Promise<AiServiceStatus> {
    const response = await apiClient.get<ApiResponse<AiServiceStatus>>('/v1/ai/status');
    if (!response.data.success) {
      throw new Error(response.data.error || '获取AI状态失败');
    }
    return response.data.data!;
  },
};
