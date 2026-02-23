import siteConfig from "./src/utils/config";

const config = siteConfig({
	title: "DavidHLPL",
	prologue: "Talk is cheap. Show me the code.",
	author: {
		name: "DavidHLPL",
		email: "lysf15520112973@163.com",
		link: "https://github.com/DavidHLP"
	},
	description: "DavidHLPL 的技术博客，分享编程学习心得与项目经验",
	copyright: {
		type: "CC BY-NC-ND 4.0",
		year: "2025"
	},
	i18n: {
		locales: ["en", "zh-cn", "ja"],
		defaultLocale: "zh-cn"
	},
	pagination: {
		note: 15,
		jotting: 24
	},
	heatmap: {
		unit: "day",
		weeks: 20
	},
	feed: {
		section: "*",
		limit: 20
	},
	latest: "*"
});

export const monolocale = Number(config.i18n.locales.length) === 1;

export default config;
