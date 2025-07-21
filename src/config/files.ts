// 文件配置
export interface FileInfo {
  id: string;
  name: string;
  url: string;
  type: 'pdf' | 'doc' | 'docx' | 'xls' | 'xlsx' | 'jpg' | 'jpeg' | 'png';
  size?: number; // 文件大小（字节）
  description?: string;
}

// 所有支持的文件列表
export const allFiles: FileInfo[] = [
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
  },
  
  // 图片文件
  {
    id: '11',
    name: '万尼贝尔.jpg',
    url: '/src/data/万尼贝尔.jpg',
    type: 'jpg',
    description: '万尼贝尔产品图片'
  },
  {
    id: '12',
    name: '北京锐驰-1.PNG',
    url: '/src/data/北京锐驰-1.PNG',
    type: 'png',
    description: '北京锐驰产品图片'
  },
  {
    id: '13',
    name: '安姆科-天彩.png',
    url: '/src/data/安姆科-天彩.png',
    type: 'png',
    description: '安姆科天彩产品图片'
  },
  {
    id: '14',
    name: '广州安固得订单-波士胶25.03.07.jpg',
    url: '/src/data/广州安固得订单-波士胶25.03.07.jpg',
    type: 'jpg',
    description: '广州安固得订单图片'
  },
  
  // Excel文件
  {
    id: '15',
    name: '江苏保均新材采购合同.xls',
    url: '/src/data/江苏保均新材采购合同.xls',
    type: 'xls',
    description: '江苏保均新材采购合同'
  },
  {
    id: '16',
    name: '济南众畅1.xls',
    url: '/src/data/济南众畅1.xls',
    type: 'xls',
    description: '济南众畅Excel文档'
  },
  {
    id: '17',
    name: '青岛金秋雨订单20250220亚鑫达.xlsx',
    url: '/src/data/青岛金秋雨订单20250220亚鑫达.xlsx',
    type: 'xlsx',
    description: '青岛金秋雨订单Excel'
  }
];

// 获取文件列表
export const getFileList = (): FileInfo[] => {
  return allFiles;
};

// 根据ID获取文件信息
export const getFileById = (id: string): FileInfo | undefined => {
  return allFiles.find(file => file.id === id);
};

// 根据文件名获取文件信息
export const getFileByName = (name: string): FileInfo | undefined => {
  return allFiles.find(file => file.name === name);
}; 