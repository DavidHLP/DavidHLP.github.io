import type {
	ExpressiveCodeConfig,
	LicenseConfig,
	NavBarConfig,
	ProfileConfig,
	SiteConfig,
} from "./types/config";
import { LinkPreset } from "./types/config";

export const siteConfig: SiteConfig = {
	title: "David's Blog",
	subtitle: "Tech Blog",
	lang: "zh_CN", // 支持的语言：'en', 'zh_CN', 'zh_TW', 'ja', 'ko', 'es', 'th'
	themeColor: {
		hue: 250, // 主题颜色的默认色调，范围0-360。例如：红色: 0, 蓝绿色: 200, 青色: 250, 粉色: 345
		fixed: false, // 为访客隐藏主题颜色选择器
	},
	banner: {
		enable: true,
		src: "assets/images/111024784_p1.png", // 相对于 /src 目录的路径。如果以 '/' 开头，则相对于 /public 目录
		position: "bottom", // 等同于 object-position，仅支持 'top'、'center'、'bottom'，默认为 'center'
		credit: {
			enable: true, // 是否显示横幅图片的版权信息
			text: "空色天絵", // 要显示的版权文本
			url: "https://www.pixiv.net/artworks/111024784", // （可选）原始作品或艺术家页面的链接
		},
	},
	toc: {
		enable: true, // 是否在文章右侧显示目录
		depth: 2, // 目录中显示的最大标题深度，范围1-3
	},
	favicon: [
		// 留空数组以使用默认网站图标
		// {
		//   src: '/favicon/icon.png',    // 网站图标的路径，相对于 /public 目录
		//   theme: 'light',              // （可选）'light' 或 'dark'，仅在您有浅色和深色模式的不同图标时设置
		//   sizes: '32x32',              // （可选）网站图标的尺寸，仅在您有不同尺寸的图标时设置
		// }
	],
};

export const navBarConfig: NavBarConfig = {
	links: [
		LinkPreset.Home,
		LinkPreset.Archive,
		LinkPreset.About,
		{
			name: "GitHub",
			url: "https://github.com/DavidHLP", // 内部链接不应包含基础路径，因为会自动添加
			external: true, // 显示外部链接图标并在新标签页中打开
		},
	],
};

export const profileConfig: ProfileConfig = {
	avatar: "assets/images/demo-avatar.png", // 相对于 /src 目录的路径。如果以 '/' 开头，则相对于 /public 目录
	name: "David HLP",
	bio: `"Success is not an accident. It is hard work, perseverance, learning, studying, sacrifice, and most of all, love of what you are doing." — Linus Torvalds (Creator of Linux)`,
	links: [
		{
			name: "Twitter",
			icon: "fa6-brands:twitter", // 访问 https://icones.js.org/ 获取图标代码
			// 如果尚未安装相应的图标集，您需要先安装
			// `pnpm add @iconify-json/<图标集名称>`
			url: "https://twitter.com",
		},
		{
			name: "Steam",
			icon: "fa6-brands:steam",
			url: "https://store.steampowered.com",
		},
		{
			name: "GitHub",
			icon: "fa6-brands:github",
			url: "https://github.com/DavidHLP",
		},
	],
};

export const licenseConfig: LicenseConfig = {
	enable: true, // 是否启用许可证信息
	name: "CC BY-NC-SA 4.0", // 许可证名称
	url: "https://creativecommons.org/licenses/by-nc-sa/4.0/", // 许可证链接
};

export const darkCodeConfig: ExpressiveCodeConfig = {
	// 请注意，某些样式（例如背景颜色）被覆盖，见 astro.config.mjs 文件。
	// 请选择一个暗黑主题，因为当前博客主题仅支持暗黑背景颜色
	theme: "laserwave",
};

export const lightCodeConfig: ExpressiveCodeConfig = {
	// 请注意，某些样式（例如背景颜色）被覆盖，见 astro.config.mjs 文件。
	// 请选择一个暗黑主题，因为当前博客主题仅支持暗黑背景颜色
	theme: "everforest-light",
};

