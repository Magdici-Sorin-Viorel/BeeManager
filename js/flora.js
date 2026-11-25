// BeeManager Pro — flora.js
// 🌼 FLORA — everything about nectar plants, in one place:
//   • the catalog: the built-in Romanian list (MELIFERE, js/plants.js — pure data) + the user's own layer,
//     kept in the database table "flora" (D.flora): plants added by the user, edited dates, hidden plants
//   • the calculations: a plant's state on a day (bloom / nectar peak), the shift by location,
//     the correction from the user's field observations („👀 Am văzut înflorit”, D.bloomObs)
//   • the internal API BM.flora — the Calendar, the Dashboard (getFlow), the harvest module and the voice
//     inspection read plants only through it, so a date is computed once and shown the same everywhere.
//
// BM.flora  catalog() · toate() · get(id) · principale() · stare(id, zi?) · inFloare(zi?) · urmeaza(zi?)
//           culesCurent() · context() · adauga(p) · editeaza(id, campuri) · ascunde(id, da?) · sterge(id)
//           observatii: aici() · model(an) · deviatie(o) · adauga(planta, faza, data) · sterge(id)
// D.flora rows: {id, custom:true, n, ne, lat, ic, cat, b:[m,d,m,d], pk:[m,d,m,d], nec, pol, kg, nt:[lo,hi], z, dc}
//               or, for a built-in plant, {id, hide:true} and/or only the fields the user changed.

// ── catalog (built-in + user layer), cached until the user layer changes ──
var _flC=null,_flK="";
function flTouch(){_flC=null;_plAdjC=null;}
function flCatalog(){
  var rows=D.flora||[],key=rows.length?JSON.stringify(rows):"";
  if(_flC&&_flK===key)return _flC;
  var by={};rows.forEach(function(r){if(r&&r.id)by[r.id]=r;});
  var out=MELIFERE.map(function(p){var r=by[p.id];if(!r)return p;var m={};Object.keys(p).forEach(function(k){m[k]=p[k];});
    Object.keys(r).forEach(function(k){if(k!=="id"&&k!=="custom"&&r[k]!==undefined&&r[k]!==null&&r[k]!=="")m[k]=r[k];});m.edited=true;return m;});
  rows.forEach(function(r){if(r&&r.custom&&r.id&&r.b&&r.pk)out.push(r);});
  _flC=out;_flK=key;return out;
}
function flVisible(){return flCatalog().filter(function(p){return !p.hide;});}
function plFind(id){return flCatalog().find(function(p){return p.id===id;})||null;}

// ── state of a plant on a day ──
// day of year for a date [month,day] in year y, plus the location offset
function plDoy(y,m,d,off){return doy(y,m,d)+(off||0);}
// a plant's state on day cd: {phase, until, left, s, e, ps, pe, inBloom, inPeak} (raw calendar, no corrections)
function plStateRaw(p,yr,cd,off){
  var s=plDoy(yr,p.b[0],p.b[1],off),e=plDoy(yr,p.b[2],p.b[3],off),ps=plDoy(yr,p.pk[0],p.pk[1],off),pe=plDoy(yr,p.pk[2],p.pk[3],off);
  var r={s:s,e:e,ps:ps,pe:pe,inBloom:cd>=s&&cd<=e,inPeak:cd>=ps&&cd<=pe,until:s-cd,left:e-cd};
  r.phase=!r.inBloom?(cd<s?"before":"after"):cd<ps?"start":cd<=pe?"peak":"end";
  return r;
}
// state with the field-observation correction applied (used by the calendar and getFlow)
function plState(p,yr,cd,off){
  var A=plAdjModel(yr).adj[p.id]||{s:0,pk:0};
  var s=plDoy(yr,p.b[0],p.b[1],off)+A.s,ps=plDoy(yr,p.pk[0],p.pk[1],off)+A.pk,pe=plDoy(yr,p.pk[2],p.pk[3],off)+A.pk,e=plDoy(yr,p.b[2],p.b[3],off)+A.pk;
  if(ps<s)ps=s;if(e<pe)e=pe;
  var r={s:s,e:e,ps:ps,pe:pe,inBloom:cd>=s&&cd<=e,inPeak:cd>=ps&&cd<=pe,until:s-cd,left:e-cd,adj:A.pk||A.s,own:!!A.own};
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
// raw deviation of an observation from the calendar (no adjustments), in days
function plObsDev(o){
  var p=plFind(o.plant);if(!p)return null;
  var y=parseInt(o.date.slice(0,4)),off=getLatOffset(),m=parseInt(o.date.slice(5,7)),d=parseInt(o.date.slice(8,10));
  var base=o.phase==="peak"?plDoy(y,p.pk[0],p.pk[1],off):plDoy(y,p.b[0],p.b[1],off);
  return doy(y,m,d)-base;
}
var _plAdjC=null,_plAdjK="";
function plAdjModel(yr){
  var obs=plObsHere(),key=yr+"|"+obs.length+"|"+obs.map(function(o){return o.id+o.date+o.phase;}).join(",")+"|"+(D.userLoc?D.userLoc.lat.toFixed(2):"")+"|"+_flK.length;
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
  flCatalog().forEach(function(p){
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

// ═══════════════════════════════════════════
// 🧩 BM.flora — the internal API
// ═══════════════════════════════════════════
var FLORA=(function(){
  var dayParts=function(day){var d=day?new Date(day):new Date();return{yr:d.getFullYear(),cd:doy(d.getFullYear(),d.getMonth()+1,d.getDate())};};
  var dStr=function(yr,dn){var d=new Date(yr,0,dn);return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");};
  var plain=function(p){return{id:p.id,nume:p.n,ic:p.ic,principal:p.cat==="main",cat:p.cat,nectar:p.nec,polen:p.pol,custom:!!p.custom,ascuns:!!p.hide};};
  var norm=function(f){   // user fields → a plant row (numbers as numbers, arrays of 4 / 2)
    var r={};["n","ne","lat","ic","z","dc","kg","cat"].forEach(function(k){if(f[k]!=null&&f[k]!=="")r[k]=String(f[k]).trim();});
    ["nec","pol"].forEach(function(k){if(f[k]!=null&&f[k]!=="")r[k]=Math.max(0,Math.min(3,parseInt(f[k])||0));});
    ["b","pk"].forEach(function(k){if(f[k]&&f[k].length===4)r[k]=f[k].map(function(x){return parseInt(x)||1;});});
    if(f.nt&&f.nt.length===2)r.nt=f.nt.map(function(x){return parseInt(x)||0;});
    return r;};
  var rowOf=function(id){return(D.flora||[]).find(function(r){return r.id===id;})||null;};
  var put=function(row){if(!D.flora)D.flora=[];var i=D.flora.findIndex(function(r){return r.id===row.id;});if(i>=0)D.flora[i]=row;else D.flora.push(row);flTouch();};
  return{
    // ── the catalog ──
    catalog:function(){return flCatalog();},                 // all (also hidden) — full plant objects
    toate:function(){return flVisible();},                   // visible plants
    get:function(id){return plFind(id);},
    principale:function(){return flVisible().filter(function(p){return p.cat==="main";});},
    sumar:function(id){var p=plFind(id);return p?plain(p):null;},
    // ── the calendar ──
    context:function(){return{lat:D.userLoc?D.userLoc.lat:null,lon:D.userLoc?D.userLoc.lon:null,off:getLatOffset()};},
    // state of a plant on a day (ISO date or nothing = today): raw calendar + corrections + dates as strings
    stare:function(id,day){var p=typeof id==="string"?plFind(id):id;if(!p)return null;var dp=dayParts(day),st=plState(p,dp.yr,dp.cd,getLatOffset());
      st.inFloare=st.inBloom;st.varf=st.inPeak;st.inZile=st.until;st.ramase=st.left;
      st.start=dStr(dp.yr,st.s);st.sfarsit=dStr(dp.yr,st.e);st.varfStart=dStr(dp.yr,st.ps);st.varfSfarsit=dStr(dp.yr,st.pe);return st;},
    inFloare:function(day){var dp=dayParts(day),off=getLatOffset();
      return flVisible().filter(function(p){return plState(p,dp.yr,dp.cd,off).inBloom;}).map(function(p){var s=plState(p,dp.yr,dp.cd,off);return{id:p.id,nume:p.n,principal:p.cat==="main",varf:!!s.inPeak};});},
    urmeaza:function(day){var dp=dayParts(day),off=getLatOffset();
      return flVisible().map(function(p){var s=plState(p,dp.yr,dp.cd,off);return{id:p.id,nume:p.n,principal:p.cat==="main",inZile:s.until};}).filter(function(x){return x.inZile>0;}).sort(function(a,b){return a.inZile-b.inZile;});},
    // main nectar flow blooming now (the one in its peak-nectar period takes priority) — full plant object or null
    culesCurent:function(day){var dp=dayParts(day),off=getLatOffset();
      var act=flVisible().filter(function(p){return p.cat==="main"&&plState(p,dp.yr,dp.cd,off).inBloom;});
      return act.filter(function(p){return plState(p,dp.yr,dp.cd,off).inPeak;})[0]||act[0]||null;},
    // ── the user's layer ──
    adauga:function(f){var r=norm(f);if(!r.n||!r.b||!r.pk)return null;r.id="u_"+uid();r.custom=true;if(!r.ic)r.ic="🌼";if(!r.cat)r.cat="sec";if(r.nec==null)r.nec=2;if(r.pol==null)r.pol=2;if(!r.nt)r.nt=[16,30];put(r);save(false);return r.id;},
    editeaza:function(id,f){var p=plFind(id);if(!p)return false;var r=rowOf(id)||{id:id},n=norm(f);Object.keys(n).forEach(function(k){r[k]=n[k];});if(p.custom)r.custom=true;put(r);save(false);return true;},
    reseteaza:function(id){var p=plFind(id);if(!p||p.custom)return false;D.flora=(D.flora||[]).filter(function(r){return r.id!==id;});flTouch();save(false);return true;},
    ascunde:function(id,da){var p=plFind(id);if(!p)return false;var r=rowOf(id)||{id:id};if(da===false)delete r.hide;else r.hide=true;
      if(p.custom)r.custom=true;if(!r.hide&&Object.keys(r).length===1)D.flora=(D.flora||[]).filter(function(x){return x.id!==id;});else put(r);flTouch();save(false);return true;},
    sterge:function(id){var p=plFind(id);if(!p||!p.custom)return false;D.flora=(D.flora||[]).filter(function(r){return r.id!==id;});flTouch();save(false);return true;},
    // ── field observations ──
    observatii:{
      aici:function(){return plObsHere();},
      model:function(yr){return plAdjModel(yr||new Date().getFullYear());},
      deviatie:function(o){return plObsDev(o);},
      adauga:function(plant,phase,date){
        if(!plFind(plant)||!date)return null;if(!D.bloomObs)D.bloomObs=[];
        var yr=date.slice(0,4),here=plObsHere();
        // same plant + phase + year in the same area → replaced
        D.bloomObs=D.bloomObs.filter(function(o){return !(o.plant===plant&&o.phase===phase&&o.date.slice(0,4)===yr&&here.indexOf(o)>=0);});
        var o={id:uid(),plant:plant,phase:phase,date:date,lat:D.userLoc?D.userLoc.lat:null,lon:D.userLoc?D.userLoc.lon:null};
        D.bloomObs.push(o);_plAdjC=null;save(false);return o.id;},
      sterge:function(id){D.bloomObs=(D.bloomObs||[]).filter(function(o){return o.id!==id;});_plAdjC=null;save(false);}
    }
  };
})();
if(typeof BM==="object"&&BM){BM.flora=FLORA;}
