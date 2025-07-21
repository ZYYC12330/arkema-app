// PDF 文件配置
export interface FileInfo {
  id: string;
  name: string;
  url: string;
  type: 'pdf' | 'doc' | 'docx' | 'xls' | 'xlsx';
  size?: number; // 文件大小（字节）
  description?: string;
}

// 真实的PDF文件列表
export const pdfFiles: FileInfo[] = [
  {
    id: '1',
    name: '4593133614 TMCHMA Arkema.PDF',
    url: '/src/data/4593133614 TMCHMA Arkema.PDF',
    type: 'pdf',
    description: 'Arkema TMCHMA 产品文档'
  },
  {
    id: '2', 
    name: 'PO 4500336692.pdf',
    url: '/src/data/PO 4500336692.pdf',
    type: 'pdf',
    description: '采购订单文档'
  },
  {
    id: '3',
    name: 'SEPL-ACL-052.pdf', 
    url: '/src/data/SEPL-ACL-052.pdf',
    type: 'pdf',
    description: 'SEPL ACL 文档'
  },
  {
    id: '4',
    name: 'YYBST003E.pdf',
    url: '/src/data/YYBST003E.pdf', 
    type: 'pdf',
    description: 'YYBST 产品文档'
  },
  {
    id: '5',
    name: '上海皓憬 Cleaner C8产品订货单0321.pdf',
    url: '/src/data/上海皓憬 Cleaner C8产品订货单0321.pdf',
    type: 'pdf',
    description: '上海皓憬订货单'
  },
  {
    id: '6', 
    name: '北京伟捷--订货单-20250325-013.pdf',
    url: '/src/data/北京伟捷--订货单-20250325-013.pdf',
    type: 'pdf',
    description: '北京伟捷订货单'
  },
  {
    id: '7',
    name: '北京宇鑫1.pdf',
    url: '/src/data/北京宇鑫1.pdf',
    type: 'pdf', 
    description: '北京宇鑫文档'
  },
  {
    id: '8',
    name: '扫描0499.pdf',
    url: '/src/data/扫描0499.pdf',
    type: 'pdf',
    description: '扫描文档'
  },
  {
    id: '9',
    name: '採購單號_2100000903_20250423_093808阿科瑪.pdf',
    url: '/src/data/採購單號_2100000903_20250423_093808阿科瑪.pdf', 
    type: 'pdf',
    description: '阿科瑪采购单'
  },
  {
    id: '10',
    name: '科创达3.pdf',
    url: '/src/data/科创达3.pdf',
    type: 'pdf',
    description: '科创达文档'
  },
  // 示例PDF文件（放在public目录）
  {
    id: 'sample',
    name: 'sample.pdf',
    url: '/documents/sample.pdf',
    type: 'pdf',
    description: '示例PDF文档'
  }
];

// 获取文件列表
export const getFileList = (): FileInfo[] => {
  return pdfFiles;
};

// 根据ID获取文件信息
export const getFileById = (id: string): FileInfo | undefined => {
  return pdfFiles.find(file => file.id === id);
};

// 根据文件名获取文件信息
export const getFileByName = (name: string): FileInfo | undefined => {
  return pdfFiles.find(file => file.name === name);
}; 