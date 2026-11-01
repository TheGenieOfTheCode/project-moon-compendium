// Copies the module into Foundry's Data/modules. Run with the Foundry server stopped (packs are LevelDB).
// Usage: node tools/deploy.mjs [dataPath]   (default: $FOUNDRY_DATA, else %LOCALAPPDATA%/FoundryVTT/Data)
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DATA = process.argv[2] ?? process.env.FOUNDRY_DATA ?? path.join(process.env.LOCALAPPDATA ?? "", "FoundryVTT", "Data");
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, "module.json"), "utf8"));
const dest = path.join(DATA, "modules", manifest.id);

const SHIP = ["module.json", "scripts", "styles", "lang", "icons", "packs", "world-scripts"];
fs.rmSync(dest, { recursive: true, force: true });
for (const entry of SHIP) {
  const from = path.join(ROOT, entry);
  if (fs.existsSync(from)) fs.cpSync(from, path.join(dest, entry), { recursive: true });
}
console.log(`deployed ${manifest.id} ${manifest.version} to ${dest}`);
