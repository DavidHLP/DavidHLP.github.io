import fs from "node:fs/promises";
import { loadContent, archiveText } from "./archive-content.mjs";

// Validate the entire input before writing any downloads.
const { records } = await loadContent();
const output = new URL("../public/archives/", import.meta.url);
await fs.mkdir(output, { recursive: true });
for (const record of records) {
  await fs.writeFile(
    new URL(`RHINE-LAB-${record.id}.txt`, output),
    archiveText(record),
    "utf8",
  );
}
const published = new Set(records.map(record => `RHINE-LAB-${record.id}.txt`));
for (const name of await fs.readdir(output)) {
  if (/^RHINE-LAB-X-\d+\.txt$/.test(name) && !published.has(name))
    await fs.unlink(new URL(name, output));
}
console.log(`Prepared ${records.length} downloadable archive records.`);
