# 前端缺失模块检查报告

**生成时间**: 2026-05-13
**检查范围**: 后端API模块 vs 前端页面 vs 路由配置 vs 菜单项

---

## 总体统计

| 类别 | 数量 |
|------|------|
| 后端API Handler | 29个 |
| 前端Page组件 | 27个 |
| App.tsx路由 | ~40个 |
| 菜单项(工作台) | 11个主菜单 |

---

## 一、已有完整前后端对应的模块 ✅

| 后端模块 | 前端页面 | 路由 | 菜单 |
|----------|----------|------|------|
| auth | UserManagement | ✅ | ✅ 系统设置→用户管理 |
| auth | Login, Register | ✅ | ✅ |
| role | RoleManagement | ✅ | ✅ 系统设置→角色管理 |
| hr | HrManagement | ✅ | ✅ 人力资源 |
| cms | ContentManagement | ✅ | ✅ 内容管理 |
| website | WebsiteManagement | ✅ | ✅ 网站管理 |
| workflow | WorkflowManagement | ✅ | ✅ 系统设置→工作流设置 |
| workflow | ApprovalTasks, ApprovalHistory | ✅ | ✅ 审批管理 |
| schedule | ScheduleManagement | ✅ | ✅ 日程安排 |
| dict | DictManagement | ✅ | ✅ 系统设置→字典管理 |
| organization | OrganizationManagement | ✅ | ✅ 组织架构 |
| help | HelpCenter | ✅ | ✅ 帮助中心 |
| production_docs | ProductionDocsManagement | ✅ | ✅ 生产管理 |
| dashboard | Dashboard | ✅ | ✅ 工作台首页 |
| - | DocumentAiAssistant | ✅ | ✅ AI文档助手 |

---

## 二、后端有API但前端页面缺失 ⚠️

| 后端模块 | API路径前缀 | 缺失内容 |
|----------|-------------|----------|
| **field (外勤管理)** | `/api/v1/field/*` | ❌ 页面、❌ 路由、❌ 菜单 |
| **gis (GIS地图)** | `/api/v1/gis/*` | ❌ 页面、❌ 路由、❌ 菜单 |
| **contract (合同管理)** | `/api/v1/contracts/*` | ❌ 页面、❌ 路由、❌ 菜单 |
| **material_library (物料库)** | `/api/v1/materials/*` | ❌ 页面、❌ 路由、❌ 菜单 |
| **media (媒体上传)** | `/api/v1/media/*` | ⚠️ 组件缺失(内嵌使用) |
| **meeting_minutes (会议纪要)** | `/api/v1/meeting-minutes/*` | ⚠️ 组件缺失(内嵌使用) |
| **approval_comment (审批意见AI)** | `/api/v1/approval-comment/*` | ⚠️ 组件缺失(内嵌使用) |
| **english_ai (英文助手)** | `/api/v1/english-ai/*` | ⚠️ 组件缺失(内嵌使用) |
| **ai (文生图)** | `/api/v1/ai/*` | ⚠️ 组件缺失(内嵌使用) |

---

## 三、ERP模块详细状态 📊

### 3.1 后端API ✅

| ERP子模块 | API路径 | 状态 |
|-----------|---------|------|
| erp_inventory | `/api/v1/erp/products/*`, `/erp/warehouses/*`, `/erp/inventory/*` | ✅ 完整 |
| erp_purchase | `/api/v1/erp/suppliers/*`, `/erp/purchase-orders/*` | ✅ 完整 |
| erp_sales | `/api/v1/erp/customers/*`, `/erp/sales-orders/*` | ✅ 完整 |
| erp_finance | `/api/v1/erp/accounts/*`, `/erp/vouchers/*`, `/erp/payments/*` | ✅ 完整 |

### 3.2 前端界面 ❌

| 菜单项 | 路径 | 状态 |
|--------|------|------|
| 仓储物流 → 库存管理 | `/warehouse/inventory` | ❌ 无页面 |
| 仓储物流 → 采购管理 | `/warehouse/purchase` | ❌ 无页面 |
| 仓储物流 → 物流配送 | `/warehouse/logistics` | ❌ 无页面 |
| 财务管理 → 费用报销 | `/finance/expense` | ❌ 无页面 |
| 财务管理 → 应收应付 | `/finance/payments` | ❌ 无页面 |
| 财务管理 → 成本核算 | `/finance/cost` | ❌ 无页面 |
| 财务管理 → 财务报表 | `/finance/reports` | ❌ 无页面 |

---

## 四、菜单项无对应实现 ⚠️

以下菜单项在Sidebar.tsx中定义，但无对应路由和页面：

| 菜单路径 | 菜单项 | 状态 |
|---------|--------|------|
| `/warehouse` | 仓储物流 | ❌ 无页面 |
| `/warehouse/inventory` | 库存管理 | ❌ 无页面 |
| `/warehouse/purchase` | 采购管理 | ❌ 无页面 |
| `/warehouse/logistics` | 物流配送 | ❌ 无页面 |
| `/safety` | 安全环保 | ❌ 无页面 |
| `/safety/production` | 安全生产 | ❌ 无页面 |
| `/safety/environment` | 环境保护 | ❌ 无页面 |
| `/safety/hazard` | 隐患排查 | ❌ 无页面 |
| `/admin` | 行政综合 | ❌ 无页面 |
| `/admin/regulation` | 制度管理 | ❌ 无页面 |
| `/admin/document` | 公文管理 | ❌ 无页面 |
| `/admin/license` | 证照资质 | ❌ 无页面 |
| `/finance` | 财务管理 | ❌ 无页面 |
| `/finance/*` | 财务子菜单 | ❌ 无页面 |
| `/settings` | 系统设置 | ⚠️ 指向错误(需修复) |

---

## 五、已创建但未注册的前端页面 ✅→❌

以下页面文件存在，但未在App.tsx中注册路由：

| 页面文件 | 存在状态 | App.tsx注册 | 说明 |
|---------|----------|-------------|------|
| FieldManagement.tsx | ✅ 存在 | ❌ 未注册 | 外勤管理页面 |
| GISManagement.tsx | ✅ 存在 | ❌ 未注册 | GIS地图页面 |
| ContractManagement.tsx | ✅ 存在 | ❌ 未注册 | 合同管理页面 |
| MaterialLibrary.tsx | ✅ 存在 | ❌ 未注册 | 物料库页面 |

---

## 六、问题汇总

### 已修复 (高优先级) ✅

1. **FieldManagement.tsx** - ✅ 已注册路由 `/field` 和菜单项
2. **GISManagement.tsx** - ✅ 已注册路由 `/gis` 和菜单项
3. **ContractManagement.tsx** - ✅ 已注册路由 `/contracts` 和菜单项
4. **MaterialLibrary.tsx** - ✅ 已注册路由 `/materials` 和菜单项
5. **无效菜单项清理** - ✅ 已删除仓储物流、安全环保、行政综合、财务管理等无效菜单
6. **Settings路径修复** - ✅ 系统设置主路径已指向 `/system/config-center`

### 已实现 (ERP模块) ✅

1. **库存管理页面** - `/warehouse/inventory` - 产品列表、库存状态、搜索筛选
2. **采购管理页面** - `/warehouse/purchase` - 采购订单、供应商管理
3. **销售管理页面** - `/warehouse/sales` - 销售订单、客户管理
4. **财务管理页面** - `/finance` - 收付款管理、凭证管理、统计数据

### 待实现 (低优先级)

1. **智能对话助手** - 基于知识库的自然语言问答（可作为后续扩展）
2. **报表中心** - 可自定义的业务报表生成

### 中优先级 (建议处理)

1. **菜单路径清理** - 删除无效的菜单项或标记为待开发
2. **Settings路径** - 指向错误，应删除或修复

### 低优先级 (参考)

1. **内嵌组件** - media、meeting_minutes、approval_comment、english_ai、ai 可能需要独立页面

---

## 七、建议行动

### 立即行动 (1-2天)

1. 在App.tsx中注册 FieldManagement, GISManagement, ContractManagement, MaterialLibrary 路由
2. 在Sidebar.tsx中为这些模块添加工单菜单项

### 短期计划 (1周)

1. 创建ERP相关页面框架
2. 清理或标记无效菜单项

### 中期计划 (2-4周)

1. 实现ERP各模块完整功能
2. 完善各内嵌AI组件为独立页面

---

## 八、附录：API端点详细清单

### 已完成前后端对应

```text
✅ POST   /api/v1/auth/login
✅ POST   /api/v1/auth/register
✅ GET    /api/v1/auth/users
✅ POST   /api/v1/auth/users
✅ PUT    /api/v1/auth/users/:id
✅ DELETE /api/v1/auth/users/:id
✅ GET    /api/v1/roles
✅ POST   /api/v1/roles
✅ GET    /api/v1/hr/employees
✅ POST   /api/v1/hr/employees
✅ GET    /api/v1/hr/attendance/check-in
✅ POST   /api/v1/hr/attendance/check-out
✅ GET    /api/v1/cms/articles
✅ POST   /api/v1/cms/articles
✅ GET    /api/v1/website/settings
✅ PUT    /api/v1/website/settings
✅ GET    /api/v1/workflow/tasks/my
✅ POST   /api/v1/workflow/tasks
✅ POST   /api/v1/workflow/tasks/:id/approve
✅ GET    /api/v1/schedule/events
✅ POST   /api/v1/schedule/events
✅ GET    /api/v1/dashboard/stats
```

### 后端有但前端无页面

```text
⚠️ /api/v1/field/records/* (field.rs)
⚠️ /api/v1/gis/* (gis.rs)
⚠️ /api/v1/contracts/* (contract.rs)
⚠️ /api/v1/materials/* (material_library.rs)
⚠️ /api/v1/erp/products/* (erp_inventory.rs)
⚠️ /api/v1/erp/warehouses/* (erp_inventory.rs)
⚠️ /api/v1/erp/inventory/* (erp_inventory.rs)
⚠️ /api/v1/erp/suppliers/* (erp_purchase.rs)
⚠️ /api/v1/erp/purchase-orders/* (erp_purchase.rs)
⚠️ /api/v1/erp/customers/* (erp_sales.rs)
⚠️ /api/v1/erp/sales-orders/* (erp_sales.rs)
⚠️ /api/v1/erp/accounts/* (erp_finance.rs)
⚠️ /api/v1/erp/vouchers/* (erp_finance.rs)
⚠️ /api/v1/erp/payments/* (erp_finance.rs)
```
