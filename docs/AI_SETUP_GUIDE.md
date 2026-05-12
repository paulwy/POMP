# AI助手集成指南

本指南介绍如何设置和使用企业管理系统的AI助手功能。

## 功能概述

系统集成了基于Ollama的本地AI助手，提供以下功能：

- 智能问答 - 回答系统使用相关问题
- 文档推荐 - 推荐相关的帮助文档
- 操作指导 - 提供具体的操作步骤

## 前置要求

### 1. 安装Ollama

访问 [Ollama官网](https://ollama.ai) 下载并安装适合您操作系统的版本。

### 2. 下载模型

推荐使用Qwen系列模型，它对中文支持优秀：

```bash
# 下载Qwen 2.5 7B模型（推荐）
ollama pull qwen2.5:7b

# 或下载其他模型
ollama pull qwen2:7b
ollama pull llama3.1:8b
```

## 配置步骤

### 1. 环境变量配置

在 `backend/core/.env` 文件中配置以下参数：

```env
# Ollama配置
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=qwen2.5:7b
```

### 2. 启动Ollama服务

确保Ollama服务正在运行：

```bash
# 检查Ollama状态
ollama serve

# 或启动Ollama应用
```

### 3. 测试连接

启动后端服务后，可以通过以下API测试AI功能：

```bash
# 健康检查
curl http://localhost:3000/api/v1/ai/health

# 获取模型列表
curl http://localhost:3000/api/v1/ai/models

# 发送聊天请求
curl -X POST http://localhost:3000/api/v1/ai/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"如何创建职位？"}]}'
```

## 使用方法

### 1. 前端使用

1. 登录系统
2. 点击侧边栏的"帮助中心"
3. 切换到"AI助手"标签页
4. 输入您的问题，AI会为您提供帮助

### 2. 问题示例

您可以问以下类型的问题：

- 职位管理相关：
  - "如何创建董事长职位？"
  - "职位级别有哪些？"
  
- 组织架构相关：
  - "如何添加部门？"
  - "怎么查看组织架构图？"

- 审批流程相关：
  - "怎么发起请假审批？"
  - "审批流程卡住了怎么办？"

- 考勤管理相关：
  - "怎么打卡？"
  - "忘记打卡能补卡吗？"

## 故障排除

### Ollama连接失败

如果看到"Ollama未连接"错误：

1. 确认Ollama服务正在运行
2. 检查 `OLLAMA_URL` 配置是否正确
3. 检查防火墙设置

### 模型加载失败

1. 确认已下载指定的模型
2. 尝试使用更小的模型（如 qwen2.5:3b）
3. 检查磁盘空间是否足够

### 响应超时

1. 增加超时时间（如需要）
2. 使用更小的模型
3. 检查系统资源（CPU/内存）

## 自定义系统提示

AI服务使用预定义的系统提示来引导回答。如需修改，可以编辑 `backend/core/src/services/ai.rs` 中的 `default_system_prompt()` 函数。

## 安全建议

1. 在生产环境中修改默认的JWT密钥
2. 配置适当的CORS限制
3. 监控AI服务的使用情况
4. 定期更新Ollama和模型版本

## 高级配置

### 使用多个模型

系统支持动态切换模型，前端可以通过API指定使用的模型：

```json
{
  "messages": [...],
  "model": "llama3.1:8b"
}
```

### 部署优化

对于生产环境部署：

1. 使用GPU加速（如果可用）
2. 配置模型缓存
3. 设置负载均衡
4. 启用请求日志
