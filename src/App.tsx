import React from 'react';
import { Navbar, NavbarBrand, NavbarContent, Button } from "@heroui/react";
import { Icon } from "@iconify/react";
import Sidebar from './components/Sidebar';
import PDFPreview from './components/PDFPreview';
import FileUpload from './components/FileUpload';
import SuccessModal from './components/SuccessModal';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { BasicOrderInfo, ExtendedOrderInfo, CompleteOrderInfo, OrderProcessingPhase, OrderStatus } from './types';
import { getFileList, getFileByName, FileInfo } from './config/files';
import { OrderService } from './utils/orderService';

const API_TOKEN = 'sk-zzvwbcaxoss3';

/**
 * 根据文件名推断文件类型
 */
const getFileTypeFromFileName = (fileName: string): FileInfo['type'] => {
  const extension = (fileName.split('.').pop() || '').toLowerCase();
  switch (extension) {
    case 'pdf': return 'pdf';
    case 'jpg': return 'jpeg';
    case 'jpeg': return 'jpeg';
    case 'png': return 'png';
    case 'xls': return 'xls';
    case 'xlsx': return 'xlsx';
    case 'doc': return 'doc';
    case 'docx': return 'docx';
    default: return 'pdf';
  }
};

const AppContent: React.FC = () => {
  const { language, setLanguage, t } = useLanguage();
  
  // 文件列表状态
  const [fileList, setFileList] = React.useState<FileInfo[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = React.useState(true);
  const [fileListError, setFileListError] = React.useState<string | null>(null);
  const [currentFileIndex, setCurrentFileIndex] = React.useState(-1);
  const [currentFileUrl, setCurrentFileUrl] = React.useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = React.useState<File | null>(null);
  const [showPDFPreview, setShowPDFPreview] = React.useState(false);

  // 订单处理状态
  const [currentPhase, setCurrentPhase] = React.useState<OrderProcessingPhase>('basic_info');
  const [orderStatus, setOrderStatus] = React.useState<OrderStatus | null>(null);

  // 基本订单信息
  const initialBasicOrderInfo: BasicOrderInfo = {
    id: '',
    soldToName: '',
    soldToAddress: '',
    shipToName: '',
    shipToAddress: '',
    vendorName: '',
    vendorAddress: '',
    poNumber: '',
    poDate: '',
    deliveryDate: '',
    itemNumber: '',
    itemName: '',
    itemQuantity: '',
    unitOfMeasure: '',
    unitPrice: '',
  };
  const [basicOrderInfo, setBasicOrderInfo] = React.useState<BasicOrderInfo>(initialBasicOrderInfo);

  // 扩展订单信息
  const initialExtendedOrderInfo: ExtendedOrderInfo = {
    arkemaSoldToCode: '',
    arkemaShipToCode: '',
    vendorSalesArea: '',
    deliveryByDate: '',
    lineNumber: '',
    arkemaProductCode: '',
  };
  const [extendedOrderInfo, setExtendedOrderInfo] = React.useState<ExtendedOrderInfo>(initialExtendedOrderInfo);

  // 加载状态
  const [isLoading, setIsLoading] = React.useState(false);
  const [isGeneratingCodes, setIsGeneratingCodes] = React.useState(false);
  const [isSubmittingOrder, setIsSubmittingOrder] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = React.useState(false);

  // 动态获取文件列表
  React.useEffect(() => {
    const loadFileList = async () => {
      try {
        setIsLoadingFiles(true);
        setFileListError(null);
        
        const files = await getFileList();
        console.log('动态获取到的文件列表:', files);
        setFileList(files);

      } catch (error) {
        console.error('获取文件列表失败:', error);
        setFileListError('获取文件列表失败，请检查网络连接');
      } finally {
        setIsLoadingFiles(false);
      }
    };

    loadFileList();
  }, []);

  // 重置订单信息
  const resetOrderInfo = () => {
    setBasicOrderInfo(initialBasicOrderInfo);
    setExtendedOrderInfo(initialExtendedOrderInfo);
    setCurrentPhase('basic_info');
    setOrderStatus(null);
    setError(null);
  };

  // 提取基本订单信息
  const fetchBasicOrderInfo = async (fileId: string, fileName: string) => {
    if (!fileId) return;

    setIsLoading(true);
    setError(null);
    resetOrderInfo();

    try {
      const basicInfo = await OrderService.extractBasicOrderInfo(fileId, fileName);
      console.log('📋 获取到的基本订单信息:', basicInfo);
      setBasicOrderInfo(basicInfo);
      
      // 更新订单状态
      const status: OrderStatus = {
        fileName,
        phase: 'basic_info',
        isSubmitted: false,
        lastModified: new Date().toISOString()
      };
      setOrderStatus(status);
      OrderService.updateOrderStatus(fileName, 'basic_info', false);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      console.error("获取订单信息时出错:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // 生成扩展信息（内部编号）
  const handleGenerateExtendedInfo = async () => {
    if (!basicOrderInfo.poNumber) {
      setError('请先完善基本订单信息');
      return;
    }

    setIsGeneratingCodes(true);
    setError(null);

    try {
      const extendedInfo = await OrderService.generateExtendedInfo(basicOrderInfo);
      setExtendedOrderInfo(extendedInfo);
      setCurrentPhase('extended_info');
      
      // 更新订单状态
      const currentFileName = fileList[currentFileIndex]?.name || '';
      const status: OrderStatus = {
        fileName: currentFileName,
        phase: 'extended_info',
        isSubmitted: false,
        lastModified: new Date().toISOString()
      };
      setOrderStatus(status);
      OrderService.updateOrderStatus(currentFileName, 'extended_info', false);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : '生成内部编号失败');
      console.error("生成扩展信息时出错:", err);
    } finally {
      setIsGeneratingCodes(false);
    }
  };

  // 提交订单
  const handleSubmitOrder = async () => {
    console.log('🚀 开始提交订单流程...');
    console.log('📅 提交时间:', new Date().toISOString());
    
    // 1. 验证前置条件
    const currentFileName = fileList[currentFileIndex]?.name || '';
    console.log('📋 验证前置条件:', {
      currentFileName,
      hasPoNumber: !!basicOrderInfo.poNumber,
      currentFileIndex,
      totalFiles: fileList.length
    });
    
    if (!currentFileName || !basicOrderInfo.poNumber) {
      console.error('❌ 前置条件验证失败:', {
        missingFileName: !currentFileName,
        missingPoNumber: !basicOrderInfo.poNumber
      });
      setError('请确保已选择文件并完善订单信息');
      return;
    }
    
    console.log('✅ 前置条件验证通过');

    // 2. 设置加载状态
    console.log('⏳ 设置加载状态...');
    setIsSubmittingOrder(true);
    setError(null);

    try {
      // 3. 构建完整订单信息
      console.log('🔧 构建完整订单信息...');
      const completeOrderInfo: CompleteOrderInfo = {
        ...basicOrderInfo,
        ...extendedOrderInfo,
        phase: 'submitted',
        isSubmitted: true,
        fileUrl: currentFileUrl || ''
      };
      
      console.log('📦 完整订单信息:', {
        fileName: currentFileName,
        poNumber: completeOrderInfo.poNumber,
        soldToName: completeOrderInfo.soldToName,
        shipToName: completeOrderInfo.shipToName,
        vendorName: completeOrderInfo.vendorName,
        arkemaSoldToCode: completeOrderInfo.arkemaSoldToCode,
        arkemaShipToCode: completeOrderInfo.arkemaShipToCode,
        arkemaProductCode: completeOrderInfo.arkemaProductCode,
        fileUrl: completeOrderInfo.fileUrl
      });

      // 4. 调用提交API
      console.log('🌐 发起API请求...');
      console.log('📡 API端点:', `https://demo.langcore.cn/api/workflow/run/cmdczxv6f0msbmwb70fatc941`);
      console.log('⏰ API请求发起时间:', new Date().toISOString());
      
      const result = await OrderService.submitOrder(completeOrderInfo);
      
      console.log('📥 API响应结果:', result);
      console.log('⏰ API响应时间:', new Date().toISOString());
      
      if (result.success) {
        console.log('✅ API调用成功');
        
        // 5. 更新应用状态
        console.log('🔄 更新应用状态为已提交...');
        setCurrentPhase('submitted');
        
        // 6. 更新订单状态
        console.log('💾 更新订单状态...');
        const status: OrderStatus = {
          fileName: currentFileName,
          phase: 'submitted',
          isSubmitted: true,
          submittedAt: new Date().toISOString(),
          lastModified: new Date().toISOString()
        };
        setOrderStatus(status);
        
        // 更新本地存储中的订单状态
        OrderService.updateOrderStatus(currentFileName, 'submitted', true);
        
        // 7. 显示成功弹窗
        console.log('🎉 显示成功弹窗...');
        setShowSuccessModal(true);
        
        console.log('✅ 订单提交流程完成');
      } else {
        console.error('❌ API调用失败:', result.message);
        throw new Error(result.message || '提交订单失败');
      }
      
    } catch (err) {
      // 8. 错误处理
      console.error('💥 提交订单过程中发生错误:', err);
      console.error('🔍 错误详情:', {
        errorType: err instanceof Error ? err.constructor.name : typeof err,
        errorMessage: err instanceof Error ? err.message : String(err),
        errorStack: err instanceof Error ? err.stack : undefined
      });
      setError(err instanceof Error ? err.message : '提交订单失败');
    } finally {
      // 9. 重置加载状态
      console.log('🔄 重置加载状态...');
      setIsSubmittingOrder(false);
      console.log('🏁 提交订单流程结束');
    }
  };

  // 返回基本信息编辑
  const handleBackToBasicInfo = () => {
    setCurrentPhase('basic_info');
    const currentFileName = fileList[currentFileIndex]?.name || '';
    if (currentFileName) {
      const status: OrderStatus = {
        fileName: currentFileName,
        phase: 'basic_info',
        isSubmitted: false,
        lastModified: new Date().toISOString()
      };
      setOrderStatus(status);
      OrderService.updateOrderStatus(currentFileName, 'basic_info', false);
    }
  };

  // 处理基本信息更新
  const handleBasicOrderUpdate = (field: keyof BasicOrderInfo, value: string) => {
    setBasicOrderInfo(prev => ({ ...prev, [field]: value }));
  };

  // 处理扩展信息更新
  const handleExtendedOrderUpdate = (field: keyof ExtendedOrderInfo, value: string) => {
    setExtendedOrderInfo(prev => ({ ...prev, [field]: value }));
  };

  // 处理文件上传
  const handleFileUploaded = (file: File, fileInfo: { fileId: string; url: string; publicUrl?: string }) => {
    console.log('📤 文件上传完成:', { 
      fileName: file.name, 
      fileId: fileInfo.fileId, 
      publicUrl: fileInfo.publicUrl 
    });

    const newFileInfo: FileInfo = {
      id: fileInfo.fileId,
      name: file.name,
      url: fileInfo.url,
      type: getFileTypeFromFileName(file.name),
      size: file.size,
      description: `Uploaded at ${new Date().toLocaleTimeString()}`
    };

    // 更新文件列表
    setFileList(prevList => {
      const existingFileIndex = prevList.findIndex(f => f.name === newFileInfo.name);

      if (existingFileIndex !== -1) {
        const newList = [...prevList];
        newList[existingFileIndex] = newFileInfo;
        setCurrentFileIndex(existingFileIndex);
        return newList;
      } else {
        const newList = [...prevList, newFileInfo];
        setCurrentFileIndex(newList.length - 1);
        return newList;
      }
    });
    
    setCurrentFileUrl(newFileInfo.url);
    setUploadedFile(file);
    setShowPDFPreview(true);
    
    // 如果有公网URL，获取基本订单信息
    if (fileInfo.publicUrl) {
      console.log('🔍 开始处理新上传文件的订单信息:', file.name);
      fetchBasicOrderInfo(fileInfo.publicUrl, file.name);
    }
    
    console.log(`文件 ${file.name} 已上传并添加到列表。`);
  };

  // 处理文件上传错误
  const handleFileUploadError = (error: string) => {
    setError(error);
  };

  // 处理文件选择
  const handleFileSelect = async (fileName: string) => {
    console.log('📂 选择文件:', fileName);
    
    try {
      // 检查订单状态
      const savedStatus = OrderService.getOrderStatus(fileName);
      
      const fileInfo = await getFileByName(fileName);
      if (fileInfo) {
        const index = fileList.findIndex(file => file.name === fileName);
        if (index !== -1) {
          setCurrentFileIndex(index);
          setCurrentFileUrl(fileInfo.url);
          setUploadedFile(null);
          setShowPDFPreview(true);
          
          // 如果已有保存的状态，恢复状态
          if (savedStatus?.isSubmitted) {
            console.log('📋 订单已提交，恢复保存的状态:', fileName);
            setCurrentPhase('submitted');
            setOrderStatus(savedStatus);
            // TODO: 从本地存储或API加载完整的订单信息
            console.log('订单已提交，应该加载保存的订单信息');
          } else if (savedStatus?.phase === 'extended_info') {
            console.log('📋 订单在扩展信息阶段，恢复保存的状态:', fileName);
            setCurrentPhase('extended_info');
            setOrderStatus(savedStatus);
            // TODO: 从本地存储加载基本信息和扩展信息
            console.log('订单在扩展信息阶段，应该加载保存的信息');
          } else {
            // 重新提取基本信息
            console.log('🔄 重新提取文件订单信息:', fileName);
            // 重新提取基本信息 - 这里需要重新上传文件到公网服务器
            // 由于文件已经在本地，我们需要重新上传到公网
            try {
              const response = await fetch(fileInfo.url);
              if (!response.ok) {
                throw new Error(`获取本地文件失败: ${response.statusText}`);
              }
              
              const fileBlob = await response.blob();
              const formData = new FormData();
              formData.append('file', fileBlob);
              
              const uploadResponse = await fetch('https://demo.langcore.cn/api/file', {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${API_TOKEN}`
                },
                body: formData,
                redirect: 'follow'
              });
              
              if (!uploadResponse.ok) {
                throw new Error(`上传文件失败: ${uploadResponse.statusText}`);
              }
              
              const uploadResult = await uploadResponse.json();
              
              if (uploadResult.data && uploadResult.data.fileId) {
                console.log('📤 文件重新上传成功，开始提取订单信息:', fileName);
                fetchBasicOrderInfo(uploadResult.data.fileId, fileName);
              } else {
                throw new Error('上传响应格式不正确');
              }
            } catch (error) {
              console.error('文件上传到公网失败:', error);
              setError('文件上传到公网失败，无法获取订单信息');
            }
          }
        }
      }
    } catch (error) {
      console.error('选择文件时出错:', error);
      setError('选择文件时出错');
    }
  };



  // 处理成功弹窗关闭
  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    const nextIndex = currentFileIndex + 1;
    
    // 自动跳转到下一个文件
    if (nextIndex < fileList.length) {
      handleFileSelect(fileList[nextIndex].name);
    } else {
      // 所有文件处理完成
      alert(t.allFilesCompleted);
      setCurrentFileIndex(-1);
      setCurrentFileUrl(null);
      setUploadedFile(null);
      setShowPDFPreview(false);
      resetOrderInfo();
    }
  };

  // 切换语言
  const toggleLanguage = () => {
    setLanguage(language === 'zh' ? 'en' : 'zh');
  };

  // 文件列表加载中
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

  // 文件列表加载失败
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
          onSubmitOrder={handleSubmitOrder}
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

                  {/* 主视图渲染逻辑 */}
          {fileList.length === 0 ? (
            <FileUpload onFileUploaded={handleFileUploaded} onError={handleFileUploadError} />
          ) : !currentFileUrl ? (
            <FileUpload onFileUploaded={handleFileUploaded} onError={handleFileUploadError} />
          ) : showPDFPreview ? (
            <PDFPreview uploadedFile={uploadedFile} fileUrl={currentFileUrl} />
          ) : (
            <FileUpload onFileUploaded={handleFileUploaded} onError={handleFileUploadError} />
          )}
      </div>

      <SuccessModal
        isOpen={showSuccessModal}
        onClose={handleSuccessModalClose}
        fileName={fileList[currentFileIndex]?.name || ''}
      />
      
      {/* 错误提示 */}
      {error && (
        <div className="fixed bottom-4 right-4 bg-red-500 text-white p-4 rounded-lg shadow-lg z-50 max-w-md">
          <div className="flex items-center gap-2">
            <Icon icon="lucide:alert-circle" className="text-lg" />
            <span className="flex-1">{error}</span>
            <Button
              size="sm"
              variant="flat"
              color="default"
              onPress={() => setError(null)}
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

const App: React.FC = () => {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
};

export default App;