/**
 * @file FileUpload.tsx
 * @description 文件上传组件，支持拖放和点击选择文件，并显示上传进度。
 */

import React, { useCallback, useState } from 'react';
import { Card, CardBody, Button, Progress } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useLanguage } from '../contexts/LanguageContext';

// API 配置
const API_CONFIG = {
  baseUrl: '',
  uploadEndpoint: '/api/upload',
  publicUploadEndpoint: 'https://demo.langcore.cn/api/file',
  authToken: 'sk-zzvwbcaxoss3'
};

/**
 * FileUpload 组件的属性接口
 */
interface FileUploadProps {
  /** 文件上传成功的回调 */
  onFileUploaded: (file: File, fileInfo: { fileId: string; url: string; publicUrl: string }) => void;
  /** 文件上传失败的回调 */
  onError?: (error: string) => void;
  /** 多文件选择的回调 */
  onFilesSelected?: (files: File[]) => void;
  /** 是否支持多文件模式 */
  multipleMode?: boolean;
}

/**
 * 上传响应的接口
 */
interface UploadResponse {
  data?: {
    fileId?: string;
    url?: string;
  };
  success?: boolean;
  msg?: string;
}

/**
 * 文件上传组件
 * 
 * @description 提供一个用户友好的界面，用于上传文件。
 * 支持拖放、点击选择、文件类型/大小验证和上传进度显示。
 * 支持单文件和多文件上传模式。
 */
const FileUpload: React.FC<FileUploadProps> = ({ 
  onFileUploaded, 
  onError, 
  onFilesSelected, 
  multipleMode = false 
}) => {
  const { t } = useLanguage();
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);

  /**
   * 处理文件拖拽悬停事件
   */
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  /**
   * 处理文件拖拽离开事件
   */
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  /**
   * 处理文件放下事件
   */
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      if (multipleMode && onFilesSelected) {
        onFilesSelected(files);
      } else {
        handleFileUpload(files[0]);
      }
    }
  }, [multipleMode, onFilesSelected]);

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
   * 上传文件到本地服务器
   * @param file 要上传的文件
   * @returns 解析后的上传响应
   */
  const uploadFileToLocalServer = async (file: File): Promise<UploadResponse> => {
    const formData = new FormData();
    formData.append('file', file, file.name);

    const uploadUrl = `${API_CONFIG.baseUrl}${API_CONFIG.uploadEndpoint}`;

    const requestOptions = {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_CONFIG.authToken}`
      },
      body: formData,
      redirect: 'follow' as RequestRedirect
    };

    try {
      const response = await fetch(uploadUrl, requestOptions);
      
      if (!response.ok) {
        throw new Error(`上传失败: HTTP ${response.status} - ${response.statusText}`);
      }
      
      const result = await response.text();
      
      try {
        const responseData: UploadResponse = JSON.parse(result);
        return responseData;
      } catch (parseError) {
        throw new Error('解析响应失败');
      }
    } catch (error) {
      console.error('本地服务器上传错误:', error);
      throw error;
    }
  };

  /**
   * 上传文件到公网服务器
   * @param file 要上传的文件
   * @returns 公网可访问的 URL，如果失败则返回 null
   */
  const uploadFileToPublicServer = async (file: File): Promise<string | null> => {
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
        throw new Error(`上传文件到公网失败: ${uploadResponse.statusText}`);
      }
      
      const uploadResult = await uploadResponse.json();
      
      if (uploadResult.data.fileId) {
        return uploadResult.data.fileId;
      } else {
        throw new Error('公网服务器响应格式不正确');
      }
    } catch (error) {
      console.error('上传文件到公网失败:', error);
      return null;
    }
  };

  /**
   * 处理文件上传的核心逻辑
   * @param file 要上传的文件
   */
  const handleFileUpload = async (file: File) => {
    // 检查文件类型 - 扩展支持更多格式
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
    
    if (!allowedTypes.includes(file.type)) {
      const message = '不支持的文件格式，请上传 PDF 文件';
      setUploadError(message);
      onError?.(message);
      return;
    }

    // 检查文件大小 (10MB)
    if (file.size > 10 * 1024 * 1024) {
      const message = '文件太大，请选择小于 10MB 的文件';
      setUploadError(message);
      onError?.(message);
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setUploadError(null);

    try {
      console.log('开始上传文件:', file.name, '大小:', (file.size / 1024 / 1024).toFixed(2) + 'MB');
      
      // 模拟上传进度
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);
      
      // 先上传到本地服务器
      const localResponse = await uploadFileToLocalServer(file);

      // 再上传到公网服务器
      const publicUrl = await uploadFileToPublicServer(file);
      
      clearInterval(progressInterval);
      setUploadProgress(100);

      console.log('文件上传完成:', {
        fileId: localResponse.data.fileId,
        localUrl: localResponse.data.url,
        publicUrl: publicUrl
      });

      // 上传成功，通知父组件
      setTimeout(() => {
        setIsUploading(false);
        onFileUploaded(file, {
          fileId: localResponse.data!.fileId!,
          url: localResponse.data!.url!,
          publicUrl: publicUrl || ''
        });
      }, 500);
      
    } catch (error) {
      console.error('文件上传失败:', error);
      setIsUploading(false);
      setUploadProgress(0);
      const errorMessage = error instanceof Error ? error.message : '上传失败，请重试';
      setUploadError(errorMessage);
      onError?.(errorMessage);
    }
  };

  return (
    <Card className="flex-1 h-full rounded-md shadow-md bg-white">
      <CardBody className="p-6 h-full flex flex-col">
        <div className="flex justify-between items-center mb-6 flex-shrink-0">
          <h2 className="text-xl font-bold text-primary flex items-center">
            <Icon icon="lucide:upload" className="mr-2" aria-label="上传图标" />
            {t.fileUpload}
          </h2>
        </div>

        {!isUploading ? (
          <div className="flex-1 flex flex-col items-center justify-center">
            {uploadError && (
              <div className="w-full mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                              <div className="flex items-center">
                <Icon icon="lucide:alert-circle" className="text-red-500 mr-2" aria-label="错误图标" />
                <p className="text-red-700 text-sm">{uploadError}</p>
              </div>
              </div>
            )}
            
            <div
              className={`
                w-full h-96 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer 
                transition-all duration-300 ease-in-out transform
                ${isDragOver 
                  ? 'border-primary bg-primary/5 scale-105' 
                  : 'border-gray-300 hover:border-primary hover:bg-primary/5 hover:scale-102'
                }
              `}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => document.getElementById('file-input')?.click()}
              role="button"
              tabIndex={0}
              aria-label={multipleMode ? '多文件上传区域' : t.uploadArea}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  document.getElementById('file-input')?.click();
                }
              }}
            >
              <Icon 
                icon={multipleMode ? "lucide:files" : "lucide:cloud-upload"} 
                className="text-6xl text-gray-400 mb-4" 
                aria-label={multipleMode ? "多文件上传图标" : "单文件上传图标"}
              />
              <p className="text-lg font-medium text-gray-700 mb-2">
                {multipleMode ? '拖放多个文件到此处' : t.uploadArea}
              </p>
              <p className="text-sm text-gray-500 mb-4">
                {multipleMode ? '支持同时选择多个文件批量上传' : t.uploadInstruction}
              </p>
              <Button color="primary" variant="flat" size="lg" aria-label={multipleMode ? '选择多个文件' : t.selectFile}>
                <Icon icon={multipleMode ? "lucide:folder-plus" : "lucide:file-plus"} className="mr-2" aria-label={multipleMode ? "文件夹图标" : "文件图标"} />
                {multipleMode ? '选择多个文件' : t.selectFile}
              </Button>
            </div>

            <input
              id="file-input"
              type="file"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
              multiple={multipleMode}
              onChange={handleFileSelect}
              className="hidden"
              aria-label={multipleMode ? '选择多个文件' : t.selectFile}
            />

            <div className="mt-6 text-center flex-shrink-0">
              <p className="text-sm text-gray-600 mb-2">支持格式: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG</p>
              <p className="text-sm text-gray-500">
                最大文件大小: 10MB {multipleMode ? '| 支持批量选择和上传' : ''}
              </p>
              {multipleMode && (
                <p className="text-xs text-blue-600 mt-1">
                  ✨ 多文件模式：选择文件后将加入上传队列，可批量处理
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center">
            <Icon icon="lucide:upload-cloud" className="text-6xl text-primary mb-4" aria-label="上传中图标" />
            <h3 className="text-lg font-medium text-gray-700 mb-4">正在上传文件...</h3>
            <div className="w-full max-w-md">
              <Progress 
                value={uploadProgress} 
                className="mb-4"
                color="primary"
                showValueLabel={true}
              />
            </div>
            <p className="text-sm text-gray-600">{uploadProgress}% 已完成</p>
          </div>
        )}
      </CardBody>
    </Card>
  );
};

export default FileUpload; 