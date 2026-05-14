import React, { useState } from 'react';
import { Sparkles, Loader2, Check, Lightbulb, AlertCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Label } from '@/components/ui/Label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { approvalCommentAiApi, ApprovalCommentResponse } from '@/services/approval-comment-ai';
import { toast } from 'sonner';

interface ApprovalCommentAIProps {
  value: string;
  onChange: (value: string) => void;
  applicationContent?: string;
  applicantName?: string;
  approvalType?: 'leave' | 'overtime' | 'purchase' | 'travel' | 'reimbursement' | 'general';
  onClose?: () => void;
}

export const ApprovalCommentAI: React.FC<ApprovalCommentAIProps> = ({
  value,
  onChange,
  applicationContent = '',
  applicantName = '',
  approvalType = 'general',
  onClose,
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [decision, setDecision] = useState<'approve' | 'reject' | 'need_more_info' | 'need_modify'>('approve');
  const [style, setStyle] = useState<'formal' | 'moderate' | 'strict'>('formal');
  const [aiResult, setAiResult] = useState<ApprovalCommentResponse | null>(null);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const result = await approvalCommentAiApi.generateComment({
        approval_type: approvalType,
        decision,
        application_content: applicationContent || '一般审批申请',
        applicant_name: applicantName || '申请人',
        style,
      });
      setAiResult(result);
      toast.success('审批意见已生成');
    } catch (error) {
      console.error('生成审批意见失败:', error);
      toast.error('生成审批意见失败，请稍后重试');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleOptimize = async () => {
    if (!value.trim()) {
      toast.error('请先输入原始审批意见');
      return;
    }

    setIsOptimizing(true);
    try {
      const optimized = await approvalCommentAiApi.optimizeComment({
        original_comment: value,
        style,
      });
      onChange(optimized);
      toast.success('审批意见已优化');
    } catch (error) {
      console.error('优化审批意见失败:', error);
      toast.error('优化审批意见失败，请稍后重试');
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleApplySuggestion = (suggestion: string) => {
    const newComment = value ? `${value}\n\n${suggestion}` : suggestion;
    onChange(newComment);
    toast.success('建议已添加');
  };

  const getDecisionLabel = (dec: string) => {
    switch (dec) {
      case 'approve': return '同意';
      case 'reject': return '拒绝';
      case 'need_more_info': return '需要补充';
      case 'need_modify': return '需要修改';
      default: return dec;
    }
  };

  const getDecisionColor = (dec: string) => {
    switch (dec) {
      case 'approve': return 'bg-success/10 text-success border-success/20';
      case 'reject': return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'need_more_info':
      case 'need_modify': return 'bg-warning/10 text-warning border-warning/20';
      default: return 'bg-muted text-muted-foreground border-muted';
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <Label className="text-sm font-medium">AI辅助</Label>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setShowAIPanel(!showAIPanel)}
          className="text-primary hover:text-primary/80 hover:bg-primary/10"
        >
          {showAIPanel ? '隐藏AI助手' : '显示AI助手'}
        </Button>
      </div>

      {showAIPanel && (
        <Card className="border-primary/20 bg-primary/10/30">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                AI智能辅助
              </CardTitle>
              {onClose && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">审批决定</Label>
                <select
                  value={decision}
                  onChange={(e) => setDecision(e.target.value as 'approve' | 'reject' | 'need_more_info' | 'need_modify')}
                  className="w-full border rounded-md p-2 h-8 text-sm"
                >
                  <option value="approve">✅ 同意</option>
                  <option value="reject">❌ 拒绝</option>
                  <option value="need_more_info">📋 需要补充</option>
                  <option value="need_modify">✏️ 需要修改</option>
                </select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">语言风格</Label>
                <select
                  value={style}
                  onChange={(e) => setStyle(e.target.value as 'formal' | 'moderate' | 'strict')}
                  className="w-full border rounded-md p-2 h-8 text-sm"
                >
                  <option value="formal">正式</option>
                  <option value="moderate">温和</option>
                  <option value="strict">严格</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                onClick={handleGenerate}
                disabled={isGenerating}
                className="flex-1 bg-purple-600 hover:bg-purple-700"
                size="sm"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    生成中...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    生成意见
                  </>
                )}
              </Button>

              <Button
                type="button"
                onClick={handleOptimize}
                disabled={isOptimizing || !value.trim()}
                variant="outline"
                size="sm"
              >
                {isOptimizing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    优化中...
                  </>
                ) : (
                  <>
                    <Lightbulb className="mr-2 h-4 w-4" />
                    优化已有
                  </>
                )}
              </Button>
            </div>

            {aiResult && (
              <div className="space-y-3 pt-3 border-t border-primary/20">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Label className="text-xs">生成的审批意见</Label>
                    <Badge className={`text-xs ${getDecisionColor(decision)}`}>
                      {getDecisionLabel(decision)}
                    </Badge>
                  </div>
                  <div className="bg-white rounded-md p-3 text-sm border border-primary/20">
                    {aiResult.comment}
                  </div>
                  <Button
                    type="button"
                    onClick={() => {
                      onChange(aiResult.comment);
                      setShowAIPanel(false);
                      toast.success('审批意见已应用');
                    }}
                    size="sm"
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    <Check className="mr-2 h-4 w-4" />
                    使用此意见
                  </Button>
                </div>

                {aiResult.suggestions && aiResult.suggestions.length > 0 && (
                  <div className="space-y-1">
                    <Label className="text-xs flex items-center gap-1">
                      <Lightbulb className="h-3 w-3" />
                      建议
                    </Label>
                    <div className="space-y-1">
                      {aiResult.suggestions.map((suggestion, index) => (
                        <div
                          key={index}
                          className="flex items-start gap-2 text-xs bg-white rounded p-2 border border-gray-200 cursor-pointer hover:bg-gray-50"
                          onClick={() => handleApplySuggestion(suggestion)}
                        >
                          <Check className="h-3 w-3 text-success mt-0.5 flex-shrink-0" />
                          <span>{suggestion}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {aiResult.tips && aiResult.tips.length > 0 && (
                  <div className="space-y-1">
                    <Label className="text-xs flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      注意事项
                    </Label>
                    <div className="space-y-1">
                      {aiResult.tips.map((tip, index) => (
                        <div
                          key={index}
                          className="flex items-start gap-2 text-xs bg-warning/10 rounded p-2 border border-warning/20"
                        >
                          <AlertCircle className="h-3 w-3 text-warning mt-0.5 flex-shrink-0" />
                          <span>{tip}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ApprovalCommentAI;
