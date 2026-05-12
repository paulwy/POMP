# POMP 系统改进计划

> 创建日期: 2026-05-10
> 优先级说明: 🔴 高优先级 | 🟡 中优先级 | 🟢 低优先级

---

## 📋 改进任务清单

### 第一阶段：基础组件统一化 🔴

#### 1.1 创建统一的图表组件库
- [ ] 创建 `ChartContainer` 组件 - 统一图表包装器
- [ ] 创建 `StatCard` 组件 - 统计卡片组件
- [ ] 创建 `ChartTooltip` - 统一图表提示框样式
- [ ] 定义图表配色常量 `chartColors`
- [ ] 创建图表渐变色定义

**文件位置**: `frontend/src/components/ui/chart.tsx`

#### 1.2 完善 Button 组件变体
- [ ] 添加 `link` 变体
- [ ] 添加 `ghost` 变体的 hover 效果
- [ ] 添加 loading 状态样式

#### 1.3 创建 Dashboard 布局组件
- [ ] 创建 `DashboardHeader` - 仪表盘头部
- [ ] 创建 `DashboardGrid` - 仪表盘网格布局
- [ ] 创建 `DashboardCard` - 仪表盘卡片

**文件位置**: `frontend/src/components/dashboard/`

---

### 第二阶段：Dashboard 首页实现 🔴

#### 2.1 创建 Dashboard API
- [ ] 创建 `GET /api/v1/dashboard/stats` - 获取统计数据
- [ ] 创建 `GET /api/v1/dashboard/production-trend` - 生产趋势数据
- [ ] 创建 `GET /api/v1/dashboard/employee-distribution` - 员工分布数据

**文件位置**: `backend/core/src/api/handlers/dashboard.rs`

#### 2.2 实现 Dashboard 页面
- [ ] 创建 `Dashboard.tsx` 页面
- [ ] 添加统计卡片区（4个核心指标）
- [ ] 添加生产趋势面积图
- [ ] 添加部门分布饼图
- [ ] 添加考勤汇总柱状图

**文件位置**: `frontend/src/pages/Dashboard.tsx`

#### 2.3 Dashboard 数据获取
- [ ] 创建 `dashboardApi` 服务
- [ ] 实现数据获取 hooks
- [ ] 添加数据刷新功能

---

### 第三阶段：UI/UX 优化 🟡

#### 3.1 动画效果增强
- [ ] 添加按钮点击波纹效果
- [ ] 添加卡片悬停微动效
- [ ] 优化页面过渡动画
- [ ] 添加加载骨架屏动画

#### 3.2 主题系统
- [ ] 实现暗色主题切换
- [ ] 创建主题切换组件
- [ ] 保存主题偏好到 localStorage

#### 3.3 响应式优化
- [ ] 优化移动端导航
- [ ] 添加侧边栏折叠功能
- [ ] 优化表格响应式显示

---

### 第四阶段：图表增强 🟡

#### 4.1 HR 模块图表
- [ ] 员工结构分析（年龄、学历分布）
- [ ] 部门人员柱状图
- [ ] 请假类型饼图
- [ ] 入离职趋势图

#### 4.2 审批模块图表
- [ ] 待审批任务统计
- [ ] 审批效率趋势
- [ ] 审批类型分布

#### 4.3 生产模块图表
- [ ] 产量趋势图
- [ ] 合格率趋势图
- [ ] 设备利用率图

---

### 第五阶段：组件库完善 🟢

#### 5.1 高级组件
- [ ] 创建 `DataTable` - 高级数据表格（排序、筛选、分页）
- [ ] 创建 `DateRangePicker` - 日期范围选择器
- [ ] 创建 `FileUpload` - 文件上传组件
- [ ] 创建 `ImageGallery` - 图片画廊组件

#### 5.2 反馈组件
- [ ] 创建 `Toast` 通知组件（替代 Sonner）
- [ ] 创建 `ProgressBar` - 进度条
- [ ] 创建 `Skeleton` 列表
- [ ] 创建 `EmptyState` - 空状态组件

#### 5.3 表单组件
- [ ] 创建 `FormField` - 表单字段包装器
- [ ] 创建 `AddressInput` - 地址输入组件
- [ ] 创建 `PhoneInput` - 电话输入组件

---

## 🎯 实施优先级

### 当前会话（立即执行）
1. 🔴 创建统一的图表组件 (`ChartContainer`, `StatCard`)
2. 🔴 创建 Dashboard API
3. 🔴 实现 Dashboard 首页
4. 🔴 添加路由配置

### 后续迭代
1. 🟡 UI 动画增强
2. 🟡 暗色主题实现
3. 🟡 HR 模块图表
4. 🟡 审批模块图表

### 长期规划
1. 🟢 高级组件库
2. 🟢 国际化支持
3. 🟢 性能优化

---

## 📊 进度追踪

### 已完成 ✅
- [x] UI 设计系统文档创建
- [x] 配色方案定义
- [x] 字体系统规范
- [x] 间距系统规范
- [x] 动画基础定义
- [x] 组件规范文档

### 进行中 🔄
- [ ] 图表组件创建

### 待开始 ⏳
- [ ] Dashboard 实现
- [ ] 动画增强
- [ ] 主题系统

---

## 📁 相关文件

### 设计文档
- `docs/ui-design-system.md` - UI 设计系统完整文档

### 前端组件（待创建）
```
frontend/src/
├── components/
│   ├── ui/
│   │   ├── chart.tsx          # 图表组件
│   │   └── stat-card.tsx     # 统计卡片
│   └── dashboard/
│       ├── Dashboard.tsx       # 仪表盘页面
│       ├── DashboardHeader.tsx
│       ├── DashboardGrid.tsx
│       └── DashboardCard.tsx
└── pages/
    └── Dashboard.tsx           # 路由页面
```

### 后端 API（待创建）
```
backend/core/src/
├── api/handlers/
│   └── dashboard.rs           # Dashboard API 处理器
└── services/
    └── dashboard_service.rs   # Dashboard 服务层
```

### 前端服务（待创建）
```
frontend/src/
└── services/
    ├── dashboard.ts           # Dashboard API 调用
    └── analytics.ts          # 数据分析 API
```

---

## 🔗 依赖关系

### Dashboard 实现依赖
```
Dashboard.tsx
├── StatCard (需要先创建)
├── ChartContainer (需要先创建)
│   └── recharts 库 (已安装)
├── dashboard.ts (需要先创建 API)
│   └── /api/v1/dashboard/* (需要后端实现)
└── useAuthStore (已存在)
```

### 图表组件依赖
```
ChartContainer
├── tailwind.config.js (已有)
├── recharts (已安装)
└── CSS 变量 (已有定义)
```

---

## 📅 预估工时

| 任务 | 预估时间 | 优先级 |
|------|---------|--------|
| 图表组件创建 | 2-3 小时 | 🔴 高 |
| Dashboard 实现 | 3-4 小时 | 🔴 高 |
| 动画增强 | 2 小时 | 🟡 中 |
| 暗色主题 | 3 小时 | 🟡 中 |
| HR 图表 | 2 小时 | 🟡 中 |

---

**最后更新**: 2026-05-10
**下次审查**: 2026-05-11
