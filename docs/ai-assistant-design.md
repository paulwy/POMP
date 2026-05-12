# AI助手系统设计文档

## 1. 概述

### 1.1 项目目标

为企业管理系统提供全面的 AI 辅助功能，包括文档 AI 助手、审批意见生成、会议纪要生成、文生图，以及表单填写时的英文代码和描述辅助。

### 1.2 技术选型

- **AI 服务提供商**: Together AI, Hugging Face
- **后端框架**: Axum (Rust)
- **前端框架**: React + TypeScript
- **已实现功能**: 
  - 文档 AI 助手（优化、API 文档生成、大纲生成、Markdown 格式化）
  - 审批评论 AI 生成与优化
  - 会议纪要 AI 生成与优化
  - AI 文生图

---

## 2. 系统架构

```text
┌─────────────────────────────────────────────────────────────────────┐
│                           前端 (React)                              │
│  ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐  │
│  │ 文档AI助手组件   │ │审批评论AI组件    │ │会议纪要AI组件    │  │
│  └────────┬─────────┘ └────────┬─────────┘ └────────┬─────────┘  │
│  ┌────────┴─────────┐ ┌────────┴─────────┐ ┌────────┴─────────┐  │
│  │  英文辅助组件    │ │  文生图组件      │ │  表单集成组件    │  │
│  └────────┬─────────┘ └────────┬─────────┘ └────────┬─────────┘  │
└───────────┼────────────────────┼────────────────────┼──────────────┘
            │                    │                    │
            └────────────────────┼────────────────────┘
                                 │ HTTPS/JSON
                    ┌─────────────┴──────────────┐
                    │    后端 (Axum Rust)        │
                    ├────────────────────────────┤
                    │  • /api/v1/ai/...          │
                    │  • /api/v1/approval-ai/... │
                    │  • /api/v1/meeting-ai/...  │
                    │  • /api/v1/document-ai/... │
                    │  • /api/v1/english-ai/...  │
                    └─────────────┬──────────────┘
                                  │
                    ┌─────────────┴──────────────┐
                    │   AI 服务提供商             │
                    │  (Together AI / Hugging Face) │
                    └────────────────────────────┘
```

---

## 3. 功能模块

### 3.1 已实现功能

#### 3.1.1 文档 AI 助手
- 文档内容优化
- API 文档生成（支持多种编程语言）
- 文档大纲生成
- Markdown 格式化
- 文生图功能

#### 3.1.2 审批评论 AI
- 审批意见自动生成
- 支持多种审批决定（同意、拒绝、需补充、需修改）
- 多种语言风格（正式、温和、严格）
- 已有评论优化

#### 3.1.3 会议纪要 AI
- 会议纪要自动生成
- 多种风格（正式、简洁、详细）
- 关键要点提取
- 行动项和决策项生成
- 已有纪要优化

#### 3.1.4 AI 文生图
- 支持多种图片风格（写实、动漫、艺术、设计、素描）
- 多种尺寸可选
- 批量生成

### 3.2 新增功能：英文辅助

#### 3.2.1 核心功能

1. **中英文双向翻译**
   - 表单字段实时翻译
   - 支持专业术语翻译
   - 保持格式和上下文

2. **代码/术语标准化**
   - 字段名、变量名规范建议
   - API 路径格式建议
   - 英文描述润色

3. **英文描述辅助生成**
   - 根据中文描述自动生成英文
   - 支持技术文档风格
   - 多种语气选择

4. **快捷建议**
   - 常用英文模板
   - 专业术语库
   - 常用表达建议

#### 3.2.2 应用场景

- 字段管理页面：字段名称、字段编码、字段描述
- 字典管理页面：字典编码、字典项名称
- API 文档编辑：接口路径、参数描述
- 合同管理：合同条款英文版本
- 其他包含英文代码/描述的表单

---

## 4. API设计

### 4.1 英文辅助 API

#### 4.1.1 翻译接口

**POST /api/v1/english-ai/translate**

**请求**:

```json
{
  "text": "部门名称",
  "source_lang": "zh",
  "target_lang": "en",
  "context": "field_name"
}
```

**响应**:

```json
{
  "success": true,
  "data": {
    "translated_text": "departmentName",
    "alternatives": [
      "department_name",
      "deptName"
    ],
    "suggestions": [
      "建议使用驼峰命名法：departmentName",
      "建议使用下划线命名法：department_name"
    ]
  }
}
```

#### 4.1.2 描述生成接口

**POST /api/v1/english-ai/generate-description**

**请求**:

```json
{
  "chinese_description": "用于存储公司部门信息的字段",
  "style": "technical",
  "max_length": 200
}
```

**响应**:

```json
{
  "success": true,
  "data": {
    "description": "A field used to store department information within the company.",
    "suggestions": [
      "Can add: including department ID, name, and hierarchy",
      "Consider specifying data type and constraints"
    ]
  }
}
```

#### 4.1.3 代码规范建议接口

**POST /api/v1/english-ai/suggest-naming**

**请求**:

```json
{
  "text": "员工入职日期",
  "type": "field_name"
}
```

**响应**:

```json
{
  "success": true,
  "data": {
    "recommended": "employeeJoinDate",
    "camel_case": "employeeJoinDate",
    "snake_case": "employee_join_date",
    "pascal_case": "EmployeeJoinDate",
    "kebab_case": "employee-join-date"
  }
}
```

#### 4.1.4 术语库查询接口

**GET /api/v1/english-ai/terminology?category=field&query=部门**

**响应**:

```json
{
  "success": true,
  "data": {
    "terms": [
      {
        "chinese": "部门",
        "english": "department",
        "category": "field",
        "examples": ["departmentId", "departmentName"]
      },
      {
        "chinese": "子部门",
        "english": "subDepartment",
        "category": "field",
        "examples": ["subDepartmentId"]
      }
    ]
  }
}
```

### 4.2 现有 API（简要）

#### 4.2.1 文档 AI API
- `POST /api/v1/document-ai/optimize` - 优化文档
- `POST /api/v1/document-ai/generate-api-doc` - 生成 API 文档
- `POST /api/v1/document-ai/generate-outline` - 生成大纲
- `POST /api/v1/document-ai/format-markdown` - 格式化 Markdown

#### 4.2.2 审批评论 AI API
- `POST /api/v1/approval-ai/generate` - 生成审批意见
- `POST /api/v1/approval-ai/optimize` - 优化审批意见

#### 4.2.3 会议纪要 AI API
- `POST /api/v1/meeting-ai/generate-minutes` - 生成会议纪要
- `POST /api/v1/meeting-ai/optimize-minutes` - 优化会议纪要

#### 4.2.4 文生图 API
- `POST /api/v1/ai/generate-image` - 生成图片
- `GET /api/v1/ai/status` - 获取 AI 服务状态

---

## 5. 系统Prompt设计

### 5.1 英文辅助系统Prompt

```text
你是一个专业的企业管理系统英文辅助助手，专门帮助用户处理与英文代码、术语、描述相关的任务。

【系统信息】
- 系统名称：SKSF-EMS 企业管理系统
- 主要功能模块：组织架构、审批流程、人力资源、考勤管理、系统设置、合同管理、内容管理等

【任务类型】
1. 翻译：在中文和英文之间进行准确翻译，特别注意专业术语
2. 命名规范：提供符合编程规范的命名建议（驼峰、下划线、帕斯卡等）
3. 描述生成：根据中文描述生成专业、清晰的英文描述
4. 术语查询：提供企业管理领域的专业术语对照

【命名规范原则】
- 字段名推荐使用驼峰命名法（camelCase）
- 常量使用全大写下划线（UPPER_SNAKE_CASE）
- 类名使用帕斯卡命名法（PascalCase）
- URL路径使用短横线命名法（kebab-case）
- 数据库字段使用下划线命名法（snake_case）

【专业术语库】
- 组织架构：organization, department, position, employee
- 审批流程：approval, workflow, process, reviewer, applicant
- 人力资源：hr, attendance, leave, salary, performance
- 系统设置：setting, configuration, permission, role, user
- 合同管理：contract, agreement, clause, party, term
- 内容管理：content, article, category, media, publication

【回答格式】
对于翻译任务：
{
  "translated_text": "翻译结果",
  "alternatives": ["备选1", "备选2"],
  "suggestions": ["建议1", "建议2"]
}

对于命名建议任务：
{
  "recommended": "推荐命名",
  "camel_case": "驼峰式",
  "snake_case": "下划线式",
  "pascal_case": "帕斯卡式",
  "kebab_case": "短横线式"
}
```

---

## 6. 前端组件设计

### 6.1 EnglishAssistant 组件

**属性**:
- `value`: 当前输入值
- `onChange`: 值变更回调
- `type`: 辅助类型（'field_name' | 'field_code' | 'description' | 'api_path'）
- `context`: 上下文信息（可选）

**功能**:
- 悬浮按钮触发辅助面板
- 实时翻译
- 命名建议
- 描述生成
- 术语查询

### 6.2 集成位置

应在以下页面集成英文辅助组件：
- FieldManagement.tsx（字段管理）
- DictManagement.tsx（字典管理）
- WorkflowManagement.tsx（工作流管理）
- ContractManagement.tsx（合同管理）
- ContentManagement.tsx（内容管理）
- 其他包含英文代码/描述的表单页面

---

## 7. 实施计划

### ✅ 已完成阶段

- [x] 文档 AI 助手（优化、API文档生成、大纲生成、Markdown格式化）
- [x] 审批评论 AI 生成与优化
- [x] 会议纪要 AI 生成与优化
- [x] AI 文生图功能

### 🔄 进行中阶段：英文辅助功能

- [ ] 后端英文辅助 API 实现
- [ ] 前端英文辅助组件开发
- [ ] 在字段管理页面集成
- [ ] 在字典管理页面集成
- [ ] 在其他表单页面集成

### 📋 未来扩展

- [ ] RAG 知识库检索
- [ ] 对话式 AI 助手
- [ ] 上下文感知智能推荐
- [ ] 多语言支持扩展

---

## 8. 配置说明

### 8.1 环境变量

```env
# AI 服务配置
TOGETHER_API_KEY=your_together_api_key
HUGGINGFACE_API_KEY=your_huggingface_api_key

# 英文辅助配置
ENGLISH_AI_MODEL=gpt-4o-mini
ENGLISH_AI_TEMPERATURE=0.7
ENGLISH_AI_MAX_TOKENS=1000
```

---

## 9. 安全考虑

1. **认证**: 所有 AI 接口需要 JWT 认证
2. **限流**: 防止滥用，设置频率限制
3. **审计**: 记录关键 API 调用日志
4. **数据隐私**: 敏感数据不记录在 AI 服务日志中

---

## 10. 监控与维护

1. **健康检查**: 定期检查 AI 服务连接状态
2. **性能监控**: 记录响应时间、token 使用量
3. **日志记录**: 记录 API 调用日志
4. **术语库更新**: 定期更新专业术语库

---

## 11. 附录

### 11.1 常用术语对照表

| 中文 | 英文（驼峰） | 英文（下划线） | 分类 |
|------|--------------|----------------|------|
| 部门 | departmentName | department_name | 字段 |
| 员工 | employeeName | employee_name | 字段 |
| 职位 | positionName | position_name | 字段 |
| 入职日期 | joinDate | join_date | 字段 |
| 审批状态 | approvalStatus | approval_status | 字段 |
| 请假类型 | leaveType | leave_type | 字段 |
| 部门ID | departmentId | department_id | 字段 |
| 员工ID | employeeId | employee_id | 字段 |

### 11.2 参考资源

- Together AI 文档: https://docs.together.ai
- Hugging Face 文档: https://huggingface.co/docs
- Axum 框架: https://github.com/tokio-rs/axum
