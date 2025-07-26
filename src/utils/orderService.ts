import { BasicOrderInfo, ExtendedOrderInfo, CompleteOrderInfo, OrderStatus, OrderProcessingPhase } from '../types';

const API_BASE_URL = 'https://demo.langcore.cn';
const API_TOKEN = 'sk-zzvwbcaxoss3';

// 本地存储键名
const ORDER_STATUS_KEY = 'arkema_order_status';

export class OrderService {
  /**
   * 将ISO日期格式转换为前端显示格式 (YYYY-MM-DD)
   * @param isoDate ISO日期字符串
   * @returns 格式化的日期字符串
   */
  private static formatDateForDisplay(isoDate: string): string {
    if (!isoDate) return '';
    
    try {
      const date = new Date(isoDate);
      if (isNaN(date.getTime())) {
        console.warn('无效的日期格式:', isoDate);
        return '';
      }
      return date.toISOString().split('T')[0]; // 返回 YYYY-MM-DD 格式
    } catch (error) {
      console.error('日期格式转换失败:', error);
      return '';
    }
  }

  /**
   * 从PDF文件提取基本订单信息
   * @param fileId 文件ID（从公网服务器获取的fileId）
   * @param fileName 文件名
   */
  static async extractBasicOrderInfo(fileId: string, fileName: string): Promise<BasicOrderInfo> {
    console.log('🔍 开始提取订单信息:', { fileId, fileName });
    
    const raw = JSON.stringify({
      "input": { 
        "fileUrl": "https://demo.langcore.cn/api/file/"+fileId ,
        "fileName": fileName
      },
      "runMode": "sync"
    });

    console.log('📤 发送给API的数据:', raw);

    const requestOptions = {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: raw,
      redirect: 'follow' as RequestRedirect
    };

    const response = await fetch(`${API_BASE_URL}/api/workflow/run/cmd5l351c01d8mwb7lesuciq0`, requestOptions);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API请求失败:', { status: response.status, error: errorText });
      throw new Error(`API请求失败: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('📥 API返回结果:', result);
    
    if (result.output && result.output.result_old) {
      const apiData = result.output.result_old[0];
      console.log('✅ 成功提取订单信息:', apiData);
      
      // 格式化日期字段
      const formattedPoDate = this.formatDateForDisplay(apiData.poDate);
      const formattedDeliveryDate = this.formatDateForDisplay(apiData.deliveryDate);
      
      console.log('📅 日期格式化结果:', {
        originalPoDate: apiData.poDate,
        formattedPoDate,
        originalDeliveryDate: apiData.deliveryDate,
        formattedDeliveryDate
      });
      
      return {
        id: apiData.id || '',
        soldToName: apiData.soldToName || '',
        soldToAddress: apiData.soldToAddress || '',
        shipToName: apiData.shipToName || '',
        shipToAddress: apiData.shipToAddress || '',
        vendorName: apiData.vendorName || '',
        vendorAddress: apiData.vendorAddress || '',
        poNumber: apiData.poNumber || '',
        poDate: formattedPoDate,
        deliveryDate: formattedDeliveryDate,
        itemNumber: apiData.itemNumber || '',
        itemName: apiData.itemName || '',
        itemQuantity: apiData.itemQuantity || '',
        unitOfMeasure: apiData.unitOfMeasure || '',
        unitPrice: apiData.unitPrice || '',
      };
    } else {
      console.error('❌ API返回格式错误:', result);
      throw new Error(result.msg || '从API获取数据失败或格式不正确');
    }
  }

  /**
   * 生成内部编号等扩展信息
   */
  static async generateExtendedInfo(basicInfo: BasicOrderInfo): Promise<ExtendedOrderInfo> {
    // TODO: 这里应该调用实际的API来生成内部编号
    // 目前使用模拟数据
    const mockExtendedInfo: ExtendedOrderInfo = {
      arkemaSoldToCode: this.generateSoldToCode(basicInfo.soldToName),
      arkemaShipToCode: this.generateShipToCode(basicInfo.shipToName),
      vendorSalesArea: this.generateSalesArea(basicInfo.vendorName),
      deliveryByDate: this.calculateDeliveryByDate(basicInfo.deliveryDate),
      lineNumber: "001",
      arkemaProductCode: this.generateProductCode(basicInfo.itemNumber),
    };

    // 模拟API调用延迟
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    return mockExtendedInfo;
  }

  /**
   * 提交完整订单到数据库
   */
  static async submitOrder(orderInfo: CompleteOrderInfo): Promise<{ success: boolean; orderId?: string; message?: string }> {
    console.log('🔧 OrderService.submitOrder 开始执行...');
    console.log('📦 接收到的订单数据:', orderInfo);
    
    try {
      console.log('📡 请求URL:', `${API_BASE_URL}/api/workflow/run/cmdczxv6f0msbmwb70fatc941`);
      
      const requestBody = {
        ...orderInfo,
        // submittedAt: new Date().toISOString()
      };
      
      console.log('📤 请求体数据:', requestBody);
      
      // TODO: 替换为实际的数据库API端点
      const response = await fetch(`${API_BASE_URL}/api/workflow/run/cmdczxv6f0msbmwb70fatc941`, {
        method: 'POST',
        headers: {  
          'Authorization': `Bearer ${API_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      console.log('📥 收到API响应:', {
        status: response.status,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API响应错误:', {
          status: response.status,
          statusText: response.statusText,
          errorText
        });
        throw new Error(`提交失败: ${response.status} - ${errorText}`);
      }

      console.log('✅ API写入数据库成功');

      
      // 更新本地状态
      console.log('💾 更新本地订单状态...');
      this.updateOrderStatus(orderInfo.fileUrl || '', 'submitted', true);
      
      return {
        success: true,
        message: '订单提交成功'
      };
    } catch (error) {
      console.error('💥 OrderService.submitOrder 执行失败:', error);
      console.error('🔍 错误详情:', {
        errorType: error instanceof Error ? error.constructor.name : typeof error,
        errorMessage: error instanceof Error ? error.message : String(error),
        errorStack: error instanceof Error ? error.stack : undefined
      });
      return {
        success: false,
        message: error instanceof Error ? error.message : '提交订单失败'
      };
    }
  }

  /**
   * 获取订单状态
   */
  static getOrderStatus(fileName: string): OrderStatus | null {
    const statusData = localStorage.getItem(ORDER_STATUS_KEY);
    if (!statusData) return null;

    try {
      const allStatus: Record<string, OrderStatus> = JSON.parse(statusData);
      return allStatus[fileName] || null;
    } catch {
      return null;
    }
  }

  /**
   * 更新订单状态
   */
  static updateOrderStatus(
    fileName: string, 
    phase: OrderProcessingPhase, 
    isSubmitted: boolean = false
  ): void {
    const statusData = localStorage.getItem(ORDER_STATUS_KEY);
    let allStatus: Record<string, OrderStatus> = {};

    if (statusData) {
      try {
        allStatus = JSON.parse(statusData);
      } catch {
        allStatus = {};
      }
    }

    allStatus[fileName] = {
      fileName,
      phase,
      isSubmitted,
      submittedAt: isSubmitted ? new Date().toISOString() : undefined,
      lastModified: new Date().toISOString()
    };

    localStorage.setItem(ORDER_STATUS_KEY, JSON.stringify(allStatus));
  }

  /**
   * 检查订单是否已提交
   */
  static isOrderSubmitted(fileName: string): boolean {
    const status = this.getOrderStatus(fileName);
    return status?.isSubmitted || false;
  }

  // 私有方法：生成模拟的内部编号
  private static generateSoldToCode(soldToName: string): string {
    const hash = this.simpleHash(soldToName);
    return `ST${hash.toString().padStart(6, '0')}`;
  }

  private static generateShipToCode(shipToName: string): string {
    const hash = this.simpleHash(shipToName);
    return `SH${hash.toString().padStart(6, '0')}`;
  }

  private static generateSalesArea(vendorName: string): string {
    const areas = ['华北', '华东', '华南', '华中', '西南', '西北', '东北'];
    const hash = this.simpleHash(vendorName);
    return areas[hash % areas.length];
  }

  private static calculateDeliveryByDate(deliveryDate: string): string {
    if (!deliveryDate) return '';
    
    try {
      // 如果已经是 YYYY-MM-DD 格式，直接使用
      if (/^\d{4}-\d{2}-\d{2}$/.test(deliveryDate)) {
        const date = new Date(deliveryDate);
        date.setDate(date.getDate() - 3); // 提前3天
        return date.toISOString().split('T')[0];
      }
      
      // 如果是ISO格式，先转换
      const date = new Date(deliveryDate);
      if (isNaN(date.getTime())) {
        console.warn('无效的交货日期格式:', deliveryDate);
        return '';
      }
      
      date.setDate(date.getDate() - 3); // 提前3天
      return date.toISOString().split('T')[0];
    } catch (error) {
      console.error('计算交货日期失败:', error);
      return '';
    }
  }

  private static generateProductCode(itemNumber: string): string {
    const hash = this.simpleHash(itemNumber);
    return `AK${hash.toString().padStart(6, '0')}`;
  }

  private static simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash) % 1000000;
  }
} 