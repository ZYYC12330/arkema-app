// 订单信息接口
export interface OrderInfo {
  id: string;
  soldToName: string;
  soldToAddress: string;
  shipToName: string;
  shipToAddress: string;
  vendorName: string;
  vendorAddress: string;
  soNumber: string;
  poDate: string;
  deliveryDate: string;
  itemNumber: string;
  itemName: string;
  itemQuantity: string;
  unitOfMeasure: string;
  unitPrice: string;
}

// 语言类型
export type Language = 'zh' | 'en';

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
  soNumber: string;
  poDate: string;
  deliveryDate: string;
  itemNumber: string;
  itemName: string;
  itemQuantity: string;
  unitOfMeasure: string;
  unitPrice: string;
  pdfPreview: string;
  zoomIn: string;
  zoomOut: string;
  download: string;
  pdfPreviewContent: string;
  edit: string;
  basicInfo: string;
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
} 