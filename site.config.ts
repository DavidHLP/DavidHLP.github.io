import siteConfig from "./src/utils/config";

const config = siteConfig({
	title: "DavidHLPL",
	prologue: "Talk is cheap. Show me the code.",
	prologueAuthor: "Linus Torvalds",
	author: {
		name: "DavidHLPL",
		email: "lysf15520112973@163.com",
		link: "https://github.com/DavidHLP"
	},
	description: "DavidHLPL 的个人 AI 知识库，使用 LLM 持续整理可追溯的技术与工程知识",
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
