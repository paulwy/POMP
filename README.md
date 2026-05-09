# 河北三楷深发科技股份有限公司 - 企业信息管理系统 (SKSF-EMS)

基于 Rust + Axum + React 技术栈构建的现代化企业管理系统。

## 技术栈

### 后端
- **语言**: Rust 1.80+ (Edition 2024)
- **Web框架**: Axum 0.8+
- **异步运行时**: Tokio
- **数据库**: PostgreSQL 16
- **缓存**: Redis
- **ORM**: SQLx
- **对象存储**: MinIO
- **消息队列**: RabbitMQ (可选)

### 前端
- **框架**: React 18+
- **构建工具**: Vite
- **UI组件库**: Ant Design
- **状态管理**: Zustand
- **API客户端**: Axios

## 项目结构

```
POMP/
├── backend/
│   └── core/              # 后端主服务
│       ├── src/
│       │   ├── api/      # API 路由和处理程序
│       │   ├── db/       # 数据库实体和访问
│       │   ├── services/ # 业务逻辑层
│       │   ├── middleware/ # 中间件
│       │   └── utils/    # 工具函数
│       └── sqlx/migrations/ # 数据库迁移
├── frontend/             # 前端项目
├── docker/               # Docker 配置
├── docs/                 # 文档
└── README.md
```

## 快速开始

### 1. 启动基础设施

```bash
cd docker
docker-compose up -d
```

这会启动:
- PostgreSQL (端口 5432)
- Redis (端口 6379)
- MinIO (端口 9000/9001)

### 2. 后端开发

```bash
cd backend/core

# 复制环境变量配置
cp .env.example .env  # 如有需要修改配置

# 运行服务
cargo run
```

访问: http://localhost:3000/api/health

### 3. 数据库迁移 (可选)

```bash
# 安装 sqlx-cli (如未安装)
cargo install sqlx-cli

# 运行迁移
cd backend/core
sqlx migrate run
```

## API 文档

- 健康检查: `GET /api/health`
- 登录: `POST /api/v1/auth/login`
- 注册: `POST /api/v1/auth/register`

## 开发规范

### Git 提交信息格式
```
feat: 新增功能
fix: 修复bug
docs: 文档更新
style: 代码格式调整
refactor: 重构
test: 测试相关
chore: 构建/工具相关
```

## 参考项目

- [SKSFEMS](https://github.com/your-org/SKSFEMS)
- [TopEMS](https://github.com/your-org/TopEMS)

## 许可证

MIT License
