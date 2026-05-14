import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Label } from '@/components/ui/Label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/Select';
import { workflowApi, Workflow, CreateApprovalTaskRequest } from '@/services/workflow';
import useAuthStore from '@/store/useAuthStore';
import { toast } from 'sonner';

const NewApproval: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const [workflows, setWorkflows] = useState<Workflow[]>([]);
    const [selectedWorkflowId, setSelectedWorkflowId] = useState<string>('');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const fetchWorkflows = async () => {
        setLoading(true);
        try {
            const { data } = await workflowApi.getWorkflows();
            setWorkflows(data);
        } catch (error) {
            console.error('Failed to fetch workflows:', error);
            toast.error('获取工作流失败');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchWorkflows();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedWorkflowId || !title || !user?.id) {
            toast.error('请填写完整信息');
            return;
        }

        setSubmitting(true);
        try {
            const selectedWf = workflows.find(w => w.id === selectedWorkflowId);
            // 使用 workflow 的 code 作为 workflow_code（后端支持 code 或 name）
            const request: CreateApprovalTaskRequest = {
                workflow_code: selectedWf?.code || selectedWf?.name || selectedWorkflowId,
                title,
                description: description || undefined,
                creator_id: user.id,
                creator_name: user.name || user.username || '未知用户',
            };
            await workflowApi.createApprovalTask(request);
            toast.success('审批申请已提交');
            navigate('/approvals');
        } catch (error) {
            console.error('Failed to create approval:', error);
            toast.error('提交失败');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="p-6 max-w-2xl mx-auto">
            <div className="flex items-center gap-4 mb-6">
                <Button variant="outline" size="sm" onClick={() => navigate('/approvals')}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    返回
                </Button>
                <div>
                    <h1 className="text-3xl font-bold">发起审批</h1>
                    <p className="text-muted-foreground mt-1">创建新的审批申请</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        审批信息
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <Label htmlFor="workflow">选择审批流程</Label>
                            <Select value={selectedWorkflowId} onValueChange={setSelectedWorkflowId}>
                                <SelectTrigger id="workflow">
                                    <SelectValue placeholder="请选择审批流程" />
                                </SelectTrigger>
                                <SelectContent>
                                    {loading ? (
                                        <div className="p-4 text-center">
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mx-auto"></div>
                                        </div>
                                    ) : workflows.length === 0 ? (
                                        <div className="p-4 text-center text-muted-foreground">
                                            暂无可用流程
                                        </div>
                                    ) : (
                                        workflows.map((wf) => (
                                            <SelectItem key={wf.id} value={wf.id}>
                                                {wf.name || wf.workflow_name}
                                                {wf.code && <span className="text-xs text-gray-500 ml-2">({wf.code})</span>}
                                            </SelectItem>
                                        ))
                                    )}
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label htmlFor="title">申请标题</Label>
                            <Input
                                id="title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="请输入申请标题"
                                required
                            />
                        </div>

                        <div>
                            <Label htmlFor="description">申请说明</Label>
                            <Textarea
                                id="description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="请输入申请说明（可选）"
                                rows={4}
                            />
                        </div>

                        <div className="flex gap-2 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                className="flex-1"
                                onClick={() => navigate('/approvals')}
                            >
                                取消
                            </Button>
                            <Button
                                type="submit"
                                className="flex-1"
                                disabled={submitting}
                            >
                                <Send className="w-4 h-4 mr-2" />
                                {submitting ? '提交中...' : '提交申请'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

export default NewApproval;
