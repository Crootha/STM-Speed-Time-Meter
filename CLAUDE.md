# Tachometr kilometru

Interaktivní webová aplikace, která ukazuje vztah rychlosti a času na ujetí 1 km.
Čistý HTML + CSS + JavaScript. Web nemá build ani závislosti – vše, co potřebuje, leží v repozitáři.
Node a Capacitor jsou v repozitáři **jen** kvůli sestavení Android APK; samotná stránka o nich neví.

## Spuštění
- Otevři `index.html` v prohlížeči, nebo
- `python3 -m http.server 8000` a jdi na http://localhost:8000
- `npm test` spustí kontroly bez prohlížeče (jazyky, odkazy ven, existence souborů)

## Struktura
```
index.html              kostra stránky (hlavička, tachometr, graf, jízda, tabulka)
src/styles.css          vzhled; všechny barvy jsou CSS proměnné (tokeny)
src/i18n.js             všechny texty v CZ / EN / ES (window.TK_TEXTS)
src/app.js              logika: kreslení SVG, ovládání, simulace, jazyk a vzhled
src/fonts/              Chakra Petch a Barlow (woff2) + fonts.css
sw.js                   běh bez sítě
manifest.webmanifest    instalovatelná webová aplikace
icons/                  ikony, zdroj je icon.svg
tests/check.mjs         kontroly pro npm test
scripts/build-www.mjs   poskládá www/ pro APK
android/                Capacitor; generované, ale ručně doladěné
```

Podrobnosti v `docs/`: [architektura](docs/architektura.md), [vývoj](docs/vyvoj.md),
[android](docs/android.md), [zapstore](docs/zapstore.md).

## Jak to funguje
- **Fyzika:** čas na 1 km [s] = 3600 / rychlost [km/h]; metry za sekundu = rychlost / 3,6.
- **Tachometr** (`#gauge`) je SVG generované v `app.js`. Rozsah 0–200 km/h, úhel 135° + 270°.
  - Vnitřní stupnice: km/h. Vnější modrá stupnice: čas na 1 km (6:00 … 0:20).
  - Konstanty `MAX, A0, SWEEP, CX, CY, R, RIM` určují geometrii. Funkce `pt(speed, radius)` vrací souřadnice.
  - `RIM` je poloměr vnější obruče. Když ho změníš, uprav i `viewBox` u `#gauge` v `index.html`, jinak se obruč ořízne.
- **Graf** (`#curve`) ukazuje hyperbolu t = 60 / v (minuty), osa Y je oříznutá na 6 min.
- **Ovládání:** tažení ručičky, posuvník, držení pedálů Plyn/Brzda, šipky ↑/↓, předvolby (plynulý dojezd přes `target`).
- **Simulace 1 km:** skutečný čas nebo ×10. Rychlost se dá měnit i během jízdy.
- **Hlavní smyčka:** `requestAnimationFrame` v `loop()`. `render()` překresluje jen při změně celé km/h nebo jazyka.
  `drawRun()` se musí zavolat i při změně rychlosti mimo jízdu, jinak „do cíle“ ukazuje starou hodnotu.

## Témata (světlé / tmavé)
- Světlé hodnoty jsou na `:root`. Tmavé hodnoty jsou ve dvou blocích: `@media (prefers-color-scheme: dark)` a `:root[data-theme="dark"]`. **Nové barvy přidávej do všech tří bloků.**
- Přepínač Auto/Světlý/Tmavý nastavuje `data-theme` na `<html>`. Volba se ukládá do `localStorage` (`tk-theme`).
- SVG prvky berou barvy přes `style="fill:var(--…)"`, takže reagují na změnu tématu. Nepoužívej pevné barvy.

## Jazyky
- `src/i18n.js` obsahuje objekty `cs`, `en`, `es`. Všechny musí mít **stejné klíče** – hlídá to `npm test`.
- Prvky s `data-i="klic"` se plní automaticky (přes innerHTML, takže lze použít i `<span>`).
- Texty jsou psané přirozeně pro každý jazyk, nejsou to doslovné překlady. Příklady jsou lokalizované: trasa (Praha → Brno, London → Manchester, Madrid → Zaragoza) i předvolby rychlostí podle místních limitů.
- Výchozí jazyk se bere z prohlížeče, záložní je angličtina. Volba se ukládá do `localStorage` (`tk-lang`).
- **Nový jazyk:** zkopíruj blok `en`, přelož ho a přidej tlačítko do `#langSeg` v `index.html`.

## Zásady pro úpravy
- Zachovej responzivitu: na šířce telefonu (~400 px) se nic nesmí posouvat do strany. Pod 900 px je layout v jednom sloupci.
- Číselné údaje mají `font-variant-numeric: tabular-nums`.
- Respektuj `prefers-reduced-motion`. Ovládání musí jít i klávesnicí (viditelný `:focus-visible`).
- Přístup do `localStorage` vždy obal do try/catch (objekt `store` v `app.js`).
- **Žádný požadavek ven.** Písma jsou v repozitáři, žádné CDN, žádná analytika. `npm test` to kontroluje.
- Po změně seznamu souborů v `sw.js` zvyš `VERSION`, jinak si prohlížeč drží starou sadu.
- Po změně `icons/icon.svg` překresli i `android/.../ic_launcher_foreground.xml` – je to druhá kopie téže kresby.
- Nepřidávej build ani závislosti pro web, pokud to není opravdu potřeba.

## Vydání
Tag `v1.2.3` spustí workflow, který sestaví a podepíše APK a přiloží ho k vydání na GitHubu.
Do Zapstore se pak publikuje ručně přes `zsp publish`. Klíče (keystore, `nsec`) nepatří
do repozitáře ani do rukou agenta – viz [docs/zapstore.md](docs/zapstore.md).

## Nápady na rozšíření
- Přepínač jednotek (mph / min na míli).
- Režim „tempo pro běžce“ (zadání min/km → rychlost).
- Zvuk motoru podle otáček (spustit až po kliknutí).
- Sdílení aktuální rychlosti přes `#hash` v URL.
