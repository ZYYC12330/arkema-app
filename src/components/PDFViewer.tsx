/**
 * @file PDFViewer.tsx
 * @description 一个功能强大的 PDF 查看器组件，支持文件转换和文本高亮。
 */

import React, { useState, useEffect } from 'react';
import { Viewer, Worker } from '@react-pdf-viewer/core';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';
import { Card, CardBody, Button, Progress, Spinner } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useLanguage } from '../contexts/LanguageContext';
import FileConverter from '../utils/fileConverter';

// 导入 CSS 样式
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';

/**
 * PDFViewer 组件的属性接口
 */
interface PDFViewerProps {
  /** 要显示的文件，可以是 File 对象或 URL 字符串 */
  file?: File | string | null;
  /** 查看器的高度 */
  height?: string;
  /** 自定义 CSS 类名 */
  className?: string;
  /** 文档加载成功的回调 */
  onLoadSuccess?: (numPages: number) => void;
  /** 文档加载失败的回调 */
  onLoadError?: (error: Error) => void;
  /** 需要在 PDF 中高亮的文本 */
  highlightText?: string;
}

/**
 * PDF 查看器组件
 * 
 * @description 使用 @react-pdf-viewer 库渲染 PDF 文件。
 * 支持多种文件类型（如图片、Excel），并能将其动态转换为 PDF 进行预览。
 * 支持通过 `highlightText` 属性在 PDF 中高亮显示指定的文本。
 */
const PDFViewer: React.FC<PDFViewerProps> = ({
  file,
  height = '600px',
  className = '',
  onLoadSuccess,
  onLoadError,
  highlightText = '', // 获取高亮文本
}) => {
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [convertedPdfUrl, setConvertedPdfUrl] = useState<string | null>(null);
  
  // 副作用 Hook，用于在文件变化时进行转换
  useEffect(() => {
    const convertFile = async () => {
      if (!file) {
        setConvertedPdfUrl(null);
        return;
      }

      const fileName = typeof file === 'string' ? file : file.name;
      const fileUrl = typeof file === 'string' ? file : URL.createObjectURL(file);
      
      // 检查是否需要转换
      const fileType = FileConverter.getFileType(fileName);
      
      if (fileType === 'pdf') {
        // 已经是PDF，直接使用
        setConvertedPdfUrl(fileUrl);
        return;
      }
      
      if (fileType && ['jpg', 'jpeg', 'png', 'xls', 'xlsx'].includes(fileType)) {
        setIsConverting(true);
        setError(null);
        
        try {
          const result = await FileConverter.convertToPdf(fileUrl, fileName);
          
          if (result.success && result.pdfUrl) {
            setConvertedPdfUrl(result.pdfUrl);
          } else {
            setError(result.error || '文件转换失败');
          }
        } catch (error) {
          setError(`转换过程中出错: ${error}`);
        } finally {
          setIsConverting(false);
        }
      } else {
        setError('不支持的文件类型');
      }
    };

    convertFile();
  }, [file]);

  // 创建并配置默认布局插件，包括搜索（高亮）功能
  const defaultLayoutPluginInstance = defaultLayoutPlugin({
    sidebarTabs: (defaultTabs) => [
      defaultTabs[0], // 缩略图
      defaultTabs[1], // 书签
    ],
    toolbarPlugin: {
      searchPlugin: {
        keyword: highlightText, // 使用高亮文本作为搜索关键词
      },
    },
  });

  /**
   * 处理文档加载事件（成功或失败）
   * @param e 事件对象
   */
  const handleDocumentLoad = (e: any) => {
    if (e.doc) {
      // 加载成功
      setIsLoading(false);
      setError(null);
      const pages = e.doc.numPages;
      setNumPages(pages);
      onLoadSuccess?.(pages);
    } else {
      // 加载失败
      setIsLoading(false);
      const errorMessage = e.message || t?.loadError || '加载 PDF 文件失败';
      setError(errorMessage);
      onLoadError?.(new Error(errorMessage));
    }
  };


  /**
   * 获取文件 URL
   * @returns 文件 URL 字符串
   */
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

  /**
   * 格式化文件大小
   * @param bytes 文件大小（字节）
   * @returns 格式化后的文件大小字符串
   */
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
                <Icon icon="lucide:file-text" className="text-primary mr-2" aria-label="PDF文件图标" />
                                   <div>
                     <p className="font-medium text-gray-900">
                       {file instanceof File ? file.name : (typeof file === 'string' ? file.split('/').pop() : '在线文档')}
                     </p>
                     <div className="flex items-center gap-4 text-sm text-gray-500">
                       {file instanceof File && (
                         <span>{formatFileSize(file.size)}</span>
                       )}
                       {numPages > 0 && (
                         <span>{numPages} 页</span>
                       )}
                       {file && (() => {
                         const fileName = typeof file === 'string' ? file : file.name;
                         const fileType = FileConverter.getFileType(fileName);
                         if (fileType && fileType !== 'pdf') {
                           return <span className="text-blue-600">已转换为 PDF</span>;
                         }
                         return null;
                       })()}
                     </div>
                   </div>
              </div>
              
                             {(isLoading || isConverting) && (
                 <div className="flex items-center gap-2">
                   <Spinner size="sm" color="primary" />
                   <span className="text-sm text-gray-600">
                     {isConverting ? '正在转换文件...' : '加载中...'}
                   </span>
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
                <Icon icon="lucide:file-text" className="text-6xl text-gray-400 mb-4 mx-auto" aria-label="选择PDF文件图标" />
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
                <Icon icon="lucide:alert-circle" className="text-6xl text-red-400 mb-4 mx-auto" aria-label="错误图标" />
                <p className="text-lg font-medium text-red-700 mb-2">加载失败</p>
                <p className="text-sm text-red-600 mb-4">{error}</p>
                <Button
                  color="danger"
                  variant="flat"
                  onPress={() => {
                    setError(null);
                    setIsLoading(true);
                  }}
                  aria-label="重新加载PDF"
                >
                  <Icon icon="lucide:refresh-cw" className="mr-2" aria-label="刷新图标" />
                  重新加载
                </Button>
              </div>
            </div>
          ) : (
            // PDF 查看器
                         <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
               <div style={{ height: '100%' }}>
                 <Viewer
                   fileUrl={convertedPdfUrl || fileUrl}
                   plugins={[defaultLayoutPluginInstance]}
                   onDocumentLoad={handleDocumentLoad}
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