import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  CheckCircle, 
  FileText, 
  Clock, 
  Calendar,
  Bell,
  User,
  TrendingUp,
  ArrowRight,
  Settings,
  Building2,
  LayoutDashboard
} from 'lucide-react';
import { Link } from 'react-router-dom';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import useAuthStore from '@/store/useAuthStore';
import { cmsApi, Article } from '@/services/cms';
import { workflowApi } from '@/services/workflow';
import { departmentApi } from '@/services/organization';
import { organizationApi } from '@/services/organization';
import { toast } from 'sonner';

const Workbench = () => {
  const { user } = useAuthStore();
  const [pendingArticles, setPendingArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);
  const [configStats, setConfigStats] = useState({
    workflows: 0,
    approvalRules: 0,
    departments: 0,
    positions: 0,
  });

  useEffect(() => {
    fetchPendingArticles();
    fetchConfigStats();
  }, []);

  const fetchConfigStats = async () => {
    try {
      const [workflows, deptResult, positions, rules] = await Promise.all([
        workflowApi.getWorkflows(),
        departmentApi.getDepartments(1, 100),
        organizationApi.getPositions(),
        organizationApi.getApprovalRules(),
      ]);
      setConfigStats({
        workflows: workflows.data?.length || 0,
        approvalRules: rules.length || 0,
        departments: deptResult.data?.length || 0,
        positions: positions.length || 0,
      });
    } catch (error) {
      console.error('获取配置统计数据失败:', error);
    }
  };

  const fetchPendingArticles = async () => {
    setLoading(true);
    try {
      const data = await cmsApi.getArticles('pending_review');
      setPendingArticles(data);
    } catch (error) {
      console.error('获取待审核文章失败:', error);
      toast.error('获取待审核文章失败');
    } finally {
      setLoading(false);
    }
  };

  // 我发起的审批（模拟数据）
  const myRequests = [
    { id: 1, title: '请假申请 - 年假', type: '请假', status: '审批中', currentApprover: '部门经理' },
    { id: 2, title: '报销申请 - 招待费', type: '报销', status: '已通过', currentApprover: '' },
  ];

  // 待办审批 - 使用真实的待审核文章
  const pendingApprovals = pendingArticles.map((article, index) => ({
    id: index + 1,
    title: article.title,
    type: article.categoryCode || '文章',
    createTime: article.createdAt ? new Date(article.createdAt).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }) : '-',
    status: 'pending',
    articleId: article.id,
  }));

  // 近期日程
  const upcomingEvents = [
    { id: 1, title: '周例会', date: '今天 14:00', location: '会议室A' },
    { id: 2, title: '项目进度汇报', date: '明天 10:00', location: '会议室B' },
    { id: 3, title: '客户拜访', date: '本周三 14:00', location: '客户公司' },
  ];

  // 快捷入口
  const quickLinks = [
    { title: '发起审批', icon: FileText, path: '/approvals' },
    { title: '我的日程', icon: Calendar, path: '/profile' },
    { title: '个人信息', icon: User, path: '/profile' },
  ];

  // 个人统计
  const personalStats = [
    { title: '待审批', value: pendingApprovals.length, icon: CheckCircle, color: 'text-warning' },
    { title: '本月完成', value: '12', icon: TrendingUp, color: 'text-success' },
    { title: '我的发起', value: myRequests.length, icon: FileText, color: 'text-primary' },
  ];

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          {/* 欢迎区域 */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold">
              早上好，{user?.name || user?.username || '用户'}！
            </h2>
            <p className="text-muted-foreground mt-1">这是您今天的工作台概览</p>
          </div>
          
          {/* 个人统计卡片 */}
          <div className="grid grid-cols-3 gap-6 mb-6">
            {personalStats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <Card key={index} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">{stat.title}</p>
                        <p className="text-3xl font-bold mt-2">{stat.value}</p>
                      </div>
                      <div className={`p-3 rounded-full ${stat.color.replace('text-', 'bg-')}/10`}>
                        <Icon className={`h-6 w-6 ${stat.color}`} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          
          <div className="grid grid-cols-3 gap-6 mb-6">
            {/* 待办审批 */}
            <Card className="col-span-2">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CheckCircle className="h-5 w-5 text-warning" />
                  待我审批
                </CardTitle>
                <Link to="/approvals">
                  <Button variant="ghost" size="sm" className="text-sm">
                    查看全部 <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {loading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
                    </div>
                  ) : pendingApprovals.length > 0 ? (
                    pendingApprovals.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-accent/50 transition-colors border border-border">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-warning" />
                          <div>
                            <p className="font-medium">{item.title}</p>
                            <p className="text-sm text-muted-foreground">{item.type} · {item.createTime}</p>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => window.location.href = '/approvals'}>处理</Button>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <CheckCircle className="h-12 w-12 mx-auto mb-2 opacity-30" />
                      <p>暂无待审批事项</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            
            {/* 近期日程 */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Calendar className="h-5 w-5 text-primary" />
                  近期日程
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {upcomingEvents.map((event) => (
                    <div key={event.id} className="p-3 rounded-lg bg-accent/30">
                      <p className="font-medium">{event.title}</p>
                      <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {event.date}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{event.location}</p>
                    </div>
                  ))}
                </div>
                <Button variant="ghost" className="w-full mt-4 text-sm">查看日历</Button>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid grid-cols-3 gap-6">
            {/* 我发起的 */}
            <Card className="col-span-2">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText className="h-5 w-5 text-primary" />
                  我发起的审批
                </CardTitle>
                <Button variant="ghost" size="sm" className="text-sm">
                  查看全部 <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {myRequests.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-accent/50 transition-colors border border-border">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${
                          item.status === '已通过' ? 'bg-green-500' : 
                          item.status === '已拒绝' ? 'bg-red-500' : 'bg-yellow-500'
                        }`} />
                        <div>
                          <p className="font-medium">{item.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {item.type} · {item.status}
                            {item.currentApprover && ` · 当前审批：${item.currentApprover}`}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            {/* 系统配置概览 */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Settings className="h-5 w-5 text-warning" />
                  系统配置概览
                </CardTitle>
                <Link to="/system/config-center">
                  <Button variant="ghost" size="sm" className="text-xs">
                    详情 <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <div className="flex items-center gap-2">
                      <LayoutDashboard className="h-4 w-4 text-primary" />
                      <span className="text-xs text-muted-foreground">工作流</span>
                    </div>
                    <p className="text-lg font-bold text-primary mt-1">{configStats.workflows}</p>
                  </div>
                  <div className="p-2 rounded-lg bg-success/10">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-success" />
                      <span className="text-xs text-muted-foreground">审批规则</span>
                    </div>
                    <p className="text-lg font-bold text-success mt-1">{configStats.approvalRules}</p>
                  </div>
                  <div className="p-2 rounded-lg bg-info/10">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-info" />
                      <span className="text-xs text-muted-foreground">部门</span>
                    </div>
                    <p className="text-lg font-bold text-info mt-1">{configStats.departments}</p>
                  </div>
                  <div className="p-2 rounded-lg bg-warning/10">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-warning" />
                      <span className="text-xs text-muted-foreground">职位</span>
                    </div>
                    <p className="text-lg font-bold text-warning mt-1">{configStats.positions}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* 快捷入口 */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Bell className="h-5 w-5 text-info" />
                  快捷入口
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {quickLinks.map((link, index) => {
                    const Icon = link.icon;
                    return (
                      <Link key={index} to={link.path}>
                        <Button variant="ghost" className="w-full justify-start gap-3">
                          <Icon className="h-4 w-4" />
                          {link.title}
                        </Button>
                      </Link>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Workbench;
