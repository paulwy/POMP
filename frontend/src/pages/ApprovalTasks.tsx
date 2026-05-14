import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, CheckCircle, XCircle, FileText, Plus, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { Badge } from '@/components/ui/Badge';
import { workflowApi, ApprovalTask } from '@/services/workflow';
import useAuthStore from '@/store/useAuthStore';
import { toast } from 'sonner';

interface ApprovalTasksProps {
    defaultTab?: string;
}

const ApprovalTasks: React.FC<ApprovalTasksProps> = ({ defaultTab = 'pending' }) => {
    const [pendingTasks, setPendingTasks] = useState<ApprovalTask[]>([]);
    const [initiatedTasks, setInitiatedTasks] = useState<ApprovalTask[]>([]);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState(defaultTab);
    const navigate = useNavigate();
    const { user } = useAuthStore();

    const fetchTasks = async () => {
        if (!user?.id) return;
        setLoading(true);
        try {
            const [pending, initiated] = await Promise.all([
                workflowApi.getMyTasks(user.id),
                workflowApi.getMyInitiatedTasks(user.id)
            ]);
            setPendingTasks(pending);
            setInitiatedTasks(initiated);
        } catch (error) {
            console.error('Failed to fetch tasks:', error);
            toast.error('获取任务失败');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTasks();
    }, [user?.id]);

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

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleString('zh-CN');
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">审批任务</h1>
                    <p className="text-muted-foreground mt-1">处理待审批事项和查看发起的申请</p>
                </div>
                <Button onClick={() => navigate('/approvals/new')}>
                    <Plus className="w-4 h-4 mr-2" />
                    发起审批
                </Button>
            </div>

            <Tabs defaultValue="pending" value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                    <TabsTrigger value="pending">
                        我的待办
                        {pendingTasks.length > 0 && (
                            <Badge variant="secondary" className="ml-2">{pendingTasks.length}</Badge>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="initiated">我发起的</TabsTrigger>
                </TabsList>

                <TabsContent value="pending" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Clock className="w-5 h-5" />
                                待审批任务
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="flex items-center justify-center py-8">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                                </div>
                            ) : pendingTasks.length === 0 ? (
                                <div className="text-center py-12 text-muted-foreground">
                                    <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                    <p>暂无待审批任务</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {pendingTasks.map((task) => (
                                        <div key={task.task_id} className="border rounded-lg p-4 hover:bg-accent transition-colors cursor-pointer"
                                            onClick={() => navigate(`/approvals/${task.task_id}`)}>
                                            <div className="flex items-start justify-between">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <h3 className="font-medium">{task.business_title}</h3>
                                                        {getStatusBadge(task.status)}
                                                    </div>
                                                    <p className="text-sm text-muted-foreground">
                                                        流程: {task.workflow_name} | 当前节点: {task.node_name}
                                                    </p>
                                                    <p className="text-sm text-muted-foreground">
                                                        发起人: {task.applicant_name} | 发起时间: {formatDate(task.created_at)}
                                                    </p>
                                                </div>
                                                <Button variant="ghost" size="sm">
                                                    <Eye className="w-4 h-4 mr-1" />
                                                    查看
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="initiated" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="w-5 h-5" />
                                我发起的审批
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="flex items-center justify-center py-8">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                                </div>
                            ) : initiatedTasks.length === 0 ? (
                                <div className="text-center py-12 text-muted-foreground">
                                    <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                    <p>暂无发起的审批</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {initiatedTasks.map((task) => (
                                        <div key={task.task_id} className="border rounded-lg p-4 hover:bg-accent transition-colors cursor-pointer"
                                            onClick={() => navigate(`/approvals/${task.task_id}`)}>
                                            <div className="flex items-start justify-between">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <h3 className="font-medium">{task.business_title}</h3>
                                                        {getStatusBadge(task.status)}
                                                    </div>
                                                    <p className="text-sm text-muted-foreground">
                                                        流程: {task.workflow_name} | 当前节点: {task.node_name}
                                                    </p>
                                                    <p className="text-sm text-muted-foreground">
                                                        发起时间: {formatDate(task.created_at)}
                                                    </p>
                                                </div>
                                                <Button variant="ghost" size="sm">
                                                    <Eye className="w-4 h-4 mr-1" />
                                                    查看
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default ApprovalTasks;
