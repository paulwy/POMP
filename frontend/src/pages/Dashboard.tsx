import { useState, useEffect } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from 'recharts';
import {
  Users,
  UserCheck,
  Clock,
  AlertCircle,
  Building2,
  CheckCircle,
} from 'lucide-react';
import {
  ChartContainer,
  StatCard,
  chartColors,
  chartDefaults,
} from '@/components/ui';
import { dashboardApi, DashboardStats, ProductionTrend, DepartmentDistribution, AttendanceSummary } from '@/services/dashboard';

const COLORS = [
  chartColors.primary,
  chartColors.secondary,
  chartColors.success,
  chartColors.warning,
  chartColors.danger,
  chartColors.gray,
];

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [productionTrend, setProductionTrend] = useState<ProductionTrend[]>([]);
  const [departmentDistribution, setDepartmentDistribution] = useState<DepartmentDistribution[]>([]);
  const [attendanceSummary, setAttendanceSummary] = useState<AttendanceSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [statsData, trendData, deptData, attendanceData] = await Promise.all([
        dashboardApi.getStats(),
        dashboardApi.getProductionTrend(7),
        dashboardApi.getDepartmentDistribution(),
        dashboardApi.getAttendanceSummary(7),
      ]);

      setStats(statsData);
      setProductionTrend(trendData);
      setDepartmentDistribution(deptData);
      setAttendanceSummary(attendanceData);
    } catch (error) {
      console.error('加载仪表盘数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">仪表盘</h1>
          <p className="text-muted-foreground">欢迎回来！以下是系统概览。</p>
        </div>
        <div className="text-sm text-muted-foreground">
          最后更新: {new Date().toLocaleString('zh-CN')}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="员工总数"
          value={stats?.total_employees || 0}
          description="系统注册员工"
          icon={<Users className="h-6 w-6" />}
          iconColor="text-primary"
          trend={{ value: 3.2, direction: 'up' }}
        />
        <StatCard
          title="在职员工"
          value={stats?.active_employees || 0}
          description="当前在职员工"
          icon={<UserCheck className="h-6 w-6" />}
          iconColor="text-success"
          trend={{ value: 1.5, direction: 'up' }}
        />
        <StatCard
          title="今日考勤"
          value={stats?.today_attendance || 0}
          description="今日已签到"
          icon={<Clock className="h-6 w-6" />}
          iconColor="text-warning"
          trend={{ value: 2.1, direction: 'up' }}
        />
        <StatCard
          title="待审批"
          value={stats?.pending_approvals || 0}
          description="待审批任务"
          icon={<AlertCircle className="h-6 w-6" />}
          iconColor="text-destructive"
          trend={{ value: 5, direction: 'down' }}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-4">
          <ChartContainer
            title="生产趋势"
            subtitle="近7天产量与合格率统计"
            height={320}
          >
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={productionTrend}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorProduction" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={chartColors.primary} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={chartColors.primary} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorQualified" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={chartColors.success} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={chartColors.success} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={chartDefaults.grid.color} />
                <XAxis
                  dataKey="date"
                  tick={{ fill: chartDefaults.axis.tickColor, fontSize: chartDefaults.axis.tickFontSize }}
                />
                <YAxis
                  tick={{ fill: chartDefaults.axis.tickColor, fontSize: chartDefaults.axis.tickFontSize }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    borderColor: 'hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="production"
                  stroke={chartColors.primary}
                  fillOpacity={1}
                  fill="url(#colorProduction)"
                  name="产量"
                />
                <Area
                  type="monotone"
                  dataKey="qualified"
                  stroke={chartColors.success}
                  fillOpacity={1}
                  fill="url(#colorQualified)"
                  name="合格数"
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>

        <div className="col-span-3">
          <ChartContainer
            title="部门分布"
            subtitle="各部门员工占比"
            height={320}
          >
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={departmentDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                  labelLine={false}
                >
                  {departmentDistribution.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    borderColor: 'hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number) => [`${value} 人`, '员工数']}
                />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <ChartContainer
          title="考勤汇总"
          subtitle="近7天考勤情况统计"
          height={300}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={attendanceSummary}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={chartDefaults.grid.color} />
              <XAxis
                dataKey="date"
                tick={{ fill: chartDefaults.axis.tickColor, fontSize: chartDefaults.axis.tickFontSize }}
              />
              <YAxis
                tick={{ fill: chartDefaults.axis.tickColor, fontSize: chartDefaults.axis.tickFontSize }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  borderColor: 'hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Bar dataKey="normal" fill={chartColors.success} name="正常" />
              <Bar dataKey="late" fill={chartColors.warning} name="迟到" />
              <Bar dataKey="absent" fill={chartColors.danger} name="缺勤" />
              <Bar dataKey="on_leave" fill={chartColors.gray} name="请假" />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>

        <ChartContainer
          title="快速操作"
          subtitle="常用功能入口"
          height={300}
        >
          <div className="grid grid-cols-2 gap-4 p-4">
            <div className="flex flex-col items-center justify-center p-6 rounded-lg border bg-card hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer">
              <Building2 className="h-8 w-8 mb-2 text-primary" />
              <span className="text-sm font-medium">组织架构</span>
              <span className="text-xs text-muted-foreground">管理部门职位</span>
            </div>
            <div className="flex flex-col items-center justify-center p-6 rounded-lg border bg-card hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer">
              <Users className="h-8 w-8 mb-2 text-primary" />
              <span className="text-sm font-medium">员工管理</span>
              <span className="text-xs text-muted-foreground">员工信息管理</span>
            </div>
            <div className="flex flex-col items-center justify-center p-6 rounded-lg border bg-card hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer">
              <CheckCircle className="h-8 w-8 mb-2 text-success" />
              <span className="text-sm font-medium">审批任务</span>
              <span className="text-xs text-muted-foreground">{stats?.pending_approvals || 0} 项待审批</span>
            </div>
            <div className="flex flex-col items-center justify-center p-6 rounded-lg border bg-card hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer">
              <Clock className="h-8 w-8 mb-2 text-warning" />
              <span className="text-sm font-medium">考勤记录</span>
              <span className="text-xs text-muted-foreground">查看考勤数据</span>
            </div>
          </div>
        </ChartContainer>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="p-6 rounded-lg border bg-card">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-primary/10">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">部门数量</p>
              <p className="text-2xl font-bold">{stats?.total_departments || 0}</p>
            </div>
          </div>
        </div>
        <div className="p-6 rounded-lg border bg-card">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-success/10">
              <CheckCircle className="h-6 w-6 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">今日请假</p>
              <p className="text-2xl font-bold">{stats?.on_leave_today || 0} 人</p>
            </div>
          </div>
        </div>
        <div className="p-6 rounded-lg border bg-card">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-primary/10">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">本月新增</p>
              <p className="text-2xl font-bold">+12 人</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
