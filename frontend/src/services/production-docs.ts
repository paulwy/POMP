import apiClient from '@/api/client';

const API_BASE_URL = '/v1';

export interface DocumentCategory {
  id: string;
  name: string;
  code: string;
  description?: string;
  documentType: 'standard' | 'process' | 'manual' | 'safety' | 'quality' | 'record';
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductionDocument {
  id: string;
  categoryId: string;
  title: string;
  code: string;
  version: string;
  summary?: string;
  content?: string;
  coverImage?: string;
  fileUrl?: string;
  authorId: string;
  departmentId?: string;
  status: 'draft' | 'pending_review' | 'published' | 'rejected' | 'archived';
  isTop: boolean;
  publishedAt?: string;
  effectiveDate?: string;
  expiryDate?: string;
  reviewCycleMonths?: number;
  lastReviewedAt?: string;
  authorName?: string;
  categoryName?: string;
  categoryCode?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentReview {
  id: string;
  documentId: string;
  reviewerId: string;
  status: 'approved' | 'rejected' | 'requested_changes';
  comment?: string;
  reviewedAt?: string;
  createdAt: string;
}

export interface CreateDocumentRequest {
  category_code: string;
  title: string;
  code: string;
  version?: string;
  summary?: string;
  content?: string;
  cover_image?: string;
  file_url?: string;
  effective_date?: string;
  expiry_date?: string;
  review_cycle_months?: number;
}

export interface UpdateDocumentRequest {
  title?: string;
  summary?: string;
  content?: string;
  cover_image?: string;
  file_url?: string;
  version?: string;
  effective_date?: string;
  expiry_date?: string;
  review_cycle_months?: number;
}

export interface ReviewDocumentRequest {
  status: 'approved' | 'rejected' | 'requested_changes';
  comment?: string;
}

export interface CreateDocumentCategoryRequest {
  name: string;
  code: string;
  documentType: string;
  description?: string;
  sortOrder?: number;
}

export const PRODUCTION_DOC_CATEGORIES = [
  { name: '技术标准', code: 'tech_standards', documentType: 'standard' as const, description: '技术标准和规范文档' },
  { name: '工艺流程', code: 'process_flow', documentType: 'process' as const, description: '生产工艺流程和作业指导书' },
  { name: '操作手册', code: 'operation_manual', documentType: 'manual' as const, description: '设备操作和维护手册' },
  { name: '安全规程', code: 'safety_rules', documentType: 'safety' as const, description: '安全生产和操作规程' },
  { name: '质量标准', code: 'quality_standard', documentType: 'quality' as const, description: '质量管理和检验标准' },
  { name: '记录表格', code: 'record_forms', documentType: 'record' as const, description: '生产记录和表格模板' },
];

// Mock data for categories
const MOCK_CATEGORIES: DocumentCategory[] = PRODUCTION_DOC_CATEGORIES.map((cat, idx) => ({
  id: String(idx + 1),
  name: cat.name,
  code: cat.code,
  description: cat.description,
  documentType: cat.documentType,
  sortOrder: idx,
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}));

// Mock data for documents
const MOCK_DOCUMENTS: ProductionDocument[] = [
  {
    id: '1',
    categoryId: '1',
    title: '焊接工艺标准',
    code: 'WS-001',
    version: '1.0',
    summary: '焊接工艺和质量控制标准',
    content: '详细的焊接工艺标准...',
    authorId: '1',
    status: 'published',
    isTop: true,
    categoryName: '技术标准',
    categoryCode: 'tech_standards',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    categoryId: '4',
    title: '安全生产操作规程',
    code: 'AQ-001',
    version: '2.0',
    summary: '生产车间安全操作规程',
    content: '安全操作规程...',
    authorId: '1',
    status: 'published',
    isTop: true,
    categoryName: '安全规程',
    categoryCode: 'safety_rules',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Mock reviews
const MOCK_REVIEWS: DocumentReview[] = [];

export const productionDocsApi = {
  getCategories: async (): Promise<DocumentCategory[]> => {
    // Try real API first, fallback to mock
    try {
      const response = await apiClient.get(`${API_BASE_URL}/production-docs/categories`);
      return response.data?.data || response.data || MOCK_CATEGORIES;
    } catch {
      return MOCK_CATEGORIES;
    }
  },

  getCategory: async (code: string): Promise<DocumentCategory> => {
    try {
      const response = await apiClient.get(`${API_BASE_URL}/production-docs/categories/${code}`);
      return response.data?.data || response.data;
    } catch {
      const category = MOCK_CATEGORIES.find(c => c.code === code);
      if (!category) throw new Error('Category not found');
      return category;
    }
  },

  createCategory: async (request: CreateDocumentCategoryRequest): Promise<DocumentCategory> => {
    try {
      const response = await apiClient.post(`${API_BASE_URL}/production-docs/categories`, request);
      return response.data?.data || response.data;
    } catch {
      const newCategory: DocumentCategory = {
        id: String(MOCK_CATEGORIES.length + 1),
        name: request.name,
        code: request.code,
        description: request.description,
        documentType: request.documentType as 'standard' | 'process' | 'manual' | 'safety' | 'quality' | 'record',
        sortOrder: MOCK_CATEGORIES.length,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      MOCK_CATEGORIES.push(newCategory);
      return newCategory;
    }
  },

  getDocuments: async (status?: string, categoryCode?: string): Promise<ProductionDocument[]> => {
    try {
      const params = {
        ...(status && { status }),
        ...(categoryCode && { category: categoryCode }),
      };
      const response = await apiClient.get(`${API_BASE_URL}/production-docs/documents`, { params });
      const data = response.data?.data || response.data;
      return Array.isArray(data) ? data : MOCK_DOCUMENTS;
    } catch {
      let docs = [...MOCK_DOCUMENTS];
      if (status && status !== 'all') {
        docs = docs.filter(d => d.status === status);
      }
      if (categoryCode) {
        docs = docs.filter(d => d.categoryCode === categoryCode);
      }
      return docs;
    }
  },

  getDocument: async (id: string): Promise<ProductionDocument> => {
    try {
      const response = await apiClient.get(`${API_BASE_URL}/production-docs/documents/${id}`);
      return response.data?.data || response.data;
    } catch {
      const doc = MOCK_DOCUMENTS.find(d => d.id === id);
      if (!doc) throw new Error('Document not found');
      return doc;
    }
  },

  createDocument: async (request: CreateDocumentRequest): Promise<ProductionDocument> => {
    try {
      const response = await apiClient.post(`${API_BASE_URL}/production-docs/documents`, request);
      return response.data?.data || response.data;
    } catch {
      const newDoc: ProductionDocument = {
        id: String(MOCK_DOCUMENTS.length + 1),
        categoryId: '1',
        title: request.title,
        code: request.code,
        version: request.version || '1.0',
        summary: request.summary,
        content: request.content,
        fileUrl: request.file_url,
        authorId: '1',
        status: 'draft',
        isTop: false,
        categoryName: PRODUCTION_DOC_CATEGORIES.find(c => c.code === request.category_code)?.name || '',
        categoryCode: request.category_code,
        effectiveDate: request.effective_date,
        expiryDate: request.expiry_date,
        reviewCycleMonths: request.review_cycle_months,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      MOCK_DOCUMENTS.push(newDoc);
      return newDoc;
    }
  },

  updateDocument: async (id: string, request: UpdateDocumentRequest): Promise<ProductionDocument> => {
    try {
      const response = await apiClient.put(`${API_BASE_URL}/production-docs/documents/${id}`, request);
      return response.data?.data || response.data;
    } catch {
      const docIndex = MOCK_DOCUMENTS.findIndex(d => d.id === id);
      if (docIndex === -1) throw new Error('Document not found');
      MOCK_DOCUMENTS[docIndex] = {
        ...MOCK_DOCUMENTS[docIndex],
        title: request.title || MOCK_DOCUMENTS[docIndex].title,
        summary: request.summary || MOCK_DOCUMENTS[docIndex].summary,
        content: request.content || MOCK_DOCUMENTS[docIndex].content,
        fileUrl: request.file_url || MOCK_DOCUMENTS[docIndex].fileUrl,
        version: request.version || MOCK_DOCUMENTS[docIndex].version,
        effectiveDate: request.effective_date || MOCK_DOCUMENTS[docIndex].effectiveDate,
        expiryDate: request.expiry_date || MOCK_DOCUMENTS[docIndex].expiryDate,
        reviewCycleMonths: request.review_cycle_months || MOCK_DOCUMENTS[docIndex].reviewCycleMonths,
        updatedAt: new Date().toISOString(),
      };
      return MOCK_DOCUMENTS[docIndex];
    }
  },

  submitForReview: async (id: string): Promise<ProductionDocument> => {
    try {
      const response = await apiClient.post(`${API_BASE_URL}/production-docs/documents/${id}/review`);
      return response.data?.data || response.data;
    } catch {
      const docIndex = MOCK_DOCUMENTS.findIndex(d => d.id === id);
      if (docIndex === -1) throw new Error('Document not found');
      MOCK_DOCUMENTS[docIndex].status = 'pending_review';
      MOCK_DOCUMENTS[docIndex].updatedAt = new Date().toISOString();
      return MOCK_DOCUMENTS[docIndex];
    }
  },

  reviewDocument: async (id: string, request: ReviewDocumentRequest): Promise<DocumentReview> => {
    try {
      const response = await apiClient.post(`${API_BASE_URL}/production-docs/documents/${id}/review`, request);
      return response.data?.data || response.data;
    } catch {
      const newReview: DocumentReview = {
        id: String(MOCK_REVIEWS.length + 1),
        documentId: id,
        reviewerId: '1',
        status: request.status,
        comment: request.comment,
        reviewedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };
      MOCK_REVIEWS.push(newReview);
      // Update document status
      const docIndex = MOCK_DOCUMENTS.findIndex(d => d.id === id);
      if (docIndex !== -1) {
        MOCK_DOCUMENTS[docIndex].status = request.status === 'approved' ? 'published' : 'rejected';
        MOCK_DOCUMENTS[docIndex].updatedAt = new Date().toISOString();
      }
      return newReview;
    }
  },

  getDocumentReviews: async (id: string): Promise<DocumentReview[]> => {
    try {
      const response = await apiClient.get(`${API_BASE_URL}/production-docs/documents/${id}/reviews`);
      const data = response.data?.data || response.data;
      return Array.isArray(data) ? data : [];
    } catch {
      return MOCK_REVIEWS.filter(r => r.documentId === id);
    }
  },

  getPendingReviewDocuments: async (): Promise<ProductionDocument[]> => {
    try {
      const response = await apiClient.get(`${API_BASE_URL}/production-docs/documents/pending-review`);
      const data = response.data?.data || response.data;
      return Array.isArray(data) ? data : [];
    } catch {
      return MOCK_DOCUMENTS.filter(d => d.status === 'pending_review');
    }
  },

  getDocumentsForReview: async (): Promise<ProductionDocument[]> => {
    try {
      const response = await apiClient.get(`${API_BASE_URL}/production-docs/documents/for-review`);
      const data = response.data?.data || response.data;
      return Array.isArray(data) ? data : [];
    } catch {
      return MOCK_DOCUMENTS.filter(d => d.status === 'pending_review');
    }
  },
};
