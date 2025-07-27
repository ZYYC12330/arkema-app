import React from 'react';
import { Card, CardBody, Button, Chip } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useLanguage } from '../contexts/LanguageContext';
import PDFViewer from './PDFViewer';

interface PDFPreviewProps {
  uploadedFile: File | null;
  fileUrl: string | null;
  highlightText?: string; // 新增高亮文本属性
}

const PDFPreview: React.FC<PDFPreviewProps> = ({ uploadedFile, fileUrl, highlightText }) => {
  const fileToPreview = uploadedFile || fileUrl;

  if (!fileToPreview) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-100 rounded-md">
        <p className="text-gray-500">没有可预览的文件</p>
      </div>
    );
  }
  
  return (
    <div className="flex-1">
      <PDFViewer 
        file={fileToPreview} 
        height="calc(100vh - 120px)" 
        highlightText={highlightText} // 传递高亮文本
      />
    </div>
  );
};

export default PDFPreview;