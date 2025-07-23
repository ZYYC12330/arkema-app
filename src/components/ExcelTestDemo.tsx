import React, { useState } from 'react';
import { Button, Card, CardBody, Select, SelectItem } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useLanguage } from '../contexts/LanguageContext';
import { getFileList } from '../config/files';
import FileConverter from '../utils/fileConverter';
import PDFViewer from './PDFViewer';

const ExcelTestDemo: React.FC = () => {
  const { t } = useLanguage();
  const [selectedFile, setSelectedFile] = useState<string>('');
  const [convertedPdfUrl, setConvertedPdfUrl] = useState<string | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 获取Excel文件列表
  const excelFiles = getFileList().filter(file => 
    file.type === 'xls' || file.type === 'xlsx'
  );

  const handleFileSelect = (fileId: string) => {
    setSelectedFile(fileId);
    setConvertedPdfUrl(null);
    setError(null);
  };

  const handleConvert = async () => {
    if (!selectedFile) return;

    const fileInfo = getFileList().find(f => f.id === selectedFile);
    if (!fileInfo) return;

    setIsConverting(true);
    setError(null);

    try {
      console.log('开始转换Excel文件:', fileInfo.name);
      const result = await FileConverter.convertToPdf(fileInfo.url, fileInfo.name);

      if (result.success && result.pdfUrl) {
        setConvertedPdfUrl(result.pdfUrl);
        console.log('Excel转换成功:', result.pdfUrl);
      } else {
        setError(result.error || '转换失败');
        console.error('Excel转换失败:', result.error);
      }
    } catch (error) {
      const errorMsg = `转换过程中出错: ${error}`;
      setError(errorMsg);
      console.error('Excel转换异常:', error);
    } finally {
      setIsConverting(false);
    }
  };

  const getSelectedFileInfo = () => {
    return getFileList().find(f => f.id === selectedFile);
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-6">
      <Card className="mb-6">
        <CardBody className="p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-primary mb-4">
              <Icon icon="lucide:file-spreadsheet" className="inline mr-2" />
              Excel文件中文显示测试
            </h1>
            
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-semibold text-blue-800 mb-2">测试说明：</h3>
              <ul className="text-blue-700 text-sm space-y-1">
                <li>• 本测试专门验证Excel文件转PDF后中文字符的显示效果</li>
                <li>• 系统会自动处理中文编码，避免乱码问题</li>
                <li>• 支持XLS和XLSX格式文件</li>
                <li>• 转换后的PDF保持原有表格结构</li>
              </ul>
            </div>

            {/* Excel文件选择 */}
            <div className="mb-4">
              <label id="excel-select-label" className="block text-sm font-medium text-gray-700 mb-2">
                选择Excel文件进行测试：
              </label>
              <Select
                placeholder="请选择一个Excel文件"
                selectedKeys={selectedFile ? [selectedFile] : []}
                onSelectionChange={(keys) => {
                  const selected = Array.from(keys)[0] as string;
                  handleFileSelect(selected);
                }}
                className="max-w-md"
                aria-labelledby="excel-select-label"
                aria-label="选择Excel文件进行测试"
              >
                {excelFiles.map((file) => (
                  <SelectItem key={file.id} value={file.id}>
                    <div className="flex items-center gap-2">
                      <Icon 
                        icon={file.type === 'xlsx' ? 'lucide:file-spreadsheet' : 'lucide:file-text'} 
                        className="text-green-600"
                      />
                      <div>
                        <div className="font-medium">{file.name}</div>
                        <div className="text-xs text-gray-500">{file.description}</div>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </Select>
            </div>

            {/* 选中文件信息 */}
            {selectedFile && getSelectedFileInfo() && (
              <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <Icon icon="lucide:info" className="text-blue-500" />
                  <div>
                    <p className="font-medium">已选择文件：{getSelectedFileInfo()?.name}</p>
                    <p className="text-sm text-gray-600">{getSelectedFileInfo()?.description}</p>
                    <p className="text-xs text-gray-500">类型：{getSelectedFileInfo()?.type.toUpperCase()}</p>
                  </div>
                </div>
              </div>
            )}

            {/* 转换按钮 */}
            {selectedFile && (
              <div className="mb-4">
                <Button
                  color="primary"
                  size="lg"
                  onPress={handleConvert}
                  isDisabled={isConverting}
                  className="flex items-center gap-2"
                >
                  {isConverting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      正在转换中文Excel...
                    </>
                  ) : (
                    <>
                      <Icon icon="lucide:convert" />
                      转换为PDF并测试中文显示
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* 转换状态 */}
            {isConverting && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center gap-2 text-yellow-700">
                  <Icon icon="lucide:loader" className="animate-spin" />
                  <span>正在处理Excel文件中的中文字符，请稍候...</span>
                </div>
              </div>
            )}

            {/* 错误信息 */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2 text-red-700">
                  <Icon icon="lucide:alert-circle" />
                  <div>
                    <p className="font-medium">转换失败</p>
                    <p className="text-sm">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* 成功信息 */}
            {convertedPdfUrl && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 text-green-700">
                  <Icon icon="lucide:check-circle" />
                  <div>
                    <p className="font-medium">转换成功！</p>
                    <p className="text-sm">Excel文件已成功转换为PDF，中文字符应该正常显示。</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardBody>
      </Card>

      {/* PDF预览 */}
      {convertedPdfUrl && (
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Icon icon="lucide:eye" />
            PDF预览 - 检查中文字符显示
          </h2>
          <div className="h-[600px] border-2 border-dashed border-gray-300 rounded-lg">
            <PDFViewer
              file={convertedPdfUrl}
              height="100%"
              onLoadSuccess={(numPages) => {
                console.log(`Excel转PDF成功，共 ${numPages} 页`);
              }}
              onLoadError={(error) => {
                console.error('PDF预览失败:', error);
              }}
            />
          </div>
        </div>
      )}

      {/* 使用说明 */}
      <Card>
        <CardBody className="p-4">
          <h3 className="font-semibold text-gray-800 mb-2">检查要点：</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>✓ 中文字符是否正常显示（不是乱码或方块）</li>
            <li>✓ 表格结构是否保持完整</li>
            <li>✓ 数据内容是否完整无缺失</li>
            <li>✓ 页面布局是否合理</li>
          </ul>
        </CardBody>
      </Card>
    </div>
  );
};

export default ExcelTestDemo; 