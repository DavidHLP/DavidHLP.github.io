import siteConfig from "./src/utils/config";

const config = siteConfig({
	title: "DavidHLPL",
	prologue: "技术分享与学习笔记\n记录成长历程中的点点滴滴",
	author: {
		name: "DavidHLPL",
		email: "david@example.com",
		link: "https://github.com/DavidHLP"
	},
	description: "DavidHLPL 的技术博客，分享编程学习心得与项目经验",
	copyright: {
		type: "CC BY-NC-ND 4.0",
		year: "2025"
	},
	i18n: {
		locales: ["en", "zh-cn", "ja"],
		defaultLocale: "en"
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
