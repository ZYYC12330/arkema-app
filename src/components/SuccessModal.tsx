import React from 'react';
import { Modal, ModalContent, ModalBody, Button } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useLanguage } from '../contexts/LanguageContext';

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileName?: string;
}

const SuccessModal: React.FC<SuccessModalProps> = ({ isOpen, onClose, fileName }) => {
  const { t } = useLanguage();

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose}
      placement="center"
      backdrop="blur"
      classNames={{
        backdrop: "bg-gradient-to-t from-zinc-900 to-zinc-900/10 backdrop-opacity-20"
      }}
    >
      <ModalContent className="w-auto max-w-md">
        {(onCloseModal) => (
          <ModalBody className="p-8 text-center">
            <div className="animate-bounce mb-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <Icon icon="lucide:check" className="text-3xl text-green-600" />
              </div>
            </div>
            
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {t.submitSuccess}
            </h3>
            
            <p className="text-gray-600 mb-4">
              {t.submitSuccessMessage}
            </p>
            
            {fileName && (
              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                <p className="text-sm text-gray-700 flex items-center justify-center">
                  <Icon icon="lucide:file" className="mr-2" />
                  {fileName}
                </p>
              </div>
            )}
            
            <div className="flex justify-center space-x-3">
              <Button 
                color="primary" 
                onPress={onCloseModal}
                className="animate-pulse"
              >
                <Icon icon="lucide:arrow-right" className="mr-2" />
                {t.nextFile}
              </Button>
            </div>
          </ModalBody>
        )}
      </ModalContent>
    </Modal>
  );
};

export default SuccessModal; 