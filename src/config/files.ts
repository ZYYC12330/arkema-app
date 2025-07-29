import { BasicOrderInfo, CompleteOrderInfo } from "../types";
import { OrderService } from "../utils/orderService";

// 文件配置
export interface FileInfo {
  id: string;
  name: string;
  url: string;
  type: 'pdf' | 'doc' | 'docx' | 'xls' | 'xlsx' | 'jpg' | 'jpeg' | 'png';
  size?: number; // 文件大小（字节）
  description?: string;
}

// 支持的文件类型映射
const FILE_TYPE_MAP: Record<string, FileInfo['type']> = {
  'pdf': 'pdf',
  'doc': 'doc',
  'docx': 'docx',
  'xls': 'xls',
  'xlsx': 'xlsx',
  'jpg': 'jpg',
  'jpeg': 'jpeg',
  'png': 'png'
};

// 预定义的样例文件列表（这些文件需要手动上传到LangCore平台）

/**
 * 获取文件列表 - 现在返回空数组，因为我们将使用动态上传的文件
 * 不再依赖本地文件服务
 */
export const getFileList = async (): Promise<FileInfo[]> => {
  try {
    // 返回预定义的文件信息，但这些文件需要通过上传才能使用
    // 实际的文件URL将在上传后动态获取
    const fileList = await OrderService.getFileList();
    console.log('fileList', fileList);
    return fileList.map((item: CompleteOrderInfo) => {
      return {
        id: String(item.id),
        name: item.fileName,
        type: 'pdf',
        url: item.fileUrl,
        description: getFileDescription(item.fileName || ''),
        size: 0,
      } as FileInfo;
    });
    // return files
    //   .filter((fileName) => {
    //     const extension = fileName.toLowerCase().split('.').pop();
    //     return FILE_TYPE_MAP[extension as string];
    //   })
    //   .map((fileName, index) => {
    //     const extension = fileName.toLowerCase().split('.').pop() as string;
    //     return {
    //       id: String(index + 1),
    //       name: fileName,
    //       type: FILE_TYPE_MAP[extension],
    //       description: getFileDescription(fileName),
    //       url: '', // 将在文件上传后填充实际的LangCore URL
    //       size: 0, // 将在文件上传后填充实际大小
    //     };
    //   });
  } catch (error) {
    console.error('获取文件列表失败:', error);
    return [];
  }
};

/**
 * 根据文件名生成描述
 */
const getFileDescription = (fileName: string): string => {
  const name = fileName.toLowerCase();
  
  if (name.includes('arkema')) return 'Arkema 相关文档';
  if (name.includes('订单') || name.includes('order')) return '订单文档';
  if (name.includes('采购') || name.includes('purchase')) return '采购文档';
  if (name.includes('合同') || name.includes('contract')) return '合同文档';
  if (name.includes('产品') || name.includes('product')) return '产品文档';
  
  // 根据文件类型返回默认描述
  const extension = fileName.toLowerCase().split('.').pop();
  switch (extension) {
    case 'pdf': return 'PDF 文档';
    case 'xls':
    case 'xlsx': return 'Excel 表格';
    case 'jpg':
    case 'jpeg':
    case 'png': return '图片文件';
    default: return '文档文件';
  }
};

/**
 * 根据ID获取文件信息
 */
export const getFileById = async (id: string): Promise<FileInfo | undefined> => {
  const files = await getFileList();
  return files.find(file => file.id === id);
};

/**
 * 根据文件名获取文件信息
 */
export const getFileByName = async (name: string): Promise<FileInfo | undefined> => {
  const files = await getFileList();
  return files.find(file => file.name === name);
};

/**
 * 创建新的文件信息对象（用于动态上传的文件）
 */
export const createFileInfo = (
  file: File, 
  fileId: string, 
  url: string
): FileInfo => {
  const extension = file.name.toLowerCase().split('.').pop() as string;
  
  return {
    id: fileId,
    name: file.name,
    url: url,
    type: FILE_TYPE_MAP[extension] || 'pdf',
    size: file.size,
    description: getFileDescription(file.name)
  };
};
