import type { ArchiveRecord } from "./data";

export function recentRecords<T extends { pubDate: string }>(records: readonly T[]) {
  return [...records].sort((a, b) => Date.parse(b.pubDate) - Date.parse(a.pubDate));
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
