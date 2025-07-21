import React, { useCallback, useState } from 'react';
import { Card, CardBody, Button, Progress } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useLanguage } from '../contexts/LanguageContext';

interface FileUploadProps {
  onFileUploaded: (file: File) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileUploaded }) => {
  const { t } = useLanguage();
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

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

  const handleFileUpload = async (file: File) => {
    // 检查文件类型
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      alert('不支持的文件格式，请上传 PDF、DOC 或 DOCX 文件');
      return;
    }

    // 检查文件大小 (10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('文件太大，请选择小于 10MB 的文件');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    // 模拟上传进度
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 100);

    try {
      // 模拟文件上传延迟
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setUploadProgress(100);
      setTimeout(() => {
        setIsUploading(false);
        onFileUploaded(file);
      }, 500);
    } catch (error) {
      setIsUploading(false);
      setUploadProgress(0);
      alert(t.uploadError);
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
              accept=".pdf,.doc,.docx"
              onChange={handleFileSelect}
              className="hidden"
              aria-label={t.selectFile}
            />

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600 mb-2">{t.supportedFormats}</p>
              <p className="text-sm text-gray-500">{t.maxFileSize}</p>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center">
            <Icon icon="lucide:file-check" className="text-6xl text-primary mb-4" />
            <h3 className="text-lg font-medium text-gray-700 mb-4">{t.processing}</h3>
            <div className="w-full max-w-md">
              <Progress 
                value={uploadProgress} 
                className="mb-4"
                color="primary"
                showValueLabel={true}
              />
            </div>
            <p className="text-sm text-gray-600">{uploadProgress}% {t.processing}</p>
          </div>
        )}
      </CardBody>
    </Card>
  );
};

export default FileUpload; 