// 订单信息接口
export interface OrderInfo {
  id: string;
  soldToName: string;
  soldToAddress: string;
  shipToName: string;
  shipToAddress: string;
  vendorName: string;
  vendorAddress: string;
  poNumber: string;
  poDate: string;
  deliveryDate: string;
  itemNumber: string;
  itemName: string;
  itemQuantity: string;
  unitOfMeasure: string;
  unitPrice: string;
  // 新增字段
  arkemaSoldToCode: string;
  arkemaShipToCode: string;
  arkemaProductCode: string;
}

// 订单处理阶段
export type OrderProcessingPhase = 'basic_info' | 'extended_info' | 'submitted';

// 基本订单信息（第一阶段提取的信息）
export interface BasicOrderInfo {
  id: string;
  soldToName: string;
  soldToAddress: string;
  shipToName: string;
  shipToAddress: string;
  vendorName: string;
  vendorAddress: string;
  poNumber: string;
  poDate: string;
  deliveryDate: string;
  itemNumber: string;
  itemName: string;
  itemQuantity: string;
  unitOfMeasure: string;
  unitPrice: string;
  totalPrice: string;
}

// 扩展订单信息（内部编号等）
export interface ExtendedOrderInfo {
  arkemaSoldToCode: string;
  arkemaShipToCode: string;
  arkemaProductCode: string;
}

// 完整订单信息
export interface CompleteOrderInfo extends BasicOrderInfo, ExtendedOrderInfo {
  phase: OrderProcessingPhase;
  isSubmitted: boolean;
  fileUrl?: string;
}

// 订单状态
export interface OrderStatus {
  fileName: string;
  phase: OrderProcessingPhase;
  isSubmitted: boolean;
  submittedAt?: string;
  lastModified?: string;
}

// 语言类型
export type Language = 'zh' | 'en';

// 上传状态枚举
export type UploadStatus = 'pending' | 'uploading' | 'completed' | 'failed' | 'processing';

// 上传队列项
export interface UploadQueueItem {
  id: string;
  file: File;
  status: UploadStatus;
  progress: number;
  error?: string;
  fileInfo?: {
    fileId: string;
    url: string;
    publicUrl?: string;
  };
  startTime?: number;
  endTime?: number;
}

// 上传队列状态
export interface UploadQueueState {
  items: UploadQueueItem[];
  isProcessing: boolean;
  completedCount: number;
  failedCount: number;
}

// 翻译文本接口
export interface TranslationTexts {
  appTitle: string;
  extractedInfo: string;
  soldToName: string;
  soldToAddress: string;
  shipToName: string;
  shipToAddress: string;
  vendorName: string;
  vendorAddress: string;
  poNumber: string;
  poDate: string;
  deliveryDate: string;
  itemNumber: string;
  itemName: string;
  itemQuantity: string;
  unitOfMeasure: string;
  unitPrice: string;
  totalPrice: string;
  // 新增字段翻译
  arkemaSoldToCode: string;
  arkemaShipToCode: string;
  arkemaProductCode: string;
  // 界面状态翻译
  nextStep: string;
  verification: string;
  backToEdit: string;
  confirmSubmit: string;
  // 新增：订单处理流程翻译
  basicInfo: string;
  extendedInfo: string;
  generateCodes: string;
  processingPhase: string;
  basicInfoPhase: string;
  extendedInfoPhase: string;
  submittedPhase: string;
  orderSubmitted: string;
  submittingOrder: string;
  generateInternalCodes: string;
  generatingCodes: string;
  viewSubmittedOrder: string;
  resubmitOrder: string;
  orderAlreadySubmitted: string;
  submissionSuccess: string;
  submissionFailed: string;
  returnToPreviousStep: string;
  aiSuggestion: string;
  pdfPreview: string;
  zoomIn: string;
  zoomOut: string;
  download: string;
  pdfPreviewContent: string;
  edit: string;
  addressInfo: string;
  orderInfo: string;
  itemInfo: string;
  // 文件上传相关
  fileUpload: string;
  uploadArea: string;
  uploadInstruction: string;
  supportedFormats: string;
  maxFileSize: string;
  selectFile: string;
  uploadSuccess: string;
  uploadError: string;
  fileName: string;
  fileSize: string;
  uploadAnother: string;
  processing: string;
  // 文件管理相关
  currentFile: string;
  selectFile2: string;
  submit: string;
  submitSuccess: string;
  submitSuccessMessage: string;
  nextFile: string;
  allFilesCompleted: string;
  fileProgress: string;
  // PDF 查看器相关
  selectPDFFile: string;
  loadError: string;
  
  // 多文件上传相关
  singleFileMode: string;
  multiFileMode: string;
  uploadQueue: string;
  queueEmpty: string;
  filesUploading: string;
  startUpload: string;
  pauseUpload: string;
  retryFailed: string;
  clearQueue: string;
  fileUploaded: string;
  selectFromQueue: string;
} 