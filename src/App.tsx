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

const API_BASE_URL = 'https://demo.langcore.cn';
const API_TOKEN = 'sk-zzvwbcaxoss3';

/**
 * 根据文件名推断文件类型
 * @param fileName - 文件名
 * @returns - 文件类型
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
    default: return 'pdf'; // 默认为pdf
  }
};

const AppContent: React.FC = () => {
  const { language, setLanguage, t } = useLanguage();
  
  // 文件列表状态管理
  const [fileList, setFileList] = React.useState<FileInfo[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = React.useState(true);
  const [fileListError, setFileListError] = React.useState<string | null>(null);

  const [currentFileIndex, setCurrentFileIndex] = React.useState(-1);
  const [showSuccessModal, setShowSuccessModal] = React.useState(false);
  
  const initialOrderInfo: OrderInfo = {
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
    arkemaSoldToCode: '',
    arkemaShipToCode: '',
    vendorSalesArea: '',
    deliveryByDate: '',
    lineNumber: '',
    arkemaProductCode: '',
  };
  const [orderInfo, setOrderInfo] = React.useState<OrderInfo>(initialOrderInfo);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);


  const [currentFileUrl, setCurrentFileUrl] = React.useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = React.useState<File | null>(null);
  const [showPDFPreview, setShowPDFPreview] = React.useState(false);

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

  const fetchOrderInfo = async (fileUrl: string) => {
    if (!fileUrl) return;

    setIsLoading(true);
    setError(null);
    setOrderInfo(initialOrderInfo); // 在获取新数据前清空旧数据

    try {
      // 现在传入的已经是公网URL，直接使用
      const absoluteUrl = fileUrl;

      const raw = JSON.stringify({
        "input": { "fileUrl": absoluteUrl },
        "runMode": "sync"
      });

      const requestOptions = {
         method: 'POST',
         headers: {
            'Authorization': `Bearer ${API_TOKEN}`,
            'Content-Type': 'application/json'
         },
         body: raw,
         redirect: 'follow' as RequestRedirect
      };

      const response = await fetch(`${API_BASE_URL}/api/workflow/run/cmd5l351c01d8mwb7lesuciq0`, requestOptions);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API请求失败: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      
      // 假设成功时，数据在 result.data.output 中
      if (result.success && result.data && result.data.output) {
        const apiData = result.data.output;
        setOrderInfo({
          id: apiData.id || '',
          soldToName: apiData.soldToName || '',
          soldToAddress: apiData.soldToAddress || '',
          shipToName: apiData.shipToName || '',
          shipToAddress: apiData.shipToAddress || '',
          vendorName: apiData.vendorName || '',
          vendorAddress: apiData.vendorAddress || '',
          poNumber: apiData.poNumber || '',
          poDate: apiData.poDate || '',
          deliveryDate: apiData.deliveryDate || '',
          itemNumber: apiData.itemNumber || '',
          itemName: apiData.itemName || '',
          itemQuantity: apiData.itemQuantity || '',
          unitOfMeasure: apiData.unitOfMeasure || '',
          unitPrice: apiData.unitPrice || '',
          arkemaSoldToCode: apiData.arkemaSoldToCode || '',
          arkemaShipToCode: apiData.arkemaShipToCode || '',
          vendorSalesArea: apiData.vendorSalesArea || '',
          deliveryByDate: apiData.deliveryByDate || '',
          lineNumber: apiData.lineNumber || '',
          arkemaProductCode: apiData.arkemaProductCode || '',
        });
      } else {
        throw new Error(result.msg || '从API获取数据失败或格式不正确');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      console.error("获取订单信息时出错:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOrderUpdate = (field: keyof OrderInfo, value: string) => {
    setOrderInfo(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUploaded = (file: File, fileInfo?: { fileId?: string; url?: string }) => {
    // 1. 创建一个新的文件信息对象
    const newFileInfo: FileInfo = {
      id: fileInfo?.fileId || file.name,
      name: file.name,
      url: fileInfo?.url || '',
      type: getFileTypeFromFileName(file.name),
      size: file.size,
      description: `Uploaded at ${new Date().toLocaleTimeString()}`
    };

    if (!newFileInfo.url) {
      console.error("文件上传成功但未返回URL，无法更新列表。");
      // 仍然显示预览，但列表不会更新
      setCurrentFileUrl(URL.createObjectURL(file));
      setUploadedFile(file);
      setShowPDFPreview(true);
      
      // 对于新上传的文件，直接上传到公网服务器
      uploadFileToPublicServerForNewFile(file);
      return;
    }

    // 2. 更新文件列表和当前选中的文件索引
    setFileList(prevList => {
      const existingFileIndex = prevList.findIndex(f => f.name === newFileInfo.name);

      if (existingFileIndex !== -1) {
        // 如果文件已存在，则只更新它的信息并选中它
        const newList = [...prevList];
        newList[existingFileIndex] = newFileInfo;
        setCurrentFileIndex(existingFileIndex);
        return newList;
      } else {
        // 如果是新文件，则添加到列表末尾并选中它
        const newList = [...prevList, newFileInfo];
        setCurrentFileIndex(newList.length - 1);
        return newList;
      }
    });
    
    // 3. 更新状态以显示预览
    setCurrentFileUrl(newFileInfo.url);
    setUploadedFile(file);
    setShowPDFPreview(true);

    // 4. 为新文件获取订单信息（先上传到公网）
    uploadFileToPublicServerForNewFile(file);
    
    console.log(`文件 ${file.name} 已上传并添加到列表。`);
  };

  // 新增：为新上传的文件上传到公网服务器
      const uploadFileToPublicServerForNewFile = async (file: File) => {
      try {
        // 创建 FormData 准备上传
        const formData = new FormData();
        formData.append("file", file, file.name);
        
        // 上传到公网服务器 (通过代理避免CORS)
        const uploadResponse = await fetch('/api/demo/file', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${API_TOKEN}`
            // 注意：使用FormData时不要设置Content-Type，让浏览器自动设置
          },
          body: formData,
          redirect: 'follow'
        });
      
      if (!uploadResponse.ok) {
        throw new Error(`上传文件失败: ${uploadResponse.statusText}`);
      }
      
      const uploadResult = await uploadResponse.json();
      
      // 返回公网可访问的URL
      if (uploadResult.success && uploadResult.data && uploadResult.data.url) {
        const publicUrl = uploadResult.data.url;
        // 使用公网URL获取订单信息
        fetchOrderInfo(publicUrl);
      } else {
        throw new Error('上传响应格式不正确');
      }
    } catch (error) {
      console.error('上传文件到公网失败:', error);
      setError('文件上传到公网失败，无法获取订单信息');
    }
  };

  const handleFileSelect = async (fileName: string) => {
    try {
      const fileInfo = await getFileByName(fileName);
      if (fileInfo) {
        const index = fileList.findIndex(file => file.name === fileName);
        if (index !== -1) {
          setCurrentFileIndex(index);
          setCurrentFileUrl(fileInfo.url);
          setUploadedFile(null);
          setShowPDFPreview(true);
          
          // 先将本地文件上传到公网获取可访问的URL
          const publicUrl = await uploadFileToPublicServer(fileInfo.url, fileName);
          if (publicUrl) {
            // 使用公网URL获取订单信息
            fetchOrderInfo(publicUrl);
          } else {
            console.error('文件上传到公网失败');
            setError('文件上传到公网失败，无法获取订单信息');
          }
        }
      }
    } catch (error) {
      console.error('选择文件时出错:', error);
      setError('选择文件时出错');
    }
  };

  // 新增：将本地文件上传到公网服务器
  const uploadFileToPublicServer = async (localFileUrl: string, fileName: string): Promise<string | null> => {
    try {
      // 获取本地文件
      const response = await fetch(localFileUrl);
      if (!response.ok) {
        throw new Error(`获取本地文件失败: ${response.statusText}`);
      }
      
      const fileBlob = await response.blob();
      
      // 创建 FormData 准备上传
      const formData = new FormData();
      formData.append('file', fileBlob, fileName);
      
      // 上传到公网服务器 (通过代理避免CORS)
      const uploadResponse = await fetch('/api/demo/file', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_TOKEN}`
          // 注意：使用FormData时不要设置Content-Type，让浏览器自动设置
        },
        body: formData,
        redirect: 'follow'
      });
      
      if (!uploadResponse.ok) {
        throw new Error(`上传文件失败: ${uploadResponse.statusText}`);
      }
      
      const uploadResult = await uploadResponse.json();
      
      // 返回公网可访问的URL
      if (uploadResult.success && uploadResult.data && uploadResult.data.url) {
        return uploadResult.data.url;
      } else {
        throw new Error('上传响应格式不正确');
      }
    } catch (error) {
      console.error('上传文件到公网失败:', error);
      return null;
    }
  };

  const handleSubmit = () => {
    // 显示成功弹窗
    setShowSuccessModal(true);
  };

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
      setUploadedFile(null); // 清除已上传的文件状态
      setShowPDFPreview(false);
      setOrderInfo(initialOrderInfo); // 重置表单信息
    }
  };

  const toggleLanguage = () => {
    setLanguage(language === 'zh' ? 'en' : 'zh');
  };

  // 如果正在加载文件列表，显示加载状态
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

  // 如果文件列表加载失败，显示错误状态
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
          isLoading={isLoading}
        />


        {/* 主视图渲染逻辑 */}
        {fileList.length === 0 ? (
          // 如果没有文件列表，显示文件上传
          <FileUpload onFileUploaded={handleFileUploaded} />
        ) : !currentFileUrl ? (
          // 如果有文件列表但没有选择文件，显示文件上传
          <FileUpload onFileUploaded={handleFileUploaded} />
        ) : showPDFPreview ? (
          // 如果选择了文件且显示PDF预览
          <PDFPreview uploadedFile={uploadedFile} fileUrl={currentFileUrl} />
        ) : (
          // 如果选择了文件但不显示PDF预览，显示文件上传
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