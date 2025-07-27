#!/bin/bash

# 设置错误时退出
set -e

echo "🐳 开始构建和运行 Arkema 应用..."

# 检查Docker是否安装
if ! command -v docker &> /dev/null; then
    echo "❌ Docker 未安装，请先安装 Docker"
    exit 1
fi

# 检查docker-compose是否安装
if ! command -v docker-compose &> /dev/null; then
    echo "❌ docker-compose 未安装，请先安装 docker-compose"
    exit 1
fi

# 创建documents目录（如果不存在）
mkdir -p documents

# 构建并启动容器
echo "🔨 构建 Docker 镜像..."
docker-compose build

echo "🚀 启动容器..."
docker-compose up -d

echo "✅ 应用已启动！"
echo "📱 访问地址: http://localhost:3000"
echo ""
echo "📋 常用命令:"
echo "  查看日志: docker-compose logs -f"
echo "  停止服务: docker-compose down"
echo "  重启服务: docker-compose restart"
echo "  查看状态: docker-compose ps" 