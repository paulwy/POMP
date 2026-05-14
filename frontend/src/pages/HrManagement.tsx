import React, { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Users,
  Briefcase,
  Calendar,
  Clock,
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  FileText,
  Clock3,
  CalendarDays,
  User,
  CheckCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { hrApi, Employee, Position, AttendanceRecord, LeaveRequest, AttendanceStatistics, CreateEmployeeRequest, UpdateEmployeeRequest, CreatePositionRequest, CreateLeaveRequest } from '@/services/hr';
import { departmentApi, Department, POSITION_TEMPLATES } from '@/services/organization';
import { toast } from 'sonner';
import dayjs from 'dayjs';

const HrManagement: React.FC = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('employees');

  useEffect(() => {
    const path = location.pathname;
    if (path.includes('/hr/attendance')) {
      setActiveTab('attendance');
    } else if (path.includes('/hr/leave')) {
      setActiveTab('leave');
    } else if (path.includes('/hr/employees')) {
      setActiveTab('employees');
    } else if (path === '/hr') {
      setActiveTab('employees');
    }
  }, [location.pathname]);

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [attendanceStats, setAttendanceStats] = useState<AttendanceStatistics | null>(null);
  const [todayAttendance, setTodayAttendance] = useState<AttendanceRecord | null>(null);

  const [loading, setLoading] = useState(false);

  const [showEmployeeDialog, setShowEmployeeDialog] = useState(false);
  const [showPositionDialog, setShowPositionDialog] = useState(false);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);

  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [editingPosition, setEditingPosition] = useState<Position | null>(null);

  const [employeeForm, setEmployeeForm] = useState<CreateEmployeeRequest>({
    name: '',
    email: '',
    phone: '',
    username: '',
    employee_no: '',
  });

  const [positionForm, setPositionForm] = useState<CreatePositionRequest>({
    name: '',
    code: '',
    description: '',
  });

  const [selectedPositionTemplate, setSelectedPositionTemplate] = useState('');

  const [leaveForm, setLeaveForm] = useState<CreateLeaveRequest>({
    leave_type: 'annual',
    start_date: dayjs().format('YYYY-MM-DD'),
    end_date: dayjs().add(1, 'day').format('YYYY-MM-DD'),
    reason: '',
  });

  useEffect(() => {
    if (activeTab === 'employees') {
      fetchEmployees();
      fetchPositions();
      fetchDepartments();
    } else if (activeTab === 'positions') {
      fetchPositions();
    } else if (activeTab === 'attendance') {
      fetchTodayAttendance();
      fetchAttendanceStatistics();
      fetchAttendanceRecords();
    } else if (activeTab === 'leave') {
      fetchLeaveRequests();
    }
  }, [activeTab]);

  const departmentNameById = useMemo(() => {
    const m = new Map<string, string>();
    departments.forEach((d) => m.set(d.id, d.name));
    return m;
  }, [departments]);

  /** 列表展示：优先接口返回的 department_name，否则用 department_id 在部门列表中解析 */
  const employeeDepartmentLabel = (emp: Employee) => {
    const fromApi = emp.department_name?.trim();
    if (fromApi) return fromApi;
    const id = emp.department_id?.trim();
    if (id) return departmentNameById.get(id) || '-';
    return '-';
  };

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const data = await hrApi.getEmployees(1, 10);
      setEmployees(data.data);
    } catch (error) {
      console.error('获取员工失败:', error);
      toast.error('获取员工列表失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchPositions = async () => {
    setLoading(true);
    try {
      const data = await hrApi.getPositions(1, 100);
      setPositions(data.data);
    } catch (error) {
      console.error('获取职位失败:', error);
      toast.error('获取职位列表失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const data = await departmentApi.getDepartments(1, 100);
      setDepartments(data.data);
    } catch (error) {
      console.error('获取部门失败:', error);
    }
  };

  const fetchAttendanceRecords = async () => {
    try {
      const data = await hrApi.getAttendanceRecords(1, 20);
      setAttendanceRecords(data.data);
    } catch (error) {
      console.error('获取考勤记录失败:', error);
    }
  };

  const fetchTodayAttendance = async () => {
    try {
      const data = await hrApi.getTodayAttendance();
      setTodayAttendance(data);
    } catch (error) {
      console.error('获取今日考勤失败:', error);
    }
  };

  const fetchAttendanceStatistics = async () => {
    try {
      const now = dayjs();
      const data = await hrApi.getAttendanceStatistics(now.year(), now.month());
      setAttendanceStats(data);
    } catch (error) {
      console.error('获取考勤统计失败:', error);
    }
  };

  const fetchLeaveRequests = async () => {
    try {
      const data = await hrApi.getMyLeaveRequests(1, 20);
      setLeaveRequests(data.data);
    } catch (error) {
      console.error('获取请假申请失败:', error);
      toast.error('获取请假申请失败');
    }
  };

  const resetEmployeeForm = () => {
    setEmployeeForm({
      name: '',
      email: '',
      username: '',
      phone: '',
      position_id: undefined,
      department_id: undefined,
      employee_no: '',
      hire_date: '',
    });
  };

  const resetPositionForm = () => {
    setPositionForm({
      name: '',
      code: '',
      description: '',
    });
    setSelectedPositionTemplate('');
  };

  const resetLeaveForm = () => {
    setLeaveForm({
      leave_type: 'annual',
      start_date: dayjs().format('YYYY-MM-DD'),
      end_date: dayjs().add(1, 'day').format('YYYY-MM-DD'),
      reason: '',
    });
  };

  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [createdEmployeeInfo, setCreatedEmployeeInfo] = useState<{username: string; employee_no: string; default_password: string} | null>(null);

  const handleCreateEmployee = async () => {
    if (!employeeForm.name.trim() || !employeeForm.email.trim() || !employeeForm.username?.trim() || !employeeForm.employee_no?.trim() || !employeeForm.hire_date) {
      toast.error('请填写必填字段（姓名、邮箱、用户名、工号、入职日期）');
      return;
    }
    try {
      const response = await hrApi.createEmployee({
        ...employeeForm,
        position_id: employeeForm.position_id ?? '',
        department_id: employeeForm.department_id ?? '',
      });
      // 后端返回的是 ApiResponse 包装的结构，需要从 data 中获取实际数据
      const apiResponse = response as unknown as { data: { default_password?: string } };
      const { default_password } = apiResponse.data;
      
      // 保存创建的员工信息并显示密码对话框
      setCreatedEmployeeInfo({
        username: employeeForm.username!,
        employee_no: employeeForm.employee_no!,
        default_password: default_password || ''
      });
      setShowPasswordDialog(true);
      
      setShowEmployeeDialog(false);
      resetEmployeeForm();
      fetchEmployees();
    } catch (error) {
      console.error('创建员工失败:', error);
      toast.error('创建员工失败');
    }
  };

  const handleUpdateEmployee = async () => {
    if (!editingEmployee) return;
    try {
      const updateData: UpdateEmployeeRequest = {
        name: employeeForm.name,
        email: employeeForm.email,
        phone: employeeForm.phone,
        // 必须始终序列化到 JSON：undefined 会被省略，后端会收到 None 并把库里的部门/职位清空
        position_id: employeeForm.position_id ?? '',
        department_id: employeeForm.department_id ?? '',
        employee_no: employeeForm.employee_no,
        hire_date: employeeForm.hire_date,
      };
      await hrApi.updateEmployee(editingEmployee.id, updateData);
      toast.success('员工信息更新成功');
      setShowEmployeeDialog(false);
      setEditingEmployee(null);
      resetEmployeeForm();
      fetchEmployees();
    } catch (error) {
      console.error('更新员工失败:', error);
      toast.error('更新员工失败');
    }
  };

  const handleDeleteEmployee = async (employee: Employee) => {
    if (!confirm(`确定要删除员工"${employee.name}"吗?`)) return;
    try {
      await hrApi.deleteEmployee(employee.id);
      toast.success('员工删除成功');
      fetchEmployees();
    } catch (error) {
      console.error('删除员工失败:', error);
      toast.error('删除员工失败');
    }
  };

  const handleCreatePosition = async () => {
    if (!positionForm.name.trim()) {
      toast.error('请输入职位名称');
      return;
    }
    try {
      await hrApi.createPosition(positionForm);
      toast.success('职位创建成功');
      setShowPositionDialog(false);
      resetPositionForm();
      fetchPositions();
    } catch (error) {
      console.error('创建职位失败:', error);
      toast.error('创建职位失败');
    }
  };

  const handleUpdatePosition = async () => {
    if (!editingPosition) return;
    try {
      await hrApi.updatePosition(editingPosition.id, {
        name: positionForm.name,
        code: positionForm.code,
        description: positionForm.description,
      });
      toast.success('职位更新成功');
      setShowPositionDialog(false);
      setEditingPosition(null);
      resetPositionForm();
      fetchPositions();
    } catch (error) {
      console.error('更新职位失败:', error);
      toast.error('更新职位失败');
    }
  };

  const handleDeletePosition = async (position: Position) => {
    if (!confirm(`确定要删除职位"${position.name}"吗?`)) return;
    try {
      await hrApi.deletePosition(position.id);
      toast.success('职位删除成功');
      fetchPositions();
    } catch (error) {
      console.error('删除职位失败:', error);
      toast.error('删除职位失败');
    }
  };

  const handleCheckIn = async () => {
    try {
      await hrApi.checkIn({});
      toast.success('打卡成功');
      fetchTodayAttendance();
      fetchAttendanceRecords();
    } catch (error) {
      console.error('打卡失败:', error);
      toast.error('打卡失败');
    }
  };

  const handleCheckOut = async () => {
    try {
      await hrApi.checkOut({});
      toast.success('签退成功');
      fetchTodayAttendance();
      fetchAttendanceRecords();
    } catch (error) {
      console.error('签退失败:', error);
      toast.error('签退失败');
    }
  };

  const handleCreateLeaveRequest = async () => {
    if (!leaveForm.start_date || !leaveForm.end_date) {
      toast.error('请选择日期');
      return;
    }
    try {
      await hrApi.createLeaveRequest(leaveForm);
      toast.success('请假申请提交成功');
      setShowLeaveDialog(false);
      resetLeaveForm();
      fetchLeaveRequests();
    } catch (error) {
      console.error('提交请假申请失败:', error);
      toast.error('提交请假申请失败');
    }
  };

  const handleCancelLeave = async (leave: LeaveRequest) => {
    if (!confirm(`确定要取消该请假申请吗?`)) return;
    try {
      await hrApi.updateLeaveRequest(leave.id, { status: 'cancelled' });
      toast.success('请假申请已取消');
      fetchLeaveRequests();
    } catch (error) {
      console.error('取消请假失败:', error);
      toast.error('取消请假失败');
    }
  };

  const openEmployeeDialog = async (employee?: Employee) => {
    try {
      if (departments.length === 0) {
        const d = await departmentApi.getDepartments(1, 100);
        setDepartments(d.data);
      }
    } catch (e) {
      console.error('预加载部门列表失败:', e);
    }
    if (employee) {
      setEditingEmployee(employee);
      setEmployeeForm({
        name: employee.name || '',
        email: employee.email || '',
        username: employee.username || '',
        phone: employee.phone || '',
        position_id: employee.position_id || '',
        department_id: employee.department_id || '',
        employee_no: employee.employee_no || '',
        hire_date: employee.hire_date || '',
      });
    } else {
      setEditingEmployee(null);
      resetEmployeeForm();
    }
    setShowEmployeeDialog(true);
  };

  const openPositionDialog = (position?: Position) => {
    if (position) {
      setEditingPosition(position);
      setPositionForm({
        name: position.name || '',
        code: position.code || '',
        description: position.description || '',
      });
    } else {
      setEditingPosition(null);
      resetPositionForm();
    }
    setShowPositionDialog(true);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      active: { label: '在职', variant: 'default' },
      inactive: { label: '离职', variant: 'destructive' },
      pending: { label: '待审批', variant: 'secondary' },
      approved: { label: '已批准', variant: 'default' },
      rejected: { label: '已拒绝', variant: 'destructive' },
      cancelled: { label: '已取消', variant: 'outline' },
    };
    const config = statusConfig[status.toLowerCase()] || { label: status, variant: 'outline' as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getLeaveTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      annual: '年假',
      sick: '病假',
      personal: '事假',
      maternity: '产假',
      paternity: '陪产假',
      other: '其他',
    };
    return types[type] || type;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">人力资源管理</h1>
          <p className="text-muted-foreground mt-1">员工信息、考勤和请假管理</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="employees" className="gap-2">
            <Users className="h-4 w-4" />
            员工管理
          </TabsTrigger>
          <TabsTrigger value="positions" className="gap-2">
            <Briefcase className="h-4 w-4" />
            职位管理
          </TabsTrigger>
          <TabsTrigger value="attendance" className="gap-2">
            <Calendar className="h-4 w-4" />
            考勤管理
          </TabsTrigger>
          <TabsTrigger value="leave" className="gap-2">
            <FileText className="h-4 w-4" />
            请假管理
          </TabsTrigger>
        </TabsList>

        <TabsContent value="employees" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">员工列表</h2>
            <Button onClick={() => openEmployeeDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              新增员工
            </Button>
          </div>

          <Card>
            <CardContent className="space-y-4">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : employees.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">暂无员工</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3 font-medium">员工编号</th>
                        <th className="text-left p-3 font-medium">姓名</th>
                        <th className="text-left p-3 font-medium">邮箱</th>
                        <th className="text-left p-3 font-medium">职位</th>
                        <th className="text-left p-3 font-medium">部门</th>
                        <th className="text-left p-3 font-medium">入职日期</th>
                        <th className="text-left p-3 font-medium">状态</th>
                        <th className="text-left p-3 font-medium">操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {employees.map((employee) => (
                        <tr key={employee.id} className="border-b hover:bg-accent/50">
                          <td className="p-3">{employee.employee_no}</td>
                          <td className="p-3">{employee.name}</td>
                          <td className="p-3">{employee.email}</td>
                          <td className="p-3">{employee.position_name || '-'}</td>
                          <td className="p-3">{employeeDepartmentLabel(employee)}</td>
                          <td className="p-3">{employee.hire_date ? dayjs(employee.hire_date).format('YYYY-MM-DD') : '-'}</td>
                          <td className="p-3">{getStatusBadge(employee.status)}</td>
                          <td className="p-3">
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" onClick={() => openEmployeeDialog(employee)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => handleDeleteEmployee(employee)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="positions" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">职位列表</h2>
            <Button onClick={() => openPositionDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              新增职位
            </Button>
          </div>

          <Card>
            <CardContent className="space-y-4">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : positions.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">暂无职位</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3 font-medium">职位名称</th>
                        <th className="text-left p-3 font-medium">职位代码</th>
                        <th className="text-left p-3 font-medium">描述</th>
                        <th className="text-left p-3 font-medium">创建时间</th>
                        <th className="text-left p-3 font-medium">操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {positions.map((position) => (
                        <tr key={position.id} className="border-b hover:bg-accent/50">
                          <td className="p-3 font-medium">{position.name}</td>
                          <td className="p-3">{position.code || '-'}</td>
                          <td className="p-3">{position.description || '-'}</td>
                          <td className="p-3">{dayjs(position.created_at).format('YYYY-MM-DD HH:mm')}</td>
                          <td className="p-3">
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" onClick={() => openPositionDialog(position)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => handleDeletePosition(position)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attendance" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Clock3 className="h-5 w-5" />
                今日打卡
              </CardTitle>
              <div className="flex gap-2">
                {!todayAttendance?.check_in && (
                  <Button onClick={handleCheckIn} className="bg-green-500 hover:bg-green-600">
                    <Check className="mr-2 h-4 w-4" />
                    打卡签到
                  </Button>
                )}
                {todayAttendance?.check_in && !todayAttendance?.check_out && (
                  <Button onClick={handleCheckOut} className="bg-orange-500 hover:bg-orange-600">
                    <X className="mr-2 h-4 w-4" />
                    打卡签退
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {todayAttendance ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-muted/50 rounded-lg p-4">
                    <p className="text-sm text-muted-foreground">签到时间</p>
                    <p className="text-xl font-semibold mt-1">{todayAttendance.check_in ? dayjs(todayAttendance.check_in).format('HH:mm:ss') : '未签到'}</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-4">
                    <p className="text-sm text-muted-foreground">签退时间</p>
                    <p className="text-xl font-semibold mt-1">{todayAttendance.check_out ? dayjs(todayAttendance.check_out).format('HH:mm:ss') : '未签退'}</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-4">
                    <p className="text-sm text-muted-foreground">工作时长</p>
                    <p className="text-xl font-semibold mt-1">{todayAttendance.work_hours ? `${todayAttendance.work_hours} 小时` : '-'}</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-4">
                    <p className="text-sm text-muted-foreground">加班时长</p>
                    <p className="text-xl font-semibold mt-1">{todayAttendance.overtime_hours ? `${todayAttendance.overtime_hours} 小时` : '-'}</p>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">暂无今日考勤记录</p>
              )}
            </CardContent>
          </Card>

          {attendanceStats && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarDays className="h-5 w-5" />
                  本月考勤统计
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="bg-muted/50 rounded-lg p-4">
                    <p className="text-sm text-muted-foreground">工作日数</p>
                    <p className="text-2xl font-semibold mt-1">{attendanceStats.work_days}</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-4">
                    <p className="text-sm text-muted-foreground">请假天数</p>
                    <p className="text-2xl font-semibold mt-1">{attendanceStats.leave_days}</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-4">
                    <p className="text-sm text-muted-foreground">迟到次数</p>
                    <p className="text-2xl font-semibold mt-1 text-warning">{attendanceStats.late_count}</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-4">
                    <p className="text-sm text-muted-foreground">早退次数</p>
                    <p className="text-2xl font-semibold mt-1 text-warning">{attendanceStats.early_leave_count}</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-4">
                    <p className="text-sm text-muted-foreground">加班时长</p>
                    <p className="text-2xl font-semibold mt-1 text-success">{attendanceStats.overtime_hours}h</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-4">
                    <p className="text-sm text-muted-foreground">应出勤天数</p>
                    <p className="text-2xl font-semibold mt-1">{attendanceStats.total_days}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                考勤记录
              </CardTitle>
            </CardHeader>
            <CardContent>
              {attendanceRecords.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">暂无考勤记录</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3 font-medium">日期</th>
                        <th className="text-left p-3 font-medium">签到</th>
                        <th className="text-left p-3 font-medium">签退</th>
                        <th className="text-left p-3 font-medium">工作时长</th>
                        <th className="text-left p-3 font-medium">迟到</th>
                        <th className="text-left p-3 font-medium">早退</th>
                        <th className="text-left p-3 font-medium">状态</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendanceRecords.map((record) => (
                        <tr key={record.id} className="border-b">
                          <td className="p-3">{dayjs(record.attendance_date).format('YYYY-MM-DD')}</td>
                          <td className="p-3">{record.check_in ? dayjs(record.check_in).format('HH:mm') : '-'}</td>
                          <td className="p-3">{record.check_out ? dayjs(record.check_out).format('HH:mm') : '-'}</td>
                          <td className="p-3">{record.work_hours ? `${record.work_hours}h` : '-'}</td>
                          <td className="p-3">{record.late_minutes ? `${record.late_minutes}分钟` : '-'}</td>
                          <td className="p-3">{record.early_leave_minutes ? `${record.early_leave_minutes}分钟` : '-'}</td>
                          <td className="p-3">{record.status || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leave" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">我的请假申请</h2>
            <Button onClick={() => setShowLeaveDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              申请请假
            </Button>
          </div>

          <Card>
            <CardContent className="space-y-4">
              {leaveRequests.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">暂无请假申请</p>
              ) : (
                <div className="space-y-4">
                  {leaveRequests.map((leave) => (
                    <div key={leave.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{getLeaveTypeLabel(leave.leave_type)}</span>
                              {getStatusBadge(leave.status)}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {dayjs(leave.start_date).format('YYYY-MM-DD')} 至 {dayjs(leave.end_date).format('YYYY-MM-DD')}
                              <span className="mx-2">|</span>
                              共 {leave.total_days} 天
                            </p>
                            {leave.reason && (
                              <p className="text-sm mt-1">{leave.reason}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {leave.status === 'pending' && (
                            <Button size="sm" variant="outline" onClick={() => handleCancelLeave(leave)}>
                              取消申请
                            </Button>
                          )}
                        </div>
                      </div>
                      {leave.approved_at && (
                        <div className="mt-3 pt-3 border-t text-sm text-muted-foreground">
                          {leave.status === 'approved' ? '已批准' : '已拒绝'}
                          {leave.remark && <span className="ml-2">备注: {leave.remark}</span>}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={showEmployeeDialog} onOpenChange={setShowEmployeeDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingEmployee ? '编辑员工' : '新增员工'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="emp-name">姓名 *</Label>
              <Input id="emp-name" value={employeeForm.name} onChange={(e) => setEmployeeForm({ ...employeeForm, name: e.target.value })} placeholder="请输入姓名" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emp-email">邮箱 *</Label>
              <Input id="emp-email" type="email" value={employeeForm.email} onChange={(e) => setEmployeeForm({ ...employeeForm, email: e.target.value })} placeholder="请输入邮箱" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emp-phone">电话</Label>
              <Input id="emp-phone" value={employeeForm.phone || ''} onChange={(e) => setEmployeeForm({ ...employeeForm, phone: e.target.value })} placeholder="请输入电话" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emp-username">用户名</Label>
              <Input 
                id="emp-username" 
                value={employeeForm.username} 
                onChange={(e) => setEmployeeForm({ ...employeeForm, username: e.target.value })} 
                placeholder="请输入登录用户名" 
                disabled={!!editingEmployee}
              />
              <p className="text-xs text-muted-foreground">
                {editingEmployee ? '用户名创建后不可修改' : '用户登录系统时使用的用户名'}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="emp-code">工号 *</Label>
              <Input id="emp-code" value={employeeForm.employee_no} onChange={(e) => setEmployeeForm({ ...employeeForm, employee_no: e.target.value })} placeholder="请输入工号" />
              <p className="text-xs text-muted-foreground">员工的实际工号，用于内部标识</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="emp-hire-date">入职日期 *</Label>
              <Input id="emp-hire-date" type="date" value={employeeForm.hire_date || ''} onChange={(e) => setEmployeeForm({ ...employeeForm, hire_date: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emp-position">职位</Label>
              <Select value={employeeForm.position_id || 'none'} onValueChange={(value) => setEmployeeForm({ ...employeeForm, position_id: value === 'none' ? undefined : value })}>
                <SelectTrigger id="emp-position">
                  <SelectValue placeholder="请选择职位" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">无</SelectItem>
                  {positions.map((position) => (
                    <SelectItem key={position.id} value={position.id}>
                      {position.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="emp-department">部门</Label>
              <Select value={employeeForm.department_id || 'none'} onValueChange={(value) => setEmployeeForm({ ...employeeForm, department_id: value === 'none' ? undefined : value })}>
                <SelectTrigger id="emp-department">
                  <SelectValue placeholder="请选择部门" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">无</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEmployeeDialog(false)}>取消</Button>
            <Button onClick={editingEmployee ? handleUpdateEmployee : handleCreateEmployee}>
              {editingEmployee ? '保存' : '创建'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showPositionDialog} onOpenChange={setShowPositionDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingPosition ? '编辑职位' : '新增职位'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {!editingPosition && (
              <div className="space-y-2">
                <Label htmlFor="pos-template">快速选择模板</Label>
                <select
                  id="pos-template"
                  className="w-full px-3 py-2 border rounded-md"
                  value={selectedPositionTemplate}
                  onChange={(e) => {
                    setSelectedPositionTemplate(e.target.value);
                    if (e.target.value) {
                      const template = POSITION_TEMPLATES.find(t => t.code === e.target.value);
                      if (template) {
                        setPositionForm({
                          name: template.title,
                          code: template.code,
                          description: template.description || '',
                        });
                      }
                    }
                  }}
                >
                  <option value="">请选择模板</option>
                  {POSITION_TEMPLATES.map((template) => (
                    <option key={template.code} value={template.code}>{template.title}</option>
                  ))}
                </select>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="pos-name">职位名称 *</Label>
              <Input id="pos-name" value={positionForm.name} onChange={(e) => setPositionForm({ ...positionForm, name: e.target.value })} placeholder="请输入职位名称" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pos-code">职位代码</Label>
              <Input id="pos-code" value={positionForm.code} onChange={(e) => setPositionForm({ ...positionForm, code: e.target.value })} placeholder="请输入职位代码" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pos-desc">描述</Label>
              <textarea id="pos-desc" className="w-full h-20 px-3 py-2 border rounded-md" value={positionForm.description} onChange={(e) => setPositionForm({ ...positionForm, description: e.target.value })} placeholder="请输入职位描述" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPositionDialog(false)}>取消</Button>
            <Button onClick={editingPosition ? handleUpdatePosition : handleCreatePosition}>
              {editingPosition ? '保存' : '创建'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>申请请假</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="leave-type">请假类型</Label>
              <select id="leave-type" className="w-full h-10 px-3 border rounded-md bg-background" value={leaveForm.leave_type} onChange={(e) => setLeaveForm({ ...leaveForm, leave_type: e.target.value })}>
                <option value="annual">年假</option>
                <option value="sick">病假</option>
                <option value="personal">事假</option>
                <option value="maternity">产假</option>
                <option value="paternity">陪产假</option>
                <option value="other">其他</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="leave-start">开始日期</Label>
                <Input id="leave-start" type="date" value={leaveForm.start_date} onChange={(e) => setLeaveForm({ ...leaveForm, start_date: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="leave-end">结束日期</Label>
                <Input id="leave-end" type="date" value={leaveForm.end_date} onChange={(e) => setLeaveForm({ ...leaveForm, end_date: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="leave-reason">请假原因</Label>
              <textarea id="leave-reason" className="w-full h-20 px-3 py-2 border rounded-md" value={leaveForm.reason} onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })} placeholder="请输入请假原因" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLeaveDialog(false)}>取消</Button>
            <Button onClick={handleCreateLeaveRequest}>提交申请</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 员工创建成功 - 默认密码提示对话框 */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-success flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              员工创建成功
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
              <h3 className="font-medium text-primary mb-2">员工登录信息</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-primary/80">登录用户名:</span>
                  <span className="font-mono font-medium">{createdEmployeeInfo?.username}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-primary/80">员工工号:</span>
                  <span className="font-mono font-medium">{createdEmployeeInfo?.employee_no}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-primary/80">初始密码:</span>
                  <span className="font-mono font-medium text-destructive">{createdEmployeeInfo?.default_password}</span>
                </div>
              </div>
            </div>
            <div className="bg-warning/10 border border-warning/20 rounded-lg p-4">
              <h4 className="font-medium text-warning mb-1">⚠️ 重要提醒</h4>
              <ul className="text-sm text-warning/80 space-y-1 list-disc list-inside">
                <li>请务必将此信息告知员工本人</li>
                <li>建议员工首次登录后立即修改密码</li>
                <li>不要将密码截图发送给他人</li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowPasswordDialog(false)}>我已知晓</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HrManagement;
