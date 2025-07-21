import React, { useState } from 'react';
import { Viewer, Worker } from '@react-pdf-viewer/core';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';
import { Card, CardBody, Button, Progress, Spinner } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useLanguage } from '../contexts/LanguageContext';

// 导入 CSS 样式
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';

interface PDFViewerProps {
  file?: File | string | null;
  height?: string;
  className?: string;
  onLoadSuccess?: (numPages: number) => void;
  onLoadError?: (error: Error) => void;
}

const PDFViewer: React.FC<PDFViewerProps> = ({
  file,
  height = '600px',
  className = '',
  onLoadSuccess,
  onLoadError
}) => {
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  
  // 创建默认布局插件
  const defaultLayoutPluginInstance = defaultLayoutPlugin({
    sidebarTabs: (defaultTabs) => [
      // 只保留缩略图和书签标签
      defaultTabs[0], // 缩略图
      defaultTabs[1], // 书签
    ],
    toolbarPlugin: {
      searchPlugin: {
        keyword: '',
      },
    },
  });

  // 处理文档加载成功
  const handleDocumentLoad = (e: any) => {
    setIsLoading(false);
    setError(null);
    const pages = e.doc.numPages;
    setNumPages(pages);
    onLoadSuccess?.(pages);
  };

  // 处理文档加载错误
  const handleDocumentError = (e: any) => {
    setIsLoading(false);
    const errorMessage = e.message || t?.loadError || '加载 PDF 文件失败';
    setError(errorMessage);
    onLoadError?.(new Error(errorMessage));
  };

  // 处理页面加载开始
  const handlePageLoad = () => {
    setIsLoading(true);
  };

  // 获取文件 URL
  const getFileUrl = (): string => {
    if (!file) return '';
    
    if (typeof file === 'string') {
      return file;
    }
    
    if (file instanceof File) {
      return URL.createObjectURL(file);
    }
    
    return '';
  };

  // 格式化文件大小
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const fileUrl = getFileUrl();

  return (
    <Card className={`rounded-md shadow-md bg-white ${className}`}>
      <CardBody className="p-4">
        {/* 文件信息栏 */}
        {file && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Icon icon="lucide:file-text" className="text-primary mr-2" />
                <div>
                  <p className="font-medium text-gray-900">
                    {file instanceof File ? file.name : '在线文档'}
                  </p>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    {file instanceof File && (
                      <span>{formatFileSize(file.size)}</span>
                    )}
                    {numPages > 0 && (
                      <span>{numPages} 页</span>
                    )}
                  </div>
                </div>
              </div>
              
              {isLoading && (
                <div className="flex items-center gap-2">
                  <Spinner size="sm" color="primary" />
                  <span className="text-sm text-gray-600">加载中...</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* PDF 查看器容器 */}
        <div 
          className="border border-gray-200 rounded-lg overflow-hidden"
          style={{ height }}
        >
          {!file ? (
            // 空状态
            <div className="h-full flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <Icon icon="lucide:file-text" className="text-6xl text-gray-400 mb-4 mx-auto" />
                <p className="text-lg font-medium text-gray-700 mb-2">
                  {t?.selectPDFFile || '选择 PDF 文件'}
                </p>
                <p className="text-sm text-gray-500">
                  请上传或选择一个 PDF 文件进行预览
                </p>
              </div>
            </div>
          ) : error ? (
            // 错误状态
            <div className="h-full flex items-center justify-center bg-red-50">
              <div className="text-center">
                <Icon icon="lucide:alert-circle" className="text-6xl text-red-400 mb-4 mx-auto" />
                <p className="text-lg font-medium text-red-700 mb-2">加载失败</p>
                <p className="text-sm text-red-600 mb-4">{error}</p>
                <Button
                  color="danger"
                  variant="flat"
                  onPress={() => {
                    setError(null);
                    setIsLoading(true);
                  }}
                >
                  <Icon icon="lucide:refresh-cw" className="mr-2" />
                  重新加载
                </Button>
              </div>
            </div>
          ) : (
            // PDF 查看器
            <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
              <div style={{ height: '100%' }}>
                <Viewer
                  fileUrl={fileUrl}
                  plugins={[defaultLayoutPluginInstance]}
                  onDocumentLoad={handleDocumentLoad}
                  onDocumentLoadError={handleDocumentError}
                  onPageLoad={handlePageLoad}
                  theme={{
                    theme: 'light',
                  }}
                />
              </div>
            </Worker>
          )}
        </div>
      </CardBody>
    </Card>
  );
};

export default PDFViewer; 