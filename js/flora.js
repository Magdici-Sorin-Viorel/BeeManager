// BeeManager Pro — flora.js
// 🌼 FLORA — everything about nectar plants, in one place:
//   • the catalog: the built-in Romanian list (MELIFERE, js/plants.js — pure data) + the user's own layer,
//     kept in the database table "flora" (D.flora): plants added by the user, edited dates, hidden plants
//   • the calculations: a plant's state on a day (bloom / nectar peak), the shift by location,
//     the correction from the user's field observations („👀 Am văzut înflorit”, D.bloomObs)
//   • the internal API BM.flora — the Calendar, the hive pages (getFlow), the harvest module and the voice
//     inspection read plants only through it, so a date is computed once and shown the same everywhere.
//
// BM.flora  vetre() · context() · alegeContext(id) · contextStup(id) · cu(ctx, fn) · acasa() · seteazaAcasa(loc)
//           aleMele(ctx?) · eAMea(id) · seteazaAMea(id, da) · vreme.corectie() / actualizeaza()
//           catalog() · toate() · get(id) · principale() · stare(id, zi?) · inFloare(zi?) · urmeaza(zi?)
//           culesCurent() · context() · adauga(p) · editeaza(id, campuri) · ascunde(id, da?) · sterge(id)
//           observatii: aici() · model(an) · deviatie(o) · adauga(planta, faza, data) · sterge(id)
// D.flora rows: {id, custom:true, n, ne, lat, ic, cat, b:[m,d,m,d], pk:[m,d,m,d], nec, pol, kg, nt:[lo,hi], z, dc}
//               or, for a built-in plant, {id, hide:true} and/or only the fields the user changed.

// ── catalog (built-in + user layer), cached until the user layer changes ──
var _flC=null,_flK="";
function flTouch(){_flC=null;plAdjReset();}
STORE.laSchimbare("flora",flTouch);STORE.laSchimbare("bloomObs",function(){plAdjReset();});   // the store tells the caches
function flCatalog(){
  var rows=STORE.tabel("flora").randuri(),key=rows.length?JSON.stringify(rows):"";
  if(_flC&&_flK===key)return _flC;
  var by={};rows.forEach(function(r){if(r&&r.id)by[r.id]=r;});
  var out=MELIFERE.map(function(p){var r=by[p.id];if(!r)return p;var m={};Object.keys(p).forEach(function(k){m[k]=p[k];});
    Object.keys(r).forEach(function(k){if(k!=="id"&&k!=="custom"&&r[k]!==undefined&&r[k]!==null&&r[k]!=="")m[k]=r[k];});m.edited=true;return m;});
  rows.forEach(function(r){if(r&&r.custom&&r.id&&r.b&&r.pk)out.push(r);});
  _flC=out;_flK=key;return out;
}
function flVisible(){return flCatalog().filter(function(p){return !p.hide;});}
function plFind(id){return flCatalog().find(function(p){return p.id===id;})||null;}

// ═══════════════════════════════════════════
// 📍 PLACES (vetre) — where the hives are decides the dates and which plants matter
// ═══════════════════════════════════════════
// A place = {id, nume, tip:"home"|"trip", lat, lon, alt, relief:"c"|"d"|"m", off (days vs the reference plain), coords}
//   • home  = D.settings.homeLoc (set by itself from the first GPS position; „Setează aici” in the calendar)
//   • trips = the migrations in progress / planned (pastorage.js): GPS position saved at the site, or just the
//             relief chosen by hand (câmpie / deal / munte) when the place is not known exactly
// Dates shift ~4 days per degree of latitude and ~3,5 days per 100 m of altitude (reference: plain, 150 m, 45,5°N).
var FL_ALT_REF=150,FL_ALT_DAYS=3.5,FL_LAT_REF=45.5,FL_LAT_DAYS=4;
var FL_RELIEF={c:{n:"câmpie",ic:"🌾",alt:100},d:{n:"deal",ic:"⛰️",alt:400},m:{n:"munte",ic:"🏔️",alt:800}};
function flRelief(alt){return alt==null||isNaN(alt)?null:alt<250?"c":alt<600?"d":"m";}
function flOffOf(lat,alt){return(lat!=null?Math.round((lat-FL_LAT_REF)*FL_LAT_DAYS):0)+(alt!=null?Math.round((alt-FL_ALT_REF)/100*FL_ALT_DAYS):0);}
function flHome(){var h=D.settings&&D.settings.homeLoc;return h&&h.lat!=null?h:(D.userLoc||null);}
function flMkCtx(id,nume,tip,lat,lon,alt,relief,coords){
  var r=relief||flRelief(alt)||"c";
  return{id:id,nume:nume,tip:tip,lat:lat,lon:lon,alt:alt!=null?alt:null,relief:r,reliefNume:FL_RELIEF[r].n,ico:FL_RELIEF[r].ic,off:flOffOf(lat,alt),coords:!!coords};
}
function flHomeCtx(){var h=flHome();return flMkCtx("home","Acasă","home",h?h.lat:null,h?h.lon:null,h&&h.alt!=null?h.alt:null,null,!!h);}
function flTripCtx(p){
  var h=flHome(),has=p.lat!=null&&p.lon!=null;
  var alt=p.alt!=null&&p.alt!==""?parseFloat(p.alt):(p.relief?FL_RELIEF[p.relief].alt:(h&&h.alt!=null?h.alt:null));
  return flMkCtx(p.id,p.location||"Pastorală","trip",has?p.lat:(h?h.lat:null),has?p.lon:(h?h.lon:null),alt,p.relief||null,has);
}
// home first, then the trips in progress and the ones planned for the next 60 days
function flSites(){
  var out=[flHomeCtx()],td=todayISO();
  if(typeof BM==="object"&&BM.pastorala)BM.pastorala.randuri().forEach(function(p){
    var act=typeof pActive==="function"&&pActive(p),soon=p.startDate&&p.startDate>td&&p.startDate<=devAdd(td,60)&&!p.endDate;
    if(act||soon)out.push(flTripCtx(p));});
  return out;
}
// the place the calendar speaks about: the one chosen by the user, else the trip the phone is at, else home
var _flCtxId=null,_flForce=null;
function flCtx(){
  if(_flForce)return _flForce;
  var sites=flSites();
  if(_flCtxId){var c=sites.filter(function(x){return x.id===_flCtxId;})[0];if(c)return c;_flCtxId=null;}
  if(D.userLoc){var near=sites.filter(function(x){return x.tip==="trip"&&x.coords&&plKm(D.userLoc,x)<=15;})[0];if(near)return near;}
  return sites[0];
}
// run fn with another place in force (all the calendar functions follow it)
function flWith(ctx,fn){var o=_flForce;_flForce=ctx;try{return fn();}finally{_flForce=o;}}
function flCtxOfHive(hid){var p=typeof pTripOf==="function"?pTripOf(hid):null;return p?flTripCtx(p):flHomeCtx();}
// the home place is taken from the first GPS position (not while the phone is at a migration site); its altitude follows
function flHomeAuto(){
  var u=D.userLoc;if(!u||!D.settings)return;var h=D.settings.homeLoc;
  if(!h||h.lat==null){
    var atTrip=flSites().some(function(x){return x.tip==="trip"&&x.coords&&plKm(u,x)<=15;});
    if(!atTrip){D.settings.homeLoc={lat:u.lat,lon:u.lon};if(u.alt!=null)D.settings.homeLoc.alt=u.alt;}
  }else if(h.alt==null&&u.alt!=null&&plKm(h,u)<=3)h.alt=u.alt;
}

// ── 🌼 „flora mea”: the plants that matter at a place ──
// By default: the plants of that relief (zn) that are main flows, priority ones or strong secondaries
// (nectar + pollen ≥ 5), plus the user's own plants. The user can add / remove any plant per relief (row.mine = {c,d,m}).
function flAuto(p,relief){
  if(p.custom)return true;
  if((p.zn||"cdm").indexOf(relief)<0)return false;
  return p.cat!=="sec"||(p.nec||0)+(p.pol||0)>=5;
}
function flIsMine(p,ctx){
  var r=(ctx||flCtx()).relief,m=p.mine;
  if(m&&m[r]!=null)return !!m[r];
  if(p.hide)return false;
  return flAuto(p,r);
}
function flMine(ctx){ctx=ctx||flCtx();return flCatalog().filter(function(p){return flIsMine(p,ctx);});}

// ── state of a plant on a day ──
// day of year for a date [month,day] in year y, plus the location offset
function plDoy(y,m,d,off){return doy(y,m,d)+(off||0);}
// state with the field-observation correction applied (used by the calendar and getFlow)
function plState(p,yr,cd,off){
  var A=plAdjModel(yr).adj[p.id]||{s:0,pk:0};
  var s=plDoy(yr,p.b[0],p.b[1],off)+A.s,ps=plDoy(yr,p.pk[0],p.pk[1],off)+A.pk,pe=plDoy(yr,p.pk[2],p.pk[3],off)+A.pk,e=plDoy(yr,p.b[2],p.b[3],off)+A.pk;
  if(ps<s)ps=s;if(e<pe)e=pe;
  var r={s:s,e:e,ps:ps,pe:pe,inBloom:cd>=s&&cd<=e,inPeak:cd>=ps&&cd<=pe,until:s-cd,left:e-cd,adj:A.pk||A.s,own:!!A.own,wx:A.wx||0};
  r.phase=!r.inBloom?(cd<s?"before":"after"):cd<ps?"start":cd<=pe?"peak":"end";
  return r;
}

// ═══════════════════════════════════════════
// 🌡️ THIS YEAR'S WEATHER → how early / late the vegetation is (growing degree-days, base 5 °C)
// ═══════════════════════════════════════════
// One request to Open-Meteo's free archive per place (daily mean temperature, this year + the 5 before it), kept
// in D.settings.flWx and refreshed every 5 days. The warmth gathered since 1 January is compared with the average
// of the previous years: „this year has already reached the sum a normal year reaches N days later” → N days early.
// Used only February–August, clamped to ±15 days; your own observations always win over it.
function flWxKey(c){return c.lat!=null?c.lat.toFixed(1)+","+c.lon.toFixed(1):"";}
function flWxOn(){return !(D.settings.sf&&D.settings.sf.wx===false);}
function flWxFor(c,yr){
  if(!flWxOn()||c.lat==null||yr!==new Date().getFullYear())return null;
  var w=(D.settings.flWx||{})[flWxKey(c)];
  return w&&w.yr===yr&&w.shift!=null?w:null;
}
function flWxCalc(daily,yr){
  // daily = {time:[iso…], temperature_2m_mean:[…]} → {n: day of year of the last value, shift: days (− = earlier)}
  var by={};daily.time.forEach(function(d,i){var t=daily.temperature_2m_mean[i];if(t==null)return;var y=+d.slice(0,4);(by[y]=by[y]||[]).push({n:doy(y,+d.slice(5,7),+d.slice(8,10)),g:Math.max(0,t-5)});});
  var cur=by[yr];if(!cur||!cur.length)return null;
  var n=cur[cur.length-1].n,sum=function(a,upTo){var s=0;a.forEach(function(x){if(x.n<=upTo)s+=x.g;});return s;};
  var now=sum(cur,n),prev=Object.keys(by).map(Number).filter(function(y){return y<yr&&by[y].length>300;});
  if(prev.length<2||n<46||n>243)return{n:n,shift:0,gdd:Math.round(now),ani:prev.length};           // too early in the year / season over
  var normAt=function(d){return prev.reduce(function(s,y){return s+sum(by[y],d);},0)/prev.length;};
  if(normAt(n)<25&&now<25)return{n:n,shift:0,gdd:Math.round(now),ani:prev.length};
  // the day a normal year reaches today's sum
  var eq=n;if(now>normAt(n)){while(eq<n+30&&normAt(eq)<now)eq++;}else{while(eq>n-30&&eq>1&&normAt(eq)>now)eq--;}
  return{n:n,shift:Math.max(-15,Math.min(15,n-eq)),gdd:Math.round(now),normal:Math.round(normAt(n)),ani:prev.length};
}
var _flWxBusy={};
function flWxRefresh(c,done){
  c=c||flCtx();var k=flWxKey(c),yr=new Date().getFullYear();
  if(!flWxOn()||!k||!navigator.onLine||_flWxBusy[k])return;
  var old=(D.settings.flWx||{})[k];if(old&&old.yr===yr&&Date.now()-(old.ts||0)<5*86400000)return;
  _flWxBusy[k]=true;
  var end=isoLocal(new Date(Date.now()-6*86400000));
  fetch("https://archive-api.open-meteo.com/v1/archive?latitude="+c.lat+"&longitude="+c.lon+"&start_date="+(yr-5)+"-01-01&end_date="+end+"&daily=temperature_2m_mean&timezone=auto")
    .then(function(r){if(!r.ok)throw 0;return r.json();})
    .then(function(d){var w=d&&d.daily?flWxCalc(d.daily,yr):null;if(!w)return;w.yr=yr;w.ts=Date.now();
      if(!D.settings.flWx)D.settings.flWx={};D.settings.flWx[k]=w;plAdjReset();save(false);if(done)done(w);})
    .catch(function(){}).then(function(){_flWxBusy[k]=false;});
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
// observations that count at the current place: the ones saved for it, or (older ones) within the radius
function plObsHere(){
  var c=flCtx();
  return STORE.tabel("bloomObs").randuri().filter(function(o){
    if(o.site&&o.site!=="home")return o.site===c.id;
    if(c.tip==="trip"&&!c.coords)return false;                    // a place known only by its relief: only its own observations
    return c.lat==null||o.lat==null||plKm(c,{lat:o.lat,lon:o.lon})<=BLOOM_RADIUS_KM;});
}
// raw deviation of an observation from the calendar (no adjustments), in days
function plObsDev(o){
  var p=plFind(o.plant);if(!p)return null;
  var y=parseInt(o.date.slice(0,4)),off=getLatOffset(),m=parseInt(o.date.slice(5,7)),d=parseInt(o.date.slice(8,10));
  var base=o.phase==="peak"?plDoy(y,p.pk[0],p.pk[1],off):plDoy(y,p.b[0],p.b[1],off);
  return doy(y,m,d)-base;
}
// one model per place + year (hives at home and on a migration are asked in turn) — dropped when anything changes
var _plAdjM={};
function plAdjReset(){_plAdjM={};}
function plAdjModel(yr){
  var cx=flCtx(),W=flWxFor(cx,yr);
  var obs=plObsHere(),key=yr+"|"+obs.length+"|"+obs.map(function(o){return o.id+o.date+o.phase;}).join(",")+"|"+cx.id+"|"+cx.off+"|"+_flK.length+"|"+(W?W.shift+":"+W.n:"");
  if(_plAdjM[key])return _plAdjM[key];
  // 1. past years: per-year mean, weighted toward recent years
  var past={};obs.forEach(function(o){var y=parseInt(o.date.slice(0,4));if(y<yr){var dv=plObsDev(o);if(dv!=null)(past[y]=past[y]||[]).push(dv);}});
  var ys=Object.keys(past).map(Number).sort(function(a,b){return b-a;}),sw=0,sv=0;
  ys.forEach(function(y,i){var w=Math.pow(0.7,i),a=past[y].reduce(function(x,z){return x+z;},0)/past[y].length;sw+=w;sv+=w*a;});
  var B=sw?Math.max(-20,Math.min(20,Math.round(sv/sw))):0;
  // 2. this year: each observation's deviation from the calendar + B
  // 🌡️ this year's weather (accumulated warmth vs. normal years, flwx below): a starting shift for the plants that
  // follow — it fades for plants far in the future (a warm March says little about July)
  var we=function(p){if(!W||!W.shift)return 0;var d=plDoy(yr,p.b[0],p.b[1],0)-W.n;return W.shift*Math.exp(-Math.max(0,d)/75);};
  var cur=obs.filter(function(o){return parseInt(o.date.slice(0,4))===yr;}).map(function(o){
    var p=plFind(o.plant);if(!p)return null;var dv=plObsDev(o);return dv==null?null:{o:o,p:p,raw:dv,dev:dv-B-we(p),anchor:plDoy(yr,p.b[0],p.b[1],0)};}).filter(Boolean);
  var adj={};
  flCatalog().forEach(function(p){
    var own=cur.filter(function(c){return c.p.id===p.id;});
    var st=own.filter(function(c){return c.o.phase==="start";}).pop(),pk=own.filter(function(c){return c.o.phase==="peak";}).pop();
    var r;
    var wp=we(p);
    if(st||pk){r={s:B+wp+(st?st.dev:pk.dev),pk:B+wp+(pk?pk.dev:st.dev),own:true};}
    else{
      var me=plDoy(yr,p.b[0],p.b[1],0),w0=BLOOM_ANCHOR,swt=0,sd=0;
      cur.forEach(function(c){var w=Math.exp(-Math.abs(me-c.anchor)/BLOOM_TAU);swt+=w;sd+=w*c.dev;});
      var sh=swt?sd/(swt+w0):0;
      r={s:B+wp+sh,pk:B+wp+sh,own:false,wx:Math.round(wp)};
    }
    r.s=Math.max(-30,Math.min(30,Math.round(r.s)));r.pk=Math.max(-30,Math.min(30,Math.round(r.pk)));
    adj[p.id]=r;
  });
  var avgCur=cur.length?Math.round(cur.reduce(function(x,c){return x+c.dev;},0)/cur.length):null;
  var avgRaw=cur.length?Math.round(cur.reduce(function(x,c){return x+c.raw;},0)/cur.length):null;   // what you saw vs. the plain calendar
  if(Object.keys(_plAdjM).length>12)_plAdjM={};
  return _plAdjM[key]={adj:adj,B:B,pastYears:ys.length,cur:cur,avgCur:avgCur,avgRaw:avgRaw,wx:W||null};
}

// ═══════════════════════════════════════════
// 🧩 BM.flora — the internal API
// ═══════════════════════════════════════════
var FLORA=(function(){
  var dayParts=function(day){var d=day?new Date(day):new Date();return{yr:d.getFullYear(),cd:doy(d.getFullYear(),d.getMonth()+1,d.getDate())};};
  var dStr=function(yr,dn){var d=new Date(yr,0,dn);return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");};
  var plain=function(p){return{id:p.id,nume:p.n,ic:p.ic,principal:p.cat==="main",cat:p.cat,nectar:p.nec,polen:p.pol,custom:!!p.custom,ascuns:!!p.hide};};
  var norm=function(f){   // user fields → a plant row (numbers as numbers, arrays of 4 / 2)
    var r={};["n","ne","lat","ic","z","dc","kg","cat","zn"].forEach(function(k){if(f[k]!=null&&f[k]!=="")r[k]=String(f[k]).trim();});
    ["nec","pol"].forEach(function(k){if(f[k]!=null&&f[k]!=="")r[k]=Math.max(0,Math.min(3,parseInt(f[k])||0));});
    ["b","pk"].forEach(function(k){if(f[k]&&f[k].length===4)r[k]=f[k].map(function(x){return parseInt(x)||1;});});
    if(f.nt&&f.nt.length===2)r.nt=f.nt.map(function(x){return parseInt(x)||0;});
    return r;};
  var TF=STORE.tabel("flora"),TO=STORE.tabel("bloomObs");
  var rowOf=function(id){return TF.rand(id);};
  var put=function(row){var a=TF.randuri(),i=a.findIndex(function(r){return r.id===row.id;});if(i>=0){a[i]=row;TF.modifica(row);}else TF.adauga(row);};
  return{
    // ── the catalog ──
    catalog:function(){return flCatalog();},                 // all (also hidden) — full plant objects
    toate:function(){return flVisible();},                   // visible plants
    get:function(id){return plFind(id);},
    principale:function(){return flVisible().filter(function(p){return p.cat==="main";});},
    sumar:function(id){var p=plFind(id);return p?plain(p):null;},
    // ── the calendar ──
    // ── places ──
    vetre:function(){return flSites();},                      // home + trips in progress / planned
    context:function(){return flCtx();},                      // the place in force now
    alegeContext:function(id){_flCtxId=id||null;plAdjReset();return flCtx();},
    contextStup:function(hid){return flCtxOfHive(hid);},      // where a hive is now (home or its trip)
    cu:function(ctx,fn){return flWith(ctx,fn);},              // run fn as if at another place
    acasa:function(){return flHomeCtx();},
    seteazaAcasa:function(loc){if(!loc||loc.lat==null)return false;D.settings.homeLoc={lat:loc.lat,lon:loc.lon};if(loc.alt!=null)D.settings.homeLoc.alt=loc.alt;plAdjReset();save(false);return true;},
    relief:function(alt){return flRelief(alt);},
    // ── flora mea ──
    aleMele:function(ctx){return flMine(ctx);},
    eAMea:function(id,ctx){var p=plFind(id);return !!p&&flIsMine(p,ctx);},
    seteazaAMea:function(id,da,ctx){var p=plFind(id);if(!p)return false;var r=rowOf(id)||{id:id},k=(ctx||flCtx()).relief;
      if(p.custom)r.custom=true;r.mine=Object.assign({},r.mine||{});
      if(!!da===flAuto(p,k)&&!p.hide)delete r.mine[k];else r.mine[k]=da?1:0;       // same as the default → no override kept
      if(!Object.keys(r.mine).length)delete r.mine;
      if(Object.keys(r).length===1)TF.sterge(id);else put(r);save(false);return true;},
    // ── this year's weather correction ──
    vreme:{pornita:function(){return flWxOn();},corectie:function(ctx){return flWxFor(ctx||flCtx(),new Date().getFullYear());},actualizeaza:function(ctx,done){flWxRefresh(ctx,done);}},
    // state of a plant on a day (ISO date or nothing = today): raw calendar + corrections + dates as strings
    stare:function(id,day){var p=typeof id==="string"?plFind(id):id;if(!p)return null;var dp=dayParts(day),st=plState(p,dp.yr,dp.cd,getLatOffset());
      st.inFloare=st.inBloom;st.varf=st.inPeak;st.inZile=st.until;st.ramase=st.left;
      st.start=dStr(dp.yr,st.s);st.sfarsit=dStr(dp.yr,st.e);st.varfStart=dStr(dp.yr,st.ps);st.varfSfarsit=dStr(dp.yr,st.pe);return st;},
    inFloare:function(day){var dp=dayParts(day),off=getLatOffset();
      return flMine().filter(function(p){return plState(p,dp.yr,dp.cd,off).inBloom;}).map(function(p){var s=plState(p,dp.yr,dp.cd,off);return{id:p.id,nume:p.n,principal:p.cat==="main",varf:!!s.inPeak};});},
    urmeaza:function(day){var dp=dayParts(day),off=getLatOffset();
      return flMine().map(function(p){var s=plState(p,dp.yr,dp.cd,off);return{id:p.id,nume:p.n,principal:p.cat==="main",inZile:s.until};}).filter(function(x){return x.inZile>0;}).sort(function(a,b){return a.inZile-b.inZile;});},
    // main nectar flow blooming now (the one in its peak-nectar period takes priority) — full plant object or null
    culesCurent:function(day){var dp=dayParts(day),off=getLatOffset();
      var act=flMine().filter(function(p){return p.cat==="main"&&plState(p,dp.yr,dp.cd,off).inBloom;});
      return act.filter(function(p){return plState(p,dp.yr,dp.cd,off).inPeak;})[0]||act[0]||null;},
    // ── the user's layer ──
    adauga:function(f){var r=norm(f);if(!r.n||!r.b||!r.pk)return null;r.id="u_"+uid();r.custom=true;if(!r.ic)r.ic="🌼";if(!r.cat)r.cat="sec";if(r.nec==null)r.nec=2;if(r.pol==null)r.pol=2;if(!r.nt)r.nt=[16,30];put(r);save(false);return r.id;},
    editeaza:function(id,f){var p=plFind(id);if(!p)return false;var r=rowOf(id)||{id:id},n=norm(f);Object.keys(n).forEach(function(k){r[k]=n[k];});if(p.custom)r.custom=true;put(r);save(false);return true;},
    reseteaza:function(id){var p=plFind(id);if(!p||p.custom)return false;TF.sterge(id);save(false);return true;},
    ascunde:function(id,da){var p=plFind(id);if(!p)return false;var r=rowOf(id)||{id:id};if(da===false)delete r.hide;else r.hide=true;
      if(p.custom)r.custom=true;if(!r.hide&&Object.keys(r).length===1)TF.sterge(id);else put(r);save(false);return true;},
    sterge:function(id){var p=plFind(id);if(!p||!p.custom)return false;TF.sterge(id);save(false);return true;},
    // ── field observations ──
    observatii:{
      toate:function(){return TO.randuri();},
      aici:function(){return plObsHere();},
      model:function(yr){return plAdjModel(yr||new Date().getFullYear());},
      deviatie:function(o){return plObsDev(o);},
      adauga:function(plant,phase,date){
        if(!plFind(plant)||!date)return null;
        var yr=date.slice(0,4),here=plObsHere();
        // same plant + phase + year in the same area → replaced
        TO.pastreaza(function(o){return !(o.plant===plant&&o.phase===phase&&o.date.slice(0,4)===yr&&here.indexOf(o)>=0);});
        var c=flCtx(),o={id:uid(),plant:plant,phase:phase,date:date,lat:c.coords?c.lat:null,lon:c.coords?c.lon:null,site:c.id};
        TO.adauga(o);save(false);return o.id;},
      sterge:function(id){TO.sterge(id);save(false);}
    }
  };
})();
if(typeof BM==="object"&&BM){BM.flora=FLORA;}
