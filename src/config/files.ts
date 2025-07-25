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

/**
 * 动态获取文件列表
 * 从 public/documents 目录扫描文件
 */
export const getFileList = async (): Promise<FileInfo[]> => {
  try {
    // 获取 documents 目录下的文件列表
    const response = await fetch('/api/files');
    
    if (!response.ok) {
      throw new Error(`获取文件列表失败: ${response.statusText}`);
    }
    
    const files = await response.json();
    
    // 过滤支持的文件类型并转换为 FileInfo 格式
    return files
      .filter((file: any) => {
        const extension = file.name.toLowerCase().split('.').pop();
        return FILE_TYPE_MAP[extension];
      })
      .map((file: any, index: number) => {
        const extension = file.name.toLowerCase().split('.').pop();
        return {
          id: String(index + 1),
          name: file.name,
          url: `/documents/${file.name}`,
          type: FILE_TYPE_MAP[extension],
          size: file.size,
          description: getFileDescription(file.name)
        };
      });
  } catch (error) {
    console.error('动态获取文件列表失败:', error);
    // 如果动态获取失败，返回空数组
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
