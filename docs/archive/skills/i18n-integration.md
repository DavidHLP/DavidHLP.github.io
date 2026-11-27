---
name: i18n-integration
description: ThoughtLite 主题国际化集成指南，涵盖添加新语言、翻译文件管理、字体配置、单语言模式
version: 1.0.0
source: local-docs-analysis
---

# 国际化集成指南

## 当前支持语言

| 代码 | 语言 | 字体 |
|------|------|------|
| `en` | English | Noto Serif |
| `zh-cn` | 简体中文 | Noto Serif SC |
| `ja` | 日本語 | Noto Serif JP |

## 添加新语言完整流程

### 步骤 1：创建翻译文件

在 `src/i18n/{lang}/` 下创建 YAML 翻译文件：

```yaml
# src/i18n/tlh/index.yaml
language: tlhIngan Hol  # 必需：语言显示名称
# ... 其他翻译字段参考已有文件
```

同时创建 `script.yaml` 和 `linkroll.yaml`。

### 步骤 2：注册翻译

编辑 `src/i18n/index.ts`：

```ts
import tlh from "./tlh/index.yaml";
import tlhScript from "./tlh/script.yaml";
import tlhLinkroll from "./tlh/linkroll.yaml";

const translations = {
  // ... 现有语言
  tlh: {
    ...tlh,
    script: tlhScript,
    linkroll: tlhLinkroll
  }
};
```

### 步骤 3：配置字体（如需特定字体）

在 `astro.config.ts` 的 `experimental.fonts` 中注册：

```ts
{
    name: "Noto Serif TLH",
    provider: SpecificFontProvider(),
    weights: [400, 700],
    fallbacks: ["serif"],
    cssVariable: "--font-noto-serif-tlh"
}
```

### 步骤 4：添加字体映射

在 `src/layouts/App.astro` 中：

```ts
const serifFonts: Record<string, CssVariable> = {
    en: "--font-noto-serif",
    "zh-cn": "--font-noto-serif-sc",
    ja: "--font-noto-serif-jp",
    tlh: "--font-noto-serif-tlh"
};
```

在 `src/styles/global.css` 中：

```css
:lang(tlh) {
    --font-serif: var(--font-noto-serif-tlh);
}
```

### 步骤 5：配置 OG 图片字体

在 `src/graph/default.ts` 和 `src/graph/content.ts` 中：

```ts
const notoFonts: Record<string, string> = {
    en: "Noto Serif",
    "zh-cn": "Noto Serif SC",
    ja: "Noto Serif JP",
    tlh: "Noto Serif TLH"
};
```

### 步骤 6：注册语言到配置

```ts
// site.config.ts
i18n: {
    locales: ["en", "zh-cn", "ja", "tlh"],
    defaultLocale: "en"
}
```

### 步骤 7：创建内容目录

```
src/content/
├── note/tlh/
├── jotting/tlh/
├── information/tlh/
└── preface/tlh/
```

## 单语言模式配置

```ts
// site.config.ts
i18n: {
    locales: ["zh-cn"],       // 仅保留目标语言
    defaultLocale: "zh-cn"
}
```

效果：
- 语言切换功能自动隐藏
- 内容目录移除语言子目录层级
- 已有的其他语言翻译文件可保留不影响

## 翻译文件结构

```
src/i18n/
├── index.ts          # 翻译注册入口
├── en/
│   ├── index.yaml    # 主翻译
│   ├── script.yaml   # 脚本相关翻译
│   └── linkroll.yaml # 连结组件翻译
├── ja/
│   ├── index.yaml
│   ├── script.yaml
│   └── linkroll.yaml
└── zh-cn/
    ├── index.yaml
    ├── script.yaml
    └── linkroll.yaml
```

## 常见问题

| 问题 | 原因 | 解决方案 |
|------|------|----------|
| 新语言不显示 | 未在 `locales` 中注册 | 添加到 `site.config.ts` 的 `i18n.locales` |
| 字体不生效 | 缺少字体映射 | 在 `App.astro` 和 `global.css` 中添加映射 |
| OG 图片字体缺失 | 未配置 `notoFonts` | 在 `graph/default.ts` 和 `graph/content.ts` 中添加 |
| YAML 解析错误 | 标题含特殊字符 | 用引号包裹 title 字段 |
