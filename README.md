# 🐝 BeeManager Pro

Aplicație pentru gestionarea stupinei: stupi, inspecții, regine, recolte, tratamente, varroa, hrănire, inventar, financiar.
Funcționează pe telefon ca aplicație instalată (PWA), **inclusiv fără internet**. Datele stau doar în telefon.

---

## 📁 Structura proiectului

```
BeeManagerPro/
├── index.html            ← scheletul paginii (meniu, bara de jos, zona de conținut)
├── manifest.json         ← nume, iconiță, culori (pentru instalare pe telefon)
├── service-worker.js     ← face aplicația să meargă offline
├── css/style.css         ← tot designul
├── icons/                ← iconițele aplicației
├── lib/                  ← biblioteci (grafice, iconițe Font Awesome)
└── js/
    ├── i18n.js           ← traducerile RO / EN
    ├── core.js           ← datele (D), salvare/încărcare, toast, confirmare, helperi
    ├── weather.js        ← vremea (Open-Meteo) și activitatea albinelor
    ├── nav.js            ← meniul, navigarea între pagini, ferestrele (modal)
    ├── dashboard.js      ← Dashboard
    ├── hives.js          ← Stupi (inclusiv regina stupului)
    ├── inspections.js    ← formularul de inspecție (afișat din Stupi)
    ├── queens.js         ← Regine (meniu separat, dezactivat — vezi hives.js)
    ├── honey.js          ← Recoltă miere
    ├── treatments.js     ← formularul de tratament (scop: varroa / altul)
    ├── treatvarroa.js    ← pagina „Tratamente” (taburi), eficiență, numărătoarea din inspecție
    ├── inventory.js      ← Inventar
    ├── pastorage.js      ← Pastorare
    ├── calendar.js       ← Calendar
    ├── analytics.js      ← Analize
    ├── settings.js       ← Setări
    ├── calculator.js     ← Calculator apicol (meniu dezactivat — vezi devcalc.js)
    ├── devcalc.js        ← calcule regină / albine noi, din inspecție → pe cardul stupului
    ├── nucs.js           ← 🐝 roiuri (înmulțire) + 🌳 genealogie (linii, clasament, oprire ramură)
    ├── feeding.js        ← Hrănire
    ├── tasks.js          ← Sarcini
    ├── varroa.js         ← numărători varroa, legătura cu tratamentele, faze înainte/în timpul/după
    ├── finance.js        ← Financiar + vânzare miere
    ├── export.js         ← backup JSON: Google Drive, telefon, import
    ├── app.js            ← pornirea aplicației
    └── pwa.js            ← înregistrarea pentru offline / instalare
```

Ordinea scripturilor din `index.html` contează: `i18n → core → config → weather → nav → module → export → app`.

### 💊 Tratamente (cu Varroa)

Un singur modul, cu 2 taburi: **💊 În curs & planificate** · **✅ Încheiate · eficiență** (cele încheiate, cu ✏️ / 🗑️, comparația pe produse și rezultatele pe stup). Tabul *Numărători* și butoanele de numărătoare au fost scoase de aici — numărătorile se fac din inspecție sau cu ➕ Numără de pe cardul stupului.
- Tratamentul are un **scop** (🕷️ Varroa / alt scop). La cele pentru varroa apar numărătorile.
- Numărătoarea se leagă automat de tratament; faza (⏮️ înainte / 💊 în timpul / ✅ după) se calculează din date.
- Se numără din: **inspecție** (secțiunea apare doar cu tratament de varroa în curs), butonul **➕ Numără** de pe cardul stupului, sau pagina de tratamente.
- **Încheiere**: din inspecție (✅ S-a terminat azi — acest stup / toți stupii) sau din Tratamente (✅ Încheie azi). Se poate anula din formularul tratamentului.
- **Planificare**: din Tratamente (pe termen lung) sau rapid din inspecție (🗓️ Planifică un tratament). Pe cardul stupului apare doar în ultimele 7 zile, cu roșu.
- **Eficiență**: total acarieni căzuți în tratament + reducere estimată (o numărătoare înainte și una după).

### 🐝 Roiuri și 🌳 Genealogie (`js/nucs.js`)

- **🐝 Roi nou** (pe pagina Stupi, pe cardul stupului donator sau din Genealogie): din stup donator (rame puiet + mâncare luate — se scad automat din donator; ouă / larve / căpăcit / botcă) sau **roi găsit** (origine necunoscută). Calculează când iese regina, împerecherea, ponta și albinele noi.
- Pagina Stupi are 2 taburi: **🏠 Stupi** și **🐝 Roiuri** (cu ⚠️ când un roi cere atenție). Roiurile au card mic (cutie de 6 rame), **fără avertizarea de inspecție săptămânală**, și fără magazii în inspecție.
- Când inspecția confirmă **regina împerecheată** → „Roiul devine stup?” (și buton ⬆️ Stup). **❌** = roi eșuat / unit cu alt stup (ramele se adaugă la acel stup); rămâne în genealogie ca ramură închisă.
- **Genealogie v3 — pe REGINE** (meniu separat): fiecare nod e o regină (stupul ei + perioada, ex. `#1 '24–'26`). Numerele stupilor nu se schimbă: când un stup primește o regină cumpărată / din import pornește o **linie nouă**, iar fiicele reginei vechi rămân în linia ei. Schimbarea naturală în stup = fiica reginei de dinainte. Linii colorate, grafic pe generații, fișa reginei (drumul liniei, perioada, nota pe ani, fiice, alte regine din același stup, ⛔ oprește ramura).
- **🧬 Codul liniei: RASĂ-NNN** (ex. `CPT-001`), același pentru toate generațiile liniei; generația apare lângă cod (`CPT-001 G2` = nepoata reginei de la început). Coduri: CPT Carpatica · BUK Buckfast · ITA Italiana · CAR Carnica · CAU Caucaziana · NEC necunoscută (roi găsit / rasă nenotată) · ALT altă rasă. Numerotarea e pe rasă, în ordinea în care au apărut liniile, și rămâne fixă (`lineCode` pe regina de la începutul liniei). Fiica primește rasa mamei. Codul apare pe cardul stupului, la roi, la alegerea donatorului, în clasament, arbore și fișă.
- **⭐ Nota reginei (1–100) pe fiecare an**, din inspecțiile cât a stat în stup: 🍯 miere 40% (vârful de rame căpăcite în magazii, față de cel mai bun din același an) · 😊 blândețe 20% · 🐝 roire 20% (% inspecții cu botci) · ❄️ iernare 20% (rame cu albine la intrarea în iarnă — câmp nou în inspecție: *❄️ Evaluare de iernare*). Ponderile: `SCORE_W` în `js/config.js`. Nota apare și pe cardul stupului, lângă regină.
- În formularul stupului, regina are *📅 Introdusă în stup pe* și originea nouă *Schimbare naturală (în stup)*. *v1 / v2 (arbore pe stupi) sunt în arhivele genealogie_v1 / v2.*
- Statistici din inspecțiile ca stup: agresivitate medie, roire = % inspecții cu botci, miere = vârful de rame căpăcite în magazii pe an (medie pe ani) față de cel mai bun stup (100%).

### 🚚 Pastorare (`js/pastorage.js`)

- **🚚 Plec în pastorare**: bifezi stupii (sau „Toți”), locația (scrisă o dată, apoi aleasă din listă), culesul, data plecării și întoarcerea aproximativă.
- Cât timp e plecat, stupul apare în **Stupi** doar ca bandă mică („🚚 în pastorare · Lunca · 10 zile” → te duce în Pastorare). **Cardul complet** (inspecții, ✏️, 🐝) e în pagina **Pastorare**, sub deplasarea lui, cu **★ stiva de magazii pe % căpăcit**.
- Inspecțiile făcute cât e plecat se salvează cu locația (🚚 în istoricul inspecțiilor).
- **🏁 Întoarcere acasă…**: bifezi stupii care vin acasă (ceilalți rămân la cules) sau toți. Deplasările încheiate rămân în istoric.

### 📅 Calendar cules (`js/calendar.js` + baza de date `js/plants.js`)

- Folosește data și locația telefonului (decalaj ~4 zile / grad de latitudine față de câmpia de referință 45,5°N — neschimbat).
- **🌼 Culesul principal acum** (rapiță, salcâm, tei, floarea-soarelui): faza (început / 💯 nectar maxim / spre final), bara înfloririi cu ziua de azi, zile rămase, nectar / polen, kg/ha, activitatea după vreme.
- **🌸 3 culesuri secundare posibile** (întâi cele ★ prioritare: pomi, prun, cireș, gutui, trifoi, facelie, mentă, lavandă, aromatice), plus „toate plantele în floare acum”.
- **⏭️ Urmează** — culesurile principale următoare; **📅 Calendarul anului** — bare pe 12 luni (principale / + prioritare / toate cele 52 de plante).
- **👀 Ce vezi pe teren**: butonul *Am văzut înflorit* (sau 👀 lângă fiecare plantă) — alegi planta, *🌱 primele flori* sau *💯 plină floare*, data. Calendarul se ajustează:
  - planta văzută se mută exact după observație; celelalte după observațiile apropiate în timp (pondere e^(−zile/45), cu o „ancoră” 0,35 spre calendar) — ex. rapița cu 13 zile mai devreme → salcâmul ~8, teiul ~6, floarea-soarelui ~5 zile mai devreme;
  - pornește de la media anilor trecuți din zona ta (anii recenți contează mai mult);
  - observațiile țin de zonă (raza 30 km față de locul unde ești) — în pastorare în altă zonă nu se amestecă.
  Pe fiecare plantă apare ↻ / 👀 ±zile. Logica: `plAdjModel` în `js/plants.js`.
- Baza de date: 52 de plante melifere din România, verificate cu surse (doar plante care dau nectar și polen pentru miere) (inclusiv zona Timiș / Banat: amorfă, sulfină, salcâm japonez, splinuță, salcie de luncă…), cu înflorire, perioada de nectar maxim, valoare nectar / polen, kg/ha și unde se găsesc.

### 🍬 Hrănire (perioade)

O hrănire e o perioadă: **🗓️ planificată → ▶ pornită → ⏹️ oprită** (`js/feeding.js`).
- **Din inspecție** (secțiunea 🍬 Hrănire): ▶ *Am început o hrănire azi* · ➕ *Am mai pus mâncare* · ⏹️ *S-a terminat mâncarea – opresc hrănirea* (acest stup / toți) · ▶ *Am hrănit azi* la una planificată · 🗓️ *Planifică o hrănire* (tip + dată, acest stup / toți). La editarea inspecției se reface corect ce s-a bifat / debifat.
- **Din pagina Hrănire**: secțiunile *În curs* (⏹️ Oprește, ➕ Am mai pus, ✏️) și *Planificate* (▶ Am hrănit), plus **⏹️ Oprește hrănirea…** — bifezi stupii sau „Toți stupii”. Hrănirea nouă se face pe stupii bifați.
- **Pe cardul stupului**: „Sub hrănire · tip · total” cu ⏹️ Oprește, și „Hrănire planificată” (mereu, roșie din ziua planificată) cu ▶ Am hrănit.
- Hrănirile vechi (dinainte de 26.10.2026) rămân „în curs” `FEED_ACTIVE_DAYS` zile (`js/config.js`), ca înainte.

### 🔍 Inspecția — magazii, tratament, sănătate

- **📦 Magazii**: fiecare magazie separat (sus → jos), cu: rame − / +, **% căpăcit** (0–100), ▲▼ mutare, ➖ Scoate (cu ↺ Pune înapoi), ➕ Adaugă magazie. Jos apare ce s-a schimbat azi și situația după inspecție. Pe cardul stupului, în iconița din colț, fiecare magazie e colorată după procentul căpăcit (galben deschis → chihlimbar la 100%).
- **💊 Tratament în curs**: doar „Tratament varroa · ziua X/Y” (detaliile sunt în modulul Tratamente), numărătoarea varroa în același card și butonul mare **✅ Tratamentul s-a terminat azi**.
- **Sănătate**: se vede doar starea stupului — *✅ Sănătos* sau afecțiunea tratată acum (*· sub tratament*). Lista completă se deschide cu *🔎 Am observat ceva*. O afecțiune nouă (fără tratament în curs) afișează *🗓️ Planifică tratament* → se deschide planificarea din secțiunea Tratament cu scopul (Varroa / alt scop) și afecțiunea completate. *Sănătos* și celelalte se exclud.

### ★ Modulul de procente căpăcire (păstrat pentru Pastorare)

Stiva de magazii cu bare colorate după % căpăcit (M3 / M2 / M1 + rame) a fost scoasă de pe cardul stupului, dar **codul e păstrat**: funcția `hvMagsHTML(stup)` din `js/hives.js` + stilurile `.hv-mgs` / `.hv-mg*` din `css/style.css`. Folosit acum în modulul **Pastorare** (cardurile stupilor plecați).

### 📅 Calcule de dezvoltare (în inspecție)

- **Botci** → „Ce faci cu botcile?”: 👑 *Le las să se matureze* (regina iese / împerechere / verifică ponta) sau ✂️ *Le-am eliminat* (verifică din nou peste 7 zile).
- **Starea mătcii** → bifa *Puiet căpăcit* + *📅 Calculează când ies albinele noi* (din ouă / larve / căpăcit).
- Rezultatele apar pe cardul stupului doar cât timp sunt valabile.

### ☰ Ordinea meniului

Se alege din aplicație: **Setări → ☰ Ordinea meniului** (drag & drop pe ☰ sau săgețile ▲▼).
Aplicația pornește pe primul meniu; pe telefon primele 4 apar în bara de jos. Ordinea se salvează cu datele (intră în backup).

### ⚙️ Module dezactivate (`js/config.js`)

Momentan sunt **ascunse**: Financiar, Analize, Inventar, Recoltă miere, Dashboard, Regine, Inspecții, Varroa, Calcule Apicole (din 23.10.2026), Sarcini (din 26.10.2026).
**Regine** nu e pierdut: e integrat în **Stupi** (secțiunea 👑 Regina din formularul stupului, cu înlocuire și istoric).
**Inspecții** e integrat tot în **Stupi**: butonul 🔍 Inspecție de pe card + câmpul 📋 Inspecții (istoricul stupului), iar alerta pentru stupi neinspectați apare sus pe pagina Stupi.
Aplicația pornește pe primul meniu activ (acum **Stupi**).
Nu apar în meniu, pe Dashboard, în Setări sau în formularul de Hrănire.
Codul lor și datele deja salvate rămân neatinse.

Ca să readuci un modul, scoate-l din lista din `js/config.js`:
```js
var MODULES_OFF=["financiar","analytics","inventory","honey","dashboard","queens","inspections","varroa","calculator","sarcini"];
```

---

## 🚀 Publicare pe GitHub Pages (o singură dată)

1. Intră pe **github.com** → butonul verde **New** (repository nou).
   - Nume: de ex. `beemanager`
   - Bifează **Public** (GitHub Pages gratuit cere repository public — se vede doar *codul*, nu datele tale, care rămân în telefon).
   - Apasă **Create repository**.
2. Pe pagina repository-ului: **uploading an existing file** (sau *Add file → Upload files*).
3. Deschide folderul `BeeManagerPro` pe calculator, **selectează tot conținutul lui** (nu folderul în sine) și trage-l în pagina GitHub.
   - `index.html` trebuie să ajungă direct în rădăcina repository-ului, nu într-un subfolder.
   - Fișierul `.nojekyll` e ascuns pe unele calculatoare; nu e grav dacă nu ajunge sus.
4. Jos apasă **Commit changes**.
5. Mergi la **Settings → Pages**:
   - *Source*: **Deploy from a branch**
   - *Branch*: **main** și **/ (root)** → **Save**
6. După 1–2 minute apare adresa: `https://NUMELE-TAU.github.io/beemanager/`

## 📱 Instalare pe telefon (Android)

1. Deschide adresa de mai sus în **Chrome**.
2. Meniul ⋮ → **Instalează aplicația** (sau *Adaugă pe ecranul principal*).
3. Apare iconița 🐝 pe ecran. De acum aplicația merge și fără internet.

## 💾 Mutarea datelor din varianta veche (un singur fișier HTML)

Datele sunt legate de locul din care deschizi aplicația, așa că aplicația nouă pornește goală (fără stupi).

1. În **aplicația veche**: Setări → *Backup & Date* → **📤 Export JSON** (salvează fișierul).
2. În **aplicația nouă**: Setări → **⬇️ Încarcă JSON din fișier** → alegi fișierul → confirmi.

Fă un backup JSON din când în când (Setări → *Salvează JSON pe Drive*), mai ales înainte de schimbări mari.

---

## 🔄 Cum actualizezi aplicația după modificări

1. Pe GitHub, în repository: **Add file → Upload files** → tragi fișierele modificate (cu aceeași structură de foldere) → **Commit changes**.
2. Pe telefon: deschide aplicația **cu internet**. Primește automat ultima versiune
   (dacă nu se vede imediat, închide și redeschide aplicația).

Dacă adaugi un fișier **nou** (de ex. `js/stupina-noua.js`), adaugă-l și:
- în `index.html` (o linie `<script src="js/...">`),
- în lista `FILES` din `service-worker.js`, apoi crește versiunea `CACHE` (`beemanager-v1` → `beemanager-v2`).

## 🧪 Testare pe calculator

Aplicația are nevoie să fie servită ca site (nu deschisă cu dublu-click), altfel offline-ul nu pornește:
- **VS Code** + extensia *Live Server* → click dreapta pe `index.html` → *Open with Live Server*, sau
- în folder: `python -m http.server 8000` și deschizi `http://localhost:8000`

---

## 🤖 Mai târziu: aplicație Android

Când aplicația e finalizată:
- **PWABuilder** (pwabuilder.com): introduci adresa GitHub Pages → primești pachet Android (APK/AAB). Datele din telefon se păstrează.
- sau **Capacitor**: fișierele intră în interiorul APK-ului (merge fără site; datele se mută prin Export/Import JSON).

---

## 📝 Modificări față de fișierul original

- Cod împărțit pe module (fără schimbări de funcționalitate).
- Biblioteci locale → grafice și iconițe merg fără internet.
- PWA: instalare pe telefon + funcționare offline.
- Reparat: butoanele *Salvează JSON pe Drive* / *Încarcă JSON* (dădeau eroare); importul cere confirmare în aplicație.
- Reparat: lista *Auto-salvare per stup* din Setări era goală.
- Reparat: reginele lipseau din snapshot-ul per stup; umiditatea lipsea din PDF-ul per stup.
- Reparat: pragul de alerte inspecții — implicit 7 zile peste tot.
- Reparat: editarea unei sarcini finalizate nu mai șterge data finalizării.
- Reparat: culorile insignelor din Varroa și eticheta de categorie din Sarcini.
- Reparat: la editarea unei hrăniri, stocul se pune înapoi corect chiar dacă schimbi articolul din inventar; „polen” e recunoscut ca hrană.
- Reparat: ghilimelele sau `<` din nume/notițe nu mai strică formularele.
- La ștergerea unui stup se șterge și snapshot-ul lui local.
