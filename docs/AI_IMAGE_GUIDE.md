# AI 文生图功能

## 概述

项目已经集成了完整的文生图（Text-to-Image）功能，支持多种 AI 后端服务，并且有智能的降级机制。

## 支持的后端

1. **Together AI**（推荐）- 使用 FLUX.1-schnell-Free 模型，提供高质量的图片生成
2. **Hugging Face** - 备选后端，使用 Stable Diffusion XL 模型
3. **Placeholder** - 占位图服务，当所有 AI 服务不可用时自动降级使用

## 配置

### 环境变量

在项目根目录的 `.env` 文件中配置以下变量：

```env
# Together AI 配置（推荐）
TOGETHER_API_KEY=your_together_api_key_here
TOGETHER_API_URL=https://api.together.xyz

# Hugging Face 配置（备选）
HUGGINGFACE_API_KEY=your_huggingface_api_key_here
HUGGINGFACE_API_URL=https://api-inference.huggingface.co

# 文生图参数配置
AI_IMAGE_MODEL=black-forest-labs/FLUX.1-schnell-Free
AI_IMAGE_SIZE=1024x1024
AI_IMAGE_QUALITY=standard
```

### 获取 API Key

#### Together AI
1. 访问 https://together.ai
2. 注册账号并登录
3. 前往 API Keys 页面创建新的 API Key
4. 将 API Key 复制到 `.env` 文件中的 `TOGETHER_API_KEY`

#### Hugging Face
1. 访问 https://huggingface.co
2. 注册账号并登录
3. 前往 Settings → Access Tokens 创建新的 token
4. 将 token 复制到 `.env` 文件中的 `HUGGINGFACE_API_KEY`

## 功能特性

### 1. 多后端自动降级
- 优先使用 Together AI
- 如果 Together AI 不可用，自动尝试 Hugging Face
- 如果都不可用，使用 Placeholder 生成彩色占位图

### 2. 可配置的参数
- **Prompt**: 图片描述（必填）
- **Width**: 图片宽度（默认 1024）
- **Height**: 图片高度（默认 1024）
- **Num Images**: 生成图片数量（默认 1）
- **Style**: 图片风格（可选）

### 3. 前端集成
- **文档 AI 助手** - 独立的文生图界面
- **内容管理** - 在新建/编辑文章时可直接生成封面图片

## API 接口

### 生成图片
```http
POST /api/v1/ai/generate-image
Content-Type: application/json

{
  "prompt": "一只可爱的猫咪坐在窗台上",
  "width": 1024,
  "height": 1024,
  "num_images": 2,
  "style": "artistic"
}
```

响应：
```json
{
  "success": true,
  "data": {
    "images": [
      "https://example.com/image1.jpg",
      "https://example.com/image2.jpg"
    ],
    "backend": "TogetherAI",
    "prompt": "一只可爱的猫咪坐在窗台上"
  }
}
```

### 获取 AI 服务状态
```http
GET /api/v1/ai/status
```

响应：
```json
{
  "success": true,
  "data": {
    "together_ai": true,
    "huggingface": false,
    "available_backends": ["TogetherAI", "Placeholder"]
  }
}
```

## 前端使用

### 1. 文档 AI 助手
访问文档 AI 助手页面，点击"文生图"标签页即可使用。

### 2. 内容管理
在新建或编辑文章时，点击"AI 生成封面图片"按钮，即可在对话框中生成并选择封面图片。

### 3. 自定义组件
```tsx
import { aiService } from '@/services/ai';

// 生成图片
const response = await aiService.generateImage({
  prompt: '描述您想要的图片',
  width: 1024,
  height: 1024,
  num_images: 1,
});

// 获取服务状态
const status = await aiService.getStatus();
```

## 项目结构

### 后端
```
backend/core/src/
├── services/
│   ├── mod.rs
│   └── image_generator.rs  # 文生图核心服务
├── api/
│   ├── handlers/
│   │   ├── mod.rs
│   │   └── ai.rs           # AI API 处理程序
│   └── mod.rs
├── config.rs               # 配置更新
├── state.rs                # 状态管理更新
└── main.rs                 # 路由注册
```

### 前端
```
frontend/src/
├── services/
│   └── ai.ts               # AI API 客户端
├── components/
│   └── DocumentAiAssistant.tsx  # 更新了文生图功能
└── pages/
    └── ContentManagement.tsx    # 集成了文生图到内容管理
```

## 注意事项

1. **API Key 安全** - 不要将包含真实 API Key 的 `.env` 文件提交到版本控制系统
2. **免费额度** - Together AI 和 Hugging Face 都提供免费额度，请注意使用量
3. **图片大小** - 更大的图片会消耗更多的 API 额度和时间
4. **降级机制** - 即使没有配置 API Key，系统也能正常工作（使用 Placeholder）

## 快速开始

1. 复制 `.env.example` 为 `.env`
2. 获取 Together AI API Key 并填入
3. 重启后端服务
4. 打开前端应用，访问文档 AI 助手或内容管理页面即可使用文生图功能
