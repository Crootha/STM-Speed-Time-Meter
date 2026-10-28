/* Poskládá www/ – přesně to, co se zabalí do APK.
   Web běží přímo z kořene repozitáře, APK potřebuje vlastní složku bez node_modules a androidu. */
import { cp, rm, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const out = join(root, "www");

/* sw.js schválně chybí: uvnitř APK jsou soubory lokálně a servisní worker by jen držel starou verzi */
const ASSETS = ["index.html", "manifest.webmanifest", "favicon.ico", "src", "icons"];

await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });
for (const a of ASSETS) await cp(join(root, a), join(out, a), { recursive: true });

/* verze aplikace do titulku není potřeba, ale registraci servisního workeru v APK nechceme */
const idx = join(out, "index.html");
const html = await readFile(idx, "utf8");
await writeFile(idx, html.replace(/\n<script>\n\/\* Offline režim[\s\S]*?<\/script>/, ""), "utf8");

console.log("www/ hotovo:", ASSETS.join(", "));
