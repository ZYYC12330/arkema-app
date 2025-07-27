/**
 * @file SuggestionInput.tsx
 * @description 使用 HeroUI 的 Autocomplete 组件实现一个带有 AI 建议功能的输入框。
 */

import React, { useState, useEffect } from 'react';
import { Autocomplete, AutocompleteItem } from "@heroui/react";
import { generateAbbreviation } from '../utils/suggestionService';
import { useLanguage } from '../contexts/LanguageContext';
import { Icon } from "@iconify/react";

/**
 * SuggestionInput 组件的属性接口
 */
interface SuggestionInputProps {
  /** 输入框的值 */
  value: string;
  /** 值变化时的回调函数 */
  onChange: (value: string) => void;
  /** 是否为只读状态 */
  isReadOnly?: boolean;
  /** 占位符文本 */
  placeholder?: string;
  /** 是否正在加载 */
  isLoading?: boolean;
}

/**
 * AI 建议输入框组件
 * 
 * @description 一个封装了 HeroUI Autocomplete 的组件，
 * 当用户输入时，会自动调用 `generateAbbreviation` 生成缩写建议。
 * 其外观与标准的 Input 组件保持一致。
 */
const SuggestionInput: React.FC<SuggestionInputProps> = ({ 
  value, 
  onChange, 
  isReadOnly, 
  placeholder, 
  isLoading 
}) => {
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const { language } = useLanguage();

  // 当输入值变化时，生成建议
  useEffect(() => {
    if (value && !isReadOnly) {
      const newSuggestion = generateAbbreviation(value);
      if (newSuggestion && newSuggestion.toLowerCase() !== value.toLowerCase()) {
        setSuggestion(newSuggestion);
      } else {
        setSuggestion(null);
      }
    } else {
      setSuggestion(null);
    }
  }, [value, isReadOnly]);

  const items = suggestion ? [{ key: suggestion, label: suggestion }] : [];

  return (
    <Autocomplete
      inputValue={value}
      items={items}
      allowsCustomValue={true}
      isReadOnly={isReadOnly || isLoading}
      onInputChange={onChange}
      onSelectionChange={(key) => {
        console.log('Selection changed:', key); // 调试信息
        if (key) {
          const selectedValue = String(key);
          console.log('Selected value:', selectedValue); // 调试信息
          // 直接设置输入值
          onChange(selectedValue);
          // 强制更新 inputValue
          setTimeout(() => {
            onChange(selectedValue);
          }, 0);
        }
      }}
      placeholder={placeholder}
      size="sm"
      className="w-full"
      aria-label={placeholder || (language === 'zh' ? 'AI建议输入框' : 'AI Suggestion Input')}
      classNames={{
        clearButton: "h-4 w-4", // 清除按钮大小
        selectorButton: "h-4 w-4", // 下拉按钮大小
        popoverContent: "bg-white border border-gray-200 rounded-md shadow-lg",
      }}
      startContent={
        isLoading ? <Icon icon="lucide:loader-2" className="animate-spin text-primary" aria-label="加载中" /> : null
      }
    >
      {(item) => (
        <AutocompleteItem key={item.key} className="bg-white hover:bg-gray-100">
          <span className="font-semibold">{language === 'zh' ? 'AI 建议' : 'AI Suggestion'}:</span> {item.label}
        </AutocompleteItem>
      )}
    </Autocomplete>
  );
};

export default SuggestionInput; 