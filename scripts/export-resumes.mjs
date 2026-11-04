import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { readdir } from "node:fs/promises";
import { join } from "node:path";
import { promisify } from "node:util";
import site from "../content/site.json" with { type: "json" };
import { aboutPath } from "../src/about-path.ts";

if (process.env.RHINE_RESUME_PDF === "1") {
  const run = promisify(execFile);
  const regions = { "zh-CN": "SC", en: "SC", ja: "JP" };

  for (const [language, region] of Object.entries(regions)) {
    const directory = join("dist", aboutPath(language));
    const entries = await readdir(directory, { withFileTypes: true });
    const variants = entries.filter(entry => entry.isDirectory() && /^[a-z][a-z0-9-]*$/.test(entry.name));
    for (const variant of [undefined, ...variants.map(entry => entry.name)]) {
      const path = join("dist", aboutPath(language, variant));
      const source = join(path, "index.html");
      if (variant && !existsSync(source)) continue;
      try {
        await run("pandoc", [
          source, "--from=html", "--pdf-engine=xelatex", "--fail-if-warnings",
          `--metadata=resume-url:${new URL(aboutPath(language, variant), site.site)}`,
          "--lua-filter=scripts/resume/about.lua",
          "--include-in-header=scripts/resume/layout.tex",
          "--variable=papersize:a4", "--variable=geometry:margin=14mm",
          "--variable=mainfont:Noto Serif", "--variable=sansfont:Noto Sans",
          `--variable=CJKmainfont:Noto Serif CJK ${region}`, `--variable=CJKsansfont:Noto Sans CJK ${region}`,
          "--variable=colorlinks",
          "--output", join(path, "resume.pdf"),
        ]);
      } catch (error) {
        throw new Error(`Could not typeset ${aboutPath(language, variant)}\n${error.stderr || error.message}`, { cause: error });
      }
      console.log(`LaTeX résumé: ${aboutPath(language, variant)}resume.pdf`);
    }
  }
}
