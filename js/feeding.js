// BeeManager Pro — feeding.js
// Feeding
//
// Feeding model (since 26.10.2026): a feeding = a PERIOD.
//   🗓️ planned (planned:true)  →  ▶ started (date = day you put the feed in)  →  ⏹️ stopped
//   • hives: allHives (all) or hiveIds (checked hives); hiveId kept for a single hive (compatibility)
//   • portions: [{date,qty,insp?}] — first portion + „➕ Am mai pus”; qty = total of portions
//   • stopping: doneHives{hiveId:date} per hive; endDate once stopped at all its hives
//   • per:true marks new feedings. Old ones (no per) are "ongoing" for FEED_ACTIVE_DAYS days (config.js).
// Managed from the Feeding page and from inspection (🍬 Hrănire section).

var _hrHiveFilter="all";
var _hrMonthFilter="all";

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════
function fdToday(){return todayISO();}
// Hives of a feeding. The list is frozen when the feeding is saved (hiveIds), so hives added later are not
// included; hives deleted / closed since are ignored (otherwise the feeding could never finish).
function fdHivesRaw(f){
  if(f.hiveIds&&f.hiveIds.length)return f.hiveIds.slice();
  if(f.allHives)return D.hives.map(function(h){return h.id;});   // legacy "all hives" without a frozen list
  return f.hiveId?[f.hiveId]:[];
}
function fdHives(f){
  var ids=fdHivesRaw(f),live=ids.filter(function(id){return D.hives.some(function(h){return h.id===id;});});
  return live.length?live:ids;
}
function fdCovers(f,hid){return fdHives(f).indexOf(hid)>=0;}
// day from which the feeding is no longer ongoing at the hive (exclusive); null = still ongoing
function fdStop(f,hid){
  if(f.per)return(f.doneHives&&f.doneHives[hid])||f.endDate||null;
  return f.date?devAdd(f.date,FEED_ACTIVE_DAYS):null;
}
function fdIsActive(f,hid,day){
  day=day||fdToday();
  if(f.planned||!f.date||f.date>day||!fdCovers(f,hid))return false;
  var s=fdStop(f,hid);return !s||s>day;
}
function fdActiveHives(f,day){return fdHives(f).filter(function(h){return fdIsActive(f,h,day);});}
function fdActiveFor(hid,day,list){
  return(list||D.feedings||[]).filter(function(f){return fdIsActive(f,hid,day);})
    .sort(function(a,b){return(a.date||"")<(b.date||"")?1:-1;});
}
function fdPlannedHives(f){return fdHives(f).filter(function(h){return !(f.doneHives&&f.doneHives[h]);});}
function fdPlannedFor(hid,list){
  return(list||D.feedings||[]).filter(function(f){return f.planned&&fdCovers(f,hid)&&!(f.doneHives&&f.doneHives[hid]);})
    .sort(function(a,b){return(a.date||"")<(b.date||"")?-1:1;});
}
function fdPortions(f){
  if(f.planned)return[];
  if(f.portions&&f.portions.length)return f.portions;
  return f.date?[{date:f.date,qty:f.qty||0}]:[];
}
function fdSumQty(f){f.qty=parseFloat(fdPortions(f).reduce(function(s,p){return s+(parseFloat(p.qty)||0);},0).toFixed(2));return f.qty;}
function fdType(f){var tp=(t("hr_types")||[]).find(function(x){return x.v===f.feedType;});return tp||{l:"📦 "+(f.feedType||"?"),u:f.unit||"kg"};}
function fdTypeShort(f){return fdType(f).l.replace(/^[^ ]+ /,"").replace(/\s*\(.*\)$/,"");}
function fdTypeIco(f){return fdType(f).l.split(" ")[0];}
function fdHiveNames(f,hids){
  hids=hids||fdHives(f);
  if(f.allHives&&hids.length===D.hives.length)return L2("Toți stupii","All hives");
  return hids.map(function(id){var h=D.hives.find(function(x){return x.id===id;});return h?h.name:"—";}).join(", ");
}
function fdStatus(f){   // planned / active / done
  if(f.planned)return"planned";
  return fdActiveHives(f).length?"active":"done";
}
function fdDayN(f,day){return Math.max(1,Math.round((new Date(day||fdToday())-new Date(f.date))/86400000)+1);}
function fdQtyTxt(f){var q=fdSumQty(f);return q?q+' '+(f.unit||fdType(f).u||"kg"):"";}

// Hive picker (feeding, migration…): pills with the hive number, grouped (🏠 Stupi / 🐝 Roiuri),
// with „Toți” / „Niciunul” and a count of selected. Tap a pill → it lights up (selected).
function fdPillLbl(h){if(!h)return"?";var nm=h.name||"",m=/#\s*([0-9A-Za-z]+)/.exec(nm);
  if(m)return(hvIsNuc(h)||/^\s*roi/i.test(nm)?"R":"")+m[1];return nm.length>6?nm.slice(0,6)+"…":nm;}
function fdHiveChecks(name,hids,checked){
  var hs=hids.map(function(id){return D.hives.find(function(x){return x.id===id;})||{id:id,name:"—"};});
  var st=hs.filter(function(h){return !hvIsNuc(h);}),nu=hs.filter(hvIsNuc);
  var pill=function(h){var on=checked.indexOf(h.id)>=0,away=typeof pTripOf==="function"&&pTripOf(h.id);
    return'<label class="hp-c'+(on?" on":"")+(hvIsNuc(h)?" nuc":"")+'" title="'+esc(h.name)+'"><input type="checkbox" class="fdHv" value="'+h.id+'" onchange="fdOneChk(this)"'+(on?" checked":"")+'>'
      +'<span class="hp-n">'+esc(fdPillLbl(h))+'</span>'+(away?'<span class="hp-i">🚚</span>':'')+'</label>';};
  var grp=function(list,title,key){if(!list.length)return"";
    return(st.length&&nu.length?'<div class="hp-gh"><span>'+title+'</span><button type="button" class="hp-mini" onclick="fdSelGrp(this,\''+key+'\')">'+L2("toți","all")+'</button></div>':'')
      +'<div class="hp-grid" data-g="'+key+'">'+list.map(pill).join("")+'</div>';};
  return'<div class="fd-hv hp" data-name="'+name+'">'
    +'<div class="hp-top"><span class="hp-cnt"><b>'+checked.length+'</b> / '+hs.length+' '+L2("aleși","selected")+'</span>'
    +(hs.length>1?'<span class="hp-acts"><button type="button" class="hp-btn" onclick="fdSelAll(this,true)">✓ '+L2("Toți","All")+'</button><button type="button" class="hp-btn" onclick="fdSelAll(this,false)">✕ '+L2("Niciunul","None")+'</button></span>':'')+'</div>'
    +grp(st,"🏠 "+L2("Stupi","Hives"),"h")+grp(nu,"🐝 "+L2("Roiuri","Nucs"),"n")
    +'</div>';
}
function fdHpSync(box){
  var cs=box.querySelectorAll(".fdHv"),n=0;
  [].forEach.call(cs,function(c){c.parentNode.classList.toggle("on",c.checked);if(c.checked)n++;});
  var b=box.querySelector(".hp-cnt b");if(b)b.textContent=n;
}
window.fdOneChk=function(el){fdHpSync(el.closest(".fd-hv"));};
window.fdSelAll=function(btn,on){var box=btn.closest(".fd-hv");[].forEach.call(box.querySelectorAll(".fdHv"),function(c){c.checked=on;});fdHpSync(box);if(typeof _mDirty!=="undefined")_mDirty=true;};
window.fdSelGrp=function(btn,g){var box=btn.closest(".fd-hv"),cs=box.querySelectorAll('.hp-grid[data-g="'+g+'"] .fdHv');
  var all=[].every.call(cs,function(c){return c.checked;});[].forEach.call(cs,function(c){c.checked=!all;});fdHpSync(box);if(typeof _mDirty!=="undefined")_mDirty=true;};
window.fdAllChk=function(el){fdSelAll(el,el.checked);};
function fdReadHives(name){
  var box=document.querySelector('.fd-hv[data-name="'+name+'"]');if(!box)return{ids:[],all:false};
  var cs=box.querySelectorAll(".fdHv");
  var ids=[].filter.call(cs,function(c){return c.checked;}).map(function(c){return c.value;});
  return{ids:ids,all:cs.length>1&&ids.length===cs.length};
}
function fdTypeOpts(cur){return(t("hr_types")||[]).map(function(tp){return'<option value="'+tp.v+'"'+(cur===tp.v?" selected":"")+'>'+tp.l+'</option>';}).join("");}
function fdUnitOpts(cur){return["L","kg","g"].map(function(u){return'<option'+(cur===u?" selected":"")+'>'+u+'</option>';}).join("");}
window.fdTypeUnit=function(sel,unitId){var tp=(t("hr_types")||[]).find(function(x){return x.v===sel.value;});var u=$q(unitId);if(tp&&u)u.value=tp.u;};

// ═══════════════════════════════════════════
// FEEDING PAGE
// ═══════════════════════════════════════════
function fdActiveCardHTML(f){
  var act=fdActiveHives(f),stopped=fdHives(f).filter(function(h){return act.indexOf(h)<0;});
  var n=fdPortions(f).length;
  return'<div class="c fd-card fd-on">'
    +'<div class="fd-card-h"><span class="fd-ico">'+fdTypeIco(f)+'</span><div class="fd-card-t"><b>'+esc(fdTypeShort(f))+'</b>'+(fdQtyTxt(f)?' · <b class="fd-q">'+fdQtyTxt(f)+'</b>':'')
    +'<div class="hv-ts">▶ '+L2("Pornită","Started")+' '+devFmt(f.date)+' · '+L2("ziua","day")+' '+fdDayN(f)+(n>1?' · '+n+' '+L2("porții","portions"):'')+'</div></div></div>'
    +'<div class="fd-hvs">🏠 '+esc(fdHiveNames(f,act))+(stopped.length?' <span class="hv-ts">· ⏹️ '+L2("oprită la","stopped at")+': '+esc(fdHiveNames({},stopped))+'</span>':'')+'</div>'
    +'<div class="fd-btns">'
    +'<button class="btn sm fd-stop" onclick="fdStopM(\''+f.id+'\')">⏹️ '+L2("Oprește","Stop")+'</button>'
    +'<button class="btn sm gh" onclick="fdRefillM(\''+f.id+'\')">➕ '+L2("Am mai pus","Added more")+'</button>'
    +'<button class="btn sm gh" onclick="hrM(\''+f.id+'\')" aria-label="✏️">✏️</button>'
    +'</div></div>';
}
function fdPlannedCardHTML(f){
  var d=-hvDaysSince(f.date),late=d<=0;
  return'<div class="c fd-card fd-pl'+(late?' late':'')+'">'
    +'<div class="fd-card-h"><span class="fd-ico">🗓️</span><div class="fd-card-t"><b>'+esc(fdTypeShort(f))+'</b> · '+devFmt(f.date)
    +'<div class="hv-ts '+(late?'fd-late':'')+'">'+(d<0?L2("Întârziată","Overdue")+' '+(-d)+' '+t("hv_days"):d===0?L2("Azi","Today"):d===1?L2("Mâine","Tomorrow"):L2("În","In")+' '+d+' '+t("hv_days"))+'</div></div></div>'
    +'<div class="fd-hvs">🏠 '+esc(fdHiveNames(f,fdPlannedHives(f)))+'</div>'
    +(f.notes?'<div class="hv-ts" style="margin-bottom:6px;">📝 '+esc(f.notes)+'</div>':'')
    +'<div class="fd-btns">'
    +'<button class="btn sm fd-go" onclick="fdStartM(\''+f.id+'\')">▶ '+L2("Am hrănit","Fed now")+'</button>'
    +'<button class="btn sm gh" onclick="hrM(\''+f.id+'\')" aria-label="✏️">✏️</button>'
    +'<button class="btn sm gh" onclick="delHr(\''+f.id+'\')" aria-label="🗑️">🗑️</button>'
    +'</div></div>';
}

function renderHranire(){
  var isEN=D.settings.lang==="en";
  var feedings=D.feedings||[];
  if(!D.hives.length){
    setP('<h2 style="margin-bottom:12px;"><i class="fas fa-bowl-rice" style="color:var(--gold)"></i> '+t("hr_title")+'</h2><div class="al alw">'+t("hr_no_hives")+'</div>');
    return;
  }
  var today=fdToday();
  var active=feedings.filter(function(f){return fdStatus(f)==="active";}).sort(function(a,b){return a.date<b.date?1:-1;});
  var planned=feedings.filter(function(f){return f.planned&&fdPlannedHives(f).length;}).sort(function(a,b){return a.date<b.date?-1:1;});

  var nowH='<div class="fd-sec-h"><span>🍬 '+L2("În curs","In progress")+' <span class="bg gy">'+active.length+'</span></span>'
    +(active.length?'<button class="btn sm fd-stop" onclick="fdStopM(\'\')">⏹️ '+L2("Oprește hrănirea…","Stop feeding…")+'</button>':'')+'</div>'
    +(active.length?'<div class="fd-grid">'+active.map(fdActiveCardHTML).join("")+'</div>'
      :'<div class="hv-ts" style="margin:0 0 12px;">'+L2("Niciun stup nu e sub hrănire acum.","No hive is being fed right now.")+'</div>');
  var plH=planned.length?'<div class="fd-sec-h"><span>🗓️ '+L2("Planificate","Planned")+' <span class="bg gy">'+planned.length+'</span></span></div>'
    +'<div class="fd-grid">'+planned.map(fdPlannedCardHTML).join("")+'</div>':'';

  // Build month options from existing data
  var allMonths=[];
  feedings.forEach(function(f){fdPortions(f).forEach(function(p){var m=(p.date||"").slice(0,7);if(m&&allMonths.indexOf(m)===-1)allMonths.push(m);});});
  allMonths.sort().reverse();

  // Apply filters (history = started feedings)
  var started=feedings.filter(function(f){return !f.planned;});
  var filtered=started;
  if(_hrHiveFilter!=="all") filtered=filtered.filter(function(f){return fdCovers(f,_hrHiveFilter);});
  if(_hrMonthFilter!=="all") filtered=filtered.filter(function(f){return fdPortions(f).some(function(p){return(p.date||"").startsWith(_hrMonthFilter);});});
  var sorted=filtered.slice().sort(function(a,b){return new Date(b.date)-new Date(a.date);});

  // ── Stats for current filter ──────────────────────────────────
  var totQty=filtered.reduce(function(s,f){return s+(fdSumQty(f)||0);},0);
  var byType={};
  filtered.forEach(function(f){byType[f.feedType]=(byType[f.feedType]||0)+(f.qty||0);});
  var uniqueHives=new Set([].concat.apply([],filtered.map(function(f){return fdHives(f);}))).size;
  var avgPerHive=uniqueHives>0?(totQty/uniqueHives).toFixed(1):"—";

  var statH='<div class="g" style="grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:10px;margin-bottom:14px;">'
    +'<div class="c"><div class="cl">'+t("hr_total_qty")+'</div><div class="cv">'+totQty.toFixed(1)+'</div><div class="cs">kg + L</div></div>'
    +'<div class="c"><div class="cl">'+t("hr_total_entries")+'</div><div class="cv">'+filtered.length+'</div></div>'
    +'<div class="c"><div class="cl">'+t("hr_avg_per_hive")+'</div><div class="cv" style="font-size:1.1rem;">'+avgPerHive+'</div><div class="cs">kg+L</div></div>'
    +'</div>';

  // ── Feed-type breakdown bars ──────────────────────────────────
  var types=t("hr_types")||[];
  var typeBarH='<div class="c" style="margin-bottom:14px;padding:12px 14px;">'
    +'<div class="ct" style="margin-bottom:10px;">'+t("hr_stat_title")+'</div>'
    +'<div style="display:flex;flex-direction:column;gap:8px;">';
  types.forEach(function(tp){
    var qty=byType[tp.v]||0;
    if(!qty&&_hrHiveFilter==="all"&&_hrMonthFilter==="all")return;
    var pct=totQty>0?Math.round((qty/totQty)*100):0;
    var emoji=tp.l.split(" ")[0];
    typeBarH+='<div>'
      +'<div style="display:flex;justify-content:space-between;margin-bottom:3px;">'
      +'<span style="font-size:.75rem;color:var(--txt);">'+emoji+' '+tp.l.replace(/^[^ ]+ /,"")+'</span>'
      +'<span style="font-size:.75rem;font-weight:700;color:var(--gold);">'+qty.toFixed(1)+' '+(tp.u||"kg")+'</span>'
      +'</div>'
      +'<div style="height:5px;border-radius:5px;background:rgba(200,135,14,.15);">'
      +'<div style="width:'+pct+'%;height:100%;border-radius:5px;background:var(--gold);transition:width .4s;"></div>'
      +'</div></div>';
  });
  if(!Object.keys(byType).length) typeBarH+='<div style="font-size:.8rem;color:var(--mut);">'+t("hr_no_data")+'</div>';
  typeBarH+='</div></div>';

  // ── Per-hive summary cards ────────────────────────────────────
  var hvCardsH='<div class="g" style="grid-template-columns:repeat(auto-fill,minmax(165px,1fr));gap:10px;margin-bottom:14px;">';
  D.hives.forEach(function(hv){
    var hvFeeds=started.filter(function(f){return fdCovers(f,hv.id);});
    var hvTot=hvFeeds.reduce(function(s,f){return s+(f.qty||0);},0);
    var hvLast=hvFeeds.slice().sort(function(a,b){return new Date(b.date)-new Date(a.date);})[0];
    var on=fdActiveFor(hv.id).length>0;
    var daysSince=hvLast?Math.round((Date.now()-new Date(hvLast.date))/86400000):null;
    var freshness=on?"var(--ok)":daysSince===null?"var(--mut)":daysSince<=30?"var(--gold)":"var(--danger)";
    hvCardsH+='<div class="c" style="cursor:pointer;border-left:3px solid '+freshness+';" onclick="_hrHiveFilter=\''+hv.id+'\';renderHranire();">'
      +'<div class="cl" style="margin-bottom:3px;">🏠 '+esc(hv.name)+(on?' <span class="bg gg">🍬</span>':'')+'</div>'
      +'<div style="font-size:1.2rem;font-weight:700;color:var(--gold);">'+hvTot.toFixed(1)+' <span style="font-size:.7rem;font-weight:400;color:var(--mut);">kg+L</span></div>'
      +'<div style="font-size:.69rem;color:var(--mut);margin-top:2px;">'+(hvLast?'📅 '+hvLast.date+' ('+daysSince+(isEN?"d ago":"z)"):isEN?"No feedings":"Nicio hrănire")+'</div>'
      +'<div style="font-size:.68rem;color:var(--mut);">'+hvFeeds.length+(isEN?" feedings":" hrăniri")+'</div>'
      +'</div>';
  });
  hvCardsH+='</div>';

  // ── Monthly chart ─────────────────────────────────────────────
  var chartH='<div class="c" style="margin-bottom:14px;"><div class="ct">'+t("hr_chart_title")+'</div><canvas id="hrChart" height="70"></canvas></div>';

  // ── History ───────────────────────────────────────────────────
  var listH=sorted.length?sorted.map(function(f){
    var st=fdStatus(f),tp=fdType(f);
    var invItem=(f.invItemId&&modOn("inventory"))?D.inventory.find(function(i){return i.id===f.invItemId;}):null;
    var endTxt=st==="active"?'<span class="bg gg">▶ '+L2("în curs","in progress")+'</span>'
      :'<span class="bg gy">⏹️ '+(f.per?(f.endDate?devFmt(f.endDate):L2("oprită","stopped")):L2("încheiată","finished"))+'</span>';
    var ps=fdPortions(f);
    return'<div class="c" style="padding:10px 13px;margin-bottom:7px;">'
      +'<div style="display:flex;align-items:flex-start;gap:9px;">'
      +'<div style="width:36px;height:36px;border-radius:50%;background:rgba(200,135,14,.13);display:flex;align-items:center;justify-content:center;font-size:1.2rem;flex-shrink:0;">'+fdTypeIco(f)+'</div>'
      +'<div style="flex:1;min-width:0;">'
      +'<div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:4px;">'
      +'<span style="font-size:.86rem;font-weight:700;color:var(--txt);">'+esc(tp.l.replace(/^[^ ]+ /,""))+'</span>'
      +'<span style="font-size:.78rem;font-weight:700;color:var(--gold);">'+(f.qty||0)+' '+(f.unit||tp.u||"kg")+'</span>'
      +'</div>'
      +'<div style="font-size:.74rem;color:var(--mut);margin-top:3px;">📅 '+f.date+' &nbsp;🏠 '+esc(fdHiveNames(f))+(f.reason?' &nbsp;'+esc(f.reason):"")+' '+endTxt+'</div>'
      +(ps.length>1?'<div style="font-size:.7rem;color:var(--mut);margin-top:2px;">➕ '+ps.map(function(p){return devFmt(p.date)+': '+p.qty;}).join(" · ")+'</div>':'')
      +(invItem?'<div style="font-size:.68rem;color:var(--mut);margin-top:2px;">📦 '+invItem.name+' ('+t("hr_inv_stock")+' '+invItem.qty+' '+(isEN?"units":"buc")+')</div>':"")
      +(f.notes?'<div style="font-size:.72rem;color:var(--mut);font-style:italic;margin-top:2px;">'+esc(f.notes)+'</div>':"")
      +'</div>'
      +'<div style="display:flex;gap:4px;flex-shrink:0;">'
      +'<button class="btn sm be" onclick="hrM(\''+f.id+'\')">✏️</button>'
      +'<button class="btn sm bd" onclick="delHr(\''+f.id+'\')">🗑️</button>'
      +'</div></div></div>';
  }).join(""):'<div class="al ali">'+t("hr_no_data")+'</div>';

  // Filters row
  var hiveOpts='<option value="all">'+t("hr_all_hives")+'</option>'
    +D.hives.map(function(h){return'<option value="'+h.id+'"'+(_hrHiveFilter===h.id?" selected":"")+'>'+esc(h.name)+'</option>';}).join("");
  var monthOpts='<option value="all">'+t("hr_all_months")+'</option>'
    +allMonths.map(function(m){return'<option value="'+m+'"'+(_hrMonthFilter===m?" selected":"")+'>'+m+'</option>';}).join("");
  var selStyle='font-size:.8rem;padding:5px 8px;border-radius:var(--rs);background:var(--sur);border:1px solid var(--bdr);color:var(--txt);';

  setP('<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;margin-bottom:12px;">'
    +'<h2 style="margin:0;font-size:1.2rem;"><i class="fas fa-bowl-rice" style="color:var(--gold)"></i> '+t("hr_title")+'</h2>'
    +'<button class="btn sm" onclick="hrM(\'\')">'+t("hr_new")+'</button>'
    +'</div>'
    +nowH+plH
    +'<div class="fd-sec-h"><span>📜 '+L2("Istoric","History")+'</span></div>'
    +'<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:14px;">'
    +t("hr_filter_hive")+'<select style="'+selStyle+'" onchange="_hrHiveFilter=this.value;renderHranire();">'+hiveOpts+'</select>'
    +t("hr_filter_month")+'<select style="'+selStyle+'" onchange="_hrMonthFilter=this.value;renderHranire();">'+monthOpts+'</select>'
    +'<button class="btn sm gh" onclick="_hrHiveFilter=\'all\';_hrMonthFilter=\'all\';renderHranire();">↺</button>'
    +'</div>'
    +listH+statH+hvCardsH+typeBarH+chartH);

  // Monthly chart (by portions: each top-up counts in its own month)
  setTimeout(function(){
    var canv=document.getElementById("hrChart");if(!canv)return;
    var mLabels=t("hr_month_labels");
    var curYr=new Date().getFullYear();
    var yrs=[curYr,curYr-1];
    var datasets=yrs.map(function(yr,yi){
      var data=Array.from({length:12},function(_,m){
        return started.filter(function(f){return _hrHiveFilter==="all"||fdCovers(f,_hrHiveFilter);})
          .reduce(function(s,f){return s+fdPortions(f).filter(function(p){var d=p.date||"";return d.startsWith(yr+"-")&&parseInt(d.slice(5,7))-1===m;})
            .reduce(function(a,p){return a+(parseFloat(p.qty)||0);},0);},0);
      });
      return{
        label:String(yr),data:data,
        backgroundColor:yi===0?"rgba(200,135,14,.7)":"rgba(200,135,14,.25)",
        borderColor:yi===0?"#c8870e":"rgba(200,135,14,.5)",
        borderWidth:1.5,borderRadius:4
      };
    });
    new Chart(canv.getContext("2d"),{
      type:"bar",
      data:{labels:mLabels,datasets:datasets},
      options:{responsive:true,
        plugins:{legend:{labels:{color:"#b9b5ae",font:{size:10},boxWidth:14}}},
        scales:{
          x:{ticks:{color:"#b9b5ae",font:{size:9}},grid:{color:"rgba(255,255,255,.04)"}},
          y:{ticks:{color:"#b9b5ae",font:{size:9}},grid:{color:"rgba(255,255,255,.05)"},beginAtZero:true}
        }}
    });
  },80);
}

window.delHr=function(id){
  showConfirm(t("hr_del_c"),function(){
    var f=(D.feedings||[]).find(function(x){return x.id===id;});
    if(f&&f.invItemId&&f.invDeducted){var it=(D.inventory||[]).find(function(i){return i.id===f.invItemId;});if(it)it.qty=parseFloat(((it.qty||0)+f.invDeducted).toFixed(2));}
    D.feedings=D.feedings.filter(function(f){return f.id!==id;});
    save();render();
  });
};

// ═══════════════════════════════════════════
// ⏹️ STOP — one feeding (id) or all ongoing feedings (empty id), on checked hives
// ═══════════════════════════════════════════
window.fdStopM=function(id,hid){
  var today=fdToday(),list=id?[(D.feedings||[]).find(function(f){return f.id===id;})]:(D.feedings||[]).filter(function(f){return fdStatus(f)==="active";});
  list=list.filter(Boolean);if(!list.length)return;
  var hids=[];list.forEach(function(f){fdActiveHives(f).forEach(function(h){if(hids.indexOf(h)<0)hids.push(h);});});
  hids=D.hives.map(function(h){return h.id;}).filter(function(h){return hids.indexOf(h)>=0;});
  var f0=list[0];
  openM('<div class="mt">⏹️ '+L2("Oprește hrănirea","Stop feeding")+'</div>'
    +(id?'<div class="fd-box">'+fdTypeIco(f0)+' <b>'+esc(fdTypeShort(f0))+'</b> · '+L2("pornită","started")+' '+devFmt(f0.date)+(fdQtyTxt(f0)?' · '+fdQtyTxt(f0):'')+'</div>'
      :'<div class="hv-ts" style="margin-bottom:8px;">'+L2("Oprește toate hrănirile în curs la stupii bifați.","Stops every running feeding on the ticked hives.")+'</div>')
    +L(L2("🏠 La care stupi?","🏠 Which hives?"))
    +fdHiveChecks("stop",hids,hid?[hid]:hids)
    +L(L2("📅 Data opririi","📅 Stop date"))+'<input type="date" id="fdStD" value="'+today+'">'
    +'<div class="br" style="margin-top:14px;"><button class="btn" onclick="fdStopSave(\''+(id||"")+'\')">⏹️ '+L2("Oprește","Stop")+'</button><button class="btn gh" onclick="closeM()">'+btnC()+'</button></div>');
};
window.fdStopSave=function(id){
  var sel=fdReadHives("stop").ids;if(!sel.length){toast("⚠️ "+L2("Bifează cel puțin un stup","Tick at least one hive"));return;}
  var d=($q("fdStD")||{}).value||fdToday();
  var list0=id?[(D.feedings||[]).find(function(f){return f.id===id;})]:[];
  if(list0[0]&&list0[0].date&&d<list0[0].date){toast("⚠️ "+L2("Data opririi e înaintea pornirii!","Stop date is before the start!"));return;}
  var list=id?[(D.feedings||[]).find(function(f){return f.id===id;})]:(D.feedings||[]).filter(function(f){return fdStatus(f)==="active";});
  list.filter(Boolean).forEach(function(f){fdStopHives(f,sel,d);});
  save(false);closeM();render();toast(L2("Hrănire oprită","Feeding stopped"),"⏹️");
};
// stops the feeding at the given hives; if no hive is left ongoing → endDate
function fdStopHives(f,hids,d){
  f.doneHives=f.doneHives||{};
  var conv=null;
  if(!f.per){   // old feeding (no period): becomes a period; other hives stop at the old deadline (FEED_ACTIVE_DAYS)
    var nat=f.date?devAdd(f.date,FEED_ACTIVE_DAYS):d;conv=[];
    fdHives(f).forEach(function(h){if(hids.indexOf(h)<0&&!f.doneHives[h]){f.doneHives[h]=nat;conv.push(h);}});
    f.per=true;
  }
  var set=[];
  fdHives(f).forEach(function(h){if(hids.indexOf(h)>=0&&!f.doneHives[h]){f.doneHives[h]=d;set.push(h);}});
  var endSet=false;
  if(!f.endDate&&fdHives(f).every(function(h){return f.doneHives[h];})){
    f.endDate=fdHives(f).map(function(h){return f.doneHives[h];}).sort().pop();endSet=true;}
  return{hives:set,end:endSet,conv:conv};
}

// ═══════════════════════════════════════════
// ➕ ADDED MORE — a new portion for an ongoing feeding
// ═══════════════════════════════════════════
window.fdRefillM=function(id){
  var f=(D.feedings||[]).find(function(x){return x.id===id;});if(!f)return;
  openM('<div class="mt">➕ '+L2("Am mai pus mâncare","Added more feed")+'</div>'
    +'<div class="fd-box">'+fdTypeIco(f)+' <b>'+esc(fdTypeShort(f))+'</b> · 🏠 '+esc(fdHiveNames(f,fdActiveHives(f)))+(fdQtyTxt(f)?' · '+L2("până acum","so far")+' '+fdQtyTxt(f):'')+'</div>'
    +'<div class="r2"><div>'+L(t("hr_date"))+'<input type="date" id="fdRfD" value="'+fdToday()+'"></div>'
    +'<div>'+L(t("hr_qty")+' ('+(f.unit||fdType(f).u)+')')+'<input type="number" inputmode="decimal" step="0.1" id="fdRfQ"></div></div>'
    +'<div class="br" style="margin-top:14px;"><button class="btn" onclick="fdRefillSave(\''+id+'\')">'+btnS()+'</button><button class="btn gh" onclick="closeM()">'+btnC()+'</button></div>');
};
window.fdRefillSave=function(id){
  var f=(D.feedings||[]).find(function(x){return x.id===id;});if(!f)return;
  var q=parseFloat(($q("fdRfQ")||{}).value)||0;if(!q){toast("⚠️ "+L2("Introduceți cantitatea!","Enter a quantity!"));return;}
  f.portions=fdPortions(f).slice();f.portions.push({date:($q("fdRfD")||{}).value||fdToday(),qty:q});f.per=true;fdSumQty(f);
  save(false);closeM();render();toast(L2("Porție adăugată","Portion added"),"🍬");
};

// ═══════════════════════════════════════════
// ▶ FED — starts a planned feeding (at all its hives or only some)
// ═══════════════════════════════════════════
window.fdStartM=function(id,hid){
  var f=(D.feedings||[]).find(function(x){return x.id===id;});if(!f)return;
  var hids=fdPlannedHives(f),u=f.unit||fdType(f).u||"L";
  openM('<div class="mt">▶ '+L2("Am hrănit","Fed now")+'</div>'
    +'<div class="fd-box">🗓️ '+L2("Planificată pentru","Planned for")+' '+devFmt(f.date)+'</div>'
    +L(L2("🏠 La care stupi?","🏠 Which hives?"))
    +fdHiveChecks("start",hids,hid?[hid]:hids)
    +'<div class="r2"><div>'+L(t("hr_date"))+'<input type="date" id="fdSaD" value="'+fdToday()+'"></div>'
    +'<div>'+L(t("hr_type"))+'<select id="fdSaT" onchange="fdTypeUnit(this,\'fdSaU\')">'+fdTypeOpts(f.feedType)+'</select></div></div>'
    +'<div class="r2"><div>'+L(t("hr_qty"))+'<input type="number" inputmode="decimal" step="0.1" id="fdSaQ"></div>'
    +'<div>'+L(t("hr_unit"))+'<select id="fdSaU">'+fdUnitOpts(u)+'</select></div></div>'
    +'<div class="br" style="margin-top:14px;"><button class="btn" onclick="fdStartSave(\''+id+'\')">▶ '+L2("Pornește hrănirea","Start feeding")+'</button><button class="btn gh" onclick="closeM()">'+btnC()+'</button></div>');
};
window.fdStartSave=function(id){
  var f=(D.feedings||[]).find(function(x){return x.id===id;});if(!f)return;
  var sel=fdReadHives("start").ids;if(!sel.length){toast("⚠️ "+L2("Bifează cel puțin un stup","Tick at least one hive"));return;}
  var q=parseFloat(($q("fdSaQ")||{}).value)||0;if(!q){toast("⚠️ "+L2("Introduceți cantitatea!","Enter a quantity!"));return;}
  fdStartPlanned(f,sel,($q("fdSaD")||{}).value||fdToday(),($q("fdSaT")||{}).value||f.feedType,q,($q("fdSaU")||{}).value||f.unit);
  save(false);closeM();render();toast(L2("Hrănire pornită","Feeding started"),"🍬");
};
// starts the plan at the given hives; returns what changed (so inspection can undo it)
function fdStartPlanned(f,sel,date,type,qty,unit){
  var hids=fdPlannedHives(f),rest=hids.filter(function(h){return sel.indexOf(h)<0;});
  var data={feedType:type,unit:unit,date:date,portions:[{date:date,qty:qty}],qty:qty};
  if(!rest.length){   // all → the plan becomes the ongoing feeding
    var prev={date:f.date,feedType:f.feedType,unit:f.unit};
    delete f.planned;Object.assign(f,data);f.per=true;
    return{a:"st",id:f.id,prev:prev};
  }
  // only some → new feeding for them, the rest stay planned
  var nf=Object.assign({id:uid(),per:true,allHives:false,hiveIds:sel.slice(),hiveId:sel.length===1?sel[0]:null,reason:f.reason||"",notes:f.notes||""},data);
  D.feedings.push(nf);
  var prevH={allHives:!!f.allHives,hiveIds:f.hiveIds?f.hiveIds.slice():null,hiveId:f.hiveId||null};
  f.allHives=false;f.hiveIds=rest;f.hiveId=rest.length===1?rest[0]:null;
  return{a:"split",id:f.id,nid:nf.id,prevH:prevH};
}

// ═══════════════════════════════════════════
// FORM — new feeding / edit
// ═══════════════════════════════════════════
function hrM(id,preset){
  var ex=id?((D.feedings||[]).find(function(f){return f.id===id;})):null;
  preset=preset||{};
  var isEN=D.settings.lang==="en";
  var reasons=t("hr_reasons")||[];
  var curType=xv(ex,"feedType","sirop_1_1");
  var curUnit=xv(ex,"unit",(fdType({feedType:curType})||{u:"L"}).u);
  var mode=ex?(ex.planned?"plan":"on"):(preset.plan?"plan":"on");
  var allIds=D.hives.map(function(h){return h.id;});
  var chk=ex?fdHives(ex):(preset.hiveId?[preset.hiveId]:allIds);
  var reasonOpts='<option value="">—</option>'+reasons.map(function(r){return'<option'+(xv(ex,"reason","")=== r?" selected":"")+'>'+r+'</option>';}).join("");
  var ps=ex?fdPortions(ex):[];

  var feedInvItems=D.inventory.filter(function(i){
    var n=(i.name||"").toLowerCase();
    return n.indexOf("sirop")>=0||n.indexOf("zahar")>=0||n.indexOf("zahăr")>=0||n.indexOf("candy")>=0||n.indexOf("apifond")>=0||n.indexOf("hrăn")>=0||n.indexOf("polen")>=0||n.indexOf("pollen")>=0||i.cat==="Hrănire";
  });
  var invOptItems=feedInvItems.length?feedInvItems:D.inventory;
  var invOpts='<option value="">—</option>'+invOptItems.map(function(i){return'<option value="'+i.id+'"'+(xv(ex,"invItemId","")=== i.id?" selected":"")+'>'+i.name+' ('+i.qty+' '+(isEN?"units":"buc")+')</option>';}).join("");

  var stopped=ex&&!ex.planned&&ex.per?fdHives(ex).filter(function(h){return ex.doneHives&&ex.doneHives[h];}):[];

  openM('<div class="mt">'+(id?t("hr_edit_t"):t("hr_new_t"))+'</div>'
    +((!ex||ex.planned)?'<div class="dev-act fd-mode">'
      +'<label><input type="radio" name="hrMode" value="on" onchange="hrModeChg()"'+(mode==="on"?" checked":"")+'> ▶ '+L2("Am hrănit (pornește acum)","Fed now (start)")+'</label>'
      +'<label><input type="radio" name="hrMode" value="plan" onchange="hrModeChg()"'+(mode==="plan"?" checked":"")+'> 🗓️ '+L2("Planific o hrănire","Plan a feeding")+'</label></div>':'')
    +L(L2("🏠 Stupi","🏠 Hives"))
    +fdHiveChecks("form",allIds,chk)
    +'<div class="r2">'
    +'<div>'+L('<span id="hrDtL">'+(mode==="plan"?L2("📅 Data planificată","📅 Planned date"):L2("📅 Pornită la","📅 Started on"))+'</span>')+'<input type="date" id="hrDt" value="'+xv(ex,"date",preset.date||(mode==="plan"?devAdd(fdToday(),1):fdToday()))+'"></div>'
    +'<div>'+L(t("hr_type"))+'<select id="hrTp" onchange="fdTypeUnit(this,\'hrUn\')">'+fdTypeOpts(curType)+'</select></div>'
    +'</div>'
    +'<div id="hrQtyW" style="display:'+(mode==="plan"?"none":"block")+'">'
    +'<div class="r2">'
    +'<div>'+L(ps.length>1?L2("⚖️ Prima porție","⚖️ First portion"):t("hr_qty"))+'<input type="number" id="hrQt" inputmode="decimal" step="0.1" value="'+esc(ps.length?ps[0].qty:"")+'"></div>'
    +'<div>'+L(t("hr_unit"))+'<select id="hrUn">'+fdUnitOpts(curUnit)+'</select></div>'
    +'</div>'
    +(ps.length>1?'<div class="fd-box" id="hrPs">'+L2("Completări:","Top-ups:")+' '+ps.slice(1).map(function(p,i){return'<span class="fd-p">'+devFmt(p.date)+': <b>'+p.qty+'</b> <button type="button" class="mg-ib" onclick="hrPsDel('+(i+1)+',this)" aria-label="✕">✕</button></span>';}).join("")+'</div>':'')
    +(ex&&!ex.planned&&ex.per?L(L2("⏹️ Oprită la (gol = în curs)","⏹️ Stopped on (empty = in progress)"))+'<input type="date" id="hrEnd" value="'+esc(ex.endDate||"")+'">'
      +(stopped.length&&!ex.endDate?'<div class="hv-ts" style="margin:-2px 0 6px;">⏹️ '+L2("Oprită deja la","Already stopped at")+': '+esc(fdHiveNames({},stopped))+'</div>':''):'')
    +'</div>'
    +L(t("hr_reason"))+'<select id="hrRs">'+reasonOpts+'</select>'
    +(modOn("inventory")?L(t("hr_inv_link"))+'<select id="hrInv" onchange="hrInvChanged(this.value)">'+invOpts+'</select>'
    +'<div id="hrInvInfo" style="font-size:.78rem;color:var(--mut);margin:4px 0 8px;min-height:16px;"></div>':"")
    +L(t("hr_notes"))+'<textarea id="hrNt" rows="2">'+esc(xv(ex,"notes",""))+'</textarea>'
    +'<div class="br" style="margin-top:14px;"><button class="btn" onclick="saveHr(\''+( id||"")+'\')">'+btnS()+'</button><button class="btn gh" onclick="closeM()">'+btnC()+'</button></div>');
  var mb=document.getElementById("MB");if(mb)mb.dataset.hrDel="";
  setTimeout(function(){hrInvChanged(xv(ex,"invItemId",""));},60);
}
window.hrModeChg=function(){
  var plan=(document.querySelector("input[name='hrMode']:checked")||{}).value==="plan";
  var w=document.getElementById("hrQtyW");if(w)w.style.display=plan?"none":"block";
  var l=document.getElementById("hrDtL");if(l)l.textContent=plan?L2("📅 Data planificată","📅 Planned date"):L2("📅 Pornită la","📅 Started on");
  var d=$q("hrDt");if(d)d.value=plan?devAdd(fdToday(),1):fdToday();
};
window.hrPsDel=function(i,btn){var mb=document.getElementById("MB");if(!mb)return;
  var a=(mb.dataset.hrDel||"").split(",").filter(Boolean);a.push(i);mb.dataset.hrDel=a.join(",");
  var sp=btn.closest(".fd-p");if(sp)sp.style.display="none";};

window.hrTypeChanged=function(v){var u=$q("hrUn"),tp=(t("hr_types")||[]).find(function(x){return x.v===v;});if(tp&&u)u.value=tp.u;};

window.hrInvChanged=function(invId){
  var el=document.getElementById("hrInvInfo");
  if(!el)return;
  if(!invId){el.innerHTML="";return;}
  var item=D.inventory.find(function(i){return i.id===invId;});
  if(!item){el.innerHTML="";return;}
  var isEN=D.settings.lang==="en";
  var col=item.qty<=item.min?"var(--danger)":item.qty<=item.min*2?"var(--gold)":"var(--ok)";
  el.innerHTML='📦 '+item.name+' — <span style="color:'+col+';font-weight:700;">'+item.qty+' '+(isEN?"units available":"buc disponibile")+'</span>'+(item.qty<=item.min?' ⚠️ '+t("hr_inv_warn"):"");
};

window.saveHr=function(id){
  var oldF=id?(D.feedings||[]).find(function(f){return f.id===id;}):null;
  var modeEl=document.querySelector("input[name='hrMode']:checked");
  var plan=modeEl?modeEl.value==="plan":!!(oldF&&oldF.planned);
  var hv=fdReadHives("form");
  if(!hv.ids.length){toast("⚠️ "+(D.settings.lang==="en"?"Select a hive!":"Selectați un stup!"));return;}
  var allHives=hv.all&&hv.ids.length===D.hives.length;
  var qty=parseFloat(($q("hrQt")||{}).value)||0;
  if(!plan&&!qty){toast("⚠️ "+(D.settings.lang==="en"?"Enter a quantity!":"Introduceți cantitatea!"));return;}
  var date=($q("hrDt")||{}).value||fdToday();
  var endV=$q("hrEnd")?($q("hrEnd").value||""):null;
  if(endV&&endV<date){toast("⚠️ "+L2("Data opririi e înaintea pornirii!","Stop date is before the start!"));return;}

  // Inventory (only if module is active): restore what was deducted last time, then deduct again
  var invId=($q("hrInv")||{}).value||null;
  var invOff=!modOn("inventory");
  if(invOff)invId=oldF?oldF.invItemId||null:null;
  if(id&&!invOff&&oldF&&oldF.invItemId){
    var oldItem=D.inventory.find(function(i){return i.id===oldF.invItemId;});
    var back=oldF.invDeducted!==undefined?oldF.invDeducted:(oldF.qty||0);
    if(oldItem)oldItem.qty=parseFloat(((oldItem.qty||0)+back).toFixed(2));
  }
  var deducted=invOff&&oldF?(oldF.invDeducted!==undefined?oldF.invDeducted:0):0;
  if(invId&&qty>0&&!invOff&&!plan){
    var item=D.inventory.find(function(i){return i.id===invId;});
    if(item){
      if(qty>item.qty){toast("⚠️ "+t("hr_inv_warn"),"⚠️");deducted=item.qty||0;item.qty=0;}
      else{deducted=qty;item.qty=parseFloat((item.qty-qty).toFixed(2));}
    }
  }

  var o={
    id:id||uid(),per:(oldF&&!oldF.per&&!oldF.planned&&!plan)?false:true,   // legacy feedings stay legacy (no reopening)
    allHives:allHives,
    hiveIds:hv.ids,   // frozen list (hives added later are not included)
    hiveId:(!allHives&&hv.ids.length===1)?hv.ids[0]:null,
    date:date,
    feedType:($q("hrTp")||{}).value||"altul",
    unit:($q("hrUn")||{}).value||"kg",
    reason:($q("hrRs")||{}).value||"",
    invItemId:plan?null:(invId||null),
    invDeducted:plan?0:deducted,
    notes:($q("hrNt")||{}).value||""
  };
  if(plan){o.planned=true;o.portions=[];o.qty=0;}
  else{
    var ps=oldF&&!oldF.planned?fdPortions(oldF).slice():[];
    var del=((document.getElementById("MB")||{dataset:{}}).dataset.hrDel||"").split(",").filter(Boolean).map(Number);
    ps=ps.filter(function(p,i){return i===0||del.indexOf(i)<0;});
    if(ps.length)ps[0]=Object.assign({},ps[0],{date:date,qty:qty});else ps=[{date:date,qty:qty}];
    o.portions=ps;o.planned=false;
    if(endV){o.endDate=endV;o.doneHives=(oldF&&oldF.doneHives)||{};}
    else if(endV===""&&oldF&&oldF.endDate){o.endDate=null;o.doneHives={};}   // stop date emptied = reopened at all hives
    // otherwise per-hive stops (doneHives) are kept as they are
  }
  if(!D.feedings)D.feedings=[];
  if(oldF){Object.assign(oldF,o);if(!oldF.planned)delete oldF.planned;if(!oldF.endDate)delete oldF.endDate;fdSumQty(oldF);}
  else{if(!o.planned)delete o.planned;fdSumQty(o);D.feedings.push(o);}
  save();closeM();render();toast(t("hr_saved"),"🍬");
};

// ═══════════════════════════════════════════
// INSPECTION: 🍬 Hrănire section
// ═══════════════════════════════════════════
//  • ongoing feeding  → „⏹️ S-a terminat mâncarea – opresc hrănirea” (this hive / all) and „➕ Am mai pus”
//  • planned feeding → „▶ Am hrănit azi” + quantity
//  • no ongoing feeding → „▶ Am început o hrănire azi”
//  • always → „🗓️ Planifică o hrănire” (type + date, this hive / all)
// What was done is stored in the inspection (fdActs), so editing can redo it correctly.

// undoes an inspection's actions on a feedings list (D.feedings or a copy)
// has the feeding been changed after this inspection (top-ups, stops)? then the real data is not rebuilt
function fdLater(f,inspId){
  return fdPortions(f).filter(function(p){return p.insp!==inspId;}).length>1||!!f.endDate||!!(f.doneHives&&Object.keys(f.doneHives).length);
}
// real = working on D.feedings (keeps later changes); otherwise a display copy (full undo)
function fdRevert(acts,list,inspId,real){
  var keep={};
  (acts||[]).slice().reverse().forEach(function(a){
    var f=list.find(function(x){return x.id===a.id;});
    if(a.a==="fin"&&f){
      (a.hives||[]).forEach(function(h){if(f.doneHives)delete f.doneHives[h];});
      if(a.end)delete f.endDate;
      if(a.conv){a.conv.forEach(function(h){if(f.doneHives)delete f.doneHives[h];});f.per=false;}   // undo legacy conversion
    }else if(a.a==="rf"&&f){
      f.portions=(f.portions||[]).filter(function(p){return p.insp!==inspId;});fdSumQty(f);
    }else if(a.a==="st"&&f){
      if(real&&fdLater(f,inspId)){keep.st=keep.st||{};keep.st[f.id]=a;return;}   // started and used since → stays started
      f.planned=true;f.date=a.prev.date;f.feedType=a.prev.feedType;f.unit=a.prev.unit;f.portions=[];f.qty=0;
    }else if(a.a==="split"){
      var nf=list.find(function(x){return x.id===a.nid;});
      if(real&&nf&&fdLater(nf,inspId)){keep.st=keep.st||{};keep.st[a.id]=a;return;}
      if(f)Object.assign(f,a.prevH);
      var i=list.indexOf(nf);if(i>=0)list.splice(i,1);
    }else if(a.a==="pl"&&f){
      if(real&&!f.planned){keep.pl={f:f,started:true};return;}   // already started from the Feeding page
      keep.pl={f:f};list.splice(list.indexOf(f),1);
    }else if(a.a==="new"&&f){
      if(real&&fdLater(f,inspId)){keep["new"]={f:f,live:true};return;}
      keep["new"]={f:f};list.splice(list.indexOf(f),1);
    }
  });
  return keep;
}
function fdBaseFor(ex){   // feedings state "before inspection"
  if(!ex||!ex.fdActs||!ex.fdActs.length)return D.feedings||[];
  var copy=JSON.parse(JSON.stringify(D.feedings||[]));
  fdRevert(ex.fdActs,copy,ex.id);
  return copy;
}
function inspFdSecHTML(hid,ex,dateOv){
  var date=dateOv||(ex?ex.date:fdToday());
  var base=fdBaseFor(ex),acts=(ex&&ex.fdActs)||[];
  var A=fdActiveFor(hid,date,base),P=fdPlannedFor(hid,base);
  var act=function(type,id){return acts.find(function(a){return a.a===type&&(!id||a.id===id);});};
  var html='<div class="dv"><div class="stt">🍬 '+L2("Hrănire","Feeding")+'</div></div>';
  A.forEach(function(f){
    var fin=act("fin",f.id),rf=act("rf",f.id),multi=fdActiveHives(f,date).length>1||f.allHives;
    var rfQ=rf?rf.qty:"";
    html+='<div class="tr-card fd-icard">'
      +'<div class="tr-card-h">'+fdTypeIco(f)+' '+L2("Sub hrănire","Being fed")+' <span class="hv-ts">· '+esc(fdTypeShort(f))+(fdQtyTxt(f)?' · '+fdQtyTxt(f):'')+' · '+L2("ziua","day")+' '+fdDayN(f,date)+(multi?' · '+L2("mai mulți stupi","several hives"):'')+'</span></div>'
      +'<label class="ck fd-rf"><input type="checkbox" class="iFdRf" data-id="'+f.id+'"'+(rf?" checked":"")+' onchange="var w=document.getElementById(\'iFdRfW_'+f.id+'\');w.style.display=this.checked?\'block\':\'none\'"> ➕ '+L2("Am mai pus mâncare","I added more feed")+'</label>'
      +'<div id="iFdRfW_'+f.id+'" style="display:'+(rf?"block":"none")+'">'+L(t("hr_qty")+' ('+(f.unit||fdType(f).u)+')')+'<input type="number" inputmode="decimal" step="0.1" id="iFdRfQ_'+f.id+'" value="'+esc(rfQ)+'"></div>'
      +'<label class="tr-fin fd-fin'+(fin?" on":"")+'"><input type="checkbox" class="iFdFin" data-id="'+f.id+'"'+(fin?" checked":"")
      +' onchange="this.parentNode.classList.toggle(\'on\',this.checked);var s=document.getElementById(\'iFdSc_'+f.id+'\');if(s)s.style.display=this.checked?\'flex\':\'none\'">'
      +'⏹️ '+L2("S-a terminat mâncarea – opresc hrănirea","Feed is finished – stop feeding")+'</label>'
      +(multi?'<div class="dev-act tr-sc" id="iFdSc_'+f.id+'" style="display:'+(fin?"flex":"none")+'">'
        +'<label><input type="radio" name="iFdSc_'+f.id+'" value="one"'+(!fin||!fin.all?" checked":"")+'> '+L2("Doar la acest stup","This hive only")+'</label>'
        +'<label><input type="radio" name="iFdSc_'+f.id+'" value="all"'+(fin&&fin.all?" checked":"")+'> '+L2("La toți stupii ei","All its hives")+'</label></div>':'')
      +'</div>';
  });
  P.forEach(function(f){
    var st=act("st",f.id)||act("split",f.id);
    var cur=st?(D.feedings||[]).find(function(x){return x.id===(st.a==="st"?st.id:st.nid);}):null;
    var q=cur?(fdPortions(cur)[0]||{}).qty:"",u=(cur&&cur.unit)||f.unit||fdType(f).u,tp=(cur&&cur.feedType)||f.feedType;
    var d=-Math.round((new Date(date)-new Date(f.date))/86400000);
    html+='<div class="tr-card fd-icard fd-ipl">'
      +'<div class="tr-card-h">🗓️ '+L2("Hrănire planificată","Planned feeding")+' <span class="hv-ts">· '+esc(fdTypeShort(f))+' · '+devFmt(f.date)+(d<0?' · '+L2("întârziată","overdue"):'')+'</span></div>'
      +'<label class="tr-fin fd-go'+(st?" on":"")+'"><input type="checkbox" class="iFdSt" data-id="'+f.id+'"'+(st?" checked":"")
      +' onchange="this.parentNode.classList.toggle(\'on\',this.checked);document.getElementById(\'iFdStW_'+f.id+'\').style.display=this.checked?\'block\':\'none\'">'
      +'▶ '+L2("Am hrănit azi","I fed today")+'</label>'
      +'<div id="iFdStW_'+f.id+'" style="display:'+(st?"block":"none")+';margin-top:8px;">'
      +'<div class="r2"><div>'+L(t("hr_type"))+'<select id="iFdStT_'+f.id+'" onchange="fdTypeUnit(this,\'iFdStU_'+f.id+'\')">'+fdTypeOpts(tp)+'</select></div>'
      +'<div>'+L(t("hr_qty"))+'<div class="fd-qu"><input type="number" inputmode="decimal" step="0.1" id="iFdStQ_'+f.id+'" value="'+esc(q)+'"><select id="iFdStU_'+f.id+'">'+fdUnitOpts(u)+'</select></div></div></div>'
      +(fdPlannedHives(f).length>1?'<div class="hv-ts">'+L2("Pornește doar la acest stup; ceilalți rămân planificați.","Starts on this hive only; the others stay planned.")+'</div>':'')
      +'</div></div>';
  });
  if(!A.length){
    var nw=act("new"),nf=nw?(D.feedings||[]).find(function(x){return x.id===nw.id;}):null;
    var nq=nf?(fdPortions(nf)[0]||{}).qty:"",ntp=nf?nf.feedType:"sirop_1_1",nu=nf?nf.unit:fdType({feedType:ntp}).u;
    html+='<div class="ck"><input type="checkbox" id="iFdNw"'+(nf?" checked":"")+' onchange="document.getElementById(\'iFdNwW\').style.display=this.checked?\'block\':\'none\'"><label for="iFdNw">▶ '+L2("Am început o hrănire azi","I started feeding today")+'</label></div>'
      +'<div id="iFdNwW" class="dev-box fd-ibox" style="display:'+(nf?"block":"none")+'">'
      +'<div class="r2"><div>'+L(t("hr_type"))+'<select id="iFdNwT" onchange="fdTypeUnit(this,\'iFdNwU\')">'+fdTypeOpts(ntp)+'</select></div>'
      +'<div>'+L(t("hr_qty"))+'<div class="fd-qu"><input type="number" inputmode="decimal" step="0.1" id="iFdNwQ" value="'+esc(nq)+'"><select id="iFdNwU">'+fdUnitOpts(nu)+'</select></div></div></div>'
      +'<div class="hv-ts">'+L2("Rămâne „în curs” până o oprești (din inspecție sau din Hrănire).","Stays “in progress” until you stop it (here or in Feeding).")+'</div></div>';
  }
  var pa=act("pl"),pl=pa?(D.feedings||[]).find(function(x){return x.id===pa.id;}):null;
  html+='<div class="ck"><input type="checkbox" id="iFdPl"'+(pl?" checked":"")+' onchange="document.getElementById(\'iFdPlW\').style.display=this.checked?\'block\':\'none\'"><label for="iFdPl">🗓️ '+L2("Planifică o hrănire","Plan a feeding")+'</label></div>'
    +'<div id="iFdPlW" class="dev-box fd-ibox" style="display:'+(pl?"block":"none")+'">'
    +'<div class="r2"><div>'+L(t("hr_type"))+'<select id="iFdPlT">'+fdTypeOpts(pl?pl.feedType:"sirop_2_1")+'</select></div>'
    +'<div>'+L(L2("📅 Data","📅 Date"))+'<input type="date" id="iFdPlD" value="'+(pl?pl.date:devAdd(date,1))+'"></div></div>'
    +'<div class="dev-act tr-sc" style="display:flex;margin-left:0;">'
    +'<label><input type="radio" name="iFdPlS" value="one"'+(!pl||!pl.allHives?" checked":"")+'> '+L2("Doar acest stup","This hive only")+'</label>'
    +'<label><input type="radio" name="iFdPlS" value="all"'+(pl&&pl.allHives?" checked":"")+'> '+L2("Toți stupii","All hives")+'</label></div>'
    +'<div class="hv-ts">'+L2("Apare în Hrănire → Planificate și pe cardul stupului. Cantitatea o scrii când hrănești.","Shows in Feeding → Planned and on the hive card. You enter the quantity when you feed.")+'</div>'
    +'</div>';
  return html;
}
window.inspFdRefresh=function(){
  var box=document.getElementById("iFdSec");if(!box)return;
  var mb=document.getElementById("MB"),exId=mb?mb.dataset.inspId:"";
  var ex=exId?D.inspections.find(function(i){return i.id===exId;}):null;
  var hid=($q("iHive")||{}).value,date=($q("iDt")||{}).value||fdToday();
  box.innerHTML=inspFdSecHTML(hid,ex,date);
};
// On inspection save: undo what the inspection did last time (when editing), then apply what is checked now
function inspFdSave(o,prev){
  if(!document.getElementById("iFdSec"))return;
  if(!D.feedings)D.feedings=[];
  // nothing changed in the feeding section (e.g. only notes edited) → keep everything as it is
  var sig=function(){var a=[];[].forEach.call(document.querySelectorAll(".iFdRf,.iFdFin,.iFdSt"),function(cb){if(cb.checked){var id=cb.dataset.id,c=cb.className;
      a.push(c+id+(c==="iFdRf"?($q("iFdRfQ_"+id)||{}).value:c==="iFdSt"?($q("iFdStQ_"+id)||{}).value+($q("iFdStT_"+id)||{}).value:(document.querySelector("input[name='iFdSc_"+id+"']:checked")||{}).value||""));}});
    if($q("iFdNw")&&$q("iFdNw").checked)a.push("nw"+($q("iFdNwQ")||{}).value+($q("iFdNwT")||{}).value+($q("iFdNwU")||{}).value);
    if($q("iFdPl")&&$q("iFdPl").checked)a.push("pl"+($q("iFdPlT")||{}).value+($q("iFdPlD")||{}).value+((document.querySelector("input[name='iFdPlS']:checked")||{}).value||""));
    return a.join("|");};
  var nowSig=sig();
  if(prev&&prev.fdSig!=null&&prev.fdSig===nowSig&&prev.date===o.date){o.fdActs=prev.fdActs||[];o.fdSig=nowSig;return;}
  var kept=prev&&prev.fdActs?fdRevert(prev.fdActs,D.feedings,prev.id,true):{};
  var acts=[],hid=o.hiveId,d=o.date;
  var byId=function(id){return D.feedings.find(function(x){return x.id===id;});};
  // ➕ added more
  [].forEach.call(document.querySelectorAll(".iFdRf"),function(cb){
    if(!cb.checked)return;var f=byId(cb.dataset.id);if(!f)return;
    var q=parseFloat(($q("iFdRfQ_"+f.id)||{}).value)||0;if(!q)return;
    f.portions=fdPortions(f).slice();f.portions.push({date:d,qty:q,insp:o.id});f.per=true;fdSumQty(f);
    acts.push({a:"rf",id:f.id,qty:q});
  });
  // ⏹️ stop
  [].forEach.call(document.querySelectorAll(".iFdFin"),function(cb){
    if(!cb.checked)return;var f=byId(cb.dataset.id);if(!f)return;
    var all=(document.querySelector("input[name='iFdSc_"+f.id+"']:checked")||{}).value==="all";
    var r=fdStopHives(f,all?fdActiveHives(f,d).concat([hid]):[hid],d);
    acts.push({a:"fin",id:f.id,all:all,hives:r.hives,end:r.end,conv:r.conv});
  });
  // ▶ fed (planned)
  [].forEach.call(document.querySelectorAll(".iFdSt"),function(cb){
    if(!cb.checked)return;var f=byId(cb.dataset.id);if(!f)return;
    if(kept.st&&kept.st[f.id]){acts.push(kept.st[f.id]);return;}   // already started and used since: keep as is
    var q=parseFloat(($q("iFdStQ_"+f.id)||{}).value)||0;
    var r=fdStartPlanned(f,[hid],d,($q("iFdStT_"+f.id)||{}).value||f.feedType,q,($q("iFdStU_"+f.id)||{}).value||f.unit);
    if(r.a==="split"){var nf=byId(r.nid);if(nf)nf.notes=L2("Din inspecția din","From the inspection of")+" "+d;}
    acts.push(r);
  });
  // ▶ new feeding
  if($q("iFdNw")&&$q("iFdNw").checked){
    var q=parseFloat(($q("iFdNwQ")||{}).value)||0;
    if(kept["new"]&&kept["new"].live){   // top-ups / stops added since: update only the start of the feeding
      var lf=kept["new"].f,p0=Object.assign({},fdPortions(lf)[0]||{},{date:d,qty:q});
      lf.portions=[p0].concat(fdPortions(lf).slice(1));lf.date=d;lf.feedType=($q("iFdNwT")||{}).value||lf.feedType;lf.unit=($q("iFdNwU")||{}).value||lf.unit;fdSumQty(lf);
      acts.push({a:"new",id:lf.id});
    }else{
    var nf=(kept["new"]&&kept["new"].f)||{id:uid()};
    Object.assign(nf,{per:true,allHives:false,hiveIds:[hid],hiveId:hid,date:d,feedType:($q("iFdNwT")||{}).value||"sirop_1_1",
      unit:($q("iFdNwU")||{}).value||"L",portions:[{date:d,qty:q}],reason:nf.reason||"",notes:nf.notes||L2("Din inspecția din","From the inspection of")+" "+d,fromInspection:o.id});
    delete nf.planned;delete nf.endDate;nf.doneHives={};fdSumQty(nf);
    D.feedings.push(nf);acts.push({a:"new",id:nf.id});
    }
  }
  // 🗓️ planning
  if($q("iFdPl")&&$q("iFdPl").checked){
    var all2=(document.querySelector("input[name='iFdPlS']:checked")||{}).value==="all";
    var tp=($q("iFdPlT")||{}).value||"sirop_2_1";
    if(kept.pl&&kept.pl.started){acts.push({a:"pl",id:kept.pl.f.id});}
    else{
    var pf=(kept.pl&&kept.pl.f)||{id:uid()};
    Object.assign(pf,{per:true,planned:true,allHives:all2,hiveIds:all2?D.hives.map(function(h){return h.id;}):[hid],hiveId:all2?null:hid,date:($q("iFdPlD")||{}).value||devAdd(d,1),
      feedType:tp,unit:fdType({feedType:tp}).u,portions:[],qty:0,reason:pf.reason||"",notes:pf.notes||L2("Planificat din inspecția din","Planned from the inspection of")+" "+d,fromInspection:o.id});
    D.feedings.push(pf);acts.push({a:"pl",id:pf.id});
    }
  }
  o.fdActs=acts;o.fdSig=nowSig;
}
