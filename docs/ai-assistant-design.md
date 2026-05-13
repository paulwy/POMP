# AI助手系统设计文档

## 1. 概述

### 1.1 项目目标

为企业管理系统提供全面的 AI 辅助功能，包括：

- 文档 AI 助手（优化、API 文档生成、大纲生成、Markdown 格式化）
- 审批评论 AI 生成与优化
- 会议纪要 AI 生成与优化
- AI 文生图功能
- **英文辅助功能**（自动生成英文代码、翻译、描述）

### 1.2 技术选型

- **AI 服务提供商**: Together AI, Hugging Face
- **后端框架**: Axum (Rust)
- **前端框架**: React + TypeScript
- **本地大模型支持** (可选): Ollama
- **模型**: Qwen2.5 系列或其他支持多语言的模型

---

## 2. 系统架构

```text
┌─────────────────────────────────────────────────────────────────────┐
│                           前端 (React)                               │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐     │
│  │ 文档AI助手组件  │ │ 审批评论AI组件  │ │ 会议纪要AI组件  │     │
│  └────────┬────────┘ └────────┬────────┘ └────────┬────────┘     │
│  ┌────────┴────────┐ ┌────────┴────────┐ ┌────────┴────────┐     │
│  │ 英文辅助组件    │ │ 文生图组件      │ │ 表单集成组件    │     │
│  └────────┬────────┘ └────────┬────────┘ └────────┬────────┘     │
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

- ✅ 文档内容优化
- ✅ API 文档生成（支持多种编程语言）
- ✅ 文档大纲生成
- ✅ Markdown 格式化
- ✅ 文生图功能

#### 3.1.2 审批评论 AI

- ✅ 审批意见自动生成
- ✅ 支持多种审批决定（同意、拒绝、需补充、需修改）
- ✅ 多种语言风格（正式、温和、严格）
- ✅ 已有评论优化

#### 3.1.3 会议纪要 AI

- ✅ 会议纪要自动生成
- ✅ 多种风格（正式、简洁、详细）
- ✅ 关键要点提取
- ✅ 行动项和决策项生成
- ✅ 已有纪要优化

#### 3.1.4 英文辅助 AI

- ✅ 中英文双向翻译
- ✅ 命名规范建议（驼峰、下划线、帕斯卡、短横线）
- ✅ 英文描述生成
- ✅ 术语库查询
- ✅ 自动模式（输入中文自动生成英文）

### 3.2 英文辅助功能详解

#### 3.2.1 核心功能

1. **智能翻译**
   - 中英文双向翻译
   - 内置企业管理专业术语库
   - 上下文感知的翻译
   - 支持多种场景（字段命名、描述生成等）

2. **命名规范建议**
   - 驼峰命名法 (camelCase) - 推荐用于变量和函数
   - 下划线命名法 (snake_case) - 推荐用于数据库字段
   - 帕斯卡命名法 (PascalCase) - 推荐用于类和组件
   - 短横线命名法 (kebab-case) - 推荐用于 URL 和 CSS

3. **英文描述生成**
   - 根据中文描述自动生成专业英文
   - 支持技术文档风格
   - 自动调整语言风格（正式、简洁、详细）

4. **术语库**
   - 组织架构类
   - 审批流程类
   - 人力资源类
   - 系统管理类
   - 合同管理类
   - 内容管理类

5. **自动辅助模式**
   - 检测源字段变化，自动生成英文
   - 减少用户操作步骤
   - 可以手动覆盖自动生成的内容

#### 3.2.2 已集成页面

1. **组织架构管理页面**
   - 职位级别：代码和描述字段
   - 职位：代码和描述字段
   - 部门：代码和描述字段

2. **字典管理页面**
   - 字典类型：代码和描述字段
   - 字典项：代码和值字段

#### 3.2.3 工作原理

1. 用户在中文名称字段输入内容
2. 系统检测到变化后调用英文辅助 API
3. API 根据术语库和命名规则生成英文
4. 用户可以直接应用、修改或查看其他建议

---

## 4. API设计

### 4.1 英文辅助 API

#### 4.1.1 翻译接口

### POST /api/v1/english-ai/translate**

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

### POST /api/v1/english-ai/generate-description**

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

#### 4.1.3 命名规范建议接口

### POST /api/v1/english-ai/suggest-naming**

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

### GET /api/v1/english-ai/terminology?category=field&query=部门**

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

### 4.2 其他现有 AI API（简要）

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

## 5. 前端组件设计

### 5.1 EnglishAssistant 组件

#### 组件特性

- **双按钮设计**:
  - ✨ 图标按钮：打开完整的辅助面板
  - ✨ 生成按钮：快速生成并应用英文

- **完整辅助面板**:
  - 标准翻译结果
  - 多种命名规范建议（高亮推荐方案）
  - 英文描述（如果适用）
  - 备选方案
  - AI 建议提示
  - 重新生成功能

- **自动模式**:
  - 监听源字段变化
  - 自动生成并应用英文
  - 用户仍可手动修改

#### 组件属性

| 属性 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| value | string | 是 | - | 当前字段的值 |
| onChange | (value: string) => void | 是 | - | 值变化时的回调函数 |
| type | 'field_name' \| 'field_code' \| 'description' \| 'api_path' \| 'general' | 否 | 'general' | 字段类型 |
| sourceFieldValue | string | 否 | - | 源字段的值（通常是中文名称） |
| autoMode | boolean | 否 | false | 是否启用自动模式 |

#### 使用示例

```tsx
import { EnglishAssistant } from '@/components/EnglishAssistant';

// 在表单字段中添加英文辅助
<div className="flex gap-2">
  <Input
    value={fieldCode}
    onChange={(e) => setFieldCode(e.target.value)}
    placeholder="输入字段代码"
    className="flex-1"
  />
  <EnglishAssistant
    value={fieldCode}
    onChange={(val) => setFieldCode(val)}
    type="field_code"
    sourceFieldValue={fieldName}
    autoMode={!isEditing}
  />
</div>
```

---

## 6. 实施计划

### ✅ 已完成阶段

- ✅ 文档 AI 助手（优化、API文档生成、大纲生成、Markdown格式化）
- ✅ 审批评论 AI 生成与优化
- ✅ 会议纪要 AI 生成与优化
- ✅ AI 文生图功能
- ✅ 英文辅助功能（后端 API、前端组件、集成到关键页面）
- ✅ 英文辅助使用文档

### 📋 未来扩展

- [ ] 在更多页面集成英文辅助功能
- [ ] 对话式 AI 助手（帮助中心聊天）
- [ ] RAG 知识库检索
- [ ] 上下文感知智能推荐
- [ ] 自定义术语库管理
- [ ] 更多语言支持

---

## 7. 配置说明

### 7.1 环境变量

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

## 8. 安全考虑

1. **认证**: 所有 AI 接口需要 JWT 认证
2. **限流**: 防止滥用，设置频率限制
3. **审计**: 记录关键 API 调用日志
4. **数据隐私**: 敏感数据不记录在 AI 服务日志中
5. **输入验证**: 验证所有用户输入，防止注入攻击

---

## 9. 监控与维护

1. **健康检查**: 定期检查 AI 服务连接状态
2. **性能监控**: 记录响应时间、token 使用量
3. **日志记录**: 记录 API 调用日志
4. **术语库更新**: 定期更新专业术语库
5. **错误处理**: 完善的错误处理和用户提示

---

## 10. 使用说明

详细的使用指南请参阅：

- [英文辅助功能使用指南](./ENGLISH_ASSISTANT_GUIDE.md)

---

## 11. 参考资源

- Together AI 文档: <https://docs.together.ai>
- Hugging Face 文档: <https://huggingface.co/docs>
- Axum 框架: <https://github.com/tokio-rs/axum>
- React 文档: <https://react.dev>
