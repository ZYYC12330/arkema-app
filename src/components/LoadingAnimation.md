# LoadingAnimation 组件使用指南

## 概述

`LoadingAnimation` 是一个可复用的加载动画组件，提供了统一的加载状态展示，包含旋转动画、进度条、步骤指示器等。

## 基本用法

```tsx
import LoadingAnimation from './components/LoadingAnimation';

// 基本用法
<LoadingAnimation isLoading={true} />

// 带进度条
<LoadingAnimation 
  isLoading={true} 
  loadingProgress={65} 
/>

// 自定义标题和描述
<LoadingAnimation 
  isLoading={true}
  title="正在处理文件..."
  description="请稍候，系统正在处理您的文件"
  loadingProgress={45}
/>
```

## 属性说明

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `isLoading` | `boolean` | - | 是否显示加载动画 |
| `loadingProgress` | `number` | `0` | 加载进度 (0-100) |
| `title` | `string` | 自动生成 | 加载标题 |
| `description` | `string` | 自动生成 | 加载描述 |
| `estimatedTime` | `string` | 自动生成 | 预计处理时间 |
| `loadingSteps` | `Array<{text: string, delay?: number}>` | 默认步骤 | 加载步骤列表 |
| `icon` | `string` | `"lucide:file-search"` | 自定义图标 |
| `showProgress` | `boolean` | `true` | 是否显示进度条 |
| `showSteps` | `boolean` | `true` | 是否显示步骤指示器 |
| `className` | `string` | `""` | 自定义样式类 |

## 使用示例

### 1. 文档分析加载

```tsx
<LoadingAnimation 
  isLoading={isAnalyzing}
  loadingProgress={analysisProgress}
  title="正在分析文档内容..."
  description="AI正在提取订单信息，请耐心等待"
  icon="lucide:file-search"
/>
```

### 2. 文件上传加载

```tsx
<LoadingAnimation 
  isLoading={isUploading}
  loadingProgress={uploadProgress}
  title="正在上传文件..."
  description="文件上传中，请勿关闭页面"
  icon="lucide:upload"
  loadingSteps={[
    { text: "正在验证文件格式", delay: 0 },
    { text: "正在上传到服务器", delay: 1 },
    { text: "正在处理文件内容", delay: 2 }
  ]}
/>
```

### 3. 数据生成加载

```tsx
<LoadingAnimation 
  isLoading={isGenerating}
  loadingProgress={generationProgress}
  title="正在生成内部编号..."
  description="系统正在生成订单相关的内部编号"
  icon="lucide:settings"
  loadingSteps={[
    { text: "正在查询客户信息", delay: 0 },
    { text: "正在生成客户编号", delay: 1 },
    { text: "正在生成产品编号", delay: 2 },
    { text: "正在验证编号唯一性", delay: 3 }
  ]}
/>
```

### 4. 简化版本（仅显示动画）

```tsx
<LoadingAnimation 
  isLoading={isLoading}
  showProgress={false}
  showSteps={false}
  icon="lucide:loader-2"
/>
```

### 5. 自定义样式

```tsx
<LoadingAnimation 
  isLoading={isLoading}
  className="bg-gray-50 rounded-lg"
  icon="lucide:database"
  title="正在同步数据..."
  description="从远程服务器同步最新数据"
/>
```

## 默认行为

- **标题**: 根据语言自动生成（中文："正在分析文档内容..."，英文："Analyzing document content..."）
- **描述**: 根据语言自动生成（中文："AI正在提取订单信息，请耐心等待"，英文："AI is extracting order information, please wait"）
- **步骤**: 默认包含3个步骤（读取文档、识别信息、整理数据）
- **预计时间**: 根据语言自动生成（中文："预计处理时间：15秒"，英文："Estimated processing time: 15 seconds"）

## 样式定制

组件使用 Tailwind CSS 类名，可以通过 `className` 属性添加自定义样式：

```tsx
<LoadingAnimation 
  isLoading={isLoading}
  className="bg-blue-50 border border-blue-200 rounded-xl"
/>
```

## 注意事项

1. 组件会自动根据当前语言环境显示相应的文本
2. 当 `isLoading` 为 `false` 时，组件不会渲染任何内容
3. 进度条会自动根据 `loadingProgress` 值更新
4. 步骤指示器会根据 `delay` 属性设置动画延迟
5. 所有图标都使用 Iconify 图标库 