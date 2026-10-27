// BeeManager Pro — nav.js
// Navigation (sidebar, bottom bar, drawer), go(), render(), modal

// ═══════════════════════════════════════════
// NAV — desktop sidebar + mobile bottom bar
// ═══════════════════════════════════════════
var PGS_DEFAULT=[
  {id:"dashboard",lk:"nav_dashboard",i:"fa-chart-line"},
  {id:"hives",lk:"nav_hives",i:"fa-house"},
  {id:"queens",lk:"nav_queens",i:"fa-crown"},
  {id:"inspections",lk:"nav_inspections",i:"fa-book-open"},
  {id:"honey",lk:"nav_honey",i:"fa-droplet"},
  {id:"hranire",lk:"nav_hranire",i:"fa-bowl-rice"},
  {id:"treatments",lk:"nav_treatments",i:"fa-syringe"},
  {id:"varroa",lk:"nav_varroa",i:"fa-bug"},
  {id:"pastorare",lk:"nav_pastorare",i:"fa-truck"},
  {id:"inventory",lk:"nav_inventory",i:"fa-boxes-stacked"},
  {id:"calendar",lk:"nav_calendar",i:"fa-calendar-days"},
  {id:"analytics",lk:"nav_analytics",i:"fa-chart-bar"},
  {id:"calculator",lk:"nav_calculator",i:"fa-calculator"},
  {id:"financiar",lk:"nav_financiar",i:"fa-coins"},
  {id:"sarcini",lk:"nav_sarcini",i:"fa-list-check"},
  {id:"genealogie",lk:"nav_genealogie",i:"fa-sitemap"},
  {id:"settings",lk:"nav_settings",i:"fa-sliders"}
];
// Displayed menu = PGS_DEFAULT minus disabled modules (config.js), in the order
// you chose in Setări → Ordinea meniului (D.settings.menuOrder).
//  - start page (HOME) = first menu item
//  - on phone: first 4 items in the bottom bar, the rest under „Mai mult”
var PGS=[],HOME="hives",MOB_PRIMARY=[];
function applyMenuOrder(){
  var avail=PGS_DEFAULT.filter(function(p){return modOn(p.id);});
  var order=(D&&D.settings&&D.settings.menuOrder)||[];
  var byId={};avail.forEach(function(p){byId[p.id]=p;});
  var res=[];
  order.forEach(function(id){if(byId[id]){res.push(byId[id]);delete byId[id];}});
  avail.forEach(function(p){if(byId[p.id])res.push(p);}); // new / unchosen menu items → at the end
  PGS=res;
  HOME=PGS.length?PGS[0].id:"hives";
  MOB_PRIMARY=PGS.slice(0,4).map(function(p){return p.id;});
}
applyMenuOrder();

// ═══════════════════════════════════════════
// SIDEBAR COLLAPSE (desktop only)
// ═══════════════════════════════════════════
var sbColl=false;
function applySBState(){
  var sb=document.getElementById("sb");
  var main=document.querySelector(".main");
  var ico=document.getElementById("sbTogIco");
  if(!sb||window.innerWidth<=650)return;
  if(sbColl){
    sb.classList.add("coll");
    if(main)main.style.marginLeft="58px";
    if(ico){ico.className="fas fa-chevron-right";}
  } else {
    sb.classList.remove("coll");
    if(main)main.style.marginLeft="";
    if(ico){ico.className="fas fa-chevron-left";}
  }
}
window.toggleSB=function(){
  if(!SIDEBAR_COLLAPSIBLE){sbColl=false;applySBState();return;}
  sbColl=!sbColl;
  try{localStorage.setItem("sbColl",sbColl?"1":"");}catch(e){}
  applySBState();
};

// 4 primary items shown in bottom bar; rest go in "More" drawer

var curP=HOME;
var _moreOpen=false;

function openMoreDrw(){
  if(!_moreOpen)mHistPush("drawer");
  _moreOpen=true;
  document.getElementById("moreDrw").classList.add("open");
  document.getElementById("moreOv").classList.add("show");
}
window.closeMoreDrw=function(after){
  var wasOpen=_moreOpen;
  _moreOpen=false;
  document.getElementById("moreDrw").classList.remove("open");
  document.getElementById("moreOv").classList.remove("show");
  if(wasOpen)mHistPop("drawer",after);else if(after)after();
};

function buildNav(){
  // ── Desktop sidebar nav ──────────────────────────────────────
  var html=PGS.map(function(p){
    return'<div class="ni'+(p.id===curP?" on":"")+'" title="'+t(p.lk)+'" onclick="go(\''+p.id+'\')"><i class="fas '+p.i+'"></i><span>'+t(p.lk)+'</span></div>';
  }).join("");
  document.getElementById("nav").innerHTML=html;

  // ── Mobile bottom nav ────────────────────────────────────────
  var mobNav=document.getElementById("mobNav");
  if(!mobNav)return;
  var primaryPgs=PGS.filter(function(p){return MOB_PRIMARY.indexOf(p.id)!==-1;});
  var morePgs=PGS.filter(function(p){return MOB_PRIMARY.indexOf(p.id)===-1;});
  var moreActive=morePgs.some(function(p){return p.id===curP;});

  // Bottom bar: 4 items + More button
  mobNav.innerHTML=primaryPgs.map(function(p){
    return'<button class="mob-ni'+(curP===p.id?" active":"")+'" onclick="go(\''+p.id+'\')">'
      +'<i class="fas '+p.i+'"></i><span>'+t(p.lk)+'</span></button>';
  }).join("")
  +'<button class="mob-ni'+(_moreOpen||moreActive?" active":"")+'" id="moreBtnNav" onclick="_moreOpen?closeMoreDrw():openMoreDrw()">'
    +'<i class="fas fa-ellipsis"></i><span>'+(D.settings.lang==="en"?"More":"Mai mult")+'</span></button>';

  // More drawer grid
  var grid=document.getElementById("moreDrwGrid");
  if(grid){
    grid.innerHTML=morePgs.map(function(p){
      return'<button class="drw-ni'+(curP===p.id?" active":"")+'" onclick="go(\''+p.id+'\')">'
        +'<i class="fas '+p.i+'"></i><span>'+t(p.lk)+'</span></button>';
    }).join("");
  }
}

function go(p){
  // If a form is open, close it first (asking if it has unsaved data)
  if(document.getElementById("MB")){requestCloseM(function(){go(p);});return;}
  // „Mai mult” drawer open: close it first, then change page
  if(_moreOpen){closeMoreDrw(function(){go(p);});return;}
  // Varroa is a tab inside „Tratamente”
  if(p==="varroa"&&!modOn("varroa")&&modOn("treatments")){_trTab="counts";p="treatments";}
  else if(p==="treatments"&&curP!=="treatments")_trTab="treat";
  if(p==="settings"&&curP!=="settings"&&typeof _seSec!=="undefined")_seSec=null;   // Settings opens on its menu
  if(!modOn(p))p=HOME;
  curP=p;
  closeMoreDrw();
  buildNav();
  var pg=PGS.find(function(x){return x.id===p;});
  var tbt=document.getElementById("tbt");
  if(tbt){tbt.innerHTML=pg?'<i class="fas '+pg.i+'" style="margin-right:7px;opacity:.85;"></i>'+t(pg.lk):p;}
  // Update topbar weather mini-widget
  var twi=document.getElementById("tbWIcon");
  var twt=document.getElementById("tbWTemp");
  if(twi&&twt&&D.weather){twi.textContent=D.weather.ic||"🌡️";twt.textContent=D.weather.temp+"°";}
  // Current page shows in the URL (#varroa etc.): reloading keeps the same menu
  try{if(location.hash!=="#"+p)history.replaceState(null,"","#"+p);}catch(e){}
  render();
}

// Start page from URL: index.html#varroa opens Varroa directly
function pageFromHash(){
  var h=(location.hash||"").replace("#","");
  return PGS.some(function(x){return x.id===h;})?h:HOME;
}
window.addEventListener("hashchange",function(){var p=pageFromHash();if(p!==curP)go(p);});

var RENDERERS=function(){return{dashboard:renderDashboard,hives:renderHives,queens:renderQueens,inspections:renderInspections,honey:renderHoney,hranire:renderHranire,treatments:renderTreatments,varroa:renderVarroa,inventory:renderInventory,calendar:renderCalendar,analytics:renderAnalytics,calculator:renderCalculator,financiar:renderFinanciar,sarcini:renderSarcini,settings:renderSettings,pastorare:renderPastorage,genealogie:renderGenealogy};};
function render(){var r=RENDERERS();(r[curP]||r[HOME])();}
function setP(h){document.getElementById("pg").innerHTML=h;}
function closeSB(){document.getElementById("sb").classList.remove("open");document.getElementById("ov").classList.remove("show");}
function setLang(l){D.settings.lang=l;applyTheme();save(false);buildNav();render();}

// ═══════════════════════════════════════════
// MODAL
// ═══════════════════════════════════════════
// How to leave a form:
//  - the ✕ button (top, stays visible while scrolling)
//  - Android „Înapoi” (button or gesture) / Esc key on desktop
//  - tapping outside the form
//  - Anulează / Salvează (as before)
// If you filled something in and leave without saving, the app asks first.
// „Salvează” and „Anulează” close directly (they use closeM()).

// ── Phone „Înapoi”: each form / drawer pushes a history step,
//    so the Back button closes it instead of exiting the app.
var _mHist=null;      // "modal" | "drawer" | null — who owns the history step
var _popIgnore=0;     // steps popped by us (not by the user)
var _pendingPush=null; // form opened while a back step was still pending
function mHistPush(owner){
  if(_mHist){_mHist=owner;return;}
  if(_popIgnore>0){_pendingPush=owner;return;}
  try{history.pushState({bm:owner},"",location.href);_mHist=owner;}catch(e){}
}
function mFlushPending(){
  if(!_pendingPush||_popIgnore>0)return;
  var o=_pendingPush;_pendingPush=null;
  if(document.getElementById("MB")||_moreOpen)mHistPush(o);
}
var _popAfter=[];     // what runs after the step is popped (e.g. page change)
function mHistPop(owner,after){
  if(_mHist!==owner){if(after)after();return;}
  _mHist=null;
  var done=false,run=function(){if(done)return;done=true;if(after)after();};
  _popIgnore++;_popAfter.push(run);
  // safety: if the browser does not confirm the back step, continue anyway
  setTimeout(function(){var i=_popAfter.indexOf(run);if(i>=0){_popAfter.splice(i,1);_popIgnore=Math.max(0,_popIgnore-1);run();mFlushPending();}},700);
  try{history.back();}catch(e){var i=_popAfter.indexOf(run);if(i>=0)_popAfter.splice(i,1);_popIgnore=Math.max(0,_popIgnore-1);run();}
}
window.addEventListener("popstate",function(){
  if(_popIgnore>0){_popIgnore--;var f=_popAfter.shift();if(f)f();mFlushPending();return;}
  _mHist=null;
  // 1. „ieși fără să salvezi?” confirm dialog → stay in the form
  var conf=document.getElementById("MB_CONF");
  if(conf){var no=document.getElementById("confNo");if(no)no.click();else conf.remove();if(document.getElementById("MB"))mHistPush("modal");return;}
  // 2. the form
  if(document.getElementById("MB")){requestCloseM(null,true);return;}
  // 3. the „Mai mult” drawer
  if(_moreOpen){_moreOpen=false;document.getElementById("moreDrw").classList.remove("open");document.getElementById("moreOv").classList.remove("show");buildNav();return;}
  // 4. a Settings page → back to the Settings menu
  if(curP==="settings"&&typeof _seSec!=="undefined"&&_seSec){_seSec=null;renderSettings();window.scrollTo(0,0);}
});
document.addEventListener("keydown",function(e){
  if(e.key!=="Escape")return;
  var conf=document.getElementById("MB_CONF");
  if(conf){var no=document.getElementById("confNo");if(no)no.click();return;}
  if(document.getElementById("MB")){requestCloseM();return;}
  if(_moreOpen)closeMoreDrw();
});

var _mDirty=false;    // was anything filled in the form?
function openM(html){
  // Auto-collapse sidebar to give more space
  if(SIDEBAR_COLLAPSIBLE&&!sbColl){sbColl=true;try{localStorage.setItem("sbColl","1");}catch(e){}applySBState();}
  var old=document.getElementById("MB");
  if(old)old.remove();                 // form redrawn (e.g. sale) → keep the history step
  else mHistPush("modal");
  _mDirty=false;
  var isEN=D.settings.lang==="en";
  var bg=document.createElement("div");bg.className="mb";bg.id="MB";
  bg.innerHTML='<div class="mb-b">'
    +'<div class="mb-xw"><button type="button" class="mb-x" onclick="requestCloseM()" title="'+(isEN?"Close":"Închide")+'" aria-label="'+(isEN?"Close":"Închide")+'">✕</button></div>'
    +html+'</div>';
  document.body.appendChild(bg);
  bg.addEventListener("click",function(e){if(e.target===bg)requestCloseM();});
  bg.addEventListener("input",function(){_mDirty=true;});
  bg.addEventListener("change",function(){_mDirty=true;});

  // ── ScrollIntoView on focus for any input field ─────────────
  bg.addEventListener("focusin",function(e){
    var el=e.target;
    if(!el||!["INPUT","SELECT","TEXTAREA"].includes(el.tagName))return;
    setTimeout(function(){
      el.scrollIntoView({behavior:"smooth",block:"center"});
    },320);
  });

  // FIX: Auto-focus first input in modal for better UX
  setTimeout(function(){
    var first=bg.querySelector('input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"]):not([type="date"]),select');
    if(first){try{first.focus();}catch(e){}}
  },120);
  // FIX: Enter key submits form in modal (except textarea)
  bg.addEventListener("keydown",function(e){
    if(e.key!=="Enter"||e.target.tagName==="TEXTAREA"||e.target.tagName==="SELECT")return;
    var saveBtn=bg.querySelector(".btn.sm.gh")?null:bg.querySelector('.mb-b .btn:not(.gh):not(.bd)');
    if(saveBtn){e.preventDefault();saveBtn.click();}
  });
}
function closeM(after){
  var el=document.getElementById("MB");if(el)el.remove();
  _mDirty=false;
  mHistPop("modal",typeof after==="function"?after:null);
}
// Close requested by the user (✕, Back, Esc, tap outside, menu change)
// after = what to do after closing; fromBack = Back already pressed
function requestCloseM(after,fromBack){
  if(!document.getElementById("MB")){if(after)after();return;}
  if(!_mDirty){closeM(after);return;}
  if(fromBack)mHistPush("modal");      // the form stays open until they answer
  var isEN=D.settings.lang==="en";
  showConfirm(isEN?"You have unsaved changes. Leave without saving?":"Ai date nesalvate în formular. Ieși fără să salvezi?",
    function(){closeM(after);},
    null,
    isEN?"Yes, leave":"Da, ieși");
}
