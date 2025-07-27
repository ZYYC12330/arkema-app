/**
 * @file useFileList.ts
 * @description 自定义 Hook，用于封装和管理所有与文件列表和文件处理相关的状态和逻辑。
 */

import React from 'react';
import { FileInfo } from '../config/files';
import { getFileList, getFileByName } from '../config/files';
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
 * 根据文件名推断文件类型
 * @param fileName 文件名
 * @returns 文件类型字符串
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


/**
 * 自定义 Hook，用于管理文件列表和文件处理逻辑
 * @returns 包含文件状态和操作函数的对象
 */
export const useFileList = (): UseFileListReturn => {
  const [fileList, setFileList] = React.useState<FileInfo[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = React.useState(true);
  const [fileListError, setFileListError] = React.useState<string | null>(null);
  const [currentFileIndex, setCurrentFileIndex] = React.useState(-1);
  const [currentFileUrl, setCurrentFileUrl] = React.useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = React.useState<File | null>(null);
  const [showPDFPreview, setShowPDFPreview] = React.useState(false);

  /**
   * 副作用 Hook，用于在组件挂载时加载文件列表
   */
  React.useEffect(() => {
    const loadFileList = async () => {
      try {
        setIsLoadingFiles(true);
        setFileListError(null);
        
        const files = await getFileList();
        setFileList(files);

      } catch (error) {
        setFileListError('获取文件列表失败，请检查网络连接');
      } finally {
        setIsLoadingFiles(false);
      }
    };

    loadFileList();
  }, []);

  /**
   * 处理文件上传成功
   * @param file 上传的文件
   * @param fileInfo 包含文件 ID 和 URL 的对象
   */
  const handleFileUploaded = (file: File, fileInfo: { fileId: string; url:string; publicUrl?: string }) => {
    const newFileInfo: FileInfo = {
      id: fileInfo.fileId,
      name: file.name,
      url: fileInfo.url,
      type: getFileTypeFromFileName(file.name),
      size: file.size,
      description: `Uploaded at ${new Date().toLocaleTimeString()}`
    };

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
   * 处理文件选择
   * @param fileName 选择的文件名
   * @param callbacks 包含不同场景回调函数的对象
   */
  const handleFileSelect = async (fileName: string, callbacks: {
    onSuccess: (fileId: string, fileName: string, keepSubmittedStatus: boolean) => void;
    onLoadSaved: (phase: 'submitted' | 'extended_info', status: any) => void;
    onReset: () => void;
  }) => {
    try {
      const savedStatus = OrderService.getOrderStatus(fileName);
      const fileInfo = await getFileByName(fileName);
      
      if (fileInfo) {
        const index = fileList.findIndex(file => file.name === fileName);
        if (index !== -1) {
          setCurrentFileIndex(index);
          setCurrentFileUrl(fileInfo.url);
          setUploadedFile(null);
          setShowPDFPreview(true);
          
          if (savedStatus?.isSubmitted) {
            callbacks.onLoadSaved('submitted', savedStatus);
          } else if (savedStatus?.phase === 'extended_info') {
            callbacks.onLoadSaved('extended_info', savedStatus);

          } else {
            callbacks.onReset();
            const response = await fetch(fileInfo.url);
            if (!response.ok) throw new Error(`获取本地文件失败: ${response.statusText}`);
            
            const fileBlob = await response.blob();
            const formData = new FormData();
            formData.append('file', fileBlob, fileName);
            
            const uploadResponse = await fetch(API_CONFIG.publicUploadEndpoint, {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${API_CONFIG.authToken}` },
              body: formData,
            });
            
            if (!uploadResponse.ok) throw new Error(`上传文件失败: ${uploadResponse.statusText}`);
            
            const uploadResult = await uploadResponse.json();
            if (uploadResult.data && uploadResult.data.fileId) {
              callbacks.onSuccess(uploadResult.data.fileId, fileName, false);
            } else {
              throw new Error('上传响应格式不正确');
            }
          }
        }
      }
    } catch (error) {
      setFileListError(error instanceof Error ? error.message : '选择文件时出错');
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