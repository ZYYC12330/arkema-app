/**
 * @file MultiFileUpload.tsx
 * @description 多文件上传组件，整合文件选择、上传队列和进度管理
 */

import React from 'react';
import { Card, CardBody, Button } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useLanguage } from '../contexts/LanguageContext';
import { useUploadQueue } from '../utils/useUploadQueue';
import FileUpload from './FileUpload';
import UploadQueue from './UploadQueue';

/**
 * MultiFileUpload 组件的属性接口
 */
interface MultiFileUploadProps {
  /** 单个文件上传成功的回调 */
  onFileUploaded: (file: File, fileInfo: { fileId: string; url: string; publicUrl?: string }) => void;
  /** 错误处理回调 */
  onError?: (error: string) => void;
  /** 是否显示队列 */
  showQueue?: boolean;
}

/**
 * 多文件上传组件
 */
const MultiFileUpload: React.FC<MultiFileUploadProps> = ({
  onFileUploaded,
  onError,
  showQueue = true
}) => {
  const { t } = useLanguage();
  
  // 使用上传队列 Hook
  const {
    queueState,
    addFilesToQueue,
    startQueue,
    pauseQueue,
    clearQueue,
    retryFailedItems,
    removeQueueItem,
    setOnFileUploaded
  } = useUploadQueue();

  // 设置文件上传完成回调
  React.useEffect(() => {
    setOnFileUploaded(onFileUploaded);
  }, [onFileUploaded, setOnFileUploaded]);

  /**
   * 处理多文件选择
   */
  const handleFilesSelected = (files: File[]) => {
    addFilesToQueue(files);
    
    // 如果队列没有在处理，自动开始上传
    if (!queueState.isProcessing) {
      setTimeout(() => startQueue(), 100);
    }
  };

  /**
   * 处理单文件上传（兼容性）
   */
  const handleSingleFileUploaded = (file: File, fileInfo: { fileId: string; url: string; publicUrl?: string }) => {
    onFileUploaded(file, fileInfo);
  };

  const [uploadMode, setUploadMode] = React.useState<'single' | 'multiple'>('multiple');

  const renderUploadArea = () => (
    <div className="flex-1 h-full">
      {/* 文件上传区域 */}
      <FileUpload
        onFileUploaded={handleSingleFileUploaded}
        onFilesSelected={handleFilesSelected}
        onError={onError}
        multipleMode={uploadMode === 'multiple'}
      />
    </div>
  );

  const renderQueue = () => (
    <UploadQueue
      queueState={queueState}
      onStartQueue={startQueue}
      onPauseQueue={pauseQueue}
      onClearQueue={clearQueue}
      onRetryFailed={retryFailedItems}
      onRemoveItem={removeQueueItem}
      isVisible={showQueue}
    />
  );

  // 上下布局，各占50%
  return (
    <div className="flex flex-col h-full gap-4 w-full">
      <div className="flex-1 min-h-0">
        {renderUploadArea()}
      </div>
      <div className="flex-1 min-h-0">
        {renderQueue()}
      </div>
    </div>
  );
};

export default MultiFileUpload; 