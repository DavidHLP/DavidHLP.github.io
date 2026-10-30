import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile, copyFile } from "node:fs/promises";
import { dirname, resolve, posix } from "node:path";
import { parse } from "yaml";

const source = resolve(process.argv[2] ?? "../DavidHLP.github.io");
const revision = "f49953fb0d4bd52a39bf81167b0c4b7dd7d78a64";
const git = (...args) => execFileSync("git", ["-C", source, ...args], { encoding: "utf8" }).trim();
if (git("rev-parse", "HEAD") !== revision || git("status", "--porcelain"))
  throw new Error(`Import requires a clean source checkout at ${revision}`);
const repository = "https://github.com/DavidHLP/DavidHLP.github.io";
const capturedAt = git("show", "-s", "--format=%cI", revision);
const files = git("ls-files").split("\n");
const documents = files.filter(path => /\.(md|mdx|txt|pdf)$/i.test(path) ||
  /^src\/content\/.*\.(yaml|sha256)$/.test(path) || /(^|\/)LICENSE$/.test(path));
const assets = files.filter(path => (path.startsWith("public/") || path.startsWith(".github/assets/")) &&
  (/\.(png|webp|jpe?g|gif|svg|ico)$/.test(path) || path.startsWith("public/licenses/")));
const categories = { note: "工程研究", raw: "能量研究", information: "机构档案", preface: "生命科学", jotting: "特别项目" };
const headings = { note: "ENGINEERING NOTES", raw: "SOURCE ARCHIVE", information: "SITE INFORMATION", preface: "PREFACE", jotting: "JOTTINGS", documentation: "DOCUMENTATION" };
const departments = { note: "工程笔记", raw: "原始资料", information: "站点信息", preface: "序文", jotting: "随笔", documentation: "项目文档" };
const entries = [];
const routes = {};
const missingResources = [];
const write = async (path, body) => {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, body);
};
for (const path of documents) {
  const target = `migration/source/${path}`;
  await mkdir(dirname(target), { recursive: true });
  await copyFile(resolve(source, path), target);
  const contentDocument = path.startsWith("src/content/") && /\.(mdx?|yaml)$/.test(path);
  const repositoryDocument = /^(?:docs\/.*|[^/]+)\.md$/.test(path) && !/^(AGENTS|CLAUDE)\.md$/.test(path);
  if (!contentDocument && !repositoryDocument) continue;
  const original = await readFile(resolve(source, path), "utf8");
  const match = original.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  const data = match ? parse(match[1]) : {};
  const key = contentDocument ? path.slice("src/content/".length) : `documentation/${path}`;
  const slug = `legacy/${key.replace(/\.(mdx?|yaml)$/, "").toLowerCase()}`;
  const [, locale, name] = key.split("/");
  const title = data.title || (match?.[2] ?? original).match(/^#{1,2}\s+(.+)$/m)?.[1] ||
    (key.startsWith("preface/") ? `${data.author} · ${name.replace(/\.md$/, "")}` : posix.basename(path));
  entries.push({ path, key, slug, data, title, body: match?.[2] ?? original, category: categories[key.split("/")[0]] ?? "特别项目", locale });
}
entries.sort((a, b) => a.path.localeCompare(b.path, "en"));
const pathEntries = new Map(entries.map(entry => [entry.path, entry]));
const publishedTarget = entry => {
  if (!entry.data.draft) return `/blog/${entry.slug}/`;
  const canonical = pathEntries.get(entry.path.replace(/\/(en|ja)\//, "/zh-cn/"));
  return canonical && !canonical.data.draft ? `/blog/${canonical.slug}/` : undefined;
};
for (const entry of entries) {
  const [collection, locale, filename] = entry.key.split("/");
  if (!["note", "jotting", "information", "preface", "raw"].includes(collection)) continue;
  const prefix = locale === "zh-cn" ? "" : `/${locale}`;
  const name = filename.replace(/\.(mdx?|yaml)$/, "");
  const target = publishedTarget(entry);
  if (!target) continue;
  routes[`${prefix}/${collection}/${name}`] = target;
  if (collection === "information") {
    const page = { introduction: "about", policy: "policy", "kb-index": "kb", "kb-log": "kb-log", linkroll: "linkroll", chronicle: "chronicle" }[name];
    if (page) routes[`${prefix}/${page}`] = target;
  }
}
for (const locale of ["", "/en", "/ja"]) {
  routes[`${locale}/note`] = "/";
  routes[`${locale}/jotting`] = "/";
  routes[`${locale}/feed.xml`] = "/rss.xml";
  routes[`${locale}/preface`] = `/blog/legacy/preface/${locale.slice(1) || "zh-cn"}/2026-06-19-18-00-00/`;
}
const assetTarget = path => `/legacy-assets/${path.startsWith("public/") ? path.slice(7) : path}`;
const assetPaths = new Map(assets.map(path => [path.startsWith("public/") ? path.slice(7) : path, assetTarget(path)]));
for (const path of assets) {
  const target = `public${assetTarget(path)}`;
  await mkdir(dirname(target), { recursive: true });
  await copyFile(resolve(source, path), target);
}
function rewriteUrl(value, entry, image = false, inCodeBlock = false) {
  if (/^(?:mailto:|tel:|data:|#)/.test(value)) return value;
  const relativePath = posix.normalize(posix.join(posix.dirname(entry.path), value.split(/[?#]/)[0]));
  if (assets.includes(relativePath)) return assetTarget(relativePath);
  let url;
  try { url = new URL(value, `https://davidhlp.github.io/${entry.key}`); }
  catch { return value; }
  if (url.origin !== "https://davidhlp.github.io") return value;
  const path = decodeURI(url.pathname).replace(/\/$/, "");
  let target = routes[path];
  if (path.endsWith("/kb") && url.hash === "#log") {
    target = routes[path.replace(/\/kb$/, "/kb-log")];
    url.hash = "";
  }
  if (target) return target + url.search + url.hash;
  const asset = path.replace(/^\//, "");
  if (assetPaths.has(asset)) return assetPaths.get(asset) + url.search + url.hash;
  const document = pathEntries.get(relativePath);
  if (document && publishedTarget(document)) return publishedTarget(document) + url.hash;
  if (files.includes(relativePath)) return `${repository}/blob/${revision}/${relativePath}` + url.hash;
  if (files.some(path => path.startsWith(relativePath + "/"))) return `${repository}/tree/${revision}/${relativePath}` + url.hash;
  if (image) missingResources.push({ document: entry.path, reference: value, retainedUrl: url.href, inCodeBlock });
  if (value.startsWith("http")) return value;
  return url.href;
}
for (const [index, entry] of entries.entries()) {
  const { data, path, key, slug } = entry;
  let body = entry.body;
  if (path.endsWith(".yaml")) {
    body = Object.entries(parse(body)).map(([date, events]) => `## ${date}\n\n${events.map(event => `- ${event}`).join("\n")}`).join("\n\n");
  }
  if (path.endsWith(".mdx")) {
    const links = [...body.matchAll(/title:\s*"([^"]+)"[\s\S]*?url:\s*"([^"]+)"[\s\S]*?description:\s*"([^"]+)"/g)];
    body = body.replace(/^import .*;\s*\n/m, "").replace(/export const links = \[[\s\S]*?\];\s*/, "")
      .replace(/<Linkroll[^>]*\/>/, links.map(([, title, url, description]) => `- [${title}](${url}) — ${description}`).join("\n"));
  }
  // Keep examples literal; only adapt links in prose outside fenced code blocks.
  let fence;
  body = body.split("\n").map(line => {
    const marker = line.match(/^\s*(`{3,}|~{3,})/);
    if (marker) {
      if (!fence) fence = marker[1];
      else if (marker[1][0] === fence[0] && marker[1].length >= fence.length) fence = undefined;
      return line;
    }
    if (fence) {
      for (const match of line.matchAll(/!\[[^\]]*\]\(([^\s)]+)/g)) rewriteUrl(match[1], entry, true, true);
      for (const match of line.matchAll(/(?<![:\w-])src=(['"])(.*?)\1/g)) rewriteUrl(match[2], entry, true, true);
      return line;
    }
    return line.replace(/(!?\[[^\]]*\]\()([^\s)]+)([^)]*\))/g,
      (_, open, url, close) => open + rewriteUrl(url, entry, open.startsWith("!")) + close)
      .replace(/(?<![:\w-])\b(href|src)=(['"])(.*?)\2/g, (_, attribute, quote, url) =>
        `${attribute}=${quote}${rewriteUrl(url, entry, attribute === "src")}${quote}`);
  }).join("\n");
  const date = new Date(data.timestamp ?? data.capturedAt ?? capturedAt).toISOString();
  const metadata = {
    archiveId: `X-${String(index + 1001).padStart(3, "0")}`,
    title: entry.title, en: headings[key.split("/")[0]],
    category: entry.category, department: departments[key.split("/")[0]], date: date.slice(0, 10),
    lead: data.author || "DavidHLPL", clearance: data.draft ? "DRAFT" : "PUBLIC",
    abstract: data.description || `${entry.title} · ${path}`,
    findings: [`Original document: ${path}`, `Source revision: ${revision}`, ...(data.status ? [`Evidence status: ${data.status}`] : [])],
    source: `${repository}/blob/${revision}/${path}`, pubDate: date,
    tags: [...new Set([...(data.tags ?? []), entry.locale || "documentation", key.split("/")[0]])],
    draft: Boolean(data.draft || path.split("/").some(part => part.startsWith("_"))),
    lang: entry.locale === "en" || entry.locale === "ja" ? entry.locale : "zh-CN",
    legacy: { path, revision, metadata: data },
  };
  const sources = (data.sources ?? []).map(name => pathEntries.get(`src/content/raw/zh-cn/${name}.md`)).filter(Boolean);
  const related = (data.related ?? []).map(name => pathEntries.get(`src/content/note/${entry.locale}/${name}.md`)).filter(Boolean);
  if (sources.length || related.length) body += `\n\n## ${entry.locale === "zh-cn" ? "来源与关联文档" : "Sources and related documents"}\n\n` +
    [...sources, ...related].filter(item => publishedTarget(item)).map(item => `- [${item.title}](${publishedTarget(item)})`).join("\n") + "\n";
  await write(`content/blog/${slug}.md`, `---\n${JSON.stringify(metadata, null, 2)}\n---\n\n${body}`);
  entry.archiveId = metadata.archiveId;
  entry.draft = metadata.draft;
}
await write("migration/manifest.json", JSON.stringify({ repository, revision, capturedAt,
  documents, assets, entries: entries.map(({ path, slug, archiveId, draft }) => ({ path, slug, archiveId, draft })), routes, missingResources }, null, 2) + "\n");
console.log(`Preserved ${documents.length} documents; adapted ${entries.length} entries (${entries.filter(entry => entry.draft).length} drafts); copied ${assets.length} assets; recorded ${missingResources.length} pre-existing missing image references.`);
