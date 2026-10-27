// BeeManager Pro — core.js
// Data model D, load/save, offline, toast, confirm, debounce, helpers

// ═══════════════════════════════════════════
// DATA MODEL
// ═══════════════════════════════════════════
let D={hives:[],queens:[],inspections:[],honeyHarvests:[],treatments:[],inventory:[],pastorage:[],finances:[],varroa:[],tasks:[],feedings:[],userLoc:null,weather:null,settings:{dark:true,lang:"ro",tempUnit:"C"}};

// Nectar plants: see js/plants.js (MELIFERE / PLANTS)

const WMO={0:{i:"☀️",r:0},1:{i:"🌤️",r:0},2:{i:"⛅",r:0},3:{i:"☁️",r:0},
  45:{i:"🌫️",r:0},48:{i:"🌫️",r:0},
  51:{i:"🌧️",r:1},53:{i:"🌧️",r:1},55:{i:"🌧️",r:1},
  61:{i:"🌧️",r:1},63:{i:"🌧️",r:1},65:{i:"🌧️",r:1},
  71:{i:"❄️",r:0},73:{i:"❄️",r:0},75:{i:"❄️",r:0},
  80:{i:"🌦️",r:1},81:{i:"🌦️",r:1},82:{i:"⛈️",r:1},
  95:{i:"⛈️",r:1},96:{i:"⛈️",r:1},99:{i:"⛈️",r:1}
};
function wmoI(c){var info=WMO[c]||WMO[Math.floor(c/10)*10]||{i:"🌡️",r:0};return info;}

// Days without inspection after which the alert appears (default)
var INSP_ALERT_DEFAULT=7;

const FW={"Dadant 1/1 (cuib)":2.8,"Dadant 1/2 (magazie)":1.4,"Langstroth 1/1":2.5,"Langstroth 1/2":1.2,"Alt tip":2.0};

// ═══════════════════════════════════════════
// STORAGE
// ═══════════════════════════════════════════
function load(){
  var s=localStorage.getItem("bmp5");
  if(s){var p=JSON.parse(s);D={...D,...p};}
  cleanTestData();   // first start of the production version: drop demo / test data left from testing
  if(!D.settings)D.settings={dark:true,lang:"ro",tempUnit:"C"};
  D.settings.lang="ro"; // app is Romanian-only (English option removed from Settings)
  D.settings.tempUnit="C"; // temperature always in Celsius (unit option removed from Settings)
  if(!D.settings.inspAlertThreshold)D.settings.inspAlertThreshold=INSP_ALERT_DEFAULT;
  if(!D.pastorage)D.pastorage=[];
  if(!D.finances)D.finances=[];
  if(!D.varroa)D.varroa=[];
  if(!D.tasks)D.tasks=[];
  if(!D.feedings)D.feedings=[];
  initLoc();
}

// One-time cleanup (production version): the app starts empty. If the stored data is the old demo
// (Stupul #1 / #2 sample hives) or test data (test mode, simulated date), it is removed; settings,
// language, theme, menu order and location are kept. Real data entered by the user is never touched.
function cleanTestData(){
  if(D.settings&&D.settings.prodReady)return;
  var ls=function(k){try{return localStorage.getItem(k);}catch(e){return null;}};
  var hs=D.hives||[];
  var testMode=!!(ls("bmp5_beforeTest")||ls("bmp5_fakeNow"))||hs.some(function(h){return /^(t|r|x)\d\d$/.test(h.id);});
  var demo=hs.length>0&&hs.every(function(h){return(h.id==="h1"&&h.loc==="Livada Est")||(h.id==="h2"&&h.loc==="Deal Vest");});
  if(testMode||demo){
    var keep=D.settings||{},loc=D.userLoc,w=D.weather;
    D={hives:[],queens:[],inspections:[],honeyHarvests:[],treatments:[],inventory:[],pastorage:[],finances:[],varroa:[],tasks:[],feedings:[],
      hivesArchive:[],bloomObs:[],userLoc:loc||null,weather:w||null,settings:keep};
    try{Object.keys(localStorage).forEach(function(k){if(k.indexOf("bmp5_hive_")===0||k==="bmp5_beforeTest"||k==="bmp5_fakeNow")localStorage.removeItem(k);});}catch(e){}
  }
  if(!D.settings)D.settings={dark:true,lang:"ro",tempUnit:"C"};
  D.settings.prodReady=1;
  try{localStorage.setItem("bmp5",JSON.stringify(D));}catch(e){}
}

function save(showToast){
  if(showToast===undefined)showToast=true;
  localStorage.setItem("bmp5",JSON.stringify(D));
  if(showToast)toast(D.settings.lang==="en"?"Saved ✅":"Salvat ✅","🍯");
}

// Per-hive snapshot: save individual hive data + its inspections in a separate localStorage key
function saveHiveSnapshot(hiveId){
  var hive=D.hives.find(function(h){return h.id===hiveId;});
  if(!hive)return;
  var snap={hive:hive,inspections:D.inspections.filter(function(i){return i.hiveId===hiveId;}),queens:D.queens?D.queens.filter(function(q){return q.hive===hiveId;}):[], honeyHarvests:D.honeyHarvests.filter(function(h){return h.hiveId===hiveId;}),savedAt:new Date().toISOString()};
  localStorage.setItem("bmp5_hive_"+hiveId,JSON.stringify(snap));
}

function applyTheme(){
  document.body.classList.toggle("light",!D.settings.dark);
  document.getElementById("htmlRoot").lang=D.settings.lang||"ro";
}
var uid=function(){return Date.now().toString(36)+Math.random().toString(36).slice(2);};

// ═══════════════════════════════════════════
// OFFLINE DETECTION
// ═══════════════════════════════════════════
function updateOfflineBar(){
  var bar=document.getElementById("offlineBar");
  var offline=!navigator.onLine;
  if(bar){bar.classList.toggle("show",offline);document.body.classList.toggle("is-offline",offline);}
}
window.addEventListener("online",function(){updateOfflineBar();if(D.userLoc)fetchW(D.userLoc.lat,D.userLoc.lon);});
window.addEventListener("offline",function(){updateOfflineBar();});

window.openManualWeather=function(){
  var isEN=D.settings.lang==="en";
  openM('<div class="mt">🌡️ '+(isEN?"Manual Weather Entry":"Vreme manuală")+'</div>'
    +'<div class="r2" style="margin-top:8px;">'
    +'<div>'+L((isEN?"Temperature (°C)":"Temperatură (°C)"))+'<input type="number" inputmode="decimal" id="mwTemp" value="'+(D.weather?D.weather.temp:20)+'"></div>'
    +'<div>'+L((isEN?"Humidity (%)":"Umiditate (%)" ))+'<input type="number" inputmode="numeric" id="mwHum" value="'+(D.weather?D.weather.hum:60)+'"></div>'
    +'</div><div class="r2">'
    +'<div>'+L((isEN?"Wind (km/h)":"Vânt (km/h)"))+'<input type="number" inputmode="numeric" id="mwWind" value="'+(D.weather?D.weather.wind:0)+'"></div>'
    +'<div>'+L((isEN?"Rain?":"Ploaie?"))+'<select id="mwRain"><option value="0">'+(isEN?"No rain":"Fără ploaie")+'</option><option value="1"'+(D.weather&&D.weather.rain?" selected":"")+'>'+(isEN?"Raining":"Plouă")+'</option></select></div>'
    +'</div>'
    +'<div class="br" style="margin-top:12px;">'
    +'<button class="btn" onclick="saveManualWeather()">✓ '+(isEN?"Save":"Salvează")+'</button>'
    +'<button class="btn gh" onclick="closeM()">'+(isEN?"Cancel":"Anulează")+'</button>'
    +'</div>');
};

window.saveManualWeather=function(){
  var temp=parseFloat(($q("mwTemp")||{}).value)||20;
  var hum=parseInt(($q("mwHum")||{}).value)||60;
  var wind=parseInt(($q("mwWind")||{}).value)||0;
  var rain=parseInt(($q("mwRain")||{}).value||"0")===1;
  D.weather={temp:temp,hum:hum,wind:wind,rain:rain,ic:rain?"🌧️":"☀️",wc:0,prec:rain?1:0,ts:Date.now(),manual:true};
  save(false);
  closeM();
  if(curP==="dashboard")renderDashboard();
  toast("🌡️ Vreme salvată manual");
};
function toast(m,ic){ic=ic||"🍯";var el=document.createElement("div");el.className="toast";el.innerHTML=ic+" "+m;document.body.appendChild(el);setTimeout(function(){el.remove();},2700);}

// FIX: Custom confirm modal (replaces native confirm() - WebView compatible)
function showConfirm(msg,onYes,onNo,yesLabel){
  var isEN=D.settings.lang==="en";
  var bg=document.createElement("div");bg.className="mb";bg.id="MB_CONF";
  bg.innerHTML='<div class="mb-b" style="max-width:420px;">'
    +'<div class="mt">⚠️ '+(isEN?"Confirm":"Confirmare")+'</div>'
    +'<p class="confirm-msg">'+msg+'</p>'
    +'<div class="br" style="margin-top:8px;">'
    +'<button class="btn bd" id="confYes">✓ '+(yesLabel||(isEN?"Yes, delete":"Da, șterge"))+'</button>'
    +'<button class="btn gh" id="confNo">✕ '+(isEN?"Cancel":"Anulează")+'</button>'
    +'</div></div>';
  document.body.appendChild(bg);
  document.getElementById("confYes").onclick=function(){bg.remove();if(onYes)onYes();};
  document.getElementById("confNo").onclick=function(){bg.remove();if(onNo)onNo();};
  bg.addEventListener("click",function(e){if(e.target===bg){bg.remove();if(onNo)onNo();}});
}

// FIX: Debounce helper for search inputs
function debounce(fn,delay){
  var timer;
  return function(){
    var a=arguments;
    clearTimeout(timer);
    timer=setTimeout(function(){fn.apply(null,a);},delay);
  };
}
var debouncedHiveSearch=debounce(function(v){renderHives(v);},300);


// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════
// Local calendar date as "YYYY-MM-DD" (toISOString() is UTC: after midnight in Romania it still gives yesterday)
function isoLocal(d){return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");}
function todayISO(){return isoLocal(new Date());}
function doy(y,m,d){return Math.floor((new Date(y,m-1,d)-new Date(y,0,0))/86400000);}
function cdoy(){var n=new Date();return doy(n.getFullYear(),n.getMonth()+1,n.getDate());}
function getLatOffset(){
  // Adjust bloom dates by latitude vs 45.5°N (Central Romania/Europe reference)
  // ~4 days later per degree north, ~4 days earlier per degree south
  if(!D.userLoc)return 0;
  return Math.round((D.userLoc.lat-45.5)*4);
}
function getFlow(){
  var cd=cdoy(),yr=new Date().getFullYear(),off=getLatOffset();
  // main nectar flow blooming now (the one in its peak-nectar period takes priority)
  var act=PLANTS.filter(function(p){return p.cat==="main"&&plState(p,yr,cd,off).inBloom;});
  return act.filter(function(p){return plState(p,yr,cd,off).inPeak;})[0]||act[0]||null;
}
function sBadge(s){
  if(s==="puternic")return'<span class="bg gg">'+t("str_strong")+'</span>';
  if(s==="mediu")return'<span class="bg gy">'+t("str_medium")+'</span>';
  return'<span class="bg gr">'+t("str_weak")+'</span>';
}
function matIc(m){return{Lemn:"🪵",Polistiren:"🧊",Plastic:"🔵",Wood:"🪵",Polystyrene:"🧊"}[m]||"📦";}
// Colony strength (puternic / mediu / slab) — depends on the season:
//  • Active season (April–September): frames with brood — ≥6 strong, 3–5 medium, ≤2 weak.
//  • Cold season (October–March) there is little or no brood, so brood can't be used; the measure is
//    the frames (interspaces) covered by bees — the winter cluster. Dadant frames:
//      October–January: ≥7 strong, 5–6 medium, ≤4 weak  (5 frames of bees going into winter = a normal colony;
//                       Ontario BMP: 7–8 frames of bees are ideal for wintering in cold regions)
//      February–March:  ≥6 strong, 4–5 medium, ≤3 weak  (the cluster shrinks by late winter;
//                       ≥4 occupied interspaces = enough — Apis e.V. Infobrief 2014/03)
//    If the frames with bees aren't known, brood + food frames are used as an estimate.
// strCalc(brood, food, beeFrames, date) — food / beeFrames / date are optional (date = today).
function strCalc(b,food,bees,date){
  var n=parseInt(b)||0,m=parseInt(String(date||todayISO()).slice(5,7))||1;
  if(m>=4&&m<=9)return n>=6?"puternic":n>=3?"mediu":"slab";
  var f=bees!=null&&bees!==""&&!isNaN(parseInt(bees))?parseInt(bees):n+(parseInt(food)||0);
  if(m>=10||m===1)return f>=7?"puternic":f>=5?"mediu":"slab";
  return f>=6?"puternic":f>=4?"mediu":"slab";
}
// Escape for text placed in HTML (value="...", <textarea>): quotes or < in
// names/notes no longer break the forms
function esc(v){if(v===null||v===undefined)return"";return String(v).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;");}
// First letter of a text (and after each <br>) is capitalized — skips emoji, HTML tags, spaces.
// If the text starts with a digit (e.g. a date), it is left unchanged.
function cap(s){
  if(s===null||s===undefined||s==="")return s;
  return String(s).split(/(<br\s*\/?>)/i).map(function(part){
    if(/^<br/i.test(part))return part;
    var inTag=false;
    for(var i=0;i<part.length;i++){
      var ch=part[i];
      if(ch==="<"){inTag=true;continue;}
      if(ch===">"){inTag=false;continue;}
      if(inTag)continue;
      if(ch==="&"){var j=part.indexOf(";",i);if(j>i&&j-i<9){i=j;continue;}}
      if(/[0-9]/.test(ch))return part;
      var up=ch.toLocaleUpperCase("ro"),lo=ch.toLocaleLowerCase("ro");
      if(up!==lo)return part.slice(0,i)+up+part.slice(i+1);
    }
    return part;
  }).join("");
}
// Short text in the current language: L2("română","english")
function L2(ro,en){return D.settings.lang==="en"?en:ro;}
function xv(ex,f,d){return(ex&&ex[f]!==undefined&&ex[f]!==null)?ex[f]:d;}
function L(txt){return'<label class="L">'+txt+'</label>';}
function $q(id){var el=document.getElementById("MB");return el?(el.querySelector("#"+id)||document.getElementById(id)):document.getElementById(id);}
// ── Temperature unit helpers ──────────────────────────────────
function toF(c){return Math.round((c*9/5+32)*10)/10;}
function toC(f){return Math.round(((f-32)*5/9)*10)/10;}
function showTemp(c){
  if(c===null||c===undefined||c==="")return"—";
  var u=D.settings.tempUnit||"C";
  return u==="F"?(toF(c)+"°F"):(c+"°C");
}
function showTempRange(lo,hi){return showTemp(lo)+"–"+showTemp(hi);}
function tempGaugeLabels(){
  return(D.settings.tempUnit||"C")==="F"
    ?["32°F","50°F","68°F","86°F","104°F"]
    :["0°","10°","20°","30°","40°C"];
}
function fmtTempInput(c){
  // For form inputs: value in display unit
  if(c===null||c===undefined||c==="")return"";
  return(D.settings.tempUnit||"C")==="F"?toF(c):c;
}
function parseTempInput(val){
  // Convert form input value back to Celsius for storage
  if(val===null||val===undefined||val==="")return null;
  var n=parseFloat(val);if(isNaN(n))return null;
  return(D.settings.tempUnit||"C")==="F"?toC(n):n;
}
function tempInputLabel(){return(D.settings.tempUnit||"C")==="F"?"🌡️ Temperature (°F)":"🌡️ Temperatură (°C)";}
function setTempUnit(u){D.settings.tempUnit=u;save(false);render();}
function mapWeatherLabel(){
  if(!D.weather||D.weather.wc===undefined)return"";
  var wc=D.weather.wc;var wo=t("wo");
  if(wc===0||wc===1)return wo[0];
  if(wc===2)return wo[1];
  if(wc===3||wc===45||wc===48||(wc>=71&&wc<=75))return wo[2];
  if((wc>=51&&wc<=65)||(wc>=80&&wc<=82)||(wc===61||wc===63||wc===65))return wo[3]; // FIX: explicit rain codes
  if(wc>=95)return wo[5];
  return wo[1];
}
