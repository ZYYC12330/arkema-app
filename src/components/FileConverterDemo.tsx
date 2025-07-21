import React, { useState } from 'react';
import { Button, Card, CardBody, Progress } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useLanguage } from '../contexts/LanguageContext';
import FileConverter from '../utils/fileConverter';
import PDFViewer from './PDFViewer';

const FileConverterDemo: React.FC = () => {
  const { t } = useLanguage();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [convertedPdfUrl, setConvertedPdfUrl] = useState<string | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setConvertedPdfUrl(null);
      setError(null);
    }
  };

  const handleConvert = async () => {
    if (!selectedFile) return;

    setIsConverting(true);
    setError(null);

    try {
      const fileUrl = URL.createObjectURL(selectedFile);
      const result = await FileConverter.convertToPdf(fileUrl, selectedFile.name);

      if (result.success && result.pdfUrl) {
        setConvertedPdfUrl(result.pdfUrl);
      } else {
        setError(result.error || '转换失败');
      }
    } catch (error) {
      setError(`转换过程中出错: ${error}`);
    } finally {
      setIsConverting(false);
    }
  };

  const getSupportedFileTypes = () => {
    return ['PDF', 'JPG', 'JPEG', 'PNG', 'XLS', 'XLSX'];
  };

  const getFileTypeIcon = (fileName: string) => {
    const extension = fileName.toLowerCase().split('.').pop();
    switch (extension) {
      case 'pdf':
        return 'lucide:file-text';
      case 'jpg':
      case 'jpeg':
      case 'png':
        return 'lucide:image';
      case 'xls':
      case 'xlsx':
        return 'lucide:file-spreadsheet';
      default:
        return 'lucide:file';
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-6">
      <Card className="mb-6">
        <CardBody className="p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-primary mb-4">
              <Icon icon="lucide:convert" className="inline mr-2" />
              文件转换为PDF演示
            </h1>
            
            <div className="mb-4">
              <p className="text-gray-600 mb-2">支持的文件类型：</p>
              <div className="flex flex-wrap gap-2">
                {getSupportedFileTypes().map((type) => (
                  <span
                    key={type}
                    className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                  >
                    {type}
                  </span>
                ))}
              </div>
            </div>

            {/* 文件选择 */}
            <div className="flex items-center gap-4 mb-4">
              <Button
                color="primary"
                onPress={() => document.getElementById('file-converter-input')?.click()}
                className="flex items-center gap-2"
              >
                <Icon icon="lucide:file-plus" />
                选择文件
              </Button>
              
              <input
                id="file-converter-input"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.xls,.xlsx"
                onChange={handleFileSelect}
                className="hidden"
                aria-label="选择要转换的文件"
              />
              
              {selectedFile && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Icon 
                    icon={getFileTypeIcon(selectedFile.name)} 
                    className="text-blue-500"
                  />
                  <span>已选择: {selectedFile.name}</span>
                </div>
              )}
            </div>

            {/* 转换按钮 */}
            {selectedFile && (
              <div className="mb-4">
                <Button
                  color="secondary"
                  onPress={handleConvert}
                  isDisabled={isConverting}
                  className="flex items-center gap-2"
                >
                  {isConverting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      转换中...
                    </>
                  ) : (
                    <>
                      <Icon icon="lucide:convert" />
                      转换为PDF
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* 进度指示 */}
            {isConverting && (
              <div className="mb-4">
                <Progress 
                  size="sm" 
                  isIndeterminate 
                  label="正在转换文件..." 
                  className="max-w-md"
                />
              </div>
            )}

            {/* 错误信息 */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2 text-red-700">
                  <Icon icon="lucide:alert-circle" />
                  <span>{error}</span>
                </div>
              </div>
            )}

            {/* 成功信息 */}
            {convertedPdfUrl && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 text-green-700">
                  <Icon icon="lucide:check-circle" />
                  <span>文件转换成功！PDF预览已准备就绪。</span>
                </div>
              </div>
            )}
          </div>
        </CardBody>
      </Card>

      {/* PDF预览 */}
      {convertedPdfUrl && (
        <div className="h-[600px]">
          <PDFViewer
            file={convertedPdfUrl}
            height="100%"
            onLoadSuccess={(numPages) => {
              console.log(`转换后的PDF加载成功，共 ${numPages} 页`);
            }}
            onLoadError={(error) => {
              console.error('PDF预览失败:', error);
            }}
          />
        </div>
      )}
    </div>
  );
};

export default FileConverterDemo; 