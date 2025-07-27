#!/bin/bash

# 设置错误时退出
set -e

echo "🚀 开始使用 Nginx 部署 Arkema 应用..."

# 检查必要的工具
if ! command -v npm &> /dev/null; then
    echo "❌ npm 未安装，请先安装 Node.js"
    exit 1
fi

if ! command -v nginx &> /dev/null; then
    echo "❌ nginx 未安装，请先安装 nginx"
    echo "Ubuntu/Debian: sudo apt-get install nginx"
    echo "CentOS/RHEL: sudo yum install nginx"
    exit 1
fi

# 创建必要的目录
echo "📁 创建部署目录..."
sudo mkdir -p /var/www/arkema-app
sudo mkdir -p /var/www/arkema-app/documents
sudo mkdir -p /etc/nginx/sites-available
sudo mkdir -p /etc/nginx/sites-enabled

# 安装依赖并构建应用
echo "🔨 构建应用..."
npm ci --only=production
npm run build

# 复制构建文件到nginx目录
echo "📦 复制文件到nginx目录..."
sudo cp -r dist/* /var/www/arkema-app/
sudo cp -r documents/* /var/www/arkema-app/documents/ 2>/dev/null || true

# 设置权限
echo "🔐 设置文件权限..."
sudo chown -R www-data:www-data /var/www/arkema-app
sudo chmod -R 755 /var/www/arkema-app

# 创建nginx配置文件
echo "⚙️ 创建nginx配置..."
sudo tee /etc/nginx/sites-available/arkema-app << 'EOF'
server {
    listen 80;
    server_name localhost;
    root /var/www/arkema-app;
    index index.html;

    # 日志配置
    access_log /var/log/nginx/arkema-app.access.log;
    error_log /var/log/nginx/arkema-app.error.log;

    # 处理静态文件
    location / {
        try_files $uri $uri/ /index.html;
        add_header Cache-Control "public, max-age=31536000" always;
    }

    # 处理documents目录
    location /documents/ {
        alias /var/www/arkema-app/documents/;
        autoindex on;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        add_header Pragma "no-cache";
        add_header Expires "0";
    }

    # 处理API请求（如果需要）
    location /api/ {
        # 这里可以配置代理到后端服务
        # proxy_pass http://localhost:3001;
        # proxy_set_header Host $host;
        # proxy_set_header X-Real-IP $remote_addr;
        # proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        # proxy_set_header X-Forwarded-Proto $scheme;
        
        # 临时返回404，因为前端应用不包含后端API
        return 404;
    }

    # 安全头
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # 缓存设置
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Gzip压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml;
}
EOF

# 启用站点
echo "🔗 启用nginx站点..."
sudo ln -sf /etc/nginx/sites-available/arkema-app /etc/nginx/sites-enabled/

# 测试nginx配置
echo "🧪 测试nginx配置..."
sudo nginx -t

if [ $? -eq 0 ]; then
    echo "✅ nginx配置测试通过"
else
    echo "❌ nginx配置测试失败"
    exit 1
fi

# 重启nginx
echo "🔄 重启nginx服务..."
sudo systemctl restart nginx

# 检查nginx状态
echo "📊 检查nginx状态..."
sudo systemctl status nginx --no-pager -l

echo "✅ 部署完成！"
echo "🌐 访问地址: http://localhost"
echo "📁 文件存储: http://localhost/documents/"
echo ""
echo "📋 常用命令:"
echo "  查看nginx状态: sudo systemctl status nginx"
echo "  重启nginx: sudo systemctl restart nginx"
echo "  查看日志: sudo tail -f /var/log/nginx/arkema-app.access.log"
echo "  查看错误日志: sudo tail -f /var/log/nginx/arkema-app.error.log" 