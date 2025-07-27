/**
 * @file Sidebar.tsx
 * @description 侧边栏组件，用于显示和编辑订单信息，管理文件列表和处理用户操作。
 */

import React, { useState } from 'react';
import { Card, CardBody, Input, Button, Divider, Select, SelectItem, Progress, Chip } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useLanguage } from '../contexts/LanguageContext';
import { BasicOrderInfo, ExtendedOrderInfo, CompleteOrderInfo, OrderProcessingPhase, OrderStatus } from '../types';
import { OrderService } from '../utils/orderService';
import SuggestionInput from './SuggestionInput'; // 导入 SuggestionInput 组件

/**
 * Sidebar 组件的属性接口
 */
interface SidebarProps {
  /** 基本订单信息 */
  basicOrderInfo: BasicOrderInfo;
  /** 更新基本订单信息的回调 */
  onBasicOrderUpdate: (field: keyof BasicOrderInfo, value: string) => void;
  
  /** 扩展订单信息 */
  extendedOrderInfo: ExtendedOrderInfo;
  /** 更新扩展订单信息的回调 */
  onExtendedOrderUpdate: (field: keyof ExtendedOrderInfo, value: string) => void;
  
  /** 当前处理阶段 */
  currentPhase: OrderProcessingPhase;
  
  /** 文件名列表 */
  fileList?: string[];
  /** 当前选中的文件名 */
  currentFile?: string;
  /** 文件选择回调 */
  onFileSelect?: (fileName: string) => void;
  
  /** 订单状态 */
  orderStatus?: OrderStatus | null;
  
  /** 生成扩展信息的回调 */
  onGenerateExtendedInfo?: () => void;
  /** 提交订单的回调 */
  onSubmitOrder?: () => void;
  /** 返回基本信息编辑的回调 */
  onBackToBasicInfo?: () => void;
  
  /** 是否处于编辑模式 */
  isEditMode?: boolean;
  /** 切换编辑模式的回调 */
  onToggleEditMode?: () => void;
  /** 保存并锁定的回调 */
  onSaveAndLock?: () => void;
  
  /** 当前文件索引 */
  currentFileIndex?: number;
  /** 文件总数 */
  totalFiles?: number;
  /** 是否显示 PDF 预览 */
  showPDFPreview?: boolean;
  /** 切换视图的回调 */
  onToggleView?: () => void;
  /** 是否可以切换视图 */
  canToggleView?: boolean;
  
  /** 是否正在加载基本信息 */
  isLoading?: boolean;
  /** 是否正在生成内部编号 */
  isGeneratingCodes?: boolean;
  /** 是否正在提交订单 */
  isSubmittingOrder?: boolean;
}

/**
 * 侧边栏组件
 * 
 * @description 负责展示订单信息、处理用户输入和操作。
 */
const Sidebar: React.FC<SidebarProps> = ({ 
  basicOrderInfo,
  onBasicOrderUpdate,
  extendedOrderInfo,
  onExtendedOrderUpdate,
  currentPhase,
  fileList = [], 
  currentFile = '', 
  onFileSelect, 
  orderStatus,
  onGenerateExtendedInfo,
  onSubmitOrder,
  onBackToBasicInfo,
  isEditMode = false,
  onToggleEditMode,
  onSaveAndLock,
  currentFileIndex = -1,
  totalFiles = 0,
  showPDFPreview = false,
  onToggleView,
  canToggleView = false,
  isLoading = false,
  isGeneratingCodes = false,
  isSubmittingOrder = false,
}) => {
  const { t, language } = useLanguage();

  
  /**
   * 渲染基本信息输入字段
   * @param field 字段名
   * @param label 标签文本
   * @param icon 图标
   * @param type 输入框类型
   */
  const renderBasicInputField = (
    field: keyof BasicOrderInfo,
    label: string,
    icon: string,
    type: string = 'text'
  ) => {
    const value = isLoading ? '' : basicOrderInfo[field];
    const isEmpty = value === '-' || value === '';
    const isSubmitted = orderStatus?.isSubmitted && orderStatus?.phase === 'submitted';
    
    // 对特定字段使用 SuggestionInput
    if (field === 'soldToName' || field === 'shipToName' || field === 'vendorName') {
    // if (field === 'soldToName') {
      return (
        <div className="mb-4 relative">
          <div className="flex items-center justify-between mb-1">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Icon icon={icon} className="flex-shrink-0 text-primary" />
              <span>{label}</span>
            </label>
          </div>
          <SuggestionInput
            value={value}
            onChange={(newValue) => onBasicOrderUpdate(field, newValue)}
            isReadOnly={currentPhase !== 'basic_info' || isLoading}
            placeholder={isLoading ? "正在提取..." : `${t.edit} ${label}`}
            isLoading={isLoading}
          />
        </div>
      );
    }

    return (
      <div className="mb-4 relative">
        <div className="flex items-center justify-between mb-1">
          <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <Icon icon={icon} className="flex-shrink-0 text-primary" />
            <span>{label}</span>
          </label>
          
        </div>
        <Input
          type={type}
          value={value}
          onChange={(e) => onBasicOrderUpdate(field, e.target.value)}
          placeholder={isLoading ? "正在提取..." : `${t.edit} ${label}`}
          className={`w-full rounded-lg ${isEmpty ? 'bg-blue-50 rounded-lg' : ''} ${isSubmitted ? 'bg-green-50' : ''}`}
          size="sm"
          isDisabled={currentPhase !== 'basic_info' || isLoading}
          aria-label={`${label} 输入框`}
          startContent={
            isLoading ? (
              <Icon icon="lucide:loader-2" className="animate-spin text-primary" />
            ) : null
          }
        />
      </div>
    );
  };

  /**
   * 渲染扩展信息输入字段
   * @param field 字段名
   * @param label 标签文本
   * @param icon 图标
   * @param type 输入框类型
   */
  const renderExtendedInputField = (
    field: keyof ExtendedOrderInfo,
    label: string,
    icon: string,
    type: string = 'text'
  ) => {
    const value = isGeneratingCodes ? '' : extendedOrderInfo[field];
    const isEmpty = value === '-' || value === '';
    const isSubmitted = orderStatus?.isSubmitted && orderStatus?.phase === 'submitted';
    
    return (
      <div className="mb-4 relative">
        <div className="flex items-center justify-between mb-1">
          <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <Icon icon={icon} className="flex-shrink-0 text-primary" />
            <span>{label}</span>
          </label>
          
        </div>
        <Input
          type={type}
          value={value}
          onChange={(e) => onExtendedOrderUpdate(field, e.target.value)}
          placeholder={isGeneratingCodes ? "正在生成..." : `${t.edit} ${label}`}
          className={`w-full rounded-lg ${isEmpty ? 'bg-red-50' : ''} ${isSubmitted ? 'bg-green-50' : ''}`}
          size="sm"
          isDisabled={currentPhase !== 'extended_info' || isGeneratingCodes}
          aria-label={`${label} 输入框`}
          startContent={
            isGeneratingCodes ? (
              <Icon icon="lucide:loader-2" className="animate-spin text-primary" />
            ) : null
          }
        />
      </div>
    );
  };

  /**
   * 渲染只读字段（在提交后或非编辑模式下）
   * @param value 字段值
   * @param label 标签文本
   * @param icon 图标
   * @param field 字段名，用于编辑模式
   * @param onUpdate 更新回调，用于编辑模式
   */
  const renderDisplayField = (
    value: string,
    label: string,
    icon: string,
    field?: keyof BasicOrderInfo | keyof ExtendedOrderInfo,
    onUpdate?: (field: any, value: string) => void
  ) => {
    // 对特定字段在编辑模式下使用 SuggestionInput
    if (isEditMode && field && onUpdate && (field === 'soldToName' || field === 'shipToName' )) {
      return (
        <div className="mb-4 relative">
          <label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
            <Icon icon={icon} className="flex-shrink-0 text-primary" />
            <span>{label}</span>
          </label>
          <SuggestionInput
            value={value}
            onChange={(newValue) => onUpdate(field, newValue)}
            placeholder={`编辑 ${label}`}
          />
        </div>
      );
    }
    
    if (isEditMode && field && onUpdate) {
      // 编辑模式：显示为可编辑的输入框
      return (
        <div className="mb-4 relative">
          <label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
            <Icon icon={icon} className="flex-shrink-0 text-primary" />
            <span>{label}</span>
          </label>
          <Input
            type="text"
            value={value}
            onChange={(e) => onUpdate(field, e.target.value)}
            placeholder={`编辑 ${label}`}
            className="w-full rounded-lg"
            size="sm"
            aria-label={`${label} 输入框`}
          />
        </div>
      );
    } else {
      // 只读模式：显示为只读框
      return (
        <div className="mb-4">
          <label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
            <Icon icon={icon} className="flex-shrink-0 text-primary" />
            <span>{label}</span>
          </label>
          <div className="p-2 border rounded-md min-h-[32px] text-sm bg-gray-50 border-gray-200">
            {value || '-'}
          </div>
        </div>
      );
    }
  };

  /**
   * 渲染一个带有标题和分割线的区域
   * @param title 区域标题
   * @param icon 区域图标
   * @param children 子组件
   */
  const renderSection = (title: string, icon: string, children: React.ReactNode) => (
    <div className="mb-6">
      <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 text-primary">
        <Icon icon={icon} className="flex-shrink-0 text-lg" />
        <span>{title}</span>
      </h3>
      {children}
      <Divider className="mt-4" />
    </div>
  );

  /**
   * 根据当前阶段获取标题和图标
   * @returns 包含标题和图标的对象
   */
  const getPhaseInfo = () => {
    switch (currentPhase) {
      case 'basic_info':
        return { title: t.basicInfoPhase, icon: 'lucide:clipboard-list' };
      case 'extended_info':
        return { title: t.extendedInfoPhase, icon: 'lucide:settings' };
      case 'submitted':
        return { title: t.submittedPhase, icon: 'lucide:check-circle' };
      default:
        return { title: t.basicInfoPhase, icon: 'lucide:clipboard-list' };
    }
  };

  const phaseInfo = getPhaseInfo();

  /**
   * 根据订单处理阶段获取状态芯片的颜色
   * @param phase 订单处理阶段
   * @returns 颜色字符串
   */
  const getStatusChipColor = (phase: OrderProcessingPhase) => {
    switch (phase) {
      case 'basic_info': return 'warning';
      case 'extended_info': return 'primary';
      case 'submitted': return 'success';
      default: return 'default';
    }
  };

  return (
    <Card aria-label="导航侧边栏" className="w-80 flex-shrink-0 h-full rounded-md shadow-md mr-4 bg-white overflow-y-auto">
      <CardBody className="p-6 flex flex-col">
        {/* 标题和状态 */}
        <div className="mb-6">
          <h2 className="text-xl font-bold mb-3 text-primary flex items-center gap-2">
            <Icon icon={phaseInfo.icon} className="flex-shrink-0 text-xl" />
            <span>{phaseInfo.title}</span>
          </h2>
        </div>

        {/* 文件选择下拉框 */}
        {fileList.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <label id="file-select-label" className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <Icon icon="lucide:file-search" className="flex-shrink-0 text-primary" />
                  <span>{t.currentFile}</span>
                </label>
                <Select
                  selectedKeys={currentFile ? [currentFile] : []}
                  value={currentFile || undefined}
                  onSelectionChange={(keys) => {
                    const selectedFile = Array.from(keys)[0] as string;
                    if (selectedFile && onFileSelect) {
                      onFileSelect(selectedFile);
                    }
                  }}
                  placeholder={currentFile ? undefined : t.selectFile2}
                  className="w-full"
                  aria-labelledby="file-select-label"
                  aria-label={t.selectFile2}
                  classNames={{
                    trigger: "bg-gray-50 border-gray-200 hover:bg-gray-100 flex items-center justify-between h-10",
                    value: "flex items-center gap-2 rounded-lg",
                    popoverContent: "bg-white shadow-lg border border-gray-200",
                    listbox: "bg-white rounded-lg",
                    innerWrapper: "flex items-center gap-2",
                    selectorIcon: "flex items-center"
                  }}
                  startContent={<Icon icon="lucide:folder" className="text-gray-500 flex-shrink-0 rounded-lg" />}
                >
                  {fileList.map((fileName) => {
                    // 检查文件是否已提交
                    const isFileSubmitted = OrderService.isOrderSubmitted(fileName);
                    
                    return (
                      <SelectItem 
                        key={fileName}
                        aria-label={`${fileName}`}
                        classNames={{
                          base: `hover:bg-primary/10 data-[selected=true]:bg-primary/20 ${isFileSubmitted ? 'text-green-600 font-medium' : ''}`
                        }}
                      >
                        <div className="flex items-center gap-2">
                          {fileName}
                          {isFileSubmitted && (
                            <Icon icon="lucide:check-circle" className="text-green-500 text-sm" />
                          )}
                        </div>
                      </SelectItem>
                    );
                  })}
                </Select>
              </div>
              
            </div>
            
            {/* 文件进度 */}
            {totalFiles > 0 && (
              <div className="mt-3">
                {(() => {
                  const submittedCount = fileList.filter(fileName => OrderService.isOrderSubmitted(fileName)).length;
                  return (
                    <>
                      <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>{t.fileProgress}</span>
                        <span>{submittedCount} / {totalFiles}</span>
                      </div>
                      <Progress 
                        value={(submittedCount / totalFiles) * 100} 
                        className="w-full"
                        color="primary"
                        size="sm"
                        aria-label={`文件处理进度: ${submittedCount} / ${totalFiles}`}
                      />
                    </>
                  );
                })()}
              </div>
            )}
            
            <Divider className="mt-4" />
          </div>
        )}
        
        <div className="flex-1 overflow-y-auto">
          {/* 已提交状态 - 显示所有信息为只读 */}
          {currentPhase === 'submitted' && (
            <>
              {/* 基本信息 */}
              {renderSection(
                t.basicInfo,
                'lucide:user',
                <>
                  {renderDisplayField(basicOrderInfo.soldToName, t.soldToName, 'lucide:user', 'soldToName', onBasicOrderUpdate)}
                  {renderDisplayField(basicOrderInfo.soldToAddress, t.soldToAddress, 'lucide:home', 'soldToAddress', onBasicOrderUpdate)}
                  {renderDisplayField(basicOrderInfo.shipToName, t.shipToName, 'lucide:truck', 'shipToName', onBasicOrderUpdate)}
                  {renderDisplayField(basicOrderInfo.shipToAddress, t.shipToAddress, 'lucide:map', 'shipToAddress', onBasicOrderUpdate)}
                  {renderDisplayField(basicOrderInfo.vendorName, t.vendorName, 'lucide:briefcase', 'vendorName', onBasicOrderUpdate)}
                  {renderDisplayField(basicOrderInfo.vendorAddress, t.vendorAddress, 'lucide:building', 'vendorAddress', onBasicOrderUpdate)}
                  {renderDisplayField(basicOrderInfo.poNumber, t.poNumber, 'lucide:hash', 'poNumber', onBasicOrderUpdate)}
                  {renderDisplayField(basicOrderInfo.poDate, t.poDate, 'lucide:calendar', 'poDate', onBasicOrderUpdate)}
                  {renderDisplayField(basicOrderInfo.deliveryDate, t.deliveryDate, 'lucide:clock', 'deliveryDate', onBasicOrderUpdate)}
                  {renderDisplayField(basicOrderInfo.itemNumber, t.itemNumber, 'lucide:barcode', 'itemNumber', onBasicOrderUpdate)}
                  {renderDisplayField(basicOrderInfo.itemName, t.itemName, 'lucide:tag', 'itemName', onBasicOrderUpdate)}
                  {renderDisplayField(basicOrderInfo.itemQuantity, t.itemQuantity, 'lucide:plus', 'itemQuantity', onBasicOrderUpdate)}
                  {renderDisplayField(basicOrderInfo.unitOfMeasure, t.unitOfMeasure, 'lucide:ruler', 'unitOfMeasure', onBasicOrderUpdate)}
                  {renderDisplayField(basicOrderInfo.unitPrice, t.unitPrice, 'lucide:dollar-sign', 'unitPrice', onBasicOrderUpdate)}
                </>
              )}

              {/* 扩展信息 */}
              {renderSection(
                t.extendedInfo,
                'lucide:settings',
                <>
                  {renderDisplayField(extendedOrderInfo.arkemaSoldToCode, t.arkemaSoldToCode, 'lucide:code', 'arkemaSoldToCode', onExtendedOrderUpdate)}
                  {renderDisplayField(extendedOrderInfo.arkemaShipToCode, t.arkemaShipToCode, 'lucide:code', 'arkemaShipToCode', onExtendedOrderUpdate)}
                  {renderDisplayField(extendedOrderInfo.vendorSalesArea, t.vendorSalesArea, 'lucide:globe', 'vendorSalesArea', onExtendedOrderUpdate)}
                  {renderDisplayField(extendedOrderInfo.deliveryByDate, t.deliveryByDate, 'lucide:clock', 'deliveryByDate', onExtendedOrderUpdate)}
                  {renderDisplayField(extendedOrderInfo.lineNumber, t.lineNumber, 'lucide:list-ordered', 'lineNumber', onExtendedOrderUpdate)}
                  {renderDisplayField(extendedOrderInfo.arkemaProductCode, t.arkemaProductCode, 'lucide:code', 'arkemaProductCode', onExtendedOrderUpdate)}
                </>
              )}
            </>
          )}

          {/* 基本信息阶段 */}
          {currentPhase === 'basic_info' && (
            <>
              {renderSection(
                t.addressInfo,
                'lucide:map-pin',
                <>
                  {renderBasicInputField('soldToName', t.soldToName, 'lucide:user')}
                  {renderBasicInputField('soldToAddress', t.soldToAddress, 'lucide:home')}
                  {renderBasicInputField('shipToName', t.shipToName, 'lucide:truck')}
                  {renderBasicInputField('shipToAddress', t.shipToAddress, 'lucide:map')}
                  {renderBasicInputField('vendorName', t.vendorName, 'lucide:briefcase')}
                  {renderBasicInputField('vendorAddress', t.vendorAddress, 'lucide:building')}
                </>
              )}

              {renderSection(
                t.orderInfo,
                'lucide:file-text',
                <>
                  {renderBasicInputField('poNumber', t.poNumber, 'lucide:hash')}
                  {renderBasicInputField('poDate', t.poDate, 'lucide:calendar', 'date')}
                  {renderBasicInputField('deliveryDate', t.deliveryDate, 'lucide:clock', 'date')}
                </>
              )}

              {renderSection(
                t.itemInfo,
                'lucide:package',
                <>
                  {renderBasicInputField('itemNumber', t.itemNumber, 'lucide:barcode')}
                  {renderBasicInputField('itemName', t.itemName, 'lucide:tag')}
                  {renderBasicInputField('itemQuantity', t.itemQuantity, 'lucide:plus', 'number')}
                  {renderBasicInputField('unitOfMeasure', t.unitOfMeasure, 'lucide:ruler')}
                  {renderBasicInputField('unitPrice', t.unitPrice, 'lucide:dollar-sign', 'number')}
                </>
              )}
            </>
          )}

          {/* 扩展信息阶段 */}
          {currentPhase === 'extended_info' && (
            <>
              {/* 显示基本信息（只读） */}
              {renderSection(
                t.basicInfo,
                'lucide:check',
                <>
                  {renderDisplayField(basicOrderInfo.soldToName, t.soldToName, 'lucide:user')}
                  {renderDisplayField(basicOrderInfo.soldToAddress, t.soldToAddress, 'lucide:home')}
                  {renderDisplayField(basicOrderInfo.shipToName, t.shipToName, 'lucide:truck')}
                  {renderDisplayField(basicOrderInfo.shipToAddress, t.shipToAddress, 'lucide:map')}
                  {renderDisplayField(basicOrderInfo.vendorName, t.vendorName, 'lucide:briefcase')}
                  {renderDisplayField(basicOrderInfo.vendorAddress, t.vendorAddress, 'lucide:building')}
                  {renderDisplayField(basicOrderInfo.poNumber, t.poNumber, 'lucide:hash')}
                  {renderDisplayField(basicOrderInfo.poDate, t.poDate, 'lucide:calendar')}
                  {renderDisplayField(basicOrderInfo.deliveryDate, t.deliveryDate, 'lucide:clock')}
                  {renderDisplayField(basicOrderInfo.itemNumber, t.itemNumber, 'lucide:barcode')}
                  {renderDisplayField(basicOrderInfo.itemName, t.itemName, 'lucide:tag')}
                  {renderDisplayField(basicOrderInfo.itemQuantity, t.itemQuantity, 'lucide:plus')}
                  {renderDisplayField(basicOrderInfo.unitOfMeasure, t.unitOfMeasure, 'lucide:ruler')}
                  {renderDisplayField(basicOrderInfo.unitPrice, t.unitPrice, 'lucide:dollar-sign')}
                </>
              )}

              {/* 扩展信息（可编辑） */}
              {renderSection(
                t.extendedInfo,
                'lucide:settings',
                <>
                  {renderExtendedInputField('arkemaSoldToCode', t.arkemaSoldToCode, 'lucide:code')}
                  {renderExtendedInputField('arkemaShipToCode', t.arkemaShipToCode, 'lucide:code')}
                  {renderExtendedInputField('vendorSalesArea', t.vendorSalesArea, 'lucide:globe')}
                  {renderExtendedInputField('deliveryByDate', t.deliveryByDate, 'lucide:clock', 'date')}
                  {renderExtendedInputField('lineNumber', t.lineNumber, 'lucide:list-ordered')}
                  {renderExtendedInputField('arkemaProductCode', t.arkemaProductCode, 'lucide:code')}
                </>
              )}
            </>
          )}
        </div>

        {/* 按钮区域 */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex gap-3">
            {/* 切换视图按钮 */}
            {canToggleView && onToggleView && (
              <Button 
                color="secondary" 
                size="lg" 
                className="flex-1 flex items-center justify-center gap-2 rounded-lg"
                variant="bordered"
                onPress={onToggleView}
                aria-label={showPDFPreview ? '切换到文件上传视图' : '切换到PDF预览视图'}
              >
                <Icon 
                  icon={showPDFPreview ? "lucide:upload" : "lucide:eye"} 
                  className="text-base"
                />
                <span>{showPDFPreview ? t.fileUpload : t.pdfPreview}</span>
              </Button>
            )}
            
            {/* 基本信息阶段按钮 */}
            {currentPhase === 'basic_info' && (
              <Button 
                color="primary" 
                size="lg" 
                className={`${canToggleView ? "flex-1" : "w-full"} flex items-center justify-center gap-2 rounded-lg text-white`}
                onPress={onGenerateExtendedInfo}
                isLoading={isGeneratingCodes}
                isDisabled={isLoading || isGeneratingCodes}
                aria-label="生成内部编号"
              >
                <Icon icon="lucide:settings" className="text-base text-white" />
                <span>{isGeneratingCodes ? t.generatingCodes : t.generateInternalCodes}</span>
              </Button>
            )}

            {/* 扩展信息阶段按钮 */}
            {currentPhase === 'extended_info' && (
              <>
                <Button 
                  color="secondary" 
                  size="lg" 
                  className="flex-1 flex items-center justify-center gap-2 rounded-lg"
                  variant="bordered"
                  onPress={onBackToBasicInfo}
                  isDisabled={isSubmittingOrder}
                  aria-label="返回基本信息编辑"
                >
                  <Icon icon="lucide:arrow-left" className="text-base" />
                  <span>{t.backToEdit}</span>
                </Button>
                <Button 
                  color="primary" 
                  size="lg" 
                  className="flex-1 flex items-center justify-center gap-2 rounded-lg text-white"
                  onPress={onSubmitOrder}
                  isLoading={isSubmittingOrder}
                  isDisabled={isSubmittingOrder}
                  aria-label="提交订单"
                >
                  <Icon icon="lucide:check" className="text-base text-white" />
                  <span>{isSubmittingOrder ? t.submittingOrder : t.confirmSubmit}</span>
                </Button>
              </>
            )}

            {/* 已提交状态按钮 */}
            {currentPhase === 'submitted' && (
              <Button 
                color="warning" 
                size="lg" 
                className="flex-1 flex items-center justify-center gap-2 rounded-lg"
                variant="bordered"
                onPress={onBackToBasicInfo}
                aria-label={"退回"}
              >
                <Icon icon="lucide:arrow-left-circle" className="text-base" />
                <span>{language === 'zh' ? '退回' : 'Return'}</span>
              </Button>
            )}
          </div>
        </div>
      </CardBody>
    </Card>
  );
};

export default Sidebar;