/**
 * @file LoadingAnimation.tsx
 * @description 加载动画组件，提供统一的加载状态展示
 */

import React from 'react';
import { Icon } from "@iconify/react";
import { useLanguage } from '../contexts/LanguageContext';

/**
 * LoadingAnimation 组件的属性接口
 */
interface LoadingAnimationProps {
  /** 是否正在加载 */
  isLoading: boolean;
  /** 加载进度 (0-100) */
  loadingProgress?: number;
  /** 加载标题 */
  title?: string;
  /** 加载描述 */
  description?: string;
  /** 预计处理时间 */
  estimatedTime?: string;
  /** 加载步骤列表 */
  loadingSteps?: Array<{
    text: string;
    delay?: number;
  }>;
  /** 自定义图标 */
  icon?: string;
  /** 是否显示进度条 */
  showProgress?: boolean;
  /** 是否显示步骤指示器 */
  showSteps?: boolean;
  /** 自定义样式类 */
  className?: string;
}

/**
 * 加载动画组件
 * 
 * @description 提供统一的加载状态展示，包含旋转动画、进度条、步骤指示器等
 */
const LoadingAnimation: React.FC<LoadingAnimationProps> = ({
  isLoading,
  loadingProgress = 0,
  title,
  description,
  estimatedTime,
  loadingSteps = [],
  icon = "lucide:file-search",
  showProgress = true,
  showSteps = true,
  className = "",
}) => {
  const { language } = useLanguage();

  // 默认加载步骤
  const defaultSteps = [
    {
      text: language === 'zh' ? '正在读取文档内容' : 'Reading document content',
      delay: 0
    },
    {
      text: language === 'zh' ? '正在识别订单信息' : 'Identifying order information',
      delay: 1
    },
    {
      text: language === 'zh' ? '正在整理结构化数据' : 'Organizing structured data',
      delay: 2
    }
  ];

  const steps = loadingSteps.length > 0 ? loadingSteps : defaultSteps;
  const defaultTitle = language === 'zh' ? '正在分析文档内容...' : 'Analyzing document content...';
  const defaultDescription = language === 'zh' ? 'AI正在提取订单信息，请耐心等待' : 'AI is extracting order information, please wait';
  const defaultEstimatedTime = language === 'zh' ? '预计处理时间：15秒' : 'Estimated processing time: 15 seconds';

  if (!isLoading) {
    return null;
  }

  return (
    <div className={`flex flex-col items-center justify-center h-full p-8 ${className}`}>
      <div className="text-center">
        {/* 主加载动画 */}
        <div className="relative mb-6">
          <div className="w-20 h-20 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Icon icon={icon} className="text-2xl text-primary" aria-label="加载图标" />
          </div>
        </div>
        
        {/* 加载文本 */}
        <h3 className="text-lg font-semibold text-primary mb-2">
          {title || defaultTitle}
        </h3>
        <p className="text-sm text-gray-600 mb-6">
          {description || defaultDescription}
        </p>
        
        {/* 进度条动画 */}
        {showProgress && (
          <div className="w-full max-w-xs mb-6">
            <div className="bg-gray-200 rounded-full h-2 mb-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-200" 
                style={{
                  width: `${loadingProgress}%`
                }}
              ></div>
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>
                {language === 'zh' ? '处理进度' : 'Progress'}
              </span>
              <span>{Math.round(loadingProgress)}%</span>
            </div>
            {estimatedTime && (
              <p className="text-xs text-gray-500 mt-1">
                {estimatedTime}
              </p>
            )}
          </div>
        )}
        
        {/* 加载步骤指示 */}
        {showSteps && (
          <div className="mt-8 space-y-3 text-left max-w-sm">
            {steps.map((step, index) => (
              <div key={index} className="flex items-center gap-3 text-sm">
                <div 
                  className="w-2 h-2 bg-primary rounded-full animate-pulse" 
                  style={{
                    animationDelay: `${step.delay || index}s`
                  }}
                ></div>
                <span className="text-gray-700">
                  {step.text}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LoadingAnimation; 