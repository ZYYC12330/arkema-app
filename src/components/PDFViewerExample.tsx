import React, { useState } from 'react';
import { Button, Card, CardBody } from "@heroui/react";
import { Icon } from "@iconify/react";
import PDFViewer from './PDFViewer';

const PDFViewerExample: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
    } else {
      alert('请选择 PDF 文件');
    }
  };

  return (
    <Card className="w-full max-w-6xl mx-auto">
      <CardBody className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-primary mb-4">PDF 查看器示例</h1>
          
          {/* 文件选择按钮 */}
          <div className="flex items-center gap-4">
            <Button
              color="primary"
              onPress={() => document.getElementById('pdf-file-input')?.click()}
              className="flex items-center gap-2"
            >
              <Icon icon="lucide:file-plus" />
              选择 PDF 文件
            </Button>
            
            <input
              id="pdf-file-input"
              type="file"
              accept=".pdf"
              onChange={handleFileSelect}
              className="hidden"
              aria-label="选择 PDF 文件"
            />
            
            {selectedFile && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Icon icon="lucide:file-check" className="text-green-500" />
                <span>已选择: {selectedFile.name}</span>
              </div>
            )}
          </div>
        </div>

        {/* PDF 查看器 */}
        <div className="h-[600px]">
          <PDFViewer
            file={selectedFile}
            height="100%"
            onLoadSuccess={(numPages) => {
              console.log(`PDF 加载成功，共 ${numPages} 页`);
            }}
            onLoadError={(error) => {
              console.error('PDF 加载失败:', error);
              alert(`PDF 加载失败: ${error.message}`);
            }}
          />
        </div>
      </CardBody>
    </Card>
  );
};

export default PDFViewerExample; 