import type { ArchiveRecord } from "./data";
import { postPath } from "./blog-path.ts";

export function articleNavigationUrl(
  records: readonly Pick<ArchiveRecord, "slug" | "lang">[],
  link: Pick<HTMLAnchorElement, "href" | "target" | "hasAttribute"> | null,
  event: Pick<MouseEvent, "button" | "ctrlKey" | "metaKey" | "shiftKey" | "altKey" | "defaultPrevented">,
  currentHref: string,
) {
  if (!link || event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey
    || link.hasAttribute("download") || link.target && link.target.toLowerCase() !== "_self") return;
  let url: URL, current: URL;
  try { current = new URL(currentHref); url = new URL(link.href, current); } catch { return; }
  if (url.origin !== current.origin || url.pathname === current.pathname) return;
  const record = records.find(record => record.slug && postPath(record.slug) === url.pathname);
  if (!record || [...url.searchParams].some(([key, value]) => key !== "lang" || value !== (record.lang ?? "zh-CN"))) return;
  return url.pathname + url.search + url.hash;
}

export function recentRecords<T extends { pubDate: string }>(records: readonly T[]) {
  return [...records].sort((a, b) => Date.parse(b.pubDate) - Date.parse(a.pubDate));
}

export function archiveTickWindow(files: readonly number[], selected: number) {
  const start = Math.max(0, Math.min(files.indexOf(selected) - 3, files.length - 8));
  return files.slice(start, start + 8);
}

export function visibleSavedCount(saved: ReadonlySet<string>, records: readonly { id: string }[]) {
  return records.filter(record => saved.has(record.id)).length;
}

export function persistSaved(saved: ReadonlySet<string>, storage?: Pick<Storage, "setItem">) {
  try {
    (storage ?? localStorage).setItem("rhine-saved", JSON.stringify([...saved]));
    return true;
  } catch {
    return false;
  }
}

export function syncArticleMetadata(head: HTMLHeadElement, record: ArchiveRecord | undefined, siteAuthor: string) {
  const fields: [string, string, string | undefined][] = [
    ["name", "author", record?.lead ?? siteAuthor],
    ["property", "article:published_time", record?.pubDate],
    ["property", "article:modified_time", record?.updatedDate],
  ];
  for (const [attribute, key, value] of fields) {
    const selector = `meta[${attribute}="${key}"]`;
    let meta = head.querySelector<HTMLMetaElement>(selector);
    if (!value) { meta?.remove(); continue; }
    if (!meta) {
      meta = head.ownerDocument.createElement("meta");
      meta.setAttribute(attribute, key);
      head.append(meta);
    }
    meta.content = key === "author" ? value : new Date(value).toISOString();
  }
}

export function restoreArticleHash(container: HTMLElement, hash: string) {
  if (!hash) return false;
  let id: string;
  try { id = decodeURIComponent(hash.slice(1)); } catch { return false; }
  const target = [...container.querySelectorAll<HTMLElement>("[id]")].find(node => node.id === id);
  if (!target) return false;
  target.scrollIntoView({ block: "start" });
  return true;
}
