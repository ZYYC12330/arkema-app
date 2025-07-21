import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';

// 扩展jsPDF类型以包含autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

export type SupportedFileType = 'pdf' | 'jpg' | 'jpeg' | 'png' | 'xls' | 'xlsx';

export interface ConversionResult {
  success: boolean;
  pdfUrl?: string;
  error?: string;
}

export class FileConverter {
  /**
   * 检测文件类型
   */
  static getFileType(fileName: string): SupportedFileType | null {
    const extension = fileName.toLowerCase().split('.').pop();
    switch (extension) {
      case 'pdf':
        return 'pdf';
      case 'jpg':
      case 'jpeg':
        return 'jpg';
      case 'png':
        return 'png';
      case 'xls':
        return 'xls';
      case 'xlsx':
        return 'xlsx';
      default:
        return null;
    }
  }

  /**
   * 将图片转换为PDF
   */
  static async imageToPdf(imageUrl: string, fileName: string): Promise<ConversionResult> {
    try {
      return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          try {
            const pdf = new jsPDF();
            
            // 获取图片尺寸
            const imgWidth = img.width;
            const imgHeight = img.height;
            
            // 计算PDF页面尺寸 (A4: 210 x 297 mm)
            const pdfWidth = 210;
            const pdfHeight = 297;
            
            // 计算缩放比例，保持宽高比
            const scale = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
            const scaledWidth = imgWidth * scale;
            const scaledHeight = imgHeight * scale;
            
            // 居中显示
            const x = (pdfWidth - scaledWidth) / 2;
            const y = (pdfHeight - scaledHeight) / 2;
            
            // 添加图片到PDF
            pdf.addImage(img, 'JPEG', x, y, scaledWidth, scaledHeight);
            
            // 生成PDF Blob
            const pdfBlob = pdf.output('blob');
            const pdfUrl = URL.createObjectURL(pdfBlob);
            
            resolve({
              success: true,
              pdfUrl
            });
          } catch (error) {
            resolve({
              success: false,
              error: `图片转换失败: ${error}`
            });
          }
        };
        
        img.onerror = () => {
          resolve({
            success: false,
            error: '图片加载失败'
          });
        };
        
        img.src = imageUrl;
      });
    } catch (error) {
      return {
        success: false,
        error: `图片转换错误: ${error}`
      };
    }
  }

  /**
   * 处理中文字符编码
   */
  private static sanitizeText(text: string): string {
    if (!text) return '';
    // 将文本转换为UTF-8兼容格式，处理特殊字符
    return text
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // 移除控制字符
      .replace(/[\uFEFF]/g, '') // 移除BOM
      .trim();
  }

  /**
   * 简化版Excel转PDF（兼容性更好）
   */
  private static simpleExcelToPdf(workbook: any, fileName: string): ConversionResult {
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      let isFirstSheet = true;
      
      workbook.SheetNames.forEach((sheetName: string, sheetIndex: number) => {
        if (!isFirstSheet) {
          pdf.addPage();
        }
        isFirstSheet = false;
        
        const worksheet = workbook.Sheets[sheetName];
        const jsonData: unknown[][] = XLSX.utils.sheet_to_json(worksheet, { 
          header: 1,
          defval: '',
          raw: false
        });
        
        // 清理工作表名称
        const cleanSheetName = this.sanitizeText(sheetName) || `工作表${sheetIndex + 1}`;
        
        // 添加标题
        pdf.setFontSize(14);
        pdf.text(cleanSheetName, 20, 20);
        
        let yPosition = 35;
        const lineHeight = 6;
        const leftMargin = 20;
        const maxWidth = 170; // 页面宽度限制
        
        // 处理并绘制数据
        jsonData.forEach((row: unknown[], rowIndex) => {
          if (!row || row.length === 0) return;
          
          // 检查是否需要换页
          if (yPosition > 280) {
            pdf.addPage();
            yPosition = 20;
            pdf.setFontSize(14);
            pdf.text(`${cleanSheetName} (续)`, 20, yPosition);
            yPosition += 15;
          }
          
          let xPosition = leftMargin;
          let maxRowHeight = lineHeight;
          
          // 处理每个单元格
          row.forEach((cell: unknown, cellIndex) => {
            const cellText = this.sanitizeText(String(cell || ''));
            if (!cellText) return;
            
            // 设置字体大小
            pdf.setFontSize(rowIndex === 0 ? 9 : 8);
            
            // 计算单元格宽度
            const cellWidth = Math.min(30, maxWidth / row.length);
            
            // 处理长文本，分行显示
            const words = cellText.split(' ');
            let line = '';
            let lines: string[] = [];
            
            words.forEach(word => {
              const testLine = line + (line ? ' ' : '') + word;
              const textWidth = pdf.getTextWidth(testLine);
              
              if (textWidth < cellWidth - 2) {
                line = testLine;
              } else {
                if (line) lines.push(line);
                line = word;
              }
            });
            if (line) lines.push(line);
            
            // 限制行数
            if (lines.length > 3) {
              lines = lines.slice(0, 2);
              lines.push('...');
            }
            
            // 绘制文本
            lines.forEach((textLine, lineIndex) => {
              pdf.text(textLine, xPosition, yPosition + (lineIndex * 4));
            });
            
            maxRowHeight = Math.max(maxRowHeight, lines.length * 4);
            xPosition += cellWidth;
            
            // 防止超出页面
            if (xPosition > maxWidth) {
              xPosition = leftMargin;
              yPosition += maxRowHeight;
              maxRowHeight = lineHeight;
            }
          });
          
          yPosition += maxRowHeight + 2;
        });
      });
      
      const pdfBlob = pdf.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      
      return {
        success: true,
        pdfUrl
      };
    } catch (error) {
      return {
        success: false,
        error: `简化转换失败: ${error}`
      };
    }
  }

    /**
   * 将Excel文件转换为PDF
   */
  static async excelToPdf(fileUrl: string, fileName: string): Promise<ConversionResult> {
    try {
      const response = await fetch(fileUrl);
      if (!response.ok) {
        throw new Error(`文件加载失败: ${response.status}`);
      }
      
      const arrayBuffer = await response.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { 
        type: 'array',
        codepage: 65001 // UTF-8编码
      });
      
      // 尝试使用autoTable，如果失败则使用简化版本
      try {
        const pdf = new jsPDF('p', 'mm', 'a4');
        let isFirstSheet = true;
        
        // 检查是否有autoTable方法可用
        if (typeof (pdf as any).autoTable === 'function') {
          // 遍历所有工作表
          workbook.SheetNames.forEach((sheetName, sheetIndex) => {
            if (!isFirstSheet) {
              pdf.addPage();
            }
            isFirstSheet = false;
            
            const worksheet = workbook.Sheets[sheetName];
            
            // 将工作表转换为JSON数组
            const jsonData: unknown[][] = XLSX.utils.sheet_to_json(worksheet, { 
              header: 1,
              defval: '', // 空值默认为空字符串
              raw: false // 不使用原始值，转换为字符串
            });
            
            // 处理表格数据，清理和转换文本
            const tableData = jsonData
              .filter((row: unknown[]) => row.some(cell => cell !== null && cell !== undefined && cell !== ''))
              .map((row: unknown[]) => 
                row.map((cell: unknown) => this.sanitizeText(String(cell || '')))
              );
            
            if (tableData.length === 0) return; // 跳过空工作表
            
            // 工作表标题
            const cleanSheetName = this.sanitizeText(sheetName) || `工作表${sheetIndex + 1}`;
            
            // 使用autoTable创建表格
            (pdf as any).autoTable({
              head: tableData.length > 0 ? [tableData[0]] : [],
              body: tableData.slice(1),
              startY: 30,
              theme: 'grid',
              styles: {
                font: 'helvetica',
                fontSize: 8,
                cellPadding: 2,
                overflow: 'linebreak',
                cellWidth: 'wrap'
              },
              headStyles: {
                fillColor: [66, 139, 202],
                textColor: [255, 255, 255],
                fontSize: 9,
                fontStyle: 'bold'
              },
              bodyStyles: {
                fontSize: 8,
                textColor: [51, 51, 51]
              },
              alternateRowStyles: {
                fillColor: [245, 245, 245]
              },
              columnStyles: {
                0: { cellWidth: 25 },
                1: { cellWidth: 30 },
                2: { cellWidth: 30 },
                3: { cellWidth: 25 },
                4: { cellWidth: 25 },
                5: { cellWidth: 25 }
              },
              didDrawPage: (data: any) => {
                // 添加页眉
                pdf.setFontSize(14);
                pdf.text(cleanSheetName, 14, 20);
                
                // 添加页脚
                const pageNumber = (pdf as any).internal.getNumberOfPages();
                pdf.setFontSize(8);
                pdf.text(`第 ${data.pageNumber} 页，共 ${pageNumber} 页`, 14, pdf.internal.pageSize.height - 10);
              },
              margin: { top: 35, right: 14, bottom: 20, left: 14 }
            });
          });
          
          // 生成PDF Blob
          const pdfBlob = pdf.output('blob');
          const pdfUrl = URL.createObjectURL(pdfBlob);
          
          return {
            success: true,
            pdfUrl
          };
        } else {
          throw new Error('autoTable不可用，使用简化版本');
        }
      } catch (autoTableError) {
        console.warn('autoTable失败，使用简化版本:', autoTableError);
        // 使用简化版本
        return this.simpleExcelToPdf(workbook, fileName);
      }
    } catch (error) {
      return {
        success: false,
        error: `Excel转换失败: ${error}`
      };
    }
  }

  /**
   * 通用文件转换方法
   */
  static async convertToPdf(fileUrl: string, fileName: string): Promise<ConversionResult> {
    const fileType = this.getFileType(fileName);
    
    if (!fileType) {
      return {
        success: false,
        error: '不支持的文件类型'
      };
    }
    
    switch (fileType) {
      case 'pdf':
        return {
          success: true,
          pdfUrl: fileUrl
        };
      
      case 'jpg':
      case 'jpeg':
      case 'png':
        return await this.imageToPdf(fileUrl, fileName);
      
      case 'xls':
      case 'xlsx':
        return await this.excelToPdf(fileUrl, fileName);
      
      default:
        return {
          success: false,
          error: '暂不支持该文件类型的转换'
        };
    }
  }
}

export default FileConverter; 