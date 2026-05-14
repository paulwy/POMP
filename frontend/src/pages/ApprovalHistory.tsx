import React, { useState, useEffect } from 'react';
import { FileText, CheckCircle, XCircle, Clock, User, Calendar, FileEdit } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { workflowApi, ApprovalTask } from '@/services/workflow';
import { cmsApi, Article } from '@/services/cms';
import { toast } from 'sonner';
import useAuthStore from '@/store/useAuthStore';

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const ApprovalHistory: React.FC = () => {
  const [workflowHistory, setWorkflowHistory] = useState<ApprovalTask[]>([]);
  const [myInitiatedHistory, setMyInitiatedHistory] = useState<ApprovalTask[]>([]);
  const [articleHistory, setArticleHistory] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);
  const [myInitiatedLoading, setMyInitiatedLoading] = useState(false);
  const [articlesLoading, setArticlesLoading] = useState(false);

  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    if (!user) return;
    
    setLoading(true);
    setMyInitiatedLoading(true);
    setArticlesLoading(true);
    try {
      const workflowData = await workflowApi.getApprovalHistory(user.id);
      setWorkflowHistory(Array.isArray(workflowData) ? workflowData : []);
      
      const myInitiatedData = await workflowApi.getMyInitiatedHistory(user.id);
      setMyInitiatedHistory(Array.isArray(myInitiatedData) ? myInitiatedData : []);
      
      const articleData = await cmsApi.getReviewedArticles();
      setArticleHistory(Array.isArray(articleData) ? articleData : []);
    } catch (error) {
      console.error('获取审批历史失败:', error);
      toast.error('获取审批历史失败');
      setWorkflowHistory([]);
      setMyInitiatedHistory([]);
      setArticleHistory([]);
    } finally {
      setLoading(false);
      setMyInitiatedLoading(false);
      setArticlesLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return <Badge variant="success">已通过</Badge>;
      case 'rejected':
        return <Badge variant="destructive">已拒绝</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">审批历史</h1>
          <p className="text-muted-foreground mt-1">查看已处理的审批记录</p>
        </div>
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">
            <FileText className="mr-2 h-4 w-4" />
            全部 {workflowHistory.length + myInitiatedHistory.length + articleHistory.length > 0 && (
              <Badge variant="secondary">{workflowHistory.length + myInitiatedHistory.length + articleHistory.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="workflow">
            <CheckCircle className="mr-2 h-4 w-4" />
            工作流审批 {workflowHistory.length > 0 && (
              <Badge variant="secondary">{workflowHistory.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="initiated">
            <FileEdit className="mr-2 h-4 w-4" />
            我发起的 {myInitiatedHistory.length > 0 && (
              <Badge variant="secondary">{myInitiatedHistory.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="articles">
            <FileText className="mr-2 h-4 w-4" />
            文章审核 {articleHistory.length > 0 && (
              <Badge variant="secondary">{articleHistory.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4">
          {(loading || myInitiatedLoading || articlesLoading) ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : workflowHistory.length === 0 && myInitiatedHistory.length === 0 && articleHistory.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CheckCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg text-muted-foreground">暂无审批历史记录</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {workflowHistory.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    工作流审批历史 ({workflowHistory.length})
                  </h3>
                  <div className="grid gap-4">
                    {workflowHistory.map((task) => (
                      <Card key={task.task_id} className="hover:shadow-md transition-shadow">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <CardTitle className="text-lg flex items-center gap-2">
                                {task.status === 'approved' ? (
                                  <CheckCircle className="h-5 w-5 text-success" />
                                ) : (
                                  <XCircle className="h-5 w-5 text-destructive" />
                                )}
                                {task.workflow_name}
                              </CardTitle>
                              <Badge variant="outline" className="mt-2">
                                {task.node_name}
                              </Badge>
                            </div>
                            {getStatusBadge(task.status)}
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span className="text-muted-foreground">申请人:</span>
                              <span className="font-medium">{task.applicant_name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span className="text-muted-foreground">审批时间:</span>
                              <span>{formatDate(task.created_at)}</span>
                            </div>
                          </div>
                          {task.applicant_department && (
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground">部门:</span>
                              <span>{task.applicant_department}</span>
                            </div>
                          )}
                          {task.business_title && (
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground">事项:</span>
                              <span>{task.business_title}</span>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {myInitiatedHistory.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <FileEdit className="h-5 w-5 text-primary" />
                    我发起的审批历史 ({myInitiatedHistory.length})
                  </h3>
                  <div className="grid gap-4">
                    {myInitiatedHistory.map((task) => (
                      <Card key={task.task_id} className="hover:shadow-md transition-shadow">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <CardTitle className="text-lg flex items-center gap-2">
                                {task.status === 'approved' ? (
                                  <CheckCircle className="h-5 w-5 text-success" />
                                ) : task.status === 'rejected' ? (
                                  <XCircle className="h-5 w-5 text-destructive" />
                                ) : (
                                  <FileText className="h-5 w-5 text-warning" />
                                )}
                                {task.workflow_name}
                              </CardTitle>
                              <Badge variant="outline" className="mt-2">
                                {task.node_name}
                              </Badge>
                            </div>
                            {getStatusBadge(task.status)}
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span className="text-muted-foreground">申请人:</span>
                              <span className="font-medium">{task.applicant_name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span className="text-muted-foreground">申请时间:</span>
                              <span>{formatDate(task.created_at)}</span>
                            </div>
                          </div>
                          {task.applicant_department && (
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground">部门:</span>
                              <span>{task.applicant_department}</span>
                            </div>
                          )}
                          {task.business_title && (
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground">事项:</span>
                              <span>{task.business_title}</span>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {articleHistory.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-success" />
                    文章审核历史 ({articleHistory.length})
                  </h3>
                  <div className="grid gap-4">
                    {articleHistory.map((article) => (
                      <Card key={article.id} className="hover:shadow-md transition-shadow">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <CardTitle className="text-lg flex items-center gap-2">
                                {article.status === 'published' ? (
                                  <CheckCircle className="h-5 w-5 text-success" />
                                ) : article.status === 'rejected' ? (
                                  <XCircle className="h-5 w-5 text-destructive" />
                                ) : (
                                  <FileText className="h-5 w-5 text-warning" />
                                )}
                                {article.title}
                              </CardTitle>
                              <Badge variant="outline" className="mt-2">
                                {article.categoryCode}
                              </Badge>
                            </div>
                            {getStatusBadge(article.status)}
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span className="text-muted-foreground">作者:</span>
                              <span className="font-medium">{article.authorName || '未知'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span className="text-muted-foreground">审核时间:</span>
                              <span>{formatDate(article.createdAt || '')}</span>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {article.summary || '暂无摘要'}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="workflow" className="mt-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : workflowHistory.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CheckCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg text-muted-foreground">暂无工作流审批历史</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {workflowHistory.map((task) => (
                <Card key={task.task_id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg flex items-center gap-2">
                          {task.status === 'approved' ? (
                            <CheckCircle className="h-5 w-5 text-success" />
                          ) : (
                            <XCircle className="h-5 w-5 text-destructive" />
                          )}
                          {task.workflow_name}
                        </CardTitle>
                        <Badge variant="outline" className="mt-2">
                          {task.node_name}
                        </Badge>
                      </div>
                      {getStatusBadge(task.status)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">申请人:</span>
                        <span className="font-medium">{task.applicant_name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">审批时间:</span>
                        <span>{formatDate(task.created_at)}</span>
                      </div>
                    </div>
                    {task.applicant_department && (
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">部门:</span>
                        <span>{task.applicant_department}</span>
                      </div>
                    )}
                    {task.business_title && (
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">事项:</span>
                        <span>{task.business_title}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="initiated" className="mt-4">
          {myInitiatedLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : myInitiatedHistory.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CheckCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg text-muted-foreground">暂无我发起的审批历史</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {myInitiatedHistory.map((task) => (
                <Card key={task.task_id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg flex items-center gap-2">
                          {task.status === 'approved' ? (
                            <CheckCircle className="h-5 w-5 text-success" />
                          ) : task.status === 'rejected' ? (
                            <XCircle className="h-5 w-5 text-destructive" />
                          ) : (
                            <FileText className="h-5 w-5 text-warning" />
                          )}
                          {task.workflow_name}
                        </CardTitle>
                        <Badge variant="outline" className="mt-2">
                          {task.node_name}
                        </Badge>
                      </div>
                      {getStatusBadge(task.status)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">申请人:</span>
                        <span className="font-medium">{task.applicant_name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">申请时间:</span>
                        <span>{formatDate(task.created_at)}</span>
                      </div>
                    </div>
                    {task.applicant_department && (
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">部门:</span>
                        <span>{task.applicant_department}</span>
                      </div>
                    )}
                    {task.business_title && (
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">事项:</span>
                        <span>{task.business_title}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="articles" className="mt-4">
          {articlesLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : articleHistory.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CheckCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg text-muted-foreground">暂无文章审核历史</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {articleHistory.map((article) => (
                <Card key={article.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg flex items-center gap-2">
                          {article.status === 'published' ? (
                            <CheckCircle className="h-5 w-5 text-success" />
                          ) : (
                            <XCircle className="h-5 w-5 text-destructive" />
                          )}
                          {article.title}
                        </CardTitle>
                        <Badge variant="outline" className="mt-2">
                          {article.categoryCode}
                        </Badge>
                      </div>
                      {getStatusBadge(article.status)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">作者:</span>
                        <span className="font-medium">{article.authorName || '未知'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">审核时间:</span>
                        <span>{formatDate(article.createdAt || '')}</span>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {article.summary || '暂无摘要'}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ApprovalHistory;