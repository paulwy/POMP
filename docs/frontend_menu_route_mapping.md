# 前端菜单、路由、页面对应关系表

## 📋 概览

| 模块 | 菜单项 | 路由 | 页面组件 | 后端API | 状态 |
|------|--------|------|----------|---------|------|
| **工作台** | 工作台 | `/` | `Dashboard.tsx` | `/api/v1/dashboard/*` | ✅ |
| **审批管理** | 待我审批 | `/approvals` | `ApprovalManagement.tsx` | `/api/v1/workflow/*` | ✅ |
| | 我发起的 | `/approvals/my-requests` | `ApprovalManagement.tsx` | `/api/v1/workflow/*` | ✅ |
| | 审批历史 | `/approvals/history` | `ApprovalManagement.tsx` | `/api/v1/workflow/*` | ✅ |
| **日程管理** | 我的日程 | `/schedule/my` | `ScheduleManagement.tsx` | `/api/v1/schedule/*` | ✅ |
| | 会议安排 | `/schedule/meetings` | `ScheduleManagement.tsx` | `/api/v1/schedule/*` | ✅ |
| **内容管理** | CMS管理 | `/content-management` | `ContentManagement.tsx` | `/api/v1/cms/*` | ✅ |
| **网站管理** | 网站部署 | `/website-management` | `WebsiteManagement.tsx` | `/api/v1/website/*` | ✅ |
| **文档AI** | 文档优化 | `/document-ai` | `DocumentAI.tsx` | `/api/v1/document-ai/*` | ✅ |
| **组织架构** | 组织管理 | `/organization` | `OrganizationManagement.tsx` | `/api/v1/organization/*` | ✅ |
| | 职位体系 | `/organization/positions` | `OrganizationManagement.tsx` | `/api/v1/organization/positions` | ✅ |
| **生产文档** | 文档管理 | `/production-docs/documents` | `ProductionDocs.tsx` | `/api/v1/production-docs/*` | ✅ |
| | 技术标准 | `/production-docs/standards` | `ProductionDocs.tsx` | `/api/v1/production-docs/*` | ✅ |
| | 安全规程 | `/production-docs/safety` | `ProductionDocs.tsx` | `/api/v1/production-docs/*` | ✅ |
| | 质量标准 | `/production-docs/quality` | `ProductionDocs.tsx` | `/api/v1/production-docs/*` | ✅ |
| **外勤管理** | 外勤记录 | `/field` | `FieldManagement.tsx` | `/api/v1/field/*` | ✅ |
| **GIS地图** | GIS地图 | `/gis` | `GISManagement.tsx` | `/api/v1/gis/*` | ✅ |
| **合同管理** | 合同管理 | `/contracts` | `ContractManagement.tsx` | `/api/v1/contracts/*` | ✅ |
| **素材库** | 素材库 | `/materials` | `MaterialLibrary.tsx` | `/api/v1/materials/*` | ✅ |
| **仓储物流** | 库存管理 | `/warehouse/inventory` | `WarehouseManagement.tsx` | `/api/v1/erp/*` | ✅ |
| | 采购管理 | `/warehouse/purchase` | `WarehouseManagement.tsx` | `/api/v1/erp/purchase/*` | ✅ |
| | 销售管理 | `/warehouse/sales` | `WarehouseManagement.tsx` | `/api/v1/erp/sales/*` | ✅ |
| **财务管理** | 财务管理 | `/finance` | `FinanceManagement.tsx` | `/api/v1/finance/*` | ⚠️ |
| **人力资源** | 员工管理 | `/hr/employees` | `HREmployeeManagement.tsx` | `/api/v1/hr/*` | ✅ |
| | 考勤管理 | `/hr/attendance` | `HRAttendanceManagement.tsx` | `/api/v1/hr/attendance/*` | ✅ |
| | 请假管理 | `/hr/leave` | `HRLeaveManagement.tsx` | `/api/v1/hr/*` | ✅ |
| **系统管理** | 用户管理 | `/users` | `UserManagement.tsx` | `/api/v1/users/*` | ✅ |
| | 角色管理 | `/system/roles` | `RoleManagement.tsx` | `/api/v1/roles/*` | ✅ |
| | 配置中心 | `/system/config-center` | `ConfigCenter.tsx` | - | ⚠️ |
| | 工作流设置 | `/workflow-settings` | `WorkflowSettings.tsx` | `/api/v1/workflows/*` | ✅ |
| | 字典管理 | `/system/dict` | `DictManagement.tsx` | `/api/v1/dicts/*` | ✅ |
| **帮助中心** | 帮助中心 | `/help` | `HelpCenter.tsx` | `/api/v1/help/*` | ✅ |

---

## 详细分析

### ✅ 已完成的模块

#### 1. 组织架构管理
- **菜单**: 组织管理 → 职位体系
- **路由**: `/organization` → `/organization/positions`
- **页面**: `OrganizationManagement.tsx`
- **AI功能**: AI生成职位描述 ✅

#### 2. 审批管理
- **菜单**: 待我审批 / 我发起的 / 审批历史
- **路由**: `/approvals` → `/approvals/my-requests` → `/approvals/history`
- **页面**: `ApprovalManagement.tsx` + `ApprovalDetail.tsx`
- **AI功能**: AI生成审批意见 ✅

#### 3. GIS地图管理
- **菜单**: GIS地图
- **路由**: `/gis`
- **页面**: `GISManagement.tsx`
- **API**: `/api/v1/gis/*` ✅

#### 4. 字典管理
- **菜单**: 系统管理 → 字典管理
- **路由**: `/system/dict`
- **页面**: `DictManagement.tsx`
- **API**: `/api/v1/dicts/*` ✅

#### 5. 外勤管理
- **菜单**: 外勤记录
- **路由**: `/field`
- **页面**: `FieldManagement.tsx`
- **API**: `/api/v1/field/*` ✅

#### 6. 合同管理
- **菜单**: 合同管理
- **路由**: `/contracts`
- **页面**: `ContractManagement.tsx`
- **API**: `/api/v1/contracts/*` ✅

#### 7. 素材库
- **菜单**: 素材库
- **路由**: `/materials`
- **页面**: `MaterialLibrary.tsx`
- **API**: `/api/v1/materials/*` ✅

---

### ⚠️ 待完善的模块

#### 1. 财务管理
- **菜单**: 财务管理
- **路由**: `/finance`
- **页面**: `FinanceManagement.tsx` - 需确认
- **API**: `/api/v1/finance/*` - 需确认

#### 2. 配置中心
- **菜单**: 系统管理 → 配置中心
- **路由**: `/system/config-center`
- **页面**: `ConfigCenter.tsx` - 需确认
- **API**: 暂无后端API

---

## 路由配置

### App.tsx 路由列表

```tsx
<Routes>
  {/* 公开路由 */}
  <Route path="/login" element={<Login />} />
  <Route path="/register" element={<Register />} />
  
  {/* 受保护路由 */}
  <Route path="/" element={<Dashboard />} />
  <Route path="/approvals" element={<ApprovalManagement />} />
  <Route path="/approvals/:taskId" element={<ApprovalDetail />} />
  <Route path="/approvals/my-requests" element={<ApprovalManagement />} />
  <Route path="/approvals/history" element={<ApprovalManagement />} />
  <Route path="/schedule" element={<ScheduleManagement />} />
  <Route path="/content-management" element={<ContentManagement />} />
  <Route path="/website-management" element={<WebsiteManagement />} />
  <Route path="/document-ai" element={<DocumentAI />} />
  <Route path="/organization" element={<OrganizationManagement />} />
  <Route path="/production-docs" element={<ProductionDocs />} />
  <Route path="/field" element={<FieldManagement />} />
  <Route path="/gis" element={<GISManagement />} />
  <Route path="/contracts" element={<ContractManagement />} />
  <Route path="/materials" element={<MaterialLibrary />} />
  <Route path="/warehouse/inventory" element={<WarehouseManagement />} />
  <Route path="/warehouse/purchase" element={<WarehouseManagement />} />
  <Route path="/warehouse/sales" element={<WarehouseManagement />} />
  <Route path="/finance" element={<FinanceManagement />} />
  <Route path="/hr/employees" element={<HREmployeeManagement />} />
  <Route path="/hr/attendance" element={<HRAttendanceManagement />} />
  <Route path="/hr/leave" element={<HRLeaveManagement />} />
  <Route path="/help" element={<HelpCenter />} />
  
  {/* 管理后台路由 */}
  <Route path="/users" element={<UserManagement />} requireAdmin />
  <Route path="/system/roles" element={<RoleManagement />} requireAdmin />
  <Route path="/system/config-center" element={<ConfigCenter />} requireAdmin />
  <Route path="/workflow-settings" element={<WorkflowSettings />} requireAdmin />
  <Route path="/system/dict" element={<DictManagement />} requireAdmin />
</Routes>
```

---

## 菜单配置

### Sidebar.tsx 菜单结构

```tsx
const menuItems = [
  { label: '工作台', path: '/', icon: <Home /> },
  {
    label: '审批管理',
    path: '/approvals',
    children: [
      { label: '待我审批', path: '/approvals' },
      { label: '我发起的', path: '/approvals/my-requests' },
      { label: '审批历史', path: '/approvals/history' },
    ]
  },
  { label: '日程管理', path: '/schedule' },
  { label: '内容管理', path: '/content-management' },
  { label: '网站管理', path: '/website-management' },
  { label: '文档AI', path: '/document-ai' },
  { label: '组织架构', path: '/organization' },
  { label: '生产文档', path: '/production-docs' },
  { label: '外勤管理', path: '/field' },
  { label: 'GIS地图', path: '/gis' },
  { label: '合同管理', path: '/contracts' },
  { label: '素材库', path: '/materials' },
  { label: '仓储物流', path: '/warehouse/inventory' },
  { label: '财务管理', path: '/finance' },
  {
    label: '人力资源',
    path: '/hr/employees',
    children: [
      { label: '员工管理', path: '/hr/employees' },
      { label: '考勤管理', path: '/hr/attendance' },
      { label: '请假管理', path: '/hr/leave' },
    ]
  },
  {
    label: '系统管理',
    path: '/system/config-center',
    requireAdmin: true,
    children: [
      { label: '用户管理', path: '/users', requireAdmin: true },
      { label: '角色管理', path: '/system/roles', requireAdmin: true },
      { label: '配置中心', path: '/system/config-center', requireAdmin: true },
      { label: '工作流设置', path: '/workflow-settings', requireAdmin: true },
      { label: '字典管理', path: '/system/dict', requireAdmin: true },
    ]
  },
  { label: '帮助中心', path: '/help' },
];
```

---

## 待确认问题

| 问题 | 描述 | 状态 |
|------|------|------|
| 财务管理 | `FinanceManagement.tsx` 是否存在？后端API是否完整？ | ⚠️ 待确认 |
| 配置中心 | `ConfigCenter.tsx` 是否存在？功能需求是什么？ | ⚠️ 待确认 |
| 门户首页 | 公开门户路由 `/portal/*` 是否完整？ | ⚠️ 待确认 |

---

*最后更新: 2026-05-14*
