# Docker 部署指南

## 📋 概述

本项目使用 Docker 进行容器化部署，包含前端 React 应用和可选的 PostgreSQL 数据库。

## 🚀 快速开始

### 方法一：使用脚本（推荐）

```bash
# 给脚本执行权限
chmod +x build-and-run.sh

# 运行脚本
./build-and-run.sh
```

### 方法二：手动执行

```bash
# 1. 构建镜像
docker-compose build

# 2. 启动服务
docker-compose up -d

# 3. 查看状态
docker-compose ps
```

## 🌐 访问应用

- **前端应用**: http://localhost:3000
- **文件存储**: http://localhost:3000/documents/

## 📁 目录结构

```
arkema-app/
├── Dockerfile              # Docker 构建文件
├── docker-compose.yml      # Docker Compose 配置
├── nginx.conf             # Nginx 配置文件
├── .dockerignore          # Docker 忽略文件
├── build-and-run.sh       # 构建运行脚本
├── documents/             # 文件存储目录（挂载到容器）
└── src/                   # 源代码
```

## 🔧 配置说明

### 环境变量

可以通过环境变量配置应用：

```bash
# 在 docker-compose.yml 中设置
environment:
  - NODE_ENV=production
  - VITE_API_BASE_URL=https://your-api.com
  - VITE_AUTH_TOKEN=your-token
```

### 端口配置

默认端口映射：
- 容器内: 80
- 主机: 3000

修改端口映射：
```yaml
ports:
  - "8080:80"  # 改为 8080 端口
```

### 文件持久化

`documents` 目录会自动挂载到容器中，确保上传的文件持久化存储：

```yaml
volumes:
  - ./documents:/usr/share/nginx/html/documents
```

## 🛠️ 常用命令

```bash
# 查看运行状态
docker-compose ps

# 查看日志
docker-compose logs -f arkema-app

# 停止服务
docker-compose down

# 重启服务
docker-compose restart

# 重新构建并启动
docker-compose up --build -d

# 进入容器
docker-compose exec arkema-app sh

# 清理镜像
docker-compose down --rmi all
```

## 🔍 故障排除

### 1. 端口被占用

```bash
# 查看端口占用
netstat -tulpn | grep :3000

# 修改端口映射
# 编辑 docker-compose.yml 中的 ports 配置
```

### 2. 权限问题

```bash
# 确保 documents 目录有正确权限
chmod 755 documents
```

### 3. 构建失败

```bash
# 清理缓存重新构建
docker-compose build --no-cache
```

### 4. 查看详细日志

```bash
# 查看构建日志
docker-compose build --progress=plain

# 查看运行日志
docker-compose logs -f --tail=100
```

## 🔐 安全配置

### 生产环境建议

1. **修改默认端口**
2. **配置 HTTPS**
3. **设置防火墙规则**
4. **使用环境变量管理敏感信息**

### 示例生产配置

```yaml
version: '3.8'
services:
  arkema-app:
    build: .
    ports:
      - "443:80"  # 使用 HTTPS 端口
    environment:
      - NODE_ENV=production
    volumes:
      - ./documents:/usr/share/nginx/html/documents
      - ./ssl:/etc/nginx/ssl  # SSL 证书
    restart: unless-stopped
```

## 📦 镜像优化

### 多阶段构建

Dockerfile 使用多阶段构建：
1. **构建阶段**: 使用 Node.js 构建应用
2. **生产阶段**: 使用 Nginx 提供静态文件服务

### 优化建议

1. **使用 .dockerignore** 排除不必要文件
2. **使用 Alpine 基础镜像** 减少体积
3. **启用 Gzip 压缩** 提升性能
4. **配置缓存策略** 优化加载速度

## 🔄 更新部署

```bash
# 1. 拉取最新代码
git pull

# 2. 重新构建
docker-compose build --no-cache

# 3. 重启服务
docker-compose up -d

# 4. 验证更新
curl http://localhost:3000
```

## 📞 支持

如果遇到问题，请检查：
1. Docker 和 docker-compose 是否正确安装
2. 端口 3000 是否被占用
3. 查看容器日志获取详细错误信息 