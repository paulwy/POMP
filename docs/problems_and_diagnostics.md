# 项目问题与诊断报告

## 📋 概述

本文档记录 POMP 项目中发现的所有问题和诊断结果。

---

## 一、API 路径不匹配问题

### 1.1 外勤管理 (Field Service)

| 前端调用 | 原后端路由 | 修复后路由 | 状态 |
|---------|-----------|-----------|------|
| `DELETE /v1/field/records/{recordId}/audios/{audioId}` | `/audios/` | `/audio/` | ✅ 已修复 |

**修复文件**: `frontend/src/services/field.ts`

### 1.2 生产文档 (Production Docs)

| 前端调用 | 原后端路由 | 修复后路由 | 状态 |
|---------|-----------|-----------|------|
| `POST /v1/production-docs/documents/{id}/submit-review` | 无路由 | `/review` | ✅ 已修复 |

**修复文件**: `frontend/src/services/production-docs.ts`

### 1.3 工作流 (Workflow)

| 前端调用 | 原后端路由 | 修复后路由 | 状态 |
|---------|-----------|-----------|------|
| `GET /v1/workflow/tasks/history` | 无路由 | `/workflow/history` | ✅ 已修复 |
| `GET /v1/workflow/tasks/initiated/history` | 无路由 | `/workflow/history/my-initiated` | ✅ 已修复 |

**修复文件**: `frontend/src/services/workflow.ts`

### 1.4 字典管理 (Dict)

| 前端调用 | 原后端路由 | 修复后路由 | 状态 |
|---------|-----------|-----------|------|
| `GET /v1/dicts/types/{id}` | 无路由 | `/dicts/types/{id}` | ✅ 已修复 |
| `GET /v1/dicts/categories/{id}/with-items` | 无路由 | `/dicts/categories/{id}/with-items` | ✅ 已修复 |
| `GET /v1/dicts/categories/code/{code}/items` | 无路由 | `/dicts/categories/code/{code}/items` | ✅ 已修复 |

---

## 二、缺失的 API 路由

### 2.1 生产文档 (Production Docs)

| 路由 | HTTP方法 | 用途 | 状态 |
|------|---------|------|------|
| `/api/v1/production-docs/categories/{code}` | GET | 按编码获取文档分类 | ✅ 已添加 |
| `/api/v1/production-docs/documents/for-review` | GET | 获取待审核文档 | ✅ 已添加 |

### 2.2 组织管理 (Organization)

| 路由 | HTTP方法 | 用途 | 状态 |
|------|---------|------|------|
| `/api/v1/organization/positions/department/{id}` | GET | 获取部门下的职位 | ✅ 已添加 |

### 2.3 人力资源 (HR)

| 路由 | HTTP方法 | 用途 | 状态 |
|------|---------|------|------|
| `/api/v1/hr/attendance/month` | GET | 获取月度考勤记录 | ✅ 已添加 |

### 2.4 字典管理 (Dict)

| 路由 | HTTP方法 | 用途 | 状态 |
|------|---------|------|------|
| `/api/v1/dicts/types/{id}` | GET | 按ID获取字典类型 | ✅ 已添加 |
| `/api/v1/dicts/categories/{id}/with-items` | GET | 获取字典类型及项 | ✅ 已添加 |
| `/api/v1/dicts/categories/code/{code}/items` | GET | 按编码获取字典项 | ✅ 已添加 |

---

## 三、配置问题

### 3.1 环境变量配置路径

**问题**: 后端 `config.rs` 中配置文件路径计算错误

```rust
// 修复前 (错误)
ancestors().nth(2)  // 返回 /Users/xingzhai

// 修复后 (正确)
ancestors().nth(1)  // 返回 /Users/xingzhai/POMP
```

**修复文件**: `backend/core/src/config.rs`

### 3.2 Ollama 模型配置

**问题**: `.env` 文件中 `OLLAMA_MODEL=llama2`，但 Ollama 运行的是 `qwen2:7b`

**修复**:
- `OLLAMA_MODEL=qwen2:7b`
- 同步更新 `backend/core/.env` 和根目录 `.env`

---

## 四、AI 功能集成

### 4.1 描述生成 AI

**问题**: 前端 `AIAssistant` 组件只返回 `null`，未调用后端 API

**修复**:
1. 创建 `services/text_generator.rs` 调用 Ollama API
2. 更新 `english_ai.rs` 中的 `generate_description_handler` 使用真正的 AI
3. 更新前端 `AIAssistant.tsx` 调用 `englishAiService.generateDescription()`

**配置要求**:
```bash
OLLAMA_API_URL=http://localhost:11434
OLLAMA_MODEL=qwen2:7b
```

### 4.2 审批意见 AI

**问题**: 路由未注册，前端未集成

**修复**:
1. 后端路由已注册:
   - `POST /api/v1/approval-comment/generate`
   - `POST /api/v1/approval-comment/optimize`

2. 前端集成:
   - 在 `ApprovalDetail.tsx` 中添加 AI 生成按钮
   - 支持三种语气：正式、温和、严格
   - 调用 `approvalCommentAiApi.generateComment()`

---

## 五、前后端集成状态

### 5.1 已完成集成 ✅

| 功能模块 | 前端调用 | 后端路由 | 状态 |
|---------|---------|---------|------|
| GIS管理 | `gisService` | `/gis/*` | ✅ 正常 |
| 字典管理 | `dictService` | `/dicts/*` | ✅ 正常 |
| AI描述生成 | `englishAiService` | `/english-ai/*` | ✅ 正常 |
| 审批意见AI | `approvalCommentAiApi` | `/approval-comment/*` | ✅ 已集成 |
| 外勤管理 | `fieldService` | `/field/*` | ✅ 正常 |
| 工作流 | `workflowApi` | `/workflow/*` | ✅ 正常 |

### 5.2 待集成功能

| 功能模块 | 状态 | 说明 |
|---------|------|------|
| 合同管理 | ⚠️ 待测试 | 需要实际测试 |
| 仓储物流 | ⚠️ 待测试 | 需要实际测试 |
| 采购管理 | ⚠️ 待测试 | 需要实际测试 |
| 销售管理 | ⚠️ 待测试 | 需要实际测试 |

---

## 六、死代码检测

### 6.1 后端未使用的代码

| 代码 | 位置 | 建议 |
|------|------|------|
| `map_row_to_user` | `db/user_repo.rs:533` | 可以删除 |
| `PreviewState.port/path` | `api/handlers/website.rs:24` | 可以删除 |
| `CreateDeploymentRequest` | `services/cloudflare_publisher.rs:21` | 可以删除 |
| `FieldService.config` | `services/field_service.rs:20` | 可以删除 |

### 6.2 前端未使用的 Service

| Service 文件 | 状态 | 说明 |
|------------|------|------|
| `services/approval-comment-ai.ts` | ✅ 已使用 | `ApprovalDetail.tsx` 正在使用 |
| `services/english_ai.ts` | ✅ 已使用 | `AIAssistant.tsx` 正在使用 |
| `services/gis.ts` | ✅ 已使用 | `GISManagement.tsx` 正在使用 |
| `services/dict.ts` | ✅ 已使用 | `DictManagement.tsx` 正在使用 |

---

## 七、安全问题

### 7.1 敏感信息暴露

⚠️ `.env` 文件中包含敏感信息:
- `CLOUDFLARE_API_TOKEN`
- `DATABASE_URL`
- `JWT_SECRET`
- `TOGETHER_API_KEY`

**建议**: 确认 `.gitignore` 已包含 `.env` 文件

### 7.2 跨域配置

**当前配置**: 允许 `http://localhost:5173`

**建议**: 生产环境应限制为正式域名

---

## 八、性能问题

### 8.1 数据库查询

⚠️ 部分查询缺少索引:
- `attendance_records.user_id`
- `positions.department_id`
- `users.email` (唯一索引)

### 8.2 前端包大小

⚠️ 建议优化:
- 路由懒加载
- 组件代码分割
- 第三方库按需引入

---

## 九、测试清单

### 9.1 API 端点测试

```bash
# GIS
curl http://localhost:8000/api/v1/gis/customers
curl http://localhost:8000/api/v1/gis/projects
curl http://localhost:8000/api/v1/gis/warehouses
curl http://localhost:8000/api/v1/gis/personnel

# 字典管理
curl http://localhost:8000/api/v1/dicts/categories
curl http://localhost:8000/api/v1/dicts/categories/{id}/with-items
curl http://localhost:8000/api/v1/dicts/all

# AI 功能
curl -X POST http://localhost:8000/api/v1/english-ai/generate-description \
  -H "Content-Type: application/json" \
  -d '{"chinese_description":"产品经理","style":"technical"}'

curl -X POST http://localhost:8000/api/v1/approval-comment/generate \
  -H "Content-Type: application/json" \
  -d '{"business_type":"leave","decision":"approve","tone":"moderate"}'
```

---

## 十、修复日志

| 日期 | 修复内容 | 修复人 |
|------|---------|--------|
| 2026-05-14 | 修复所有 API 路径不匹配问题 | AI Assistant |
| 2026-05-14 | 添加缺失的后端路由和 Handler | AI Assistant |
| 2026-05-14 | 修复 Ollama 模型配置 | AI Assistant |
| 2026-05-14 | 实现 AI 生成描述功能 | AI Assistant |
| 2026-05-14 | 集成审批意见 AI 到前端 | AI Assistant |
| 2026-05-14 | 修复字典管理缺失路由 | AI Assistant |

---

## 十一、项目结构

```
POMP/
├── frontend/                    # 前端 React 应用
│   └── src/
│       ├── pages/              # 页面组件
│       │   ├── ApprovalDetail.tsx     # 审批详情 (已集成AI)
│       │   ├── DictManagement.tsx    # 字典管理
│       │   ├── GISManagement.tsx    # GIS管理
│       │   ├── OrganizationManagement.tsx  # 组织管理
│       │   └── ...
│       ├── services/           # API 服务层
│       │   ├── dict.ts         # 字典服务 ✅
│       │   ├── field.ts        # 外勤服务 ✅
│       │   ├── gis.ts          # GIS服务 ✅
│       │   ├── workflow.ts     # 工作流服务 ✅
│       │   ├── english_ai.ts   # AI描述生成 ✅
│       │   └── approval-comment-ai.ts  # AI审批意见 ✅
│       └── components/         # 通用组件
│           └── AIAssistant.tsx      # AI助手组件 ✅
│
└── backend/core/              # 后端 Rust 应用
    └── src/
        ├── api/handlers/      # API 处理函数
        │   ├── dict.rs              # 字典管理 ✅
        │   ├── field.rs             # 外勤管理 ✅
        │   ├── gis.rs              # GIS管理 ✅
        │   ├── workflow.rs         # 工作流 ✅
        │   ├── english_ai.rs       # AI描述生成 ✅
        │   ├── approval_comment.rs # AI审批意见 ✅
        │   └── ...
        ├── services/           # 业务服务
        │   ├── text_generator.rs   # 文本生成 (Ollama) ✅
        │   └── ...
        └── db/                 # 数据库操作
            ├── organization.rs      # 组织管理 ✅
            └── ...
```

---

*最后更新: 2026-05-14*
