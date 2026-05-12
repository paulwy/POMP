# 英文辅助功能使用指南

## 概述

英文辅助功能是一个强大的 AI 助手，它可以帮助用户在填写表单时自动生成英文代码、翻译内容、生成描述等。

## 功能特点

### 1. 智能翻译
- 支持中英文双向翻译
- 包含企业管理领域的专业术语库
- 保持上下文相关的翻译

### 2. 命名规范建议
- 提供多种命名规范建议：
  - 驼峰命名法 (camelCase)
  - 下划线命名法 (snake_case)
  - 帕斯卡命名法 (PascalCase)
  - 短横线命名法 (kebab-case)
- 自动根据上下文推荐最合适的命名方式

### 3. 英文描述生成
- 根据中文内容自动生成专业的英文描述
- 支持技术文档风格

### 4. 自动模式
- 当启用自动模式时，在输入中文内容后自动生成英文
- 减少用户操作步骤

## 已集成的页面

### 1. 组织架构管理页面
- 职位级别：代码和描述字段
- 职位：代码和描述字段
- 部门：代码和描述字段

### 2. 字典管理页面
- 字典类型：代码和描述字段
- 字典项：代码和值字段

## 使用方法

### 方式一：手动触发
1. 在输入框中输入中文内容
2. 点击输入框旁边的 ✨ 图标按钮
3. 在弹出的面板中查看生成的建议
4. 点击「应用」按钮使用建议的内容
5. 或点击「复制」按钮复制内容后手动粘贴

### 方式二：快速生成
1. 在源字段中输入中文内容
2. 点击旁边的「✨ 生成」按钮
3. 自动生成并应用英文内容

### 方式三：自动模式
1. 在源字段中输入中文内容
2. 系统自动检测并生成英文内容
3. 直接应用到目标字段

## 组件使用示例

### 基本用法

```tsx
import { EnglishAssistant } from '@/components/EnglishAssistant';

// 在表单字段旁边添加英文辅助
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
    autoMode={true}
  />
</div>
```

### 组件属性

| 属性 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| value | string | 是 | - | 当前字段的值 |
| onChange | (value: string) => void | 是 | - | 值变化时的回调函数 |
| type | 'field_name' \| 'field_code' \| 'description' \| 'api_path' \| 'general' | 否 | 'general' | 字段类型，影响生成结果的风格 |
| sourceFieldValue | string | 否 | - | 源字段的值（通常是中文名称），用于从中生成英文 |
| autoMode | boolean | 否 | false | 是否启用自动模式 |
| placeholder | string | 否 | - | 占位文本（暂未使用） |

## 术语库

内置的企业管理领域术语库包括：

### 组织架构
- 部门 → department
- 子部门 → subDepartment
- 员工 → employee
- 职位 → position
- 入职日期 → joinDate

### 审批流程
- 审批 → approval
- 工作流 → workflow
- 审批人 → approver
- 申请人 → applicant

### 人力资源
- 考勤 → attendance
- 请假 → leave
- 工资 → salary
- 绩效 → performance

### 系统管理
- 设置 → setting
- 配置 → configuration
- 权限 → permission
- 角色 → role
- 用户 → user

### 合同管理
- 合同 → contract
- 协议 → agreement
- 条款 → clause
- 甲方 → partyA
- 乙方 → partyB
- 期限 → term

### 内容管理
- 内容 → content
- 文章 → article
- 分类 → category
- 媒体 → media
- 发布 → publication

## 后端 API

英文辅助功能的后端 API 位于：`/api/v1/english-ai/`

### 接口列表

1. **POST /api/v1/english-ai/translate**
   - 翻译文本
   - 请求参数：`{ text, source_lang?, target_lang?, context? }`

2. **POST /api/v1/english-ai/generate-description**
   - 生成英文描述
   - 请求参数：`{ chinese_description, style?, max_length? }`

3. **POST /api/v1/english-ai/suggest-naming**
   - 建议命名
   - 请求参数：`{ text, type? }`

4. **GET /api/v1/english-ai/terminology**
   - 查询术语库
   - 查询参数：`category?`, `query?`

## 在新页面中集成英文辅助

要在新页面中集成英文辅助功能，请按照以下步骤：

### 1. 导入组件

```tsx
import { EnglishAssistant } from '@/components/EnglishAssistant';
```

### 2. 在表单字段中添加

在需要英文辅助的字段旁边添加 `EnglishAssistant` 组件：

```tsx
<div className="space-y-2">
  <Label>字段名称</Label>
  <Input
    value={fieldName}
    onChange={(e) => setFieldName(e.target.value)}
  />
</div>

<div className="space-y-2">
  <Label>字段代码</Label>
  <div className="flex gap-2">
    <Input
      value={fieldCode}
      onChange={(e) => setFieldCode(e.target.value)}
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
</div>
```

### 3. 配置类型

根据字段的用途选择合适的类型：

- `field_code`：字段代码（推荐驼峰命名）
- `field_name`：字段名称
- `description`：描述文本
- `api_path`：API 路径
- `general`：通用文本

## 最佳实践

1. **合理使用自动模式**：在新建记录时启用自动模式，在编辑模式下禁用
2. **提供源字段值**：始终提供 sourceFieldValue，以获得更好的生成结果
3. **用户确认**：自动生成的内容始终允许用户修改
4. **错误处理**：捕获并适当处理 API 调用失败的情况
5. **术语更新**：定期更新术语库以保持翻译准确性

## 未来扩展

计划中的功能增强：

- 支持更多语言的翻译
- 自定义术语库
- 历史记录功能
- AI 模型切换
- 批量翻译功能
