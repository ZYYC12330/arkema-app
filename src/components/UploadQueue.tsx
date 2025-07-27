/**
 * @file UploadQueue.tsx
 * @description 上传队列组件，显示文件上传进度和状态管理
 */

import React from 'react';
import { Card, CardBody, CardHeader, Button, Progress, Chip, Divider } from "@heroui/react";
import { Icon } from "@iconify/react";
import { UploadQueueState, UploadQueueItem, UploadStatus } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

/**
 * UploadQueue 组件的属性接口
 */
interface UploadQueueProps {
  /** 队列状态 */
  queueState: UploadQueueState;
  /** 开始处理队列 */
  onStartQueue: () => void;
  /** 暂停队列处理 */
  onPauseQueue: () => void;
  /** 清空队列 */
  onClearQueue: () => void;
  /** 重试失败的文件 */
  onRetryFailed: () => void;
  /** 移除队列项 */
  onRemoveItem: (id: string) => void;
  /** 是否显示队列 */
  isVisible?: boolean;
}

/**
 * 根据上传状态获取状态芯片的颜色和图标
 */
const getStatusInfo = (status: UploadStatus) => {
  switch (status) {
    case 'pending':
      return { color: 'default', icon: 'lucide:clock', text: '等待中' };
    case 'uploading':
      return { color: 'primary', icon: 'lucide:upload', text: '上传中' };
    case 'completed':
      return { color: 'success', icon: 'lucide:check-circle', text: '已完成' };
    case 'failed':
      return { color: 'danger', icon: 'lucide:x-circle', text: '失败' };
    case 'processing':
      return { color: 'warning', icon: 'lucide:loader-2', text: '处理中' };
    default:
      return { color: 'default', icon: 'lucide:help-circle', text: '未知' };
  }
};

/**
 * 格式化文件大小
 */
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * 格式化持续时间
 */
const formatDuration = (startTime?: number, endTime?: number): string => {
  if (!startTime) return '';
  
  const end = endTime || Date.now();
  const duration = Math.round((end - startTime) / 1000);
  
  if (duration < 60) return `${duration}s`;
  const minutes = Math.floor(duration / 60);
  const seconds = duration % 60;
  return `${minutes}m ${seconds}s`;
};

/**
 * 队列项组件
 */
const QueueItem: React.FC<{
  item: UploadQueueItem;
  onRemove: (id: string) => void;
}> = ({ item, onRemove }) => {
  const statusInfo = getStatusInfo(item.status);
  
  return (
    <div className="border rounded-lg p-3 bg-white hover:bg-gray-50 transition-colors">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Icon 
            icon={statusInfo.icon} 
            className={`text-lg ${
              item.status === 'processing' ? 'animate-spin' : ''
            }`}
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate" title={item.file.name}>
              {item.file.name}
            </p>
            <p className="text-xs text-gray-500">
              {formatFileSize(item.file.size)}
              {item.startTime && (
                <span className="ml-2">
                  {formatDuration(item.startTime, item.endTime)}
                </span>
              )}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Chip
            size="sm"
            color={statusInfo.color as any}
            variant="flat"
            startContent={<Icon icon={statusInfo.icon} className="text-xs" aria-label={`${statusInfo.text}图标`} />}
          >
            {statusInfo.text}
          </Chip>
          
          {(item.status === 'completed' || item.status === 'failed') && (
            <Button
              isIconOnly
              size="sm"
              variant="light"
              color="danger"
              onPress={() => onRemove(item.id)}
              aria-label="移除文件"
            >
              <Icon icon="lucide:trash-2" className="text-sm" aria-label="删除图标" />
            </Button>
          )}
        </div>
      </div>
      
      {/* 进度条 */}
      {(item.status === 'uploading' || item.status === 'processing') && (
        <Progress
          size="sm"
          value={item.progress}
          color="primary"
          className="mb-1"
        />
      )}
      
      {/* 错误信息 */}
      {item.error && (
        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
          {item.error}
        </div>
      )}
    </div>
  );
};

/**
 * 上传队列组件
 */
const UploadQueue: React.FC<UploadQueueProps> = ({
  queueState,
  onStartQueue,
  onPauseQueue,
  onClearQueue,
  onRetryFailed,
  onRemoveItem,
  isVisible = true
}) => {
  const { t } = useLanguage();
  
  if (!isVisible) {
    return null;
  }

  const pendingCount = queueState.items.filter(item => item.status === 'pending').length;
  const uploadingCount = queueState.items.filter(item => item.status === 'uploading').length;
  const totalItems = queueState.items.length;
  
  return (
    <Card className="w-full h-full bg-white shadow-md">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <Icon icon="lucide:list" className="text-lg text-primary" aria-label="队列图标" />
            <h3 className="text-lg font-semibold text-primary">{t.uploadQueue}</h3>
          </div>
          
          <div className="flex items-center gap-1">
            <Chip size="sm" color="primary" variant="flat">
              {queueState.completedCount}/{totalItems}
            </Chip>
            
            {queueState.failedCount > 0 && (
              <Chip size="sm" color="danger" variant="flat">
                {queueState.failedCount} 失败
              </Chip>
            )}
          </div>
        </div>
        
        {/* 总体进度 */}
        {totalItems > 0 && (
          <div className="mt-2">
            <Progress
              size="sm"
              value={(queueState.completedCount / totalItems) * 100}
              color="primary"
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>总进度</span>
              <span>{queueState.completedCount}/{totalItems}</span>
            </div>
          </div>
        )}
      </CardHeader>
      
            <Divider />
      
      <CardBody className="pt-2 flex flex-col h-full min-h-0">
        {/* 控制按钮 */}
        {queueState.items.length > 0 && (
          <div className="flex gap-2 mb-4 flex-shrink-0">
            {!queueState.isProcessing ? (
              <Button
                size="sm"
                color="primary"
                onPress={onStartQueue}
                isDisabled={pendingCount === 0}
                className="flex-1"
                aria-label="开始上传"
              >
                <Icon icon="lucide:play" className="text-sm" aria-label="播放图标" />
                {t.startUpload} ({pendingCount})
              </Button>
            ) : (
              <Button
                size="sm"
                color="warning"
                onPress={onPauseQueue}
                className="flex-1"
                aria-label="暂停上传"
              >
                <Icon icon="lucide:pause" className="text-sm" aria-label="暂停图标" />
                {t.pauseUpload} ({uploadingCount} {t.filesUploading})
              </Button>
            )}
            
            {queueState.failedCount > 0 && (
              <Button
                size="sm"
                color="secondary"
                variant="flat"
                onPress={onRetryFailed}
                aria-label="重试失败文件"
              >
                <Icon icon="lucide:refresh-cw" className="text-sm" aria-label="刷新图标" />
                {t.retryFailed}
              </Button>
            )}
            
            <Button
              size="sm"
              color="danger"
              variant="flat"
              onPress={onClearQueue}
              isDisabled={queueState.isProcessing}
              aria-label="清空队列"
            >
              <Icon icon="lucide:trash-2" className="text-sm" aria-label="清空图标" />
              {t.clearQueue}
            </Button>
          </div>
        )}
        
        {/* 队列项列表 */}
        <div className="space-y-2 flex-1 min-h-0 overflow-y-auto">
          {queueState.items.length > 0 ? (
            queueState.items.map(item => (
              <QueueItem
                key={item.id}
                item={item}
                onRemove={onRemoveItem}
              />
            ))
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <Icon icon="lucide:inbox" className="text-4xl mb-2" aria-label="空队列图标" />
              <p className="text-sm">暂无上传任务</p>
              <p className="text-xs mt-1">选择文件后将显示在这里</p>
            </div>
          )}
        </div>
        
        {/* 状态统计 */}
        {queueState.items.length > 0 && (
          <div className="mt-4 pt-2 border-t border-gray-200 flex-shrink-0">
            <div className="flex justify-between text-xs text-gray-600">
              <span>等待: {pendingCount}</span>
              <span>上传中: {uploadingCount}</span>
              <span>完成: {queueState.completedCount}</span>
              <span>失败: {queueState.failedCount}</span>
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  );
};

export default UploadQueue; 