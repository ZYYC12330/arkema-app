@echo off
setlocal enabledelayedexpansion

echo 🐳 开始构建和运行 Arkema 应用...

REM 检查Docker是否安装
docker --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker 未安装，请先安装 Docker Desktop
    pause
    exit /b 1
)

REM 检查docker-compose是否安装
docker-compose --version >nul 2>&1
if errorlevel 1 (
    echo ❌ docker-compose 未安装，请先安装 docker-compose
    pause
    exit /b 1
)

REM 创建documents目录（如果不存在）
if not exist "documents" mkdir documents

echo 🔨 构建 Docker 镜像...
docker-compose build
if errorlevel 1 (
    echo ❌ 构建失败
    pause
    exit /b 1
)

echo 🚀 启动容器...
docker-compose up -d
if errorlevel 1 (
    echo ❌ 启动失败
    pause
    exit /b 1
)

echo ✅ 应用已启动！
echo 📱 访问地址: http://localhost:3000
echo.
echo 📋 常用命令:
echo   查看日志: docker-compose logs -f
echo   停止服务: docker-compose down
echo   重启服务: docker-compose restart
echo   查看状态: docker-compose ps
echo.
pause 