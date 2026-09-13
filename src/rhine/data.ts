import { archiveColumnsFor, type BlogArchive } from "../utils/rhine-records";
import { rt } from "./i18n";
export type ArchiveRecord = BlogArchive;
export let records: ArchiveRecord[] = JSON.parse(document.getElementById("blog-archives")?.textContent ?? "[]");
export let archiveColumns = archiveColumnsFor(records);
export let categories = [rt("archive.all"), ...archiveColumns];

/** Replace the locale-specific archive data without rebuilding the 3D scene. */
export function setArchiveData(nextRecords: ArchiveRecord[]) {
	records = nextRecords;
	archiveColumns = archiveColumnsFor(records);
	categories = [rt("archive.all"), ...archiveColumns];
}
export function columnFiles(lane: number) {
  const category = archiveColumns[((lane % archiveColumns.length) + archiveColumns.length) % archiveColumns.length];
  return records.flatMap((record, index) => record.category === category ? [index] : []);
}
export function fileLocation(index: number) {
  const lane = archiveColumns.indexOf(records[index].category);
  const row = 12 + columnFiles(lane).indexOf(index);
  return { lane, row, slot: lane * 32 + row };
}
export function fileAtSlot(slot: number) {
  const files = columnFiles(Math.floor(slot / 32));
  return files[Math.max(0, Math.min(files.length - 1, (slot % 32) - 12))];
}
