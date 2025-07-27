/**
 * @file App.tsx
 * @description 应用的主组件，负责整体布局、状态管理和组件协调。
 */

import React from 'react';
import { Navbar, NavbarBrand, NavbarContent, Button } from "@heroui/react";
import { Icon } from "@iconify/react";
import Sidebar from './components/Sidebar';
import PDFPreview from './components/PDFPreview';
import FileUpload from './components/FileUpload';
import MultiFileUpload from './components/MultiFileUpload';
import SuccessModal from './components/SuccessModal';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { useFileList } from './utils/useFileList';
import { useOrder } from './utils/useOrder';
import { OrderProcessingPhase, OrderStatus } from './types';

/**
 * AppContent 组件
 * 
 * @description 应用的主要内容区域，包含所有核心逻辑和 UI 渲染。
 * 使用自定义 Hooks (useFileList, useOrder) 来管理状态和副作用。
 */
const AppContent: React.FC = () => {
  const { language, setLanguage, t } = useLanguage();
  
  // 文件处理 Hook
  const {
    fileList,
    isLoadingFiles,
    fileListError,
    currentFileIndex,
    currentFileUrl,
    uploadedFile,
    showPDFPreview,
    handleFileUploaded: originalHandleFileUploaded,
    handleFileUploadError,
    handleFileSelect: originalHandleFileSelect,
    setCurrentFileIndex,
    setShowPDFPreview,
    setUploadedFile,
  } = useFileList();

  // 订单处理 Hook
  const {
    currentPhase,
    orderStatus,
    basicOrderInfo,
    extendedOrderInfo,
    isLoading,
    isGeneratingCodes,
    isSubmittingOrder,
    error,
    fetchBasicOrderInfo,
    handleGenerateExtendedInfo,
    handleSubmitOrder,
    handleBackToBasicInfo,
    handleBasicOrderUpdate,
    handleExtendedOrderUpdate,
    resetOrderInfo,
    loadSavedOrder,
    setOrderStatus,
    setCurrentPhase
  } = useOrder(fileList[currentFileIndex]?.name || null);

  // UI 状态
  const [showSuccessModal, setShowSuccessModal] = React.useState(false);
  const [internalError, setInternalError] = React.useState<string | null>(null);
  const [uploadMode, setUploadMode] = React.useState<'single' | 'multi'>('single');

  /**
   * 生成用于高亮的文本
   * @returns 包含所有订单信息字段值的字符串
   */
  const getHighlightText = () => {
    const allValues = [
      ...Object.values(basicOrderInfo),
      ...Object.values(extendedOrderInfo),
    ];
    return allValues.filter(v => v).join(' '); // 过滤掉空值并用空格连接
  };

  /**
   * 处理文件上传完成的回调
   * @param file 上传的文件对象
   * @param fileInfo 包含文件 ID 和 URL 的对象
   */
  const handleFileUploaded = (file: File, fileInfo: { fileId: string; url: string; publicUrl?: string }) => {
    // 更新文件列表和相关状态
    originalHandleFileUploaded(file, fileInfo);
    
    // 只有在单文件模式或者当前没有选中文件时才自动处理
    if (uploadMode === 'single' || currentFileIndex === -1) {
      // 重置订单状态，确保新文件从基本信息阶段开始
      resetOrderInfo();
      
      // 开始提取新文件的基本信息
      if (fileInfo.publicUrl) {
        fetchBasicOrderInfo(fileInfo.publicUrl, file.name, false);
      }
    }
    
    // 在多文件模式下，显示提示信息
    if (uploadMode === 'multi' && currentFileIndex !== -1) {
      // 可以在这里添加Toast通知或其他用户友好的提示
      console.log(`${t.fileUploaded}: ${file.name}`);
    }
  };

  /**
   * 处理文件选择的回调
   * @param fileName 选择的文件名
   */
  const handleFileSelect = async (fileName: string) => {
    await originalHandleFileSelect(fileName, {
      onSuccess: (fileId, name, keepSubmitted) => {
        // 如果不需要保持提交状态，则重置订单信息
        if (!keepSubmitted) {
          resetOrderInfo();
        }
        fetchBasicOrderInfo(fileId, name, keepSubmitted);
      },
      onLoadSaved: (phase, status) => {
        // 加载已保存的订单状态和数据
        loadSavedOrder(fileName);
        setCurrentPhase(phase as OrderProcessingPhase);
        setOrderStatus(status as OrderStatus);
      },
      onReset: () => {
        resetOrderInfo();
      }
    });
  };

  /**
   * 提交订单并显示成功弹窗
   */
  const submitAndShowSuccess = async () => {
    const success = await handleSubmitOrder(currentFileUrl || '', fileList[currentFileIndex]?.name || '');
    if (success) {
      setShowSuccessModal(true);
    }
  };

  /**
   * 处理成功弹窗关闭的回调
   */
  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    const nextIndex = currentFileIndex + 1;
    
    if (nextIndex < fileList.length) {
      handleFileSelect(fileList[nextIndex].name);
    } else {
      alert(t.allFilesCompleted);
      setCurrentFileIndex(-1);
      setShowPDFPreview(false);
      setUploadedFile(null);
      resetOrderInfo();
    }
  };

  /**
   * 切换语言
   */
  const toggleLanguage = () => {
    setLanguage(language === 'zh' ? 'en' : 'zh');
  };

  const displayError = fileListError || error || internalError;

  // UI 渲染
  if (isLoadingFiles) {
    return (
      <div className="flex flex-col h-screen bg-gray-100">
        <Navbar className="border-b">
          <NavbarBrand>
            <Icon icon="lucide:file-text" className="text-2xl text-primary" />
            <p className="font-bold text-inherit ml-2">{t.appTitle}</p>
          </NavbarBrand>
        </Navbar>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600">正在加载文件列表...</p>
          </div>
        </div>
      </div>
    );
  }

  if (fileListError) {
    return (
      <div className="flex flex-col h-screen bg-gray-100">
        <Navbar className="border-b">
          <NavbarBrand>
            <Icon icon="lucide:file-text" className="text-2xl text-primary" />
            <p className="font-bold text-inherit ml-2">{t.appTitle}</p>
          </NavbarBrand>
        </Navbar>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Icon icon="lucide:alert-circle" className="text-4xl text-red-500 mx-auto mb-4" />
            <p className="text-red-600 mb-4">{fileListError}</p>
            <Button 
              color="primary" 
              onPress={() => window.location.reload()}
              className="flex items-center gap-2"
            >
              <Icon icon="lucide:refresh-cw" />
              重新加载
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* 导航栏 */}
      <Navbar isBordered className="border-b-1 bg-primary text-white">
        <NavbarBrand>
          <Icon icon="lucide:file-text" className="text-2xl mr-2 ml-4" />
          <p className="font-bold text-inherit">{t.appTitle}</p>
        </NavbarBrand>
        <NavbarContent justify="end" className="pr-4">
          <Button
            size="sm"
            color={uploadMode === 'multi' ? 'success' : 'default'}
            variant="flat"
            onPress={() => setUploadMode(uploadMode === 'single' ? 'multi' : 'single')}
            className="mr-2 flex items-center gap-1"
          >
            <Icon icon={uploadMode === 'multi' ? "lucide:files" : "lucide:file"} className="text-sm" />
            <span>{uploadMode === 'multi' ? t.multiFileMode : t.singleFileMode}</span>
          </Button>
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
        {/* 侧边栏 */}
        <Sidebar
          basicOrderInfo={basicOrderInfo}
          onBasicOrderUpdate={handleBasicOrderUpdate}
          extendedOrderInfo={extendedOrderInfo}
          onExtendedOrderUpdate={handleExtendedOrderUpdate}
          currentPhase={currentPhase}
          fileList={fileList.map(file => file.name)}
          currentFile={fileList[currentFileIndex]?.name || ''}
          onFileSelect={handleFileSelect}
          orderStatus={orderStatus}
          onGenerateExtendedInfo={handleGenerateExtendedInfo}
          onSubmitOrder={submitAndShowSuccess}
          onBackToBasicInfo={handleBackToBasicInfo}
          currentFileIndex={currentFileIndex}
          totalFiles={fileList.length}
          showPDFPreview={showPDFPreview}
          onToggleView={() => setShowPDFPreview(!showPDFPreview)}
          canToggleView={fileList.length > 0}
          isLoading={isLoading}
          isGeneratingCodes={isGeneratingCodes}
          isSubmittingOrder={isSubmittingOrder}
        />

          {/* 主视图 */}
          {fileList.length === 0 || !currentFileUrl || !showPDFPreview ? (
            uploadMode === 'multi' ? (
              <MultiFileUpload 
                onFileUploaded={handleFileUploaded} 
                onError={handleFileUploadError}
                showQueue={true}
                queuePosition="side"
              />
            ) : (
              <FileUpload onFileUploaded={handleFileUploaded} onError={handleFileUploadError} />
            )
          ) : (
            <PDFPreview 
              uploadedFile={uploadedFile} 
              fileUrl={currentFileUrl}
              highlightText={getHighlightText()} // 传递高亮文本
            />
          )}
      </div>

      {/* 成功弹窗 */}
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={handleSuccessModalClose}
        fileName={fileList[currentFileIndex]?.name || ''}
      />
      
      {/* 错误提示 */}
      {displayError && (
        <div className="fixed bottom-4 right-4 bg-red-500 text-white p-4 rounded-lg shadow-lg z-50 max-w-md">
          <div className="flex items-center gap-2">
            <Icon icon="lucide:alert-circle" className="text-lg" />
            <span className="flex-1">{displayError}</span>
            <Button
              size="sm"
              variant="flat"
              color="default"
              onPress={() => setInternalError(null)}
              className="text-white hover:bg-red-600"
            >
              <Icon icon="lucide:x" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * 应用的根组件
 * 
 * @description 负责提供语言上下文 (LanguageProvider)。
 */
const App: React.FC = () => {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
};

export default App;