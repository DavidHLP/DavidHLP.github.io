import assert from "node:assert/strict";
import { createServer } from "node:http";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { resolve, extname, join } from "node:path";
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ?? "playwright");

const run = promisify(execFile);
const dist = resolve("dist");
const evidence = resolve(".reports/about-browser");
await mkdir(evidence, { recursive: true });
const server = createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
    const file = resolve(dist, `.${pathname}`, pathname.endsWith("/") ? "index.html" : "");
    if (!file.startsWith(`${dist}/`)) { response.writeHead(403).end(); return; }
    const types = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".pdf": "application/pdf", ".png": "image/png", ".woff2": "font/woff2" };
    response.writeHead(200, { "Content-Type": types[extname(file)] ?? "application/octet-stream" });
    response.end(await readFile(file));
  } catch { response.writeHead(404).end(); }
});
await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
let browser;
const results = [];
const normalize = value => value.normalize("NFKC").replace(/[^\p{L}\p{N}]/gu, "");
const pageCount = async file => Number((await run("pdfinfo", [file])).stdout.match(/^Pages:\s+(\d+)$/m)?.[1]);
try {
  browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE });
  for (const language of ["zh-CN", "en", "ja"]) for (const focus of ["", "java-agent", "java-vue"]) {
    const path = `${language === "zh-CN" ? "" : `/${language}`}/about/${focus ? `${focus}/` : ""}`;
    const name = `${language}-${focus || "standard"}`;
    const root = join(dist, path);
    const pdf = join(root, "resume.pdf");
    const pages = await pageCount(pdf);
    assert.equal(pages, 2, `${path}: two-page résumé`);
    const { stdout: text } = await run("pdftotext", ["-layout", pdf, "-"]);
    const pdfText = normalize(text.replace(/^\s*\d+\s*$/gm, ""));
    const pageTexts = await Promise.all(Array.from({ length: pages }, async (_, index) => {
      const { stdout } = await run("pdftotext", ["-f", String(index + 1), "-l", String(index + 1), "-layout", pdf, "-"]);
      return normalize(stdout.replace(/^\s*\d+\s*$/gm, ""));
    }));
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.goto(origin + path, { waitUntil: "networkidle" });
    assert.equal(await page.locator(".resume-export-identity h1").isVisible(), true);
    assert.equal(await page.locator(".resume-export-body").isVisible(), true);
    assert.equal(await page.locator(".latex-pages").count(), 0);
    assert.equal(await page.locator("#about-print").isVisible(), true);
    assert.equal(await page.locator('a[download][href$="resume.pdf"]').getAttribute("href"), `${path}resume.pdf`);
    const paragraphs = await page.evaluate(() => {
      const copy = document.createElement("div");
      copy.append(document.querySelector(".resume-export-identity").cloneNode(true), document.querySelector(".resume-export-body").cloneNode(true));
      copy.querySelectorAll('[aria-hidden="true"], .resume-section-number').forEach(node => node.remove());
      return [...copy.querySelectorAll("h1, h2, h3, h4, p, li")].map(node => ({ text: node.textContent, heading: /^H[1-4]$/.test(node.tagName) }));
    });
    for (const { text: paragraph } of paragraphs) {
      const expected = normalize(paragraph);
      if (expected) assert.ok(pdfText.includes(expected), `${path}: PDF omitted text: ${paragraph.slice(0, 160)}`);
      if (expected) assert.ok(pageTexts.some(text => text.includes(expected)), `${path}: PDF splits a paragraph across pages: ${paragraph.slice(0, 160)}`);
    }
    for (let index = 0; index + 1 < paragraphs.length; index++) {
      if (!paragraphs[index].heading) continue;
      const heading = normalize(paragraphs[index].text);
      const following = normalize(paragraphs[index + 1].text);
      assert.ok(pageTexts.some(text => text.includes(heading) && text.includes(following)), `${path}: PDF strands a heading: ${paragraphs[index].text}`);
    }
    // Print without scrolling to catch omitted or blank native-print pages.
    const printed = join(evidence, `${name}-browser-print.pdf`);
    await page.pdf({ path: printed, preferCSSPageSize: true, printBackground: true });
    const printedPages = await pageCount(printed);
    assert.ok(printedPages >= 1, `${path}: browser print page count`);
    const printedText = normalize((await run("pdftotext", ["-layout", printed, "-"])).stdout);
    for (const { text: paragraph } of paragraphs) {
      const expected = normalize(paragraph);
      if (expected) assert.ok(printedText.includes(expected), `${path}: browser print omitted text: ${paragraph.slice(0, 160)}`);
    }
    for (let number = 1; number <= printedPages; number++) {
      const output = join(evidence, `${name}-browser-print-${number}`);
      await run("pdftoppm", ["-f", String(number), "-l", String(number), "-singlefile", "-gray", "-r", "40", printed, output]);
      const raster = await readFile(`${output}.pgm`);
      const header = raster.toString("ascii", 0, 80).match(/^P5\s+(\d+)\s+(\d+)\s+255\s/);
      assert.ok(header, "Expected grayscale PGM output");
      const pixels = raster.subarray(header[0].length);
      const ink = pixels.filter(value => value < 230).length / pixels.length;
      assert.ok(ink > 0.01, `${path}: printed page ${number} is blank (${ink})`);
    }
    for (let number = 1; number <= pages; number++)
      await run("pdftoppm", ["-f", String(number), "-l", String(number), "-singlefile", "-png", "-r", "100", pdf, join(evidence, `${name}-pdf-${number}`)]);
    const widths = [];
    for (const width of [375, 768, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      for (const dark of [false, true]) {
        if ((await page.locator("#about-theme").getAttribute("aria-pressed") === "true") !== dark)
          await page.locator("#about-theme").click();
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
        assert.equal(overflow, false, `${path}: ${width}px overflow`);
        assert.equal(await page.locator(".resume-export-body").isVisible(), true, `${path}: text is visible by default`);
        assert.equal(await page.locator(".resume-export-identity h1").isVisible(), true, `${path}: identity is visible`);
        assert.ok(await page.locator(".resume-export-body").evaluate(node => parseFloat(getComputedStyle(node).fontSize) >= 16), `${path}: readable text size`);
        await page.screenshot({ path: join(evidence, `${name}-${width}-${dark ? "dark" : "light"}.png`), fullPage: true });
        widths.push({ width, dark, overflow });
      }
    }
    await page.locator('.about-nav a[hreflang="en"]').click();
    assert.equal(new URL(page.url()).pathname, `/en/about/${focus ? `${focus}/` : ""}`);
    if (language !== "en") {
      await page.goBack();
      assert.equal(new URL(page.url()).pathname, path);
      await page.goForward();
      assert.equal(new URL(page.url()).pathname, `/en/about/${focus ? `${focus}/` : ""}`);
    }
    assert.deepEqual(errors, [], `${path}: browser errors`);
    await context.close();
    const noJs = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 375, height: 1000 } });
    const reader = await noJs.newPage();
    await reader.goto(origin + path);
    assert.equal(await reader.locator(".resume-export-body").isVisible(), true, `${path}: no-JavaScript text`);
    assert.equal(await reader.locator(".resume-export-identity h1").isVisible(), true, `${path}: no-JavaScript identity`);
    assert.equal(await reader.locator('a[download][href$="resume.pdf"]').isVisible(), true, `${path}: no-JavaScript PDF download`);
    await noJs.close();
    results.push({ path, pages, printedPages, textBlocks: paragraphs.length, unbrokenParagraphs: true, headingsWithContent: true, defaultText: true, nativePrint: true, noJavaScript: true, widths });
    await writeFile(join(evidence, "report.json"), JSON.stringify({ commit: process.env.GITHUB_SHA ?? "local", results }, null, 2));
    console.log(`${path}: ${pages} pages, ${paragraphs.length} text blocks, six viewport/theme cases, native print and no-JS passed`);
  }
  assert.equal(results.length, 9);
} finally {
  await browser?.close();
  await new Promise(resolve => server.close(resolve));
}
