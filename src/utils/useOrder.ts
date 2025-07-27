/**
 * @file useOrder.ts
 * @description 自定义 Hook，用于封装和管理所有与订单处理相关的状态和逻辑。
 */

import React from 'react';
import { BasicOrderInfo, ExtendedOrderInfo, CompleteOrderInfo, OrderProcessingPhase, OrderStatus } from '../types';
import { OrderService } from './orderService';

/**
 * useOrder Hook 的返回值接口
 */
interface UseOrderReturn {
  /** 当前订单处理阶段 */
  currentPhase: OrderProcessingPhase;
  /** 当前订单状态 */
  orderStatus: OrderStatus | null;
  /** 基本订单信息 */
  basicOrderInfo: BasicOrderInfo;
  /** 扩展订单信息 */
  extendedOrderInfo: ExtendedOrderInfo;
  /** 是否正在加载基本信息 */
  isLoading: boolean;
  /** 加载进度 (0-100) */
  loadingProgress: number;
  /** 是否正在生成内部编号 */
  isGeneratingCodes: boolean;
  /** 是否正在提交订单 */
  isSubmittingOrder: boolean;
  /** 错误信息 */
  error: string | null;
  /** 清除错误信息 */
  clearError: () => void;
  /** 提取基本订单信息 */
  fetchBasicOrderInfo: (fileId: string, fileName: string, keepSubmittedStatus?: boolean) => Promise<void>;
  /** 生成扩展信息 */
  handleGenerateExtendedInfo: () => Promise<void>;
  /** 提交订单 */
  handleSubmitOrder: (currentFileUrl: string, currentFileName: string) => Promise<boolean>;
  /** 返回基本信息编辑阶段 */
  handleBackToBasicInfo: () => void;
  /** 更新基本订单信息的字段 */
  handleBasicOrderUpdate: (field: keyof BasicOrderInfo, value: string) => void;
  /** 更新扩展订单信息的字段 */
  handleExtendedOrderUpdate: (field: keyof ExtendedOrderInfo, value: string) => void;
  /** 重置所有订单信息和状态 */
  resetOrderInfo: () => void;
  /** 加载已保存的订单信息 */
  loadSavedOrder: (fileName: string) => void;
  /** 设置订单状态 */
  setOrderStatus: React.Dispatch<React.SetStateAction<OrderStatus | null>>;
  /** 设置当前处理阶段 */
  setCurrentPhase: React.Dispatch<React.SetStateAction<OrderProcessingPhase>>;
}

// 初始基本订单信息
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
    totalPrice: '',
};

// 初始扩展订单信息
const initialExtendedOrderInfo: ExtendedOrderInfo = {
    arkemaSoldToCode: '',
    arkemaShipToCode: '',
    arkemaProductCode: '',
};


/**
 * 自定义 Hook，用于管理订单处理的所有逻辑
 * @param currentFileName 当前处理的文件名，用于保存和更新状态
 * @returns 包含订单状态和操作函数的对象
 */
export const useOrder = (currentFileName: string | null): UseOrderReturn => {
  const [currentPhase, setCurrentPhase] = React.useState<OrderProcessingPhase>('basic_info');
  const [orderStatus, setOrderStatus] = React.useState<OrderStatus | null>(null);
  const [basicOrderInfo, setBasicOrderInfo] = React.useState<BasicOrderInfo>(initialBasicOrderInfo);
  const [extendedOrderInfo, setExtendedOrderInfo] = React.useState<ExtendedOrderInfo>(initialExtendedOrderInfo);

  const [isLoading, setIsLoading] = React.useState(false);
  const [loadingProgress, setLoadingProgress] = React.useState(0);
  const [isGeneratingCodes, setIsGeneratingCodes] = React.useState(false);
  const [isSubmittingOrder, setIsSubmittingOrder] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  /**
   * 重置所有与订单相关的状态
   */
  const resetOrderInfo = React.useCallback(() => {
    setBasicOrderInfo(initialBasicOrderInfo);
    setExtendedOrderInfo(initialExtendedOrderInfo);
    setCurrentPhase('basic_info');
    setOrderStatus(null);
    setError(null);
    setLoadingProgress(0);
  }, []);
  
  /**
   * 异步提取基本订单信息
   * @param fileId 文件 ID
   * @param fileName 文件名
   * @param keepSubmittedStatus 是否保持已提交状态（用于重新加载已提交订单时）
   */
  const fetchBasicOrderInfo = async (fileId: string, fileName: string, keepSubmittedStatus: boolean = false) => {
    if (!fileId) return;

    const startTime = Date.now();
    const MINIMUM_LOADING_TIME = 15000; // 15秒 - 可以调整这个值来设置动画时间

    setIsLoading(true);
    setLoadingProgress(0);
    setError(null);
    
    if (!keepSubmittedStatus) {
      resetOrderInfo();
    }

    // 启动进度更新器
    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min((elapsed / MINIMUM_LOADING_TIME) * 100, 100);
      setLoadingProgress(progress);
    }, 50); // 每50ms更新一次进度 - 可以调整这个值

    try {
      const basicInfo = await OrderService.extractBasicOrderInfo(fileId, fileName);
      setBasicOrderInfo(basicInfo);
      
      OrderService.saveOrderInfo(fileName, basicInfo, initialExtendedOrderInfo);
      
      const status: OrderStatus = {
        fileName,
        phase: keepSubmittedStatus ? 'submitted' : 'basic_info',
        isSubmitted: keepSubmittedStatus,
        lastModified: new Date().toISOString()
      };
      setOrderStatus(status);
      OrderService.updateOrderStatus(fileName, keepSubmittedStatus ? 'submitted' : 'basic_info', keepSubmittedStatus);
      
      if (keepSubmittedStatus) {
        setCurrentPhase('submitted');
      }

      // 确保至少加载15秒
      const elapsedTime = Date.now() - startTime;
      const remainingTime = MINIMUM_LOADING_TIME - elapsedTime;
      
      if (remainingTime > 0) {
        await new Promise(resolve => setTimeout(resolve, remainingTime));
      }
      
          } catch (err) {
        // 即使出错也要等够15秒
        const elapsedTime = Date.now() - startTime;
        const remainingTime = MINIMUM_LOADING_TIME - elapsedTime;
        
        if (remainingTime > 0) {
          await new Promise(resolve => setTimeout(resolve, remainingTime));
        }
        
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        clearInterval(progressInterval);
        setLoadingProgress(100);
        setIsLoading(false);
      }
  };

  /**
   * 生成扩展信息（如内部编号）
   */
  const handleGenerateExtendedInfo = async () => {
    if (!basicOrderInfo.poNumber || !currentFileName) {
      setError('请先完善基本订单信息');
      return;
    }

    setIsGeneratingCodes(true);
    setError(null);

    try {
      const extendedInfo = await OrderService.generateExtendedInfo(basicOrderInfo);
      setExtendedOrderInfo(extendedInfo);
      setCurrentPhase('extended_info');
      
      OrderService.saveOrderInfo(currentFileName, basicOrderInfo, extendedInfo);
      
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
    } finally {
      setIsGeneratingCodes(false);
    }
  };

  /**
   * 提交订单
   * @param currentFileUrl 当前文件的 URL
   * @param currentFileName 当前文件名
   * @returns 如果提交成功则返回 true，否则返回 false
   */
  const handleSubmitOrder = async (currentFileUrl: string, currentFileName: string): Promise<boolean> => {
    if (!currentFileName || !basicOrderInfo.poNumber) {
      setError('请确保已选择文件并完善订单信息');
      return false;
    }
    
    setIsSubmittingOrder(true);
    setError(null);

    try {
      const completeOrderInfo: CompleteOrderInfo = {
        ...basicOrderInfo,
        ...extendedOrderInfo,
        phase: 'submitted',
        isSubmitted: true,
        fileUrl: currentFileUrl || ''
      };
      
      const result = await OrderService.submitOrder(completeOrderInfo);
      
      if (result.success) {
        setCurrentPhase('submitted');
        
        const status: OrderStatus = {
          fileName: currentFileName,
          phase: 'submitted',
          isSubmitted: true,
          submittedAt: new Date().toISOString(),
          lastModified: new Date().toISOString()
        };
        setOrderStatus(status);
        
        OrderService.updateOrderStatus(currentFileName, 'submitted', true);
        OrderService.saveOrderInfo(currentFileName, basicOrderInfo, extendedOrderInfo);
        
        return true;
      } else {
        throw new Error(result.message || '提交订单失败');
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : '提交订单失败');
      return false;
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  /**
   * 返回到基本信息编辑阶段
   */
  const handleBackToBasicInfo = () => {
    if (!currentFileName) return;
    setCurrentPhase('basic_info');
    const status: OrderStatus = {
      fileName: currentFileName,
      phase: 'basic_info',
      isSubmitted: false,
      lastModified: new Date().toISOString()
    };
    setOrderStatus(status);
    OrderService.updateOrderStatus(currentFileName, 'basic_info', false);
  };

  /**
   * 从本地存储加载已保存的订单信息
   * @param fileName 文件名
   */
  const loadSavedOrder = React.useCallback((fileName: string) => {
    const savedOrderInfo = OrderService.getSavedOrderInfo(fileName);
    if (savedOrderInfo) {
      setBasicOrderInfo(savedOrderInfo.basicInfo || initialBasicOrderInfo);
      setExtendedOrderInfo(savedOrderInfo.extendedInfo || initialExtendedOrderInfo);
    } else {
        resetOrderInfo();
    }
  }, [resetOrderInfo]);

  /**
   * 处理基本订单信息的更新
   * @param field 要更新的字段
   * @param value 新的值
   */
  const handleBasicOrderUpdate = (field: keyof BasicOrderInfo, value: string) => {
    setBasicOrderInfo(prev => ({ ...prev, [field]: value }));
  };

  /**
   * 处理扩展订单信息的更新
   * @param field 要更新的字段
   * @param value 新的值
   */
  const handleExtendedOrderUpdate = (field: keyof ExtendedOrderInfo, value: string) => {
    setExtendedOrderInfo(prev => ({ ...prev, [field]: value }));
  };


  return {
    currentPhase,
    orderStatus,
    basicOrderInfo,
    extendedOrderInfo,
    isLoading,
    loadingProgress,
    isGeneratingCodes,
    isSubmittingOrder,
    error,
    clearError: () => setError(null),
    fetchBasicOrderInfo,
    handleGenerateExtendedInfo,
    handleSubmitOrder,
    handleBackToBasicInfo,
    handleBasicOrderUpdate,
    handleExtendedOrderUpdate,
    resetOrderInfo,
    loadSavedOrder,
    setOrderStatus,
    setCurrentPhase,
  };
}; 