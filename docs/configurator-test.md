# hanter.md/test: pagina cu configurator

Pagina de prezentare și configuratorul de preț, integrate în proiectul Astro + TinaCMS.

## Ce se editează din TinaCMS (`/admin`)

| Colecție | Fișier | Ce conține |
|---|---|---|
| **Test · Configurator** | `src/content/test/configurator.json` | Telefon, adresa pentru comenzi, piele eco (preț/m, culori, poză), stratul de protecție (preț/m, culori), manopera salon și portbagaj, reducerea „fără protecție” (5/7 locuri), țările pentru telefon |
| **Test · Texte pagină** | `src/content/test/landing.json` | Toate textele: beneficii, soluția, straturile covorașului, pașii de comandă, subsolul |

Pozele materialelor stau în `public/images/materials/` și se pot schimba din Media Manager-ul Tina.

## Structura

```
src/pages/test/index.astro          pagina; pune datele în <script id="hanter-data">
src/components/test/*.astro         secțiunile paginii (TopBar, Hero, Benefits, Solution, Materials, HowTo, Configurator, FloatingPrice, PageFooter)
src/styles/test.css                 stilurile paginii
src/scripts/test/
  data.js       citește setările (Tina) + catalogul și le transformă în constante
  state.js      starea configuratorului (S) și utilitare
  catalog.js    generații, variante de tipar, motorizare, consum Hanter.md
  price.js      formula de preț
  visuals.js    desenul covorașului (SVG), mostre, texturi
  render.js     afișarea configuratorului și mesajul de comandă
  order.js      trimiterea comenzii + validarea telefonului pe țări
  main.js       evenimente și pornire
src/data/test/catalog.json          1415 modele cu tiparele furnizorului (generat, NU se editează de mână)
src/data/test/gens.json             generațiile reale (auto-data.net) + motorizări
tools/catalog/                      scriptul care generează catalog.json
apps-script/                        Google Apps Script: comenzi → Google Sheet + Telegram
```

## Formula de preț (în `price.js`, valorile în Tina)

- **Salon** = consum piele × preț/m + consum protecție × preț/m + manoperă (după mărime: sub 1,9 m / până la 2,2 m / mai mare), rotunjit la 50.
- **Fără protecție**: se scade doar o parte din plasticul cu fire (700 lei, 900 lei la 7 locuri).
- **Portbagaj** = consum piele × preț/m + manoperă (mat / lucios) + extra pe model (`fx`, ex. RAV4 full +200).
- Consumul vine din vânzări (`tools/catalog/models.json`) și din corecturi (`tools/catalog/overrides.json`).

## Actualizarea catalogului

```bash
# după ce schimbi tools/catalog/overrides.json sau models.json
python3 tools/catalog/build_catalog.py      # rescrie src/data/test/catalog.json
```

Catalogul nu e în Tina intenționat: are ~550 KB și se generează din datele furnizorului.

## Comenzile

`order.js` trimite comanda (POST `text/plain`, `no-cors`) la Google Apps Script-ul din `apps-script/Code.gs`.
Acesta adaugă un rând în foaia „Comenzi” și trimite mesaj pe Telegram. Proprietățile scriptului:
`SHEET_ID`, `TELEGRAM_TOKEN`, `TELEGRAM_CHAT_ID` (tokenul nu se pune în cod).
Adresa web app-ului e în Tina → Test · Configurator → „Adresa Google Apps Script”.

## Calcul intern

Adaugă `#intern` la adresă (`/test#intern`) ca să vezi tabelul cu consum, preț/m și manoperă.

## De făcut

- Traducerile RU/EN (acum pagina e doar în română).
- La primul build după merge, Tina Cloud trebuie să reindexeze schema (colecțiile noi `testConfigurator`, `testLanding`).

## Coduri de reducere

TinaCMS → Test · Configurator → **Coduri de reducere**: cod, tip (procent din total sau sumă fixă în lei), valoare, activ.

- Clientul scrie codul în bon (sub prețuri) sau vine pe un link cu codul: `https://strdr4605.com/hanter.md/test/?cod=TIKTOK`
- Codul din link se aplică singur și se ține minte 30 de zile în browserul clientului
- Reducerea procentuală se rotunjește la 10 lei; avansul nu se schimbă
- Codul ajunge în mesajul de comandă, în Telegram și în coloana „Cod reducere” din foaia „Comenzi” (după ce publicați versiunea nouă a Apps Script-ului)
- Codurile sunt vizibile în codul paginii: folosiți-le pentru promoții publice (TikTok), nu pentru reduceri personale secrete

## Starea comenzii (/test/comanda/)

- La trimitere, fiecare comandă primește un număr scurt (ex. `H-7K2QX`), afișat clientului cu link spre pagina de urmărire și salvat în coloana „Nr. comandă”
- Clientul scrie numărul + ultimele 4 cifre ale telefonului; pagina cere starea de la Apps Script (`doGet`), care răspunde doar cu starea, mașina și data (fără nume/telefon)
- Starea se schimbă din lista derulantă din coloana „Status” a foii „Comenzi”
- Textele pentru client: TinaCMS → Test · Configurator → **Stări comandă**. Câmpul „Text în coloana Status” trebuie să fie identic cu valoarea din tabel. „Nouă” (rânduri vechi) = primul pas
- După schimbarea scriptului: Deploy → Manage deployments → editează deployment-ul → New version (adresa rămâne aceeași)
