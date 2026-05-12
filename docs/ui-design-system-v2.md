# POMP 企业管理系统 - UI 核心设计方案

> 版本: 2.0.0
> 更新日期: 2026-05-12
> 状态: 🟢 正式版
> 作者: 设计团队

---

## 📋 目录

1. [设计原则与理念](#1-设计原则与理念)
2. [设计令牌系统](#2-设计令牌系统)
3. [组件规范](#3-组件规范)
4. [页面布局规范](#4-页面布局规范)
5. [图表规范](#5-图表规范)
6. [响应式设计](#6-响应式设计)
7. [动画与交互规范](#7-动画与交互规范)
8. [无障碍设计](#8-无障碍设计)
9. [实施路线图](#9-实施路线图)

---

## 1. 设计原则与理念

### 1.1 核心价值观

```
生产高效 | 专业可靠 | 清晰直观 | 现代简洁
```

### 1.2 设计原则

| 原则 | 说明 | 应用示例 |
|------|------|---------|
| **一致性** | 整个应用使用统一的设计语言 | 按钮、卡片、表格样式统一 |
| **层次感** | 通过颜色、大小、间距区分信息层级 | 标题 > 正文 > 辅助文字 |
| **反馈性** | 每个操作都有明确的视觉反馈 | 按钮悬停、点击效果 |
| **效率性** | 减少用户认知负担，提高操作效率 | 清晰的导航、直观的表单 |

### 1.3 设计风格

- **风格定位**: 现代企业级 SaaS 风格
- **视觉隐喻**: 简洁、专业、高效
- **边框处理**: 大量使用细边框和微阴影，避免过度装饰

---

## 2. 设计令牌系统

### 2.1 颜色系统

#### 2.1.1 主色调

基于 HSL 颜色系统，便于动态调整和主题切换。

```css
:root {
  /* Primary - 品牌主色 */
  --primary: 221 83% 53%;           /* #3B82F6 - 明亮蓝 */
  --primary-foreground: 0 0% 100%;
  --primary-light: 217 91% 65%;   /* #60A5FA */
  --primary-dark: 224 76% 48%;     /* #2563EB */

  /* Secondary - 辅助色 */
  --secondary: 210 40% 96%;        /* #F1F5F9 - 浅灰蓝 */
  --secondary-foreground: 222 47% 11%;

  /* Accent - 强调色 */
  --accent: 210 40% 96%;
  --accent-foreground: 222 47% 11%;

  /* Destructive - 危险/错误 */
  --destructive: 0 84% 60%;        /* #EF4444 - 红色 */
  --destructive-foreground: 0 0% 100%;

  /* Success - 成功 */
  --success: 142 71% 36%;          /* #22C55E - 绿色 */
  --success-foreground: 0 0% 100%;

  /* Warning - 警告 */
  --warning: 38 92% 50%;           /* #F59E0B - 橙色 */
  --warning-foreground: 0 0% 100%;

  /* Info - 信息 */
  --info: 199 89% 48%;             /* #0EA5E9 - 天蓝 */
  --info-foreground: 0 0% 100%;
}
```

#### 2.1.2 中性色阶

```css
:root {
  /* 背景色 */
  --background: 0 0% 100%;           /* #FFFFFF - 纯白背景 */
  --foreground: 222 84% 4.9%;      /* #0F172A - 深灰文字 */

  /* 边框 */
  --border: 214.3 31.8% 91.4%;      /* #E2E8F0 - 边框色 */
  --input: 214.3 31.8% 91.4%;
  --ring: 221 83% 53%;               /* 焦点环 */

  /* 卡片 */
  --card: 0 0% 100%;                 /* 卡片背景 */
  --card-foreground: 222 84% 4.9%;

  /* 弹出层 */
  --popover: 0 0% 100%;
  --popover-foreground: 222 84% 4.9%;

  /* 静音色 */
  --muted: 210 40% 96%;          /* 次要背景 */
  --muted-foreground: 215.4 16.3% 46.9%;  /* 次要文字 */

  /* 额外的灰色阶 */
  --gray-50: 210 40% 98%;
  --gray-100: 210 40% 96%;
  --gray-200: 214 32% 91%;
  --gray-300: 213 27% 84%;
  --gray-400: 215 20% 65%;
  --gray-500: 215 16% 47%;
  --gray-600: 215 19% 35%;
  --gray-700: 215 25% 27%;
  --gray-800: 217 33% 17%;
  --gray-900: 222 47% 11%;
  --gray-950: 222 84% 5%;
}
```

#### 2.1.3 暗色主题

```css
.dark {
  --background: 222 84% 4.9%;
  --foreground: 210 40% 98%;

  --card: 222 84% 4.9%;
  --card-foreground: 210 40% 98%;

  --popover: 222 84% 4.9%;
  --popover-foreground: 210 40% 98%;

  --primary: 217 91% 60%;
  --primary-foreground: 222 47% 11%;

  --secondary: 217.2 32.6% 17.5%;
  --secondary-foreground: 210 40% 98%;

  --muted: 217.2 32.6% 17.5%;
  --muted-foreground: 215 20.2% 65.1%;

  --accent: 217.2 32.6% 17.5%;
  --accent-foreground: 210 40% 98%;

  --destructive: 0 62.8% 30.6%;
  --destructive-foreground: 210 40% 98%;

  --border: 217.2 32.6% 17.5%;
  --input: 217.2 32.6% 17.5%;
  --ring: 212.7 26.8% 83.9%;
}
```

#### 2.1.4 功能色语义

| 颜色名称 | 色值 (HSL) | 用途 | 使用场景 |
|---------|-----------|------|---------|
| **Primary** | `221 83% 53%` | 品牌色、主要操作 | 主要按钮、链接、强调 |
| **Success** | `142 71% 36%` | 成功状态 | 成功提示、通过状态、完成状态 |
| **Warning** | `38 92% 50%` | 警告状态 | 警告提示、待处理、进行中 |
| **Destructive** | `0 84% 60%` | 危险/错误 | 错误提示、删除操作、危险警告 |
| **Info** | `199 89% 48%` | 信息提示 | 信息提示、帮助文档、通知 |

#### 2.1.5 图表配色方案

```typescript
const chartColors = {
  // 主系列 - 用于主要数据
  primary: "hsl(221, 83%, 53%)",      // #3B82F6
  primaryLight: "hsl(217, 91%, 65%)", // #60A5FA
  primaryDark: "hsl(224, 76%, 48%)",  // #2563EB

  // 辅助系列 - 用于对比数据
  secondary: "hsl(262, 83%, 58%)",    // #8B5CF6
  secondaryLight: "hsl(270, 91%, 75%)", // #A78BFA

  // 成功/完成
  success: "hsl(142, 71%, 36%)",       // #22C55E
  successLight: "hsl(145, 81%, 55%)",  // #4ADE80

  // 警告/进行中
  warning: "hsl(38, 92%, 50%)",         // #F59E0B
  warningLight: "hsl(46, 97%, 65%)",  // #FBBF24

  // 危险/错误
  danger: "hsl(0, 84%, 60%)",          // #EF4444
  dangerLight: "hsl(0, 91%, 71%)",     // #F87171

  // 信息
  info: "hsl(199, 89%, 48%)",       // #0EA5E9
  infoLight: "hsl(201, 94%, 65%)",  // #38BDF8

  // 中性系列
  gray: "hsl(215, 16%, 47%)",          // #64748B
  grayLight: "hsl(215, 20%, 65%)",      // #94A3B8
  grayLighter: "hsl(214, 32%, 91%)",   // #E2E8F0

  // 渐变色组合
  gradient: {
    blue: ["hsl(217, 91%, 65%)", "hsl(221, 83%, 53%)"],
    green: ["hsl(145, 81%, 55%)", "hsl(142, 71%, 36%)"],
    orange: ["hsl(46, 97%, 65%)", "hsl(38, 92%, 50%)"],
    purple: ["hsl(270, 91%, 75%)", "hsl(262, 83%, 58%)"],
  }
};
```

### 2.2 字体系统

#### 2.2.1 字体族

```css
/* 主字体 - 界面文字 */
font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";

/* 等宽字体 - 代码/数字 */
font-family: "SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas, "Liberation Mono", "Courier New", monospace;
```

#### 2.2.2 字体大小

```css
/* 字体大小阶梯 */
--text-xs: 0.75rem;     /* 12px - 标签、辅助说明 */
--text-sm: 0.875rem;    /* 14px - 次要正文 */
--text-base: 1rem;        /* 16px - 主要正文 */
--text-lg: 1.125rem;      /* 18px - 强调正文 */
--text-xl: 1.25rem;       /* 20px - 卡片标题 */
--text-2xl: 1.5rem;        /* 24px - 页面标题 */
--text-3xl: 1.875rem;      /* 30px - 大标题 */
--text-4xl: 2.25rem;       /* 36px - 超大标题 */
--text-5xl: 3rem;          /* 48px - 特大标题 */
```

#### 2.2.3 行高

```css
--leading-none: 1;        /* 标题行高 */
--leading-tight: 1.25;    /* 紧凑行高 */
--leading-normal: 1.5;     /* 正常行高 */
--leading-relaxed: 1.625;  /* 宽松行高 */
--leading-loose: 2;        /* 超宽松行高 */
```

#### 2.2.4 字体粗细

```css
--font-thin: 100;
--font-extralight: 200;
--font-light: 300;
--font-normal: 400;        /* 正常 */
--font-medium: 500;        /* 中等 - 主要正文 */
--font-semibold: 600;      /* 半粗 - 强调 */
--font-bold: 700;          /* 粗体 - 标题 */
--font-extrabold: 800;
--font-black: 900;
```

#### 2.2.5 字体使用规范

| 场景 | 大小 | 粗细 | 颜色 |
|------|------|------|------|
| 页面大标题 | 30px (text-3xl) | 700 | foreground |
| 页面副标题 | 20px (text-xl) | 600 | foreground |
| 卡片标题 | 18px (text-lg) | 600 | foreground |
| 正文 | 16px (text-base) | 400 | foreground |
| 次要正文 | 14px (text-sm) | 400 | foreground |
| 辅助说明 | 12px (text-xs) | 400 | muted-foreground |
| 按钮文字 | 14px (text-sm) | 500 | - |

### 2.3 间距系统

#### 2.3.1 基础间距单位

基于 4px 网格系统：

```css
--space-0: 0;
--space-0.5: 0.125rem;  /* 2px */
--space-1: 0.25rem;    /* 4px */
--space-1.5: 0.375rem; /* 6px */
--space-2: 0.5rem;      /* 8px */
--space-2.5: 0.625rem; /* 10px */
--space-3: 0.75rem;    /* 12px */
--space-3.5: 0.875rem; /* 14px */
--space-4: 1rem;        /* 16px */
--space-5: 1.25rem;     /* 20px */
--space-6: 1.5rem;      /* 24px */
--space-7: 1.75rem;     /* 28px */
--space-8: 2rem;        /* 32px */
--space-9: 2.25rem;     /* 36px */
--space-10: 2.5rem;      /* 40px */
--space-11: 2.75rem;     /* 44px */
--space-12: 3rem;        /* 48px */
--space-14: 3.5rem;     /* 56px */
--space-16: 4rem;        /* 64px */
--space-20: 5rem;        /* 80px */
--space-24: 6rem;        /* 96px */
--space-28: 7rem;        /* 112px */
--space-32: 8rem;        /* 128px */
--space-36: 9rem;        /* 144px */
--space-40: 10rem;       /* 160px */
--space-44: 11rem;       /* 176px */
--space-48: 12rem;       /* 192px */
--space-52: 13rem;       /* 208px */
--space-56: 14rem;       /* 224px */
--space-60: 15rem;       /* 240px */
--space-64: 16rem;       /* 256px */
--space-72: 18rem;       /* 288px */
--space-80: 20rem;       /* 320px */
--space-96: 24rem;       /* 384px */
```

#### 2.3.2 组件内间距

| 组件 | padding | 说明 |
|------|---------|------|
| 按钮 | 8px 16px | 内边距 |
| 输入框 | 8px 12px | 内边距 |
| 卡片 | 24px | 内边距 |
| 模态框 | 24px | 内边距 |
| 表格单元格 | 12px 16px | 内边距 |

#### 2.3.3 组件间间距

```css
/* 元素间 */
--gap-0.5: 2px;     /* 紧密相关元素 */
--gap-1: 4px;
--gap-1.5: 6px;
--gap-2: 8px;     /* 相关元素 */
--gap-2.5: 10px;
--gap-3: 12px;    /* 一般间距 */
--gap-3.5: 14px;
--gap-4: 16px;    /* 分组间距 */
--gap-5: 20px;
--gap-6: 24px;    /* 分隔间距 */
--gap-7: 28px;
--gap-8: 32px;
--gap-9: 36px;
--gap-10: 40px;

/* 页面布局 */
--page-padding: 24px;        /* 页面内边距 */
--section-gap: 32px;         /* 区块间距 */
--card-gap: 24px;           /* 卡片间距 */
```

### 2.4 圆角系统

```css
/* 基础圆角 */
--radius: 0.5rem;           /* 8px - 默认圆角 */

/* 组件特定圆角 */
--radius-none: 0;
--radius-sm: 0.25rem;        /* 4px - 小圆角（输入框、徽章） */
--radius-md: 0.375rem;       /* 6px - 中圆角（按钮） */
--radius-lg: 0.5rem;         /* 8px - 大圆角（卡片） */
--radius-xl: 0.75rem;        /* 12px - 超大圆角（模态框） */
--radius-2xl: 1rem;           /* 16px */
--radius-3xl: 1.5rem;         /* 24px */
--radius-full: 9999px;       /* 完全圆角（头像、图标按钮） */
```

### 2.5 阴影系统

```css
/* 阴影层级 */
--shadow-none: 0 0 #0000;
--shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);           /* 微妙阴影 */
--shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);  /* 默认阴影 */
--shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1); /* 中等阴影 */
--shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1); /* 大阴影 */
--shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1); /* 超大阴影 */
--shadow-2xl: 0 25px 50px -12px rgb(0 0 0 / 0.25);

/* 使用场景 */
.dropdown-shadow: shadow-md;
.card-shadow: shadow-sm;
.modal-shadow: shadow-xl;
.hover-shadow: shadow;
```

### 2.6 动画系统

#### 2.6.1 动画时长

```css
/* 时间系统 - 毫秒 */
--duration-instant: 50ms;     /* 即时反馈（hover 颜色变化） */
--duration-fast: 150ms;        /* 快速（按钮点击反馈） */
--duration-normal: 200ms;      /* 正常（展开/收起） */
--duration-slow: 300ms;        /* 缓慢（页面过渡） */
--duration-slower: 500ms;      /* 更慢（复杂动画） */
```

#### 2.6.2 缓动函数

```css
/* 缓动函数库 */
--ease-in: cubic-bezier(0.4, 0, 1, 1);           /* 加速进入 */
--ease-out: cubic-bezier(0, 0, 0.2, 1);          /* 减速退出 */
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);    /* 均匀 */
--ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55); /* 弹性 */

/* 常用组合 */
--transition-all: all var(--duration-normal) var(--ease-out);
--transition-transform: transform var(--duration-normal) var(--ease-out);
--transition-colors: background-color, color, border-color var(--duration-fast) var(--ease-out);
--transition-opacity: opacity var(--duration-normal) var(--ease-out);
```

#### 2.6.3 微交互动画

| 场景 | 动画 | 时长 | 缓动 | 说明 |
|------|------|------|------|------|
| 按钮悬停 | scale(1.02) + shadow | 150ms | ease-out | 轻微放大 |
| 按钮点击 | scale(0.98) | 100ms | ease-in | 点击反馈 |
| 卡片悬停 | translateY(-2px) + shadow | 200ms | ease-out | 轻微上浮 |
| 输入框聚焦 | border-color + ring | 150ms | ease-out | 焦点指示 |
| 加载中 | opacity 循环 | 1000ms | ease-in-out | 脉冲效果 |

---

## 3. 组件规范

### 3.1 Button 按钮

#### 3.1.1 变体

| 变体 | 说明 | 使用场景 |
|------|------|---------|
| default | 默认按钮，主色填充 | 主要操作、提交、确认 |
| destructive | 红色按钮，危险操作 | 删除、撤销、高危操作 |
| outline | 边框按钮 | 次要操作、取消 |
| secondary | 灰色按钮 | 次要操作、辅助功能 |
| ghost | 幽灵按钮 | 导航、工具栏 |
| link | 链接样式 | 链接、导航 |

#### 3.1.2 尺寸

| 尺寸 | 说明 | 使用场景 |
|------|------|---------|
| default | 默认尺寸 | 通用场景 |
| sm | 小尺寸 | 表格内、紧凑布局 |
| lg | 大尺寸 | 强调操作、CTA |
| icon | 图标按钮 | 仅图标操作 |

#### 3.1.3 代码示例

```typescript
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  asChild?: boolean;
}

// 尺寸规范
const buttonSizes = {
  default: { height: '40px', padding: '8px 16px', fontSize: '14px' },
  sm: { height: '32px', padding: '4px 12px', fontSize: '12px' },
  lg: { height: '48px', padding: '12px 24px', fontSize: '16px' },
  icon: { height: '40px', width: '40px', padding: '8px' },
};
```

### 3.2 Card 卡片

#### 3.2.1 结构

- Card - 卡片容器
- CardHeader - 卡片头部
- CardTitle - 卡片标题
- CardDescription - 卡片描述
- CardContent - 卡片内容
- CardFooter - 卡片底部

#### 3.2.2 代码示例

```typescript
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
}

// 悬停效果
hoverable: {
  shadow: 'var(--shadow)',
  transform: 'translateY(-2px)',
  transition: 'all 200ms ease-out',
}
```

### 3.3 Input 输入框

#### 3.3.1 状态

| 状态 | 说明 | 样式 |
|------|------|------|
| default | 默认状态 | 默认边框 |
| focus | 聚焦状态 | 主色边框 + 焦点环 |
| error | 错误状态 | 红色边框 |
| disabled | 禁用状态 | 半透明 |

#### 3.3.2 代码示例

```typescript
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}
```

### 3.4 Table 表格

#### 3.4.1 规范

```typescript
interface TableSpec {
  header: {
    background: 'var(--muted)',
    fontWeight: 600,
    fontSize: '12px',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  cell: {
    padding: '12px 16px',
    fontSize: '14px',
    borderBottom: '1px solid var(--border)',
  },
  row: {
    hover: { background: 'var(--muted)',
  }
};
```

### 3.5 其他组件

项目已实现组件清单：

| 组件 | 状态 | 说明 |
|------|------|------|
| Button | ✅ 已实现 | 5种变体，4种尺寸 |
| Card | ✅ 已实现 | 基础卡片 + 子组件 |
| Input | ✅ 已实现 | 输入框 |
| Dialog | ✅ 已实现 | 对话框 |
| Table | ✅ 已实现 | 数据表格 |
| Badge | ✅ 已实现 | 徽章 |
| Avatar | ✅ 已实现 | 头像 |
| Tabs | ✅ 已实现 | 标签页 |
| Select | ✅ 已实现 | 选择器 |
| Dropdown | ✅ 已实现 | 下拉菜单 |
| Popover | ✅ 已实现 | 弹出层 |
| Tooltip | ✅ 已实现 | 提示框 |
| Toast | ✅ 已实现 | 消息提示 |
| Skeleton | ✅ 已实现 | 骨架屏 |
| Switch | ✅ 已实现 | 开关 |
| Checkbox | ✅ 已实现 | 复选框 |
| Label | ✅ 已实现 | 标签 |
| Separator | ✅ 已实现 | 分隔线 |
| AlertDialog | ✅ 已实现 | 确认对话框 |
| Sheet | ✅ 已实现 | 侧边抽屉 |
| ScrollArea | ✅ 已实现 | 滚动区域 |
| Accordion | ✅ 已实现 | 手风琴 |
| Progress | ✅ 已实现 | 进度条 |
| Chart | 🟡 部分实现 | 需要增强 |
| StatCard | ✅ 已实现 | 统计卡片 |

---

## 4. 页面布局规范

### 4.1 布局基础

#### 4.1.1 断点系统

```css
/* 移动优先断点 */
--screen-sm: 640px;    /* 小平板 */
--screen-md: 768px;    /* 中平板 */
--screen-lg: 1024px;   /* 小笔记本 */
--screen-xl: 1280px;   /* 桌面 */
--screen-2xl: 1536px;  /* 大桌面 */
```

#### 4.1.2 栅格系统

```css
.grid-cols-1 { grid-template-columns: repeat(1, minmax(0, 1fr)); }
.grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
.grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
.grid-cols-5 { grid-template-columns: repeat(5, minmax(0, 1fr)); }
.grid-cols-6 { grid-template-columns: repeat(6, minmax(0, 1fr)); }
.grid-cols-7 { grid-template-columns: repeat(7, minmax(0, 1fr)); }
.grid-cols-8 { grid-template-columns: repeat(8, minmax(0, 1fr)); }
.grid-cols-9 { grid-template-columns: repeat(9, minmax(0, 1fr)); }
.grid-cols-10 { grid-template-columns: repeat(10, minmax(0, 1fr)); }
.grid-cols-11 { grid-template-columns: repeat(11, minmax(0, 1fr)); }
.grid-cols-12 { grid-template-columns: repeat(12, minmax(0, 1fr)); }
```

### 4.2 页面结构规范

| 场景 | 最小宽度 | 最大宽度 | 间距 |
|------|---------|---------|------|
| 内容区 | 320px | 1280px | 24px |
| 卡片网格 | 320px | - | 24px |
| 表单 | 320px | 640px | 16px |
| 侧边栏 | 240px | 280px | - |

### 4.3 典型页面布局

#### 4.3.1 仪表盘布局

```
┌─────────────────────────────────────────────────┐
│ Header (固定)                                  │
├──────────┬──────────────────────────────────────┤
│      │ Page Header                           │
│ Side │                                      │
│ bar  ├──────────────────────────────────────┤
│      │                                      │
│      │ Content                              │
│      │                                      │
│      │                                      │
│      │                                      │
└──────┴──────────────────────────────────────┘
```

#### 4.3.2 列表页布局

```
┌─────────────────────────────────────────────────┐
│ Page Header (标题 + 操作区)                    │
├───────────────────────────────────────────────┤
│ Filters (筛选区)                               │
├───────────────────────────────────────────────┤
│ Table (数据表格)                              │
│                                              │
│                                              │
└───────────────────────────────────────────────┘
```

#### 4.3.3 表单页布局

```
┌─────────────────────────────────────────────────┐
│ Page Header (标题 + 操作区)                    │
├───────────────────────────────────────────────┤
│ Form (表单区)                                 │
│                                              │
│  ┌─────────────────────────────────────┐   │
│  │ Field Group                         │   │
│  └─────────────────────────────────────┘   │
│                                              │
│  ┌─────────────────────────────────────┐   │
│  │ Field Group                         │   │
│  └─────────────────────────────────────┘   │
│                                              │
└───────────────────────────────────────────────┘
```

---

## 5. 图表规范

### 5.1 图表组件

#### 5.1.1 StatCard 统计卡片

```typescript
interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  trend?: {
    value: number;
    direction: "up" | "down" | "neutral";
  };
  icon?: React.ReactNode;
  iconColor?: string;
}
```

#### 5.1.2 ChartContainer 图表容器

```typescript
interface ChartContainerProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  height?: number;
}
```

### 5.2 图表配色应用

```typescript
// 单一数据系列
<AreaChart data={data} fill="var(--primary)" />

// 多数据系列
<LineChart data={data}>
  <Line type="monotone" dataKey="产量" stroke="var(--primary)" />
  <Line type="monotone" dataKey="合格" stroke="var(--success)" />
</LineChart>

// 饼图
<PieChart data={data}>
  <Pie dataKey="value" fill="var(--primary)" />
  <Pie dataKey="value" fill="var(--secondary)" />
</PieChart>
```

### 5.3 图表响应式

```typescript
const chartResponsiveConfig = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: "bottom" as const,
      labels: {
        usePointStyle: true,
        padding: 20,
        font: { size: 12 }
      }
    },
    tooltip: {
      backgroundColor: 'var(--card)',
      titleColor: 'var(--foreground)',
      bodyColor: 'var(--muted-foreground)',
      borderColor: 'var(--border)',
      borderWidth: 1,
      padding: 12,
      cornerRadius: 8,
    }
  }
};
```

---

## 6. 响应式设计

### 6.1 响应式原则

- **移动优先**: 先设计移动端，再逐步增强
- **内容适配**: 确保内容在所有设备上都能良好展示
- **交互优化**: 根据设备特性优化交互方式

### 6.2 响应式断点

| 断点 | 设备类型 | 典型设备 |
|------|---------|
| sm (640px) | 小平板 | iPad Mini |
| md (768px) | 中平板 | iPad |
| lg (1024px) | 小笔记本 | 13" MacBook |
| xl (1280px) | 桌面 | 15" MacBook |
| 2xl (1536px) | 大桌面 | 27" iMac |

### 6.3 响应式布局示例

```tsx
// 统计卡片网格
<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
  <StatCard />
  <StatCard />
  <StatCard />
  <StatCard />
</div>

// 图表网格
<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
  <div className="col-span-4">
    <ChartContainer />
  </div>
  <div className="col-span-3">
    <ChartContainer />
  </div>
</div>
```

---

## 7. 动画与交互规范

### 7.1 页面过渡动画

```typescript
const pageTransition = {
  duration: 300,
  easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
  effects: {
    fade: { opacity: [0, 1] },
    slide: { transform: ['translateY(10px)', 'translateY(0)'] },
    scale: { transform: ['scale(0.95)', 'scale(1)'] },
  }
};
```

### 7.2 加载动画

```typescript
// Skeleton 骨架屏
const skeletonAnimation = {
  gradient: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
  duration: '1.5s',
  easing: 'ease-in-out',
};

// 脉冲点
const pulseDot = {
  scale: [1, 1.2, 1],
  opacity: [1, 0.7, 1],
  duration: '1s',
};
```

### 7.3 反馈动画

```typescript
// 成功反馈
const successAnimation = {
  icon: '✓',
  color: 'success',
  effect: { scale: [0, 1.2, 1], opacity: [0, 1] },
  duration: 400
};

// 错误反馈
const errorAnimation = {
  icon: '✕',
  color: 'destructive',
  effect: { shake: true, duration: 400 },
  duration: 400
};
```

---

## 8. 无障碍设计

### 8.1 颜色对比度

```css
/* WCAG AA 标准 */
--contrast-normal: 4.5;    /* 正常文本 */
--contrast-large: 3.0;     /* 大文本 / 图形 */

/* 确保所有文本都符合对比度要求 */
.text-primary { color: var(--foreground); }     /* ✓ 符合 */
.text-muted { color: var(--muted-foreground); } /* ✓ 符合 */
```

### 8.2 焦点管理

```css
/* 焦点环样式 */
:focus-visible {
  outline: 2px solid var(--ring);
  outline-offset: 2px;
}

/* 跳过链接 */
.skip-link {
  position: absolute;
  top: -40px;
  left: 0;
  padding: 8px 16px;
  background: var(--primary);
  color: var(--primary-foreground);
  z-index: 100;
}
.skip-link:focus {
  top: 0;
}
```

### 8.3 ARIA 规范

```typescript
// 按钮
<button aria-label="关闭菜单" aria-expanded={isOpen}>
  <Icon aria-hidden="true" />
</button>

// 对话框
<Dialog aria-modal="true" aria-labelledby="dialog-title">
  <h2 id="dialog-title">标题</h2>
</Dialog>

// 表单
<input
  aria-invalid={hasError}
  aria-describedby={errorId}
  aria-required="true"
/>
```

---

## 9. 实施路线图

### 9.1 当前状态评估

#### 9.1.1 已完成 ✅

- [x] 基础组件库（Button, Card, Input 等）
- [x] 基础设计令牌（颜色、字体、间距）
- [x] 图表组件基础实现
- [x] 响应式布局基础
- [x] 暗色主题支持

#### 9.1.2 需要改进 🟡

- [ ] 完善设计令牌系统文档化
- [ ] 统一组件使用规范
- [ ] 图表组件增强
- [ ] 动画系统完善
- [ ] 无障碍功能完善

### 9.2 阶段一：完善设计令牌系统（1-2周）

- [ ] 更新 `index.css` 中的设计令牌
- [ ] 更新 `tailwind.config.js` 配置
- [ ] 添加缺失的设计令牌
- [ ] 确保设计令牌与文档一致

### 9.3 阶段二：增强组件库（2-3周）

- [ ] 增强 Chart 组件
- [ ] 添加更多图表类型
- [ ] 完善组件文档
- [ ] 添加组件使用示例

### 9.4 阶段三：完善动画系统（1周）

- [ ] 实现页面过渡动画
- [ ] 实现加载动画
- [ ] 实现反馈动画
- [ ] 统一动画规范

### 9.5 阶段四：完善无障碍设计（1周）

- [ ] 确保所有组件支持键盘导航
- [ ] 添加 ARIA 属性
- [ ] 确保颜色对比度符合标准
- [ ] 添加跳过链接

### 9.6 阶段五：文档与维护（持续）

- [ ] 完善组件文档
- [ ] 添加设计系统使用指南
- [ ] 建立设计系统维护流程
- [ ] 定期更新设计系统

---

## 📝 附录

### A. 设计令牌清单

所有设计令牌都应在 CSS 变量中定义，便于主题切换：

```css
/* 核心令牌 */
:root {
  /* 颜色 */
  --primary: 221 83% 53%;
  --background: 0 0% 100%;
  --foreground: 222 84% 4.9%;

  /* 尺寸 */
  --radius: 0.5rem;

  /* 动画 */
  --duration-fast: 150ms;
  --duration-normal: 200ms;
}
```

### B. 组件使用示例

#### 按钮使用示例

```tsx
<Button variant="default" size="default">
  主要操作
</Button>

<Button variant="destructive" size="sm">
  删除
</Button>

<Button variant="outline" size="icon">
  <Settings className="h-4 w-4" />
</Button>
```

#### 卡片使用示例

```tsx
<Card>
  <CardHeader>
    <CardTitle>卡片标题</CardTitle>
    <CardDescription>卡片描述信息</CardDescription>
  </CardHeader>
  <CardContent>
    <p>卡片内容区域</p>
  </CardContent>
  <CardFooter>
    <Button>操作按钮</Button>
  </CardFooter>
</Card>
```

#### 图表使用示例

```tsx
<ChartContainer title="生产统计" height={300}>
  <AreaChart data={productionData}>
    <defs>
      <linearGradient id="colorProduction" x1="0" y1="0" x2="0" y2="1">
        <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3}/>
        <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
      </linearGradient>
    </defs>
    <XAxis dataKey="date" />
    <YAxis />
    <Area
      type="monotone"
      dataKey="production"
      stroke="var(--primary)"
      fillOpacity={1}
      fill="url(#colorProduction)"
    />
  </AreaChart>
</ChartContainer>
```

### C. 文档维护

- **版本**: 2.0.0
- **最后更新**: 2026-05-12
- **下次审查**: 2026-06-12
- **维护者**: 前端团队

### D. 参考资源

- [Tailwind CSS 文档](https://tailwindcss.com/)
- [shadcn/ui 文档](https://ui.shadcn.com/)
- [WCAG 2.1 指南](https://www.w3.org/TR/WCAG21/)
- [Recharts 文档](https://recharts.org/)

---

**文档版本**: 2.0.0
**创建日期**: 2026-05-12
**下次更新**: 2026-06-12
