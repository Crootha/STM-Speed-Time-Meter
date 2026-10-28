# Vývoj

## Spuštění

```bash
python3 -m http.server 8000     # http://localhost:8000
```

Dá se otevřít i `index.html` přímo ze souboru, ale přes `file://` nefunguje servisní worker
(prohlížeč ho tam nepustí) a nevyzkouší se tak běh bez sítě. Na všechno ostatní to stačí.

## Kontroly

```bash
npm test
```

`tests/check.mjs` běží bez prohlížeče a hlídá to, co se při úpravách nejsnáz rozbije:

- všechny tři jazyky mají stejné klíče,
- `who` má v každém jazyce devět hlášek (tolik jich `whoIdx` umí vrátit),
- každý `data-i` v HTML má překlad,
- v kódu není žádný odkaz na cizí server,
- soubory, na které se odkazuje HTML, servisní worker a manifest, opravdu existují,
- `3600 / rychlost` dává správný čas na kilometr.

Totéž běží na GitHubu při každém pushi (`.github/workflows/ci.yml`).

Co kontroly nezachytí: jestli to vypadá dobře a jestli se dá tachometrem táhnout. To je
potřeba otevřít a zkusit, a to i na šířce telefonu.

## Přidání jazyka

1. V `src/i18n.js` zkopíruj blok `en` a přelož ho. Klíče musí zůstat stejné.
2. Předvolby a trasu v `dists` přizpůsob zemi, nepřekládej doslova britské míle.
3. Do `#langSeg` v `index.html` přidej `<button type="button" data-lang="xx">XX</button>`.
4. `npm test`.

Pokud jazyk potřebuje znaky mimo latin a latin-ext, je potřeba stáhnout i odpovídající
podmnožiny písem – viz níže.

## Písma

V `src/fonts/` leží Chakra Petch a Barlow ve woff2, podmnožiny latin a latin-ext (latin-ext
je nutná pro češtinu). Aplikace nesmí sahat na Google Fonts – kvůli běhu bez sítě uvnitř APK
i kvůli tomu, že by to posílalo IP adresu každého návštěvníka třetí straně. Hlídá to `npm test`.

Nové řezy se stahují stejně, jako vznikly tyhle: vzít CSS z `fonts.googleapis.com` s hlavičkou
moderního prohlížeče, vytáhnout z něj URL woff2 pro latin a latin-ext, stáhnout je do
`src/fonts/` a doplnit `@font-face` do `src/fonts/fonts.css` i s původním `unicode-range`.

## Barvy

Všechny jsou v `src/styles.css` jako proměnné. Novou barvu přidej do **tří** bloků:
`:root`, `@media (prefers-color-scheme: dark)` a `:root[data-theme="dark"]`. Když se na jeden
zapomene, jeden ze tří režimů přepínače bude vypadat špatně.

## Ikony

Zdroj je `icons/icon.svg`. Z něj vznikly:

- `icons/icon-512.png`, `-192`, `-180` a `favicon.ico` pro web,
- `icons/icon-maskable*.png` pro instalovanou webovou aplikaci,
- `android/app/src/main/res/drawable/ic_launcher_foreground.xml` – ta samá kresba přepsaná
  ručně do Android VectorDrawable, aby launcher ikona byla vektor,
- `android/app/src/main/res/mipmap-*/ic_launcher*.png` pro Android starší než 8.

PNG se rastrovaly přes prohlížeč, ne přes ImageMagick – ten má vlastní vykreslovač SVG
a oblouky s `stroke-linecap` zkazí. Po změně `icon.svg` je potřeba překreslit i VectorDrawable;
jsou to dvě nezávislé kopie téže kresby.

## Na co si dát pozor

- Na šířce telefonu (~390 px) se nesmí nic posouvat do strany. Pod 900 px je layout v jednom sloupci.
- Číselné údaje mají `font-variant-numeric: tabular-nums`, jinak čísla při přepočtu poskakují.
- Ovládání musí jít i klávesnicí a `:focus-visible` musí být vidět.
- `prefers-reduced-motion` vypíná přechody.
- `localStorage` vždy přes objekt `store` s `try/catch`.
- Žádný build a žádná závislost pro web. Capacitor je jen kvůli APK a web o něm neví.
