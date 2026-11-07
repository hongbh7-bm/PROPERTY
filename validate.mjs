import { access, readFile } from "node:fs/promises";
await access("dist/server/index.js");
const manifest = JSON.parse(await readFile("dist/.openai/hosting.json", "utf8"));
if (!manifest.project_id || manifest.static) throw new Error("Invalid Worker hosting manifest");
console.log("Worker artifact validated");
