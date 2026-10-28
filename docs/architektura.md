# Architektura

## Co to je

Jedna statická stránka. Žádný framework, žádný bundler, žádný server. Soubory se otevřou tak,
jak leží – v prohlížeči, nebo zabalené uvnitř Android aplikace. Build existuje jen kvůli APK;
web samotný se nesestavuje.

## Soubory

```
index.html              kostra stránky
src/styles.css          vzhled, všechny barvy jsou CSS proměnné
src/i18n.js             všechny texty (CZ / EN / ES) v window.TK_TEXTS
src/app.js              veškerá logika
src/fonts/              Chakra Petch a Barlow ve woff2 + fonts.css
sw.js                   servisní worker pro běh bez sítě
manifest.webmanifest    aby šla stránka nainstalovat jako aplikace
icons/                  ikony aplikace (zdroj je icon.svg)
tests/check.mjs         kontroly, které běží bez prohlížeče
scripts/build-www.mjs   poskládá www/ pro APK
android/                projekt Capacitoru, generovaný, ale ručně doladěný
```

`src/app.js` je celý v jedné IIFE, nic nevystrkuje do globálního prostoru. Čte jediné cizí
jméno – `window.TK_TEXTS` z `i18n.js`.

## Fyzika

Celá aplikace stojí na jednom vztahu:

```
čas na 1 km [s] = 3600 / rychlost [km/h]
metry za sekundu = rychlost / 3,6
```

V grafu se počítá v minutách, tedy `t = 60 / v`. Je to hyperbola, a právě to je pointa celé
aplikace: rozdíl mezi 10 a 20 km/h jsou tři minuty na kilometr, rozdíl mezi 100 a 110 km/h
jsou tři sekundy.

## Tachometr

SVG se celé generuje v `app.js`, v HTML je jen prázdný `<svg id="gauge">`.

| Konstanta | Význam |
|---|---|
| `MAX` | horní hranice stupnice, 200 km/h |
| `A0` | úhel nuly ve stupních, 135° |
| `SWEEP` | kolik stupňů stupnice zabere, 270° |
| `CX`, `CY` | střed ciferníku v souřadnicích SVG |
| `R` | poloměr hlavní stupnice |
| `RIM` | poloměr vnější obruče (`R + 48`) |

`pt(rychlost, poloměr)` vrací souřadnice bodu na stupnici, `arc(od, do, poloměr)` vrací
`d` pro oblouk. Když se mění `RIM`, musí se s ním změnit i `viewBox` v `index.html` –
jinak se obruč ořízne.

Vnitřní stupnice je v km/h, vnější modrá v čase na kilometr (6:00 až 0:20). Obě ukazují
tutéž ručičku, jen jinak popsanou. O to tu jde.

## Smyčka

`loop()` běží přes `requestAnimationFrame` pořád, ale skoro vždy nic nedělá:

1. Když je sešlápnutý plyn nebo brzda, mění `v` o pevné zrychlení za sekundu.
2. Jinak, když je nastavený `target` (kliknutá předvolba), plynule k němu dojede.
3. `render()` překresluje jen při změně celého km/h nebo jazyka – uvnitř je `if(r===lastR&&lang===lastLang)return`.
   Před touto podmínkou je jen ručička a ukazatel na modré stupnici, ty se hýbou plynule.
4. `drawRun()` posouvá autíčko. Volá se při jízdě a při každé změně rychlosti, aby čas do cíle
   neukazoval starou hodnotu.

## Vzhled

Barvy jsou CSS proměnné na `:root`. Tmavé hodnoty jsou **dvakrát**: v
`@media (prefers-color-scheme: dark)` pro automatický režim a v `:root[data-theme="dark"]`
pro ruční volbu. Novou barvu je potřeba přidat do všech tří bloků, jinak jeden z režimů
zůstane pozadu.

Prvky v SVG berou barvu přes `style="fill:var(--…)"`, takže se přepnou samy. Pevná barva
v SVG je chyba – v druhém vzhledu zmizí.

## Jazyky

`src/i18n.js` má objekty `cs`, `en`, `es` se **stejnými klíči** (hlídá to `tests/check.mjs`).
Prvky s `data-i="klic"` se plní přes `innerHTML`, takže text smí obsahovat `<span>`.

Texty nejsou doslovné překlady. Předvolby rychlostí odpovídají místním limitům (česká dálnice
130, britská motorway 120) a dlouhá trasa v tabulce je pro každý jazyk jiná.

## Co se ukládá

Jen dvě položky v `localStorage`: `tk-lang` a `tk-theme`. Nic jiného aplikace neukládá
a nikam nic neposílá. Přístup je vždy přes objekt `store`, který má `try/catch` – v soukromém
okně nebo při zakázaných datech `localStorage` vyhodí výjimku a aplikace musí jet dál.

## Běh bez sítě

`sw.js` ukládá celou aplikaci do cache. Kód a styly se berou **nejdřív ze sítě**, aby po
vydání nové verze nikdo nezůstal viset na staré; písma a ikony, které se nemění, jdou z cache.
Bez připojení se vždy sáhne do cache.

Po změně seznamu souborů v `SHELL` je potřeba zvýšit `VERSION`, jinak si prohlížeč drží
starou sadu. Uvnitř APK se servisní worker nepoužívá – soubory tam leží lokálně a jen by
překážel, takže ho `scripts/build-www.mjs` z `index.html` vyhazuje.
