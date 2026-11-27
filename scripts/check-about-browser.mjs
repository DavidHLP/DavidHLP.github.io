import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { resolve, extname, join } from "node:path";
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ?? "playwright");

const dist = resolve("dist");
const evidence = resolve(".reports/about-browser");
await mkdir(evidence, { recursive: true });
const server = createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
    const file = resolve(dist, `.${pathname}`, pathname.endsWith("/") ? "index.html" : "");
    if (!file.startsWith(`${dist}/`)) { response.writeHead(403).end(); return; }
    const types = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".woff2": "font/woff2" };
    response.writeHead(200, { "Content-Type": types[extname(file)] ?? "application/octet-stream" });
    response.end(await readFile(file));
  } catch { response.writeHead(404).end(); }
});
await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
let browser;
const results = [];
try {
  browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE });
  for (const language of ["zh-CN", "en", "ja"]) {
    const path = `${language === "zh-CN" ? "" : `/${language}`}/about/`;
    const name = language;
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.goto(origin + path, { waitUntil: "networkidle" });
    assert.equal(await page.locator(".about-identity-content h1").isVisible(), true, `${path}: identity`);
    assert.equal(await page.locator(".about-body-content").isVisible(), true, `${path}: body`);
    assert.equal(await page.locator(".about-actions, #about-print, a[download]").count(), 0, `${path}: no export actions`);
    const paragraphs = await page.locator(".about-body-content h2, .about-body-content p, .about-body-content li").count();
    assert.ok(paragraphs > 0, `${path}: body has content`);
    const widths = [];
    for (const width of [375, 768, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      for (const dark of [false, true]) {
        if ((await page.locator("#about-theme").getAttribute("aria-pressed") === "true") !== dark)
          await page.locator("#about-theme").click();
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
        assert.equal(overflow, false, `${path}: ${width}px overflow`);
        assert.equal(await page.locator(".about-body-content").isVisible(), true, `${path}: text visible by default`);
        assert.equal(await page.locator(".about-identity-content h1").isVisible(), true, `${path}: identity visible`);
        assert.ok(await page.locator(".about-body-content").evaluate(node => parseFloat(getComputedStyle(node).fontSize) >= 16), `${path}: readable text size`);
        await page.screenshot({ path: join(evidence, `${name}-${width}-${dark ? "dark" : "light"}.png`), fullPage: true });
        widths.push({ width, dark, overflow });
      }
    }
    await page.locator('.about-nav a[hreflang="en"]').click();
    assert.equal(new URL(page.url()).pathname, "/en/about/");
    if (language !== "en") {
      await page.goBack();
      assert.equal(new URL(page.url()).pathname, path);
    }
    assert.deepEqual(errors, [], `${path}: browser errors`);
    await context.close();
    const noJs = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 375, height: 1000 } });
    const reader = await noJs.newPage();
    await reader.goto(origin + path);
    assert.equal(await reader.locator(".about-body-content").isVisible(), true, `${path}: no-JavaScript text`);
    assert.equal(await reader.locator(".about-identity-content h1").isVisible(), true, `${path}: no-JavaScript identity`);
    await noJs.close();
    results.push({ path, textBlocks: paragraphs, noJavaScript: true, widths });
    await writeFile(join(evidence, "report.json"), JSON.stringify({ commit: process.env.GITHUB_SHA ?? "local", results }, null, 2));
    console.log(`${path}: ${paragraphs} text blocks, six viewport/theme cases and no-JS passed`);
  }
  assert.equal(results.length, 3);
} finally {
  await browser?.close();
  await new Promise(resolve => server.close(resolve));
}
