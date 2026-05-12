# 问题解决指南

## 当前问题：Docker 镜像无法拉取

### 最快速的解决方案（推荐）

由于 Docker Hub 在国内访问不稳定，我们先启动基础服务，然后在本地运行代码：

```bash
# 步骤 1: 尝试先拉取一个小镜像测试
docker pull hello-world

# 如果上面失败，直接跳到步骤 2

# 步骤 2: 使用本地开发模式（推荐）
# 你已经有 Rust 和 Node 环境了，我们直接本地运行！

# 首先，确认你有 PostgreSQL 和 Redis
# 如果没有，可以用 Homebrew 安装：
brew install postgresql@14
brew install redis

# 或者，如果你有 Docker，尝试这个简单方案：
docker run -d --name sksfems-postgres -e POSTGRES_USER=sksfems -e POSTGRES_PASSWORD=sksfems -e POSTGRES_DB=sksfems -p 5432:5432 postgres:16-alpine
docker run -d --name sksfems-redis -p 6379:6379 redis:7-alpine
docker run -d --name sksfems-minio -p 9000:9000 -p 9001:9001 -e MINIO_ROOT_USER=minioadmin -e MINIO_ROOT_PASSWORD=minioadmin minio/minio server /data --console-address ":9001"

# 步骤 3: 启动后端
cd /Users/xingzhai/POMP/backend/core
cargo run

# 步骤 4: 启动前端（另一个终端窗口）
cd /Users/xingzhai/POMP/frontend
npm install
npm run dev
```

### 如果上面的 Docker 命令也无法拉取镜像

完全本地安装依赖：

```bash
# PostgreSQL
brew install postgresql@14
brew services start postgresql@14

# 创建数据库
createdb sksfems

# Redis
brew install redis
brew services start redis

# 然后运行代码（如上步骤 3 和 4）
```

### 验证服务是否正常

```bash
# 测试数据库
psql -h localhost -U sksfems -d sksfems

# 测试 Redis
redis-cli ping

# 应该返回 PONG
```

---

## 或者：配置 Docker 镜像加速器

如果你想继续使用 Docker，配置镜像加速器：

```bash
# macOS 用户：
# 1. 打开 Docker Desktop
# 2. 点击右上角设置图标 (齿轮)
# 3. 选择 "Docker Engine"
# 4. 在 JSON 配置中添加：
#    "registry-mirrors": [
#      "https://docker.mirrors.aliyuncs.com",
#      "https://docker.nju.edu.cn"
#    ]
# 5. 点击 "Apply & Restart"

# 配置完成后再运行：
make start
```

---

## 现在你可以选择

1. **本地开发模式**（推荐，最快）- 直接本地运行代码
2. **配置 Docker 加速器** - 配置后使用完整 Docker 方案
3. **仅使用 Docker 跑数据库** - 折中方案

---

需要帮助？告诉我你想选择哪个方案，我继续协助！
