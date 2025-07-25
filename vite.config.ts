import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import vitePluginInjectDataLocator from "./plugins/vite-plugin-inject-data-locator";
import { readdir, stat, writeFile } from 'fs/promises';
import { join } from 'path';

// 自定义插件：提供文件列表API和文件上传API
const localFileApiPlugin = () => {
  return {
    name: 'local-file-api-plugin',
    configureServer(server) {
      // --- API 1: 获取文件列表 ---
      server.middlewares.use('/api/files', async (req, res) => {
        if (req.method !== 'GET') {
          res.statusCode = 405;
          return res.end('Method Not Allowed');
        }
        try {
          const documentsPath = join(process.cwd(), 'public', 'documents');
          const files = await readdir(documentsPath, { withFileTypes: true });
          
          const fileList = await Promise.all(
            files
              .filter(dirent => dirent.isFile())
              .map(async (file) => {
                const filePath = join(documentsPath, file.name);
                const stats = await stat(filePath);
                return { name: file.name, size: stats.size, lastModified: stats.mtime };
              })
          );
          
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(fileList));
        } catch (error) {
          console.error('读取文件列表失败:', error);
          res.statusCode = 500;
          res.end(JSON.stringify({ error: '读取文件列表失败' }));
        }
      });

      // --- API 2: 处理文件上传 ---
      server.middlewares.use('/api/upload', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          return res.end('Method Not Allowed');
        }
        
        try {
          const chunks: any[] = [];
          for await (const chunk of req) {
            chunks.push(chunk);
          }
          const buffer = Buffer.concat(chunks);

          // 从'content-type'头中解析boundary
          const contentType = req.headers['content-type'];
          const boundaryMatch = contentType.match(/boundary=(.+)/);
          if (!boundaryMatch) {
            throw new Error('无效的Content-Type，缺少boundary');
          }
          const boundary = `--${boundaryMatch[1]}`;

          const parts = buffer.toString().split(boundary).slice(1, -1);
          const filePart = parts[0];
          
          // 解析文件名
          const filenameMatch = filePart.match(/filename="(.+?)"/);
          if (!filenameMatch) {
            throw new Error('无法解析文件名');
          }
          const filename = filenameMatch[1];
          
          // 定位文件内容的开始位置
          const contentStartIndex = filePart.indexOf('\r\n\r\n') + 4;
          // 获取文件内容
          const fileContent = buffer.slice(buffer.indexOf(filePart) + contentStartIndex, buffer.indexOf(boundary, buffer.indexOf(filePart)) -2 );

          const savePath = join(process.cwd(), 'public', 'documents', filename);
          await writeFile(savePath, fileContent);

          console.log(`文件已保存到: ${savePath}`);

          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({
            success: true,
            data: {
              fileId: filename, // 使用文件名作为ID
              url: `/documents/${filename}` // 返回公网可访问的URL
            }
          }));
        } catch (error) {
          console.error('文件上传失败:', error);
          res.statusCode = 500;
          res.end(JSON.stringify({ success: false, msg: '文件上传处理失败' }));
        }
      });
    }
  };
};

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), vitePluginInjectDataLocator(), localFileApiPlugin()],
  server: {
    proxy: {
      '/api/demo': {
        target: 'https://demo.langcore.cn',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/demo/, '/api'),
        secure: true,
        headers: {
          'Origin': 'https://demo.langcore.cn'
        },
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('proxy error', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('Sending Request to the Target:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
          });
        },
      }
    }
  }
});