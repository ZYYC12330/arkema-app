import React, { useState } from 'react';
import { Card, CardBody, Input, Button, Divider, Select, SelectItem, Progress } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useLanguage } from '../contexts/LanguageContext';
import { OrderInfo } from '../types';

interface SidebarProps {
  orderInfo: OrderInfo;
  onOrderUpdate: (field: keyof OrderInfo, value: string) => void;
  fileList?: string[];
  currentFile?: string;
  onFileSelect?: (fileName: string) => void;
  onSubmit?: () => void;
  currentFileIndex?: number;
  totalFiles?: number;
  showPDFPreview?: boolean;
  onToggleView?: () => void;
  canToggleView?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  orderInfo, 
  onOrderUpdate, 
  fileList = [], 
  currentFile = '', 
  onFileSelect, 
  onSubmit,
  currentFileIndex = 0,
  totalFiles = 0,
  showPDFPreview = false,
  onToggleView,
  canToggleView = false
}) => {
  const { t } = useLanguage();
  const [viewMode, setViewMode] = useState<'edit' | 'verification'>('edit');

  const renderInputField = (
    field: keyof OrderInfo,
    label: string,
    icon: string,
    type: string = 'text'
  ) => (
    <div className="mb-4">
      <label className="text-sm font-medium text-gray-700 mb-1 flex items-center">
        <Icon icon={icon} className="mr-2 text-primary" />
        {label}
      </label>
      <Input
        type={type}
        value={orderInfo[field]}
        onChange={(e) => onOrderUpdate(field, e.target.value)}
        placeholder={`${t.edit} ${label}`}
        className="w-full"
        size="sm"
        isDisabled={viewMode === 'verification'}
      />
    </div>
  );

  const renderDisplayField = (
    field: keyof OrderInfo,
    label: string,
    icon: string
  ) => (
    <div className="mb-4">
      <label className="text-sm font-medium text-gray-700 mb-1 flex items-center">
        <Icon icon={icon} className="mr-2 text-primary" />
        {label}
      </label>
      <div className={`p-2 border rounded-md min-h-[32px] text-sm transition-all duration-500 ${
        viewMode === 'verification' 
          ? 'bg-primary/10 border-primary' 
          : 'bg-gray-50 border-gray-200'
      }`}>
        {orderInfo[field] || '-'}
      </div>
    </div>
  );

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

  const renderFieldForMode = (
    field: keyof OrderInfo,
    label: string,
    icon: string,
    type: string = 'text'
  ) => {
    return viewMode === 'edit' 
      ? renderInputField(field, label, icon, type)
      : renderDisplayField(field, label, icon);
  };

  const handleNextStep = () => {
    setViewMode('verification');
  };

  const handleBackToEdit = () => {
    setViewMode('edit');
  };

  const handleConfirmSubmit = () => {
    if (onSubmit) {
      onSubmit();
    }
    setViewMode('edit'); // 提交后重置为编辑模式
  };

  return (
    <Card className="w-1/3 h-full rounded-md shadow-md mr-4 bg-white overflow-y-auto">
      <CardBody className="p-6 flex flex-col">
        <h2 className="text-xl font-bold mb-6 text-primary flex items-center">
          <Icon icon={viewMode === 'edit' ? "lucide:clipboard-list" : "lucide:check-circle"} className="mr-2" />
          {viewMode === 'edit' ? t.extractedInfo : t.verification}
        </h2>

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
              isDisabled={viewMode === 'verification'}
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
              {fileList.map((fileName) => (
                <SelectItem 
                  key={fileName}
                  classNames={{
                    base: "hover:bg-primary/10 data-[selected=true]:bg-primary/20"
                  }}
                >
                  {fileName}
                </SelectItem>
              ))}
            </Select>
            
            {/* 文件进度 */}
            {totalFiles > 0 && (
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
                />
              </div>
            )}
            
            <Divider className="mt-4" />
          </div>
        )}
        
        <div className="flex-1 overflow-y-auto">

        {/* 地址信息 */}
        {renderSection(
          t.addressInfo,
          'lucide:map-pin',
          <>
            {renderFieldForMode('soldToName', t.soldToName, 'lucide:user')}
            {renderFieldForMode('soldToAddress', t.soldToAddress, 'lucide:home')}
            {renderFieldForMode('arkemaSoldToCode', t.arkemaSoldToCode, 'lucide:code')}
            {renderFieldForMode('shipToName', t.shipToName, 'lucide:truck')}
            {renderFieldForMode('shipToAddress', t.shipToAddress, 'lucide:map')}
            {renderFieldForMode('arkemaShipToCode', t.arkemaShipToCode, 'lucide:code')}
            {renderFieldForMode('vendorName', t.vendorName, 'lucide:briefcase')}
            {renderFieldForMode('vendorAddress', t.vendorAddress, 'lucide:building')}
            {renderFieldForMode('vendorSalesArea', t.vendorSalesArea, 'lucide:globe')}
          </>
        )}

        {/* 订单信息 */}
        {renderSection(
          t.orderInfo,
          'lucide:file-text',
          <>
            {renderFieldForMode('poNumber', t.poNumber, 'lucide:hash')}
            {renderFieldForMode('poDate', t.poDate, 'lucide:calendar', 'date')}
            {renderFieldForMode('deliveryDate', t.deliveryDate, 'lucide:clock', 'date')}
            {renderFieldForMode('deliveryByDate', t.deliveryByDate, 'lucide:clock', 'date')}
          </>
        )}

        {/* 商品信息 */}
         {renderSection(
           t.itemInfo,
           'lucide:package',
           <>
             {renderFieldForMode('lineNumber', t.lineNumber, 'lucide:list-ordered')}
             {renderFieldForMode('itemNumber', t.itemNumber, 'lucide:barcode')}
             {renderFieldForMode('itemName', t.itemName, 'lucide:tag')}
             {renderFieldForMode('arkemaProductCode', t.arkemaProductCode, 'lucide:code')}
             {renderFieldForMode('itemQuantity', t.itemQuantity, 'lucide:plus', 'number')}
             {renderFieldForMode('unitOfMeasure', t.unitOfMeasure, 'lucide:ruler')}
             {renderFieldForMode('unitPrice', t.unitPrice, 'lucide:dollar-sign', 'number')}
           </>
         )}
        </div>

        {/* 按钮区域 */}
        {onSubmit && (
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="flex gap-3">
              {/* 切换视图按钮 */}
              {canToggleView && onToggleView && viewMode === 'edit' && (
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
              
              {/* 编辑模式按钮 */}
              {viewMode === 'edit' && (
                <Button 
                  color="primary" 
                  size="lg" 
                  className={`${canToggleView ? "flex-1" : "w-full"} flex items-center justify-center gap-2 h-8 rounded-lg text-white`}
                  onPress={handleNextStep}
                  aria-label="进入核对界面"
                >
                  <Icon icon="lucide:arrow-right" className="text-base text-white" />
                  <span>{t.nextStep}</span>
                </Button>
              )}

              {/* 核对模式按钮 */}
              {viewMode === 'verification' && (
                <>
                  <Button 
                    color="secondary" 
                    size="lg" 
                    className="flex-1 flex items-center justify-center gap-2 rounded-lg"
                    variant="bordered"
                    onPress={handleBackToEdit}
                    aria-label="返回编辑界面"
                  >
                    <Icon icon="lucide:arrow-left" className="text-base" />
                    <span>{t.backToEdit}</span>
                  </Button>
                  <Button 
                    color="primary" 
                    size="lg" 
                    className="flex-1 flex items-center justify-center gap-2 h-8 rounded-lg text-white"
                    onPress={handleConfirmSubmit}
                    aria-label="确认提交订单信息"
                  >
                    <Icon icon="lucide:check" className="text-base text-white" />
                    <span>{t.confirmSubmit}</span>
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  );
};

export default Sidebar;