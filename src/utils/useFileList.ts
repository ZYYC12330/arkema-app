/**
 * @file useFileList.ts
 * @description 自定义 Hook，用于封装和管理所有与文件列表和文件处理相关的状态和逻辑。
 */

import React from 'react';
import { FileInfo, createFileInfo, getFileList } from '../config/files';
import { OrderService } from './orderService';
import { API_CONFIG } from '../config/api';

/**
 * useFileList Hook 的返回值接口
 */
interface UseFileListReturn {
  /** 文件信息列表 */
  fileList: FileInfo[];
  /** 是否正在加载文件列表 */
  isLoadingFiles: boolean;
  /** 文件列表加载错误信息 */
  fileListError: string | null;
  /** 清除文件列表错误 */
  clearFileListError: () => void;
  /** 当前选中的文件索引 */
  currentFileIndex: number;
  /** 当前文件的 URL */
  currentFileUrl: string | null;
  /** 用户上传的文件对象 */
  uploadedFile: File | null;
  /** 是否显示 PDF 预览 */
  showPDFPreview: boolean;
  /** 处理文件上传完成的回调 */
  handleFileUploaded: (file: File, fileInfo: { fileId: string; url: string; publicUrl?: string }) => void;
  /** 处理文件上传失败的回调 */
  handleFileUploadError: (error: string) => void;
  /** 处理文件选择的回调 */
  handleFileSelect: (fileName: string, callbacks: {
    onSuccess: (fileId: string, fileName: string, keepSubmittedStatus: boolean) => void;
    onLoadSaved: (phase: 'submitted' | 'extended_info', status: any) => void;
    onReset: () => void;
  }) => Promise<void>;
  /** 设置当前文件索引 */
  setCurrentFileIndex: React.Dispatch<React.SetStateAction<number>>;
  /** 设置是否显示 PDF 预览 */
  setShowPDFPreview: React.Dispatch<React.SetStateAction<boolean>>;
  /** 设置当前文件的 URL */
  setCurrentFileUrl: React.Dispatch<React.SetStateAction<string | null>>;
  /** 设置上传的文件对象 */
  setUploadedFile: React.Dispatch<React.SetStateAction<File | null>>;
  /** 设置文件列表 */
  setFileList: React.Dispatch<React.SetStateAction<FileInfo[]>>;
}

/**
 * 自定义 Hook，用于管理文件列表和文件处理逻辑
 * @returns 包含文件状态和操作函数的对象
 */
export const useFileList = (): UseFileListReturn => {
  const [fileList, setFileList] = React.useState<FileInfo[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = React.useState(false);
  const [fileListError, setFileListError] = React.useState<string | null>(null);
  const [currentFileIndex, setCurrentFileIndex] = React.useState(-1);
  const [currentFileUrl, setCurrentFileUrl] = React.useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = React.useState<File | null>(null);
  const [showPDFPreview, setShowPDFPreview] = React.useState(false);

  /**
   * 初始化时不再加载任何文件，因为现在所有文件都是动态上传的
   */
  React.useEffect(() => {
    // 不再需要加载本地文件列表
    setIsLoadingFiles(false);

  }, []);

  // 从数据库中获取文件列表
  React.useEffect(() => {
    // 从LangCore获取文件列表
    // setFileList(files as FileInfo[]);
    getFileList().then((files: FileInfo[]) => {
      setFileList(files);
    });
  }, []);

  /**
   * 处理文件上传成功
   * @param file 上传的文件
   * @param fileInfo 包含文件 ID 和 URL 的对象
   */
  const handleFileUploaded = (file: File, fileInfo: { fileId: string; url: string; publicUrl?: string }) => {
    console.log('🔍 handleFileUploaded 接收到的 fileInfo:', fileInfo);
    
    const urlToUse = fileInfo.publicUrl || fileInfo.url;
    console.log('🔗 使用的URL:', urlToUse);
    
    const newFileInfo = createFileInfo(file, fileInfo.fileId, urlToUse);
    console.log('📄 创建的文件信息:', newFileInfo);

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
  };

  /**
   * 处理文件上传错误
   * @param error 错误信息
   */
  const handleFileUploadError = (error: string) => {
    setFileListError(error);
  };

  /**
   * 处理文件选择 - 现在所有文件都必须是已上传到LangCore的文件
   * @param fileName 选择的文件名
   * @param callbacks 包含不同场景回调函数的对象
   */
  const handleFileSelect = async (fileName: string, callbacks: {
    onSuccess: (fileId: string, fileName: string, keepSubmittedStatus: boolean) => void;
    onLoadSaved: (phase: 'submitted' | 'extended_info', status: any) => void;
    onReset: () => void;
  }) => {
    try {
      console.log('🔍 开始选择文件:', fileName);
      const savedStatus = OrderService.getOrderStatus(fileName);
      
      // 查找已上传的文件
      const fileInfo = fileList.find(file => file.name === fileName);
      console.log('📄 找到的文件信息:', fileInfo);
      
      if (fileInfo && fileInfo.url) {
        const index = fileList.findIndex(file => file.name === fileName);
        if (index !== -1) {
          setCurrentFileIndex(index);
          // 修改：传递包含文件名的URL，以便PDFViewer能够正确识别文件类型
          const urlWithFilename = `${fileInfo.url}?filename=${encodeURIComponent(fileName)}`;
          console.log('🔗 设置的URL:', urlWithFilename);
          setCurrentFileUrl(urlWithFilename);
          setUploadedFile(null);
          setShowPDFPreview(true);
          
          if (savedStatus?.isSubmitted) {
            callbacks.onLoadSaved('submitted', savedStatus);
          } else if (savedStatus?.phase === 'extended_info') {
            callbacks.onLoadSaved('extended_info', savedStatus);
          } else {
            callbacks.onReset();
            // 直接使用LangCore上的文件URL，提取文件ID
            const fileId = extractFileIdFromUrl(fileInfo.url);
            if (fileId) {
              callbacks.onSuccess(fileId, fileName, false);
            } else {
              throw new Error('无法从文件URL中提取文件ID');
            }
          }
        }
      } else {
        throw new Error(`文件 "${fileName}" 未找到或未上传，请先上传该文件`);
      }
    } catch (error) {
      console.error('❌ 文件选择错误:', error);
      setFileListError(error instanceof Error ? error.message : '选择文件时出错');
    }
  };

  /**
   * 从LangCore文件URL中提取文件ID
   * @param url LangCore文件URL
   * @returns 文件ID或null
   */
  const extractFileIdFromUrl = (url: string): string | null => {
    try {
      // LangCore URL格式通常是: https://demo.langcore.cn/api/file/{fileId}
      const match = url.match(/\/api\/file\/([^\/\?]+)/);
      return match ? match[1] : null;
    } catch {
      return null;
    }
  };

  return {
    fileList,
    isLoadingFiles,
    fileListError,
    clearFileListError: () => setFileListError(null),
    currentFileIndex,
    currentFileUrl,
    uploadedFile,
    showPDFPreview,
    handleFileUploaded,
    handleFileUploadError,
    handleFileSelect,
    setCurrentFileIndex,
    setShowPDFPreview,
    setCurrentFileUrl,
    setUploadedFile,
    setFileList
  };
}; 