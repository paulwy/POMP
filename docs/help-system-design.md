# 企业管理系统 - 智能帮助系统设计文档

**版本**: v1.0  
**日期**: 2026-05-10  
**状态**: 待审查

---

## 1. 概述

### 1.1 项目目标

为企业管理系统构建一个强大的、AI 驱动的帮助系统，为不同角色的用户提供全方位的帮助体验。

### 1.2 目标用户

- **管理员用户**: 系统配置、权限管理、流程设计
- **普通用户**: 日常操作、审批任务、内容管理

### 1.3 核心原则

- **渐进式开发**: 分三期实现，降低风险
- **角色适配**: 不同角色看到不同的帮助内容
- **AI 优先**: 智能推荐、智能客服、智能向导
- **多种入口**: 侧边抽屉 + 模态对话框 + 独立页面

---

## 2. 功能架构

### 2.1 第一期功能（核心基础）

| 功能模块 | 说明 |
|---------|------|
| 帮助中心独立页面 | 完整的帮助内容浏览体验 |
| 侧边抽屉 | 上下文相关的快速帮助 |
| 全局搜索 | 搜索帮助文章、FAQ |
| 新手引导 | 首次使用的分步教程 |
| 常见问题 (FAQ) | 按主题分类的常见问题 |
| 快捷键指南 | 系统快捷键列表 |
| 反馈通道 | 用户提交问题和建议 |
| 帮助内容管理 | 基础内容管理界面 |

### 2.2 第二期功能（AI 增强）

| 功能模块 | 说明 |
|---------|------|
| AI 智能客服聊天 | 类 ChatGPT 的对话界面 |
| 智能文档推荐 | 根据当前页面推荐相关内容 |
| 智能常见问题匹配 | 自动识别问题匹配 FAQ |
| AI 向导提示 | 用户卡顿时主动提示 |

### 2.3 第三期功能（高级智能）

| 功能模块 | 说明 |
|---------|------|
| 视频教程集成 | 嵌入操作演示视频 |
| AI 操作向导 | 自动完成常见操作 |
| AI 文档生成 | 根据操作自动生成帮助文档 |
| 智能分析报告 | 用户使用行为分析和优化建议 |

---

## 3. 详细设计

### 3.1 数据模型设计

#### 帮助文章表 (help_articles)

```sql
CREATE TABLE help_articles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(200) NOT NULL,
    slug VARCHAR(200) UNIQUE NOT NULL,
    content TEXT NOT NULL,
    summary TEXT,
    category_id UUID REFERENCES help_categories(id),
    role_restrictions VARCHAR(100)[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    view_count INTEGER DEFAULT 0,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
```

#### 帮助分类表 (help_categories)

```sql
CREATE TABLE help_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE
);
```

#### 常见问题表 (help_faqs)

```sql
CREATE TABLE help_faqs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    category_id UUID REFERENCES help_categories(id),
    role_restrictions VARCHAR(100)[] DEFAULT '{}',
    keywords VARCHAR(500)[],
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    view_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
```

#### 新手教程表 (help_tutorials)

```sql
CREATE TABLE help_tutorials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    target_role VARCHAR(50),
    steps JSONB NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
```

#### 快捷键表 (help_shortcuts)

```sql
CREATE TABLE help_shortcuts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key_combination VARCHAR(100) NOT NULL,
    description VARCHAR(200) NOT NULL,
    platform VARCHAR(20),  -- mac, windows, linux
    category VARCHAR(50),
    sort_order INTEGER DEFAULT 0
);
```

#### 用户反馈表 (help_feedback)

```sql
CREATE TABLE help_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    type VARCHAR(20) NOT NULL,  -- question, suggestion, bug
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',  -- pending, in_review, resolved
    response TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
```

#### AI 对话历史表 (help_ai_conversations)

```sql
CREATE TABLE help_ai_conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    messages JSONB NOT NULL,
    rating INTEGER,  -- 1-5
    feedback TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
```

### 3.2 前端架构

#### 文件结构

```text
frontend/src/
├── components/
│   └── help/
│       ├── HelpDrawer.tsx          # 侧边抽屉
│       ├── HelpDialog.tsx          # 模态对话框
│       ├── HelpSearch.tsx          # 搜索组件
│       ├── TutorialGuide.tsx       # 新手引导
│       ├── AIChatWidget.tsx        # AI 聊天组件
│       ├── ShortcutDisplay.tsx     # 快捷键显示
│       ├── FeedbackForm.tsx        # 反馈表单
│       ├── ContextualHelp.tsx      # 上下文帮助
│       └── ArticleRenderer.tsx     # 文章渲染器
├── pages/
│   └── HelpCenter.tsx              # 帮助中心独立页面
├── services/
│   └── help.ts                     # API 服务
└── types/
    └── help.ts                     # 类型定义
```

#### 路由设计

```text
/help                    # 帮助中心首页
/help/articles/:slug     # 文章详情页
/help/category/:slug     # 分类浏览页
/help/faq                # FAQ 页
/help/shortcuts          # 快捷键页
/help/feedback           # 反馈页
/help/tutorials          # 教程页
```

### 3.3 UI 设计

#### 帮助中心页面布局

```text
┌─────────────────────────────────────────────────────────┐
│  [Logo]  帮助中心                [搜索栏]  [AI 聊天]  │
├─────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌────────────────────────────────┐  │
│  │ 快速导航     │  │  首页 / 新手专区                │  │
│  │ • 新手入门   │  │                                │  │
│  │ • 常见问题   │  │  [热门文章卡片]                │  │
│  │ • 视频教程   │  │  [热门文章卡片]                │  │
│  │ • 快捷指南   │  │  [热门文章卡片]                │  │
│  │ • 联系我们   │  │                                │  │
│  └──────────────┘  │  分类浏览区                     │  │
│                     │  [分类卡片] [分类卡片] ...    │  │
│                     └────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

#### 侧边抽屉布局

```text
┌──────────────┐
│  [×] 帮助    │
├──────────────┤
│ [搜索输入]   │
├──────────────┤
│ 上下文相关   │
│ • 相关文章 1 │
│ • 相关文章 2 │
│ • 相关文章 3 │
├──────────────┤
│ 快速操作     │
│ • 查看常见问题│
│ • 打开新手引导│
│ • 提交反馈   │
│ • 打开 AI 聊天│
└──────────────┘
```

### 3.4 AI 功能设计

#### 智能推荐逻辑

```typescript
function recommendArticles(currentPage: string, userRole: string): Article[] {
    // 1. 根据当前页面找相关文章
    // 2. 根据用户角色过滤
    // 3. 根据热门程度排序
    // 4. 返回推荐结果
}
```

#### 新手引导触发规则

```typescript
function shouldShowTutorial(userId: string, page: string): boolean {
    // 1. 检查是否是首次访问
    // 2. 检查用户是否已完成该页面教程
    // 3. 检查用户是否已关闭引导
}
```

---

## 4. 内容管理

### 4.1 内容来源（混合方式）

| 内容类型 | 存储方式 | 说明 |
|---------|---------|------|
| 系统介绍、基础教程 | 硬编码 | 核心内容，确保可用性 |
| 常见问题 (FAQ) | CMS 管理 | 可随时更新 |
| 操作文章 | CMS 管理 | 可随时更新 |
| 新手教程 | 硬编码 + 配置 | 核心步骤硬编码，配置灵活 |
| 视频教程 | 外部链接 + CMS | YouTube/Bilibili 链接 |
| AI 提示词 | 配置管理 | 可优化调整 |

### 4.2 预置内容建议

**新手教程：**

1. 管理员入职指南 - 系统初始化配置
2. 员工入职指南 - 日常操作入门
3. 审批流程使用教程
4. 组织架构管理教程
5. 内容发布教程

**常见问题分类：**

- 账户与登录
- 审批流程
- 组织架构
- 内容管理
- 系统设置

---

## 5. API 设计

### 5.1 文章相关

- `GET /api/v1/help/articles` - 获取文章列表
- `GET /api/v1/help/articles/:slug` - 获取文章详情
- `POST /api/v1/help/articles` - 创建文章
- `PUT /api/v1/help/articles/:id` - 更新文章
- `DELETE /api/v1/help/articles/:id` - 删除文章

### 5.2 FAQ 相关

- `GET /api/v1/help/faqs` - 获取 FAQ 列表
- `POST /api/v1/help/faqs` - 创建 FAQ
- `PUT /api/v1/help/faqs/:id` - 更新 FAQ

### 5.3 AI 相关

- `POST /api/v1/help/ai/chat` - 发送聊天消息
- `POST /api/v1/help/ai/recommend` - 获取推荐
- `POST /api/v1/help/ai/feedback` - 提交 AI 对话反馈

### 5.4 反馈相关

- `GET /api/v1/help/feedback` - 获取反馈列表
- `POST /api/v1/help/feedback` - 提交反馈
- `PUT /api/v1/help/feedback/:id` - 处理反馈

---

## 6. 实现计划

### 第一期任务（核心基础）

1. [ ] 数据库表创建和迁移
2. [ ] 后端 API 开发
3. [ ] 帮助中心独立页面
4. [ ] 侧边抽屉组件
5. [ ] 搜索功能
6. [ ] 新手引导
7. [ ] FAQ 页面
8. [ ] 快捷键页面
9. [ ] 反馈功能
10. [ ] 内容管理界面

### 第二期任务（AI 增强）

1. [ ] AI 聊天组件
2. [ ] 智能文档推荐
3. [ ] 智能 FAQ 匹配
4. [ ] AI 向导提示
5. [ ] AI 配置管理界面

### 第三期任务（高级智能）

1. [ ] 视频教程集成
2. [ ] AI 操作向导
3. [ ] AI 文档生成
4. [ ] 使用分析报告
5. [ ] 性能优化和体验提升

---

## 7. 成功指标

| 指标 | 目标 |
|------|------|
| 帮助页面日活用户占比 | >15% |
| 搜索成功率 | >80% |
| AI 对话满意度 | >4.2/5.0 |
| 用户反馈响应时间 | <24h |
| 新手教程完成率 | >60% |

---

## 8. 附录

### 8.1 技术栈

- **前端**: React 18 + TypeScript + Tailwind CSS
- **后端**: Rust + Axum + SQLx + PostgreSQL
- **AI**: OpenAI API / Claude API（可配置）
- **向量搜索**: pgvector（用于相似度搜索）

### 8.2 安全考虑

- AI 对话记录加密存储
- 敏感操作记录审计日志
- 按角色过滤帮助内容
- 用户反馈匿名化选项

---

**文档结束**
