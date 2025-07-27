/**
 * @file env.d.ts
 * @description 环境变量类型定义
 */

interface ImportMetaEnv {
  /** API基础URL */
  readonly VITE_API_BASE_URL: string;
  /** 上传端点 */
  readonly VITE_API_UPLOAD_ENDPOINT: string;
  /** 公网上传端点 */
  readonly VITE_API_PUBLIC_UPLOAD_ENDPOINT: string;
  /** API认证令牌 */
  readonly VITE_API_AUTH_TOKEN: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
} 