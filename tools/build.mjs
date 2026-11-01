// Builds packs/<name> (LevelDB) from src/<name>/*.json. Foundry must not have the module's packs open.
// Usage: node tools/build.mjs
import fs from "fs";
import path from "path";
import { createRequire } from "module";
import { fileURLToPath } from "url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const FOUNDRY_APP = process.env.FOUNDRY_APP ?? "C:/Program Files/Foundry Virtual Tabletop/resources/app";
const { ClassicLevel } = createRequire(path.join(FOUNDRY_APP, "package.json"))("classic-level");

const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, "module.json"), "utf8"));
const snippet = fs.readFileSync(path.join(ROOT, "world-scripts/vengeances-mark.txt"), "utf8").trim();
const escapeHtml = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const stats = () => ({
  coreVersion: manifest.compatibility.verified,
  systemId: "projectmoonttrpg",
  systemVersion: "0.1.4",
  createdTime: null,
  modifiedTime: Date.now(),
  lastModifiedBy: null,
  compendiumSource: null,
  duplicateSource: null,
  exportSource: null,
});

for (const pack of manifest.packs) {
  const srcDir = path.join(ROOT, "src", pack.name);
  const outDir = path.join(ROOT, pack.path);
  fs.rmSync(outDir, { recursive: true, force: true });
  const db = new ClassicLevel(outDir, { valueEncoding: "json" });
  await db.open();
  const batch = db.batch();
  let count = 0;
  for (const file of fs.readdirSync(srcDir).filter((f) => f.endsWith(".json")).sort()) {
    const doc = JSON.parse(fs.readFileSync(path.join(srcDir, file), "utf8"));
    const key = doc._key;
    delete doc._key;
    doc._stats = stats();
    if (Array.isArray(doc.pages)) {
      const pages = doc.pages;
      doc.pages = pages.map((p) => p._id);
      for (const page of pages) {
        const pageKey = page._key;
        delete page._key;
        page._stats = stats();
        if (page.text?.content) page.text.content = page.text.content.replace("{{VENGEANCE_SNIPPET}}", escapeHtml(snippet));
        batch.put(pageKey, page);
      }
    }
    batch.put(key, doc);
    count += 1;
  }
  await batch.write();
  await db.close();
  console.log(`${pack.name}: ${count} documents`);
}
