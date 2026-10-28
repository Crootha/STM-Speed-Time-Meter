# Android

APK je tentýž web zabalený do WebView přes [Capacitor](https://capacitorjs.com/). Soubory
leží uvnitř aplikace, takže funguje bez připojení a nikam se nepřipojuje.

| | |
|---|---|
| Identifikátor balíčku | `io.github.crootha.stm` |
| Název v launcheru | Speed Time Meter, česky *Tachometr kilometru*, španělsky *Velocímetro del kilómetro* |
| Minimální Android | podle výchozího nastavení Capacitoru 7 |

**Identifikátor balíčku se po prvním vydání nedá změnit.** Zapstore i Android podle něj
poznávají aplikaci. Pokud se má jmenovat jinak, je potřeba to udělat teď: `capacitor.config.json`,
`android/app/build.gradle` (`namespace`, `applicationId`) a `android/app/src/main/res/values/strings.xml`.

## Sestavení

```bash
npm ci
npm run sync          # poskládá www/ a nasype ho do androidu
cd android && ./gradlew assembleRelease
```

K tomu je potřeba JDK 21 a Android SDK. Na tomhle stroji nejsou, proto se APK normálně
sestavuje na GitHubu.

`npm run build` jen poskládá `www/`. Je to kopie webu bez `node_modules`, bez `android/`
a bez registrace servisního workeru – uvnitř APK by jen držel starou verzi souborů.

## Vydání přes GitHub Actions

`.github/workflows/release-android.yml` se spustí na tagu `v*`:

```bash
npm version 1.0.1 --no-git-tag-version   # upraví package.json
# doplň sekci do CHANGELOG.md
git commit -am "Vydání 1.0.1" && git tag v1.0.1
git push && git push --tags
```

Workflow z tagu odvodí `versionName` (`1.0.1`) i `versionCode` (`10101`, tedy
`major*10000 + minor*100 + patch`). **Zapstore nepřijme vydání s `versionCode`, který není
vyšší než ten předchozí.** Při jiném schématu číslování je potřeba upravit výpočet v kroku
*Určit verzi*.

Hotové APK se objeví jako příloha vydání na GitHubu, spolu se souborem `.sha256`.

## Podpisový klíč

Bez klíče workflow doběhne, ale vyrobí **nepodepsané** APK, které nejde nainstalovat ani
zveřejnit. Klíč v repozitáři být nesmí; `.gitignore` proto blokuje `*.jks` a `*.keystore`.

Klíč si vyrob sám, jednou, a zálohuj ho. Když se ztratí, nejdou vydávat aktualizace –
Android nepustí aktualizaci podepsanou jiným klíčem:

```bash
keytool -genkey -v -keystore stm-release.jks -keyalg RSA -keysize 4096 \
        -validity 10000 -alias stm
base64 -w0 stm-release.jks        # tohle vlož do tajemství na GitHubu
```

Do *Settings → Secrets and variables → Actions* přidej:

| Tajemství | Obsah |
|---|---|
| `ANDROID_KEYSTORE_BASE64` | výstup příkazu `base64 -w0` |
| `ANDROID_KEYSTORE_PASSWORD` | heslo ke keystoru |
| `ANDROID_KEY_ALIAS` | `stm` |
| `ANDROID_KEY_PASSWORD` | heslo ke klíči |

Build je čte z prostředí (`android/app/build.gradle`), nikde se nezapisují na disk mimo
dočasnou složku běhu.

## Ikony a úvodní obrazovka

Launcher ikona je adaptivní: pozadí je barva `#0b1018`, popředí vektor
`drawable/ic_launcher_foreground.xml`. Je tam i `monochrome` varianta pro motivované ikony
na Androidu 13 a novějším. Úvodní obrazovky v `drawable-*/splash.png` jsou ikona na tmavém
pozadí, aby při startu neproblesklo bílé pole.

Složka `android/` je vygenerovaná Capacitorem, ale **ručně doladěná** (ikony, názvy, verze,
podepisování). `npx cap sync` je přepsat nemá, nicméně po aktualizaci Capacitoru stojí za to
se na změny v ní podívat.
