// Run after pnpm build: node scripts/editorial-smoke.mjs
import assert from "node:assert/strict";
import { readdir, readFile, stat } from "node:fs/promises";
import { join } from "node:path";

const output = new URL("../dist/", import.meta.url);
const files = (await readdir(output, { recursive: true })).filter(path => path.endsWith(".html"));
assert(files.length > 0, "Build the site first");
for (const path of files) {
	const html = await readFile(new URL(path, output), "utf8");
	assert.equal((html.match(/<main[\s>]/g) ?? []).length, 1, `${path}: one main landmark`);
	for (const [, url] of html.matchAll(/<link[^>]+href="([^"]+\.css)"/g)) {
		if (url.startsWith("/")) assert((await stat(join(output.pathname, url))).isFile(), `${path}: stylesheet ${url}`);
	}
}
let count = 0;
for (const prefix of ["", "en/", "ja/"]) {
	for (const section of ["", "note/", "jotting/"]) {
		const html = await readFile(new URL(`${prefix}${section}index.html`, output), "utf8");
		const json = html.match(/<script[^>]*id="blog-archives"[^>]*>(.*?)<\/script>/s)?.[1];
		assert(json, `${prefix}${section}: article data present`);
		const records = JSON.parse(json);
		assert.equal(new Set(records.map(record => record.source)).size, records.length, "No duplicate article URLs");
		for (const record of records) {
			assert(record.source.startsWith(`/${prefix}`), "Locale preserved");
			assert((await stat(join(output.pathname, decodeURI(record.source), "index.html"))).isFile(), `Missing article: ${record.source}`);
			assert(!record.body, "Full bodies stay in article pages");
			count++;
		}
		assert(html.includes("article-directory"), "Accessible HTML directory present");
	}
}
for (const file of ["assets/archive-cassette.glb", "assets/archive-assembly.glb", "licenses/RhineLabUI-MIT.txt", "fonts/MiSans-license.pdf"]) {
	assert((await stat(new URL(file, output))).size > 0, `Required upstream resource: ${file}`);
}
console.log(`Rhine blog smoke: ${files.length} pages, ${count} article links, three locales and model/license resources passed.`);
