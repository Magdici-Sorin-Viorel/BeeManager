// BeeManager Pro — plants.js
// 🌼 Built-in list of Romanian honey plants — pure data. All logic (state on a day, corrections from your
// observations, the user's own plants) is in js/flora.js (BM.flora).
//
// Data is for LOWLANDS (100–200 m, ~45.5°N — e.g. Western Plain / Banat, Romanian Plain).
// The calendar shifts it by your location (getLatOffset in core.js: ~4 days / degree of latitude).
// In hills / mountains bloom comes later (approx. +3–4 days per 100 m of altitude).
//
//  b  = bloom [monthStart, dayStart, monthEnd, dayEnd]
//  pk = best nectar period (the actual flow)
//  nec / pol = value for bees 0–3 (0 none · 1 poor · 2 good · 3 very good)
//  kg = approximate honey yield (kg/ha), where known
//  cat = "main" main flow · "pri" priority secondary · "sec" secondary
//  nt = good temperatures for nectar secretion (°C)
//  z  = where it grows (Timiș / Banat area is noted)
//  zn = relief where the plant matters: c = câmpie (plain) · d = deal (hills) · m = munte (mountains) → „flora mea” (flora.js)
// The dates of mountain plants are also written as for the reference plain; the altitude shift moves them where they belong.
var MELIFERE=[
  // ── MAIN FLOWS ──
  {id:"rapita",zn:"cd",n:"Rapiță",ne:"Rapeseed",lat:"Brassica napus",ic:"🟨",cat:"main",b:[4,12,5,15],pk:[4,20,5,8],nec:3,pol:3,kg:"30–80",nt:[12,25],z:"cultivată, toată țara (mult în Timiș)",dc:"Primul cules mare. Mierea cristalizează repede — extrage la timp."},
  {id:"salcam",zn:"cd",n:"Salcâm",ne:"Black locust",lat:"Robinia pseudoacacia",ic:"🌳",cat:"main",b:[5,3,5,30],pk:[5,8,5,25],nec:3,pol:1,kg:"300–1500",nt:[18,28],z:"păduri de salcâm, perdele; mult în vestul și sudul țării",dc:"Cel mai valoros cules. Durează 10–14 zile; secreția scade la frig și vânt."},
  {id:"tei",zn:"cd",n:"Tei",ne:"Linden",lat:"Tilia sp.",ic:"💛",cat:"main",b:[6,1,7,15],pk:[6,10,7,5],nec:3,pol:1,kg:"800–1200",nt:[20,30],z:"păduri de deal, parcuri, aliniamente",dc:"Tei cu frunza mare (început de iunie) → tei pucios (mijlocul lunii) → tei argintiu (sfârșit de iunie–iulie). Secretă bine după ploi calde."},
  {id:"floarea",zn:"c",n:"Floarea-soarelui",ne:"Sunflower",lat:"Helianthus annuus",ic:"🌻",cat:"main",b:[6,25,8,10],pk:[7,1,7,28],nec:2,pol:3,kg:"30–60",nt:[22,32],z:"cultivată, câmpie (Banat, Câmpia Română, Dobrogea)",dc:"Cules lung de vară. Atenție la tratamentele culturilor și la secetă."},

  // ── PRIORITY SECONDARY (fruit trees, clover, phacelia, aromatics) ──
  {id:"cais",zn:"cd",n:"Cais",ne:"Apricot",lat:"Prunus armeniaca",ic:"🍑",cat:"pri",b:[3,20,4,10],pk:[3,25,4,5],nec:2,pol:2,nt:[10,20],z:"livezi, grădini",dc:"Înflorește devreme; poate fi prins de înghețuri."},
  {id:"piersic",zn:"cd",n:"Piersic",ne:"Peach",lat:"Prunus persica",ic:"🍑",cat:"pri",b:[3,25,4,15],pk:[4,1,4,12],nec:2,pol:2,nt:[10,22],z:"livezi, grădini",dc:""},
  {id:"prun",zn:"cd",n:"Prun",ne:"Plum",lat:"Prunus domestica",ic:"🌸",cat:"pri",b:[4,1,4,25],pk:[4,5,4,20],nec:2,pol:2,nt:[10,22],z:"livezi, grădini (mult în deal)",dc:"Cules de stimulare; în livezi mari poate da și miere."},
  {id:"cires",zn:"cd",n:"Cireș",ne:"Sweet cherry",lat:"Prunus avium",ic:"🍒",cat:"pri",b:[4,5,4,25],pk:[4,8,4,20],nec:2,pol:2,nt:[10,22],z:"livezi, margini de pădure",dc:""},
  {id:"visin",zn:"cd",n:"Vișin",ne:"Sour cherry",lat:"Prunus cerasus",ic:"🍒",cat:"pri",b:[4,10,4,30],pk:[4,12,4,25],nec:2,pol:2,nt:[10,22],z:"livezi, grădini",dc:""},
  {id:"par",zn:"cd",n:"Păr",ne:"Pear",lat:"Pyrus communis",ic:"🍐",cat:"pri",b:[4,10,4,30],pk:[4,12,4,25],nec:1,pol:2,nt:[12,22],z:"livezi, grădini",dc:"Nectar puțin (zaharuri slabe), polen bun."},
  {id:"mar",zn:"cdm",n:"Măr (pomi fructiferi)",ne:"Apple (fruit trees)",lat:"Malus domestica",ic:"🍎",cat:"pri",b:[4,20,5,15],pk:[4,25,5,10],nec:2,pol:2,kg:"20–30",nt:[12,24],z:"livezi (Banat, Bistrița, Argeș, Maramureș…)",dc:"Livezile mari pot da un mic cules."},
  {id:"gutui",zn:"cd",n:"Gutui",ne:"Quince",lat:"Cydonia oblonga",ic:"🍐",cat:"pri",b:[5,1,5,25],pk:[5,5,5,20],nec:2,pol:2,nt:[14,24],z:"grădini, livezi",dc:""},
  {id:"trifoi",zn:"cdm",n:"Trifoi alb",ne:"White clover",lat:"Trifolium repens",ic:"☘️",cat:"pri",b:[5,15,9,30],pk:[6,1,7,15],nec:2,pol:2,kg:"50–100",nt:[18,30],z:"pajiști, pășuni, margini de drum",dc:"Secretă bine pe vreme caldă și umedă; reînflorește după cosit."},
  {id:"trifoih",zn:"dm",n:"Trifoi hibrid",ne:"Alsike clover",lat:"Trifolium hybridum",ic:"☘️",cat:"pri",b:[5,25,7,31],pk:[6,5,7,10],nec:2,pol:2,kg:"100–125",nt:[18,30],z:"pajiști umede, cultivat",dc:""},
  {id:"facelia",zn:"cd",n:"Facelia",ne:"Phacelia",lat:"Phacelia tanacetifolia",ic:"💜",cat:"pri",b:[5,15,9,30],pk:[6,1,7,15],nec:3,pol:2,kg:"300–1000",nt:[16,28],z:"semănată (apicultori, îngrășământ verde)",dc:"Înflorește ~6 săptămâni după semănat și ține 4–6 săptămâni — poți semăna eșalonat pentru goluri de cules."},
  {id:"lavanda",zn:"cd",n:"Lavandă (levănțică)",ne:"Lavender",lat:"Lavandula angustifolia",ic:"💜",cat:"pri",b:[6,10,7,31],pk:[6,20,7,15],nec:2,pol:1,kg:"50–100",nt:[22,32],z:"culturi (tot mai multe în vest și sud), grădini",dc:"Miere aromată; secretă la căldură."},
  {id:"menta",zn:"cd",n:"Mentă",ne:"Peppermint",lat:"Mentha piperita",ic:"🌱",cat:"pri",b:[7,1,8,31],pk:[7,10,8,15],nec:2,pol:1,kg:"100–200",nt:[20,30],z:"culturi, locuri umede (izma)",dc:"Miere cu aromă puternică."},
  {id:"salvie",zn:"cd",n:"Salvie",ne:"Sage",lat:"Salvia officinalis",ic:"🌿",cat:"pri",b:[5,15,6,30],pk:[5,25,6,20],nec:2,pol:1,kg:"100–300",nt:[18,30],z:"culturi, grădini; salvia de câmp pe pajiști",dc:"Aromatică."},
  {id:"cimbru",zn:"cdm",n:"Cimbru / cimbrișor",ne:"Thyme",lat:"Thymus sp.",ic:"🌿",cat:"pri",b:[6,1,8,31],pk:[6,15,7,31],nec:2,pol:1,nt:[20,32],z:"pajiști uscate, dealuri; cultivat",dc:"Aromatică; miere foarte apreciată."},
  {id:"coriandru",zn:"c",n:"Coriandru",ne:"Coriander",lat:"Coriandrum sativum",ic:"🌿",cat:"pri",b:[6,1,7,15],pk:[6,10,7,5],nec:2,pol:1,kg:"200–500",nt:[20,30],z:"culturi (Banat, sudul țării)",dc:"Aromatică cultivată."},
  {id:"melisa",zn:"cd",n:"Roiniță (melisă)",ne:"Lemon balm",lat:"Melissa officinalis",ic:"🍃",cat:"pri",b:[6,15,8,31],pk:[7,1,8,10],nec:2,pol:1,nt:[20,30],z:"grădini, culturi",dc:"Aromatică; atrage albinele (folosită și la capcane de roi)."},
  {id:"isop",zn:"cd",n:"Isop",ne:"Hyssop",lat:"Hyssopus officinalis",ic:"🌿",cat:"pri",b:[7,1,9,15],pk:[7,15,8,31],nec:2,pol:1,nt:[20,30],z:"grădini, culturi",dc:"Aromatică de vară târzie."},
  {id:"busuioc",zn:"cd",n:"Busuioc",ne:"Basil",lat:"Ocimum basilicum",ic:"🌿",cat:"pri",b:[7,1,9,30],pk:[7,15,8,31],nec:2,pol:1,nt:[22,32],z:"grădini, culturi",dc:"Aromatică."},

  // ── SECONDARY (other Romanian honey plants, incl. Timiș / Banat area) ──
  {id:"cornul",zn:"cd",n:"Corn",ne:"Cornelian cherry",lat:"Cornus mas",ic:"🌼",cat:"sec",b:[3,1,3,31],pk:[3,10,3,25],nec:1,pol:2,nt:[10,18],z:"păduri de deal, garduri",dc:""},
  {id:"salcie",zn:"cdm",n:"Salcie căprească",ne:"Goat willow",lat:"Salix caprea",ic:"🌿",cat:"sec",b:[3,10,4,15],pk:[3,20,4,10],nec:2,pol:3,nt:[10,18],z:"lunci, maluri de râu (Timiș, Bega, Mureș)",dc:"Foarte importantă primăvara — polen și nectar pentru dezvoltare."},
  {id:"paltinc",zn:"cd",n:"Paltin de câmp",ne:"Norway maple",lat:"Acer platanoides",ic:"🍁",cat:"sec",b:[4,1,4,25],pk:[4,5,4,20],nec:2,pol:2,nt:[10,20],z:"păduri, parcuri",dc:""},
  {id:"papadie",zn:"cdm",n:"Păpădie",ne:"Dandelion",lat:"Taraxacum officinale",ic:"🌼",cat:"sec",b:[4,1,5,20],pk:[4,10,5,5],nec:2,pol:3,kg:"~50",nt:[12,24],z:"pajiști, livezi, peste tot",dc:"Cules de dezvoltare foarte bun."},
  {id:"jugastru",zn:"cd",n:"Jugastru (arțar de câmp)",ne:"Field maple",lat:"Acer campestre",ic:"🍁",cat:"sec",b:[4,20,5,15],pk:[4,25,5,10],nec:2,pol:2,nt:[12,22],z:"păduri de câmpie, perdele",dc:""},
  {id:"artart",zn:"c",n:"Arțar tătărăsc",ne:"Tatar maple",lat:"Acer tataricum",ic:"🍁",cat:"sec",b:[4,25,5,20],pk:[5,1,5,15],nec:3,pol:2,kg:"~100",nt:[14,24],z:"perdele forestiere, câmpie (Banat)",dc:"Poate da un cules bun înainte de salcâm."},
  {id:"castans",zn:"cd",n:"Castan sălbatic",ne:"Horse chestnut",lat:"Aesculus hippocastanum",ic:"🌰",cat:"sec",b:[4,25,5,20],pk:[5,1,5,15],nec:2,pol:2,nt:[14,24],z:"parcuri, orașe",dc:""},
  {id:"paducel",zn:"cdm",n:"Păducel",ne:"Hawthorn",lat:"Crataegus monogyna",ic:"🤍",cat:"sec",b:[5,1,5,25],pk:[5,5,5,20],nec:1,pol:2,nt:[15,24],z:"tufărișuri, margini de pădure",dc:""},
  {id:"mustar",zn:"cd",n:"Muștar alb",ne:"White mustard",lat:"Sinapis alba",ic:"🟡",cat:"sec",b:[5,1,6,15],pk:[5,10,6,5],nec:2,pol:2,kg:"~100",nt:[14,26],z:"cultivat; semănat și în miriște (toamna)",dc:""},
  {id:"spar",zn:"cd",n:"Sparcetă",ne:"Sainfoin",lat:"Onobrychis viciifolia",ic:"🌺",cat:"sec",b:[5,15,6,20],pk:[5,25,6,15],nec:3,pol:2,kg:"100–400",nt:[18,28],z:"cultivată pe terenuri calcaroase",dc:"Cules foarte bun unde se cultivă."},
  {id:"amorfa",zn:"c",n:"Amorfă (salcâm mic)",ne:"False indigo",lat:"Amorpha fruticosa",ic:"🟣",cat:"sec",b:[5,25,6,30],pk:[6,1,6,25],nec:2,pol:2,kg:"~100",nt:[18,28],z:"lunci, diguri — frecventă în Banat (Timiș, Bega)",dc:"Cules bun după salcâm în zonele cu lunci."},
  {id:"gladita",zn:"c",n:"Glădiță",ne:"Honey locust",lat:"Gleditsia triacanthos",ic:"🌳",cat:"sec",b:[5,25,6,15],pk:[6,1,6,12],nec:2,pol:1,nt:[18,28],z:"aliniamente, perdele (câmpie)",dc:""},
  {id:"otetar",zn:"c",n:"Oțetar fals (cenușer)",ne:"Tree of heaven",lat:"Ailanthus altissima",ic:"🌳",cat:"sec",b:[6,5,6,30],pk:[6,10,6,25],nec:2,pol:2,nt:[20,30],z:"terenuri părăsite, orașe (mult în vest și sud)",dc:"Miere cu gust specific."},
  {id:"sulfina",zn:"cd",n:"Sulfină",ne:"Sweet clover",lat:"Melilotus officinalis / albus",ic:"🌾",cat:"sec",b:[6,1,8,31],pk:[6,15,7,31],nec:3,pol:2,kg:"200–600",nt:[20,30],z:"terenuri necultivate, margini de drum, diguri (Banat)",dc:"Una dintre cele mai bune plante de vară."},
  {id:"ghizdei",zn:"cdm",n:"Ghizdei",ne:"Bird's-foot trefoil",lat:"Lotus corniculatus",ic:"🌼",cat:"sec",b:[6,1,8,31],pk:[6,10,7,20],nec:2,pol:2,nt:[18,28],z:"pajiști",dc:""},
  {id:"lucerna",zn:"cd",n:"Lucernă",ne:"Alfalfa",lat:"Medicago sativa",ic:"🟣",cat:"sec",b:[6,1,8,31],pk:[6,15,7,31],nec:1,pol:1,kg:"25–30",nt:[22,32],z:"cultivată",dc:"Albinele o lucrează mai ales pe căldură mare."},
  {id:"echium",zn:"cd",n:"Iarba-șarpelui",ne:"Viper's bugloss",lat:"Echium vulgare",ic:"🔵",cat:"sec",b:[6,1,8,31],pk:[6,15,7,31],nec:3,pol:2,kg:"300–400",nt:[18,30],z:"terenuri uscate, margini de drum",dc:""},
  {id:"mur",zn:"cdm",n:"Mur",ne:"Blackberry",lat:"Rubus fruticosus",ic:"🫐",cat:"sec",b:[6,1,7,31],pk:[6,10,7,15],nec:2,pol:2,nt:[18,28],z:"margini de pădure, tufărișuri",dc:""},
  {id:"zmeur",zn:"dm",n:"Zmeur",ne:"Raspberry",lat:"Rubus idaeus",ic:"🫐",cat:"pri",b:[6,1,7,10],pk:[6,10,7,5],nec:3,pol:2,kg:"50–100",nt:[16,26],z:"deal și munte (nu în câmpia Timișului)",dc:"Cules bun la munte."},
  {id:"castanc",zn:"d",n:"Castan comestibil",ne:"Sweet chestnut",lat:"Castanea sativa",ic:"🌰",cat:"sec",b:[6,15,7,10],pk:[6,20,7,5],nec:2,pol:3,nt:[20,30],z:"Banatul montan (Caraș), Maramureș, Vâlcea",dc:"Miere închisă la culoare, amăruie."},
  {id:"ciulin",zn:"cdm",n:"Ciulini / scaieți",ne:"Thistles",lat:"Carduus, Cirsium sp.",ic:"🟣",cat:"sec",b:[6,15,8,31],pk:[7,1,8,15],nec:2,pol:2,nt:[20,32],z:"pășuni, terenuri părăsite",dc:""},
  {id:"dovleac",zn:"cd",n:"Dovleac",ne:"Pumpkin",lat:"Cucurbita pepo",ic:"🎃",cat:"sec",b:[6,15,8,31],pk:[7,1,8,15],nec:2,pol:3,nt:[20,30],z:"culturi, grădini",dc:""},
  {id:"pepeni",zn:"c",n:"Pepeni",ne:"Melons",lat:"Citrullus / Cucumis",ic:"🍉",cat:"sec",b:[6,15,8,15],pk:[7,1,8,5],nec:1,pol:1,nt:[22,32],z:"culturi (vest, sud)",dc:""},
  {id:"hrisca",zn:"cd",n:"Hrișcă",ne:"Buckwheat",lat:"Fagopyrum esculentum",ic:"🤍",cat:"sec",b:[7,1,8,31],pk:[7,10,8,15],nec:3,pol:2,kg:"50–100",nt:[18,28],z:"cultivată (și în cultură a doua)",dc:"Miere închisă, aromată; secretă dimineața."},
  {id:"sophora",zn:"c",n:"Salcâm japonez",ne:"Pagoda tree",lat:"Styphnolobium (Sophora) japonicum",ic:"🌳",cat:"sec",b:[7,15,8,15],pk:[7,20,8,10],nec:3,pol:2,kg:"~300",nt:[22,32],z:"aliniamente în orașe (ex. Timișoara, Arad, București)",dc:"Cules bun de vară târzie lângă orașe."},
  {id:"zburat",zn:"m",n:"Zburătoare",ne:"Fireweed",lat:"Chamerion angustifolium",ic:"🌸",cat:"pri",b:[6,15,8,1],pk:[6,25,7,20],nec:3,pol:2,kg:"~600",nt:[16,26],z:"munte (tăieturi de pădure)",dc:"Cules de munte."},
  {id:"solidago",zn:"cd",n:"Splinuță (Solidago)",ne:"Goldenrod",lat:"Solidago canadensis / gigantea",ic:"🟡",cat:"sec",b:[8,10,9,30],pk:[8,20,9,20],nec:2,pol:2,kg:"~100",nt:[18,28],z:"terenuri părăsite, lunci — răspândită în vest (Timiș)",dc:"Cules de toamnă, bun pentru rezerve."},
  {id:"mustart",zn:"cd",n:"Muștar în miriște",ne:"Stubble mustard",lat:"Sinapis alba (cultură a doua)",ic:"🟡",cat:"sec",b:[8,20,10,15],pk:[9,1,10,5],nec:2,pol:2,nt:[14,24],z:"semănat după recoltarea păioaselor",dc:"Pentru rezervele de iarnă."},
  {id:"iedera",zn:"cd",n:"Iederă",ne:"Ivy",lat:"Hedera helix",ic:"🍃",cat:"sec",b:[9,5,10,20],pk:[9,15,10,10],nec:2,pol:2,nt:[14,22],z:"păduri, ziduri, parcuri",dc:"Ultimul nectar al anului."},
  // ── EXTENDED LIST (v69): more of Romania's honey plants, with the relief where they matter ──
  // early pollen / build-up
  {id:"alun",zn:"cdm",n:"Alun",ne:"Hazel",lat:"Corylus avellana",ic:"🌰",cat:"sec",b:[2,15,3,20],pk:[2,25,3,15],nec:0,pol:3,nt:[8,16],z:"margini de pădure, garduri vii",dc:"Primul polen al anului, în zilele calde de sfârșit de iarnă."},
  {id:"arin",zn:"cd",n:"Arin",ne:"Alder",lat:"Alnus glutinosa",ic:"🌳",cat:"sec",b:[2,20,3,25],pk:[3,1,3,20],nec:0,pol:2,nt:[8,16],z:"lunci, maluri de ape",dc:"Polen timpuriu."},
  {id:"podbal",zn:"cdm",n:"Podbal",ne:"Coltsfoot",lat:"Tussilago farfara",ic:"🌼",cat:"sec",b:[3,5,4,10],pk:[3,12,4,5],nec:1,pol:2,nt:[10,18],z:"maluri, terenuri umede, taluzuri",dc:"Polen și puțin nectar la începutul primăverii."},
  {id:"plop",zn:"cd",n:"Plop",ne:"Poplar",lat:"Populus sp.",ic:"🌳",cat:"sec",b:[3,10,4,5],pk:[3,15,4,1],nec:0,pol:2,nt:[10,18],z:"lunci, aliniamente",dc:"Polen; mugurii dau propolis."},
  {id:"ulm",zn:"cd",n:"Ulm",ne:"Elm",lat:"Ulmus sp.",ic:"🌳",cat:"sec",b:[3,10,4,5],pk:[3,15,4,1],nec:1,pol:2,nt:[10,18],z:"păduri de câmpie și deal",dc:"Polen timpuriu."},
  {id:"artaram",zn:"cd",n:"Arțar american",ne:"Box elder",lat:"Acer negundo",ic:"🍁",cat:"sec",b:[3,20,4,15],pk:[3,25,4,10],nec:1,pol:2,nt:[10,18],z:"lunci, orașe, terenuri părăsite",dc:"Polen de primăvară."},
  {id:"brebenei",zn:"cd",n:"Brebenei",ne:"Corydalis",lat:"Corydalis sp.",ic:"💜",cat:"sec",b:[3,15,4,15],pk:[3,20,4,10],nec:2,pol:1,nt:[10,18],z:"păduri de foioase",dc:"Flora de primăvară a pădurii."},
  {id:"urzicam",zn:"cdm",n:"Urzică moartă",ne:"Dead-nettle",lat:"Lamium sp.",ic:"💜",cat:"sec",b:[3,20,5,31],pk:[4,1,5,15],nec:2,pol:1,kg:"50–100",nt:[12,22],z:"margini de drum, grădini, păduri",dc:"Nectar de întreținere primăvara."},
  {id:"silnic",zn:"cd",n:"Silnic",ne:"Ground ivy",lat:"Glechoma hederacea",ic:"💜",cat:"sec",b:[4,1,5,20],pk:[4,10,5,10],nec:2,pol:1,nt:[12,22],z:"livezi, pajiști, margini de pădure",dc:""},
  {id:"corcodus",zn:"cd",n:"Corcoduș",ne:"Cherry plum",lat:"Prunus cerasifera",ic:"🌸",cat:"sec",b:[3,25,4,15],pk:[3,30,4,10],nec:2,pol:2,nt:[10,20],z:"garduri vii, margini de drum",dc:"Primul pom care înflorește; bun pentru dezvoltare."},
  {id:"porumbar",zn:"cd",n:"Porumbar",ne:"Blackthorn",lat:"Prunus spinosa",ic:"🤍",cat:"sec",b:[4,1,4,25],pk:[4,5,4,20],nec:2,pol:2,kg:"25–40",nt:[10,20],z:"tufărișuri, margini de pădure, pășuni",dc:""},
  {id:"salciea",zn:"cd",n:"Salcie albă",ne:"White willow",lat:"Salix alba",ic:"🌿",cat:"sec",b:[4,1,4,25],pk:[4,5,4,20],nec:2,pol:3,kg:"100–150",nt:[12,22],z:"lunci, zăvoaie (Dunăre, Mureș, Timiș)",dc:"După salcia căprească; nectar și polen pentru puiet."},
  {id:"coacaz",zn:"cdm",n:"Coacăz / agriș",ne:"Currant / gooseberry",lat:"Ribes sp.",ic:"🫐",cat:"sec",b:[4,5,4,30],pk:[4,10,4,25],nec:2,pol:1,nt:[10,20],z:"grădini, plantații",dc:""},
  {id:"mustars",zn:"cd",n:"Muștar sălbatic",ne:"Charlock",lat:"Sinapis arvensis",ic:"🟡",cat:"sec",b:[4,20,6,30],pk:[5,1,6,10],nec:2,pol:2,kg:"~40",nt:[14,24],z:"culturi, terenuri necultivate",dc:""},
  {id:"paltinm",zn:"dm",n:"Paltin de munte",ne:"Sycamore maple",lat:"Acer pseudoplatanus",ic:"🍁",cat:"pri",b:[4,20,5,15],pk:[4,25,5,10],nec:3,pol:2,kg:"~200",nt:[12,22],z:"păduri de deal și munte",dc:"Cules bun de primăvară în zona de deal și munte."},
  {id:"afin",zn:"m",n:"Afin",ne:"Bilberry",lat:"Vaccinium myrtillus",ic:"🫐",cat:"sec",b:[4,20,5,25],pk:[4,25,5,20],nec:2,pol:1,kg:"20–30",nt:[12,22],z:"munte (pajiști, rariști)",dc:"Cules de întreținere la munte."},
  {id:"mojdrean",zn:"cd",n:"Mojdrean",ne:"Manna ash",lat:"Fraxinus ornus",ic:"🌳",cat:"sec",b:[5,1,5,25],pk:[5,5,5,20],nec:1,pol:3,nt:[14,24],z:"păduri calde de deal (Banat, Oltenia, Dobrogea)",dc:"Mult polen înainte de salcâm."},
  {id:"sanger",zn:"cd",n:"Sânger",ne:"Dogwood",lat:"Cornus sanguinea",ic:"🤍",cat:"sec",b:[5,10,6,10],pk:[5,15,6,5],nec:2,pol:2,nt:[15,25],z:"margini de pădure, tufărișuri",dc:""},
  {id:"soc",zn:"cdm",n:"Soc",ne:"Elder",lat:"Sambucus nigra",ic:"🤍",cat:"sec",b:[5,15,6,15],pk:[5,20,6,10],nec:1,pol:2,nt:[16,26],z:"margini de pădure, garduri",dc:"Mai ales polen."},
  {id:"maces",zn:"cdm",n:"Măceș",ne:"Dog rose",lat:"Rosa canina",ic:"🌹",cat:"sec",b:[5,15,6,20],pk:[5,20,6,15],nec:1,pol:3,nt:[16,26],z:"pășuni, margini de pădure",dc:"Polen mult."},
  {id:"salcioara",zn:"c",n:"Sălcioară",ne:"Russian olive",lat:"Elaeagnus angustifolia",ic:"🌿",cat:"sec",b:[5,20,6,15],pk:[5,25,6,10],nec:3,pol:1,kg:"~100",nt:[18,28],z:"perdele, nisipuri, sărături (Dobrogea, sud, vest)",dc:"Nectar bun imediat după salcâm."},
  {id:"lemnc",zn:"cd",n:"Lemn câinesc",ne:"Privet",lat:"Ligustrum vulgare",ic:"🤍",cat:"sec",b:[5,25,6,25],pk:[6,1,6,20],nec:2,pol:2,nt:[18,28],z:"margini de pădure, garduri vii",dc:"Acoperă golul dintre salcâm și tei."},
  {id:"mazariche",zn:"cd",n:"Măzăriche",ne:"Vetch",lat:"Vicia sp.",ic:"💜",cat:"sec",b:[5,15,7,10],pk:[5,25,6,25],nec:2,pol:1,kg:"20–100",nt:[16,26],z:"fânețe, culturi furajere",dc:""},
  {id:"mac",zn:"cd",n:"Mac",ne:"Poppy",lat:"Papaver rhoeas",ic:"🔴",cat:"sec",b:[5,20,6,30],pk:[5,25,6,20],nec:0,pol:3,nt:[16,28],z:"culturi de cereale, margini de drum",dc:"Numai polen (dimineața)."},
  {id:"jales",zn:"cd",n:"Jaleș",ne:"Woodland sage",lat:"Salvia nemorosa",ic:"💜",cat:"pri",b:[5,20,7,15],pk:[6,1,7,5],nec:3,pol:1,kg:"100–300",nt:[18,30],z:"pajiști uscate, margini de drum (câmpie, deal)",dc:"Una dintre cele mai bune plante din flora spontană."},
  {id:"tataneasa",zn:"cd",n:"Tătăneasă",ne:"Comfrey",lat:"Symphytum officinale",ic:"💜",cat:"sec",b:[5,10,7,15],pk:[5,20,6,30],nec:2,pol:1,nt:[16,26],z:"lunci, locuri umede",dc:""},
  {id:"fanete",zn:"dm",n:"Fâneață (floră de pajiște)",ne:"Meadow flowers",lat:"floră spontană",ic:"🌼",cat:"pri",b:[5,25,7,25],pk:[6,5,7,10],nec:2,pol:2,kg:"30–60",nt:[16,28],z:"fânețe de deal și munte",dc:"Cules poliflor; se termină la cosit."},
  {id:"crusin",zn:"dm",n:"Crușin",ne:"Alder buckthorn",lat:"Frangula alnus",ic:"🌿",cat:"sec",b:[5,15,7,15],pk:[5,25,6,30],nec:2,pol:1,nt:[16,26],z:"păduri umede, lunci de deal și munte",dc:"Înflorire lungă."},
  {id:"albastrea",zn:"cd",n:"Albăstrea",ne:"Cornflower",lat:"Centaurea cyanus",ic:"🔵",cat:"sec",b:[6,1,7,31],pk:[6,10,7,15],nec:3,pol:2,kg:"~100",nt:[18,28],z:"culturi de cereale, margini",dc:""},
  {id:"limbam",zn:"cd",n:"Limba mielului",ne:"Borage",lat:"Borago officinalis",ic:"🔵",cat:"sec",b:[6,1,8,31],pk:[6,15,8,10],nec:3,pol:2,kg:"200–300",nt:[18,28],z:"semănată (apicultori), grădini",dc:"Secretă și pe vreme mai răcoroasă."},
  {id:"talpag",zn:"cd",n:"Talpa gâștii",ne:"Motherwort",lat:"Leonurus cardiaca",ic:"💜",cat:"sec",b:[6,10,8,15],pk:[6,20,7,31],nec:3,pol:1,kg:"200–400",nt:[18,30],z:"locuri necultivate, lângă sate",dc:"Nectar mult, pe toată vara."},
  {id:"nalba",zn:"cd",n:"Nalbă",ne:"Mallow",lat:"Malva / Althaea sp.",ic:"🌺",cat:"sec",b:[6,15,8,31],pk:[7,1,8,15],nec:2,pol:2,nt:[20,30],z:"locuri necultivate, lunci",dc:""},
  {id:"manas",zn:"cd",n:"Mană de foioase",ne:"Deciduous honeydew",lat:"stejar, tei, salcie…",ic:"🍂",cat:"sec",b:[6,1,7,31],pk:[6,10,7,20],nec:2,pol:0,nt:[18,30],z:"păduri de stejar și amestec",dc:"Nu e floare: mană produsă de insecte pe frunze. Apare în unii ani, pe vreme caldă fără ploi. Nu e bună pentru iernare."},
  {id:"mana",zn:"m",n:"Mană de brad / molid",ne:"Fir / spruce honeydew",lat:"Abies alba, Picea abies",ic:"🌲",cat:"main",b:[6,1,8,25],pk:[6,15,8,5],nec:3,pol:0,kg:"variabil",nt:[16,28],z:"păduri de rășinoase (munte)",dc:"Cules de munte, în ani buni foarte bogat. Depinde de vreme (cald, fără ploi mari). Mierea de mană nu se lasă pentru iernare."},
  {id:"sovarf",zn:"dm",n:"Sovârf",ne:"Oregano",lat:"Origanum vulgare",ic:"🌿",cat:"sec",b:[7,1,8,31],pk:[7,10,8,15],nec:3,pol:1,kg:"80–200",nt:[18,28],z:"pajiști și margini de pădure (deal, munte)",dc:"Aromatică de vară."},
  {id:"matac",zn:"c",n:"Mătăciune",ne:"Moldavian balm",lat:"Dracocephalum moldavica",ic:"💜",cat:"sec",b:[7,1,8,20],pk:[7,10,8,10],nec:3,pol:1,kg:"200–400",nt:[20,30],z:"semănată (apicultori)",dc:""},
  {id:"evodia",zn:"cd",n:"Evodia (arborele de miere)",ne:"Bee-bee tree",lat:"Tetradium daniellii",ic:"🌳",cat:"sec",b:[7,10,8,20],pk:[7,15,8,10],nec:3,pol:2,nt:[20,30],z:"plantat de apicultori, parcuri",dc:"Înflorește în golul de vară."},
  {id:"porumb",zn:"cd",n:"Porumb (polen)",ne:"Maize (pollen)",lat:"Zea mays",ic:"🌽",cat:"sec",b:[7,1,8,5],pk:[7,10,7,31],nec:0,pol:2,nt:[20,32],z:"culturi",dc:"Numai polen; atenție la tratamentele culturii."},
  {id:"busuiocm",zn:"c",n:"Busuioc de miriște",ne:"Annual woundwort",lat:"Stachys annua",ic:"🤍",cat:"pri",b:[7,5,9,15],pk:[7,15,8,31],nec:3,pol:1,kg:"100–300",nt:[20,30],z:"miriști (Câmpia Română, Dobrogea, vest)",dc:"Cules de vară târzie pe miriștile nearate."},
  {id:"cicoare",zn:"cd",n:"Cicoare",ne:"Chicory",lat:"Cichorium intybus",ic:"🔵",cat:"sec",b:[7,1,9,15],pk:[7,10,8,31],nec:2,pol:2,kg:"~100",nt:[18,28],z:"margini de drum, pășuni",dc:"Florile se închid la amiază."},
  {id:"rachitan",zn:"cd",n:"Răchitan",ne:"Purple loosestrife",lat:"Lythrum salicaria",ic:"🌺",cat:"sec",b:[7,1,8,31],pk:[7,10,8,20],nec:3,pol:2,kg:"~200",nt:[20,30],z:"bălți, lunci, canale",dc:"Cules bun în zone umede."},
  {id:"scaiv",zn:"cd",n:"Scai vânăt",ne:"Blue eryngo",lat:"Eryngium planum",ic:"🔵",cat:"sec",b:[7,1,8,31],pk:[7,10,8,20],nec:3,pol:1,nt:[20,30],z:"pășuni, pajiști uscate",dc:""},
  {id:"izmab",zn:"c",n:"Izmă de baltă",ne:"Water mint",lat:"Mentha aquatica",ic:"🌱",cat:"sec",b:[7,15,9,15],pk:[7,25,8,31],nec:3,pol:1,kg:"200–300",nt:[20,30],z:"bălți, Delta și Lunca Dunării",dc:"Cules de vară târzie în zona inundabilă."},
  {id:"trifoir",zn:"cdm",n:"Trifoi roșu",ne:"Red clover",lat:"Trifolium pratense",ic:"☘️",cat:"sec",b:[5,25,9,15],pk:[6,10,8,15],nec:1,pol:2,kg:"25–50",nt:[18,28],z:"fânețe, culturi furajere",dc:"Albinele ajung greu la nectar; mai accesibil la coasa a doua."},
  {id:"iarban",zn:"m",n:"Iarbă neagră",ne:"Heather",lat:"Calluna vulgaris",ic:"💜",cat:"sec",b:[7,20,9,5],pk:[8,1,8,25],nec:3,pol:1,kg:"100–200",nt:[16,26],z:"munte (pajiști acide, turbării)",dc:"Cules târziu de munte; miere gelatinoasă."},
  {id:"topinambur",zn:"cd",n:"Topinambur",ne:"Jerusalem artichoke",lat:"Helianthus tuberosus",ic:"🌻",cat:"sec",b:[9,1,10,15],pk:[9,10,10,5],nec:2,pol:2,nt:[14,24],z:"lunci, margini de sate",dc:"Polen și nectar pentru albina de iernare."}
];
