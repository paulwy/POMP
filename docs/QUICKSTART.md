# SKSFEMS 快速启动指南

## 🚀 一键启动

### 前置要求

- Docker 20.10+
- Docker Compose 2.0+

### 国内用户（推荐）

```bash
# 1. 复制配置文件
cp .env.example .env

# 2. 使用阿里云镜像源启动
make start-cn

# 3. 访问应用
# 前端: http://localhost:3000
# 后端: http://localhost:8000
```

### 其他方式

```bash
# 交互式选择镜像源
make start

# 或者仅启动基础服务（数据库+缓存），然后本地开发
make start-basic
```

## 📋 常用命令

| 命令 | 说明 |
|------|------|
| `make start` | 启动所有服务（交互式选择镜像源） |
| `make start-cn` | 使用阿里云镜像源启动 |
| `make start-basic` | 仅启动基础服务（数据库+缓存） |
| `make stop` | 停止所有服务 |
| `make status` | 查看服务状态 |
| `make logs` | 查看服务日志 |
| `make build` | 重新构建服务 |
| `make clean` | 停止并清理所有数据 |

## 🌐 国内网络问题

遇到 Docker 镜像拉取失败？查看：

- [Docker 镜像源配置指南](docs/DOCKER_MIRROR.md)
- 或直接使用 `make start-cn`

## 🏗️ 项目结构

```text
POMP/
├── backend/core/      # Rust 后端
├── frontend/         # React 前端
├── docker/         # Docker 配置
├── scripts/        # 管理脚本
├── docs/          # 文档
├── Makefile       # 快捷命令
└── .env.example   # 配置示例
```

## 🔗 访问地址

| 服务 | 地址 |
|------|------|
| 前端应用 | <http://localhost:3000> |
| 后端 API | <http://localhost:8000> |
| MinIO 控制台 | <http://localhost:9001> |

## 🔐 默认账号

- 系统管理员: `admin` / `admin123`

## 📚 更多文档

- [Docker 镜像源配置](docs/DOCKER_MIRROR.md)
- [完整部署文档](docs/DEPLOYMENT.md)
- [项目主文档](docs/主线工作.md)

---

**需要帮助？** 查看 [故障排查](docs/DEPLOYMENT.md#故障排查)
