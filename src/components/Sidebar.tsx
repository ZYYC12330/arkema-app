import React, { useState } from 'react';
import { Card, CardBody, Input, Button, Divider, Select, SelectItem, Progress, Chip } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useLanguage } from '../contexts/LanguageContext';
import { BasicOrderInfo, ExtendedOrderInfo, CompleteOrderInfo, OrderProcessingPhase, OrderStatus } from '../types';
import { OrderService } from '../utils/orderService';

interface SidebarProps {
  // 基本信息
  basicOrderInfo: BasicOrderInfo;
  onBasicOrderUpdate: (field: keyof BasicOrderInfo, value: string) => void;
  
  // 扩展信息
  extendedOrderInfo: ExtendedOrderInfo;
  onExtendedOrderUpdate: (field: keyof ExtendedOrderInfo, value: string) => void;
  
  // 处理阶段
  currentPhase: OrderProcessingPhase;
  
  // 文件管理
  fileList?: string[];
  currentFile?: string;
  onFileSelect?: (fileName: string) => void;
  
  // 订单状态
  orderStatus?: OrderStatus | null;
  
  // 操作回调
  onGenerateExtendedInfo?: () => void;
  onSubmitOrder?: () => void;
  onBackToBasicInfo?: () => void;
  
  // UI状态
  currentFileIndex?: number;
  totalFiles?: number;
  showPDFPreview?: boolean;
  onToggleView?: () => void;
  canToggleView?: boolean;
  
  // 加载状态
  isLoading?: boolean;
  isGeneratingCodes?: boolean;
  isSubmittingOrder?: boolean;
}

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
  currentFileIndex = -1,
  totalFiles = 0,
  showPDFPreview = false,
  onToggleView,
  canToggleView = false,
  isLoading = false,
  isGeneratingCodes = false,
  isSubmittingOrder = false,
}) => {
  const { t } = useLanguage();

  // 渲染基本信息输入字段
  const renderBasicInputField = (
    field: keyof BasicOrderInfo,
    label: string,
    icon: string,
    type: string = 'text'
  ) => {
    const value = isLoading ? '' : basicOrderInfo[field];
    const isEmpty = value === '-' || value === '';
    const isSubmitted = orderStatus?.isSubmitted && orderStatus?.phase === 'submitted';
    
    return (
      <div className="mb-4 relative">
        <div className="flex items-center justify-between mb-1">
          <label className="text-sm font-medium text-gray-700 flex items-center">
            <Icon icon={icon} className="mr-2 text-primary" />
            {label}
          </label>
          {isEmpty && (
            <div className="flex items-center text-xs text-red-500">
              <Icon icon="lucide:alert-circle" className="mr-1" />
              此字段不能为空
            </div>
          )}
        </div>
        <Input
          type={type}
          value={value}
          onChange={(e) => onBasicOrderUpdate(field, e.target.value)}
          placeholder={isLoading ? "正在提取..." : `${t.edit} ${label}`}
          className={`w-full rounded-lg ${isEmpty ? 'bg-red-50' : ''} ${isSubmitted ? 'bg-green-50' : ''}`}
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

  // 渲染扩展信息输入字段
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
          <label className="text-sm font-medium text-gray-700 flex items-center">
            <Icon icon={icon} className="mr-2 text-primary" />
            {label}
          </label>
          {isEmpty && (
            <div className="flex items-center text-xs text-red-500">
              <Icon icon="lucide:alert-circle" className="mr-1" />
              此字段不能为空
            </div>
          )}
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

  // 渲染只读字段（已提交状态）
  const renderDisplayField = (
    value: string,
    label: string,
    icon: string
  ) => (
    <div className="mb-4">
      <label className="text-sm font-medium text-gray-700 mb-1 flex items-center">
        <Icon icon={icon} className="mr-2 text-primary" />
        {label}
      </label>
      <div className="p-2 border rounded-md min-h-[32px] text-sm bg-gray-50 border-gray-200">
        {value || '-'}
      </div>
    </div>
  );

  // 渲染章节
  const renderSection = (title: string, icon: string, children: React.ReactNode) => (
    <div className="mb-6">
      <h3 className="text-lg font-semibold mb-3 flex items-center text-primary">
        <Icon icon={icon} className="mr-2" />
        {title}
      </h3>
      {children}
      <Divider className="mt-4" />
    </div>
  );

  // 获取当前阶段的标题和图标
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

  // 获取状态芯片的颜色
  const getStatusChipColor = (phase: OrderProcessingPhase) => {
    switch (phase) {
      case 'basic_info': return 'warning';
      case 'extended_info': return 'primary';
      case 'submitted': return 'success';
      default: return 'default';
    }
  };

  return (
    <Card aria-label="导航侧边栏" className="w-1/3 h-full rounded-md shadow-md mr-4 bg-white overflow-y-auto">
      <CardBody className="p-6 flex flex-col">
        {/* 标题和状态 */}
        <div className="mb-6">
          <h2 className="text-xl font-bold mb-3 text-primary flex items-center">
            <Icon icon={phaseInfo.icon} className="mr-2" />
            {phaseInfo.title}
          </h2>
          
          {orderStatus && (
            <Chip 
              color={getStatusChipColor(orderStatus.phase)}
              variant="flat"
              size="sm"
              startContent={<Icon icon="lucide:clock" className="text-xs" />}
            >
              {orderStatus.phase === 'basic_info' && t.basicInfoPhase}
              {orderStatus.phase === 'extended_info' && t.extendedInfoPhase}
              {orderStatus.phase === 'submitted' && t.submittedPhase}
            </Chip>
          )}
        </div>

        {/* 文件选择下拉框 */}
        {fileList.length > 0 && (
          <div className="mb-6">
            <label id="file-select-label" className="text-sm font-medium text-gray-700 mb-2 flex items-center">
              <Icon icon="lucide:file-search" className="mr-2 text-primary" />
              {t.currentFile}
            </label>
            <Select
              selectedKeys={currentFile ? [currentFile] : []}
              onSelectionChange={(keys) => {
                const selectedFile = Array.from(keys)[0] as string;
                if (selectedFile && onFileSelect) {
                  onFileSelect(selectedFile);
                }
              }}
              placeholder={t.selectFile2}
              className="w-full"
              isDisabled={currentPhase === 'submitted'}
              aria-labelledby="file-select-label"
              aria-label={t.selectFile2}
              classNames={{
                trigger: "bg-gray-50 border-gray-200 hover:bg-gray-100 flex items-center justify-between h-10",
                value: "flex items-center gap-2",
                popoverContent: "bg-white shadow-lg border border-gray-200",
                listbox: "bg-white",
                innerWrapper: "flex items-center gap-2",
                selectorIcon: "flex items-center"
              }}
              startContent={<Icon icon="lucide:folder" className="text-gray-500 flex-shrink-0" />}
            >
              {fileList.map((fileName) => {
                // 检查文件是否已提交
                const isFileSubmitted = OrderService.isOrderSubmitted(fileName);
                
                return (
                  <SelectItem 
                    key={fileName}
                    aria-label={`选择文件 ${fileName}`}
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
            
            {/* 文件进度 */}
            {totalFiles > 0 && currentFileIndex !== -1 && (
              <div className="mt-3">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>{t.fileProgress}</span>
                  <span>{currentFileIndex + 1} / {totalFiles}</span>
                </div>
                <Progress 
                  value={(currentFileIndex + 1) / totalFiles * 100} 
                  className="w-full"
                  color="primary"
                  size="sm"
                  aria-label={`文件处理进度: ${currentFileIndex + 1} / ${totalFiles}`}
                />
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

              {/* 扩展信息 */}
              {renderSection(
                t.extendedInfo,
                'lucide:settings',
                <>
                  {renderDisplayField(extendedOrderInfo.arkemaSoldToCode, t.arkemaSoldToCode, 'lucide:code')}
                  {renderDisplayField(extendedOrderInfo.arkemaShipToCode, t.arkemaShipToCode, 'lucide:code')}
                  {renderDisplayField(extendedOrderInfo.vendorSalesArea, t.vendorSalesArea, 'lucide:globe')}
                  {renderDisplayField(extendedOrderInfo.deliveryByDate, t.deliveryByDate, 'lucide:clock')}
                  {renderDisplayField(extendedOrderInfo.lineNumber, t.lineNumber, 'lucide:list-ordered')}
                  {renderDisplayField(extendedOrderInfo.arkemaProductCode, t.arkemaProductCode, 'lucide:code')}
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
            {canToggleView && onToggleView && currentPhase !== 'submitted' && (
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
                color="success" 
                size="lg" 
                className="w-full flex items-center justify-center gap-2 rounded-lg text-white"
                isDisabled={true}
                aria-label="订单已提交"
              >
                <Icon icon="lucide:check-circle" className="text-base text-white" />
                <span>{t.orderSubmitted}</span>
              </Button>
            )}
          </div>
        </div>
      </CardBody>
    </Card>
  );
};

export default Sidebar;