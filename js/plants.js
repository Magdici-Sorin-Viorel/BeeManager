// BeeManager Pro — plants.js
// 🌼 Database of Romanian honey plants (used by Calendar).
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
var MELIFERE=[
  // ── MAIN FLOWS ──
  {id:"rapita",n:"Rapiță",ne:"Rapeseed",lat:"Brassica napus",ic:"🟨",cat:"main",b:[4,12,5,15],pk:[4,20,5,8],nec:3,pol:3,kg:"30–80",nt:[12,25],z:"cultivată, toată țara (mult în Timiș)",dc:"Primul cules mare. Mierea cristalizează repede — extrage la timp."},
  {id:"salcam",n:"Salcâm",ne:"Black locust",lat:"Robinia pseudoacacia",ic:"🌳",cat:"main",b:[5,3,5,30],pk:[5,8,5,25],nec:3,pol:1,kg:"300–1500",nt:[18,28],z:"păduri de salcâm, perdele; mult în vestul și sudul țării",dc:"Cel mai valoros cules. Durează 10–14 zile; secreția scade la frig și vânt."},
  {id:"tei",n:"Tei",ne:"Linden",lat:"Tilia sp.",ic:"💛",cat:"main",b:[6,1,7,15],pk:[6,10,7,5],nec:3,pol:1,kg:"800–1200",nt:[20,30],z:"păduri de deal, parcuri, aliniamente",dc:"Tei cu frunza mare (început de iunie) → tei pucios (mijlocul lunii) → tei argintiu (sfârșit de iunie–iulie). Secretă bine după ploi calde."},
  {id:"floarea",n:"Floarea-soarelui",ne:"Sunflower",lat:"Helianthus annuus",ic:"🌻",cat:"main",b:[6,25,8,10],pk:[7,1,7,28],nec:2,pol:3,kg:"30–60",nt:[22,32],z:"cultivată, câmpie (Banat, Câmpia Română, Dobrogea)",dc:"Cules lung de vară. Atenție la tratamentele culturilor și la secetă."},

  // ── PRIORITY SECONDARY (fruit trees, clover, phacelia, aromatics) ──
  {id:"cais",n:"Cais",ne:"Apricot",lat:"Prunus armeniaca",ic:"🍑",cat:"pri",b:[3,20,4,10],pk:[3,25,4,5],nec:2,pol:2,nt:[10,20],z:"livezi, grădini",dc:"Înflorește devreme; poate fi prins de înghețuri."},
  {id:"piersic",n:"Piersic",ne:"Peach",lat:"Prunus persica",ic:"🍑",cat:"pri",b:[3,25,4,15],pk:[4,1,4,12],nec:2,pol:2,nt:[10,22],z:"livezi, grădini",dc:""},
  {id:"prun",n:"Prun",ne:"Plum",lat:"Prunus domestica",ic:"🌸",cat:"pri",b:[4,1,4,25],pk:[4,5,4,20],nec:2,pol:2,nt:[10,22],z:"livezi, grădini (mult în deal)",dc:"Cules de stimulare; în livezi mari poate da și miere."},
  {id:"cires",n:"Cireș",ne:"Sweet cherry",lat:"Prunus avium",ic:"🍒",cat:"pri",b:[4,5,4,25],pk:[4,8,4,20],nec:2,pol:2,nt:[10,22],z:"livezi, margini de pădure",dc:""},
  {id:"visin",n:"Vișin",ne:"Sour cherry",lat:"Prunus cerasus",ic:"🍒",cat:"pri",b:[4,10,4,30],pk:[4,12,4,25],nec:2,pol:2,nt:[10,22],z:"livezi, grădini",dc:""},
  {id:"par",n:"Păr",ne:"Pear",lat:"Pyrus communis",ic:"🍐",cat:"pri",b:[4,10,4,30],pk:[4,12,4,25],nec:1,pol:2,nt:[12,22],z:"livezi, grădini",dc:"Nectar puțin (zaharuri slabe), polen bun."},
  {id:"mar",n:"Măr (pomi fructiferi)",ne:"Apple (fruit trees)",lat:"Malus domestica",ic:"🍎",cat:"pri",b:[4,20,5,15],pk:[4,25,5,10],nec:2,pol:2,kg:"20–30",nt:[12,24],z:"livezi (Banat, Bistrița, Argeș, Maramureș…)",dc:"Livezile mari pot da un mic cules."},
  {id:"gutui",n:"Gutui",ne:"Quince",lat:"Cydonia oblonga",ic:"🍐",cat:"pri",b:[5,1,5,25],pk:[5,5,5,20],nec:2,pol:2,nt:[14,24],z:"grădini, livezi",dc:""},
  {id:"trifoi",n:"Trifoi alb",ne:"White clover",lat:"Trifolium repens",ic:"☘️",cat:"pri",b:[5,15,9,30],pk:[6,1,7,15],nec:2,pol:2,kg:"50–100",nt:[18,30],z:"pajiști, pășuni, margini de drum",dc:"Secretă bine pe vreme caldă și umedă; reînflorește după cosit."},
  {id:"trifoih",n:"Trifoi hibrid",ne:"Alsike clover",lat:"Trifolium hybridum",ic:"☘️",cat:"pri",b:[5,25,7,31],pk:[6,5,7,10],nec:2,pol:2,kg:"100–125",nt:[18,30],z:"pajiști umede, cultivat",dc:""},
  {id:"facelia",n:"Facelia",ne:"Phacelia",lat:"Phacelia tanacetifolia",ic:"💜",cat:"pri",b:[5,15,9,30],pk:[6,1,7,15],nec:3,pol:2,kg:"300–1000",nt:[16,28],z:"semănată (apicultori, îngrășământ verde)",dc:"Înflorește ~6 săptămâni după semănat și ține 4–6 săptămâni — poți semăna eșalonat pentru goluri de cules."},
  {id:"lavanda",n:"Lavandă (levănțică)",ne:"Lavender",lat:"Lavandula angustifolia",ic:"💜",cat:"pri",b:[6,10,7,31],pk:[6,20,7,15],nec:2,pol:1,kg:"50–100",nt:[22,32],z:"culturi (tot mai multe în vest și sud), grădini",dc:"Miere aromată; secretă la căldură."},
  {id:"menta",n:"Mentă",ne:"Peppermint",lat:"Mentha piperita",ic:"🌱",cat:"pri",b:[7,1,8,31],pk:[7,10,8,15],nec:2,pol:1,kg:"100–200",nt:[20,30],z:"culturi, locuri umede (izma)",dc:"Miere cu aromă puternică."},
  {id:"salvie",n:"Salvie",ne:"Sage",lat:"Salvia officinalis",ic:"🌿",cat:"pri",b:[5,15,6,30],pk:[5,25,6,20],nec:2,pol:1,kg:"100–300",nt:[18,30],z:"culturi, grădini; salvia de câmp pe pajiști",dc:"Aromatică."},
  {id:"cimbru",n:"Cimbru / cimbrișor",ne:"Thyme",lat:"Thymus sp.",ic:"🌿",cat:"pri",b:[6,1,8,31],pk:[6,15,7,31],nec:2,pol:1,nt:[20,32],z:"pajiști uscate, dealuri; cultivat",dc:"Aromatică; miere foarte apreciată."},
  {id:"coriandru",n:"Coriandru",ne:"Coriander",lat:"Coriandrum sativum",ic:"🌿",cat:"pri",b:[6,1,7,15],pk:[6,10,7,5],nec:2,pol:1,kg:"200–500",nt:[20,30],z:"culturi (Banat, sudul țării)",dc:"Aromatică cultivată."},
  {id:"melisa",n:"Roiniță (melisă)",ne:"Lemon balm",lat:"Melissa officinalis",ic:"🍃",cat:"pri",b:[6,15,8,31],pk:[7,1,8,10],nec:2,pol:1,nt:[20,30],z:"grădini, culturi",dc:"Aromatică; atrage albinele (folosită și la capcane de roi)."},
  {id:"isop",n:"Isop",ne:"Hyssop",lat:"Hyssopus officinalis",ic:"🌿",cat:"pri",b:[7,1,9,15],pk:[7,15,8,31],nec:2,pol:1,nt:[20,30],z:"grădini, culturi",dc:"Aromatică de vară târzie."},
  {id:"busuioc",n:"Busuioc",ne:"Basil",lat:"Ocimum basilicum",ic:"🌿",cat:"pri",b:[7,1,9,30],pk:[7,15,8,31],nec:2,pol:1,nt:[22,32],z:"grădini, culturi",dc:"Aromatică."},

  // ── SECONDARY (other Romanian honey plants, incl. Timiș / Banat area) ──
  {id:"cornul",n:"Corn",ne:"Cornelian cherry",lat:"Cornus mas",ic:"🌼",cat:"sec",b:[3,1,3,31],pk:[3,10,3,25],nec:1,pol:2,nt:[10,18],z:"păduri de deal, garduri",dc:""},
  {id:"salcie",n:"Salcie căprească",ne:"Goat willow",lat:"Salix caprea",ic:"🌿",cat:"sec",b:[3,10,4,15],pk:[3,20,4,10],nec:2,pol:3,nt:[10,18],z:"lunci, maluri de râu (Timiș, Bega, Mureș)",dc:"Foarte importantă primăvara — polen și nectar pentru dezvoltare."},
  {id:"paltinc",n:"Paltin de câmp",ne:"Norway maple",lat:"Acer platanoides",ic:"🍁",cat:"sec",b:[4,1,4,25],pk:[4,5,4,20],nec:2,pol:2,nt:[10,20],z:"păduri, parcuri",dc:""},
  {id:"papadie",n:"Păpădie",ne:"Dandelion",lat:"Taraxacum officinale",ic:"🌼",cat:"sec",b:[4,1,5,20],pk:[4,10,5,5],nec:2,pol:3,kg:"~50",nt:[12,24],z:"pajiști, livezi, peste tot",dc:"Cules de dezvoltare foarte bun."},
  {id:"jugastru",n:"Jugastru (arțar de câmp)",ne:"Field maple",lat:"Acer campestre",ic:"🍁",cat:"sec",b:[4,20,5,15],pk:[4,25,5,10],nec:2,pol:2,nt:[12,22],z:"păduri de câmpie, perdele",dc:""},
  {id:"artart",n:"Arțar tătărăsc",ne:"Tatar maple",lat:"Acer tataricum",ic:"🍁",cat:"sec",b:[4,25,5,20],pk:[5,1,5,15],nec:3,pol:2,kg:"~100",nt:[14,24],z:"perdele forestiere, câmpie (Banat)",dc:"Poate da un cules bun înainte de salcâm."},
  {id:"castans",n:"Castan sălbatic",ne:"Horse chestnut",lat:"Aesculus hippocastanum",ic:"🌰",cat:"sec",b:[4,25,5,20],pk:[5,1,5,15],nec:2,pol:2,nt:[14,24],z:"parcuri, orașe",dc:""},
  {id:"paducel",n:"Păducel",ne:"Hawthorn",lat:"Crataegus monogyna",ic:"🤍",cat:"sec",b:[5,1,5,25],pk:[5,5,5,20],nec:1,pol:2,nt:[15,24],z:"tufărișuri, margini de pădure",dc:""},
  {id:"mustar",n:"Muștar alb",ne:"White mustard",lat:"Sinapis alba",ic:"🟡",cat:"sec",b:[5,1,6,15],pk:[5,10,6,5],nec:2,pol:2,kg:"~100",nt:[14,26],z:"cultivat; semănat și în miriște (toamna)",dc:""},
  {id:"spar",n:"Sparcetă",ne:"Sainfoin",lat:"Onobrychis viciifolia",ic:"🌺",cat:"sec",b:[5,15,6,20],pk:[5,25,6,15],nec:3,pol:2,kg:"100–400",nt:[18,28],z:"cultivată pe terenuri calcaroase",dc:"Cules foarte bun unde se cultivă."},
  {id:"amorfa",n:"Amorfă (salcâm mic)",ne:"False indigo",lat:"Amorpha fruticosa",ic:"🟣",cat:"sec",b:[5,25,6,30],pk:[6,1,6,25],nec:2,pol:2,kg:"~100",nt:[18,28],z:"lunci, diguri — frecventă în Banat (Timiș, Bega)",dc:"Cules bun după salcâm în zonele cu lunci."},
  {id:"gladita",n:"Glădiță",ne:"Honey locust",lat:"Gleditsia triacanthos",ic:"🌳",cat:"sec",b:[5,25,6,15],pk:[6,1,6,12],nec:2,pol:1,nt:[18,28],z:"aliniamente, perdele (câmpie)",dc:""},
  {id:"otetar",n:"Oțetar fals (cenușer)",ne:"Tree of heaven",lat:"Ailanthus altissima",ic:"🌳",cat:"sec",b:[6,5,6,30],pk:[6,10,6,25],nec:2,pol:2,nt:[20,30],z:"terenuri părăsite, orașe (mult în vest și sud)",dc:"Miere cu gust specific."},
  {id:"sulfina",n:"Sulfină",ne:"Sweet clover",lat:"Melilotus officinalis / albus",ic:"🌾",cat:"sec",b:[6,1,8,31],pk:[6,15,7,31],nec:3,pol:2,kg:"200–600",nt:[20,30],z:"terenuri necultivate, margini de drum, diguri (Banat)",dc:"Una dintre cele mai bune plante de vară."},
  {id:"ghizdei",n:"Ghizdei",ne:"Bird's-foot trefoil",lat:"Lotus corniculatus",ic:"🌼",cat:"sec",b:[6,1,8,31],pk:[6,10,7,20],nec:2,pol:2,nt:[18,28],z:"pajiști",dc:""},
  {id:"lucerna",n:"Lucernă",ne:"Alfalfa",lat:"Medicago sativa",ic:"🟣",cat:"sec",b:[6,1,8,31],pk:[6,15,7,31],nec:1,pol:1,kg:"25–30",nt:[22,32],z:"cultivată",dc:"Albinele o lucrează mai ales pe căldură mare."},
  {id:"echium",n:"Iarba-șarpelui",ne:"Viper's bugloss",lat:"Echium vulgare",ic:"🔵",cat:"sec",b:[6,1,8,31],pk:[6,15,7,31],nec:3,pol:2,kg:"300–400",nt:[18,30],z:"terenuri uscate, margini de drum",dc:""},
  {id:"mur",n:"Mur",ne:"Blackberry",lat:"Rubus fruticosus",ic:"🫐",cat:"sec",b:[6,1,7,31],pk:[6,10,7,15],nec:2,pol:2,nt:[18,28],z:"margini de pădure, tufărișuri",dc:""},
  {id:"zmeur",n:"Zmeur",ne:"Raspberry",lat:"Rubus idaeus",ic:"🫐",cat:"sec",b:[6,1,7,10],pk:[6,10,7,5],nec:3,pol:2,kg:"50–100",nt:[16,26],z:"deal și munte (nu în câmpia Timișului)",dc:"Cules bun la munte."},
  {id:"castanc",n:"Castan comestibil",ne:"Sweet chestnut",lat:"Castanea sativa",ic:"🌰",cat:"sec",b:[6,15,7,10],pk:[6,20,7,5],nec:2,pol:3,nt:[20,30],z:"Banatul montan (Caraș), Maramureș, Vâlcea",dc:"Miere închisă la culoare, amăruie."},
  {id:"ciulin",n:"Ciulini / scaieți",ne:"Thistles",lat:"Carduus, Cirsium sp.",ic:"🟣",cat:"sec",b:[6,15,8,31],pk:[7,1,8,15],nec:2,pol:2,nt:[20,32],z:"pășuni, terenuri părăsite",dc:""},
  {id:"dovleac",n:"Dovleac",ne:"Pumpkin",lat:"Cucurbita pepo",ic:"🎃",cat:"sec",b:[6,15,8,31],pk:[7,1,8,15],nec:2,pol:3,nt:[20,30],z:"culturi, grădini",dc:""},
  {id:"pepeni",n:"Pepeni",ne:"Melons",lat:"Citrullus / Cucumis",ic:"🍉",cat:"sec",b:[6,15,8,15],pk:[7,1,8,5],nec:1,pol:1,nt:[22,32],z:"culturi (vest, sud)",dc:""},
  {id:"hrisca",n:"Hrișcă",ne:"Buckwheat",lat:"Fagopyrum esculentum",ic:"🤍",cat:"sec",b:[7,1,8,31],pk:[7,10,8,15],nec:3,pol:2,kg:"50–100",nt:[18,28],z:"cultivată (și în cultură a doua)",dc:"Miere închisă, aromată; secretă dimineața."},
  {id:"sophora",n:"Salcâm japonez",ne:"Pagoda tree",lat:"Styphnolobium (Sophora) japonicum",ic:"🌳",cat:"sec",b:[7,15,8,15],pk:[7,20,8,10],nec:3,pol:2,kg:"~300",nt:[22,32],z:"aliniamente în orașe (ex. Timișoara, Arad, București)",dc:"Cules bun de vară târzie lângă orașe."},
  {id:"zburat",n:"Zburătoare",ne:"Fireweed",lat:"Chamerion angustifolium",ic:"🌸",cat:"sec",b:[7,1,8,15],pk:[7,10,8,5],nec:3,pol:2,kg:"~600",nt:[16,26],z:"munte (tăieturi de pădure)",dc:"Cules de munte."},
  {id:"solidago",n:"Splinuță (Solidago)",ne:"Goldenrod",lat:"Solidago canadensis / gigantea",ic:"🟡",cat:"sec",b:[8,10,9,30],pk:[8,20,9,20],nec:2,pol:2,kg:"~100",nt:[18,28],z:"terenuri părăsite, lunci — răspândită în vest (Timiș)",dc:"Cules de toamnă, bun pentru rezerve."},
  {id:"mustart",n:"Muștar în miriște",ne:"Stubble mustard",lat:"Sinapis alba (cultură a doua)",ic:"🟡",cat:"sec",b:[8,20,10,15],pk:[9,1,10,5],nec:2,pol:2,nt:[14,24],z:"semănat după recoltarea păioaselor",dc:"Pentru rezervele de iarnă."},
  {id:"iedera",n:"Iederă",ne:"Ivy",lat:"Hedera helix",ic:"🍃",cat:"sec",b:[9,5,10,20],pk:[9,15,10,10],nec:2,pol:2,nt:[14,22],z:"păduri, ziduri, parcuri",dc:"Ultimul nectar al anului."}
];
var PLANTS=MELIFERE;   // compatibility (Dashboard / getFlow)

// day of year for a date [month,day] in year y, plus the location offset
function plDoy(y,m,d,off){return doy(y,m,d)+(off||0);}
// a plant's state on day cd: null (not in bloom) or {phase, left, start, end, pkS, pkE}
function plState(p,yr,cd,off){
  var s=plDoy(yr,p.b[0],p.b[1],off),e=plDoy(yr,p.b[2],p.b[3],off),ps=plDoy(yr,p.pk[0],p.pk[1],off),pe=plDoy(yr,p.pk[2],p.pk[3],off);
  var r={s:s,e:e,ps:ps,pe:pe,inBloom:cd>=s&&cd<=e,inPeak:cd>=ps&&cd<=pe,until:s-cd,left:e-cd};
  r.phase=!r.inBloom?(cd<s?"before":"after"):cd<ps?"start":cd<=pe?"peak":"end";
  return r;
}

// ═══════════════════════════════════════════
// 👀 YOUR OBSERVATIONS → CALENDAR ADJUSTMENT
// ═══════════════════════════════════════════
// D.bloomObs = [{id, plant, phase:"start"|"peak", date, lat, lon}]
// How it's computed (per area — observations within ~30 km of where you are now):
//  1. From PAST YEARS: mean of your deviations from the calendar (recent years weigh more) → starting point.
//  2. From THIS YEAR: each observation gives a deviation (days earlier / later than the calendar).
//     • the observed plant → shifts exactly to what you saw (start → start; full bloom → nectar peak)
//     • other plants → shift by observations close in time: weight = e^(−distance in days / 45);
//       an „anchor” of 0.35 pulls toward the calendar, so a deviation in rapeseed is felt strongly in acacia,
//       less in linden and little in sunflower (later weather can still change things).
var BLOOM_TAU=45,BLOOM_ANCHOR=0.35,BLOOM_RADIUS_KM=30;
function plKm(a,b){var R=6371,dLa=(b.lat-a.lat)*Math.PI/180,dLo=(b.lon-a.lon)*Math.PI/180;
  var x=Math.sin(dLa/2)*Math.sin(dLa/2)+Math.cos(a.lat*Math.PI/180)*Math.cos(b.lat*Math.PI/180)*Math.sin(dLo/2)*Math.sin(dLo/2);return 2*R*Math.asin(Math.sqrt(x));}
function plObsHere(){
  var here=D.userLoc;
  return(D.bloomObs||[]).filter(function(o){return !here||o.lat==null||plKm(here,{lat:o.lat,lon:o.lon})<=BLOOM_RADIUS_KM;});
}
function plFind(id){return MELIFERE.find(function(p){return p.id===id;});}
// raw deviation of an observation from the calendar (no adjustments), in days
function plObsDev(o){
  var p=plFind(o.plant);if(!p)return null;
  var y=parseInt(o.date.slice(0,4)),off=getLatOffset(),m=parseInt(o.date.slice(5,7)),d=parseInt(o.date.slice(8,10));
  var base=o.phase==="peak"?plDoy(y,p.pk[0],p.pk[1],off):plDoy(y,p.b[0],p.b[1],off);
  return doy(y,m,d)-base;
}
var _plAdjC=null,_plAdjK="";
function plAdjModel(yr){
  var obs=plObsHere(),key=yr+"|"+obs.length+"|"+obs.map(function(o){return o.id+o.date+o.phase;}).join(",")+"|"+(D.userLoc?D.userLoc.lat.toFixed(2):"");
  if(_plAdjC&&_plAdjK===key)return _plAdjC;
  // 1. past years: per-year mean, weighted toward recent years
  var past={};obs.forEach(function(o){var y=parseInt(o.date.slice(0,4));if(y<yr){var dv=plObsDev(o);if(dv!=null)(past[y]=past[y]||[]).push(dv);}});
  var ys=Object.keys(past).map(Number).sort(function(a,b){return b-a;}),sw=0,sv=0;
  ys.forEach(function(y,i){var w=Math.pow(0.7,i),a=past[y].reduce(function(x,z){return x+z;},0)/past[y].length;sw+=w;sv+=w*a;});
  var B=sw?Math.max(-20,Math.min(20,Math.round(sv/sw))):0;
  // 2. this year: each observation's deviation from the calendar + B
  var cur=obs.filter(function(o){return parseInt(o.date.slice(0,4))===yr;}).map(function(o){
    var p=plFind(o.plant);if(!p)return null;var dv=plObsDev(o);return dv==null?null:{o:o,p:p,dev:dv-B,anchor:plDoy(yr,p.b[0],p.b[1],0)};}).filter(Boolean);
  var adj={};
  MELIFERE.forEach(function(p){
    var own=cur.filter(function(c){return c.p.id===p.id;});
    var st=own.filter(function(c){return c.o.phase==="start";}).pop(),pk=own.filter(function(c){return c.o.phase==="peak";}).pop();
    var r;
    if(st||pk){r={s:B+(st?st.dev:pk.dev),pk:B+(pk?pk.dev:st.dev),own:true};}
    else{
      var me=plDoy(yr,p.b[0],p.b[1],0),w0=BLOOM_ANCHOR,swt=0,sd=0;
      cur.forEach(function(c){var w=Math.exp(-Math.abs(me-c.anchor)/BLOOM_TAU);swt+=w;sd+=w*c.dev;});
      var sh=swt?sd/(swt+w0):0;
      r={s:B+sh,pk:B+sh,own:false};
    }
    r.s=Math.max(-30,Math.min(30,Math.round(r.s)));r.pk=Math.max(-30,Math.min(30,Math.round(r.pk)));
    adj[p.id]=r;
  });
  var avgCur=cur.length?Math.round(cur.reduce(function(x,c){return x+c.dev;},0)/cur.length):null;
  _plAdjC={adj:adj,B:B,pastYears:ys.length,cur:cur,avgCur:avgCur};_plAdjK=key;
  return _plAdjC;
}
// Plant state with the adjustment applied (used by the calendar and getFlow)
plState=function(p,yr,cd,off){
  var A=plAdjModel(yr).adj[p.id]||{s:0,pk:0};
  var s=plDoy(yr,p.b[0],p.b[1],off)+A.s,ps=plDoy(yr,p.pk[0],p.pk[1],off)+A.pk,pe=plDoy(yr,p.pk[2],p.pk[3],off)+A.pk,e=plDoy(yr,p.b[2],p.b[3],off)+A.pk;
  if(ps<s)ps=s;if(e<pe)e=pe;
  var r={s:s,e:e,ps:ps,pe:pe,inBloom:cd>=s&&cd<=e,inPeak:cd>=ps&&cd<=pe,until:s-cd,left:e-cd,adj:A.pk||A.s,own:!!A.own};
  r.phase=!r.inBloom?(cd<s?"before":"after"):cd<ps?"start":cd<=pe?"peak":"end";
  return r;
};
