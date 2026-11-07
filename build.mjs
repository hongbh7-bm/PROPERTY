import { mkdir, readFile, rm, writeFile, cp } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const rawHtml = await readFile(resolve(root, "public/index.html"), "utf8");
const heroBytes = await readFile(resolve(root, "assets/yeongdeungpo-hero.png"));
const heroDataUri = `data:image/png;base64,${heroBytes.toString("base64")}`;
const html = rawHtml.replace("__HERO_DATA_URI__", heroDataUri);
const worker = await readFile(resolve(root, "worker/index.js"), "utf8");
await rm(resolve(root, "dist"), { recursive: true, force: true });
await mkdir(resolve(root, "dist/server"), { recursive: true });
await mkdir(resolve(root, "dist/.openai"), { recursive: true });
await writeFile(resolve(root, "dist/server/index.js"), `const PAGE = ${JSON.stringify(html)};\n${worker}`);
await cp(resolve(root, ".openai/hosting.json"), resolve(root, "dist/.openai/hosting.json"));
