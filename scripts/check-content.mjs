import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import {
  loadContent,
  validateContent,
  archiveText,
} from "./archive-content.mjs";
import { escapeHtml } from "../src/html.ts";
import { postPath } from "../src/blog-path.ts";

const published = await loadContent();
const content = published;
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
test("offline navigation resolves article directories and RSS from the same release", async () => {
  const scope = "https://blog.example/";
  const files = ["index.html", "blog/x-001/index.html", "rss.xml"];
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
  for (const [path, file] of [
    ["/", "index.html"], ["/blog/x-001/", "blog/x-001/index.html"],
    ["/blog/x-001", "blog/x-001/index.html"], ["/rss.xml", "rss.xml"],
  ]) {
    let response;
    handlers.fetch({
      request: { method: "GET", mode: "navigate", url: new URL(path, scope).href },
      respondWith: promise => { response = promise; },
    });
    assert.ok(response, `Offline response missing for ${path}`);
    assert.equal(await (await response).text(), "cached release");
    assert.equal(matched, new URL(file, scope).href);
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
