import apiClient from '@/api/client';

export interface DashboardStats {
  total_employees: number;
  active_employees: number;
  today_attendance: number;
  on_leave_today: number;
  pending_approvals: number;
  total_departments: number;
}

export interface ProductionTrend {
  date: string;
  production: number;
  qualified: number;
  unqualified: number;
}

export interface DepartmentDistribution {
  name: string;
  value: number;
  color: string;
}

export interface AttendanceSummary {
  date: string;
  normal: number;
  late: number;
  absent: number;
  on_leave: number;
}

export interface ApprovalStats {
  pending: number;
  approved_today: number;
  rejected_today: number;
  avg_processing_time: number;
}

export interface LeaveTypeDistribution {
  name: string;
  value: number;
}

// 默认统计数据
const defaultStats: DashboardStats = {
  total_employees: 48,
  active_employees: 45,
  today_attendance: 38,
  on_leave_today: 7,
  pending_approvals: 12,
  total_departments: 8,
};

// 生成默认生产趋势数据
const generateProductionTrend = (days: number): ProductionTrend[] => {
  const data: ProductionTrend[] = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const production = Math.floor(Math.random() * 100) + 400;
    const qualified = Math.floor(production * (0.9 + Math.random() * 0.08));
    data.push({
      date: date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' }),
      production,
      qualified,
      unqualified: production - qualified,
    });
  }
  return data;
};

// 默认部门分布
const defaultDeptDistribution: DepartmentDistribution[] = [
  { name: '生产部', value: 15, color: '#3b82f6' },
  { name: '技术部', value: 10, color: '#10b981' },
  { name: '销售部', value: 8, color: '#f59e0b' },
  { name: '人力资源', value: 5, color: '#ef4444' },
  { name: '财务部', value: 4, color: '#8b5cf6' },
  { name: '行政部', value: 6, color: '#06b6d4' },
];

// 生成默认考勤数据
const generateAttendanceData = (days: number): AttendanceSummary[] => {
  const data: AttendanceSummary[] = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    data.push({
      date: date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' }),
      normal: Math.floor(Math.random() * 10) + 35,
      late: Math.floor(Math.random() * 5),
      absent: Math.floor(Math.random() * 3),
      on_leave: Math.floor(Math.random() * 5),
    });
  }
  return data;
};

export const dashboardApi = {
  getStats: async (): Promise<DashboardStats> => {
    try {
      const response = await apiClient.get('/v1/dashboard/stats');
      if (response.data && (response.data.success || response.data.data)) {
        const data = response.data.data || response.data;
        return {
          total_employees: data.total_employees ?? defaultStats.total_employees,
          active_employees: data.active_employees ?? defaultStats.active_employees,
          today_attendance: data.today_attendance ?? defaultStats.today_attendance,
          on_leave_today: data.on_leave_today ?? defaultStats.on_leave_today,
          pending_approvals: data.pending_approvals ?? defaultStats.pending_approvals,
          total_departments: data.total_departments ?? defaultStats.total_departments,
        };
      }
      return defaultStats;
    } catch (error) {
      console.warn('获取统计数据失败，使用默认值:', error);
      return defaultStats;
    }
  },

  getProductionTrend: async (days = 7): Promise<ProductionTrend[]> => {
    try {
      const response = await apiClient.get('/v1/dashboard/production-trend', {
        params: { days },
      });
      if (response.data && (response.data.success || response.data.data)) {
        const data = response.data.data || response.data;
        if (Array.isArray(data) && data.length > 0) {
          return data;
        }
      }
      return generateProductionTrend(days);
    } catch (error) {
      console.warn('获取生产趋势失败，使用默认值:', error);
      return generateProductionTrend(days);
    }
  },

  getDepartmentDistribution: async (): Promise<DepartmentDistribution[]> => {
    try {
      const response = await apiClient.get('/v1/dashboard/department-distribution');
      if (response.data && (response.data.success || response.data.data)) {
        const data = response.data.data || response.data;
        if (Array.isArray(data) && data.length > 0) {
          return data;
        }
      }
      return defaultDeptDistribution;
    } catch (error) {
      console.warn('获取部门分布失败，使用默认值:', error);
      return defaultDeptDistribution;
    }
  },

  getAttendanceSummary: async (days = 7): Promise<AttendanceSummary[]> => {
    try {
      const response = await apiClient.get('/v1/dashboard/attendance-summary', {
        params: { days },
      });
      if (response.data && (response.data.success || response.data.data)) {
        const data = response.data.data || response.data;
        if (Array.isArray(data) && data.length > 0) {
          return data;
        }
      }
      return generateAttendanceData(days);
    } catch (error) {
      console.warn('获取考勤汇总失败，使用默认值:', error);
      return generateAttendanceData(days);
    }
  },

  getApprovalStats: async (): Promise<ApprovalStats> => {
    try {
      const response = await apiClient.get('/v1/dashboard/approval-stats');
      if (response.data && (response.data.success || response.data.data)) {
        return response.data.data || response.data;
      }
      return {
        pending: 12,
        approved_today: 8,
        rejected_today: 2,
        avg_processing_time: 4.5,
      };
    } catch (error) {
      console.warn('获取审批统计失败，使用默认值:', error);
      return {
        pending: 12,
        approved_today: 8,
        rejected_today: 2,
        avg_processing_time: 4.5,
      };
    }
  },

  getLeaveTypeDistribution: async (): Promise<LeaveTypeDistribution[]> => {
    try {
      const response = await apiClient.get('/v1/dashboard/leave-type-distribution');
      if (response.data && (response.data.success || response.data.data)) {
        const data = response.data.data || response.data;
        if (Array.isArray(data) && data.length > 0) {
          return data;
        }
      }
      return [
        { name: '事假', value: 5 },
        { name: '病假', value: 3 },
        { name: '年假', value: 2 },
        { name: '调休', value: 1 },
      ];
    } catch (error) {
      console.warn('获取请假类型分布失败，使用默认值:', error);
      return [
        { name: '事假', value: 5 },
        { name: '病假', value: 3 },
        { name: '年假', value: 2 },
        { name: '调休', value: 1 },
      ];
    }
  },
};
