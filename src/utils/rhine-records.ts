export interface BlogArchive {
	id: string;
	title: string;
	en: string;
	department: string;
	category: string;
	categoryKey?: ArchiveCategory;
	date: string;
	lead: string;
	clearance: string;
	abstract: string;
	findings: string[];
	source: string;
}

export const ARCHIVE_CATEGORIES = [
	"resicache",
	"ulticode",
	"ai-systems",
	"architecture",
	"data-cache",
	"java-backend",
	"infra-ops",
	"general",
	"jotting"
] as const;

export type ArchiveCategory = (typeof ARCHIVE_CATEGORIES)[number];

const CATEGORY_TAGS: Record<ArchiveCategory, readonly string[]> = {
	resicache: ["resicache"],
	ulticode: ["ulticode"],
	"ai-systems": [
		"hindsight",
		"omp",
		"headroom",
		"codex",
		"mcp",
		"knowledge base",
		"rag",
		"agent",
		"llm",
		"ollama",
		"opencode",
		"claudecode",
		"fastmcp"
	],
	"data-cache": [
		"redis",
		"mysql",
		"hbase",
		"bigdata",
		"datamodel",
		"storageengine",
		"innodb",
		"spark",
		"hadoop",
		"flyway",
		"schema drift",
		"database",
		"redisson",
		"spring data redis",
		"cache",
		"caching",
		"distributedcache",
		"persistence",
		"rdb",
		"aof",
		"datastructure",
		"multilevelcache",
		"springcache"
	],
	"java-backend": [
		"java",
		"javaapi",
		"juc",
		"jvm",
		"springboot",
		"springcloud",
		"mybatis",
		"apache dubbo",
		"nacos",
		"jjwt",
		"jwt",
		"backend",
		"testcontainers",
		"atomicboolean",
		"thread",
		"autocloseable"
	],
	"infra-ops": [
		"docker",
		"docker compose",
		"devops",
		"operations",
		"ci",
		"kubernetes",
		"linux",
		"ssh",
		"systemd",
		"container",
		"compose",
		"tls",
		"cloudflare",
		"infrastructure",
		"network",
		"sre",
		"troubleshooting",
		"sandbox",
		"readiness",
		"proxy",
		"routing",
		"endpoint management",
		"orchestration"
	],
	architecture: [
		"architecture design",
		"microservices",
		"ddd",
		"dataowner",
		"data ownership",
		"bounded context",
		"contract",
		"distributed systems",
		"high availability",
		"hybridcloud"
	],
	general: [],
	jotting: []
};

const CATEGORY_PRIORITY = ["resicache", "ulticode", "ai-systems", "architecture", "java-backend", "data-cache", "infra-ops"] as const;

function normalizeTag(value: string) {
	return value.trim().toLowerCase().replace(/\s+/g, " ");
}

/** Assign one stable primary topic so labels can be translated independently. */
export function archiveCategoryFor(record: Pick<BlogArchive, "title" | "findings">, collection: string): ArchiveCategory {
	if (collection === "jotting") return "jotting";
	const tags = new Set((record.findings ?? []).map(normalizeTag));
	const title = record.title.toLowerCase();
	for (const category of CATEGORY_PRIORITY) {
		if (CATEGORY_TAGS[category].some(tag => tags.has(tag))) return category;
		if ((category === "resicache" || category === "ulticode") && title.includes(category)) return category;
	}
	return "general";
}

/** Navigation columns contain only real, nonempty categories in a deliberate order. */
export function archiveColumnsFor(records: BlogArchive[]) {
	const present = new Set(records.map(record => record.category).filter(Boolean));
	const labels = new Map<ArchiveCategory, string>();
	for (const record of records) {
		if (record.categoryKey && record.category && !labels.has(record.categoryKey)) labels.set(record.categoryKey, record.category);
	}
	const ordered = ARCHIVE_CATEGORIES.flatMap(category => {
		const label = labels.get(category);
		return label ? [label] : [];
	});
	return [...ordered, ...[...present].filter(category => !ordered.includes(category))];
}
