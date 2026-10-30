export interface ArchiveRecord {
  id: string;
  title: string;
  en: string;
  department: string;
  category: string;
  date: string;
  pubDate: string;
  updatedDate?: string;
  lead: string;
  clearance: string;
  abstract: string;
  findings: string[];
  source: string;
  legacy?: { path: string };
  slug?: string;
  body?: string;
  tags?: string[];
}

// Astro supplies the published Markdown collection before the client starts.
const content = JSON.parse(document.getElementById("blog-data")!.textContent!);
export const records: ArchiveRecord[] = content.records;
export const categories: string[] = ["全部档案", ...content.categories];
export const archiveColumns: string[] = content.columns;
// Article identity must not overflow into the next lane when a column grows.
const slotStride = Math.max(32, ...archiveColumns.map((_, lane) => columnFiles(lane).length + 12));

export function columnFiles(lane: number) {
  return records
    .map((record, index) => ({ record, index }))
    .filter(({ record }) => record.category === archiveColumns[lane])
    .map(({ index }) => index);
}
export function fileLocation(index: number) {
  const lane = archiveColumns.indexOf(records[index].category);
  const row = 12 + columnFiles(lane).indexOf(index);
  return { lane, row, slot: lane * slotStride + row };
}
export function fileAtSlot(slot: number) {
  const files = columnFiles(Math.floor(slot / slotStride));
  return files[Math.max(0, Math.min(files.length - 1, (slot % slotStride) - 12))];
}
