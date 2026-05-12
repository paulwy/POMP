# 配置管理功能详细设计文档

## 1. 功能概述

### 1.1 功能定位

配置管理模块是系统的核心基础设施，负责统一管理系统的配置数据，包括：
- 工作流定义与审批规则
- 组织架构（部门、职位、职位级别）
- 字典数据（系统枚举值配置）

### 1.2 设计目标

| 目标 | 说明 |
|------|------|
| 统一管理 | 提供统一的配置管理入口，集中管理所有系统配置 |
| 可视化 | 通过仪表盘展示配置概览，便于快速了解系统状态 |
| 可追溯 | 支持配置数据的导入导出，便于备份和迁移 |
| 易用性 | 通过帮助提示和文档，降低使用门槛 |
| 安全性 | 配置修改需要管理员权限，确保数据安全 |

---

## 2. 架构设计

### 2.1 系统架构图

```
┌─────────────────────────────────────────────────────────────────┐
│                        前端层 (React)                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │ 配置中心页面 │  │  工作台仪表盘  │  │   组织架构管理页面   │  │
│  │ConfigCenter │  │    Home      │  │OrganizationManagement│  │
│  └──────┬───────┘  └──────┬───────┘  └──────────┬───────────┘  │
│         │                  │                     │               │
└─────────┼──────────────────┼─────────────────────┼───────────────┘
          │                  │                     │
          ▼                  ▼                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                        API 层 (Axum)                           │
│  ┌──────────────────┐  ┌──────────────────┐  ┌───────────────┐  │
│  │ /api/v1/workflows│  │/api/v1/organization│ │/api/v1/dict  │  │
│  │   工作流管理     │  │   组织架构管理     │  │   字典管理    │  │
│  └──────────────────┘  └──────────────────┘  └───────────────┘  │
└─────────────────────────────────────────────────────────────────┘
          │                  │                     │
          ▼                  ▼                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                      数据访问层 (SQLx)                          │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌───────────┐ │
│  │ workflows   │ │workflow_    │ │approval_    │ │dict_types │ │
│  │             │ │steps        │ │rules        │ │dict_items │ │
│  └─────────────┘ └─────────────┘ └─────────────┘ └───────────┘ │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐               │
│  │ departments │ │ positions   │ │position_    │               │
│  │             │ │             │ │levels       │               │
│  └─────────────┘ └─────────────┘ └─────────────┘               │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 模块划分

| 模块 | 职责 | 状态 |
|------|------|------|
| **配置中心** | 统一展示和管理所有配置数据 | ✅ 已实现 |
| **工作台仪表盘** | 在首页展示配置概览 | ✅ 已实现 |
| **帮助提示系统** | 提供在线帮助文档 | ✅ 已实现 |
| **数据导入导出** | 支持配置数据的备份和迁移 | ✅ 已实现 |
| **组织架构管理** | 管理部门、职位、审批规则 | ✅ 已实现 |
| **工作流管理** | 管理工作流定义和步骤 | ✅ 已实现 |
| **HR员工管理** | 管理员工档案、考勤、请假 | ✅ 已实现 |

---

## 2.3 HR与用户账号一体化管理

### 2.3.1 设计原则

1. **单一数据源原则**：员工档案与系统账号使用同一表（`users`），避免数据冗余和不一致
2. **权限分离原则**：通过权限体系区分管理员和普通员工
3. **流程标准化原则**：员工入职、创建账号、设置权限流程标准化
4. **数据完整性原则**：确保必填字段完整性，支持灵活扩展

### 2.3.2 角色与权限体系

| 角色类型 | is_superuser | 功能权限 |
|---------|-------------|---------|
| 系统管理员 | true | 全部功能 |
| HR管理员 | false（需通过权限体系） | HR管理、员工管理 |
| 普通员工 | false | 个人考勤、请假申请 |

### 2.3.3 HR创建员工标准流程

```
1. 录入员工基本信息
   ├─ 姓名（必填）
   ├─ 邮箱（必填，唯一）
   ├─ 工号（必填，唯一）
   ├─ 手机号（可选）
   ├─ 入职日期（必填）
   └─ 职位（可选）

2. 系统自动生成账号信息
   ├─ username：使用工号（企业通行做法）
   ├─ password：初始默认密码（如：工号@123）
   ├─ 状态：默认为 active
   └─ 角色：普通员工

3. 通知与首次登录
   ├─ 发送账号信息到员工邮箱
   └─ 首次登录强制修改密码（待实现）
```

### 2.3.4 默认密码策略

**推荐方案：工号+固定后缀**
- 默认密码：`{employee_no}@123`
- 优点：员工易记忆，HR易告知
- 示例：工号 E001 的密码为 E001@123

### 2.3.5 Username生成策略

| 策略 | 说明 | 优点 | 缺点 |
|-----|------|------|------|
| 工号 | username = employee_no | 企业通行，易管理 | 需要确保工号唯一性 |
| 邮箱前缀 | username = email@前部分 | 易记忆 | 可能重复 |
| 姓名拼音 | username = pinyin(name) | 易读 | 同姓名重复问题 |

**当前实现：使用工号**，这是中国企业最通行的做法。

### 2.3.6 数据库唯一性约束

```sql
-- 已存在：
UNIQUE(username)
UNIQUE(email)
UNIQUE(employee_no)

-- 确保：
-- 1. 用户名不能重复
-- 2. 邮箱不能重复  
-- 3. 工号不能重复
```

---

## 3. 数据库设计

### 3.1 工作流相关表

#### 3.1.1 workflows（工作流定义表）

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | UUID | PRIMARY KEY | 工作流唯一标识 |
| name | VARCHAR(100) | NOT NULL | 工作流名称 |
| code | VARCHAR(50) | NOT NULL, UNIQUE | 工作流编码 |
| description | TEXT | NULL | 工作流描述 |
| is_active | BOOLEAN | DEFAULT true | 是否启用 |
| is_system | BOOLEAN | DEFAULT false | 是否系统内置 |
| system_required | BOOLEAN | DEFAULT false | 是否系统必需 |
| allow_customization | BOOLEAN | DEFAULT true | 是否允许自定义 |
| created_at | TIMESTAMPTZ | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMPTZ | DEFAULT CURRENT_TIMESTAMP | 更新时间 |

#### 3.1.2 workflow_steps（工作流步骤表）

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | UUID | PRIMARY KEY | 步骤唯一标识 |
| workflow_id | UUID | FOREIGN KEY | 关联工作流ID |
| step_number | INTEGER | NOT NULL | 步骤序号 |
| name | VARCHAR(100) | NOT NULL | 步骤名称 |
| approval_rule_id | UUID | FOREIGN KEY | 关联审批规则 |
| next_step_id | UUID | NULL | 下一步骤ID |
| timeout_hours | INTEGER | DEFAULT 72 | 超时时间（小时） |
| created_at | TIMESTAMPTZ | DEFAULT CURRENT_TIMESTAMP | 创建时间 |

#### 3.1.3 approval_rules（审批规则表）

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | UUID | PRIMARY KEY | 规则唯一标识 |
| name | VARCHAR(100) | NOT NULL | 规则名称 |
| code | VARCHAR(50) | NOT NULL, UNIQUE | 规则编码 |
| rule_type | VARCHAR(50) | NOT NULL | 审批类型 |
| workflow_type | VARCHAR(50) | NULL | 适用工作流类型 |
| position_level_id | UUID | NULL | 职位级别ID |
| department_id | UUID | NULL | 部门ID |
| specific_user_id | UUID | NULL | 指定用户ID |
| min_approvers | INTEGER | DEFAULT 1 | 最少审批人数 |
| approval_mode | VARCHAR(20) | DEFAULT 'any' | 审批模式 |
| condition_expression | TEXT | NULL | 条件表达式 |
| description | TEXT | NULL | 规则描述 |
| is_active | BOOLEAN | DEFAULT true | 是否启用 |
| created_at | TIMESTAMPTZ | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMPTZ | DEFAULT CURRENT_TIMESTAMP | 更新时间 |

### 3.2 组织架构相关表

#### 3.2.1 departments（部门表）

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | UUID | PRIMARY KEY | 部门唯一标识 |
| name | VARCHAR(100) | NOT NULL | 部门名称 |
| code | VARCHAR(50) | NOT NULL, UNIQUE | 部门编码 |
| parent_id | UUID | NULL, FOREIGN KEY | 上级部门ID |
| manager_id | UUID | NULL, FOREIGN KEY | 部门经理ID |
| sort_order | INTEGER | DEFAULT 0 | 排序顺序 |
| description | TEXT | NULL | 部门描述 |
| is_active | BOOLEAN | DEFAULT true | 是否启用 |
| created_at | TIMESTAMPTZ | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMPTZ | DEFAULT CURRENT_TIMESTAMP | 更新时间 |

#### 3.2.2 position_levels（职位级别表）

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | UUID | PRIMARY KEY | 级别唯一标识 |
| name | VARCHAR(50) | NOT NULL | 级别名称 |
| code | VARCHAR(20) | NOT NULL, UNIQUE | 级别编码 |
| level | INTEGER | NOT NULL | 级别数值 |
| description | TEXT | NULL | 级别描述 |
| created_at | TIMESTAMPTZ | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMPTZ | DEFAULT CURRENT_TIMESTAMP | 更新时间 |

#### 3.2.3 positions（职位表）

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | UUID | PRIMARY KEY | 职位唯一标识 |
| name | VARCHAR(100) | NOT NULL | 职位名称 |
| code | VARCHAR(50) | NOT NULL, UNIQUE | 职位编码 |
| department_id | UUID | FOREIGN KEY | 所属部门ID |
| position_level_id | UUID | FOREIGN KEY | 职位级别ID |
| sort_order | INTEGER | DEFAULT 0 | 排序顺序 |
| description | TEXT | NULL | 职位描述 |
| is_active | BOOLEAN | DEFAULT true | 是否启用 |
| created_at | TIMESTAMPTZ | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMPTZ | DEFAULT CURRENT_TIMESTAMP | 更新时间 |

#### 3.2.4 users（用户表扩展字段）

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| employee_no | VARCHAR(50) | UNIQUE | 员工编号 |
| hire_date | DATE | NULL | 入职日期 |
| position_id | UUID | FOREIGN KEY | 职位ID |
| status | VARCHAR(30) | DEFAULT 'active' | 员工状态 |

#### 3.2.5 attendance_records（考勤记录表）

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | UUID | PRIMARY KEY | 记录唯一标识 |
| user_id | UUID | FOREIGN KEY | 关联用户ID |
| attendance_date | DATE | NOT NULL | 考勤日期 |
| check_in_time | TIMESTAMPTZ | NULL | 签到时间 |
| check_out_time | TIMESTAMPTZ | NULL | 签退时间 |
| check_in_location | VARCHAR(255) | NULL | 签到位置 |
| check_out_location | VARCHAR(255) | NULL | 签退位置 |
| status | VARCHAR(30) | DEFAULT 'normal' | 考勤状态 |
| work_hours | DECIMAL(4,2) | DEFAULT 0 | 工作时长（小时） |
| late_minutes | INTEGER | DEFAULT 0 | 迟到分钟数 |
| early_leave_minutes | INTEGER | DEFAULT 0 | 早退分钟数 |
| overtime_hours | DECIMAL(4,2) | DEFAULT 0 | 加班时长（小时） |
| remark | TEXT | NULL | 备注 |
| created_at | TIMESTAMPTZ | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMPTZ | DEFAULT CURRENT_TIMESTAMP | 更新时间 |

#### 3.2.6 leave_requests（请假申请表）

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | UUID | PRIMARY KEY | 申请唯一标识 |
| user_id | UUID | FOREIGN KEY | 关联用户ID |
| leave_type | VARCHAR(30) | NOT NULL | 请假类型 |
| start_date | DATE | NOT NULL | 开始日期 |
| end_date | DATE | NOT NULL | 结束日期 |
| total_days | DECIMAL(4,1) | NOT NULL | 请假天数 |
| reason | TEXT | NULL | 请假原因 |
| status | VARCHAR(30) | DEFAULT 'pending' | 审批状态 |
| workflow_instance_id | UUID | NULL | 工作流实例ID |
| approved_by | UUID | FOREIGN KEY | 审批人ID |
| approved_at | TIMESTAMPTZ | NULL | 审批时间 |
| remark | TEXT | NULL | 审批备注 |
| created_at | TIMESTAMPTZ | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMPTZ | DEFAULT CURRENT_TIMESTAMP | 更新时间 |

### 3.3 字典数据表

#### 3.3.1 dict_types（字典类型表）

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | UUID | PRIMARY KEY | 类型唯一标识 |
| code | VARCHAR(50) | NOT NULL, UNIQUE | 类型编码 |
| name | VARCHAR(100) | NOT NULL | 类型名称 |
| description | TEXT | NULL | 类型描述 |
| sort_order | INTEGER | DEFAULT 0 | 排序顺序 |
| created_at | TIMESTAMPTZ | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMPTZ | DEFAULT CURRENT_TIMESTAMP | 更新时间 |

#### 3.3.2 dict_items（字典项表）

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | UUID | PRIMARY KEY | 字典项唯一标识 |
| type_code | VARCHAR(50) | NOT NULL, FOREIGN KEY | 所属类型编码 |
| item_code | VARCHAR(50) | NOT NULL | 字典项编码 |
| item_name | VARCHAR(100) | NOT NULL | 字典项名称 |
| sort_order | INTEGER | DEFAULT 0 | 排序顺序 |
| description | TEXT | NULL | 字典项描述 |
| is_active | BOOLEAN | DEFAULT true | 是否启用 |
| created_at | TIMESTAMPTZ | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMPTZ | DEFAULT CURRENT_TIMESTAMP | 更新时间 |

---

## 4. API 设计

### 4.1 工作流管理 API

| API 路径 | HTTP 方法 | 功能描述 | 权限要求 |
|----------|-----------|----------|----------|
| `/api/v1/workflows` | GET | 获取工作流列表 | 管理员 |
| `/api/v1/workflows` | POST | 创建工作流 | 管理员 |
| `/api/v1/workflows/{id}` | GET | 获取工作流详情 | 管理员 |
| `/api/v1/workflows/{id}` | PUT | 更新工作流 | 管理员 |
| `/api/v1/workflows/{id}` | DELETE | 删除工作流 | 管理员 |
| `/api/v1/workflows/{id}/nodes` | GET | 获取工作流步骤 | 管理员 |
| `/api/v1/workflows/system` | GET | 获取系统工作流 | 管理员 |
| `/api/v1/workflows/custom` | GET | 获取自定义工作流 | 管理员 |

### 4.2 组织架构 API

| API 路径 | HTTP 方法 | 功能描述 | 权限要求 |
|----------|-----------|----------|----------|
| `/api/v1/organization/departments` | GET | 获取部门列表 | 管理员 |
| `/api/v1/organization/departments` | POST | 创建部门 | 管理员 |
| `/api/v1/organization/departments/{id}` | PUT | 更新部门 | 管理员 |
| `/api/v1/organization/departments/{id}` | DELETE | 删除部门 | 管理员 |
| `/api/v1/organization/positions` | GET | 获取职位列表 | 管理员 |
| `/api/v1/organization/positions` | POST | 创建职位 | 管理员 |
| `/api/v1/organization/position-levels` | GET | 获取职位级别列表 | 管理员 |
| `/api/v1/organization/approval-rules` | GET | 获取审批规则列表 | 管理员 |
| `/api/v1/organization/approval-rules` | POST | 创建审批规则 | 管理员 |
| `/api/v1/organization/approval-rules/{id}` | PUT | 更新审批规则 | 管理员 |
| `/api/v1/organization/approval-rules/{id}` | DELETE | 删除审批规则 | 管理员 |

### 4.3 字典管理 API

| API 路径 | HTTP 方法 | 功能描述 | 权限要求 |
|----------|-----------|----------|----------|
| `/api/v1/dict/types` | GET | 获取字典类型列表 | 管理员 |
| `/api/v1/dict/types` | POST | 创建字典类型 | 管理员 |
| `/api/v1/dict/types/{code}` | GET | 获取字典类型详情 | 管理员 |
| `/api/v1/dict/types/{code}` | PUT | 更新字典类型 | 管理员 |
| `/api/v1/dict/types/{code}` | DELETE | 删除字典类型 | 管理员 |
| `/api/v1/dict/items/{type_code}` | GET | 获取字典项列表 | 管理员 |
| `/api/v1/dict/items` | POST | 创建字典项 | 管理员 |
| `/api/v1/dict/items/{id}` | PUT | 更新字典项 | 管理员 |
| `/api/v1/dict/items/{id}` | DELETE | 删除字典项 | 管理员 |

### 4.4 HR管理 API

| API 路径 | HTTP 方法 | 功能描述 | 权限要求 |
|----------|-----------|----------|----------|
| `/api/v1/hr/employees` | GET | 获取员工列表 | HR管理员/系统管理员 |
| `/api/v1/hr/employees` | POST | 创建员工（自动生成账号） | HR管理员/系统管理员 |
| `/api/v1/hr/employees/{id}` | GET | 获取员工详情 | HR管理员/系统管理员 |
| `/api/v1/hr/employees/{id}` | PUT | 更新员工信息 | HR管理员/系统管理员 |
| `/api/v1/hr/employees/{id}` | DELETE | 删除员工 | HR管理员/系统管理员 |
| `/api/v1/hr/positions` | GET | 获取职位列表 | HR管理员/系统管理员 |
| `/api/v1/hr/positions` | POST | 创建职位 | HR管理员/系统管理员 |
| `/api/v1/hr/attendance/today` | GET | 获取今日考勤（当前用户） | 登录用户 |
| `/api/v1/hr/attendance/check-in` | POST | 签到 | 登录用户 |
| `/api/v1/hr/attendance/check-out` | POST | 签退 | 登录用户 |
| `/api/v1/hr/attendance/statistics` | GET | 获取考勤统计 | 登录用户 |
| `/api/v1/hr/leave` | GET | 获取请假申请列表 | HR管理员/员工本人 |
| `/api/v1/hr/leave` | POST | 创建请假申请 | 登录用户 |
| `/api/v1/hr/leave/{id}` | PUT | 更新请假申请 | HR管理员/员工本人 |
| `/api/v1/hr/leave/{id}/approve` | POST | 审批请假申请 | HR管理员/审批人 |

**创建员工请求示例：
```json
{
  "name": "张三",
  "email": "zhangsan@company.com",
  "phone": "13800138000",
  "employee_no": "E001",
  "hire_date": "2024-01-01",
  "position_id": "uuid-position-id"
}
```

**创建员工响应示例（成功）：
```json
{
  "success": true,
  "data": {
    "employee": { ... },
    "default_password": "E001@123",
    "message": "员工创建成功，默认密码为工号@123，请通知员工首次登录后修改密码"
  }
}
```

---

## 5. 前端组件设计

### 5.1 配置中心组件

**文件路径**: `src/pages/ConfigurationCenter.tsx`

| 功能模块 | 说明 |
|----------|------|
| 统计卡片 | 展示工作流、审批规则、部门、职位数量 |
| 工作流列表 | 显示工作流名称、状态、是否系统内置 |
| 组织架构 | 显示部门列表和状态 |
| 审批规则 | 显示审批规则名称、审批模式 |
| 配置说明 | 提供配置使用说明 |
| 导入导出 | 支持配置数据的导入导出 |

### 5.2 帮助提示组件

**文件路径**: `src/components/HelpTooltip.tsx`

| 属性 | 类型 | 说明 |
|------|------|------|
| content | string | 帮助提示内容 |
| placement | 'top' \| 'bottom' \| 'left' \| 'right' | 提示位置 |

### 5.3 系统配置概览卡片

**文件路径**: `src/pages/Home.tsx`

| 显示项 | 数据来源 |
|--------|----------|
| 工作流数量 | `workflowApi.getWorkflows()` |
| 审批规则数量 | `organizationApi.getApprovalRules()` |
| 部门数量 | `departmentApi.getDepartments()` |
| 职位数量 | `organizationApi.getPositions()` |

---

## 6. 业务流程

### 6.1 工作流创建流程

```
用户进入工作流管理页面
    ↓
点击"创建工作流"按钮
    ↓
填写工作流基本信息（名称、编码、描述）
    ↓
添加工作流步骤（步骤名称、审批规则）
    ↓
提交创建请求
    ↓
后端验证数据完整性
    ↓
保存工作流到数据库
    ↓
返回创建成功提示
```

### 6.2 审批规则配置流程

```
用户进入审批规则管理页面
    ↓
点击"创建审批规则"按钮
    ↓
选择审批类型（部门/职位级别/指定人员）
    ↓
配置审批模式（any/all/majority）
    ↓
设置最少审批人数
    ↓
填写条件表达式（可选）
    ↓
提交配置
    ↓
验证规则配置有效性
    ↓
保存到数据库
```

### 6.3 配置数据导出流程

```
用户进入配置中心页面
    ↓
点击"导出配置"按钮
    ↓
前端收集所有配置数据
    ↓
生成 JSON 文件
    ↓
触发浏览器下载
```

### 6.4 配置数据导入流程

```
用户进入配置中心页面
    ↓
点击"导入配置"按钮
    ↓
选择本地 JSON 文件
    ↓
解析文件内容
    ↓
验证数据格式
    ↓
预览导入数据
    ↓
确认导入（需后端支持）
```

---

## 7. 安全考虑

### 7.1 权限控制

| 操作 | 权限要求 |
|------|----------|
| 查看配置概览 | 登录用户 |
| 创建/修改/删除配置 | 系统管理员 |
| 导入/导出配置 | 系统管理员 |

### 7.2 数据校验

| 校验项 | 说明 |
|--------|------|
| 输入验证 | 所有表单输入进行前端和后端双重验证 |
| 唯一约束 | 编码字段确保唯一性 |
| 外键约束 | 防止无效关联引用 |
| 业务规则 | 删除前检查是否被引用 |

### 7.3 数据备份

- 支持配置数据导出为 JSON 文件
- 建议定期备份配置数据
- 导入前建议备份当前配置

---

## 8. 扩展规划

### 8.1 短期目标（1-3个月）

| 功能 | 优先级 | 说明 |
|------|--------|------|
| 配置变更日志 | 高 | 记录配置修改历史 |
| 配置对比 | 高 | 支持不同版本配置对比 |
| 批量导入 | 中 | 支持批量导入配置数据 |

### 8.2 长期目标（3-6个月）

| 功能 | 优先级 | 说明 |
|------|--------|------|
| 配置模板库 | 中 | 提供预置配置模板 |
| 配置审批流程 | 中 | 修改配置需要审批 |
| 配置审计 | 高 | 记录配置访问日志 |

---

## 9. 系统必需配置项

### 9.1 配置项清单

在系统正常运行前，必须配置以下项目：

| 配置类别 | 配置项 | 说明 | 配置模块 | 当前状态 | 是否必需 |
|----------|--------|------|----------|----------|----------|
| **系统基础配置** | 系统名称 | 显示在页面标题和登录页 | 系统设置 → 系统配置 | ⏳ 待配置 | ✅ |
| | 系统Logo | 品牌标识 | 系统设置 → 系统配置 | ⏳ 待配置 | ⚠️ |
| | 版权信息 | 页面底部版权声明 | 系统设置 → 系统配置 | ⏳ 待配置 | ⚠️ |
| | 系统版本 | 显示系统版本号 | 系统设置 → 系统配置 | ✅ 已配置 | ✅ |
| **安全配置** | JWT密钥 | Token签名密钥 | `.env` 环境变量 | ✅ 已配置 | ✅ |
| | JWT过期时间 | Token有效期 | `.env` 环境变量 | ✅ 已配置 | ✅ |
| | 密码策略 | 密码复杂度要求（至少8位，包含字母、数字和特殊字符） | 系统设置 → 安全配置 | ✅ 已配置 | ✅ |
| | 登录失败次数限制 | 防止暴力破解（5次后锁定） | 系统设置 → 安全配置 | ✅ 已配置 | ⚠️ |
| **邮件配置** | SMTP服务器 | 邮件发送服务器地址（smtp.163.com） | 系统设置 → 邮件配置 | ✅ 已配置 | ✅ |
| | SMTP端口 | 邮件服务器端口（465 SSL） | 系统设置 → 邮件配置 | ✅ 已配置 | ✅ |
| | 发件人邮箱 | 系统邮件发件地址（topmap@163.com） | 系统设置 → 邮件配置 | ✅ 已配置 | ✅ |
| | 邮箱密码 | 邮箱登录密码/授权码 | 系统设置 → 邮件配置 | ✅ 已配置 | ✅ |
| **存储配置** | 文件存储路径 | 上传文件存储位置 | `.env` 环境变量 | ✅ 已配置 | ✅ |
| | 最大文件大小 | 单文件上传限制（200MB，支持会议录音和知识库文件） | 系统设置 → 文件配置 | ✅ 已配置 | ✅ |
| | 允许的文件类型 | 上传文件格式限制（支持图片、文档、音视频、压缩包） | 系统设置 → 文件配置 | ✅ 已配置 | ⚠️ |
| **权限配置** | 角色定义 | 系统角色列表 | 系统设置 → 角色管理 | ✅ 已配置 | ✅ |
| | 权限定义 | 系统权限列表 | 系统设置 → 角色管理 | ✅ 已配置 | ✅ |
| | 角色-权限映射 | 角色拥有的权限 | 系统设置 → 角色管理 | ⏳ 待配置 | ✅ |
| **工作流配置** | 审批规则 | 审批分配规则 | 组织架构 → 审批规则 | ✅ 已配置 | ✅ |
| | 工作流定义 | 审批流程定义 | 工作流管理 | ✅ 已配置 | ✅ |
| **组织架构** | 部门结构 | 公司部门层级 | 组织架构 → 部门管理 | ✅ 已配置 | ✅ |
| | 职位定义 | 职位列表 | 组织架构 → 职位管理 | ✅ 已配置 | ✅ |
| | 职位级别 | 职位等级划分 | 组织架构 → 职位级别 | ✅ 已配置 | ✅ |
| **字典配置** | 字典类型 | 系统枚举类型定义（工作流状态、审批状态等9种） | 系统设置 → 字典管理 | ✅ 已配置 | ✅ |
| | 字典项 | 枚举值列表（15个字典项） | 系统设置 → 字典管理 | ✅ 已配置 | ✅ |
| **通知配置** | 通知模板 | 邮件/站内信模板（审批结果、文章状态等） | 系统设置 → 通知配置 | ✅ 已配置 | ⚠️ |
| | 通知渠道 | 通知方式（邮件/短信/站内信） | 系统设置 → 通知配置 | ✅ 已配置（启用邮件） | ⚠️ |
| **管理员配置** | 超级管理员 | 系统最高权限用户 | 用户管理 → 用户列表 | ✅ 已配置 | ✅ |
| | 系统管理员角色 | 管理员权限集合 | 系统设置 → 角色管理 | ✅ 已配置 | ✅ |

> ✅ 必需 - 缺少将导致系统无法正常运行  
> ⚠️ 建议 - 缺少可能影响部分功能或安全性

### 9.2 配置模块映射

| 配置模块 | 路径 | 包含的配置项 |
|----------|------|--------------|
| **系统配置** | 系统设置 → 系统配置 | 系统名称、Logo、版权信息、版本号 |
| **安全配置** | 系统设置 → 安全配置 | 密码策略、登录失败次数限制 |
| **邮件配置** | 系统设置 → 邮件配置 | SMTP服务器、端口、发件人邮箱、密码 |
| **文件配置** | 系统设置 → 文件配置 | 最大文件大小、允许的文件类型 |
| **角色管理** | 系统设置 → 角色管理 | 角色定义、权限定义、角色-权限映射 |
| **字典管理** | 系统设置 → 字典管理 | 字典类型、字典项 |
| **通知配置** | 系统设置 → 通知配置 | 通知模板、通知渠道 |
| **用户管理** | 用户管理 → 用户列表 | 超级管理员用户 |
| **部门管理** | 组织架构 → 部门管理 | 部门结构 |
| **职位管理** | 组织架构 → 职位管理 | 职位定义 |
| **职位级别** | 组织架构 → 职位级别 | 职位级别 |
| **审批规则** | 组织架构 → 审批规则 | 审批规则配置 |
| **工作流管理** | 工作流管理 | 工作流定义 |
| **环境变量** | `.env` 文件 | 数据库连接、JWT配置、存储路径 |

### 9.3 配置检查清单

在系统上线前，请完成以下检查：

```
□ 1. 数据库连接配置正确
□ 2. JWT密钥已配置且安全
□ 3. 邮件服务配置正确且可发送测试邮件
□ 4. 管理员用户已创建
□ 5. 基础角色和权限已配置
□ 6. 组织架构（部门、职位）已初始化
□ 7. 工作流和审批规则已配置
□ 8. 字典数据已初始化
□ 9. 文件存储路径存在且可写
□ 10. 系统基础信息（名称、Logo）已配置
```

### 9.4 配置优先级

配置项按以下优先级生效（高优先级覆盖低优先级）：

1. **命令行参数** > 2. **环境变量** > 3. **配置文件** > 4. **数据库配置** > 5. **默认值**

---

## 10. 数据迁移

### 10.1 字典库状态说明

**当前状态**: ✅ 表结构已创建，数据为空

字典库包含两个表：
- `dict_types`（字典类型表）：存储字典类型定义
- `dict_items`（字典项表）：存储具体的字典键值对

**预期配置的字典类型**:

| 字典类型编码 | 名称 | 用途 |
|--------------|------|------|
| `workflow_status` | 工作流状态 | 工作流的状态枚举（草稿、启用、禁用） |
| `approval_status` | 审批状态 | 审批任务的状态（待审批、已通过、已拒绝、已撤销） |
| `approval_result` | 审批结果 | 审批操作结果（同意、拒绝） |
| `workflow_type` | 工作流类型 | 工作流分类（请假、报销、采购、合同等） |
| `approval_mode` | 审批模式 | 审批模式（any、all、majority） |
| `rule_type` | 规则类型 | 审批规则类型（部门、职位级别、指定人员等） |
| `article_status` | 文章状态 | CMS文章状态（草稿、待审核、已通过、已拒绝） |
| `leave_type` | 请假类型 | 请假种类（事假、病假、年假、产假等） |
| `contract_type` | 合同类型 | 合同分类（销售合同、采购合同等） |

### 10.2 迁移文件规范

为确保数据库迁移的幂等性和可靠性，所有迁移文件必须遵循以下规范：

#### 10.2.1 CREATE TABLE 语句
```sql
-- 必须使用 IF NOT EXISTS
CREATE TABLE IF NOT EXISTS table_name (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ...
);
```

#### 10.2.2 CREATE INDEX 语句
```sql
-- 必须使用 IF NOT EXISTS
CREATE INDEX IF NOT EXISTS idx_table_name_column ON table_name(column);
```

#### 10.2.3 ALTER TABLE ADD CONSTRAINT 语句
> **注意**: PostgreSQL 不支持 `ALTER TABLE ADD CONSTRAINT IF NOT EXISTS` 语法，必须使用 PL/pgSQL 条件判断

```sql
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.table_constraints 
                   WHERE table_name = 'table_name' 
                     AND constraint_name = 'constraint_name') THEN
        ALTER TABLE table_name ADD CONSTRAINT constraint_name 
        FOREIGN KEY (column) REFERENCES other_table(id);
    END IF;
END $$;
```

#### 10.2.4 ALTER TABLE ADD COLUMN 语句
```sql
-- 必须使用 IF NOT EXISTS
ALTER TABLE IF EXISTS table_name ADD COLUMN IF NOT EXISTS new_column VARCHAR(100);
```

### 10.3 自动迁移配置

系统支持服务启动时自动执行未完成的数据库迁移，无需手动运行迁移命令。

#### 10.3.1 配置位置
自动迁移逻辑位于 `backend/core/src/main.rs`：

```rust
// 在数据库连接建立后执行自动迁移
sqlx::migrate!("./sqlx/migrations").run(&db).await?;
```

#### 10.3.2 配置说明

| 配置项 | 说明 |
|--------|------|
| 迁移目录 | `./sqlx/migrations` |
| 执行时机 | 服务启动时，数据库连接建立后 |
| 执行条件 | 自动检测未执行的迁移文件 |
| 幂等性要求 | 所有迁移文件必须保持幂等，确保可以安全重复执行 |

#### 10.3.3 优势

| 优势 | 说明 |
|------|------|
| 自动化 | 服务启动时自动执行迁移，无需人工干预 |
| 可靠性 | 确保数据库 schema 与代码版本同步 |
| 安全性 | 幂等设计确保重复执行不会破坏数据 |
| 可追溯 | 迁移记录存储在 `_sqlx_migrations` 表中 |

### 10.4 数据迁移顺序

数据迁移应按照以下顺序执行，确保表之间的外键约束不被破坏：

```
Step 1: 创建基础表结构
    ↓
Step 2: 初始化字典类型 (dict_types)
    ↓
Step 3: 初始化字典项 (dict_items)
    ↓
Step 4: 初始化职位级别 (position_levels)
    ↓
Step 5: 初始化部门 (departments)
    ↓
Step 6: 初始化职位 (positions)
    ↓
Step 7: 初始化审批规则 (approval_rules)
    ↓
Step 8: 初始化工作流 (workflows)
    ↓
Step 9: 初始化工作流步骤 (workflow_steps)
```

### 10.5 迁移脚本清单

| 迁移文件 | 版本 | 内容 | 状态 |
|----------|------|------|------|
| `001_create_users_table.up.sql` | v1 | 创建用户表 | ✅ 已执行 |
| `002_create_roles_table.up.sql` | v1 | 创建角色表 | ✅ 已执行 |
| `003_create_permissions_table.up.sql` | v1 | 创建权限表 | ✅ 已执行 |
| `004_create_departments_table.up.sql` | v1 | 创建部门表 | ✅ 已执行 |
| `005_create_position_levels_table.up.sql` | v1 | 创建职位级别表 | ✅ 已执行 |
| `006_create_positions_table.up.sql` | v1 | 创建职位表 | ✅ 已执行 |
| `007_create_dict_tables.up.sql` | v1 | 创建字典表 | ✅ 已执行 |
| `010_create_workflows_table.up.sql` | v1 | 创建工作流表 | ✅ 已执行 |
| `011_create_workflow_steps_table.up.sql` | v1 | 创建工作流步骤表 | ✅ 已执行 |
| `012_create_approval_rules_table.up.sql` | v1 | 创建审批规则表 | ✅ 已执行 |
| `020_init_dict_types.up.sql` | v1 | 初始化字典类型 | ⏳ 待执行 |
| `021_init_dict_items.up.sql` | v1 | 初始化字典项 | ⏳ 待执行 |
| `022_init_workflow_data.up.sql` | v1 | 初始化工作流数据 | ✅ 已执行 |

### 10.6 字典初始化数据示例

#### 10.6.1 字典类型初始化

```sql
INSERT INTO dict_types (id, code, name, description) VALUES
('uuid-1', 'workflow_status', '工作流状态', '工作流的状态枚举'),
('uuid-2', 'approval_status', '审批状态', '审批任务的状态'),
('uuid-3', 'approval_result', '审批结果', '审批操作结果'),
('uuid-4', 'workflow_type', '工作流类型', '工作流分类'),
('uuid-5', 'approval_mode', '审批模式', '审批模式'),
('uuid-6', 'rule_type', '规则类型', '审批规则类型');
```

#### 10.6.2 字典项初始化（工作流状态）

```sql
INSERT INTO dict_items (id, type_code, item_code, item_name) VALUES
('uuid-1-1', 'workflow_status', 'draft', '草稿'),
('uuid-1-2', 'workflow_status', 'active', '启用'),
('uuid-1-3', 'workflow_status', 'inactive', '禁用');
```

#### 10.6.3 字典项初始化（审批模式）

```sql
INSERT INTO dict_items (id, type_code, item_code, item_name, description) VALUES
('uuid-5-1', 'approval_mode', 'any', '任意审批', '任意一人审批即可通过'),
('uuid-5-2', 'approval_mode', 'all', '全部审批', '所有人必须同意才能通过'),
('uuid-5-3', 'approval_mode', 'majority', '多数审批', '超过半数同意即可通过');
```

### 10.7 迁移执行命令

```bash
# 进入后端目录
cd /Users/xingzhai/POMP/backend/core

# 执行所有待执行的迁移
cargo sqlx migrate run --database-url postgres://postgres:postgres@localhost:5432/sksfems_db

# 查看迁移状态
cargo sqlx migrate list --database-url postgres://postgres:postgres@localhost:5432/sksfems_db
```

### 10.8 数据备份与恢复

**备份命令**:
```bash
pg_dump -h localhost -U postgres -d sksfems_db -f backup_$(date +%Y%m%d).sql
```

**恢复命令**:
```bash
psql -h localhost -U postgres -d sksfems_db -f backup_20260511.sql
```

---

## 12. 数据库迁移管理最佳实践

### 12.1 迁移执行机制

SQLx 迁移的工作原理：
- 迁移文件存放在 `sqlx/migrations/` 目录下
- 按数字版本号顺序执行
- 已执行的迁移记录在 `_sqlx_migrations` 表中
- 服务启动时自动执行所有未记录的迁移

### 12.2 新迁移文件添加流程

当需要添加新的数据库表或修改时，按以下步骤操作：

1. **创建迁移文件**
   ```bash
   cd /Users/xingzhai/POMP/backend/core
   # 注意：使用连续的版本号，不要跳跃
   cargo sqlx migrate add <描述名称>
   ```

2. **编辑迁移文件**
   - 遵循幂等性原则
   - 使用 `IF NOT EXISTS`
   - 外键约束使用 PL/pgSQL 条件判断

3. **测试迁移**
   ```bash
   # 方式1：重新部署测试（推荐）
   dropdb -h localhost -U postgres pomp
   createdb -h localhost -U postgres pomp
   cargo run  # 自动执行所有迁移

   # 方式2：在现有环境中运行
   cargo sqlx migrate run --database-url postgres://postgres:postgres@localhost:5432/pomp
   ```

### 12.3 常见问题与解决方案

#### 问题1：新迁移文件没有被自动执行
**原因**：服务启动时 `_sqlx_migrations` 表中已有记录，新迁移版本号未被识别

**解决方案**：
```bash
# 方式A：手动执行迁移
cd /Users/xingzhai/POMP/backend/core
cargo sqlx migrate run --database-url postgres://postgres:postgres@localhost:5432/pomp

# 方式B：全新部署（推荐用于测试）
dropdb -h localhost -U postgres pomp
createdb -h localhost -U postgres pomp
cargo run
```

#### 问题2：迁移执行冲突
**原因**：重复执行迁移时，表/索引已存在

**解决方案**：
- 确保所有迁移文件使用 `IF NOT EXISTS`
- 使用 PL/pgSQL 条件判断避免约束冲突

### 12.4 生产环境部署检查清单

- [ ] 备份现有数据库
- [ ] 在测试环境验证迁移
- [ ] 确认所有迁移文件为幂等性
- [ ] 执行迁移
- [ ] 验证 API 正常运行
- [ ] 监控日志

---

## 13. 默认用户与认证配置

### 13.1 测试用户信息

系统初始化后，数据库中没有预设用户，需要手动创建或通过注册接口创建。以下是推荐的测试用户配置：

| 用户信息 | 值 |
|---------|-----|
| 用户ID | `a0049509-3f20-46ad-adc0-416b3ba1c0a0` |
| 用户名 | `admin` |
| 邮箱 | `admin@example.com` |
| 密码 | `admin123` |
| 姓名 | 管理员 |
| 角色 | 超级管理员 |

### 13.2 创建测试用户 SQL

```sql
-- 创建超级管理员用户
INSERT INTO users (
    id, 
    username, 
    email, 
    password_hash, 
    name, 
    is_superuser, 
    is_active, 
    status
) VALUES (
    'a0049509-3f20-46ad-adc0-416b3ba1c0a0',
    'admin',
    'admin@example.com',
    '$2b$12$EixZaYbB.rK4fl8x2q7Meu6Q6D2V5fF5Q5Q5Q5Q5Q5Q5Q5Q5Q',
    '管理员',
    true,
    true,
    'approved'
);
```

### 13.3 认证流程

系统使用 JWT 认证机制：

1. **登录获取 Token**
   ```bash
   POST /api/v1/auth/login
   Content-Type: application/json
   
   {
     "username": "admin",
     "password": "admin123"
   }
   ```

2. **携带 Token 请求**
   ```bash
   GET /api/v1/users/{user_id}/info
   Authorization: Bearer <token>
   ```

3. **Token 有效期**：默认 24 小时

### 13.4 认证错误排查

| 错误码 | 原因 | 解决方案 |
|--------|------|----------|
| 401 Unauthorized | 未携带 Token 或 Token 无效 | 重新登录获取 Token |
| 401 Unauthorized | 用户不存在 | 确认用户已创建 |
| 401 Unauthorized | 用户未激活 | 设置 `is_active = true` |

---

## 14. 帮助中心自动初始化

### 14.1 初始化机制

系统启动时会**自动初始化**帮助中心内容，无需手动调用接口。初始化逻辑位于 `state.rs` 的 `build()` 方法中。

### 14.2 初始化内容

**预设分类（7个）**：
| 分类编码 | 分类名称 | 图标 |
|----------|----------|------|
| getting-started | 快速入门 | Rocket |
| admin-modules | 行政综合管理 | Building |
| hr-modules | 人力资源管理 | Users |
| production-modules | 生产运营管理 | Factory |
| engineering-modules | 工程项目管理 | HardHat |
| gis-modules | GIS地理信息 | Map |
| ai-assistant | AI智能助手 | Bot |

**预设文章（12篇）**：
- 欢迎使用三楷深发管理系统
- 首次登录系统
- 员工档案管理
- 考勤打卡操作
- 生产计划管理
- 质量管控流程
- 工程项目全生命周期
- 外勤人员管理
- GIS功能概览
- 资产位置管理
- AI助手功能说明
- AI文生图使用指南

### 14.3 初始化特点

| 特点 | 说明 |
|------|------|
| 幂等性 | 已存在的分类/文章不会重复创建 |
| 自动执行 | 服务启动时自动执行，无需手动干预 |
| 日志记录 | 初始化过程有详细日志输出 |
| 容错性 | 初始化失败不会影响服务启动 |

### 14.4 手动初始化接口

如需手动重新初始化，可调用：

```bash
POST /api/v1/help/init
```

---

## 15. 组织架构初始化

### 15.1 初始化机制

系统启动时自动创建组织架构相关表和默认数据，包含在迁移文件 `026_create_organization_tables.up.sql` 中。

### 15.2 默认部门数据（7个）

| 编码 | 名称 | 排序 |
|------|------|------|
| general | 总经办 | 1 |
| hr | 人力资源部 | 2 |
| finance | 财务部 | 3 |
| admin | 行政部 | 4 |
| production | 生产部 | 5 |
| tech | 技术研发部 | 6 |
| marketing | 市场部 | 7 |

### 15.3 默认岗位等级（7个）

| 编码 | 名称 | 等级 |
|------|------|------|
| junior | 初级 | 1 |
| middle | 中级 | 2 |
| senior | 高级 | 3 |
| supervisor | 主管 | 4 |
| manager | 经理 | 5 |
| director | 总监 | 6 |
| executive | 高管 | 7 |

### 15.4 默认岗位（14个）

| 编码 | 名称 | 所属部门 | 等级 | 是否负责人 |
|------|------|----------|------|-----------|
| gm | 总经理 | 总经办 | 高管 | 是 |
| deputy_gm | 副总经理 | 总经办 | 总监 | 否 |
| hr_manager | 人力资源经理 | 人力资源部 | 经理 | 是 |
| hr_recruiter | 招聘专员 | 人力资源部 | 中级 | 否 |
| finance_manager | 财务经理 | 财务部 | 经理 | 是 |
| accountant | 会计 | 财务部 | 高级 | 否 |
| admin_supervisor | 行政主管 | 行政部 | 主管 | 是 |
| admin_assistant | 行政助理 | 行政部 | 初级 | 否 |
| production_manager | 生产经理 | 生产部 | 经理 | 是 |
| technician | 技术员 | 生产部 | 中级 | 否 |
| tech_director | 技术总监 | 技术研发部 | 总监 | 是 |
| rd_engineer | 研发工程师 | 技术研发部 | 高级 | 否 |
| marketing_manager | 市场经理 | 市场部 | 经理 | 是 |
| sales_rep | 销售代表 | 市场部 | 中级 | 否 |

---

## 16. 字典数据初始化

### 16.1 初始化机制

系统启动时自动初始化字典数据，包含在迁移文件 `027_init_dict_data.up.sql` 中。

### 16.2 默认字典类型（8个）

| 编码 | 名称 | 分类 |
|------|------|------|
| user_status | 用户状态 | system |
| user_role | 用户角色 | system |
| approval_status | 审批状态 | workflow |
| contract_status | 合同状态 | contract |
| article_status | 文章状态 | cms |
| priority | 优先级 | common |
| department_type | 部门类型 | organization |
| position_level | 岗位等级 | organization |

### 16.3 默认字典项（21个）

| 类型编码 | 编码 | 名称 | 值 |
|----------|------|------|------|
| user_status | pending | 待审核 | pending |
| user_status | approved | 已通过 | approved |
| user_status | rejected | 已拒绝 | rejected |
| user_status | disabled | 已禁用 | disabled |
| approval_status | pending | 待审批 | pending |
| approval_status | processing | 审批中 | processing |
| approval_status | approved | 已通过 | approved |
| approval_status | rejected | 已拒绝 | rejected |
| approval_status | cancelled | 已撤销 | cancelled |
| contract_status | draft | 草稿 | draft |
| contract_status | pending | 待审批 | pending |
| contract_status | active | 已生效 | active |
| contract_status | terminated | 已终止 | terminated |
| article_status | draft | 草稿 | draft |
| article_status | pending_review | 待审核 | pending_review |
| article_status | published | 已发布 | published |
| article_status | withdrawn | 已撤回 | withdrawn |
| priority | low | 低 | low |
| priority | medium | 中 | medium |
| priority | high | 高 | high |
| priority | urgent | 紧急 | urgent |

---

## 17. 版本历史

| 版本 | 日期 | 作者 | 变更说明 |
|------|------|------|----------|
| v1.10 | 2026-05-11 | System | 添加组织架构初始化和字典数据初始化章节，包含完整的默认数据清单 |
| v1.9 | 2026-05-11 | System | 添加数据库迁移管理最佳实践章节，包含迁移文件规范和自动迁移配置说明 |
| v1.8 | 2026-05-11 | System | 添加帮助中心自动初始化章节 |
| v1.7 | 2026-05-11 | System | 添加默认用户与认证配置章节 |
| v1.6 | 2026-05-11 | System | 添加数据库迁移管理最佳实践章节，包含迁移执行机制、新迁移文件添加流程、常见问题与解决方案、生产环境部署检查清单 |
| v1.5 | 2026-05-11 | System | 添加迁移文件规范（幂等性要求）和自动迁移配置说明，验证系统初始化流程 |
| v1.4 | 2026-05-11 | System | 完成所有配置项初始化，包括系统名称、邮件配置、安全配置、文件存储、字典数据、通知配置等 |
| v1.3 | 2026-05-11 | System | 更新配置项状态为已配置，添加文件上传配置详情（200MB，支持音视频格式），更新邮件配置详情 |
| v1.2 | 2026-05-11 | System | 添加系统必需配置项章节，包含配置项清单、配置模块映射、检查清单和配置优先级 |
| v1.1 | 2026-05-11 | System | 添加数据迁移章节，包含字典库状态说明、迁移顺序、迁移脚本清单和字典初始化数据 |
| v1.0 | 2026-05-11 | System | 初始版本，包含架构设计、数据库设计、API设计、前端组件设计和业务流程 |

---

**文档状态**: ✅ 已完成  
**最后更新**: 2026-05-12  
**适用版本**: v1.12