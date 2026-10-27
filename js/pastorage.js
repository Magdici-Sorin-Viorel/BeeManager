// BeeManager Pro — pastorage.js
// 🚚 Migration (since 26.10.2026): a TRIP = several hives moved to a location for a nectar flow.
//   {id, trip:true, hiveIds:[], location, target, startDate, plannedEnd, returned:{hiveId:date}, endDate, notes}
//   • while away, the hive shows in Stupi only as a small band („🚚 în pastorare”); the full card
//     (inspections, supers with % capped) is on the Pastorare page
//   • inspections made while away get pastId + pastLoc („🚚 în pastorare · Lunca”)
//   • 🏁 Return: tick the hives coming home (or all) → returned[hiveId]; all returned → endDate
// Old records (one hive, hiveId, endDate = planned return) are read the same way.

function pToday(){return todayISO();}
function pHives(p){return p.hiveIds&&p.hiveIds.length?p.hiveIds.slice():(p.hiveId?[p.hiveId]:[]);}
function pAway(p,hid,day){
  day=day||pToday();
  if(pHives(p).indexOf(hid)<0||!p.startDate||p.startDate>day)return false;
  if(p.returned&&p.returned[hid]&&p.returned[hid]<=day)return false;
  if(p.trip)return !p.endDate||p.endDate>day;
  return !p.endDate||p.endDate>=day;   // old record
}
function pAwayHives(p,day){return pHives(p).filter(function(h){return pAway(p,h,day);});}
function pActive(p){return pAwayHives(p).length>0;}
function pTripOf(hid,day){return(D.pastorage||[]).filter(function(p){return pAway(p,hid,day);}).sort(function(a,b){return a.startDate<b.startDate?1:-1;})[0]||null;}
function pDays(p){return Math.max(0,Math.round((new Date(pToday())-new Date(p.startDate))/86400000));}
function pLocations(){var a=[];(D.pastorage||[]).forEach(function(p){if(p.location&&a.indexOf(p.location)<0)a.push(p.location);});return a;}
function pHiveName(id){var h=D.hives.find(function(x){return x.id===id;})||genFind(id);return h?h.name:"—";}

// ═══════════════════════════════════════════
// PASTORARE PAGE
// ═══════════════════════════════════════════
function pTripHeadHTML(p){
  var away=pAwayHives(p),back=pHives(p).filter(function(h){return away.indexOf(h)<0;});
  return'<div class="c ps-trip">'
    +'<div class="ps-th"><div><div class="ps-loc">📍 '+esc(p.location||"—")+'</div>'
    +'<div class="hv-ts">🌸 '+esc(p.target||"—")+' · '+L2("plecat pe","left on")+' '+devFmt(p.startDate)+' · <b>'+pDays(p)+' '+t("hv_days")+'</b>'
    +(p.plannedEnd?' · 🏁 '+L2("întoarcere","return")+' ~'+devFmt(p.plannedEnd):'')+'</div></div>'
    +'<span class="bg gg">🚚 '+away.length+' '+(away.length===1?L2("stup","hive"):L2("stupi","hives"))+'</span></div>'
    +(back.length?'<div class="hv-ts">🏠 '+L2("Întorși deja","Already back")+': '+back.map(function(h){return esc(pHiveName(h))+' ('+devFmt(p.returned[h])+')';}).join(", ")+'</div>':'')
    +(p.notes?'<div class="hv-ts" style="font-style:italic;">📝 '+esc(p.notes)+'</div>':'')
    +'<div class="ps-btns"><button class="btn sm fd-go" onclick="pastReturnM(\''+p.id+'\')">🏁 '+L2("Întoarcere acasă…","Bring home…")+'</button>'
    +'<button class="btn sm gh" onclick="pastorM(\''+p.id+'\')">✏️ '+L2("Editează","Edit")+'</button></div>'
    +'</div>';
}
function renderPastorage(){
  var all=D.pastorage||[];
  var act=all.filter(pActive).sort(function(a,b){return a.startDate<b.startDate?1:-1;});
  var done=all.filter(function(p){return !pActive(p)&&!(p.startDate>pToday());}).sort(function(a,b){return(a.endDate||a.startDate)<(b.endDate||b.startDate)?1:-1;});
  var future=all.filter(function(p){return p.startDate>pToday();});
  var actH=act.map(function(p){
    var hs=pAwayHives(p).map(function(id){return D.hives.find(function(h){return h.id===id;});}).filter(Boolean);
    return'<div class="ps-block">'+pTripHeadHTML(p)
      +'<div class="g gc hv-grid">'+hs.map(function(h){return hvIsNuc(h)?nucCardHTML(h):hvCardHTML(h,{past:true});}).join("")+'</div></div>';
  }).join("");
  var futH=future.map(function(p){return'<div class="c ps-row"><div><b>🗓️ '+esc(p.location)+'</b> · '+esc(p.target||"")+'<div class="hv-ts">'+L2("plecare pe","leaving on")+' '+devFmt(p.startDate)+' · '+pHives(p).map(pHiveName).map(esc).join(", ")+'</div></div><button class="btn sm gh" onclick="pastorM(\''+p.id+'\')">✏️</button></div>';}).join("");
  var doneH=done.map(function(p){
    var hs=pHives(p),n=(D.inspections||[]).filter(function(i){return i.pastId===p.id;}).length;
    return'<div class="c ps-row"><div><b>📍 '+esc(p.location||"—")+'</b> · 🌸 '+esc(p.target||"")
      +'<div class="hv-ts">'+devFmt(p.startDate)+' → '+(p.endDate?devFmt(p.endDate):"—")+' · '+hs.length+' '+(hs.length===1?L2("stup","hive"):L2("stupi","hives"))+(n?' · 🔍 '+n+' '+L2("inspecții","inspections"):'')+'</div>'
      +'<div class="hv-ts">🏠 '+hs.map(pHiveName).map(esc).join(", ")+'</div></div>'
      +'<div class="ps-rb"><button class="btn sm gh" onclick="pastorM(\''+p.id+'\')" aria-label="✏️">✏️</button><button class="btn sm gh" onclick="delPast(\''+p.id+'\')" aria-label="🗑️">🗑️</button></div></div>';
  }).join("");
  setP('<div class="hv-top"><h2><i class="fas fa-truck" style="color:var(--gold)"></i> '+t("past_title")+'</h2>'
    +'<button class="btn" onclick="pastorM()">🚚 '+L2("Plec în pastorare","Go on migration")+'</button></div>'
    +(act.length?actH:'<div class="al ali">'+L2("Niciun stup în pastorare acum. Apasă «🚚 Plec în pastorare», bifezi stupii, locația și culesul.","No hive on migration now. Tap «🚚 Go on migration», tick the hives, the location and the flow.")+'</div>')
    +(future.length?'<div class="tv-sec-t">🗓️ '+L2("Plecări planificate","Planned trips")+'</div>'+futH:'')
    +(done.length?'<div class="tv-sec-t">📜 '+L2("Pastorări încheiate","Finished trips")+' <span class="bg gy">'+done.length+'</span></div>'+doneH:''));
}
window.delPast=function(id){showConfirm(t("past_del_c"),function(){D.pastorage=D.pastorage.filter(function(p){return p.id!==id;});save();render();});};

// ── Departure / edit ──
function pastorM(id){
  var ex=id?D.pastorage.find(function(p){return p.id===id;}):null;
  var targets=t("past_targets")||[];
  var busy={};(D.pastorage||[]).forEach(function(p){if(p!==ex)pAwayHives(p).forEach(function(h){busy[h]=p.location||"—";});});
  var avail=D.hives.filter(function(h){return !busy[h.id];}).map(function(h){return h.id;});
  var chk=ex?pHives(ex).filter(function(h){return avail.indexOf(h)>=0;}):[];
  var locs=pLocations();
  openM('<div class="mt">🚚 '+(ex?L2("Editează pastorarea","Edit migration"):L2("Plec în pastorare","Go on migration"))+'</div>'
    +L(L2("🏠 Cu ce stupi pleci?","🏠 Which hives go?"))
    +(avail.length?fdHiveChecks("past",avail,chk):'<div class="al ali">'+L2("Toți stupii sunt deja în pastorare.","All hives are already on migration.")+'</div>')
    +(Object.keys(busy).length?'<div class="hv-ts" style="margin:-4px 0 8px;">🚚 '+L2("Deja plecați","Already away")+': '+Object.keys(busy).map(function(h){return esc(pHiveName(h))+' ('+esc(busy[h])+')';}).join(", ")+'</div>':'')
    +L(t("past_loc"))+'<input id="pLc" list="pLcL" value="'+esc(xv(ex,"location",""))+'" placeholder="'+t("past_loc_ph")+'">'
    +'<datalist id="pLcL">'+locs.map(function(l){return'<option value="'+esc(l)+'">';}).join("")+'</datalist>'
    +(locs.length?'<div class="ps-locs">'+locs.slice(0,6).map(function(l){return'<button type="button" class="gen-chip" onclick="$q(\'pLc\').value=this.textContent">'+esc(l)+'</button>';}).join("")+'</div>':'')
    +L(t("past_target"))+'<select id="pTg">'+targets.map(function(tp){return'<option'+(xv(ex,"target","")===tp?" selected":"")+'>'+tp+'</option>';}).join("")+'</select>'
    +'<div class="r2"><div>'+L(L2("📅 Plecare","📅 Leaving"))+'<input type="date" id="pSt" value="'+esc(xv(ex,"startDate",pToday()))+'"></div>'
    +'<div>'+L(L2("🏁 Întoarcere (aprox.)","🏁 Return (approx.)"))+'<input type="date" id="pPe" value="'+esc(ex?(ex.plannedEnd||(!ex.trip?ex.endDate||"":"")):"")+'"><span class="hint">'+L2("opțional","optional")+'</span></div></div>'
    +L(t("past_notes"))+'<textarea id="pNt" rows="2">'+esc(xv(ex,"notes",""))+'</textarea>'
    +'<div class="br" style="margin-top:14px;"><button class="btn" onclick="savePast(\''+(id||'')+'\')">🚚 '+btnS()+'</button><button class="btn gh" onclick="closeM()">'+btnC()+'</button></div>');
}
window.savePast=function(id){
  var ex=id?D.pastorage.find(function(p){return p.id===id;}):null;
  var sel=fdReadHives("past").ids;
  if(!sel.length){toast("⚠️ "+L2("Bifează cel puțin un stup","Tick at least one hive"));return;}
  var loc=(($q("pLc")||{}).value||"").trim();if(!loc){toast("⚠️ "+t("past_loc"));return;}
  var o={trip:true,hiveIds:sel,hiveId:null,location:loc,target:($q("pTg")||{}).value||"",startDate:($q("pSt")||{}).value||pToday(),plannedEnd:($q("pPe")||{}).value||null,notes:($q("pNt")||{}).value||""};
  if(ex){
    // hives already returned stay in the list (history); legacy → trip
    var keepBack=pHives(ex).filter(function(h){return ex.returned&&ex.returned[h];});
    keepBack.forEach(function(h){if(o.hiveIds.indexOf(h)<0)o.hiveIds.push(h);});
    if(!ex.trip){   // legacy record: an end date in the past means the hive already came back
      o.returned={};o.endDate=null;
      if(ex.endDate&&ex.endDate<=pToday()){pHives(ex).forEach(function(h){o.returned[h]=ex.endDate;});o.endDate=ex.endDate;}
      else if(ex.endDate&&!o.plannedEnd)o.plannedEnd=ex.endDate;
    }
    Object.assign(ex,o);
  }else{o.id=uid();o.returned={};o.endDate=null;D.pastorage.push(o);}
  save();closeM();render();toast(L2("Pastorare salvată","Migration saved"),"🚚");
};

// ── 🏁 Return home: tick the hives (or all) ──
window.pastReturnM=function(id){
  var p=D.pastorage.find(function(x){return x.id===id;});if(!p)return;
  var away=pAwayHives(p);
  openM('<div class="mt">🏁 '+L2("Întoarcere din pastorare","Back from migration")+'</div>'
    +'<div class="fd-box">📍 <b>'+esc(p.location)+'</b> · 🌸 '+esc(p.target||"")+' · '+pDays(p)+' '+t("hv_days")+'</div>'
    +L(L2("🏠 Ce stupi vin acasă?","🏠 Which hives come home?"))
    +fdHiveChecks("pret",away,away)
    +L(L2("📅 Data întoarcerii","📅 Return date"))+'<input type="date" id="pRd" value="'+pToday()+'">'
    +'<div class="br" style="margin-top:14px;"><button class="btn" onclick="pastReturnSave(\''+id+'\')">🏁 '+L2("Vin acasă","Bring home")+'</button><button class="btn gh" onclick="closeM()">'+btnC()+'</button></div>');
};
window.pastReturnSave=function(id){
  var p=D.pastorage.find(function(x){return x.id===id;});if(!p)return;
  var sel=fdReadHives("pret").ids;if(!sel.length){toast("⚠️ "+L2("Bifează cel puțin un stup","Tick at least one hive"));return;}
  var d=($q("pRd")||{}).value||pToday();
  if(p.startDate&&d<p.startDate){toast("⚠️ "+L2("Data întoarcerii e înaintea plecării!","Return date is before departure!"));return;}
  if(!p.trip){p.trip=true;p.hiveIds=pHives(p);p.hiveId=null;p.plannedEnd=p.endDate||null;p.endDate=null;}
  p.returned=p.returned||{};
  sel.forEach(function(h){p.returned[h]=d;});
  if(pHives(p).every(function(h){return p.returned[h];}))p.endDate=pHives(p).map(function(h){return p.returned[h];}).sort().pop();
  save(false);closeM();render();toast(L2("Stupii au revenit acasă","Hives are back home"),"🏠");
};

// ── On the Stupi page: small band for hives that are away ──
function pAwayTileHTML(h){
  var p=pTripOf(h.id);if(!p)return"";
  return'<div class="ps-tile" onclick="go(\'pastorare\')" role="button">'
    +'<span class="hv-num">'+(h.num||"·")+'</span>'
    +'<div class="ps-tile-b"><b>'+esc(h.name)+'</b> <span class="bg gg">🚚 '+L2("în pastorare","on migration")+'</span>'
    +'<div class="hv-ts">📍 '+esc(p.location||"—")+' · 🌸 '+esc(p.target||"—")+' · '+pDays(p)+' '+t("hv_days")+'</div></div>'
    +'<span class="hv-arr">›</span></div>';
}
