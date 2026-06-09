# 🐝 BeeManager Pro

**Aplicație completă de management apicol** — offline-first, fișier unic HTML, fără server, fără abonament.

---

## Cuprins

1. [Descriere generală](#descriere-generală)
2. [Instalare și rulare](#instalare-și-rulare)
3. [Module și funcționalități](#module-și-funcționalități)
4. [Date și stocare](#date-și-stocare)
5. [Backup și export](#backup-și-export)
6. [Setări](#setări)
7. [Dependențe externe](#dependențe-externe)
8. [Arhitectură tehnică](#arhitectură-tehnică)
9. [Note apicole](#note-apicole)

---

## Descriere generală

BeeManager Pro este o aplicație web single-page (SPA) complet autonomă — un singur fișier `index.html` de ~330 KB care rulează direct în browser sau împachetat ca APK Android prin Capacitor. Nu necesită server, bază de date externă sau conexiune permanentă la internet.

**Caracteristici principale:**
- 100% offline după prima încărcare
- Bilingv: Română / English (comutare live din setări)
- Temă dark/light
- Optimizată pentru mobile (Android APK sau browser mobil)
- Date stocate local în browser (localStorage), nu în cloud
- Export backup JSON, Excel multi-sheet și PDF

---

## Instalare și rulare

### Browser (cel mai simplu)
Deschide `index.html` direct în orice browser modern (Chrome, Firefox, Edge, Safari). Nu necesită server web.

### Android APK (prin Capacitor)
1. Pune `index.html` în folderul `www/` al unui proiect Capacitor
2. Rulează `npx cap build android`
3. Deschide în Android Studio și generează APK

### PWA (Progressive Web App)
Aplicația poate fi adăugată pe ecranul principal al telefonului direct din browser (Chrome → Adaugă pe ecranul principal).

---

## Module și funcționalități

### 📊 Dashboard
Pagina principală cu vedere de ansamblu:
- **Card meteo live** — temperatură, vânt, umiditate, precipitații din locația GPS (API open-meteo.com, gratuit)
- **Răsărit / Apus** — calculat astronomic bazat pe latitudine și zi calendaristică (eroare < 10 min)
- **Activitate albine** — stare în timp real: activ 🐝🐝🐝 / rece 🥶 / vânt 💨 / ploaie 🌧️ / **noapte 🌙** (noaptea nu se afișează cules activ — albinele se odihnesc)
- **Sezon cules activ** — plantă curentă cu zilele rămase
- **Tratamente active** — countdown per produs cu bară de progres
- **Alerte stoc scăzut** — inventar sub pragul minim
- **Alerte Varroa** — stupi cu infestare critică
- **Sarcini scadente** — taskuri cu termen depășit
- **KPI financiar** — venituri / cheltuieli / profit anul curent
- **Pastorare activă** — deplasări în curs
- **Rezumat colonii** — distribuție puternic / mediu / slab

---

### 🏠 Stupi (Hive Management)
Registrul complet al stupilor:
- Număr, nume, locație, material (lemn / polistiren / plastic), model (Dadant, Langstroth etc.)
- Număr rame total, rame puiet, rame miere, magazie
- Forță colonie (puternic / mediu / slab) calculată automat din numărul de rame
- Culoare vizuală per stup (cod color personalizabil)
- Notițe libere
- **Snapshot per stup** — salvare individuală stup + inspecții în localStorage (backup redundant)
- Căutare rapidă după nume
- Export PDF per stup cu istoricul inspecțiilor

---

### 👑 Regine (Queen Management)
Evidența reginelor:
- Asociere cu stupul
- Anul nașterii, rasa (Buckfast, Carniolan, Italiană etc.)
- Status: activă / în imperechere / pensionată / pierdută
- Indicatori: ouare (1-5), agresivitate (1-5)
- Origine (cumpărată / proprie / nucleu) și linie genetică
- Vârstă calculată automat, alertă vizuală regine vechi (> 2 ani)

---

### 📋 Inspecții (Hive Inspections)
Jurnal detaliat de inspecție:
- Asociere cu stupul și data
- Condiții: vreme, temperatură
- Evaluare colonie: rame puiet, rame miere, forță
- Prezență regină, celule de schimb, boli observate
- Activitate la urdiniș (1-5)
- Notițe libere
- **Inspecție post-tratament** — legată de un tratament specific, cu înregistrarea eficacității observate
- **Export PDF** — raport formatat per inspecție
- **Export XLS** — tabel cu toate datele inspecției
- Alertă automată dacă un stup nu a fost inspectat de N zile (configurabil din Setări)

---

### 🍯 Recoltă Miere (Honey Harvest)
Evidența producției:
- Per stup sau la nivel de stupină
- Data recoltei, cantitate brută (kg), cantitate după procesare
- Tip miere (salcâm, tei, floarea soarelui, polifloră, mana etc.)
- Umiditate (%), număr rame extrase
- **Vânzări integrate** — înregistrare vânzări cu pachete (borcan 250g, 500g, 1kg, bidon 5kg etc.)
- **Inventar ambalaje** — stoc automat scăzut la fiecare vânzare
- Preț per kg, total încasat
- Statistici producție pe ani și per stup

---

### 🍽️ Hrănire (Feeding Journal)
Jurnal de hrănire:
- Tip hrană: sirop zahăr (1:1 / 2:1), sirop invertit, candy, polen artificial, stimulente
- Data, cantitate (litri sau kg), metoda de administrare
- Scopul hrănirii (stimulare primăvară, pregătire iarnă, anti-foame etc.)
- Notițe
- Export Excel per stup

---

### 💊 Tratamente (Treatment Management)
Modul complet pentru managementul tratamentelor Varroa și alte boli:

**Produse incluse (~51 produse):**
- Acid oxalic (vaporizare Api-Bioxal/Oxuvar, picurare, bandă OxyBee)
- Acid formic (MAQS, Formidol, FORAPI, Varromed, Apitol)
- Amitraz (Apivar, Apitraz, Klartan, Biovar, Apitik, fogger)
- Flumetrin (Bayvarol, Polyvar Yellow)
- Timol (Apiguard, ApiLife VAR, Thymovar)
- Coumaphos (Perizin, CheckMite+)
- Uleiuri esențiale, extracte vegetale
- Antibiotice (Oxitetraciclină, Fumagilină, Tylosin)
- Nutritive și stimulente

**Funcționalități:**
- **Durată recomandată automată** — fiecare produs are durata corectă conform protocoalelor oficiale (ex: Apivar = 56 zile, MAQS = 7 zile, acid oxalic picurare = aplicare unică)
- **Durată personalizată** — poți suprascrie recomandarea cu propria durată; se afișează diferența față de recomandare
- **Calcul automat data de sfârșit** — din data de start + durata efectivă
- **Descriere protocol** — scurtă notă despre cum se aplică produsul (ex: "2 benzi per colonie, 6-8 săptămâni")
- **Bară de progres** — pe cardul de tratament: zile rămase, % efectuat, dată finalizare
- **Countdown în Dashboard** — per produs activ, cu grupare inteligentă: dacă mai mulți stupi au același produs cu aceeași durată → un singur countdown cu lista stupilor; dacă produse sau durate diferite → countdown separat per grup

---

### 🕷️ Varroa Monitor
Monitorizare infestare Varroa:
- Metoda: spălare alcool (Alcohol Wash) sau cădere naturală (Natural Drop)
- Data, stupul, număr acarieni, număr albine analizate, prezența puietului
- **Calcul automat procent infestare** (pentru spălare alcool)
- **Nivel de alertă** — verde / galben / roșu cu praguri configurabile
- Durata monitorizării (24h / 48h / 72h) pentru cădere naturală
- Istoric și trend per stup
- Alertă în Dashboard pentru stupi cu infestare critică
- Export Excel

---

### 🚚 Pastorare (Migratory Beekeeping)
Evidența deplasărilor stupinei:
- Locație destinație, dată plecare, dată întoarcere (estimată)
- Plantă țintă, note
- Calculul zilelor de pastorare
- Afișare în Dashboard când deplasarea este activă

---

### 📦 Inventar (Inventory)
Gestiunea materialelor și consumabilelor:
- Denumire, categorie, cantitate, unitate de măsură
- Cantitate minimă (prag alertă stoc scăzut)
- Alertă vizuală când stocul scade sub prag
- Alertă în Dashboard pentru articole cu stoc scăzut
- Scădere automată stoc ambalaje la înregistrarea vânzărilor de miere

---

### 📅 Calendar Apicol (Bee Calendar)
Calendar sezonier și meteo integrat:
- **Culesuri active** — ce plantă curge acum, zile rămase, interval optim temperatură
- **Calitate cules** — bară de activitate curentă bazată pe temperatura și vântul actual
- **Gaugere temperatură** — cursor vizual pe intervalul optim al plantei
- **Culesuri viitoare** — următoarele 3 culesuri cu data estimată de start
- **Ajustare geografică** — datele de cules se decalează automat ±4 zile/grad față de 45.5°N (referință România centrală)
- **Banner noapte** — noaptea apare "Albinele se odihnesc" cu ora răsăritului; cardul de cules rămâne vizibil (informație calendaristică)
- **Sfaturi inter-culesuri** — recomandări de activități în perioadele fără cules
- **Timeline anual** — toate culesurile anului pe o axă vizuală

**Culesuri incluse (6):**
| ID | Plantă | Perioadă aproximativă |
|---|---|---|
| sal | Salcâm | 1 mai – 25 mai |
| rap | Rapiță | 10 apr – 5 mai |
| tei | Tei | 15 iun – 5 iul |
| fls | Floarea soarelui | 28 iun – 10 aug |
| pom | Pomi fructiferi | 20 mar – 20 apr |
| pol | Polifloră | 20 mai – 30 sep |

---

### 📈 Analize (Analytics)
Rapoarte și statistici:
- Producție miere per an și per stup
- Comparații an-la-an
- Distribuție forță colonii (grafic)
- Trend Varroa per stup
- Cheltuieli vs venituri
- Export raport PDF complet

---

### 🧮 Calculator Apicol (Bee Calculator)
Calculator de biologie apicola:
- **Calculator albină lucrătoare** — din stadiul observat (ou / larvă / căpăcit / adult) calculează data nașterii și toate datele de dezvoltare
- **Calculator regină** — din ouă sau larvă calculează data căpăcirii, ecloziunii și împerecherii
- Vizualizare grafică a stadiilor de dezvoltare pe o linie de timp

---

### 💰 Financiar (Financial Tracking)
Contabilitate simplificată:
- Înregistrare venituri și cheltuieli
- Categorii (miere vândută, echipament, tratamente, transport etc.)
- Data, sumă, descriere, categorie
- Sold curent, total venituri, total cheltuieli per an
- Grafic venituri vs cheltuieli
- Export Excel

---

### ✅ Sarcini (Task Manager)
Planificator de activități:
- Titlu, descriere, data scadenței, prioritate (scăzută / medie / înaltă)
- Asociere cu stup specific (opțional)
- Stare: de făcut / în lucru / finalizat
- Alertă în Dashboard pentru sarcini scadente sau depășite
- Filtrare și sortare

---

### ⚙️ Setări (Settings)
- **Limbă**: Română / English (schimbare instantanee)
- **Temă**: Dark / Light
- **Unitate temperatură**: °C / °F
- **Prag alertă inspecție**: zile fără inspecție după care apare alerta (implicit: 14 zile)
- **Auto-download inspecție**: descarcă automat PDF la salvarea inspecției
- **Vreme manuală**: introducere manuală dacă GPS/internet indisponibil
- **Backup & Date**: export JSON, import JSON, resetare completă
- **Export complet Excel**: toate datele în fișier .xlsx multi-sheet
- **Export PDF analytics**: raport grafic complet
- Info stocare (KB folosiți) și status conexiune

---

## Date și stocare

Toate datele sunt stocate în **localStorage** al browserului, sub cheia `bmp5`. Fiecare stup are și un snapshot individual (`bmp5_hive_{id}`) pentru redundanță.

### Structura datelor (`D`)
```
D = {
  hives[]          — stupi
  queens[]         — regine
  inspections[]    — inspecții
  honeyHarvests[]  — recoltă miere + vânzări
  treatments[]     — tratamente (cu endDate și customDays)
  varroa[]         — monitorizare varroa
  feedings[]       — hrăniri
  finances[]       — financiar
  tasks[]          — sarcini
  pastorage[]      — deplasări pastorare
  inventory[]      — inventar
  weather          — ultimele date meteo (cache)
  userLoc          — {lat, lon} locație GPS
  settings         — {lang, dark, tempUnit, ...}
}
```

### Limite practice
localStorage are limita de ~5 MB per domeniu. La o utilizare intensă (mai mulți ani, sute de inspecții), dimensiunea tipică este 50-500 KB — mult sub limită. Se poate verifica în Setări (afișat în KB).

---

## Backup și export

### Backup JSON (recomandat)
- **Export**: Setări → Export Backup → fișier `BeeManagerPro_backup_YYYY-MM-DD.json`
- **Import**: Setări → Import Backup → selectează fișier JSON
- Conține toate datele aplicației, poate fi restaurat pe orice dispozitiv

### Export Excel (XLSX)
- Setări → Export Excel → fișier multi-sheet cu:
  - Sheet: Stupi
  - Sheet: Inspecții
  - Sheet: Recoltă Miere
  - Sheet: Tratamente
  - Sheet: Varroa
  - Sheet: Hrănire
  - Sheet: Sarcini
  - Sheet: Financiar

### Export PDF
- Analytics → Export Raport PDF — raport grafic complet
- Inspecții → PDF — raport per inspecție
- Inspecții → XLS — tabel per inspecție

---

## Setări

| Setare | Valori | Implicit |
|---|---|---|
| Limbă | ro / en | ro |
| Temă | dark / light | dark |
| Temperatură | °C / °F | °C |
| Prag alertă inspecție | 1-30 zile | 14 |
| Auto-download PDF inspecție | da / nu | nu |

---

## Dependențe externe

Toate librăriile se încarcă din CDN la prima utilizare. Aplicația funcționează offline după aceea dacă browserul cache-uieste resursele.

| Librărie | Versiune | Scop |
|---|---|---|
| Chart.js | 4.x | Grafice (analytics, varroa) |
| html2pdf.js | 0.10.1 | Export PDF |
| SheetJS (xlsx) | 0.20.3 | Export Excel |
| Font Awesome | 6.x | Iconițe UI |
| open-meteo.com | API gratuit | Date meteo live |

**Nu există:**
- Niciun framework JavaScript (Vanilla JS pur)
- Nicio bază de date externă
- Niciun server backend
- Niciun cont sau autentificare
- Nicio taxă sau abonament

---

## Arhitectură tehnică

### Fișier unic
Întreaga aplicație este un singur fișier HTML (~330 KB) cu CSS și JavaScript inline. Nu există fișiere separate, module sau build step.

### Navigare
Aplicația folosește un sistem de navigare SPA simplu — o singură pagină cu 16 "ecrane" (module) care se randează dinamic în `<div id="P">`. Navigarea se face prin `go(moduleId)`.

### Traduceri
Sistem bilingv complet: două obiecte de traduceri `TR.ro` și `TR.en`, accesat prin funcția `t("cheie")`. Toate textele vizibile sunt traduse; comutarea limbii re-randează pagina curentă.

### Meteo și astronomie
- **Meteo**: API open-meteo.com (gratuit, fără cheie API) — date actualizate la fiecare 15 minute
- **Offline meteo**: introducere manuală disponibilă oricând
- **Răsărit/Apus**: calcul astronomic propriu (algoritm NOAA simplificat) bazat pe latitudine și dată — eroare < 10 minute față de valorile reale
- **Activitate albine**: combinație oră (răsărit±30min) + temperatură + vânt + precipitații

### Tratamente — durate apicole
Duratele tratamentelor sunt documentate conform:
- Prospectele producătorilor (EMA/EMEA)
- Ghidurile ANSVSA România
- Literatura apicolă de referință (COLOSS, Bee Health)

Durata poate fi oricând suprascrisă cu valoarea personalizată dorită.

### Calcul culesuri
Datele de cules sunt ajustate automat față de latitudinea utilizatorului: ±4 zile per grad față de 45.5°N (România centrală ca referință). Exemplu: la Cluj (46.7°N) culesul de salcâm vine cu ~5 zile mai târziu față de București (44.4°N).

---

## Note apicole

### Regula noapte / zi
Albinele culeg activ doar ziua — aproximativ între răsărit +30 minute și apus -30 minute. În afara acestui interval, aplicația afișează starea 🌙 "Albinele se odihnesc" și nu mai arată "cules activ" în dashboard, indiferent de temperatură sau sezon.

### Intervale optime temperatură pentru cules
| Plantă | Optim |
|---|---|
| Pomi fructiferi | 10 – 22°C |
| Rapiță | 12 – 25°C |
| Salcâm | 15 – 28°C |
| Tei | 20 – 32°C |
| Polifloră | 14 – 30°C |
| Floarea soarelui | 22 – 38°C |

### Praguri Varroa (infestare %)
| Nivel | Prag | Acțiune |
|---|---|---|
| 🟢 OK | < 2% | Fără tratament necesar |
| 🟡 Atenție | 2 – 3% | Monitorizare frecventă |
| 🔴 Tratament | > 3% | Tratament obligatoriu |

---

*BeeManager Pro — dezvoltat pentru apicultori, de un apicultor.*
*Fișier unic, zero costuri, total offline.*
