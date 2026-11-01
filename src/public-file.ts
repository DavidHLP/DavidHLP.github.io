import { statSync } from "node:fs";
import { resolve } from "node:path";

export function publicFile(path: string | undefined, directory = "public") {
  if (!path || !/^\/(?!\/)(?!.*(?:\.\.|[?#\\])).+$/.test(path)) return undefined;
  try { return statSync(resolve(directory, `.${path}`)).isFile() ? path : undefined; }
  catch { return undefined; }
}
