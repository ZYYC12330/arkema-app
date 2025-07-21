import React from 'react';
import { Card, CardBody, Button, Chip } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useLanguage } from '../contexts/LanguageContext';
import PDFViewer from './PDFViewer';

interface PDFPreviewProps {
  uploadedFile?: File | null;
}

const PDFPreview: React.FC<PDFPreviewProps> = ({ uploadedFile }) => {
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
      {/* 顶部工具栏 */}
      <Card className="mb-4 rounded-md shadow-md bg-white">
        <CardBody className="p-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-primary flex items-center">
              <Icon icon="lucide:file-text" className="mr-2" />
              {t.pdfPreview}
            </h2>
            <div className="flex space-x-2">
              <Button 
                size="sm" 
                color="primary" 
                variant="flat" 
                className="flex items-center gap-1"
                onPress={handleDownload}
                isDisabled={!uploadedFile}
                aria-label="下载当前文档"
              >
                <Icon icon="lucide:download" className="text-sm" />
                <span>{t.download}</span>
              </Button>
            </div>
          </div>

          {uploadedFile && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Icon icon="lucide:file" className="text-primary mr-2" />
                  <div>
                    <p className="font-medium text-gray-900">{uploadedFile.name}</p>
                    <p className="text-sm text-gray-500">{formatFileSize(uploadedFile.size)}</p>
                  </div>
                </div>
                <Chip color="success" variant="flat">
                  {t.uploadSuccess}
                </Chip>
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      {/* PDF 查看器 */}
      <div className="flex-1">
        <PDFViewer 
          file={uploadedFile}
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

export default PDFPreview;