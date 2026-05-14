import apiClient from '@/api/client';

const API_BASE_URL = '/v1';

export interface Category {
  id: string;
  name: string;
  code: string;
  description?: string;
  parent_id?: string;
  department_id?: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Article {
  id: string;
  category_id: string;
  categoryId?: string;
  title: string;
  slug: string;
  summary?: string;
  content?: string;
  cover_image?: string;
  coverImage?: string;
  author_id: string;
  authorId?: string;
  department_id?: string;
  departmentId?: string;
  status: 'draft' | 'pending_review' | 'published' | 'rejected' | 'archived';
  view_count: number;
  viewCount?: number;
  is_top: boolean;
  isTop?: boolean;
  published_at?: string;
  publishedAt?: string;
  review_timeout_days?: number;
  reviewTimeoutDays?: number;
  review_reminded_at?: string;
  reviewRemindedAt?: string;
  is_overdue?: boolean;
  isOverdue?: boolean;
  remaining_hours?: number;
  remainingHours?: number;
  author_name?: string;
  authorName?: string;
  category_code?: string;
  categoryCode?: string;
  created_at: string;
  createdAt?: string;
  updated_at: string;
  updatedAt?: string;
}

export interface ArticleReview {
  id: string;
  article_id: string;
  reviewer_id: string;
  status: 'approved' | 'rejected' | 'requested_changes';
  comment?: string;
  reviewed_at?: string;
  created_at: string;
}

export interface CreateArticleRequest {
  category_code: string;
  title: string;
  summary?: string;
  content?: string;
  cover_image?: string;
  author_id?: string;
}

export interface UpdateArticleRequest {
  title?: string;
  summary?: string;
  content?: string;
  cover_image?: string;
}

export interface ReviewArticleRequest {
  status: 'approved' | 'rejected' | 'requested_changes';
  comment?: string;
}

export interface CreateCategoryRequest {
  name: string;
  code: string;
  description?: string;
  parent_id?: string;
  department_id?: string;
  sort_order?: number;
}

// Helper function to extract data from API response
const extractArrayData = (response: unknown): unknown[] => {
  const result = (response as Record<string, unknown>)?.data;
  const resultRecord = result as Record<string, unknown>;
  if (resultRecord?.success && resultRecord?.data) {
    if (Array.isArray(resultRecord.data)) {
      return resultRecord.data;
    }
    if (resultRecord.data && (resultRecord.data as Record<string, unknown>).data && Array.isArray((resultRecord.data as Record<string, unknown>).data)) {
      return (resultRecord.data as Record<string, unknown>).data as unknown[];
    }
  }
  if (resultRecord?.data && Array.isArray(resultRecord.data)) {
    return resultRecord.data;
  }
  if ((response as Record<string, unknown>)?.data && Array.isArray((response as Record<string, unknown>).data)) {
    return (response as Record<string, unknown>).data as unknown[];
  }
  return [];
};

// Helper function to extract single object from API response
const extractObjectData = (response: unknown): Record<string, unknown> => {
  const result = (response as Record<string, unknown>)?.data;
  const resultRecord = result as Record<string, unknown>;
  if (resultRecord?.success && resultRecord?.data) {
    return resultRecord.data as Record<string, unknown>;
  }
  if (resultRecord?.data) {
    return resultRecord.data as Record<string, unknown>;
  }
  if ((response as Record<string, unknown>)?.data) {
    return (response as Record<string, unknown>).data as Record<string, unknown>;
  }
  return {};
};

export const cmsApi = {
  // Categories - 调用真实的CMS分类API！
  getCategories: async (_departmentId?: string): Promise<Category[]> => {
    try {
      const params = _departmentId ? { department_id: _departmentId } : {};
      const response = await apiClient.get(`${API_BASE_URL}/cms/categories`, { params });
      return extractArrayData(response) as Category[];
    } catch (error) {
      console.error('获取文章分类失败:', error);
      // 提供后备数据
      return [
        { id: '1', name: '产品中心', code: 'products', sort_order: 1, is_active: true, created_at: '', updated_at: '' },
        { id: '2', name: '新闻动态', code: 'news', sort_order: 2, is_active: true, created_at: '', updated_at: '' },
        { id: '3', name: '关于我们', code: 'about', sort_order: 3, is_active: true, created_at: '', updated_at: '' },
        { id: '4', name: '服务项目', code: 'services', sort_order: 4, is_active: true, created_at: '', updated_at: '' },
        { id: '5', name: '案例展示', code: 'cases', sort_order: 5, is_active: true, created_at: '', updated_at: '' },
      ];
    }
  },

  getCategory: async (code: string): Promise<Category> => {
    try {
      const response = await apiClient.get(`${API_BASE_URL}/cms/categories/${code}`);
      return extractObjectData(response) as unknown as Category;
    } catch (error) {
      console.error('获取分类失败:', error);
      return {} as Category;
    }
  },

  createCategory: async (request: CreateCategoryRequest): Promise<Category> => {
    try {
      const response = await apiClient.post(`${API_BASE_URL}/cms/categories`, request);
      return extractObjectData(response) as unknown as Category;
    } catch (error) {
      console.error('创建分类失败:', error);
      return {} as Category;
    }
  },

  // Articles
  getArticles: async (status?: string, categoryCode?: string): Promise<Article[]> => {
    try {
      const params: Record<string, unknown> = {};
      if (status) params.status = status;
      if (categoryCode) params.category = categoryCode;
      const response = await apiClient.get(`${API_BASE_URL}/cms/articles`, { params });
      return extractArrayData(response) as Article[];
    } catch (error) {
      console.error('获取文章列表失败:', error);
      return [];
    }
  },

  getPublicArticles: async (categoryCode?: string): Promise<Article[]> => {
    try {
      const params: Record<string, unknown> = categoryCode ? { category: categoryCode } : {};
      const response = await apiClient.get(`${API_BASE_URL}/cms/public/articles`, { params });
      return extractArrayData(response) as Article[];
    } catch (error) {
      console.error('获取公开文章失败:', error);
      return [];
    }
  },

  getArticle: async (id: string): Promise<Article | null> => {
    try {
      const response = await apiClient.get(`${API_BASE_URL}/cms/articles/${id}`);
      return extractObjectData(response) as unknown as Article;
    } catch (error) {
      console.error('获取文章详情失败:', error);
      return null;
    }
  },

  getPublicArticle: async (id: string): Promise<Article | null> => {
    try {
      const response = await apiClient.get(`${API_BASE_URL}/cms/public/articles/${id}`);
      return extractObjectData(response) as unknown as Article;
    } catch (error) {
      console.error('获取公开文章详情失败:', error);
      return null;
    }
  },

  createArticle: async (request: CreateArticleRequest): Promise<Article> => {
    try {
      const response = await apiClient.post(`${API_BASE_URL}/cms/articles`, request);
      return extractObjectData(response) as unknown as Article;
    } catch (error) {
      console.error('创建文章失败:', error);
      throw error;
    }
  },

  updateArticle: async (id: string, request: UpdateArticleRequest): Promise<Article> => {
    try {
      const response = await apiClient.put(`${API_BASE_URL}/cms/articles/${id}`, request);
      return extractObjectData(response) as unknown as Article;
    } catch (error) {
      console.error('更新文章失败:', error);
      throw error;
    }
  },

  submitForReview: async (id: string): Promise<Article> => {
    try {
      const response = await apiClient.post(`${API_BASE_URL}/cms/articles/${id}/submit-review`);
      return extractObjectData(response) as unknown as Article;
    } catch (error) {
      console.error('提交审核失败:', error);
      throw error;
    }
  },

  reviewArticle: async (id: string, request: ReviewArticleRequest): Promise<ArticleReview> => {
    try {
      const response = await apiClient.post(`${API_BASE_URL}/cms/articles/${id}/review`, request);
      return extractObjectData(response) as unknown as ArticleReview;
    } catch (error) {
      console.error('审核文章失败:', error);
      throw error;
    }
  },

  getArticleReviews: async (id: string): Promise<ArticleReview[]> => {
    try {
      const response = await apiClient.get(`${API_BASE_URL}/cms/articles/${id}/reviews`);
      return extractArrayData(response) as ArticleReview[];
    } catch (error) {
      console.error('获取文章审核记录失败:', error);
      return [];
    }
  },

  getPendingReviewArticles: async (): Promise<Article[]> => {
    try {
      const response = await apiClient.get(`${API_BASE_URL}/cms/articles/pending-review`);
      return extractArrayData(response) as Article[];
    } catch (error) {
      console.error('获取待审核文章失败:', error);
      return [];
    }
  },

  getReviewedArticles: async (): Promise<Article[]> => {
    try {
      const response = await apiClient.get(`${API_BASE_URL}/cms/articles/reviewed`);
      return extractArrayData(response) as Article[];
    } catch (error) {
      console.error('获取已审核文章失败:', error);
      return [];
    }
  },
};
