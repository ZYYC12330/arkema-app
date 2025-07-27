/**
 * @file api.ts
 * @description API配置文件，使用环境变量管理API配置
 */

export const API_CONFIG = {
  baseUrl: import.meta.env.VITE_API_BASE_URL || '',
  uploadEndpoint: import.meta.env.VITE_API_UPLOAD_ENDPOINT || '/api/upload',
//   publicUploadEndpoint: import.meta.env.VITE_API_PUBLIC_UPLOAD_ENDPOINT || 'https://langtum.langcore.net/api/file',
//   authToken: import.meta.env.VITE_API_AUTH_TOKEN || 'sk-v2c9gcxgkl0s'
  publicUploadEndpoint: import.meta.env.VITE_API_PUBLIC_UPLOAD_ENDPOINT || 'https://demo.langcore.cn/api/file',
  authToken: import.meta.env.VITE_API_AUTH_TOKEN || 'sk-zzvwbcaxoss3'
};

// 验证必要的环境变量
export const validateApiConfig = () => {
  const requiredEnvVars = [
    'VITE_API_PUBLIC_UPLOAD_ENDPOINT',
    'VITE_API_AUTH_TOKEN'
  ];

  const missingVars = requiredEnvVars.filter(varName => !import.meta.env[varName]);
  
  if (missingVars.length > 0) {
    console.warn('Missing required environment variables:', missingVars);
  }

  return missingVars.length === 0;
}; 