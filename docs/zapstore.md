# Zveřejnění v Zapstore

[Zapstore](https://zapstore.dev) rozdává **Android APK**. Webovou ani instalovatelnou webovou
aplikaci do něj dát nejde, proto je v repozitáři Capacitor – viz [android.md](android.md).
Záznam o aplikaci se nepíše na server, ale podepisuje tvým nostr klíčem a posílá na relay.

Co je potřeba mít:

1. podepsané APK přiložené k vydání na GitHubu (dělá workflow),
2. nostr klíč (`nsec`, nebo lépe bunker přes NIP-46),
3. podpisový keystore – při prvním zveřejnění se jím dokazuje, že APK a nostr identita patří k sobě.

## Klíče drž u sebe

Dokumentace Zapstore to říká naplno: keystore, jeho heslo, `nsec` ani `.env` nedávej agentovi
ani do CI, dokud nevíš, co děláš. Podepisování a průvodce si spusť sám. V tomhle repozitáři
žádný klíč není a `.gitignore` hlídá, aby se tam nedostal.

## Instalace zsp

```bash
go install github.com/zapstore/zsp/v2/cmd/zsp@latest
```

Nebo si stáhni hotovou binárku z vydání projektu `zapstore/zsp`.

## První zveřejnění

Spusť průvodce **sám**, ne přes agenta:

```bash
zsp publish --wizard
```

Průvodce projde tyhle věci:

- propojí otisk tvého podpisového certifikátu s nostr klíčem (vznikne důkaz NIP-C1) – k tomu
  potřebuje keystore,
- ověří, že `zapstore.yaml` v repozitáři obsahuje tvůj veřejný klíč. Relay si tenhle soubor
  sám stáhne z GitHubu a porovná ho; tím se schvalují noví vývojáři.

Pokud ti průvodce do `zapstore.yaml` dopíše `pubkey` nebo `metadata_sources`, nech to tam
a commitni to.

## Další vydání

```bash
export SIGN_WITH=bunker://…        # nebo nsec1…
zsp publish
```

`zsp` si podle `zapstore.yaml` najde nejnovější vydání na GitHubu, stáhne z něj APK, vytáhne
z něj název balíčku, verzi, `versionCode` a otisk certifikátu, a pošle na relay záznam
o aplikaci, o vydání a o souboru.

Odpověď `"status": "pending"` znamená hotovo – relay přijal události a dál si je kontroluje sám.
Není na co čekat a není potřeba posílat znovu.

## Co je v zapstore.yaml

```yaml
repository:     odkaz na repozitář; relay si z něj tenhle soubor stahuje
release_source: odkud brát APK – tady totéž, tedy vydání na GitHubu
release_filter: které tagy jsou vydání (^v1.2.3$)
match:          které přílohy jsou APK
name, summary, description, license, tags
icon, images:   ikona a snímky obrazovky, cesty v repozitáři
release_notes:  ./CHANGELOG.md – vezme se sekce k právě vydávané verzi
metadata_sources: []   prázdné schválně, nic se nemá dotahovat z Google Play ani F-Droidu
```

Popis a souhrn jsou anglicky, protože Zapstore je mezinárodní. Samotná aplikace se pak
přepne podle jazyka telefonu.

Pole `changelog`, `pubkey` a `communities` nemají podle dokumentace žádný efekt, nepiš je
tam ručně.

## Postup celého vydání

1. `npm test`
2. doplň sekci do `CHANGELOG.md`
3. `npm version 1.0.1 --no-git-tag-version`, commit, `git tag v1.0.1`, `git push --follow-tags`
4. počkej, až workflow *Release APK* přiloží APK k vydání
5. `zsp publish`
6. zkontroluj verzi v Zapstore

Když `zsp` odmítne vydání s tím, že `versionCode` není vyšší, je příčina skoro vždy v kroku 3 –
tag musí být vyšší verze než ta minule zveřejněná.
