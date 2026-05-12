# Docker 镜像源配置指南

国内网络环境下，Docker Hub 连接可能不稳定。本指南提供多种解决方案。

## 🚀 推荐解决方案

### 方案 1: 配置 Docker 镜像加速器（最推荐）

这是最稳定可靠的方案。配置一次，永久生效。

```bash
# 创建配置目录
sudo mkdir -p /etc/docker

# 创建配置文件
sudo tee /etc/docker/daemon.json <<-'EOF'
{
  "registry-mirrors": [
    "https://docker.mirrors.aliyuncs.com",
    "https://docker.nju.edu.cn",
    "https://docker.mirrors.ustc.edu.cn"
  ]
}
EOF

# 重启 Docker（Linux）
sudo systemctl daemon-reload
sudo systemctl restart docker

# macOS 用户：在 Docker Desktop 中配置后重启
```

配置完成后，正常启动项目即可：
```bash
make start
```

### 方案 2: 使用开发模式（如果 Docker 依然有问题）

```bash
# 仅启动基础服务
make start-basic

# 然后本地运行代码
cd backend/core && cargo run  # 后端
cd frontend && npm run dev    # 前端
```

---

## 📋 macOS 配置步骤（详细）

### macOS / Linux

编辑或创建 Docker 配置文件：

```bash
# 创建配置目录
sudo mkdir -p /etc/docker

# 编辑配置文件
sudo nano /etc/docker/daemon.json
```

添加以下内容：

```json
{
  "registry-mirrors": [
    "https://docker.mirrors.aliyuncs.com",
    "https://docker.nju.edu.cn",
    "https://docker.mirrors.ustc.edu.cn",
    "https://mirror.ccs.tencentyun.com"
  ]
}
```

重启 Docker 服务：

```bash
# Linux (systemd)
sudo systemctl daemon-reload
sudo systemctl restart docker

# macOS
# 通过 Docker Desktop 重启
```

### Windows (WSL2)

在 Docker Desktop 设置中：

1. 打开 Docker Desktop
2. Settings -> Docker Engine
3. 添加配置：

```json
{
  "registry-mirrors": [
    "https://docker.mirrors.aliyuncs.com",
    "https://docker.nju.edu.cn"
  ]
}
```

4. 点击 "Apply & Restart"

---

## 📋 可用的镜像源

| 镜像源 | 地址 | 说明 |
|--------|------|------|
| 阿里云 | `docker.mirrors.aliyuncs.com` | 推荐 |
| 南京大学 | `docker.nju.edu.cn` | 教育网 |
| 中科大 | `docker.mirrors.ustc.edu.cn` | 教育网 |
| 腾讯云 | `mirror.ccs.tencentyun.com` | 腾讯云内网 |

---

## 💡 开发模式（推荐）

如果 Docker 镜像依然无法拉取，可以使用本地开发模式：

```bash
# 1. 仅启动基础服务（数据库、缓存）
make start-basic

# 2. 在本地启动后端
cd backend/core
cargo run

# 3. 在本地启动前端
cd frontend
npm install
npm run dev
```

---

## 🔍 验证配置

```bash
# 检查 Docker 信息
docker info

# 查看镜像加速器
docker info | grep -A 10 "Registry Mirrors"

# 测试拉取镜像
docker pull hello-world
```

---

## ❓ 常见问题

### Q: 依然无法拉取镜像？

A: 尝试以下方法：
1. 检查网络连接
2. 切换不同的镜像源
3. 使用代理
4. 使用开发模式（仅 Docker 运行数据库，代码本地运行）

### Q: 如何恢复使用官方源？

A: 删除或注释掉 `daemon.json` 中的配置，重启 Docker。

---

## 📚 相关文档

- [完整部署文档](DEPLOYMENT.md)
- [快速开始指南](../QUICKSTART.md)
