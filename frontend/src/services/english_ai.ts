import apiClient from '../api/client';

export interface TranslateRequest {
  text: string;
  source_lang?: string;
  target_lang?: string;
  context?: string;
}

export interface TranslateResponse {
  translated_text: string;
  alternatives: string[];
  suggestions: string[];
}

export interface GenerateDescriptionRequest {
  chinese_description: string;
  style?: string;
  max_length?: number;
}

export interface GenerateDescriptionResponse {
  description: string;
  suggestions: string[];
}

export interface SuggestNamingRequest {
  text: string;
  type?: string;
}

export interface SuggestNamingResponse {
  recommended: string;
  camel_case: string;
  snake_case: string;
  pascal_case: string;
  kebab_case: string;
}

export interface TerminologyItem {
  chinese: string;
  english: string;
  category: string;
  examples: string[];
}

export interface TerminologyResponse {
  terms: TerminologyItem[];
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export const englishAiService = {
  async translate(request: TranslateRequest): Promise<TranslateResponse> {
    const response = await apiClient.post<ApiResponse<TranslateResponse>>(
      '/v1/english-ai/translate',
      request
    );
    if (!response.data.success) {
      throw new Error(response.data.error || '翻译失败');
    }
    return response.data.data!;
  },

  async generateDescription(request: GenerateDescriptionRequest): Promise<GenerateDescriptionResponse> {
    const response = await apiClient.post<ApiResponse<GenerateDescriptionResponse>>(
      '/v1/english-ai/generate-description',
      request
    );
    if (!response.data.success) {
      throw new Error(response.data.error || '描述生成失败');
    }
    return response.data.data!;
  },

  async suggestNaming(request: SuggestNamingRequest): Promise<SuggestNamingResponse> {
    const response = await apiClient.post<ApiResponse<SuggestNamingResponse>>(
      '/v1/english-ai/suggest-naming',
      request
    );
    if (!response.data.success) {
      throw new Error(response.data.error || '命名建议失败');
    }
    return response.data.data!;
  },

  async getTerminology(category?: string, query?: string): Promise<TerminologyResponse> {
    const params = new URLSearchParams();
    if (category) params.set('category', category);
    if (query) params.set('query', query);
    
    const response = await apiClient.get<ApiResponse<TerminologyResponse>>(
      `/v1/english-ai/terminology?${params.toString()}`
    );
    if (!response.data.success) {
      throw new Error(response.data.error || '术语查询失败');
    }
    return response.data.data!;
  },
};
