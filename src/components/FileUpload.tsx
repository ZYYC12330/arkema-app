import React, { useCallback, useState } from 'react';
import { Card, CardBody, Button, Progress } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useLanguage } from '../contexts/LanguageContext';

// API 配置
const API_CONFIG = {
  baseUrl: '',
  uploadEndpoint: '/api/upload',
  authToken: ''
};

interface FileUploadProps {
  onFileUploaded: (file: File, fileInfo?: { fileId?: string; url?: string }) => void;
}

interface UploadResponse {
  data?: {
    fileId?: string;
    url?: string;
  };
  success?: boolean;
  msg?: string;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileUploaded }) => {
  const { t } = useLanguage();
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  }, []);

  const uploadFileToServer = async (file: File, onProgress?: (progress: number) => void): Promise<UploadResponse> => {
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
      console.log('上传响应:', result);
      
      try {
        const responseData: UploadResponse = JSON.parse(result);
        return responseData;
      } catch (parseError) {
        throw new Error('解析响应失败');
      }
    } catch (error) {
      console.error('上传错误:', error);
      throw error;
    }
  };

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
      const message = '不支持的文件格式，请上传 PDF、DOC、DOCX、XLS、XLSX 或图片文件';
      alert(message);
      setUploadError(message);
      return;
    }

    // 检查文件大小 (10MB)
    if (file.size > 10 * 1024 * 1024) {
      const message = '文件太大，请选择小于 10MB 的文件';
      alert(message);
      setUploadError(message);
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
      
      const response = await uploadFileToServer(file);

      clearInterval(progressInterval);
      setUploadProgress(100);

      console.log('上传响应:', response);

      if (response.data?.fileId) {
        // 上传成功
        setTimeout(() => {
          setIsUploading(false);
          onFileUploaded(file, {
            fileId: response.data?.fileId,
            url: response.data?.url
          });
          console.log('文件上传成功，FileId:', response.data?.fileId);
        }, 500);
      } else {
        throw new Error(response.msg || '上传失败，未返回文件ID');
      }
    } catch (error) {
      console.error('文件上传失败:', error);
      setIsUploading(false);
      setUploadProgress(0);
      const errorMessage = error instanceof Error ? error.message : '上传失败，请重试';
      setUploadError(errorMessage);
      alert(errorMessage);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Card className="flex-1 rounded-md shadow-md bg-white">
      <CardBody className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-primary flex items-center">
            <Icon icon="lucide:upload" className="mr-2" />
            {t.fileUpload}
          </h2>
        </div>

        {!isUploading ? (
          <div className="h-full flex flex-col items-center justify-center">
            {uploadError && (
              <div className="w-full mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <div className="flex items-center">
                  <Icon icon="lucide:alert-circle" className="text-red-500 mr-2" />
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
              aria-label={t.uploadArea}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  document.getElementById('file-input')?.click();
                }
              }}
            >
              <Icon icon="lucide:cloud-upload" className="text-6xl text-gray-400 mb-4" />
              <p className="text-lg font-medium text-gray-700 mb-2">{t.uploadArea}</p>
              <p className="text-sm text-gray-500 mb-4">{t.uploadInstruction}</p>
              <Button color="primary" variant="flat" size="lg">
                <Icon icon="lucide:file-plus" className="mr-2" />
                {t.selectFile}
              </Button>
            </div>

            <input
              id="file-input"
              type="file"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
              onChange={handleFileSelect}
              className="hidden"
              aria-label={t.selectFile}
            />

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600 mb-2">支持格式: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG</p>
              <p className="text-sm text-gray-500">最大文件大小: 10MB</p>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center">
            <Icon icon="lucide:upload-cloud" className="text-6xl text-primary mb-4" />
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