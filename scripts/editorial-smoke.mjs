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
for (const prefix of ["", "en/", "ja/"]) {
	const home = await readFile(new URL(`${prefix}index.html`, output), "utf8");
	assert(home.includes("PROLOGUE.INIT"), `${prefix}: original homepage composition`);
	assert(home.includes("data-sailing-cover") && home.includes("/images/sailing-print-no-text.png"), `${prefix}: latest sailing image retained`);
	assert(!home.includes('id="selected-work"'), `${prefix}: redesigned portfolio layout removed`);
	const resume = await readFile(new URL(`${prefix}about/index.html`, output), "utf8");
	assert(resume.includes("lg:flex-row") && !resume.includes("resume-rail"), `${prefix}: original resume layout`);
}
const base = await readFile(new URL("../src/layouts/Base.astro", import.meta.url), "utf8");
assert(!base.includes('import "$styles/editorial.css"'), "Editorial layout overrides are no longer loaded");
const css = await readFile(new URL("../src/styles/global.css", import.meta.url), "utf8");
for (const color of ["#30343a", "#c83232", "#fafaf7", "#222529", "#ed817a"]) assert(css.includes(color), `Latest palette retains ${color}`);
assert((await stat(new URL("images/sailing-print-no-text.png", output))).size > 0, "Latest sailing image exists");
console.log(`Layout rollback smoke: ${files.length} pages, three original home/resume layouts, latest palette and sailing image passed.`);
