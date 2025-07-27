@echo off
setlocal enabledelayedexpansion

echo 🚀 开始使用 Nginx 部署 Arkema 应用...

REM 检查必要的工具
where npm >nul 2>&1
if errorlevel 1 (
    echo ❌ npm 未安装，请先安装 Node.js
    pause
    exit /b 1
)

where nginx >nul 2>&1
if errorlevel 1 (
    echo ❌ nginx 未安装，请先安装 nginx
    echo 下载地址: http://nginx.org/en/download.html
    pause
    exit /b 1
)

REM 创建必要的目录
echo 📁 创建部署目录...
if not exist "C:\nginx\html\arkema-app" mkdir "C:\nginx\html\arkema-app"
if not exist "C:\nginx\html\arkema-app\documents" mkdir "C:\nginx\html\arkema-app\documents"

REM 安装依赖并构建应用
echo 🔨 构建应用...
call npm ci --only=production
if errorlevel 1 (
    echo ❌ 依赖安装失败
    pause
    exit /b 1
)

call npm run build
if errorlevel 1 (
    echo ❌ 构建失败
    pause
    exit /b 1
)

REM 复制构建文件到nginx目录
echo 📦 复制文件到nginx目录...
xcopy /E /Y /I "dist\*" "C:\nginx\html\arkema-app\"
if exist "documents" xcopy /E /Y /I "documents\*" "C:\nginx\html\arkema-app\documents\"

REM 创建nginx配置文件
echo ⚙️ 创建nginx配置...
(
echo server {
echo     listen 80;
echo     server_name localhost;
echo     root C:/nginx/html/arkema-app;
echo     index index.html;
echo.
echo     # 日志配置
echo     access_log logs/arkema-app.access.log;
echo     error_log logs/arkema-app.error.log;
echo.
echo     # 处理静态文件
echo     location / {
echo         try_files $uri $uri/ /index.html;
echo         add_header Cache-Control "public, max-age=31536000" always;
echo     }
echo.
echo     # 处理documents目录
echo     location /documents/ {
echo         alias C:/nginx/html/arkema-app/documents/;
echo         autoindex on;
echo         add_header Cache-Control "no-cache, no-store, must-revalidate";
echo         add_header Pragma "no-cache";
echo         add_header Expires "0";
echo     }
echo.
echo     # 处理API请求（如果需要）
echo     location /api/ {
echo         # 这里可以配置代理到后端服务
echo         # proxy_pass http://localhost:3001;
echo         # proxy_set_header Host $host;
echo         # proxy_set_header X-Real-IP $remote_addr;
echo         # proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
echo         # proxy_set_header X-Forwarded-Proto $scheme;
echo         
echo         # 临时返回404，因为前端应用不包含后端API
echo         return 404;
echo     }
echo.
echo     # 安全头
echo     add_header X-Frame-Options "SAMEORIGIN" always;
echo     add_header X-XSS-Protection "1; mode=block" always;
echo     add_header X-Content-Type-Options "nosniff" always;
echo     add_header Referrer-Policy "no-referrer-when-downgrade" always;
echo     add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
echo.
echo     # 缓存设置
echo     location ~* \.^(js^|css^|png^|jpg^|jpeg^|gif^|ico^|svg^)$ {
echo         expires 1y;
echo         add_header Cache-Control "public, immutable";
echo     }
echo.
echo     # Gzip压缩
echo     gzip on;
echo     gzip_vary on;
echo     gzip_min_length 1024;
echo     gzip_proxied any;
echo     gzip_comp_level 6;
echo     gzip_types
echo         text/plain
echo         text/css
echo         text/xml
echo         text/javascript
echo         application/json
echo         application/javascript
echo         application/xml+rss
echo         application/atom+xml
echo         image/svg+xml;
echo }
) > "C:\nginx\conf\arkema-app.conf"

REM 修改主nginx配置文件
echo 🔧 修改nginx主配置...
if not exist "C:\nginx\conf\nginx.conf.backup" copy "C:\nginx\conf\nginx.conf" "C:\nginx\conf\nginx.conf.backup"

REM 测试nginx配置
echo 🧪 测试nginx配置...
cd /d "C:\nginx"
nginx -t
if errorlevel 1 (
    echo ❌ nginx配置测试失败
    pause
    exit /b 1
)

echo ✅ nginx配置测试通过

REM 重启nginx
echo 🔄 重启nginx服务...
taskkill /f /im nginx.exe >nul 2>&1
start nginx

REM 等待nginx启动
timeout /t 2 /nobreak >nul

echo ✅ 部署完成！
echo 🌐 访问地址: http://localhost
echo 📁 文件存储: http://localhost/documents/
echo.
echo 📋 常用命令:
echo   查看nginx状态: tasklist ^| findstr nginx
echo   重启nginx: taskkill /f /im nginx.exe ^&^& start nginx
echo   查看日志: type C:\nginx\logs\arkema-app.access.log
echo   查看错误日志: type C:\nginx\logs\arkema-app.error.log
echo.
pause 