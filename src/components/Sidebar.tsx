import React from 'react';
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
      />
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

  return (
    <Card className="w-1/3 h-full rounded-md shadow-md mr-4 bg-white overflow-y-auto">
      <CardBody className="p-6 flex flex-col">
        <h2 className="text-xl font-bold mb-6 text-primary flex items-center">
          <Icon icon="lucide:clipboard-list" className="mr-2" />
          {t.extractedInfo}
        </h2>

        {/* 文件选择下拉框 */}
        {fileList.length > 0 && (
          <div className="mb-6">
            <label className="text-sm font-medium text-gray-700 mb-2 flex items-center">
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
            {renderInputField('soldToName', t.soldToName, 'lucide:user')}
            {renderInputField('soldToAddress', t.soldToAddress, 'lucide:home')}
            {renderInputField('shipToName', t.shipToName, 'lucide:truck')}
            {renderInputField('shipToAddress', t.shipToAddress, 'lucide:map')}
            {renderInputField('vendorName', t.vendorName, 'lucide:briefcase')}
            {renderInputField('vendorAddress', t.vendorAddress, 'lucide:building')}
          </>
        )}

        {/* 订单信息 */}
        {renderSection(
          t.orderInfo,
          'lucide:file-text',
          <>
            {renderInputField('soNumber', t.soNumber, 'lucide:hash')}
            {renderInputField('poDate', t.poDate, 'lucide:calendar', 'date')}
            {renderInputField('deliveryDate', t.deliveryDate, 'lucide:clock', 'date')}
          </>
        )}

        {/* 商品信息 */}
         {renderSection(
           t.itemInfo,
           'lucide:package',
           <>
             {renderInputField('itemNumber', t.itemNumber, 'lucide:barcode')}
             {renderInputField('itemName', t.itemName, 'lucide:tag')}
             {renderInputField('itemQuantity', t.itemQuantity, 'lucide:plus', 'number')}
             {renderInputField('unitOfMeasure', t.unitOfMeasure, 'lucide:ruler')}
             {renderInputField('unitPrice', t.unitPrice, 'lucide:dollar-sign', 'number')}
           </>
         )}
        </div>

        {/* 提交按钮 */}
        {onSubmit && (
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="flex gap-3">
              {/* 切换视图按钮 */}
              {canToggleView && onToggleView && (
                <Button 
                  color="secondary" 
                  size="lg" 
                  className="flex-1 flex items-center justify-center gap-2"
                  variant="bordered"
                  onPress={onToggleView}
                >
                  <Icon 
                    icon={showPDFPreview ? "lucide:upload" : "lucide:eye"} 
                    className="text-base"
                  />
                  <span>{showPDFPreview ? t.fileUpload : t.pdfPreview}</span>
                </Button>
              )}
              
              {/* 提交按钮 */}
              <Button 
                color="primary" 
                size="lg" 
                className={`${canToggleView ? "flex-1" : "w-full"} flex items-center justify-center gap-2 text-white`}
                onPress={onSubmit}
              >
                <Icon icon="lucide:send" className="text-base" />
                <span>{t.submit}</span>
              </Button>
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  );
};

export default Sidebar;