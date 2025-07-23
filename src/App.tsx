import React from 'react';
import { Navbar, NavbarBrand, NavbarContent, Button } from "@heroui/react";
import { Icon } from "@iconify/react";
import Sidebar from './components/Sidebar';
import PDFPreview from './components/PDFPreview';
import FileUpload from './components/FileUpload';
import SuccessModal from './components/SuccessModal';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { OrderInfo } from './types';
import { getFileList, getFileByName, FileInfo } from './config/files';

const AppContent: React.FC = () => {
  const { language, setLanguage, t } = useLanguage();
  
  // 获取PDF文件列表
  const [fileList] = React.useState<FileInfo[]>(() => {
    try {
      const files = getFileList();
      console.log('获取到的文件列表:', files);
      return files;
    } catch (error) {
      console.error('获取文件列表失败:', error);
      return []; // 返回空数组，避免应用崩溃
    }
  });

  const [currentFileIndex, setCurrentFileIndex] = React.useState(0);
  const [showSuccessModal, setShowSuccessModal] = React.useState(false);
  
  const [orderInfo, setOrderInfo] = React.useState<OrderInfo>({
    id: '1',
    soldToName: 'Henkel Adhesives Technologies IN Pvt.Ltd.',
    soldToAddress: 'L&TSeawoods,GrandCent.,401- BWing,4thFlr,Twr1, Seawoods,Mumbai-40o706,Maharashtra,India',
    shipToName: 'HAT G-III Kurkumbh Mfg Site Henkel Adhesives Technologies',
    shipToAddress: 'Kurkumbh, MIDC Daund 413802 Pune',
    vendorName: 'Arkema Company Limited',
    vendorAddress: 'Unit 4112-4116, Level 41, Tower 1, Metroplaza 233 Hing Fong Road Kwai Fong 19341 HONG KONG HONG KONG',
    poNumber: '4593133614',
    poDate: '2025-02-07',
    deliveryDate: '2025-05-20',
    itemNumber: '',
    itemName: '',
    itemQuantity: '720.000',
    unitOfMeasure: 'Kilogram',
    unitPrice: '12.50 USD',
    // 新增字段默认值
    arkemaSoldToCode: '',
    arkemaShipToCode: '',
    vendorSalesArea: '',
    deliveryByDate: '',
    lineNumber: '',
    arkemaProductCode: '',
  });

  const [currentFileUrl, setCurrentFileUrl] = React.useState<string | null>(null);
  const [showPDFPreview, setShowPDFPreview] = React.useState(false);

  const handleOrderUpdate = (field: keyof OrderInfo, value: string) => {
    setOrderInfo(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUploaded = (file: File, fileInfo?: { fileId?: string; url?: string }) => {
    // 优先使用服务器返回的URL，如果没有则创建本地URL
    const fileUrl = fileInfo?.url || URL.createObjectURL(file);
    setCurrentFileUrl(fileUrl);
    setShowPDFPreview(true);
    
    // 这里可以添加文件解析逻辑，提取订单信息
    console.log('文件上传成功:', file.name);
    if (fileInfo?.fileId) {
      console.log('服务器文件ID:', fileInfo.fileId);
    }
    if (fileInfo?.url) {
      console.log('服务器文件URL:', fileInfo.url);
    }
  };

  const handleFileSelect = (fileName: string) => {
    const fileInfo = getFileByName(fileName);
    if (fileInfo) {
      const index = fileList.findIndex(file => file.name === fileName);
      if (index !== -1) {
        setCurrentFileIndex(index);
        // 使用真实的文件URL
        setCurrentFileUrl(fileInfo.url);
        setShowPDFPreview(true);
        console.log('选择文件:', fileInfo.name, '-> URL:', fileInfo.url);
      }
    }
  };

  const handleSubmit = () => {
    // 显示成功弹窗
    setShowSuccessModal(true);
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    // 自动跳转到下一个文件
    if (currentFileIndex < fileList.length - 1) {
      setCurrentFileIndex(prev => prev + 1);
      const nextFile = fileList[currentFileIndex + 1];
      setCurrentFileUrl(nextFile.url);
    } else {
      // 所有文件处理完成
      alert(t.allFilesCompleted);
    }
  };

  const toggleLanguage = () => {
    setLanguage(language === 'zh' ? 'en' : 'zh');
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      <Navbar isBordered className="border-b-1 bg-primary text-white">
        <NavbarBrand>
          <Icon icon="lucide:file-text" className="text-2xl mr-2 ml-4" />
          <p className="font-bold text-inherit">{t.appTitle}</p>
        </NavbarBrand>
        <NavbarContent justify="end" className="pr-4">
          <Button
            size="sm"
            color="secondary"
            variant="flat"
            onPress={toggleLanguage}
            className="mr-2 flex items-center gap-1"
          >
            <Icon icon="lucide:globe" className="text-sm" />
            <span>{language === 'zh' ? 'EN' : '中文'}</span>
          </Button>
        </NavbarContent>
      </Navbar>
      <div className="flex flex-1 overflow-hidden p-4">
          <Sidebar 
            orderInfo={orderInfo} 
            onOrderUpdate={handleOrderUpdate}
            fileList={fileList.map(file => file.name)}
            currentFile={fileList[currentFileIndex]?.name || ''}
            onFileSelect={handleFileSelect}
            onSubmit={handleSubmit}
            currentFileIndex={currentFileIndex}
            totalFiles={fileList.length}
            showPDFPreview={showPDFPreview}
            onToggleView={() => setShowPDFPreview(!showPDFPreview)}
            canToggleView={fileList.length > 0}
          />
        {fileList.length === 0 ? (
          <FileUpload onFileUploaded={handleFileUploaded} />
        ) : showPDFPreview ? (
          <PDFPreview fileUrl={currentFileUrl} />
        ) : (
          <FileUpload onFileUploaded={handleFileUploaded} />
        )}
      </div>
      
      <SuccessModal 
        isOpen={showSuccessModal} 
        onClose={handleSuccessModalClose}
        fileName={fileList[currentFileIndex]?.name || ''}
      />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
};

export default App;