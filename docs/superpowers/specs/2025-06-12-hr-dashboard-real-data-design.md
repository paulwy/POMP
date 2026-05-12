# HR模块与仪表盘真实数据实现设计

## 1. 概述

本文档描述如何将人力资源模块（hr.rs）和仪表盘模块（dashboard.rs）中的硬编码数据替换为从数据库读取的真实数据。

### 1.1 目标
- 员工数据关联 users 表，与 departments、positions 表关联查询
- 创建 attendance_records 表存储考勤数据
- 创建 leave_requests 表存储请假数据
- 仪表盘从各表聚合查询真实统计数据

### 1.2 数据来源策略
- **员工信息**：复用 `users` 表，关联 `departments` 和 `positions` 表
- **考勤记录**：新建 `attendance_records` 表
- **请假申请**：新建 `leave_requests` 表
- **仪表盘统计**：从 users、departments、attendance_records、leave_requests 等表聚合

---

## 2. 数据库设计

### 2.1 扩展 users 表（通过 migration）

```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS employee_no VARCHAR(50) UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS hire_date DATE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS position_id UUID REFERENCES positions(id);
ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(30) DEFAULT 'active';
```

### 2.2 创建 attendance_records 表

```sql
CREATE TABLE IF NOT EXISTS attendance_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    attendance_date DATE NOT NULL,
    check_in_time TIMESTAMPTZ,
    check_out_time TIMESTAMPTZ,
    check_in_location VARCHAR(255),
    check_out_location VARCHAR(255),
    status VARCHAR(30) DEFAULT 'normal',
    work_hours DECIMAL(4,2) DEFAULT 0,
    late_minutes INTEGER DEFAULT 0,
    early_leave_minutes INTEGER DEFAULT 0,
    overtime_hours DECIMAL(4,2) DEFAULT 0,
    remark TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    UNIQUE(user_id, attendance_date)
);

CREATE INDEX idx_attendance_user_id ON attendance_records(user_id);
CREATE INDEX idx_attendance_date ON attendance_records(attendance_date);
CREATE INDEX idx_attendance_status ON attendance_records(status);
```

### 2.3 创建 leave_requests 表

```sql
CREATE TABLE IF NOT EXISTS leave_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    leave_type VARCHAR(30) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_days DECIMAL(4,1) NOT NULL,
    reason TEXT,
    status VARCHAR(30) DEFAULT 'pending',
    workflow_instance_id UUID,
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMPTZ,
    remark TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX idx_leave_user_id ON leave_requests(user_id);
CREATE INDEX idx_leave_status ON leave_requests(status);
CREATE INDEX idx_leave_dates ON leave_requests(start_date, end_date);
```

---

## 3. 后端接口修改

### 3.1 hr.rs 修改

#### get_employees_handler
- 从 users 表查询，关联 departments 和 positions 表
- 支持分页、搜索、状态过滤

#### get_employee_handler
- 根据 ID 从 users 表查询完整员工信息

#### create_employee_handler
- 在 users 表插入数据

#### update_employee_handler
- 更新 users 表数据

#### delete_employee_handler
- 删除 users 表数据（软删除：更新 status）

#### check_in_handler / check_out_handler
- 插入或更新 attendance_records 表

#### get_attendance_records_handler
- 从 attendance_records 表查询

#### get_attendance_stats_handler
- 从 attendance_records 表聚合统计

#### create_leave_request_handler
- 插入 leave_requests 表

#### get_leave_requests_handler
- 从 leave_requests 表查询

#### approve_leave_request_handler
- 更新 leave_requests 表的审批状态

### 3.2 dashboard.rs 修改

#### get_dashboard_stats_handler
```sql
SELECT
    (SELECT COUNT(*) FROM users WHERE status != 'archived') as total_employees,
    (SELECT COUNT(*) FROM users WHERE is_active = true) as active_employees,
    (SELECT COUNT(*) FROM attendance_records WHERE attendance_date = CURRENT_DATE) as today_attendance,
    (SELECT COUNT(*) FROM leave_requests WHERE status = 'approved' AND start_date <= CURRENT_DATE AND end_date >= CURRENT_DATE) as on_leave_today,
    (SELECT COUNT(*) FROM approval_tasks WHERE status = 'pending') as pending_approvals,
    (SELECT COUNT(*) FROM departments) as total_departments
```

#### get_department_distribution_handler
```sql
SELECT d.name, COUNT(u.id) as value
FROM departments d
LEFT JOIN users u ON u.department_id = d.id
GROUP BY d.id, d.name
```

#### get_attendance_summary_handler
```sql
SELECT attendance_date as date,
    SUM(CASE WHEN status = 'normal' THEN 1 ELSE 0 END) as normal,
    SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END) as late,
    SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absent
FROM attendance_records
WHERE attendance_date >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY attendance_date
```

#### get_leave_type_distribution_handler
```sql
SELECT leave_type as name, COUNT(*) as value
FROM leave_requests
WHERE status = 'approved'
GROUP BY leave_type
```

---

## 4. 数据聚合说明

### 4.1 仪表盘统计
- 员工总数/活跃员工：从 users 表统计
- 今日考勤：从 attendance_records 表统计当日数据
- 今日请假人数：从 leave_requests 表统计当日请假人数
- 待审批数：从 approval_tasks 表统计
- 部门分布：从 departments 和 users 表聚合

### 4.2 考勤统计
- 从 attendance_records 表按日期范围聚合
- 计算正常、迟到、早退、请假天数

### 4.3 请假类型分布
- 从 leave_requests 表按类型聚合已批准的请假

---

## 5. 实施步骤

1. 创建数据库 migration：扩展 users 表，新增 attendance_records 和 leave_requests 表
2. 修改 hr.rs：实现从数据库读取数据的接口
3. 修改 dashboard.rs：实现从数据库聚合统计的接口
4. 测试验证数据读取正确性

---

## 6. 风险与注意事项

- users 表已存在数据，需确保迁移不影响现有数据
- 考勤打卡需要与前端定位功能配合
- 请假审批可以关联工作流模块实现自动化审批
