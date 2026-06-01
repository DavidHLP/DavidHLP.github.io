---
name: component-patterns
description: ThoughtLite 主题 Astro 组件使用模式，涵盖 Linkroll、Sensitive、TOC 等核心组件
version: 1.0.0
source: local-docs-analysis
---

# Astro 组件使用模式

## 组件目录

```
src/components/
├── Heatmap.astro      # 热力图
├── Icon.svelte        # 图标
├── Jotting.svelte     # 随笔列表
├── Linkroll.astro     # 连结组件
├── Note.svelte        # 文记列表
├── Pagination.svelte  # 分页
├── Position.astro     # 位置指示
├── Sensitive.svelte   # 敏感内容警告
└── TOC.astro          # 目录组件
```

## Linkroll 组件

### 适用场景

在 `linkroll.mdx` 中展示友情链接或推荐站点。

### 使用方式

```mdx
import Linkroll from "$components/Linkroll.astro";

export const links = [
    {
        title: "示例站点",
        url: "https://example.com",
        image: "https://example.com/favicon.ico",
        description: "这是一个示例站点",
        type: "resources"
    }
];

<Linkroll locale={props.locale} links={links} />
```

### 链接数据字段

| 字段 | 必需 | 描述 |
|------|------|------|
| `title` | ✅ | 显示标题 |
| `url` | ✅ | 目标地址 |
| `type` | ✅ | 分类类型 |
| `image` | ❌ | 站点图标 URL |
| `description` | ❌ | 描述文字 |

### 分类类型枚举

| 值 | 含义 |
|----|------|
| `resources` | 工具与资源 |
| `community` | 组织与项目 |
| `insights` | 媒体与灵感 |
| `technology` | 技术与开发 |
| `expertise` | 专业与学术 |
| `creative` | 设计与创意 |
| `lifestyle` | 生活与爱好 |
| `general` | 综合与其它 |

### 组件参数

- `locale` - 当前页面语言代码，由 `about.astro` 以组件参数方式提供
- `links` - 链接数据数组

## Sensitive 组件

### 适用场景

标记可能引起不适的内容，访问时显示警告。

### 使用方式

在 frontmatter 中标记：

```yaml
---
sensitive: true
---
```

组件自动检测 `sensitive` 字段并渲染警告界面。

## TOC 组件

### 适用场景

为长文生成目录导航。

### 使用方式

在 frontmatter 中启用：

```yaml
---
toc: true
---
```

自动从 Markdown 标题生成目录结构。

## 图片引用模式

### 相对路径（推荐）

创建文章同名目录，使用 `index.md`：

```
article-name/
├── index.md
└── image.png
```

```md
![描述](image.png)
```

### 绝对路径

```md
![描述](/image.png)
```

### 外部 URL

```md
![描述](https://host/image.png)
```

## 组件开发约定

- `.astro` 组件用于静态/服务端渲染
- `.svelte` 组件用于交互式客户端功能
- 使用 `$components` 别名导入组件
- 使用 `$icons` 别名导入图标 SVG
- MDX 文件中可使用 `props` 访问页面参数
