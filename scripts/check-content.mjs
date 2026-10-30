import assert from "node:assert/strict";
import { readFile, readdir, mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import { parse } from "yaml";
import { runInNewContext } from "node:vm";
import { createHash } from "node:crypto";
import {
  loadContent,
  validateContent,
  archiveText,
} from "./archive-content.mjs";
import { escapeHtml } from "../src/html.ts";
import { postPath } from "../src/blog-path.ts";
import { archiveTickWindow, recentRecords, visibleSavedCount, persistSaved, syncArticleMetadata, restoreArticleHash } from "../src/blog-client.ts";
import { StartupGate } from "../src/startup.ts";
import { normalizeUiLanguage, translateUiText, translatedBootText } from "../src/ui-language.ts";
import { localizedArticles, languageUrl, translationKey, validateTranslations } from "../src/content-language.ts";
import { MOTION_LABELS } from "../src/motion-preferences.ts";

test("interface language selection validates stored values and preserves source content", () => {
  assert.equal(normalizeUiLanguage("ja"), "ja");
  assert.equal(normalizeUiLanguage("en"), "en");
  assert.equal(normalizeUiLanguage("invalid"), "zh-CN");
  assert.equal(translateUiText("  系统设置 ", "en"), "  System settings ");
  assert.equal(translateUiText("系统设置", "ja"), "システム設定");
  assert.equal(translateUiText("系统设置", "zh-CN"), "系统设置");
  assert.equal(translateUiText("127 RECORDS FOUND", "ja"), "127 件の資料");
  assert.equal(translateUiText("实际渲染 1280 × 720 · 原始抗锯齿 · 纹理 16×", "en"), "Rendered 1280 × 720 · Original antialiasing · Textures 16×");
  assert.equal(translateUiText("当前使用自定义动画（开场已跳过、文字滚动已关闭）。", "en"), "Custom animation (Startup skipped, Rolling text disabled).");
  assert.equal(translateUiText("选择档案 X-1149 原始标题", "en"), "Select archive X-1149 原始标题");
  assert.equal(translateUiText("原始文章中的普通文本", "en"), "原始文章中的普通文本");
  assert.equal(translateUiText("ARCHIVE INDEX", "zh-CN"), "档案检索");
  assert.equal(translateUiText("127 RECORDS FOUND", "zh-CN"), "找到 127 份档案");
  assert.equal(translateUiText("RHINE LAB / ARCHIVE DIRECTORY", "ja"), "RHINE LAB / 資料目録");
  assert.equal(translateUiText("点击切换画质预设", "en"), "Click to change Quality preset");
  assert.equal(translateUiText("返回交互界面 ↗", "en"), "Back to interactive view ↗");
  assert.equal(translateUiText(" / 更新 ", "en"), " / Updated ");
  assert.equal(translateUiText("FILE X-1149 / INTERNAL DATABASE", "ja"), "資料 X-1149 / 内部データベース");
  assert.equal(translateUiText("CONNECTING TO INTERNAL DATABASE", "zh-CN"), "正在连接内部数据库");
  assert.equal(translateUiText("CONNECTING TO INTERNAL DATABASE", "ja"), "内部データベースに接続中");
  for (const item of Object.values(MOTION_LABELS)) {
    for (const text of [item.title, item.description, item.group]) {
      assert.doesNotMatch(translateUiText(text, "en"), /\p{Script=Han}/u);
      assert.notEqual(translateUiText(text, "ja"), text);
    }
  }
});

const published = await loadContent();
const content = published;
test("knowledge validation checks editable wiki sources and index rather than archived copies", async () => {
  const root = await mkdtemp(join(tmpdir(), "rhine-wiki-"));
  const put = async (path, content) => {
    await mkdir(dirname(join(root, path)), { recursive: true });
    await writeFile(join(root, path), content);
  };
  const note = source => `---\n${JSON.stringify({ kind: "concept", status: "active", sources: [source] })}\n---\nWiki`;
  try {
    const raw = "Immutable evidence\n";
    await put("src/content/raw/zh-cn/evidence.md", raw);
    await put("src/content/raw/.manifest.sha256", `${createHash("sha256").update(raw).digest("hex")}  zh-cn/evidence.md\n`);
    await put("src/content/note/zh-cn/example.md", note("evidence"));
    await put("src/content/information/zh-cn/kb-index.md", "example evidence");
    await put("content/blog/legacy/note/zh-cn/example.md", note("evidence"));
    await put("content/blog/legacy/information/zh-cn/kb-index.md", "example evidence");
    await put("content/blog/legacy/information/zh-cn/kb-log.md", "## [2026-10-30] migration\n");
    const run = () => promisify(execFile)(process.execPath, ["--experimental-strip-types", fileURLToPath(new URL("./kb-lint.ts", import.meta.url))], { cwd: root });
    assert.match((await run()).stdout, /KB lint passed/);
    await put("content/blog/legacy/note/zh-cn/example.md", note("missing"));
    await assert.rejects(run(), error => { assert.match(error.stderr, /references missing raw source: missing/); return true; });
    await put("content/blog/legacy/note/zh-cn/example.md", note("evidence"));
    await put("content/blog/legacy/information/zh-cn/kb-index.md", "evidence");
    await assert.rejects(run(), error => { assert.match(error.stderr, /wiki page missing from index/); return true; });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
test("every article has all three languages and switching keeps the same logical article", () => {
  validateTranslations(published.records);
  const chinese = localizedArticles(published.records, "zh-CN");
  for (const language of ["en", "ja"]) {
    const localized = localizedArticles(published.records, language);
    assert.equal(localized.length, chinese.length);
    assert.deepEqual(localized.map(translationKey), chinese.map(translationKey));
    assert.ok(localized.every(record => record.lang === language));
    for (const record of chinese) {
      const url = languageUrl(published.records, `https://example.com/blog/${record.slug}/?view=static&scene=archive#chapter`, language);
      const target = localized.find(item => translationKey(item) === translationKey(record));
      assert.ok(url.startsWith(postPath(target.slug)));
      assert.ok(url.includes("view=static") && url.includes("scene=archive") && url.includes(`lang=${language}`));
      assert.ok(!url.includes("#chapter"));
    }
  }
  assert.throws(() => validateTranslations(published.records.filter(record => record.lang !== "en")), /Missing/);
  assert.throws(() => validateTranslations([...published.records, published.records[0]]), /Duplicate/);
  assert.equal(translatedBootText("REQUEST RECEIVED", "REQUEST RECEIVED", "ja"), "リクエスト受信済み");
  const partial = translatedBootText("REQUEST", "REQUEST RECEIVED", "ja");
  assert.ok("リクエスト受信済み".startsWith(partial) && partial.length > 0 && partial.length < 9);
});
test("all migrated downloads match the Markdown content, including the UTF-8 BOM", async () => {
  for (const record of published.records) {
    assert.equal(
      (
        await readFile(
          new URL(
            `../public/archives/RHINE-LAB-${record.id}.txt`,
            import.meta.url,
          ),
          "utf8",
        )
      ).replace(/\r\n/g, "\n"),
      archiveText(record),
    );
  }
});
test("blog allows new stable IDs and unequal column sizes while rejecting empty columns", () => {
  const edited = structuredClone(content);
  const id = Math.max(...edited.records.map(record => Number(record.id.slice(2)))) + 1;
  edited.records.push({ ...edited.records[0], id: `X-${String(id).padStart(3, "0")}` });
  edited.records.reverse();
  assert.equal(validateContent(edited), edited);
  edited.records = edited.records.filter(record => record.category !== edited.columns[0]);
  assert.throws(() => validateContent(edited), /至少需要一篇/);
});
test("article URLs encode Chinese and nested names like browser pathnames", () => {
  assert.equal(postPath("研究/hello world"), "/blog/%E7%A0%94%E7%A9%B6/hello%20world/");
  assert.equal(postPath("x-006"), "/blog/x-006/");
});
test("recent articles sort by publication date without changing stable archive order", () => {
  const records = [
    { id: "X-001", pubDate: "2026-10-09T00:00:00Z" },
    { id: "X-002", pubDate: "2026-10-01T00:00:00Z" },
    { id: "X-003", pubDate: "2026-10-10T00:00:00Z" },
  ];
  assert.deepEqual(recentRecords(records).map(record => record.id), ["X-003", "X-001", "X-002"]);
  assert.deepEqual(records.map(record => record.id), ["X-001", "X-002", "X-003"]);
});
test("unpublished bookmarks stay stored without inflating the accessible count", () => {
  const saved = new Set(["X-001", "X-999"]);
  assert.equal(visibleSavedCount(saved, [{ id: "X-001" }, { id: "X-002" }]), 1);
  let stored;
  assert.equal(persistSaved(saved, { setItem(key, value) { stored = [key, JSON.parse(value)]; } }), true);
  assert.deepEqual(stored, ["rhine-saved", ["X-001", "X-999"]]);
  assert.equal(persistSaved(saved, { setItem() { throw new Error("Storage unavailable"); } }), false);
  assert.deepEqual([...saved], ["X-001", "X-999"]);
});
test("switching article metadata replaces authors and dates and clears article fields at home", () => {
  const nodes = [];
  const head = {
    ownerDocument: { createElement() { return {
      attributes: {}, content: "",
      setAttribute(key, value) { this.attributes[key] = value; },
      remove() { nodes.splice(nodes.indexOf(this), 1); },
    }; } },
    append(node) { nodes.push(node); },
    querySelector(selector) {
      const [, attribute, value] = selector.match(/^meta\[(name|property)="([^"]+)"\]$/);
      return nodes.find(node => node.attributes[attribute] === value) ?? null;
    },
  };
  const meta = key => head.querySelector(`meta[property="${key}"]`)?.content;
  syncArticleMetadata(head, { lead: "Alice", pubDate: "2026-10-01", updatedDate: "2026-10-02" }, "Site author");
  assert.equal(meta("article:modified_time"), "2026-10-02T00:00:00.000Z");
  syncArticleMetadata(head, { lead: "Bob", pubDate: "2026-10-09" }, "Site author");
  assert.equal(head.querySelector('meta[name="author"]').content, "Bob");
  assert.equal(meta("article:published_time"), "2026-10-09T00:00:00.000Z");
  assert.equal(meta("article:modified_time"), undefined);
  syncArticleMetadata(head, undefined, "Site author");
  assert.equal(head.querySelector('meta[name="author"]').content, "Site author");
  assert.equal(meta("article:published_time"), undefined);
  assert.equal(meta("article:modified_time"), undefined);
});
test("chapter restoration decodes safely and targets only the visible article container", () => {
  let scrolled;
  const container = { querySelectorAll() { return [
    { id: "章节 [一]", scrollIntoView(options) { scrolled = options; } },
  ]; } };
  assert.equal(restoreArticleHash(container, `#${encodeURIComponent("章节 [一]")}`), true);
  assert.deepEqual(scrolled, { block: "start" });
  scrolled = undefined;
  for (const hash of ["", "#missing", "#%E0%A4%A"])
    assert.equal(restoreArticleHash(container, hash), false);
  assert.equal(scrolled, undefined);
});
test("startup keyboard focus follows replacement failure controls", () => {
  const ownerDocument = { activeElement: null };
  const button = (disabled = false, hidden = false) => ({
    disabled, hidden,
    closest() { return this.hidden ? this : null; },
    focus() { ownerDocument.activeElement = this; },
  });
  const start = button(true);
  const silent = button(false, true);
  let buttons = [start, silent];
  const handlers = {};
  const root = {
    ownerDocument,
    setAttribute() {}, insertAdjacentHTML() {},
    querySelector(selector) { return selector === ".entry-start" ? start : selector === ".entry-silent" ? silent : {}; },
    querySelectorAll() { return buttons; },
    addEventListener(name, handler) { handlers[name] = handler; },
  };
  new StartupGate({ root, unlock: async () => true, cancel() {}, start() {} });
  const tab = (shiftKey = false) => {
    let prevented = false;
    handlers.keydown({ key: "Tab", shiftKey, stopPropagation() {}, preventDefault() { prevented = true; } });
    assert.equal(prevented, true);
  };
  tab();
  assert.equal(ownerDocument.activeElement, null);
  const read = button();
  const reconnect = button();
  buttons = [read, reconnect, button(true), button(false, true)];
  read.focus();
  tab();
  assert.equal(ownerDocument.activeElement, reconnect);
  tab();
  assert.equal(ownerDocument.activeElement, read);
  tab(true);
  assert.equal(ownerDocument.activeElement, reconnect);
});
test("offline reading resolves pages, search text, images and attachments from the same release", async () => {
  const scope = "https://blog.example/";
  const files = ["index.html", "blog/x-001/index.html", "rss.xml", "blog-search.json", "images/example.png", "downloads/note.pdf"];
  const handlers = {};
  let matched;
  const worker = (await readFile(new URL("./pwa-worker.js", import.meta.url), "utf8"))
    .replace("__CACHE_VERSION__", JSON.stringify("test-release"))
    .replace("__PRECACHE_FILES__", JSON.stringify(files));
  runInNewContext(worker, {
    URL, Response,
    self: {
      registration: { scope }, location: { origin: new URL(scope).origin },
      addEventListener: (name, handler) => { handlers[name] = handler; },
    },
    caches: { open: async () => ({ match: async key => {
      matched = key;
      return new Response("cached release");
    } }) },
    fetch: () => { throw new Error("Offline navigation unexpectedly used the network"); },
  });
  for (const [path, file, mode = file.endsWith(".html") || file === "rss.xml" ? "navigate" : "cors"] of [
    ["/", "index.html"], ["/blog/x-001/", "blog/x-001/index.html"],
    ["/blog/x-001", "blog/x-001/index.html"], ["/rss.xml", "rss.xml"],
    ["/blog/x-001/", "blog/x-001/index.html", "cors"],
    ["/blog/x-001?view=static#section", "blog/x-001/index.html", "cors"],
    ["/blog-search.json", "blog-search.json"], ["/images/example.png", "images/example.png"],
    ["/downloads/note.pdf", "downloads/note.pdf"],
  ]) {
    let response;
    handlers.fetch({
      request: { method: "GET", mode, url: new URL(path, scope).href },
      respondWith: promise => { response = promise; },
    });
    assert.ok(response, `Offline response missing for ${path}`);
    assert.equal(await (await response).text(), "cached release");
    assert.equal(matched, new URL(file, scope).href);
  }
});

test("author images, attachments and search text survive offline and Cloudflare packaging", async () => {
  const root = await mkdtemp(join(tmpdir(), "rhine-content-"));
  try {
    await mkdir(join(root, "scripts"));
    for (const name of ["build-pwa.mjs", "pwa-worker.js", "package-cloudflare.mjs", "webfont-sources.json"])
      await writeFile(join(root, "scripts", name), await readFile(new URL(name, import.meta.url)));
    const fixtures = {
      "index.html": "<h1>Blog</h1>",
      "assets/app.js": "console.log('blog')",
      "blog/example/index.html": `<article><h1 id="chapter">Long article</h1><a href="#chapter">Chapter</a>${"<p>Long article content.</p>".repeat(100)}<img src="/images/nested/example.png" alt="Example"><table><tr><th>Field</th><td>Value</td></tr></table><pre><code>const example = 1;</code></pre><a href="/downloads/note.pdf">Attachment</a></article>`,
      "blog-search.json": JSON.stringify({ "X-001": "search-only phrase" }),
      "images/nested/example.png": "image fixture",
      "downloads/note.pdf": "attachment fixture",
      "custom/about.html": "<h1>About</h1>",
    };
    for (const [path, body] of Object.entries(fixtures)) {
      await mkdir(dirname(join(root, "dist", path)), { recursive: true });
      await writeFile(join(root, "dist", path), body);
    }
    const run = promisify(execFile);
    const options = { cwd: root, env: { ...process.env, CF_PAGES: "", CF_PAGES_URL: "", VERCEL_PROJECT_ID: "" } };
    await run(process.execPath, ["scripts/build-pwa.mjs"], options);
    const offline = JSON.parse(await readFile(join(root, "dist/pwa-build.json"), "utf8"));
    for (const path of Object.keys(fixtures)) assert.ok(offline.files.includes(path), `Missing offline resource: ${path}`);
    await run(process.execPath, ["scripts/package-cloudflare.mjs"], options);
    const release = JSON.parse(await readFile(join(root, "release/cloudflare/latest.json"), "utf8"));
    for (const [path, body] of Object.entries(fixtures))
      assert.equal(await readFile(join(release.directory, path), "utf8"), body, `Missing or changed release resource: ${path}`);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("built pages carry one article body while shared search retains every published body", async t => {
  const dist = new URL("../dist/", import.meta.url);
  let paths;
  try { paths = await readdir(dist, { recursive: true }); }
  catch (error) {
    if (error.code !== "ENOENT") throw error;
    t.skip("dist is absent; run the build before verifying generated pages");
    return;
  }
  const search = JSON.parse(await readFile(new URL("blog-search.json", dist), "utf8"));
  assert.deepEqual(Object.keys(search).sort(), published.records.map(record => record.id).sort());
  for (const record of published.records)
    assert.equal(search[record.id].trim(), (record.body ?? record.abstract).trim());
  const site = JSON.parse(await readFile(new URL("../content/site.json", import.meta.url), "utf8"));
  const manifest = JSON.parse(await readFile(new URL("manifest.webmanifest", dist), "utf8"));
  assert.equal(manifest.name, site.title);
  assert.equal(manifest.short_name, site.title);
  assert.equal(manifest.description, site.description);
  const pages = paths.filter(path => path === "index.html" || /^blog\/.*\/index\.html$/.test(path.replaceAll("\\", "/")));
  assert.equal(pages.length, published.records.length + 1);
  for (const path of pages) {
    const html = await readFile(join(fileURLToPath(dist), path), "utf8");
    const data = html.match(/<script\b[^>]*id="blog-data"[^>]*>([\s\S]*?)<\/script>/);
    assert.ok(data, `Missing blog payload: ${path}`);
    const payload = JSON.parse(data[1]);
    assert.ok(payload.records.every(record => !Object.hasOwn(record, "body")), `Duplicated search body: ${path}`);
    assert.equal((html.match(/<template\b[^>]*data-blog-body=/g) ?? []).length, path === "index.html" ? 0 : 1);
    assert.ok(html.includes(`name="apple-mobile-web-app-title" content="${escapeHtml(site.title)}"`));
  }
});

const invalidCases = [
  [
    "missing title",
    (c) => {
      delete c.records[0].title;
    },
    /records\[0\].title/,
  ],
  [
    "blank abstract",
    (c) => {
      c.records[0].abstract = "  ";
    },
    /abstract/,
  ],
  [
    "duplicate ID",
    (c) => {
      c.records[1].id = c.records[0].id;
    },
    /重复编号/,
  ],
  [
    "invalid ID",
    (c) => {
      c.records[0].id = "invalid";
    },
    /至少三位数字/,
  ],
  [
    "unknown category",
    (c) => {
      c.records[0].category = "未知";
    },
    /未知分类/,
  ],
  [
    "empty column",
    (c) => {
      c.records = c.records.filter(record => record.category !== c.columns[0]);
    },
    /至少需要一篇/,
  ],
  [
    "empty collection",
    (c) => {
      c.records = [];
    },
    /至少需要一篇/,
  ],
  [
    "null record",
    (c) => {
      c.records[0] = null;
    },
    /必须是档案对象/,
  ],
  [
    "empty findings",
    (c) => {
      c.records[0].findings = [];
    },
    /findings/,
  ],
  [
    "non-text findings",
    (c) => {
      c.records[0].findings = [42];
    },
    /findings/,
  ],
  [
    "unsafe URL",
    (c) => {
      c.records[0].source = "javascript:alert(1)";
    },
    /HTTPS/,
  ],
  [
    "invalid URL",
    (c) => {
      c.records[0].source = "example.com";
    },
    /HTTPS/,
  ],
  [
    "duplicate categories",
    (c) => {
      c.categories[1] = c.categories[0];
    },
    /不能重复/,
  ],
  [
    "reserved category",
    (c) => {
      c.categories[0] = "全部档案";
    },
    /全部档案/,
  ],
  [
    "mismatched columns",
    (c) => {
      c.columns[0] = "其他";
    },
    /相同的五个分类/,
  ],
];
for (const [name, mutate, error] of invalidCases) {
  test(`rejects ${name}`, () => {
    const invalid = structuredClone(content);
    mutate(invalid);
    assert.throws(() => validateContent(invalid), error);
  });
}
test("accepts independent filter and column order", () => {
  const edited = structuredClone(content);
  edited.categories.reverse();
  assert.equal(validateContent(edited), edited);
});
test("plain-text punctuation stays literal in HTML and downloadable text", () => {
  const title = `<玻璃> & "实验" 'A'`;
  const edited = structuredClone(content);
  edited.records[0].title = title;
  validateContent(edited);
  assert.equal(
    escapeHtml(title),
    "&lt;玻璃&gt; &amp; &quot;实验&quot; &#39;A&#39;",
  );
  assert.ok(archiveText(edited.records[0]).includes(title));
});


test("large archives retain article identity through coordinate rebasing", async () => {
  const previousDocument = globalThis.document;
  try {
    const records = [108, 9, 11, 7, 13].flatMap((count, lane) => Array.from({ length: count }, (_, index) => ({
      ...published.records[0], id: `X-${lane * 1000 + index + 5000}`, slug: `large/${lane}-${index}`, category: published.columns[lane],
    })));
    globalThis.document = { getElementById() { return { textContent: JSON.stringify({ ...published, records }) }; } };
    const { fileLocation, fileAtSlot } = await import("../src/data.ts");
    const { fileAtCell, selectionCell } = await import("../src/archive-loop.ts");
    const slots = new Set();
    for (const [index] of records.entries()) {
      const location = fileLocation(index);
      assert.equal(fileAtSlot(location.slot), index);
      slots.add(location.slot);
    }
    assert.equal(slots.size, records.length);
    for (const lane of [-6, 0, 1, 2, 3, 4, 7]) {
      for (const row of [-100001, -2049, 2049, 100001]) {
        const offset = row - 12;
        const before = fileAtCell({ lane, row });
        assert.equal(fileAtCell({ lane, row: 12 }, offset), before);
        assert.equal(fileAtCell({ lane, row: 13 }, offset), fileAtCell({ lane, row: row + 1 }));
        const next = selectionCell(before, { lane, row: 12 }, undefined, offset);
        assert.equal(next.row, 12);
        assert.equal(fileAtCell(next, offset), before);
      }
    }
  } finally {
    if (previousDocument === undefined) delete globalThis.document;
    else globalThis.document = previousDocument;
  }
});
test("tick navigation stays within eight buttons for every selected article", () => {
  for (const count of [1, 7, 8, 9, 108]) {
    const files = Array.from({ length: count }, (_, index) => index * 2);
    for (const selected of files) {
      const ticks = archiveTickWindow(files, selected);
      assert.equal(ticks.length, Math.min(8, count));
      assert.ok(ticks.includes(selected));
    }
  }
});


test("blog migration preserves source evidence and applies only recorded translation publication overrides", async () => {
  const manifest = JSON.parse(await readFile(new URL("../migration/manifest.json", import.meta.url), "utf8"));
  const { overrides } = JSON.parse(await readFile(new URL("../migration/publication-overrides.json", import.meta.url), "utf8"));
  assert.equal(Object.values(overrides).filter(value => value.draft === false).length, 74);
  assert.ok(Object.keys(overrides).every(slug => /\/(en|ja)\//.test(slug) && manifest.entries.some(entry => entry.slug === slug)));
  const live = new Map(published.records.map(record => [record.id, record]));
  assert.ok(published.records.every(record => record.legacy && !record.legacy.path.startsWith("src/content/raw/")));
  assert.ok(manifest.entries.every(entry => entry.path.startsWith("src/content/") && !entry.path.startsWith("src/content/raw/")));
  for (const path of manifest.documents) {
    const snapshot = await readFile(new URL(`../migration/source/${path}`, import.meta.url));
    if (path.startsWith("src/content/"))
      assert.deepEqual(await readFile(new URL(`../${path}`, import.meta.url)), snapshot, path);
  }
  for (const entry of manifest.entries) {
    const original = await readFile(new URL(`../migration/source/${entry.path}`, import.meta.url), "utf8");
    const adapted = await readFile(new URL(`../content/blog/${entry.slug}.md`, import.meta.url), "utf8");
    const data = parse(adapted.match(/^---\n([\s\S]*?)\n---\n/)[1]);
    const metadata = original.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
    assert.deepEqual(data.legacy.metadata, metadata ? parse(metadata[1]) : {});
    const override = overrides[entry.slug] ?? {};
    const remainsDraft = override.draft ?? entry.draft;
    assert.equal(data.draft, remainsDraft);
    if (entry.path.includes("/note/")) {
      for (const field of ["kind", "status", "sources", "related"])
        assert.deepEqual(data[field], override[field] ?? data.legacy.metadata[field] ?? [], `${entry.path}: ${field}`);
    }
    if (entry.path.endsWith("/introduction.md")) {
      assert.ok(!/[<>]/.test(data.title));
      assert.ok(!/[<>]/.test(data.abstract));
    }
    assert.equal(live.has(entry.archiveId), !remainsDraft);
  }
  const dist = new URL("../dist/", import.meta.url);
  for (const entry of manifest.entries) {
    const path = new URL(`blog/${entry.slug}/index.html`, dist);
    if (overrides[entry.slug]?.draft ?? entry.draft) await assert.rejects(readFile(path), { code: "ENOENT" });
    else assert.ok((await readFile(path, "utf8")).includes("原文来源"));
  }
  for (const [path, target] of Object.entries(manifest.routes)) {
    const output = new URL(path.slice(1) + (target === "/rss.xml" ? "" : "/index.html"), dist);
    const html = await readFile(output, "utf8");
    if (target === "/rss.xml") assert.equal(html, await readFile(new URL("rss.xml", dist), "utf8"));
    else assert.ok(html.includes(`href="${target}"`), path);
  }
});


test("published Mermaid fences retain the markup used by both readers", async () => {
  const manifest = JSON.parse(await readFile(new URL("../migration/manifest.json", import.meta.url), "utf8"));
  const diagrams = published.records.filter(record => /^```mermaid\s*$/m.test(record.body));
  assert.ok(diagrams.length > 0);
  for (const record of diagrams) {
    const entry = manifest.entries.find(entry => entry.archiveId === record.id);
    const html = await readFile(new URL(`../dist/blog/${entry.slug}/index.html`, import.meta.url), "utf8");
    assert.ok(html.includes('data-language="mermaid"'), entry.slug);
  }
});
