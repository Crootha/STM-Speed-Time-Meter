# Tachometr kilometru

Interaktivní webová aplikace, která ukazuje vztah rychlosti a času na ujetí 1 km.
Čistý HTML + CSS + JavaScript. Žádný build, žádný framework a žádné závislosti kromě Google Fonts.

## Spuštění
- Otevři `index.html` v prohlížeči, nebo
- `python3 -m http.server 8000` a jdi na http://localhost:8000

## Struktura
```
index.html        – kostra stránky (hlavička, tachometr, graf, jízda, tabulka)
src/styles.css    – vzhled; všechny barvy jsou CSS proměnné (tokeny)
src/i18n.js       – všechny texty v CZ / EN / ES (window.TK_TEXTS)
src/app.js        – logika: kreslení SVG, ovládání, simulace, přepínání jazyka a vzhledu
```

## Jak to funguje
- **Fyzika:** čas na 1 km [s] = 3600 / rychlost [km/h]; metry za sekundu = rychlost / 3,6.
- **Tachometr** (`#gauge`) je SVG generované v `app.js`. Rozsah 0–200 km/h, úhel 135° + 270°.
  - Vnitřní stupnice: km/h. Vnější modrá stupnice: čas na 1 km (6:00 … 0:20).
  - Konstanty `MAX, A0, SWEEP, CX, CY, R` určují geometrii. Funkce `pt(speed, radius)` vrací souřadnice.
- **Graf** (`#curve`) ukazuje hyperbolu t = 60 / v (minuty), osa Y je oříznutá na 6 min.
- **Ovládání:** tažení ručičky, posuvník, držení pedálů Plyn/Brzda, šipky ↑/↓, předvolby (plynulý dojezd přes `target`).
- **Simulace 1 km:** skutečný čas nebo ×10. Rychlost se dá měnit i během jízdy.
- **Hlavní smyčka:** `requestAnimationFrame` v `loop()`. `render()` překresluje jen při změně celé km/h nebo jazyka.

## Témata (světlé / tmavé)
- Světlé hodnoty jsou na `:root`. Tmavé hodnoty jsou ve dvou blocích: `@media (prefers-color-scheme: dark)` a `:root[data-theme="dark"]`. **Nové barvy přidávej do všech tří bloků.**
- Přepínač Auto/Světlý/Tmavý nastavuje `data-theme` na `<html>`. Volba se ukládá do `localStorage` (`tk-theme`).
- SVG prvky berou barvy přes `style="fill:var(--…)"`, takže reagují na změnu tématu. Nepoužívej pevné barvy.

## Jazyky
- `src/i18n.js` obsahuje objekty `cs`, `en`, `es`. Všechny musí mít **stejné klíče**.
- Prvky s `data-i="klic"` se plní automaticky (přes innerHTML, takže lze použít i `<span>`).
- Texty jsou psané přirozeně pro každý jazyk, nejsou to doslovné překlady. Příklady jsou lokalizované: trasa (Praha → Brno, London → Manchester, Madrid → Zaragoza) i předvolby rychlostí podle místních limitů.
- Výchozí jazyk se bere z prohlížeče, záložní je angličtina. Volba se ukládá do `localStorage` (`tk-lang`).
- **Nový jazyk:** zkopíruj blok `en`, přelož ho a přidej tlačítko do `#langSeg` v `index.html`.

## Zásady pro úpravy
- Zachovej responzivitu: na šířce telefonu (~400 px) se nic nesmí posouvat do strany. Pod 900 px je layout v jednom sloupci.
- Číselné údaje mají `font-variant-numeric: tabular-nums`.
- Respektuj `prefers-reduced-motion`. Ovládání musí jít i klávesnicí (viditelný `:focus-visible`).
- Přístup do `localStorage` vždy obal do try/catch (objekt `store` v `app.js`).
- Nepřidávej build ani závislosti, pokud to není opravdu potřeba.

## Nápady na rozšíření
- Přepínač jednotek (mph / min na míli).
- Režim „tempo pro běžce“ (zadání min/km → rychlost).
- Zvuk motoru podle otáček (spustit až po kliknutí).
- Sdílení aktuální rychlosti přes `#hash` v URL.
