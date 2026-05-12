
# 文档AI助手使用指南

## 概述

文档AI助手是一个集成在企业管理系统中的工具，利用本地LLM（Ollama）提供智能文档处理能力，包括文档优化、API文档生成、大纲生成和Markdown格式化等功能。

## 功能特性

### 1. 文档内容优化

- 语法纠错和语言优化
- 提高文档清晰度和可读性
- 改善文档结构组织
- 统一术语和格式

### 2. API文档生成

- 从代码自动生成结构化API文档
- 支持多种编程语言
- 包含参数说明、返回值、示例等

### 3. 文档大纲生成

- 根据主题自动生成文档大纲
- 支持多种文档类型
- 提供合理的章节结构建议

### 4. Markdown格式化

- 统一标题层级
- 规范列表格式
- 优化代码块显示
- 改善表格排版

## 前置条件

### 1. 安装Ollama

下载并安装 [Ollama](https://ollama.ai)

### 2. 下载模型

推荐使用对中文支持较好的模型：

```bash
# 下载 Qwen 2.5 7B (推荐)
ollama pull qwen2.5:7b

# 或使用其他模型
ollama pull qwen2:7b
ollama pull llama3.1:8b
```

### 3. 配置环境变量

在 `backend/core/.env` 文件中配置：

```env
# Ollama配置
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=qwen2.5:7b
```

## 快速开始

### 启动服务

1. 确保Ollama正在运行
2. 启动后端服务
3. 启动前端服务

### 访问文档AI助手

- 在系统中导航到文档AI助手页面
- 或直接访问 `/document-ai` 路径

## API接口

### 文档优化

```text
POST /api/v1/document-ai/optimize

Request:
{
  "content": "要优化的文档内容",
  "doc_type": "technical_doc"
}

Response:
{
  "success": true,
  "data": {
    "original": "原始内容",
    "suggested": "优化后内容",
    "changes": [...],
    "reasoning": "修改理由"
  }
}
```

### API文档生成

```text
POST /api/v1/document-ai/generate-api-doc

Request:
{
  "code": "源代码",
  "language": "rust",
  "doc_type": "api_endpoint"
}

Response:
{
  "success": true,
  "data": {
    "title": "API标题",
    "description": "描述",
    "parameters": [...],
    "returns": "返回值说明",
    "examples": [...],
    "notes": [...]
  }
}
```

### 大纲生成

```text
POST /api/v1/document-ai/generate-outline

Request:
{
  "topic": "文档主题",
  "doc_type": "technical_doc"
}

Response:
{
  "success": true,
  "data": ["章节1", "章节2", ...]
}
```

### Markdown格式化

```text
POST /api/v1/document-ai/format-markdown

Request:
{
  "content": "Markdown内容"
}

Response:
{
  "success": true,
  "data": "格式化后的Markdown"
}
```

## 使用场景

### 场景1：编写技术文档

1. 使用"生成大纲"功能创建文档结构
2. 根据大纲编写内容
3. 使用"文档优化"功能改善质量
4. 使用"Markdown格式化"统一格式

### 场景2：生成API文档

1. 复制API代码
2. 选择编程语言和文档类型
3. 生成结构化文档
4. 根据需要进行调整

### 场景3：文档质量提升

1. 粘贴现有文档
2. 选择优化选项
3. 比较修改前后内容
4. 采纳建议进行改进

## 最佳实践

### 1. 文档优化技巧

- 选择正确的文档类型以获得更好的效果
- 分段处理长文档，避免单次提交过长内容
- 结合人工审核，确保技术准确性

### 2. API文档生成技巧

- 提供完整的代码片段，包含注释
- 选择正确的编程语言
- 检查生成的文档，补充遗漏信息

### 3. 大纲生成技巧

- 提供明确的文档主题
- 可以包含特定要求的关键词
- 根据实际项目调整生成的大纲

### 4. Markdown格式化技巧

- 在格式化前先备份原始内容
- 检查格式化后的代码块和表格
- 验证链接和图片引用

## 故障排除

### Ollama连接失败

- 检查Ollama是否正在运行
- 验证 `OLLAMA_URL` 配置
- 检查防火墙设置

### 模型加载失败

- 确认已下载指定模型
- 检查 `OLLAMA_MODEL` 配置
- 尝试使用更小的模型

### 响应超时

- 使用更小的模型
- 减少单次提交的内容长度
- 检查系统资源使用情况

### 生成质量不理想

- 尝试不同的模型
- 提供更详细的提示信息
- 分多次进行优化

## 自定义配置

### 修改系统提示

编辑 `backend/core/src/services/document_ai.rs` 中的提示模板，以适应特定的文档风格要求。

### 添加新的文档类型

在前端组件和后端API中添加新的文档类型选项。

### 自定义模型

可以通过环境变量或API参数指定使用不同的模型：

```env
OLLAMA_MODEL=your-custom-model
```

## 安全建议

1. **数据保护**
   - 本地部署，数据不离开内网
   - 定期备份重要文档
   - 控制访问权限

2. **使用规范**
   - 不要提交包含敏感信息的内容
   - 审查AI生成的内容
   - 保留原始内容备份

3. **资源管理**
   - 监控系统资源使用
   - 设置合理的超时时间
   - 清理临时文件

## 未来规划

- [ ] 支持更多文档格式（Word, PDF等）
- [ ] 文档翻译功能
- [ ] 文档版本对比
- [ ] 批量文档处理
- [ ] 自定义模板支持
- [ ] 文档协作功能

## 技术支持

如遇到问题，请：

1. 查看后端日志
2. 检查Ollama状态
3. 验证配置文件
4. 联系技术团队

---

### 最后更新：2026-05-10
