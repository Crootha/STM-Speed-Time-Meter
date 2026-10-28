/* Kontroly, které jdou spustit bez prohlížeče: node tests/check.mjs
   Hlídají to, co se při úpravách nejsnáz rozbije – chybějící překlad, odkaz ven, zapomenutý soubor. */
import { readFile, access } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const read = f => readFile(join(root, f), "utf8");
let failed = 0;
const check = (name, problem) => {
  if (problem) { console.error(`✗ ${name}\n  ${problem}`); failed++; }
  else console.log(`✓ ${name}`);
};
const exists = async f => access(join(root, f)).then(() => true, () => false);

const html = await read("index.html");
const i18n = await read("src/i18n.js");
const appjs = await read("src/app.js");
const sw = await read("sw.js");
const manifest = JSON.parse(await read("manifest.webmanifest"));

/* --- 1. jazyky mají stejné klíče --- */
const TEXTS = new Function(`const window = {}; ${i18n}; return window.TK_TEXTS;`)();
const langs = Object.keys(TEXTS);
const base = Object.keys(TEXTS[langs[0]]).sort();
check("jazyky mají stejné klíče", langs
  .map(l => {
    const keys = Object.keys(TEXTS[l]).sort();
    const missing = base.filter(k => !keys.includes(k));
    const extra = keys.filter(k => !base.includes(k));
    return missing.length || extra.length ? `${l}: chybí [${missing}], navíc [${extra}]` : "";
  })
  .filter(Boolean)
  .join("; "));

/* --- 2. pole who má všude tolik položek, kolik jich whoIdx může vrátit --- */
const whoNeeded = 9;
check(`who má ${whoNeeded} hlášek v každém jazyce`, langs
  .filter(l => TEXTS[l].who.length !== whoNeeded)
  .map(l => `${l}: ${TEXTS[l].who.length}`).join(", "));

/* --- 3. každý data-i v HTML má překlad --- */
const usedKeys = [...html.matchAll(/data-i="([^"]+)"/g)].map(m => m[1]);
check("každý data-i má překlad", usedKeys
  .filter(k => langs.some(l => TEXTS[l][k] == null))
  .join(", "));

/* --- 4. aplikace nesahá na cizí servery --- */
const sources = { "index.html": html, "src/app.js": appjs, "src/i18n.js": i18n,
  "src/styles.css": await read("src/styles.css"), "src/fonts/fonts.css": await read("src/fonts/fonts.css") };
const external = Object.entries(sources).flatMap(([f, text]) =>
  [...text.matchAll(/https?:\/\/[^\s"')]+/g)]
    .map(m => m[0])
    .filter(u => !u.startsWith("http://www.w3.org/"))
    .map(u => `${f}: ${u}`));
check("žádný požadavek ven", external.join("\n  "));

/* --- 5. soubory, na které se odkazujeme, existují --- */
const referenced = [
  ...[...html.matchAll(/(?:href|src)="(?!https?:|data:)([^"#]+)"/g)].map(m => m[1]),
  ...[...sw.matchAll(/"\.\/([^"]+)"/g)].map(m => m[1]).filter(p => p && !p.endsWith("/")),
  ...manifest.icons.map(i => i.src),
];
const missingFiles = [];
for (const f of new Set(referenced)) if (!(await exists(f))) missingFiles.push(f);
check("odkazované soubory existují", missingFiles.join(", "));

/* --- 6. fyzika: čas na kilometr --- */
const timePerKm = kmh => 3600 / kmh;
const cases = [[1, 3600], [50, 72], [60, 60], [120, 30], [200, 18]];
check("3600 / rychlost dává čas na 1 km", cases
  .filter(([v, s]) => Math.abs(timePerKm(v) - s) > 1e-9)
  .map(([v, s]) => `${v} km/h → ${timePerKm(v)} ≠ ${s}`).join(", "));

/* --- 7. verze cache servisního workeru se nesmí zapomenout --- */
check("sw.js má VERSION", /const VERSION = "[^"]+"/.test(sw) ? "" : "chybí konstanta VERSION");

console.log(failed ? `\n${failed} kontrol neprošlo` : "\nvše v pořádku");
process.exit(failed ? 1 : 0);
