#!/usr/bin/env tsx

import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { basename, join, relative } from "node:path";

const root = process.cwd();
const contentRoot = join(root, "src", "content");
const rawRoot = join(contentRoot, "raw");
const noteRoot = join(contentRoot, "note");
const indexPath = join(contentRoot, "information", "zh-cn", "kb-index.md");
const logPath = join(contentRoot, "information", "zh-cn", "kb-log.md");
const manifestPath = join(rawRoot, ".manifest.sha256");
const errors: string[] = [];

function markdownFiles(directory: string): string[] {
	if (!existsSync(directory)) return [];
	return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
		const path = join(directory, entry.name);
		return entry.isDirectory() ? markdownFiles(path) : entry.name.endsWith(".md") ? [path] : [];
	});
}

function frontmatter(path: string): string {
	const text = readFileSync(path, "utf8");
	if (!text.startsWith("---")) return "";
	const end = text.indexOf("\n---", 3);
	return end === -1 ? "" : text.slice(4, end);
}

function field(block: string, name: string): string | undefined {
	return block
		.split("\n")
		.find(line => line.startsWith(`${name}:`))
		?.slice(name.length + 1)
		.trim();
}

function listField(block: string, name: string): string[] {
	const value = field(block, name);
	if (!value) return [];
	return [...value.matchAll(/["']([^"']+)["']/g)].map(match => match[1]);
}

function sha256(path: string): string {
	return createHash("sha256").update(readFileSync(path, "utf8")).digest("hex");
}

function reportGitRawChanges(): void {
	try {
		const output = execFileSync("git", ["diff", "--name-status", "HEAD", "--", "src/content/raw", ":(exclude)src/content/raw/.manifest.sha256"], {
			cwd: root,
			encoding: "utf8"
		});
		for (const line of output.trim().split("\n").filter(Boolean)) {
			const status = line.split(/\s+/)[0];
			if (/^[MDRC]/.test(status)) errors.push(`raw snapshot changed or deleted: ${line}`);
		}
	} catch {
		// Git is optional when the script is run from a source archive.
	}
}

if (!existsSync(manifestPath)) errors.push("missing raw manifest: src/content/raw/.manifest.sha256");
const manifest = new Map<string, string>();
if (existsSync(manifestPath)) {
	for (const line of readFileSync(manifestPath, "utf8").split("\n").filter(Boolean)) {
		const match = line.match(/^([a-f0-9]{64})\s+(.+)$/);
		if (!match) {
			errors.push(`invalid raw manifest entry: ${line}`);
			continue;
		}
		manifest.set(match[2], match[1]);
	}
}

const rawFiles = markdownFiles(rawRoot);
for (const path of rawFiles) {
	const relativePath = relative(rawRoot, path);
	const expected = manifest.get(relativePath);
	if (!expected) errors.push(`raw file missing from manifest: ${relativePath}`);
	else if (expected !== sha256(path)) errors.push(`raw checksum mismatch: ${relativePath}`);
}
for (const relativePath of manifest.keys()) {
	if (!existsSync(join(rawRoot, relativePath))) errors.push(`manifest points to missing raw file: ${relativePath}`);
}
reportGitRawChanges();

const rawSlugs = new Set(rawFiles.map(path => basename(path, ".md")));
for (const path of markdownFiles(noteRoot)) {
	const block = frontmatter(path);
	const relativePath = relative(noteRoot, path);
	const kind = field(block, "kind");
	const status = field(block, "status");
	const sources = listField(block, "sources");
	if (!kind) errors.push(`wiki page missing kind: ${relativePath}`);
	if (!status) errors.push(`wiki page missing status: ${relativePath}`);
	if (!sources.length) errors.push(`wiki page missing sources: ${relativePath}`);
	for (const source of sources) if (!rawSlugs.has(source)) errors.push(`wiki page ${relativePath} references missing raw source: ${source}`);
}

if (!existsSync(indexPath)) errors.push("missing canonical index: src/content/information/zh-cn/kb-index.md");
else {
	const index = readFileSync(indexPath, "utf8");
	for (const path of markdownFiles(join(noteRoot, "zh-cn"))) {
		const block = frontmatter(path);
		if (["active", "provisional"].includes(field(block, "status") ?? "") && !index.includes(basename(path, ".md"))) {
			errors.push(`active/provisional wiki page missing from index: ${relative(noteRoot, path)}`);
		}
	}
	for (const slug of rawSlugs) if (!index.includes(slug)) errors.push(`raw source missing from index: ${slug}`);
}

if (!existsSync(logPath)) errors.push("missing canonical log: src/content/information/zh-cn/kb-log.md");
else if (!/^## \[\d{4}-\d{2}-\d{2}\] .+/m.test(readFileSync(logPath, "utf8"))) errors.push("kb-log.md has no parseable dated entry");

if (errors.length) {
	console.error(`KB lint failed (${errors.length} issue${errors.length === 1 ? "" : "s"})`);
	for (const error of errors) console.error(`- ${error}`);
	process.exit(1);
}

console.log(`KB lint passed: ${rawFiles.length} raw source(s), ${markdownFiles(noteRoot).length} wiki page(s), canonical index/log present.`);
