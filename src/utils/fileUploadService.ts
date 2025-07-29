// 文件上传服务
// 统一管理文件上传到LangCore平台的逻辑

import { API_CONFIG } from '../config/api';

export interface UploadResponse {
  data?: {
    fileId?: string;
    url?: string;
  };
  status?: string;  // LangCore使用status而不是success
  success?: boolean; // 兼容旧格式
  msg?: string;
}

export class FileUploadService {
  /**
   * 上传文件到LangCore平台
   * @param file 要上传的文件
   * @returns 上传结果，包含fileId和url
   */
  static async uploadFileToLangCore(file: File): Promise<{ fileId: string; url: string } | null> {
    try {
      // console.log('🌐 开始上传文件到LangCore平台:', file.name);
      
      const formData = new FormData();
      formData.append("file", file, file.name);
      
      const uploadResponse = await fetch(API_CONFIG.publicUploadEndpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_CONFIG.authToken}`
        },
        body: formData,
        redirect: 'follow'
      });
    
      if (!uploadResponse.ok) {
        throw new Error(`上传文件到LangCore失败: ${uploadResponse.status} - ${uploadResponse.statusText}`);
      }
      
      const uploadResult = await uploadResponse.json();
      // console.log('📥 LangCore平台响应:', uploadResult);
      
      // 检查LangCore响应格式：{"status":"success","data":{"fileId":"..."}}
      if ((uploadResult.status === 'success' || uploadResult.success) && uploadResult.data && uploadResult.data.fileId) {
        // console.log('✅ 文件上传到LangCore成功:', {
        //   fileId: uploadResult.data.fileId,
        //   url: uploadResult.data.url
        // });
        return {
          fileId: uploadResult.data.fileId,
          url: uploadResult.data.url
        };
      } else {
        throw new Error('LangCore平台响应格式不正确');
      }
    } catch (error) {
      console.error('❌ 上传文件到LangCore失败:', error);
      return null;
    }
  }

  /**
   * 上传文件到LangCore平台（返回URL字符串）
   * @param file 要上传的文件
   * @returns 文件URL或null
   */
  static async uploadFileToLangCoreForUrl(file: File): Promise<string | null> {
    const result = await this.uploadFileToLangCore(file);
    return result?.url || null;
  }

  /**
   * 上传文件到LangCore平台（返回fileId）
   * @param file 要上传的文件
   * @returns 文件ID或null
   */
  static async uploadFileToLangCoreForFileId(file: File): Promise<string | null> {
    const result = await this.uploadFileToLangCore(file);
    return result?.fileId || null;
  }

  /**
   * 验证文件类型
   * @param file 要验证的文件
   * @returns 是否支持的文件类型
   */
  static isValidFileType(file: File): boolean {
    const allowedTypes = [
      'application/pdf', 
      'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'image/jpeg',
      'image/jpg',
      'image/png'
    ];
    
    return allowedTypes.includes(file.type);
  }

  /**
   * 验证文件大小
   * @param file 要验证的文件
   * @param maxSizeMB 最大文件大小（MB）
   * @returns 是否在大小限制内
   */
  static isValidFileSize(file: File, maxSizeMB: number = 10): boolean {
    return file.size <= maxSizeMB * 1024 * 1024;
  }

  /**
   * 获取文件类型错误信息
   * @param file 文件
   * @returns 错误信息或null
   */
  static getFileTypeError(file: File): string | null {
    if (!this.isValidFileType(file)) {
      return '不支持的文件格式，请上传 PDF、DOC、DOCX、XLS、XLSX 或图片文件';
    }
    return null;
  }

  /**
   * 获取文件大小错误信息
   * @param file 文件
   * @param maxSizeMB 最大文件大小（MB）
   * @returns 错误信息或null
   */
  static getFileSizeError(file: File, maxSizeMB: number = 10): string | null {
    if (!this.isValidFileSize(file, maxSizeMB)) {
      return `文件太大，请选择小于 ${maxSizeMB}MB 的文件`;
    }
    return null;
  }
} 