import { mkdir, readFile, writeFile, readdir, stat, lstat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { dirname, resolve, sep } from 'node:path';

// Publish every dist file; the offline cache is a separate subset.
// A fresh directory per release prevents stale files from previous builds.
const source = resolve('dist');
const metadata = JSON.parse(await readFile(resolve(source, 'pwa-build.json'), 'utf8'));
if (!/^[a-f0-9]{16}$/.test(metadata.version)) throw Error('Invalid PWA release version.');
// Pages Git builds need a stable output path; each hosted build starts clean.
const output = resolve('release/cloudflare', process.env.CF_PAGES === '1' ? 'site' : metadata.version);
const files = [];
for (const entry of await readdir(source, { recursive: true })) {
  const path = entry.replaceAll('\\', '/');
  const from = resolve(source, path);
  if (!from.startsWith(source + sep)) throw Error(`Invalid release path: ${path}`);
  const info = await lstat(from);
  if (info.isSymbolicLink()) throw Error(`Symbolic links are not public release files: ${path}`);
  if (info.isFile()) files.push(path);
}
files.sort();
const fonts = JSON.parse(await readFile(new URL('./webfont-sources.json', import.meta.url), 'utf8'));
const pagesHost = process.env.CF_PAGES_URL ? new URL(process.env.CF_PAGES_URL).hostname : '';
const official = pagesHost === 'rhine-lab-ui.pages.dev' || pagesHost.endsWith('.rhine-lab-ui.pages.dev') ||
  process.env.VERCEL_PROJECT_ID === 'prj_KyOQlIfl3qhHkI4SUpiD5tbFTE5w';
for (const [weight, font] of Object.entries(fonts)) {
  const path = `fonts/novecento/webFonts/NovecentoSansWide${weight}/font.woff2`;
  if (!files.includes(path)) {
    if (official) throw Error(`Official release requires licensed font: ${weight}`);
    continue;
  }
  const bytes = await readFile(resolve(source, path));
  if (createHash('sha256').update(bytes).digest('hex') !== font.sha256)
    throw Error(`Licensed font checksum mismatch: ${weight}`);
}
const entries = [];
for (const path of files) {
  const from = resolve(source, path);
  if (!from.startsWith(source + sep)) throw Error(`Invalid release path: ${path}`);
  const bytes = await readFile(from);
  if (bytes.length > 25 * 1024 * 1024) throw Error(`Cloudflare file exceeds 25 MiB: ${path}`);
  entries.push({ path, bytes });
}
if (files.length + 1 > 20000) throw Error('Cloudflare free plan file count exceeded.');
await mkdir(output, { recursive: true });
const allowed = new Set([...files, '_headers', '404.html']);
for (const path of await readdir(output, { recursive: true })) {
  if ((await stat(resolve(output, path))).isFile() && !allowed.has(path.replaceAll('\\', '/')))
    throw Error(`Unexpected existing file in package: ${path}`);
}
for (const { path, bytes } of entries) {
  const target = resolve(output, path);
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, bytes);
}
const immutable = files.filter(path => /^assets\/archive-(cassette|assembly)\.[a-f0-9]{16}\.glb$/.test(path));
const headers = [
  '/fonts/misans-webfont-4.3.1/*\n  Cache-Control: public, max-age=31536000, immutable',
  ...immutable.map(path => `/${path}\n  Cache-Control: public, max-age=31536000, immutable`),
  ...['/', '/index.html', '/blog/*', '/blog-search.json', '/rss.xml', '/sitemap*.xml', '/update*', '/sw.js'].map(path => `${path}\n  Cache-Control: no-cache, no-store, must-revalidate`),
  ...['/manifest.webmanifest', '/pwa-build.json'].map(path => `${path}\n  Cache-Control: no-cache, must-revalidate`),
];
await writeFile(resolve(output, '_headers'), headers.join('\n\n') + '\n');
await writeFile('release/cloudflare/latest.json', JSON.stringify({
  version: metadata.version, directory: output, files: files.length + 1,
  bytes: entries.reduce((total, entry) => total + entry.bytes.length, 0),
  largestFileBytes: Math.max(...entries.map(entry => entry.bytes.length)),
}, null, 2));
console.log(`Cloudflare package ready: ${output}\n${files.length + 1} files; available licensed fonts verified.`);
