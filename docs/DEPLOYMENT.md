# SKSFEMS 企业信息管理系统 - 部署文档

## 目录

- [快速开始](#快速开始)
- [环境要求](#环境要求)
- [部署方式](#部署方式)
  - [Docker 部署（推荐）](#docker-部署推荐)
  - [本地开发模式](#本地开发模式)
- [配置说明](#配置说明)
- [服务访问](#服务访问)
- [故障排查](#故障排查)
- [生产环境部署建议](#生产环境部署建议)

---

## 快速开始

### Docker 一键部署（最简单）

```bash
# 1. 克隆项目
git clone <repository-url>
cd POMP

# 2. 一键启动所有服务
make start
# 或者使用脚本
./scripts/start.sh
```

就是这么简单！所有服务都会自动启动。

---

## 环境要求

### Docker 部署环境

- **操作系统**: Linux / macOS / Windows (WSL2)
- **Docker**: 20.10+
- **Docker Compose**: 2.0+
- **内存**: 建议 4GB+
- **磁盘空间**: 建议 20GB+

### 本地开发环境

除了 Docker 环境外，还需要：

- **Rust**: 1.75+
- **Node.js**: 18+
- **PostgreSQL**: 14+
- **Redis**: 7+

---

## 部署方式

### Docker 部署（推荐）

#### 1. 准备环境

确保已安装 Docker 和 Docker Compose：

```bash
docker --version
docker compose version
```

#### 2. 配置环境变量

```bash
# 复制示例配置文件
cp .env.example .env

# 根据需要修改配置
nano .env
```

主要配置项：

- `DATABASE_URL`: 数据库连接字符串
- `REDIS_URL`: Redis 连接字符串
- `JWT_SECRET`: JWT 密钥（生产环境必须修改）
- `MINIO_*`: 对象存储配置
- `OLLAMA_*`: AI 模型配置（可选）

#### 3. 启动服务

```bash
# 使用 Makefile（推荐）
make start

# 或使用脚本
./scripts/start.sh
```

#### 4. 查看状态

```bash
make status
# 或
./scripts/status.sh
```

#### 5. 查看日志

```bash
# 查看所有服务日志
make logs

# 实时跟踪日志
make logs-follow

# 查看特定服务日志
make logs-backend
make logs-frontend
```

#### 6. 停止服务

```bash
make stop

# 停止并删除数据（谨慎使用）
make clean
```

---

### 本地开发模式

如果你想在本地开发而不是使用 Docker：

#### 1. 启动基础服务（使用 Docker）

```bash
cd docker
docker compose up -d postgres redis minio
```

#### 2. 配置环境变量——本地开发

```bash
cp .env.example .env
# 修改 .env 文件中的连接地址为 localhost
```

#### 3. 启动后端

```bash
cd backend/core
cargo run
```

#### 4. 启动前端

```bash
cd frontend
npm install
npm run dev
```

---

## 配置说明

### 环境变量 (.env)

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `POSTGRES_HOST` | PostgreSQL 主机 | localhost |
| `POSTGRES_PORT` | PostgreSQL 端口 | 5432 |
| `POSTGRES_USER` | PostgreSQL 用户名 | sksfems |
| `POSTGRES_PASSWORD` | PostgreSQL 密码 | sksfems |
| `POSTGRES_DB` | PostgreSQL 数据库名 | sksfems |
| `DATABASE_URL` | 完整数据库连接字符串 | - |
| `REDIS_HOST` | Redis 主机 | localhost |
| `REDIS_PORT` | Redis 端口 | 6379 |
| `REDIS_URL` | 完整 Redis 连接字符串 | - |
| `MINIO_ENDPOINT` | MinIO 地址 | localhost |
| `MINIO_PORT` | MinIO 端口 | 9000 |
| `MINIO_ACCESS_KEY` | MinIO 访问密钥 | minioadmin |
| `MINIO_SECRET_KEY` | MinIO 密钥 | minioadmin |
| `BACKEND_PORT` | 后端服务端口 | 8000 |
| `FRONTEND_PORT` | 前端服务端口 | 3000 |
| `JWT_SECRET` | JWT 签名密钥 | - |
| `API_BASE_URL` | API 基础地址 | <http://localhost:8000> |
| `OLLAMA_BASE_URL` | Ollama 地址 | <http://localhost:11434> |
| `OLLAMA_DEFAULT_MODEL` | 默认 AI 模型 | llama3.1 |

---

## 服务访问

启动成功后，可以通过以下地址访问服务：

| 服务 | 地址 | 说明 |
|------|------|------|
| **前端应用** | <http://localhost:3000> | 主应用界面 |
| **后端 API** | <http://localhost:8000> | API 服务 |
| **API 文档** | <http://localhost:8000/docs> | 自动生成的 API 文档 |
| **MinIO 控制台** | <http://localhost:9001> | 对象存储管理 |
| **数据库** | localhost:5432 | PostgreSQL (需客户端) |
| **Redis** | localhost:6379 | Redis (需客户端) |

### 默认账号

| 服务 | 用户名 | 密码 |
|------|--------|------|
| **系统管理员** | admin | admin123 |
| **MinIO** | minioadmin | minioadmin |
| **PostgreSQL** | sksfems | sksfems |

⚠️ **重要**: 生产环境请务必修改所有默认密码！

---

## 故障排查

### 服务无法启动

```bash
# 查看详细日志
make logs

# 检查特定服务
make logs-backend
```

### 端口被占用

修改 `.env` 文件中的端口配置，或停止占用端口的服务。

### 数据库连接失败

```bash
# 检查数据库容器状态
docker ps | grep postgres

# 查看数据库日志
docker logs sksfems-postgres
```

### 前端无法访问后端

检查 `API_BASE_URL` 配置是否正确，确保后端服务已启动。

---

## 生产环境部署建议

### 1. 安全配置

- 修改所有默认密码
- 使用强密码生成 `JWT_SECRET`
- 配置 HTTPS
- 限制数据库访问 IP
- 定期备份数据

### 2. 性能优化

- 使用高性能服务器
- 配置数据库连接池
- 启用 Redis 缓存
- 配置 CDN 加速静态资源

### 3. 监控和日志

- 配置日志收集（ELK / Loki）
- 设置监控告警（Prometheus + Grafana）
- 定期检查资源使用情况

### 4. 数据备份

```bash
# 备份数据库
docker exec sksfems-postgres pg_dump -U sksfems sksfems > backup.sql

# 备份 MinIO 数据
docker run --rm -v sksfems-minio_data:/data \
  -v $(pwd):/backup alpine tar czf /backup/minio-backup.tar.gz /data
```

---

## 高级用法

### 仅启动基础服务

```bash
cd docker
docker compose up -d postgres redis minio
```

### 重新构建服务

```bash
make build
```

### 进入容器

```bash
# 后端
docker exec -it sksfems-backend sh

# 数据库
docker exec -it sksfems-postgres psql -U sksfems -d sksfems
```

### 运行数据库迁移

```bash
cd backend/core
cargo run --bin migrate
```

---

## 常见问题

### Q: 构建后端很慢怎么办？

A: Rust 首次构建确实需要较长时间，后续构建会利用缓存加速。可以考虑使用本地开发模式。

### Q: 如何更新服务？

A:

```bash
git pull
make stop
make build
make start
```

### Q: 数据持久化如何保证？

A: Docker Compose 已配置数据卷，数据会自动持久化。建议定期备份。

---

## 技术支持

如有问题，请查看项目文档或提交 Issue。
