/**
 * @file FileUpload.tsx
 * @description 文件上传组件，支持拖放和点击上传，仅使用LangCore平台
 */

import React, { useCallback, useState } from 'react';
import { Card, CardBody, Button, Progress } from "@heroui/react";
import { Icon } from "@iconify/react";
import { FileUploadService } from '../utils/fileUploadService';
import { useLanguage } from '../contexts/LanguageContext';
import { API_CONFIG } from '../config/api';

/**
 * 上传响应的接口
 */
interface UploadResponse {
  data?: {
    fileId?: string;
    url?: string;
  };
  status?: string;  // LangCore使用status而不是success
  success?: boolean; // 兼容旧格式
  msg?: string;
}

/**
 * FileUpload 组件的 Props 接口
 */
interface FileUploadProps {
  /** 文件上传成功的回调函数 */
  onFileUploaded: (file: File, fileInfo: { fileId: string; url: string; publicUrl?: string }) => void;
  /** 文件上传失败的回调函数 */
  onError: (error: string) => void;
  /** 是否支持多文件模式（默认为 false） */
  multipleMode?: boolean;
  /** 多文件模式下选择文件的回调 */
  onFilesSelected?: (files: File[]) => void;
}

/**
 * FileUpload 组件
 * 
 * @description 提供文件上传功能的组件，支持拖放和点击上传。
 * 使用 LangCore 平台处理文件上传。
 */
const FileUpload: React.FC<FileUploadProps> = ({ 
  onFileUploaded, 
  onError, 
  multipleMode = false, 
  onFilesSelected 
}) => {
  const { t } = useLanguage();
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');

  /**
   * 处理文件选择事件
   */
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const fileArray = Array.from(files);
      if (multipleMode && onFilesSelected) {
        onFilesSelected(fileArray);
      } else {
        handleFileUpload(fileArray[0]);
      }
    }
    // 清空 input，允许重复选择相同文件
    e.target.value = '';
  }, [multipleMode, onFilesSelected]);

  /**
   * 上传文件到LangCore平台
   * @param file 要上传的文件
   * @returns 解析后的上传响应
   */
  const uploadFileToLangCore = async (file: File): Promise<UploadResponse> => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      
      const uploadResponse = await fetch(API_CONFIG.publicUploadEndpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_CONFIG.authToken}`
        },
        body: formData,
        redirect: 'follow'
      });
    
      if (!uploadResponse.ok) {
        throw new Error(`上传文件到LangCore失败: ${uploadResponse.statusText}`);
      }
      
      const uploadResult = await uploadResponse.json();
      // console.log('📥 LangCore响应:', uploadResult);
      
      // 检查LangCore响应格式：{"status":"success","data":{"fileId":"..."}}
      if ((uploadResult.status === 'success' || uploadResult.success) && uploadResult.data && uploadResult.data.fileId) {
        return uploadResult;
      } else {
        throw new Error('LangCore服务器响应格式不正确');
      }
    } catch (error) {
      console.error('上传文件到LangCore失败:', error);
      throw error;
    }
  };

  /**
   * 处理文件上传
   * @param file 要上传的文件
   */
  const handleFileUpload = async (file: File) => {
    // 验证文件
    const typeError = FileUploadService.getFileTypeError(file);
    if (typeError) {
      onError(typeError);
      return;
    }

    const sizeError = FileUploadService.getFileSizeError(file);
    if (sizeError) {
      onError(sizeError);
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setUploadStatus('uploading');
    
    try {
      // console.log('🔄 开始上传文件:', file.name);

      // 模拟进度更新
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      // 上传到LangCore平台
      const langCoreResponse = await uploadFileToLangCore(file);

      clearInterval(progressInterval);
      setUploadProgress(100);

      // 检查LangCore响应格式：{"status":"success","data":{"fileId":"..."}}
      if ((langCoreResponse.status === 'success' || langCoreResponse.success) && langCoreResponse.data) {
        // console.log('✅ 文件上传成功:', {
        //   fileId: langCoreResponse.data.fileId,
        //   url: langCoreResponse.data.url
        // });

        setUploadStatus('success');
        
        // 调用成功回调
        onFileUploaded(file, {
          fileId: langCoreResponse.data.fileId!,
          url: langCoreResponse.data.url!,
          publicUrl: langCoreResponse.data.url
        });

        // 2秒后重置状态
        setTimeout(() => {
          setUploadStatus('idle');
          setUploadProgress(0);
        }, 2000);
      } else {
        throw new Error('上传响应格式不正确');
      }
    } catch (error) {
      console.error('❌ 文件上传失败:', error);
      setUploadStatus('error');
      onError(error instanceof Error ? error.message : '文件上传失败');
      
      // 3秒后重置状态
      setTimeout(() => {
        setUploadStatus('idle');
        setUploadProgress(0);
      }, 3000);
    } finally {
      setIsUploading(false);
    }
  };

  /**
   * 处理拖放事件
   */
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      if (multipleMode && onFilesSelected) {
        onFilesSelected(files);
      } else {
        handleFileUpload(files[0]);
      }
    }
  }, [multipleMode, onFilesSelected]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  /**
   * 获取上传状态的颜色
   */
  const getStatusColor = () => {
    switch (uploadStatus) {
      case 'uploading': return 'primary';
      case 'success': return 'success';
      case 'error': return 'danger';
      default: return 'default';
    }
  };

  /**
   * 获取上传状态的图标
   */
  const getStatusIcon = () => {
    switch (uploadStatus) {
      case 'uploading': return 'lucide:loader-2';
      case 'success': return 'lucide:check-circle';
      case 'error': return 'lucide:x-circle';
      default: return 'lucide:upload-cloud';
    }
  };

  /**
   * 获取上传状态的文本
   */
  const getStatusText = () => {
    switch (uploadStatus) {
      case 'uploading': return '正在上传...';
      case 'success': return '上传成功!';
      case 'error': return '上传失败';
      default: return multipleMode ? '点击或拖拽文件到这里上传（支持多文件）' : '点击或拖拽文件到这里上传';
    }
  };

  return (
    <div className="w-full h-full flex items-center justify-center p-8">
      <Card className="w-full max-w-2xl mx-auto">
        <CardBody className="p-8">
          <div
            className={`
              border-2 border-dashed rounded-lg p-12 text-center transition-all duration-200 cursor-pointer
              ${isDragging 
                ? 'border-primary bg-primary/10 scale-105' 
                : uploadStatus === 'success'
                ? 'border-success bg-success/10'
                : uploadStatus === 'error'
                ? 'border-danger bg-danger/10'
                : 'border-gray-300 hover:border-primary hover:bg-gray-50'
              }
            `}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => document.getElementById('file-input')?.click()}
            role="button"
            tabIndex={0}
            aria-label="文件上传区域，点击选择文件或拖拽文件到此处"
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                document.getElementById('file-input')?.click();
              }
            }}
          >
            <div className="space-y-6">
              <Icon 
                icon={getStatusIcon()} 
                className={`
                  text-6xl mx-auto
                  ${uploadStatus === 'uploading' ? 'animate-spin' : ''}
                  ${uploadStatus === 'success' ? 'text-success' : ''}
                  ${uploadStatus === 'error' ? 'text-danger' : ''}
                  ${uploadStatus === 'idle' ? 'text-gray-400' : ''}
                `}
                aria-label={uploadStatus === 'uploading' ? '上传中图标' : '上传图标'}
              />
              
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-gray-700">
                  {getStatusText()}
                </h3>
                <p className="text-sm text-gray-500">
                  支持 PDF, DOC, DOCX, XLS, XLSX, JPG, PNG 格式，大小不超过 10MB
                </p>
              </div>

              {isUploading && (
                <div className="space-y-2">
                  <Progress 
                    value={uploadProgress} 
                    color={getStatusColor() as any}
                    className="w-full"
                    aria-label="上传进度"
                  />
                  <p className="text-sm text-gray-600">{uploadProgress.toFixed(0)}%</p>
                </div>
              )}

              <div className="flex gap-4 justify-center">
                <Button
                  color="primary"
                  variant="flat"
                  onPress={() => document.getElementById('file-input')?.click()}
                  disabled={isUploading}
                  className="flex items-center gap-2 rounded-lg"
                  aria-label="选择文件"
                >
                  <Icon icon="lucide:folder-open" aria-label="文件夹图标" />
                  选择文件
                </Button>
              </div>

              <input
                id="file-input"
                type="file"
                multiple={multipleMode}
                onChange={handleFileSelect}
                className="hidden"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                aria-label="文件选择输入"
              />
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};

export default FileUpload; 