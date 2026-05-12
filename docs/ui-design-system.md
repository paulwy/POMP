# POMP 企业管理系统 - UI 设计系统

> 版本: 1.0.0
> 更新日期: 2026-05-10
> 状态: 🟡 草稿 - 持续迭代中

---

## 📋 目录

1. [设计原则](#1-设计原则)
2. [配色系统](#2-配色系统)
3. [字体系统](#3-字体系统)
4. [间距系统](#4-间距系统)
5. [圆角与阴影](#5-圆角与阴影)
6. [动画设计](#6-动画设计)
7. [组件规范](#7-组件规范)
8. [图表规范](#8-图表规范)
9. [响应式设计](#9-响应式设计)
10. [无障碍设计](#10-无障碍设计)

---

## 1. 设计原则

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

## 2. 配色系统

### 2.1 主色调

基于 HSL 颜色系统，便于动态调整和主题切换。

```css
/* 亮色主题 */
:root {
  /* Primary - 品牌主色 */
  --primary: 221 83% 53%;           /* #3B82F6 - 明亮蓝 */
  --primary-foreground: 0 0% 100%;

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

  /* Warning - 警告 */
  --warning: 38 92% 50%;           /* #F59E0B - 橙色 */
}
```

### 2.2 功能色语义

| 颜色名称 | 色值 (HSL) | 用途 | 使用场景 |
|---------|-----------|------|---------|
| **Primary** | `221 83% 53%` | 品牌色、主要操作 | 按钮、链接、强调 |
| **Success** | `142 71% 36%` | 成功状态 | 成功提示、通过状态 |
| **Warning** | `38 92% 50%` | 警告状态 | 警告提示、待处理 |
| **Destructive** | `0 84% 60%` | 危险/错误 | 错误提示、删除操作 |
| **Info** | `199 89% 48%` | 信息提示 | 信息提示、帮助文档 |

### 2.3 中性色阶

```css
/* 背景色 */
--background: 0 0% 100%;           /* #FFFFFF - 纯白背景 */
--foreground: 222 47% 11%;         /* #0F172A - 深灰文字 */

/* 边框 */
--border: 214 32% 91%;             /* #E2E8F0 - 边框色 */
--input: 214 32% 91%;              /* 输入框边框 */
--ring: 221 83% 53%;               /* 焦点环 */

/* 卡片 */
--card: 0 0% 100%;                 /* 卡片背景 */
--card-foreground: 222 47% 11%;   /* 卡片文字 */

/* 静音色 */
--muted: 210 40% 96%;              /* 次要背景 */
--muted-foreground: 215 16% 46%;   /* 次要文字 */
```

### 2.4 图表配色方案

与设计系统保持一致的图表配色：

```typescript
const chartColors = {
  // 主系列 - 用于主要数据
  primary: 'hsl(221, 83%, 53%)',      // #3B82F6
  primaryLight: 'hsl(217, 91%, 65%)', // #60A5FA

  // 辅助系列 - 用于对比数据
  secondary: 'hsl(262, 83%, 58%)',    // #8B5CF6
  secondaryLight: 'hsl(270, 91%, 75%)', // #A78BFA

  // 成功/完成
  success: 'hsl(142, 71%, 36%)',       // #22C55E
  successLight: 'hsl(145, 81%, 55%)',  // #4ADE80

  // 警告/进行中
  warning: 'hsl(38, 92%, 50%)',         // #F59E0B
  warningLight: 'hsl(46, 97%, 65%)',    // #FBBF24

  // 危险/错误
  danger: 'hsl(0, 84%, 60%)',          // #EF4444
  dangerLight: 'hsl(0, 91%, 71%)',     // #F87171

  // 中性系列
  gray: 'hsl(215, 16%, 46%)',          // #64748B
  grayLight: 'hsl(215, 20%, 65%)',      // #94A3B8
  grayLighter: 'hsl(214, 32%, 91%)',    // #E2E8F0

  // 渐变色组合
  gradient: {
    blue: ['hsl(217, 91%, 65%)', 'hsl(221, 83%, 53%)'],
    green: ['hsl(145, 81%, 55%)', 'hsl(142, 71%, 36%)'],
    orange: ['hsl(46, 97%, 65%)', 'hsl(38, 92%, 50%)'],
  }
};
```

### 2.5 暗色主题（未来扩展）

```css
/* 暗色主题 */
[data-theme="dark"] {
  --background: 222 47% 11%;        /* #0F172A */
  --foreground: 210 40% 96%;        /* #F1F5F9 */

  --card: 217 33% 17%;              /* #1E293B */
  --card-foreground: 210 40% 96%;

  --primary: 217 91% 65%;           /* #60A5FA */
  --primary-foreground: 222 47% 11%;

  --muted: 217 33% 17%;
  --muted-foreground: 215 16% 64%;

  --border: 217 33% 25%;            /* #334155 */
  --input: 217 33% 25%;
}
```

---

## 3. 字体系统

### 3.1 字体族

```css
/* 主字体 - 界面文字 */
font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;

/* 等宽字体 - 代码/数字 */
font-family: "SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas, monospace;
```

### 3.2 字体大小

```css
/* 字体大小阶梯 */
--text-xs: 0.75rem;     /* 12px - 标签、辅助说明 */
--text-sm: 0.875rem;    /* 14px - 次要正文 */
--text-base: 1rem;      /* 16px - 主要正文 */
--text-lg: 1.125rem;    /* 18px - 强调正文 */
--text-xl: 1.25rem;     /* 20px - 卡片标题 */
--text-2xl: 1.5rem;     /* 24px - 页面标题 */
--text-3xl: 1.875rem;   /* 30px - 大标题 */
--text-4xl: 2.25rem;    /* 36px - 超大标题 */

/* 行高 */
--leading-none: 1;        /* 标题行高 */
--leading-tight: 1.25;    /* 紧凑行高 */
--leading-normal: 1.5;     /* 正常行高 */
--leading-relaxed: 1.75;  /* 宽松行高 */
```

### 3.3 字体粗细

```css
--font-normal: 400;      /* 正常 */
--font-medium: 500;      /* 中等 - 主要正文 */
--font-semibold: 600;    /* 半粗 - 强调 */
--font-bold: 700;        /* 粗体 - 标题 */
```

### 3.4 字体使用规范

| 场景 | 大小 | 粗细 | 颜色 |
|------|------|------|------|
| 页面大标题 | 30px (text-3xl) | 700 | foreground |
| 页面副标题 | 20px (text-xl) | 600 | foreground |
| 卡片标题 | 18px (text-lg) | 600 | foreground |
| 正文 | 14px (text-base) | 400 | foreground |
| 辅助说明 | 12px (text-xs) | 400 | muted-foreground |
| 按钮文字 | 14px (text-sm) | 500 | - |

---

## 4. 间距系统

### 4.1 基础间距单位

基于 4px 网格系统：

```css
--space-0: 0;
--space-1: 0.25rem;    /* 4px */
--space-2: 0.5rem;      /* 8px */
--space-3: 0.75rem;    /* 12px */
--space-4: 1rem;        /* 16px */
--space-5: 1.25rem;     /* 20px */
--space-6: 1.5rem;      /* 24px */
--space-8: 2rem;        /* 32px */
--space-10: 2.5rem;     /* 40px */
--space-12: 3rem;       /* 48px */
--space-16: 4rem;       /* 64px */
```

### 4.2 组件内间距

| 组件 | padding | 说明 |
|------|---------|------|
| 按钮 | 8px 16px | 内边距 |
| 输入框 | 8px 12px | 内边距 |
| 卡片 | 24px | 内边距 |
| 模态框 | 24px | 内边距 |
| 表格单元格 | 12px 16px | 内边距 |

### 4.3 组件间间距

```css
/* 元素间 */
--gap-1: 4px;     /* 紧密相关元素 */
--gap-2: 8px;     /* 相关元素 */
--gap-3: 12px;    /* 一般间距 */
--gap-4: 16px;    /* 分组间距 */
--gap-6: 24px;    /* 分隔间距 */

/* 页面布局 */
--page-padding: 24px;        /* 页面内边距 */
--section-gap: 32px;         /* 区块间距 */
--card-gap: 24px;           /* 卡片间距 */
```

---

## 5. 圆角与阴影

### 5.1 圆角系统

```css
/* 基础圆角 */
--radius: 0.5rem;           /* 8px - 默认圆角 */

/* 组件特定圆角 */
--radius-sm: 0.25rem;        /* 4px - 小圆角（输入框、徽章） */
--radius-md: 0.375rem;       /* 6px - 中圆角（按钮） */
--radius-lg: 0.5rem;         /* 8px - 大圆角（卡片） */
--radius-xl: 0.75rem;        /* 12px - 超大圆角（模态框） */
--radius-full: 9999px;       /* 完全圆角（头像、图标按钮） */
```

### 5.2 阴影系统

```css
/* 阴影层级 */
--shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);           /* 微妙阴影 */
--shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);  /* 默认阴影 */
--shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1); /* 中等阴影 */
--shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1); /* 大阴影 */
--shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1); /* 超大阴影 */

/* 使用场景 */
.dropdown-shadow: shadow-md;
.card-shadow: shadow-sm;
.modal-shadow: shadow-xl;
.hover-shadow: shadow;
```

---

## 6. 动画设计

### 6.1 动画原则

```
流畅自然 | 快速响应 | 目的明确 | 性能优先
```

### 6.2 动画时长

```css
/* 时间系统 - 毫秒 */
--duration-instant: 50ms;     /* 即时反馈（hover 颜色变化） */
--duration-fast: 150ms;        /* 快速（按钮点击反馈） */
--duration-normal: 200ms;      /* 正常（展开/收起） */
--duration-slow: 300ms;        /* 缓慢（页面过渡） */
--duration-slower: 500ms;      /* 更慢（复杂动画） */
```

### 6.3 缓动函数

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
```

### 6.4 微交互动画

| 场景 | 动画 | 时长 | 缓动 | 说明 |
|------|------|------|------|------|
| 按钮悬停 | scale(1.02) + shadow | 150ms | ease-out | 轻微放大 |
| 按钮点击 | scale(0.98) | 100ms | ease-in | 点击反馈 |
| 卡片悬停 | translateY(-2px) + shadow | 200ms | ease-out | 轻微上浮 |
| 输入框聚焦 | border-color + ring | 150ms | ease-out | 焦点指示 |
| 加载中 | opacity 循环 | 1000ms | ease-in-out | 脉冲效果 |

### 6.5 页面过渡动画

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

### 6.6 加载动画

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

### 6.7 反馈动画

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

## 7. 组件规范

### 7.1 按钮

```typescript
interface ButtonVariants {
  variant: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size: 'default' | 'sm' | 'lg' | 'icon';
}

// 尺寸规范
const buttonSizes = {
  default: { height: '40px', padding: '8px 16px', fontSize: '14px' },
  sm: { height: '32px', padding: '4px 12px', fontSize: '12px' },
  lg: { height: '48px', padding: '12px 24px', fontSize: '16px' },
  icon: { height: '40px', width: '40px', padding: '8px' },
};
```

### 7.2 卡片

```typescript
interface CardSpec {
  padding: '24px',
  borderRadius: '8px',
  border: '1px solid var(--border)',
  shadow: 'var(--shadow-sm)',
  background: 'var(--card)',

  // 悬停状态
  hover: {
    shadow: 'var(--shadow)',
    transform: 'translateY(-2px)',
    transition: 'all 200ms ease-out',
  }
}
```

### 7.3 输入框

```typescript
interface InputSpec {
  height: '40px',
  padding: '8px 12px',
  borderRadius: '6px',
  border: '1px solid var(--border)',
  fontSize: '14px',

  // 状态
  states: {
    default: { border: 'var(--border)' },
    focus: { border: 'var(--primary)', ring: '2px solid var(--ring)' },
    error: { border: 'var(--destructive)' },
    disabled: { opacity: 0.5, cursor: 'not-allowed' },
  }
}
```

### 7.4 表格

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
    hover: { background: 'var(--muted)' },
  }
}
```

---

## 8. 图表规范

### 8.1 图表组件命名

```typescript
// 统计卡片组件
<StatCard
  title="标题"
  value={数字}
  trend={趋势数值}
  trendDirection="up" | "down"
  icon={图标}
/>

// 图表包装器
<ChartContainer
  title="图表标题"
  subtitle="副标题"
  height={300}
>
  <AreaChart data={data} />
</ChartContainer>
```

### 8.2 图表配色应用

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

### 8.3 图表响应式

```typescript
const chartResponsiveConfig = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom' as const,
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

## 9. 响应式设计

### 9.1 断点系统

```css
/* 移动优先断点 */
--screen-sm: 640px;    /* 小平板 */
--screen-md: 768px;    /* 中平板 */
--screen-lg: 1024px;   /* 小笔记本 */
--screen-xl: 1280px;   /* 桌面 */
--screen-2xl: 1536px;  /* 大桌面 */
```

### 9.2 栅格系统

```css
.grid-cols-1 { grid-template-columns: repeat(1, minmax(0, 1fr)); }
.grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
.grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }

/* 响应式调整 */
@media (min-width: 768px) {
  .md\:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .md\:grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
}

@media (min-width: 1024px) {
  .lg\:grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
}
```

### 9.3 布局规范

| 场景 | 最小宽度 | 最大宽度 | 间距 |
|------|---------|---------|------|
| 内容区 | 320px | 1280px | 24px |
| 卡片网格 | 320px | - | 24px |
| 表单 | 320px | 640px | 16px |
| 侧边栏 | 240px | 280px | - |

---

## 10. 无障碍设计

### 10.1 颜色对比度

```css
/* WCAG AA 标准 */
--contrast-normal: 4.5;    /* 正常文本 */
--contrast-large: 3.0;     /* 大文本 / 图形 */

/* 确保所有文本都符合对比度要求 */
.text-primary { color: var(--foreground); }     /* ✓ 符合 */
.text-muted { color: var(--muted-foreground); } /* ✓ 符合 */
```

### 10.2 焦点管理

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

### 10.3 ARIA 规范

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

## 📝 附录

### A. 设计令牌清单

所有设计令牌都应在 CSS 变量中定义，便于主题切换：

```css
/* 核心令牌 */
:root {
  /* 颜色 */
  --primary: ;
  --background: ;
  --foreground: ;

  /* 尺寸 */
  --radius: ;

  /* 动画 */
  --duration-fast: ;
  --duration-normal: ;
}
```

### B. 组件清单

| 组件 | 状态 | 说明 |
|------|------|------|
| Button | ✅ 已实现 | 5种变体 |
| Card | ✅ 已实现 | 基础卡片 |
| Input | ✅ 已实现 | 输入框 |
| Dialog | ✅ 已实现 | 对话框 |
| Table | ✅ 已实现 | 数据表格 |
| Badge | ✅ 已实现 | 徽章 |
| Avatar | ✅ 已实现 | 头像 |
| Tabs | ✅ 已实现 | 标签页 |
| Chart | 🟡 待增强 | 需统一样式 |
| Dashboard | 🔴 待实现 | 需新建 |

### C. 文档维护

- **版本**: 1.0.0
- **最后更新**: 2026-05-10
- **下次审查**: 2026-06-10
- **维护人**: 前端团队

### D. 改进计划

- [ ] 实现暗色主题
- [ ] 创建统一的图表组件库
- [ ] 添加更多动画效果
- [ ] 完善无障碍功能
- [ ] 优化移动端体验

---

## 🎨 示例代码

### 按钮使用示例

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

### 卡片使用示例

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

### 图表使用示例

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

---

**文档版本**: 1.0.0
**创建日期**: 2026-05-10
**下次更新**: 待定
