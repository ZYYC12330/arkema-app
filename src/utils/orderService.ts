/**
 * @file orderService.ts
 * @description 订单服务，封装了与订单相关的 API 调用和本地存储逻辑。
 */

import { BasicOrderInfo, ExtendedOrderInfo, CompleteOrderInfo, OrderStatus, OrderProcessingPhase } from '../types';
import { API_CONFIG } from '../config/api';
import { FileInfo } from '../config/files';

// LangCore平台基础URL
const LANGCORE_BASE_URL = API_CONFIG.publicUploadEndpoint.replace('/api/file', '');

// 本地存储键名
const ORDER_STATUS_KEY = 'arkema_order_status';
const ORDER_INFO_KEY = 'arkema_order_info';

/**
 * OrderService 类
 * 
 * @description 提供了一组静态方法，用于处理订单的各个方面，
 * 包括从文件提取信息、生成内部编号、提交订单以及在本地存储中管理订单状态和数据。
 */
export class OrderService {
  /**
   * 将 ISO 日期格式转换为前端显示格式 (YYYY-MM-DD)
   * @param isoDate ISO 日期字符串
   * @returns 格式化的日期字符串，如果输入无效则返回空字符串
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
   * 从 PDF 文件提取基本订单信息
   * @param fileId 从LangCore平台获取的文件 ID
   * @param fileName 文件名
   * @returns 包含基本订单信息的 Promise
   * @throws 如果 API 请求失败或返回格式不正确，则抛出错误
   */
  static async extractBasicOrderInfo(fileId: string, fileName: string): Promise<BasicOrderInfo> {
    // console.log('🔍 开始提取订单信息:', { fileId, fileName });
    // 去數據庫找file，如果找得到，直接返回

    const raw = JSON.stringify({
      "input": {
        "fileUrl": `${API_CONFIG.publicUploadEndpoint}/${fileId}`,
        "fileName": fileName
      },
      "runMode": "sync"
    });

    // console.log('📤 发送给[要素提取]工作流的API数据:', raw);

    const requestOptions = {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_CONFIG.authToken}`,
        'Content-Type': 'application/json'
      },
      body: raw,
      redirect: 'follow' as RequestRedirect
    };

    const response = await fetch(`${LANGCORE_BASE_URL}/api/workflow/run/cmd5l351c01d8mwb7lesuciq0`, requestOptions);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API请求失败:', { status: response.status, error: errorText });
      throw new Error(`API请求失败: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    // console.log('📥 API返回结果:', result);
    console.log('result', result);
    
    // 兼容新的API返回格式
    let extractedData: any = null;
    
    // 字段映射函数：将API返回的数据格式化为统一的字段名
    const mapApiDataToStandardFormat = (resultData: any): any => {
      const firstItem = resultData.Items && resultData.Items[0] ? resultData.Items[0] : 
                       resultData.items && resultData.items[0] ? resultData.items[0] : {};
      
      console.log('🔍 映射前的原始数据:', resultData);
      console.log('🔍 第一个商品数据:', firstItem);
      
      // 处理商品数组并映射到标准格式
      const allItems = (resultData.Items || resultData.items || []).map((item: any) => {
        return {
          itemNumber: item['item-number'] || item.itemNumber || '',
          itemName: item['item-name'] || item.itemName || '',
          itemQuantity: item['item-quantity'] || item.itemQuantity || item.quantity || '',
          unitOfMeasure: item['unit-of-measure'] || item.unitOfMeasure || item.unit || '',
          unitPrice: item['unit-price'] || item.unitPrice || item.price || '',
        };
      });

      const mappedData = {
        // 基本订单信息
        soldToName: resultData['sold-to-name'] || resultData.soldToName || '',
        soldToAddress: resultData['sold-to-address'] || resultData.soldToAddress || '',
        shipToName: resultData['ship-to-name'] || resultData.shipToName || '',
        shipToAddress: resultData['ship-to-address'] || resultData.shipToAddress || '',
        vendorName: resultData['vendor-name'] || resultData.vendorName || '',
        vendorAddress: resultData['vendor-address'] || resultData.vendorAddress || '',
        vendorSalesArea: resultData['vendor-sales-area'] || resultData.vendorSalesArea || '',
        poNumber: resultData['po-number'] || resultData.poNumber || '',
        poDate: resultData['po-date'] || resultData.poDate || '',
        deliveryDate: resultData['delivery-date'] || resultData.deliveryDate || '',
        deliveryByDate: resultData['delivery-by-date'] || resultData.deliveryByDate || '',
        headerText: resultData['header-text'] || resultData.headerText || '',
        
        // 商品信息（取第一个商品作为主要信息，用于向后兼容）
        itemNumber: firstItem['item-number'] || firstItem.itemNumber || '',
        itemName: firstItem['item-name'] || firstItem.itemName || '',
        itemQuantity: firstItem['item-quantity'] || firstItem.itemQuantity || firstItem.quantity || '',
        unitOfMeasure: firstItem['unit-of-measure'] || firstItem.unitOfMeasure || firstItem.unit || '',
        unitPrice: firstItem['unit-price'] || firstItem.unitPrice || firstItem.price || '',
        
        // 存储所有商品用于多商品显示
        items: allItems
      };
      
      console.log('🎁 处理后的商品数组:', allItems);
      
      console.log('🔍 映射后的数据:', mappedData);
      return mappedData;
    };
    
    // 检查不同的API返回格式并进行数据映射
    if (result.status === 'success' && result.output && result.output.result) {
      // 格式1：{status: 'success', output: {result: {...}}}
      console.log('📄 使用格式1: result.output.result');
      extractedData = mapApiDataToStandardFormat(result.output.result);
    } else if (result.output && result.output.result_old) {
      // 格式2：result.output.result_old（您当前的情况）
      console.log('📄 使用格式2: result.output.result_old');
      extractedData = mapApiDataToStandardFormat(result.output.result_old);
    } else if (result.output && result.output.result) {
      // 格式3：result.output.result
      console.log('📄 使用格式3: result.output.result');
      extractedData = mapApiDataToStandardFormat(result.output.result);
    } else if (result.result_old) {
      // 格式4：result.result_old
      console.log('📄 使用格式4: result.result_old');
      extractedData = mapApiDataToStandardFormat(result.result_old);
    }
    
    if (extractedData) {
      console.log('✅ 成功提取并映射订单信息:', extractedData);
      
      // 格式化日期字段
      const formattedPoDate = this.formatDateForDisplay(extractedData.poDate);
      const formattedDeliveryDate = this.formatDateForDisplay(extractedData.deliveryDate);

      console.log('📅 日期格式化结果:', {
        originalPoDate: extractedData.poDate,
        formattedPoDate,
        originalDeliveryDate: extractedData.deliveryDate,
        formattedDeliveryDate
      });



      const finalOrderInfo = {
        id: extractedData.id || '',
        soldToName: extractedData.soldToName || '',
        soldToAddress: extractedData.soldToAddress || '',
        shipToName: extractedData.shipToName || '',
        shipToAddress: extractedData.shipToAddress || '',
        vendorName: extractedData.vendorName || '',
        vendorAddress: extractedData.vendorAddress || '',
        poNumber: extractedData.poNumber || '',
        poDate: formattedPoDate,
        deliveryDate: formattedDeliveryDate,
        itemNumber: extractedData.itemNumber || '',
        itemName: extractedData.itemName || '',
        itemQuantity: extractedData.itemQuantity || '',
        unitOfMeasure: extractedData.unitOfMeasure || '',
        unitPrice: extractedData.unitPrice || '',
        // 新增字段
        items: extractedData.items || [],
        headerText: extractedData.headerText || '',
        deliveryByDate: extractedData.deliveryByDate || '',
        vendorSalesArea: extractedData.vendorSalesArea || '',
      };
      
      console.log('🎯 最终返回的订单信息:', finalOrderInfo);
      return finalOrderInfo;
    } else {
      console.error('❌ API返回格式错误，无法提取数据:', result);
      throw new Error(result.msg || '从API获取数据失败或格式不正确');
    }
  }

  /**
   * 生成内部编号等扩展信息
   * @param basicInfo 基本订单信息
   * @returns 包含扩展订单信息的 Promise
   * @description **注意:** 当前使用模拟数据和延迟来模拟 API 调用。
   */
  static async generateExtendedInfo(basicInfo: BasicOrderInfo): Promise<ExtendedOrderInfo> {
    // TODO: 这里应该调用实际的API来生成内部编号
    // 目前使用模拟数据
    const mockExtendedInfo: ExtendedOrderInfo = {
      arkemaSoldToCode: this.generateSoldToCode(basicInfo.soldToName),
      arkemaShipToCode: this.generateShipToCode(basicInfo.shipToName),
      arkemaProductCode: this.generateProductCode(basicInfo.itemNumber),
    };

    // 模拟API调用延迟
    await new Promise(resolve => setTimeout(resolve, 500));

    return mockExtendedInfo;
  }

  /**
   * 提交完整订单到数据库
   * @param orderInfo 完整的订单信息
   * @param fileName 文件名
   * @returns 包含操作结果的 Promise
   */
  static async submitOrder(orderInfo: CompleteOrderInfo, fileName: string): Promise<{ success: boolean; orderId?: string; message?: string }> {
    // console.log('🔧 OrderService.submitOrder 开始执行...');
    // console.log('📦 接收到的订单数据:', orderInfo);
    console.log('fileName', fileName);
    try {

      const requestBody = {
        "input": {
          "orderData": orderInfo,
          "fileName": fileName
        },
        "runMode": "sync"
      };

      console.log('📤 发送的请求体:', JSON.stringify(requestBody, null, 2));

      // console.log('📤 请求体数据:', requestBody);

      // 实际的写入数据库API端点
      const response = await fetch(`${LANGCORE_BASE_URL}/api/workflow/run/cmdczxv6f0msbmwb70fatc941`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_CONFIG.authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      // console.log('�� 收到API响应:', {
      //   status: response.status,
      // });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API响应错误:', {
          status: response.status,
          statusText: response.statusText,
          errorText
        });
        throw new Error(`提交失败: ${response.status} - ${errorText}`);
      }

      // console.log('✅ API写入数据库成功');


      // 更新本地状态
      // console.log('💾 更新本地订单状态...');
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
   * 从本地存储获取指定文件的订单状态
   * @param fileName 文件名
   * @returns 订单状态对象，如果不存在则返回 null
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
   * 更新本地存储中的订单状态
   * @param fileName 文件名
   * @param phase 新的处理阶段
   * @param isSubmitted 是否已提交
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
   * 检查指定文件的订单是否已提交
   * @param fileName 文件名
   * @returns 如果订单已提交则返回 true，否则返回 false
   */
  static isOrderSubmitted(fileName: string): boolean {
    const status = this.getOrderStatus(fileName);
    return status?.isSubmitted || false;
  }

  /**
   * 保存完整的订单信息到本地存储
   * @param fileName 文件名
   * @param basicInfo 基本订单信息
   * @param extendedInfo 扩展订单信息
   */
  static saveOrderInfo(
    fileName: string,
    basicInfo: BasicOrderInfo,
    extendedInfo: ExtendedOrderInfo
  ): void {
    const orderInfoData = localStorage.getItem(ORDER_INFO_KEY);
    let allOrderInfo: Record<string, { basicInfo: BasicOrderInfo; extendedInfo: ExtendedOrderInfo }> = {};

    if (orderInfoData) {
      try {
        allOrderInfo = JSON.parse(orderInfoData);
      } catch {
        allOrderInfo = {};
      }
    }

    allOrderInfo[fileName] = {
      basicInfo,
      extendedInfo
    };

    localStorage.setItem(ORDER_INFO_KEY, JSON.stringify(allOrderInfo));
    console.log('💾 订单信息已保存到本地存储:', fileName);
  }

  /**
   * 从本地存储获取已保存的订单信息
   * @param fileName 文件名
   * @returns 包含基本和扩展信息的对象，如果不存在则返回 null
   */
  static getSavedOrderInfo(fileName: string): { basicInfo: BasicOrderInfo; extendedInfo: ExtendedOrderInfo } | null {
    const orderInfoData = localStorage.getItem(ORDER_INFO_KEY);
    if (!orderInfoData) {
      return null;
    }

    try {
      const allOrderInfo = JSON.parse(orderInfoData);
      return allOrderInfo[fileName] || null;
    } catch {
      return null;
    }
  }

  //
  // --- 私有模拟数据生成方法 ---
  //

  /**
   * 根据售达方名称生成模拟的售达方代码
   * @param soldToName 售达方名称
   * @returns 模拟的售达方代码
   */
  private static generateSoldToCode(soldToName: string): string {
    const hash = this.simpleHash(soldToName);
    return `ST${hash.toString().padStart(6, '0')}`;
  }

  /**
   * 根据送达方名称生成模拟的送达方代码
   * @param shipToName 送达方名称
   * @returns 模拟的送达方代码
   */
  private static generateShipToCode(shipToName: string): string {
    const hash = this.simpleHash(shipToName);
    return `SH${hash.toString().padStart(6, '0')}`;
  }



  /**
   * 根据交货日期计算模拟的"此日期前交货"
   * @param deliveryDate 交货日期
   * @returns 计算后的日期字符串
   */


  /**
   * 根据物料号生成模拟的产品代码
   * @param itemNumber 物料号
   * @returns 模拟的产品代码
   */
  private static generateProductCode(itemNumber: string): string {
    const hash = this.simpleHash(itemNumber);
    return `AK${hash.toString().padStart(6, '0')}`;
  }

  /**
   * 一个简单的哈希函数，用于生成模拟数据
   * @param str 输入字符串
   * @returns 一个数字哈希值
   */
  private static simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash) % 1000000;
  }

  /**
   * 获取文件列表
   * @returns 包含操作结果的 Promise
   */
  static async getFileList(): Promise<Array<CompleteOrderInfo>> {

    const raw = JSON.stringify({
      "input": {},
      "runMode": "sync"
    });

    const requestOptions = {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_CONFIG.authToken}`,
        'Content-Type': 'application/json'
      },
      body: raw,
      redirect: 'follow' as RequestRedirect
    };

    const response = await fetch(`${LANGCORE_BASE_URL}/api/workflow/run/cmdo639h005c8o4c6aie6koyj`, requestOptions);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API请求失败:', { status: response.status, error: errorText });
      throw new Error(`API请求失败: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('result', result);
    if (result.output && result.output.result) {
       result.output.result.forEach((item: CompleteOrderInfo) => {
        // 格式化日期字段
        const formattedPoDate = this.formatDateForDisplay(item.poDate);
        const formattedDeliveryDate = this.formatDateForDisplay(item.deliveryDate);
  
        // console.log('📅 日期格式化结果:', {
        //   originalPoDate: apiData.poDate,
        //   formattedPoDate,
        //   originalDeliveryDate: apiData.deliveryDate,
        //   formattedDeliveryDate
        // });
  

  
        return {
          id: item.id || '',
          soldToName: item.soldToName || '',
          soldToAddress: item.soldToAddress || '',
          shipToName: item.shipToName || '',
          shipToAddress: item.shipToAddress || '',
          vendorName: item.vendorName || '',
          vendorAddress: item.vendorAddress || '',
          poNumber: item.poNumber || '',
          poDate: formattedPoDate,
          deliveryDate: formattedDeliveryDate,
          itemNumber: item.itemNumber || '',
          itemName: item.itemName || '',
          itemQuantity: item.itemQuantity || '',
          unitOfMeasure: item.unitOfMeasure || '',
          unitPrice: item.unitPrice || '',
          // 扩展字段（从数据库获取或设置默认值）
          arkemaSoldToCode: item.arkemaSoldToCode || '',
          arkemaShipToCode: item.arkemaShipToCode || '',
          arkemaProductCode: item.arkemaProductCode || '',
          phase: item.phase || '',
          isSubmitted: item.isSubmitted || false,
          fileUrl: item.fileUrl || '',
          fileName: item.fileName || '',
        } as CompleteOrderInfo;
      });
      return result.output.result;

    } else {
      console.error('❌ API返回格式错误:', result);
      throw new Error(result.msg || '从API获取数据失败或格式不正确');
    }
  }
} 