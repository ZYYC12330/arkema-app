import React from 'react';
import { Card, CardBody, Button, Chip } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useLanguage } from '../contexts/LanguageContext';
import PDFViewer from './PDFViewer';

interface PDFPreviewProps {
  uploadedFile?: File | null;
  fileUrl?: string | null;
}

const PDFPreview: React.FC<PDFPreviewProps> = ({ uploadedFile, fileUrl }) => {
  const { t } = useLanguage();

  // 下载文件功能
  const handleDownload = () => {
    if (uploadedFile) {
      const url = URL.createObjectURL(uploadedFile);
      const a = document.createElement('a');
      a.href = url;
      a.download = uploadedFile.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else if (fileUrl) {
      const a = document.createElement('a');
      a.href = fileUrl;
      a.download = fileUrl.split('/').pop() || 'document.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
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
    <div className="flex-1 flex flex-col">
      {/* PDF 查看器 */}
      <div className="flex-1">
        <PDFViewer 
           file={uploadedFile || fileUrl}
           height="calc(100vh - 200px)"
           onLoadSuccess={(numPages) => {
             console.log(`PDF 加载成功，共 ${numPages} 页`);
           }}
           onLoadError={(error) => {
             console.error('PDF 加载失败:', error);
           }}
        />
      </div>
    </div>
  );
};

export default PDFPreview;0