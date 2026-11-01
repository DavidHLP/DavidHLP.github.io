import { profileText } from "../src/profile-text.mjs";
export { profileText } from "../src/profile-text.mjs";
import fs from "node:fs/promises";
import { parse } from "yaml";
const labels = JSON.parse(await fs.readFile(new URL("../content/locales.json", import.meta.url), "utf8"));

const requiredFields = [
  "id",
  "title",
  "en",
  "department",
  "category",
  "date",
  "lead",
  "clearance",
  "abstract",
  "source",
];
const isText = (value) => typeof value === "string" && value.trim().length > 0;

export function validateContent(content) {
  const errors = [];
  if (!content || typeof content !== "object" || Array.isArray(content)) {
    throw new Error("档案数据必须是 JSON 对象。");
  }
  for (const key of ["categories", "columns"]) {
    const names = content[key];
    if (!Array.isArray(names) || names.length !== 5 || !names.every(isText)) {
      errors.push(`${key}：必须包含五个非空分类名称`);
    } else if (new Set(names).size !== 5 || names.includes("全部档案")) {
      errors.push(`${key}：分类名称不能重复，也不能使用“全部档案”`);
    }
  }
  const categories = Array.isArray(content.categories)
    ? content.categories
    : [];
  const columns = Array.isArray(content.columns) ? content.columns : [];
  if (
    categories.some((name) => !columns.includes(name)) ||
    columns.some((name) => !categories.includes(name))
  ) {
    errors.push("categories 与 columns 必须包含相同的五个分类（顺序可以不同）");
  }
  const records = Array.isArray(content.records) ? content.records : [];
  const ids = new Set();
  records.forEach((record, index) => {
    const label = `records[${index}]`;
    if (!record || typeof record !== "object" || Array.isArray(record)) {
      errors.push(`${label}：必须是档案对象`);
      return;
    }
    for (const key of requiredFields) {
      if (!isText(record[key])) errors.push(`${label}.${key}：必须是非空文本`);
    }
    if (!/^X-\d{3,}$/.test(record.id)) errors.push(`${label}.id：必须是 X- 加至少三位数字`);
    if (ids.has(record.id)) errors.push(`${label}.id：重复编号 ${record.id}`);
    ids.add(record.id);
    if (!categories.includes(record.category))
      errors.push(`${label}.category：未知分类 ${record.category}`);
    if (
      !Array.isArray(record.findings) ||
      record.findings.length === 0 ||
      !record.findings.every(isText)
    ) {
      errors.push(`${label}.findings：必须包含至少一条非空研究记录`);
    }
    try {
      const url = new URL(record.source);
      if (!["https:", "http:"].includes(url.protocol)) throw new Error();
    } catch {
      errors.push(`${label}.source：必须是有效的 HTTP 或 HTTPS 链接`);
    }
  });
  for (const name of columns) {
    const count = records.filter((record) => record?.category === name).length;
    if (count === 0) errors.push(`分类“${name}”：至少需要一篇已发布文章`);
  }
  if (errors.length)
    throw new Error(`档案数据校验失败：\n- ${errors.join("\n- ")}`);
  return content;
}

export async function loadContent() {
  const site = JSON.parse(await fs.readFile(new URL("../content/site.json", import.meta.url), "utf8"));
  const root = new URL("../content/blog/", import.meta.url);
  const paths = (await fs.readdir(root, { recursive: true })).filter(path => path.endsWith(".md"));
  const records = [];
  for (const path of paths) {
    const source = await fs.readFile(new URL(path, root), "utf8");
    const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
    if (!match) throw new Error(`文章缺少 YAML frontmatter：${path}`);
    const data = parse(match[1]);
    const body = match[2];
    if (!data.draft) records.push({ ...data, id: data.archiveId, slug: path.replace(/\.md$/, ""), lang: data.lang ?? "zh-CN", body: body.trim() });
  }
  records.sort((a, b) => Number(a.id?.slice(2)) - Number(b.id?.slice(2)));
  return validateContent({ categories: site.categories, columns: site.columns, records });
}

export function archiveText(r) {
  const language = r.lang ?? "zh-CN";
  const localize = text => labels[language]?.[text] ?? text;
  const headings = language === "en" ? ["INTERNAL DATABASE", "FILE", "Department", "Collection", "Related people", "Access", "Research notes", "Reference", "This archive adaptation is based on publicly available setting material, not the game's original text."]
    : language === "ja" ? ["内部データベース", "資料", "部門", "収録範囲", "関連人物", "アクセス", "研究記録", "参考資料", "公開設定資料を基にした資料形式の再構成であり、ゲームの原文ではありません。"]
    : ["内部数据库", "档案", "科室", "编目范围", "相关人物", "访问范围", "研究记录", "设定参考", "本文为基于公开设定的档案式改写，非游戏原文。"];
  return `\uFEFFRHINE LAB · ${headings[0]}\n${headings[1]} ${r.id} / ${r.title}\n${localize(r.en)}\n\n${headings[2]}: ${localize(r.department)}\n${headings[3]}: ${localize(r.date)}\n${headings[4]}: ${r.lead}\n${headings[5]}: ${localize(r.clearance)}\n\n${[profileText(r.profile), r.body?.trim() || r.abstract].filter(Boolean).join("\n\n")}\n\n${headings[6]}\n${r.findings.map((f, i) => `${i + 1}. ${f}`).join("\n")}\n\n${headings[7]}: ${r.source}\n${headings[8]}\n`;
}
