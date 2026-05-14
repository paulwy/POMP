import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle, Clock, User, Calendar, FileText, Sparkles, ChevronRight, Circle, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { Badge } from '@/components/ui/Badge';
import { workflowApi, ApprovalTask, ApprovalRecord, WorkflowStep } from '@/services/workflow';
import { approvalCommentAiApi } from '@/services/approval-comment-ai';
import useAuthStore from '@/store/useAuthStore';
import { toast } from 'sonner';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/Dialog';

const ApprovalDetail: React.FC = () => {
    const { taskId } = useParams<{ taskId: string }>();
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const [task, setTask] = useState<ApprovalTask | null>(null);
    const [records, setRecords] = useState<ApprovalRecord[]>([]);
    const [steps, setSteps] = useState<WorkflowStep[]>([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [comment, setComment] = useState('');
    const [actionDialog, setActionDialog] = useState<{ type: 'approve' | 'reject' } | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);

    const handleGenerateComment = async (tone: 'formal' | 'moderate' | 'strict' = 'moderate') => {
        if (!task) return;
        setIsGenerating(true);
        try {
            const result = await approvalCommentAiApi.generateComment({
                approval_type: task.business_type as 'leave' | 'overtime' | 'purchase' | 'travel' | 'reimbursement' | 'general' || 'general',
                decision: 'approve',
                application_content: task.business_title,
                applicant_name: task.applicant_name,
                style: tone,
            });
            setComment(result.comment);
            toast.success('审批意见已生成');
        } catch (error) {
            console.error('生成审批意见失败:', error);
            toast.error('生成审批意见失败');
        } finally {
            setIsGenerating(false);
        }
    };

    const fetchTaskAndRecords = async () => {
        if (!taskId) return;
        setLoading(true);
        try {
            const taskData = await workflowApi.getTaskDetail(taskId);
            setTask(taskData);
            
            if (taskData.workflow_instance_id) {
                workflowApi.getWorkflowSteps(taskData.workflow_instance_id)
                    .then(setSteps)
                    .catch(e => console.error('Failed to fetch workflow steps:', e));
            }
            
            workflowApi.getApprovalRecords(taskId)
                .then(setRecords)
                .catch(e => console.error('Failed to fetch approval records:', e));
                
        } catch (error) {
            console.error('Failed to fetch task:', error);
            toast.error('获取任务详情失败');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTaskAndRecords();
    }, [taskId]);

    const handleAction = async (type: 'approve' | 'reject') => {
        if (!taskId || !user?.id) return;
        setSubmitting(true);
        try {
            await workflowApi.approveTask(taskId, {
                user_id: user.id,
                approved: type === 'approve',
                comment: comment || undefined,
            });
            toast.success(type === 'approve' ? '审批通过' : '已拒绝');
            setActionDialog(null);
            fetchTaskAndRecords();
        } catch (error) {
            console.error('Failed to approve/reject:', error);
            toast.error('操作失败');
        } finally {
            setSubmitting(false);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending':
                return <Badge variant="secondary" className="flex items-center gap-1"><Clock className="w-3 h-3" />待审批</Badge>;
            case 'approved':
                return <Badge variant="default" className="flex items-center gap-1 bg-green-600"><CheckCircle className="w-3 h-3" />已通过</Badge>;
            case 'rejected':
                return <Badge variant="destructive" className="flex items-center gap-1"><XCircle className="w-3 h-3" />已拒绝</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    const getActionLabel = (action: string) => {
        switch (action) {
            case 'approved':
                return '通过';
            case 'rejected':
                return '拒绝';
            default:
                return action;
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleString('zh-CN');
    };

    const canApprove = task?.status === 'pending' || task?.status === 'processing';

    const currentStepIndex = task?.current_step ? task.current_step - 1 : 0;

    if (loading) {
        return (
            <div className="p-6 flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!task) {
        return (
            <div className="p-6 text-center">
                <p className="text-muted-foreground">任务不存在</p>
                <Button variant="outline" className="mt-4" onClick={() => navigate('/approvals')}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    返回列表
                </Button>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="sm" onClick={() => navigate('/approvals')}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    返回
                </Button>
                <div>
                    <h1 className="text-3xl font-bold">{task.business_title}</h1>
                    <p className="text-muted-foreground mt-1">{task.workflow_name}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="w-5 h-5" />
                                审批详情
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">当前状态</span>
                                {getStatusBadge(task.status)}
                            </div>
                            <div className="flex items-center gap-2">
                                <User className="w-4 h-4 text-muted-foreground" />
                                <span className="text-muted-foreground">发起人:</span>
                                <span>{task.applicant_name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-muted-foreground" />
                                <span className="text-muted-foreground">发起时间:</span>
                                <span>{formatDate(task.created_at)}</span>
                            </div>
                            <div>
                                <span className="text-muted-foreground">当前节点:</span>
                                <span className="ml-2">{task.node_name}</span>
                            </div>
                            {task.current_step !== undefined && task.max_steps !== undefined && (
                                <div>
                                    <span className="text-muted-foreground">当前步骤:</span>
                                    <span className="ml-2">{task.current_step} / {task.max_steps}</span>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Clock className="w-5 h-5" />
                                审批流程进度
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="relative">
                                {steps.length > 0 ? (
                                    <div className="space-y-0">
                                        {steps.map((step, index) => {
                                            const isCompleted = index < currentStepIndex;
                                            const isCurrent = index === currentStepIndex;
                                            const isPending = index > currentStepIndex;
                                            const record = records.find(r => r.step_number === step.step_number);
                                            
                                            return (
                                                <div key={step.id} className="flex items-start gap-4 pb-6 last:pb-0">
                                                    <div className="flex flex-col items-center">
                                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                                                            isCompleted ? 'bg-green-500 text-white' :
                                                            isCurrent ? 'bg-primary text-white' :
                                                            'bg-gray-200 text-gray-500'
                                                        }`}>
                                                            {isCompleted ? (
                                                                <CheckCircle2 className="w-5 h-5" />
                                                            ) : isCurrent ? (
                                                                <Circle className="w-4 h-4" />
                                                            ) : (
                                                                <span className="text-sm font-medium">{step.step_number}</span>
                                                            )}
                                                        </div>
                                                        {index < steps.length - 1 && (
                                                            <div className={`w-0.5 h-8 ${
                                                                isCompleted || isCurrent ? 'bg-primary' : 'bg-gray-200'
                                                            }`}></div>
                                                        )}
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex items-center justify-between">
                                                            <h4 className={`font-medium ${
                                                                isCurrent ? 'text-primary' :
                                                                isCompleted ? 'text-green-600' :
                                                                'text-gray-600'
                                                            }`}>
                                                                {step.name}
                                                            </h4>
                                                            {isCurrent && (
                                                                <Badge variant="outline" className="text-xs">当前环节</Badge>
                                                            )}
                                                        </div>
                                                        <p className="text-sm text-muted-foreground mt-1">
                                                            {step.approver_name || step.role_code || '待分配'}
                                                        </p>
                                                        {record && (
                                                            <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-muted-foreground">
                                                                <div className="flex items-center justify-between">
                                                                    <span>{record.approver_name}</span>
                                                                    <Badge variant={record.action === 'approved' ? 'default' : 'destructive'} className="text-xs">
                                                                        {getActionLabel(record.action)}
                                                                    </Badge>
                                                                </div>
                                                                {record.comment && (
                                                                    <p className="mt-1">意见: {record.comment}</p>
                                                                )}
                                                                <p className="mt-1">{formatDate(record.created_at)}</p>
                                                            </div>
                                                        )}
                                                        {isPending && (
                                                            <p className="text-xs text-gray-400 mt-1">等待审批</p>
                                                        )}
                                                    </div>
                                                    {index < steps.length - 1 && (
                                                        <ChevronRight className="w-5 h-5 text-gray-300 flex-shrink-0 mt-1" />
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-muted-foreground">
                                        <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                        <p>暂无流程信息</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {records.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <FileText className="w-5 h-5" />
                                    审批记录
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {records.map((record) => (
                                    <div key={record.id} className="p-3 bg-gray-50 rounded-lg">
                                        <div className="flex items-center justify-between">
                                            <span className="font-medium">{record.approver_name}</span>
                                            <Badge variant={record.action === 'approved' ? 'default' : 'destructive'}>
                                                {getActionLabel(record.action)}
                                            </Badge>
                                        </div>
                                        {record.comment && (
                                            <p className="text-sm text-muted-foreground mt-1">
                                                意见: {record.comment}
                                            </p>
                                        )}
                                        <p className="text-xs text-gray-400 mt-1">
                                            步骤 {record.step_number} | {formatDate(record.created_at)}
                                        </p>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    )}

                    {canApprove && (
                        <Card>
                            <CardHeader>
                                <CardTitle>审批操作</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium mb-2 flex items-center gap-2">
                                        审批意见
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleGenerateComment('moderate')}
                                            disabled={isGenerating || !task}
                                            className="text-purple-600 hover:text-purple-700"
                                        >
                                            <Sparkles className={`h-3 w-3 mr-1 ${isGenerating ? 'animate-spin' : ''}`} />
                                            AI生成
                                        </Button>
                                    </label>
                                    <Textarea
                                        placeholder="请输入审批意见，或点击上方按钮使用AI生成..."
                                        value={comment}
                                        onChange={(e) => setComment(e.target.value)}
                                        rows={3}
                                    />
                                    <div className="flex gap-2 mt-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleGenerateComment('strict')}
                                            disabled={isGenerating}
                                        >
                                            严格语气
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleGenerateComment('moderate')}
                                            disabled={isGenerating}
                                        >
                                            温和语气
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleGenerateComment('formal')}
                                            disabled={isGenerating}
                                        >
                                            正式语气
                                        </Button>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button className="flex-1" onClick={() => setActionDialog({ type: 'approve' })}>
                                        <CheckCircle className="w-4 h-4 mr-2" />
                                        通过
                                    </Button>
                                    <Button variant="destructive" className="flex-1" onClick={() => setActionDialog({ type: 'reject' })}>
                                        <XCircle className="w-4 h-4 mr-2" />
                                        拒绝
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>流程信息</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">流程名称</span>
                                <span>{task.workflow_name}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">业务类型</span>
                                <span>{task.business_type}</span>
                            </div>
                            {task.current_approver_name && (
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">当前审批人</span>
                                    <span>{task.current_approver_name}</span>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {steps.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle>流程概览</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">总步骤</span>
                                    <span>{steps.length}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">已完成</span>
                                    <span className="text-green-600">{Math.max(0, currentStepIndex)}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">待审批</span>
                                    <span className="text-primary">{steps.length - currentStepIndex - 1}</span>
                                </div>
                                <div className="mt-4">
                                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-primary transition-all duration-500"
                                            style={{ width: `${(currentStepIndex / steps.length) * 100}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>

            <Dialog open={!!actionDialog} onOpenChange={() => setActionDialog(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {actionDialog?.type === 'approve' ? '确认通过' : '确认拒绝'}
                        </DialogTitle>
                        <DialogDescription>
                            {actionDialog?.type === 'approve'
                                ? '您确定要通过这个审批申请吗？'
                                : '您确定要拒绝这个审批申请吗？'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        {comment && (
                            <div>
                                <p className="text-sm font-medium mb-1">审批意见:</p>
                                <p className="text-muted-foreground">{comment}</p>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setActionDialog(null)} disabled={submitting}>
                            取消
                        </Button>
                        <Button
                            variant={actionDialog?.type === 'approve' ? 'default' : 'destructive'}
                            onClick={() => handleAction(actionDialog!.type)}
                            disabled={submitting}
                        >
                            {submitting ? '处理中...' : (actionDialog?.type === 'approve' ? '确认通过' : '确认拒绝')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default ApprovalDetail;
