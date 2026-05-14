import apiClient from '@/api/client';

export interface ApprovalCommentRequest {
  approval_type: 'leave' | 'overtime' | 'purchase' | 'travel' | 'reimbursement' | 'general';
  decision: 'approve' | 'reject' | 'need_more_info' | 'need_modify';
  application_content: string;
  applicant_name: string;
  style?: 'formal' | 'moderate' | 'strict';
}

export interface ApprovalCommentResponse {
  comment: string;
  suggestions: string[];
  tips: string[];
}

export interface OptimizeCommentRequest {
  original_comment: string;
  style: 'formal' | 'moderate' | 'strict';
}

export const approvalCommentAiApi = {
  generateComment: async (request: ApprovalCommentRequest): Promise<ApprovalCommentResponse> => {
    const response = await apiClient.post('/v1/approval-comment/generate', request);
    if (response.data.success) {
      return response.data.data;
    }
    throw new Error(response.data.error || '生成审批意见失败');
  },

  optimizeComment: async (request: OptimizeCommentRequest): Promise<string> => {
    const response = await apiClient.post('/v1/approval-comment/optimize', request);
    if (response.data.success) {
      return response.data.data;
    }
    throw new Error(response.data.error || '优化审批意见失败');
  },
};
