import React from 'react';
import { Modal, ModalContent, ModalBody, Button, Chip } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useLanguage } from '../contexts/LanguageContext';

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileName?: string;
  orderInfo?: {
    poNumber?: string;
    vendorName?: string;
    itemName?: string;
    totalPrice?: string;
  };
}

const SuccessModal: React.FC<SuccessModalProps> = ({ isOpen, onClose, fileName, orderInfo }) => {
  const { t } = useLanguage();

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose}
      placement="center"
      backdrop="blur"
      classNames={{
        backdrop: "bg-gradient-to-t from-zinc-900/50 to-zinc-900/20 backdrop-opacity-30"
      }}
    >
      <ModalContent className="w-auto max-w-lg rounded-2xl overflow-hidden">
        {(onCloseModal) => (
          <ModalBody className="p-0 overflow-hidden">
            {/* 成功动画区域 */}
            <div className="relative bg-gradient-to-br from-green-50 to-emerald-50 p-8 text-center rounded-t-2xl">
              {/* 背景装饰 */}
              <div className="absolute inset-0 bg-gradient-to-br from-green-100/20 to-emerald-100/20 rounded-t-2xl"></div>
              
              {/* 成功图标动画 */}
              <div className="relative z-10 mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-lg animate-bounce">
                  <Icon 
                    icon="lucide:check" 
                    className="text-4xl text-white animate-pulse" 
                    aria-label="成功图标" 
                  />
                </div>
                
                {/* 扩散动画 */}
                <div className="absolute inset-0 w-20 h-20 bg-green-400 rounded-full mx-auto animate-ping opacity-20"></div>
                <div className="absolute inset-0 w-20 h-20 bg-green-400 rounded-full mx-auto animate-ping opacity-10" style={{ animationDelay: '0.5s' }}></div>
                <div className="absolute inset-0 w-20 h-20 bg-green-400 rounded-full mx-auto animate-ping opacity-5" style={{ animationDelay: '1s' }}></div>
              </div>
              
              {/* 标题 */}
              <h3 className="text-2xl font-bold text-gray-900 mb-3 relative z-10 opacity-0 animate-[fadeIn_0.6s_ease-out_0s_forwards]">
                {t.submitSuccess}
              </h3>
              
              {/* 副标题 */}
              <p className="text-gray-600 mb-6 relative z-10 opacity-0 animate-[fadeIn_0.6s_ease-out_0.2s_forwards]">
                {t.submitSuccessMessage}
              </p>
              
              {/* 成功徽章 */}
              <Chip 
                color="success" 
                variant="flat"
                className="mb-6 opacity-0 animate-[fadeIn_0.6s_ease-out_0.4s_forwards] rounded-full"
                startContent={<Icon icon="lucide:check-circle" className="text-green-600" />}
              >
                订单已成功提交
              </Chip>
            </div>
            
            {/* 文件信息区域 */}
            {fileName && (
              <div className="bg-white p-6 border-b border-gray-100 opacity-0 animate-[slideUp_0.8s_ease-out_0.6s_forwards]">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold text-gray-900 flex items-center">
                    <Icon icon="lucide:file-text" className="mr-2 text-blue-500" aria-label="文件图标" />
                    处理文件
                  </h4>
                  <Chip color="primary" variant="flat" size="sm" className="rounded-full">
                    <Icon icon="lucide:check" className="mr-1" />
                    已完成
                  </Chip>
                </div>
                
                <div className="bg-gray-50 rounded-xl p-4 mb-4 border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Icon icon="lucide:file-pdf" className="text-red-500 mr-3 text-xl" />
                      <div>
                        <p className="font-medium text-gray-900">{fileName}</p>
                        <p className="text-sm text-gray-500">PDF 文档</p>
                      </div>
                    </div>
                    <Icon icon="lucide:check-circle" className="text-green-500 text-xl" />
                  </div>
                </div>
                
                {/* 订单信息摘要 */}
                {orderInfo && (
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {orderInfo.poNumber && (
                      <div className="bg-blue-50 rounded-xl p-3 border border-blue-200 hover:bg-blue-100 transition-colors">
                        <p className="text-gray-600 text-xs">采购订单号</p>
                        <p className="font-medium text-gray-900">{orderInfo.poNumber}</p>
                      </div>
                    )}
                    {orderInfo.vendorName && (
                      <div className="bg-green-50 rounded-xl p-3 border border-green-200 hover:bg-green-100 transition-colors">
                        <p className="text-gray-600 text-xs">供应商</p>
                        <p className="font-medium text-gray-900 truncate">{orderInfo.vendorName}</p>
                      </div>
                    )}
                    {orderInfo.itemName && (
                      <div className="bg-purple-50 rounded-xl p-3 border border-purple-200 hover:bg-purple-100 transition-colors">
                        <p className="text-gray-600 text-xs">商品名称</p>
                        <p className="font-medium text-gray-900 truncate">{orderInfo.itemName}</p>
                      </div>
                    )}
                    {orderInfo.totalPrice && (
                      <div className="bg-orange-50 rounded-xl p-3 border border-orange-200 hover:bg-orange-100 transition-colors">
                        <p className="text-gray-600 text-xs">总金额</p>
                        <p className="font-medium text-gray-900">¥{orderInfo.totalPrice}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
            
            {/* 操作按钮区域 */}
            <div className="bg-gray-50 p-6 rounded-b-2xl opacity-0 animate-[slideUp_0.8s_ease-out_0.8s_forwards]">
              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  color="primary" 
                  onPress={onCloseModal}
                  className="flex-1 transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl text-white"
                  size="lg"
                  aria-label="处理下一个文件"
                >
                  {t.nextFile}
                </Button>
                
                <Button 
                  color="default" 
                  variant="bordered"
                  onPress={onCloseModal}
                  className="flex-1 transition-all duration-200 hover:bg-gray-100 hover:scale-105 active:scale-95"
                  size="lg"
                  aria-label="关闭对话框"
                >
                  <Icon icon="lucide:x" className="mr-2" aria-label="关闭图标" />
                  关闭
                </Button>
              </div>
              
              {/* 提示信息 */}
              <p className="text-xs text-gray-500 text-center mt-4 opacity-0 animate-[fadeIn_0.6s_ease-out_1s_forwards]">
                <Icon icon="lucide:info" className="inline mr-1" />
                订单信息已保存到系统中，您可以继续处理其他文件
              </p>
            </div>
          </ModalBody>
        )}
      </ModalContent>
    </Modal>
  );
};

export default SuccessModal; 