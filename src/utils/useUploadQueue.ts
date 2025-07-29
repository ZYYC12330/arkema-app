/**
 * @file useUploadQueue.ts
 * @description 自定义Hook，用于管理多文件上传队列的状态和逻辑
 */

import React from 'react';
import { UploadQueueItem, UploadQueueState, UploadStatus } from '../types';
import { API_CONFIG } from '../config/api';

/**
 * 上传响应的接口
 */
interface UploadResponse {
  data?: {
    fileId?: string;
    url?: string;
  };
  status?: string;  // LangCore使用status而不是success
  success?: boolean; // 兼容旧格式
  msg?: string;
}

/**
 * useUploadQueue Hook的返回值接口
 */
interface UseUploadQueueReturn {
  /** 队列状态 */
  queueState: UploadQueueState;
  /** 添加文件到队列 */
  addFilesToQueue: (files: File[]) => void;
  /** 开始处理队列 */
  startQueue: () => Promise<void>;
  /** 暂停队列处理 */
  pauseQueue: () => void;
  /** 清空队列 */
  clearQueue: () => void;
  /** 重试失败的文件 */
  retryFailedItems: () => Promise<void>;
  /** 移除队列项 */
  removeQueueItem: (id: string) => void;
  /** 上传完成回调 */
  onFileUploaded?: (file: File, fileInfo: { fileId: string; url: string; publicUrl?: string }) => void;
  /** 设置上传完成回调 */
  setOnFileUploaded: (callback: (file: File, fileInfo: { fileId: string; url: string; publicUrl?: string }) => void) => void;
}

/**
 * 生成唯一ID
 */
const generateId = () => `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

/**
 * 验证文件类型和大小
 */
const validateFile = (file: File): { valid: boolean; error?: string } => {
  const allowedTypes = [
    'application/pdf', 
    'application/msword', 
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/jpg',
    'image/png'
  ];
  
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: '不支持的文件格式，请上传 PDF、DOC、DOCX、XLS、XLSX 或图片文件'
    };
  }

  if (file.size > 10 * 1024 * 1024) {
    return {
      valid: false,
      error: '文件太大，请选择小于 10MB 的文件'
    };
  }

  return { valid: true };
};

/**
 * 上传文件到LangCore平台
 * 响应示例: {"status":"success","data":{"fileId":"cmdnyyv6q059ao4c6q0fhsr0y"}}
 */
const uploadFileToLangCore = async (file: File): Promise<UploadResponse> => {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const uploadResponse = await fetch(API_CONFIG.publicUploadEndpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_CONFIG.authToken}`
      },
      body: formData,
      redirect: 'follow'
    });

    if (!uploadResponse.ok) {
      throw new Error(`上传文件到LangCore失败: ${uploadResponse.statusText}`);
    }

    const uploadResult = await uploadResponse.json();
      
      // 检查LangCore响应格式：{"status":"success","data":{"fileId":"..."}}
      if ((uploadResult.status === 'success' || uploadResult.success) && uploadResult.data && uploadResult.data.fileId) {
        return uploadResult;
      } else {
        throw new Error('LangCore服务器响应格式不正确');
      }
  } catch (error) {
    console.error('上传文件到LangCore失败:', error);
    throw error;
  }
};

/**
 * 自定义Hook，用于管理文件上传队列
 */
export const useUploadQueue = (): UseUploadQueueReturn => {
  const [queueState, setQueueState] = React.useState<UploadQueueState>({
    items: [],
    isProcessing: false,
    completedCount: 0,
    failedCount: 0
  });

  const [isProcessingRef, setIsProcessingRef] = React.useState(false);
  const [onFileUploadedCallback, setOnFileUploadedCallback] = React.useState<
    ((file: File, fileInfo: { fileId: string; url: string; publicUrl?: string }) => void) | undefined
  >();

  /**
   * 更新队列项状态
   */
  const updateQueueItem = React.useCallback((id: string, updates: Partial<UploadQueueItem>) => {
    setQueueState(prev => ({
      ...prev,
      items: prev.items.map(item => 
        item.id === id ? { ...item, ...updates } : item
      )
    }));
  }, []);

  /**
   * 重新计算队列统计
   */
  const updateQueueStats = React.useCallback(() => {
    setQueueState(prev => {
      const completedCount = prev.items.filter(item => item.status === 'completed').length;
      const failedCount = prev.items.filter(item => item.status === 'failed').length;
      
      return {
        ...prev,
        completedCount,
        failedCount
      };
    });
  }, []);

  /**
   * 添加文件到队列
   */
  const addFilesToQueue = React.useCallback((files: File[]) => {
    const newItems: UploadQueueItem[] = files.map(file => {
      const validation = validateFile(file);
      
      return {
        id: generateId(),
        file,
        status: validation.valid ? 'pending' : 'failed',
        progress: 0,
        error: validation.error
      };
    });

    setQueueState(prev => ({
      ...prev,
      items: [...prev.items, ...newItems]
    }));
  }, []);

  /**
   * 上传单个文件
   */
  const uploadSingleFile = React.useCallback(async (item: UploadQueueItem) => {
    const { id, file } = item;
    
    try {
      updateQueueItem(id, { 
        status: 'uploading', 
        progress: 0,
        startTime: Date.now()
      });

      // 模拟进度更新
      const progressInterval = setInterval(() => {
        setQueueState(prev => ({
          ...prev,
          items: prev.items.map(item => 
            item.id === id 
              ? { ...item, progress: Math.min((item.progress || 0) + 10, 90) }
              : item
          )
        }));
      }, 200);

      // 上传到LangCore平台
      const langCoreResponse = await uploadFileToLangCore(file);
      
      if (!langCoreResponse.data?.fileId) {
        throw new Error(langCoreResponse.msg || 'LangCore平台上传失败，未返回文件ID');
      }

      clearInterval(progressInterval);
      
      const fileInfo = {
        fileId: langCoreResponse.data.fileId,
        url: langCoreResponse.data.url!,
        publicUrl: langCoreResponse.data.url
      };

      updateQueueItem(id, { 
        status: 'completed',
        progress: 100,
        fileInfo,
        endTime: Date.now()
      });

      // 调用上传完成回调
      if (onFileUploadedCallback) {
        onFileUploadedCallback(file, fileInfo);
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '上传失败';
      updateQueueItem(id, { 
        status: 'failed',
        error: errorMessage,
        endTime: Date.now()
      });
    }
  }, [updateQueueItem, onFileUploadedCallback]);

  /**
   * 开始处理队列
   */
  const startQueue = React.useCallback(async () => {
    if (isProcessingRef) return;

    setIsProcessingRef(true);
    setQueueState(prev => ({ ...prev, isProcessing: true }));

    const pendingItems = queueState.items.filter(item => item.status === 'pending');
    
    // 并发上传（最多3个文件同时上传）
    const concurrentLimit = 3;
    const batches = [];
    
    for (let i = 0; i < pendingItems.length; i += concurrentLimit) {
      batches.push(pendingItems.slice(i, i + concurrentLimit));
    }

    for (const batch of batches) {
      if (!isProcessingRef) break; // 如果暂停了，停止处理
      
      await Promise.all(
        batch.map(item => uploadSingleFile(item))
      );
    }

    setIsProcessingRef(false);
    setQueueState(prev => ({ ...prev, isProcessing: false }));
  }, [queueState.items, uploadSingleFile, isProcessingRef]);

  /**
   * 暂停队列处理
   */
  const pauseQueue = React.useCallback(() => {
    setIsProcessingRef(false);
    setQueueState(prev => ({ ...prev, isProcessing: false }));
  }, []);

  /**
   * 清空队列
   */
  const clearQueue = React.useCallback(() => {
    if (queueState.isProcessing) {
      pauseQueue();
    }
    
    setQueueState({
      items: [],
      isProcessing: false,
      completedCount: 0,
      failedCount: 0
    });
  }, [queueState.isProcessing, pauseQueue]);

  /**
   * 重试失败的文件
   */
  const retryFailedItems = React.useCallback(async () => {
    setQueueState(prev => ({
      ...prev,
      items: prev.items.map(item => 
        item.status === 'failed' 
          ? { ...item, status: 'pending', progress: 0, error: undefined }
          : item
      )
    }));

    // 自动开始处理
    setTimeout(() => startQueue(), 100);
  }, [startQueue]);

  /**
   * 移除队列项
   */
  const removeQueueItem = React.useCallback((id: string) => {
    setQueueState(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== id)
    }));
  }, []);

  /**
   * 设置上传完成回调
   */
  const setOnFileUploaded = React.useCallback((
    callback: (file: File, fileInfo: { fileId: string; url: string; publicUrl?: string }) => void
  ) => {
    setOnFileUploadedCallback(() => callback);
  }, []);

  // 监听队列变化，自动更新统计
  React.useEffect(() => {
    updateQueueStats();
  }, [queueState.items, updateQueueStats]);

  return {
    queueState,
    addFilesToQueue,
    startQueue,
    pauseQueue,
    clearQueue,
    retryFailedItems,
    removeQueueItem,
    setOnFileUploaded
  };
}; 