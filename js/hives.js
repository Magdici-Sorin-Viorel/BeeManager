// BeeManager Pro — hives.js
// Hives (with integrated queen: data, replacement, history)

// ═══════════════════════════════════════════
// HIVES
// ═══════════════════════════════════════════

// ── Hive queen ──────────────────────────────────────────────
// Queens still live in D.queens (field "hive" = the hive id).
// Current queen = the hive's latest queen that is not „înlocuită” (replaced).
// The „înlocuite” (replaced) ones form the hive's history.
function hqCurrent(hiveId){
  var qs=(D.queens||[]).filter(function(q){return q.hive===hiveId&&q.status!=="înlocuită";});
  return qs.length?qs[qs.length-1]:null;
}
function hqHistory(hiveId){
  return (D.queens||[]).filter(function(q){return q.hive===hiveId&&q.status==="înlocuită";});
}
function hqStatusLbl(st){var e=(t("q_statuses")||[]).find(function(s){return s[0]===st;});return e?e[1]:st;}

// Queen fields in the hive form (q = queen to edit, or null for a new one)
function hqFieldsHTML(q,hiveId){
  var races=t("queen_races")||[],qSts=t("q_statuses")||[],qOrigs=t("q_origins")||[];
  var race=xv(q,"race",""),orig=xv(q,"orig","");
  // keeps old values even if they are no longer in the list (e.g. saved in another language)
  if(race&&races.indexOf(race)<0)races=[race].concat(races);
  if(orig&&qOrigs.indexOf(orig)<0)qOrigs=[orig].concat(qOrigs);
  var oi=typeof qOrigIdx==="function"?qOrigIdx(orig||qOrigs[0]):1,needH=oi===1||oi===2;
  var lv=function(id,v,lo,hi){var o="";for(var k=1;k<=5;k++)o+='<option value="'+k+'"'+(parseInt(v)===k?" selected":"")+'>'+k+(k===1?" — "+lo:k===5?" — "+hi:"")+'</option>';return'<select id="'+id+'">'+o+'</select>';};
  // order: race · year → origin · since → (mother hive, only for own / raised queens) → status · line → laying · temper
  return'<div class="r2"><div>'+L("🧬 Rasă")+'<select id="qR">'+races.map(function(r){return'<option value="'+esc(r)+'"'+(race===r?" selected":"")+'>'+esc(r)+'</option>';}).join("")+'</select></div>'
    +'<div>'+L("📅 Anul nașterii")+'<input id="qY" type="number" inputmode="numeric" value="'+esc(xv(q,"yr",new Date().getFullYear()))+'"></div></div>'
    +'<div class="r2"><div>'+L("🌱 Origine")+'<select id="qOr" onchange="hqOrigChg(this)">'+qOrigs.map(function(o){return'<option value="'+esc(o)+'"'+(orig===o?" selected":"")+'>'+esc(o)+'</option>';}).join("")+'</select></div>'
    +'<div>'+L("📅 În stup din")+'<input type="date" id="qFr" value="'+esc(q?(typeof qFrom==="function"?qFrom(q):(q.from||"")):todayISO())+'"></div></div>'
    +'<div id="qOHw" style="display:'+(needH?"block":"none")+'">'+L("🏠 Din ce stup vine")+'<select id="qOH"><option value="">'+t("q_orig_none")+'</option>'+D.hives.filter(function(h){return h.id!==hiveId;}).map(function(h){return'<option value="'+h.id+'"'+(xv(q,"origHive","")===h.id?" selected":"")+'>'+esc(h.name)+'</option>';}).join("")+'</select></div>'
    +'<div class="r2"><div>'+L("🔘 Status")+'<select id="qSt">'+qSts.filter(function(s){return s[0]!=="înlocuită";}).map(function(s){return'<option value="'+s[0]+'"'+(xv(q,"status","activă")===s[0]?" selected":"")+'>'+s[1]+'</option>';}).join("")+'</select></div>'
    +'<div>'+L("📜 Linie genetică")+'<input id="qLn" value="'+esc(xv(q,"line",""))+'" placeholder="'+t("q_line_ph")+'"></div></div>'
    +'<div class="r2"><div>'+L("⭐ Pontă")+lv("qLy",xv(q,"lay",4),"slabă","excelentă")+'</div>'
    +'<div>'+L("😠 Agresivitate")+lv("qAg",xv(q,"aggr",2),"blândă","foarte agresivă")+'</div></div>';
}
// mother hive field only for queens from own nucs / raised locally
window.hqOrigChg=function(sel){var k=typeof qOrigIdx==="function"?qOrigIdx(sel.value):1,w=document.getElementById("qOHw");if(w)w.style.display=(k===1||k===2)?"block":"none";};

// Full „Regina” section of the form (redrawn on Replace / Delete)
var _hqReplace=false;
function hqBoxHTML(hiveId){
  var cur=hiveId?hqCurrent(hiveId):null;
  var html="";
  if(_hqReplace&&cur){
    html+='<div class="al ali" style="font-size:.76rem;margin-bottom:8px;">'+t("hq_replace_note")+'<br><span style="color:var(--mut)">👑 '+esc(cur.race||"")+(cur.yr?' · '+cur.yr:'')+'</span></div>'
      +hqFieldsHTML(null,hiveId)
      +'<div class="br" style="margin-top:6px;"><button type="button" class="btn sm gh" onclick="hqReplaceToggle(\''+hiveId+'\',false)">'+t("hq_replace_cancel")+'</button></div>';
  }else if(cur){
    html+=hqFieldsHTML(cur,hiveId)
      +'<div class="br" style="margin-top:6px;"><button type="button" class="btn sm" onclick="hqReplaceToggle(\''+hiveId+'\',true)">'+t("hq_replace")+'</button>'
      +'<button type="button" class="btn sm bd" onclick="hqDelete(\''+hiveId+'\',\''+cur.id+'\')">'+t("hq_del")+'</button></div>';
  }else{
    var checked=!hiveId; // new hive → checked by default
    html+='<div class="ck"><input type="checkbox" id="hqHas"'+(checked?" checked":"")+' onchange="document.getElementById(\'hqFields\').style.display=this.checked?\'block\':\'none\'"><label for="hqHas">'+t("hq_add")+'</label></div>'
      +(hiveId?'<div class="hint" style="margin-bottom:6px;">'+t("hq_no_q_hint")+'</div>':'')
      +'<div id="hqFields" style="display:'+(checked?"block":"none")+'">'+hqFieldsHTML(null,hiveId)+'</div>';
  }
  var hist=hiveId?hqHistory(hiveId):[];
  if(hist.length){
    html+='<div style="margin-top:10px;font-size:.76rem;font-weight:700;color:var(--mut);">'+t("hq_history")+'</div>'
      +hist.slice().reverse().map(function(q){
        return'<div style="display:flex;justify-content:space-between;align-items:center;gap:6px;font-size:.74rem;color:var(--mut);padding:4px 0;border-bottom:1px solid var(--bdr);">'
          +'<span>👑 '+esc(q.race||"—")+(q.yr?' · '+q.yr:'')+' · ⭐ '+(q.lay||"—")+' · 😠 '+(q.aggr||"—")+(q.line?' · 🧬 '+esc(q.line):'')+(q.replacedAt?' · '+t("hq_replaced_on")+' '+q.replacedAt:'')+'</span>'
          +'<button type="button" class="btn sm gh" style="padding:2px 7px;font-size:.65rem;" onclick="hqDelete(\''+hiveId+'\',\''+q.id+'\')">🗑️</button></div>';
      }).join("");
  }
  return html;
}
window.hqReplaceToggle=function(hiveId,on){
  _hqReplace=!!on;
  var box=$q("hqBox");if(box)box.innerHTML=hqBoxHTML(hiveId);
};
window.hqDelete=function(hiveId,qid){
  showConfirm(t("hq_del_c"),function(){
    // her daughters are re-attached to her mother, so the line is not split
    var dq=(D.queens||[]).find(function(q){return q.id===qid;}),gm=dq&&typeof qMother==="function"?qMother(dq):null;
    (D.queens||[]).forEach(function(q){if(q.id!==qid&&typeof qMother==="function"&&qMother(q)===dq){q.motherQ=gm?gm.id:null;q.motherSet=true;}});
    D.queens=D.queens.filter(function(q){return q.id!==qid;});
    save(false);_hqReplace=false;
    var box=$q("hqBox");if(box)box.innerHTML=hqBoxHTML(hiveId);
    renderHives();
  });
};
function hqRead(){
  return{yr:parseInt(($q("qY")||{}).value)||null,race:($q("qR")||{}).value||"",lay:parseInt(($q("qLy")||{}).value)||null,aggr:parseInt(($q("qAg")||{}).value)||null,orig:($q("qOr")||{}).value||"",origHive:(function(){var w=document.getElementById("qOHw");return w&&w.style.display==="none"?null:(($q("qOH")||{}).value||null);})(),line:(($q("qLn")||{}).value||"").trim(),status:($q("qSt")||{}).value||"activă",from:($q("qFr")||{}).value||null};
}

// ── Hive inspections (merged from the Inspections module) ─────────
var _hvInspOpen={};    // hives with the inspection list expanded
var _hvInspDetail={};  // inspections expanded in detail
// ❄️ Wintering status: the hive is "în iernare" while its latest inspection is a winter-mode one.
// since = first winter-mode inspection of the current run; food / frames = from the latest check.
// It ends by itself with the first normal (non-winter) inspection.
function hvWinterState(h){
  var l=hvInsps(h.id);if(!l.length||!l[0].winterMode)return null;
  var since=l[0].date;for(var k=0;k<l.length&&l[k].winterMode;k++)since=l[k].date;
  var w=l[0].wch||{};
  return{since:since,food:w.food||"",frames:l[0].winter&&l[0].winter.frames!=null?l[0].winter.frames:null,last:l[0].date};
}
// ⬢ plastic-foundation frames in the hive (badge on the card)
function hvPlBadge(h){var n=parseInt(h&&h.plastic)||0;return n?'<span class="bg hv-pl" title="Rame cu fundație de plastic">⬢ '+n+' plastic</span>':'';}
function hvWinterBanner(h){
  var w=hvWinterState(h);if(!w)return"";
  var fd={ok:["ok","provizii suficiente"],limit:["lim","provizii la limită"],low:["low","provizii insuficiente — de hrănit"]}[w.food]||null;
  return'<div class="hv-win'+(fd?" "+fd[0]:"")+'">❄️ <b>În iernare</b> din '+devFmt(w.since)
    +(w.frames!=null?' · 🐝 ghem pe '+w.frames+' rame':'')+(fd?' · 🍯 '+fd[1]:'')+'</div>';
}
function hvInsps(hiveId){
  return D.inspections.filter(function(i){return i.hiveId===hiveId&&i.date;})
    .sort(function(a,b){return new Date(b.date)-new Date(a.date);});
}
function hvDaysSince(dateStr){
  var a=new Date(dateStr);a.setHours(0,0,0,0);var b=new Date();b.setHours(0,0,0,0);
  return Math.round((b-a)/86400000);
}
function hvThreshold(){return parseInt(D.settings.inspAlertThreshold)||INSP_ALERT_DEFAULT;}

// Active migration: departed (start ≤ today) and not returned (no return date, or in the future).
// The field appears ONLY for hives currently on migration.
function hvPastActive(hiveId){return pTripOf(hiveId);}   // the trip the hive is currently on (pastorage.js)
// „Sub hrănire”: has an ongoing feeding (started and not stopped — see feeding.js)
function hvIsFed(hiveId){return fdActiveFor(hiveId).length>0;}
// „Sub tratament”: treatments on this hive or on all hives (empty hiveId)
// active = start ≤ today ≤ end (no end date = that day only)
function hvTreatInfo(hiveId){
  var today=todayISO();
  var trs=(D.treatments||[]).filter(function(tr){return tr.date&&(!tr.hiveId||tr.hiveId===hiveId);});
  var end=function(tr){return trEnd(tr,hiveId);};
  return{
    active:trs.filter(function(tr){return trIsActive(tr,hiveId,today);}).sort(function(a,b){return end(a)<end(b)?-1:1;}),
    planned:trs.filter(function(tr){return tr.date>today;}).sort(function(a,b){return a.date<b.date?-1:1;})[0]||null,
    last:trs.filter(function(tr){return tr.date<=today&&!trIsActive(tr,hiveId,today);}).sort(function(a,b){return end(a)>end(b)?-1:1;})[0]||null,
    today:today
  };
}
// ═══════════════════════════════════════════
// DISPLAY — hive card
// ═══════════════════════════════════════════
// Card layout (top to bottom, in the order you look at a hive):
// Rule: the card shows ONLY what is happening now (no „Nu” fields).
//  1. Header: hive no., name, strength + status; location · model · material; queen (one line)
//     (left colored bar = status: green / yellow / red)
//  2. „În pastorare” band — only if the hive is currently on migration
//  3. „Ongoing” rows — only if any: 🍬 being fed · 💊 under treatment
//     (+ varroa count and ➕ Numără) · 🗓️ treatment within ≤ 7 days
//     · 👑 new queen / 💞 mating / 🥚 check laying · 🐝 new bees · ✂️ check queen cells
//     (the latter only if requested at inspection — see devcalc.js)
//  4. Brood-box frames: total + brood / food bar (+ supers, only if any)
//  5. Inspections: latest inspection + collapsible history
//  6. Actions: New inspection (primary), Edit, Delete

function hvAgo(dateStr){
  var d=hvDaysSince(dateStr);
  if(d<=0)return t("hv_today");
  if(d===1)return t("hv_yday");
  return t("hv_ago_pre")+d+" "+t("hv_days")+t("hv_ago_post");
}

// Queen: always, on one short line (status shown only if not „activă”)
function hvQueenLine(h){
  var q=hqCurrent(h.id);
  if(!q)return'<div class="hv-q bad">👑 '+t("h_no_q")+'</div>';
  var stCls=(t("qs_cls")||{})[q.status]||"gy";
  var sc=typeof qScoreOf==="function"?qScoreOf(q):null;
  return'<div class="hv-q">👑 <b>'+esc(q.race||"Rasă nenotată")+'</b>'+(q.yr?' <span class="hv-dim">\''+String(q.yr).slice(2)+'</span>':'')+(typeof qCodeTag==="function"?' '+qCodeTag(q):'')+(sc!=null?' '+genScoreBadge(sc):'')
    +(q.status&&q.status!=="activă"?' <span class="bg '+stCls+'">'+cap(hqStatusLbl(q.status))+'</span>':'')+'</div>';
}

// A status row (shown only when something is happening)
function hvStRow(tone,icon,title,sub,onclick,btn){
  return'<div class="hv-st t-'+tone+'"'+(onclick?' onclick="'+onclick+'" role="button"':'')+'>'
    +'<span class="hv-st-i">'+icon+'</span>'
    +'<div class="hv-st-b"><div class="hv-st-t">'+cap(title)+'</div>'+(sub?'<div class="hv-st-s">'+cap(sub)+'</div>':'')+'</div>'
    +(btn||'')+'</div>';
}

// Hive status rows — only what is ongoing:
//   🍬 being fed (with last amount)  ·  💊 under treatment (with varroa count)
//   💊 treatment starting within ≤ 7 days
function hvStatusHTML(h){
  var rows=[];
  // Ongoing feeding (type + total given) and planned feeding (always; red when the day has come)
  fdActiveFor(h.id).forEach(function(f){
    rows.push(hvStRow("ok",fdTypeIco(f),L2("Sub hrănire","Being fed")+' · '+esc(fdTypeShort(f))+(fdQtyTxt(f)?' · <b>'+fdQtyTxt(f)+'</b>':''),
      L2("pornită","started")+' '+hvAgo(f.date)+' · '+L2("ziua","day")+' '+fdDayN(f),"go('hranire')",
      '<button class="hv-vrc-add fd-stop-b" onclick="event.stopPropagation();fdStopM(\''+f.id+'\',\''+h.id+'\')">⏹️ '+L2("Oprește","Stop")+'</button>'));
  });
  var fp=fdPlannedFor(h.id)[0];
  if(fp){
    var fd=-hvDaysSince(fp.date);
    rows.push(hvStRow(fd<=0?"bad":"warn","🗓️",L2("Hrănire planificată","Planned feeding")+' · '+esc(fdTypeShort(fp))+' · '+fp.date,
      fd<0?L2("Întârziată","Overdue")+' '+(-fd)+' '+t("hv_days"):fd===0?L2("Azi","Today"):fd===1?L2("Mâine","Tomorrow"):L2("În","In")+' '+fd+' '+t("hv_days"),"go('hranire')",
      '<button class="hv-vrc-add fd-go-b" onclick="event.stopPropagation();fdStartM(\''+fp.id+'\',\''+h.id+'\')">▶ '+L2("Am hrănit","Fed")+'</button>'));
  }
  // Ongoing treatments (no product name — see Tratamente). Finished → disappears.
  var x=hvTreatInfo(h.id);
  x.active.slice().sort(function(a,b){return(trIsVarroa(b)?1:0)-(trIsVarroa(a)?1:0);}).forEach(function(tr){
    var e=trEnd(tr,h.id),left=hvDaysSince(x.today)-hvDaysSince(e);
    var sub=(e===x.today&&!tr.endDate)?t("hv_tr_today"):t("hv_tr_until")+" "+e+(left>0?" · "+(t("hv_tr_left")?t("hv_tr_left")+" ":"")+left+" "+t("hv_days"):"");
    var btn="";
    if(trIsVarroa(tr)){
      var s=trStats(tr,h.id);
      sub+='<br>🕷️ '+(s.during?'<b>'+s.total+'</b> '+L2("căzuți","fallen")+' · '+s.during+' '+L2("num.","counts")+(s.last?' · '+hvAgo(s.last.date):''):'<span class="hv-dim">'+L2("nicio numărătoare încă","no counts yet")+'</span>');
      btn='<button class="hv-vrc-add" title="'+L2("Numărătoare varroa","Varroa count")+'" onclick="event.stopPropagation();vrM(\'\',{hiveId:\''+h.id+'\',treatmentId:\''+tr.id+'\'})">➕ '+L2("Numără","Count")+'</button>';
    }else sub+='<br>🩺 '+L2("alt scop","other purpose");
    rows.push(hvStRow("info","💊",L2("Sub tratament","Under treatment"),sub,"go('treatments')",btn));
  });
  // Planned treatment: only in the last 7 days before, in red (also when another treatment is ongoing)
  if(x.planned){
    var inD=hvDaysSince(x.today)-hvDaysSince(x.planned.date);
    if(inD<=7)rows.push(hvStRow("bad","🗓️",L2("Tratament planificat","Planned treatment")+' · '+x.planned.date,
      inD<=1?L2("Mâine","Tomorrow"):L2("În","In")+" "+inD+" "+t("hv_days"),"go('treatments')"));
  }
  // New queen / mating / laying, new bees, queen-cell check — from calculations ticked at inspection
  rows=rows.concat(devHiveRows(h));
  return rows.length?'<div class="hv-sec hv-sts">'+rows.join("")+'</div>':'';
}

// Brood-box frames: total + brood / food bar
function hvFramesHTML(h,withMags){
  var b=parseInt(h.fB)||0,f=parseInt(h.fH)||0,tot=b+f,pb=tot?Math.round(b/tot*100):0;
  return'<div class="hv-sec hv-fr">'
    +'<div class="hv-fr-top"><span class="hv-tl">📊 '+t("hv_nest")+'</span>'
    +'<span class="hv-fr-tot"><b>'+tot+'</b> '+t("hv_frames")+'</span>'
    +'</div>'
    +'<div class="hv-bar">'+(tot?'<i class="b" style="width:'+pb+'%"></i><i class="f" style="width:'+(100-pb)+'%"></i>':'')+'</div>'
    +'<div class="hv-leg"><span><i class="dot b"></i><b>'+b+'</b> '+t("hv_brood_l")+'</span><span><i class="dot f"></i><b>'+f+'</b> '+t("hv_food_l")+'</span>'
    // ❄️ cold season: the cluster size (frames with bees) is what the strength is based on
    +(h.bees!=null&&h.beesDate&&(function(){var m=parseInt(todayISO().slice(5,7));return m>=10||m<=3;})()&&hvDaysSince(h.beesDate)<120?'<span title="Rame cu albine la inspecția din '+devFmt(h.beesDate)+'">🐝 <b>'+h.bees+'</b> cu albine</span>':'')
    +'</div>'
    +(withMags?hvMagsHTML(h):'')   // ★ capping-percentage module — in Pastorare
    +'</div>';
}

// „În pastorare” band (only if active)
function hvPastBanner(h){
  var p=hvPastActive(h.id);if(!p)return"";
  return'<div class="hv-past" onclick="go(\'pastorare\')" role="button">'
    +'<div><b>'+t("hv_past")+'</b> · 📍 '+esc(p.location||"—")+(p.target?' · 🌸 '+esc(p.target):'')+'</div>'
    +'<div class="hv-ts">'+cap(t("hv_left"))+' '+hvAgo(p.startDate)+' · '+((p.plannedEnd||(!p.trip&&p.endDate))?t("hv_past_back")+' '+(p.plannedEnd||p.endDate):t("hv_past_open"))+'</div>'
    +'</div>';
}

// Inspections: latest + collapsible history (each inspection expands in detail)
function hvInspSecHTML(h,insps){
  var open=!!_hvInspOpen[h.id],li=insps[0];
  var late=!hvIsNuc(h)&&!hvWinterState(h)&&(!li||hvDaysSince(li.date)>=hvThreshold());   // nucs and wintering hives have no weekly warning
  var rows=insps.map(function(i){
    var det=!!_hvInspDetail[i.id];
    var detail=inspCardHTML(i,false).replace('<div class="c">','<div class="c" style="margin:4px 0 8px;padding:10px;box-shadow:none;background:rgba(255,255,255,.03);">');
    return'<div class="hv-ir">'
      +'<div class="hv-ir-h" onclick="hvInspDetail(\''+i.id+'\')">'
      +'<span class="hv-ir-d">'+i.date+'</span>'
      +(i.transfer?'<span class="bg gb">🔄 transfer</span><span class="bg gy">🥚 '+(i.fB||0)+'</span><span class="bg gg">🍯 '+inspFood(i)+'</span>'
        :i.winterMode?'<span class="bg gb">❄️</span>'+(i.winter&&i.winter.frames!=null?'<span class="bg gy">🐝 '+i.winter.frames+'</span>':'')
        :'<span class="bg '+(i.qSeen?"gg":"gy")+'">'+(i.qSeen?"👑✅":"👑❓")+'</span>'
      +'<span class="bg gy">🥚 '+(i.fB||0)+'</span>'
      +'<span class="bg gg">🍯 '+inspFood(i)+'</span>')
      +(i.weight&&i.weight.kg?'<span class="bg gb">⚖️ '+String(i.weight.kg).replace(".",",")+'</span>':"")
      +(i.botci?'<span class="bg gr">🐛</span>':"")
      +(i.pastId?'<span class="bg gb" title="'+esc(i.pastLoc||"")+'">🚚</span>':"")
      +((i.diseases||[]).length?'<span class="bg gr">🦠</span>':"")
      +'<span id="hvIDA_'+i.id+'" class="hv-arr">'+(det?"▲":"▼")+'</span></div>'
      +'<div id="hvID_'+i.id+'" style="display:'+(det?"block":"none")+'">'+detail+'</div>'
      +'</div>';
  }).join("");
  return'<div class="hv-sec hv-ins-w">'
    +'<div class="hv-ins'+(late?' late':'')+'" onclick="hvInspToggle(\''+h.id+'\')" role="button">'
    +'<span>📋 '+t("hv_insp_l")+' <span class="bg gy">'+insps.length+'</span></span>'
    +'<span class="hv-ins-last">'+(late?'⚠️ ':'')+cap(li?t("hv_last")+': '+hvAgo(li.date):t("hv_never_insp"))
    +' <span id="hvIA_'+h.id+'" class="hv-arr">'+(open?"▲":"▼")+'</span></span></div>'
    +'<div id="hvI_'+h.id+'" class="hv-ins-list" style="display:'+(open?"block":"none")+';">'
    +(insps.length?rows:'<div class="hv-ts" style="padding:8px 2px;">'+t("hv_insp_none")+'</div>')
    +'</div></div>';
}

// Full card — layout (mobile first):
//   header: number · name · place / model · hive drawing
//   chips:  strength · health · ❄️ wintering · ⬢ plastic
//   queen line · banners (wintering, migration) · ongoing (feeding, treatment) · frames · inspections · actions
function hvChipsHTML(h){
  var sc=h.sc==="red"?["gr","🔴 Problemă"]:h.sc==="yellow"?["gy","🟡 Atenție"]:["gg","🟢 Sănătos"];
  return'<div class="hv-chips">'+sBadge(h.str)+'<span class="bg '+sc[0]+'">'+sc[1]+'</span>'
    +hvPlBadge(h)+'</div>';   // ❄️ wintering has its own band below
}
function hvCardHTML(h,opt){
  opt=opt||{};
  var insps=hvInsps(h.id);
  var sc=h.sc==="red"?"red":h.sc==="yellow"?"yellow":"green";
  var meta=[h.loc?"📍 "+esc(h.loc):"",esc((h.mod||"").replace(/\s*rame$/i,"")),h.mat?matIc(h.mat)+" "+esc(h.mat):""].filter(Boolean).join(" · ");
  return'<div class="c hv-card s-'+sc+'">'
    // 1. header
    +'<div class="hv-sec hv-hd">'
    +'<span class="hv-num">'+(h.num||"·")+'</span>'
    +'<div class="hv-hd-t"><div class="hv-name">'+esc(h.name)+'</div>'
    +'<div class="hv-meta">'+meta+'</div></div>'
    +'<div class="hv-hd-r">'+hvHiveIcon(h)+'</div>'
    +'</div>'
    +'<div class="hv-sub">'+hvChipsHTML(h)+hvQueenLine(h)
    +(h.notes?'<div class="hv-notes">📝 '+esc(h.notes)+'</div>':'')+'</div>'
    +hvWinterBanner(h)
    // 2. migration
    +(opt.past?'':hvPastBanner(h))
    // 3. what's ongoing (only if anything): feeding, treatment (+ varroa count), planned treatment
    +hvStatusHTML(h)
    // 4. frames
    +hvFramesHTML(h,opt.past)
    // 5. inspections
    +hvInspSecHTML(h,insps)
    // 6. actions: one main button + small round ones
    +'<div class="hv-sec hv-act">'
    +'<button class="btn hv-act-main" onclick="inspM(\''+h.id+'\')">🔍 '+t("hv_new_insp")+'</button>'
    +'<button class="hv-ib" onclick="hiveM(\''+h.id+'\')" title="'+t("hv_edit")+'" aria-label="'+t("hv_edit")+'">✏️</button>'
    +'<button class="hv-ib" onclick="nucM(\'\',\''+h.id+'\')" title="Fă roi din acest stup" aria-label="Fă roi din acest stup">🐝</button>'
    +'<button class="hv-ib hv-del" onclick="delH(\''+h.id+'\')" title="'+t("h_del_c")+'" aria-label="Șterge stupul">🗑️</button>'
    +'</div>'
    +'</div>';
}
window.hvInspToggle=function(hid){
  _hvInspOpen[hid]=!_hvInspOpen[hid];
  var el=document.getElementById("hvI_"+hid);if(el)el.style.display=_hvInspOpen[hid]?"block":"none";
  var ar=document.getElementById("hvIA_"+hid);if(ar)ar.textContent=_hvInspOpen[hid]?"▲":"▼";
};
window.hvInspDetail=function(id){
  _hvInspDetail[id]=!_hvInspDetail[id];
  var el=document.getElementById("hvID_"+id);if(el)el.style.display=_hvInspDetail[id]?"block":"none";
  var ar=document.getElementById("hvIDA_"+id);if(ar)ar.textContent=_hvInspDetail[id]?"▲":"▼";
};

// ═══════════════════════════════════════════
// DISPLAY — Hives page
// ═══════════════════════════════════════════
// Quick summary at the top (replaces what the Dashboard showed about hives)
function hvSummaryHTML(){
  var hs=D.hives.filter(function(h){return !hvIsNuc(h);});
  var n=function(f){return hs.filter(f).length;};
  var chips=[
    ['gg','💪 '+n(function(h){return h.str==="puternic";})+' '+t("hv_s_strong")],
    ['gy','⚡ '+n(function(h){return h.str==="mediu";})+' '+t("hv_s_med")],
    ['gr','⚠️ '+n(function(h){return h.str==="slab";})+' '+t("hv_s_weak")]
  ];
  var tr=n(function(h){return hvTreatInfo(h.id).active.length>0;});
  var pa=n(function(h){return !!hvPastActive(h.id);});
  var fe=n(function(h){return hvIsFed(h.id);});
  if(tr)chips.push(['gb','💊 '+tr+' '+t("hv_s_tr")]);
  if(pa)chips.push(['gb','🚚 '+pa+' '+t("hv_s_past")]);
  if(fe)chips.push(['gg','🍬 '+fe+' '+t("hv_s_fed")]);
  var wi=n(function(h){return !!hvWinterState(h);});
  if(wi)chips.push(['gb','❄️ '+wi+' în iernare']);

  return'<div class="hv-sum">'+chips.map(function(c){return'<span class="bg '+c[0]+'">'+c[1]+'</span>';}).join("")+'</div>';
}

// Alert: hives not inspected beyond the threshold in Settings
function hvAlertHTML(){
  var th=hvThreshold();
  // wintering hives: no weekly alert
  var late=D.hives.filter(function(h){return !hvIsNuc(h)&&!hvWinterState(h);}).map(function(h){var li=hvInsps(h.id)[0];return{h:h,d:li?hvDaysSince(li.date):null};})
    .filter(function(x){return x.d===null||x.d>=th;});
  if(!late.length)return"";
  return'<div class="sa hv-alert">'
    +'<div><strong>⚠️ '+t("insp_alert_title")+'</strong> <span class="hv-ts">· '+t("hv_alert_lbl")+' '+th+' '+t("hv_days")+'</span></div>'
    +'<div class="hv-alert-c">'+late.map(function(x){
      return'<span class="bg gr" role="button" onclick="inspM(\''+x.h.id+'\')">🔍 '+esc(x.h.name)+' · '+(x.d===null?t("hv_never"):x.d+' '+t("hv_days"))+'</span>';
    }).join("")+'</div>'
    +'</div>';
}

// Supers: number of supers on the hive (old hives only had Yes/No → 1 / 0)
function hvMagCount(h){if(!h)return 0;if(h.magCount!=null)return parseInt(h.magCount)||0;return h.hasMag?1:0;}
// Each super: {f: frames, cap: % capped}; [0] = bottom (above brood box). Old hives → from count × frames/super
function hvMags(h){
  if(!h)return[];
  var n=hvMagCount(h),per=parseInt(h.magF)||10;
  var a=Array.isArray(h.mags)?h.mags.slice(0,n):[];
  while(a.length<n)a.push({f:per,cap:0});
  return a.map(function(m){return{f:parseInt(m.f)||0,cap:parseInt(m.cap)||0};});
}
// Small drawing: roof + one super each (colored by % capped) + body (brood box)
function hvHiveIcon(h){
  var ms=hvMags(h),n=ms.length,shown=Math.min(n,6),sup="";
  for(var i=shown-1;i>=0;i--)sup+='<i class="s" style="'+magBarStyle(ms[i].cap)+'"></i>';
  var lbl=n?n+' '+(n===1?L2("magazie","super"):L2("magazii","supers"))+' — '+ms.map(function(m,i){return'M'+(i+1)+': '+m.cap+'%';}).reverse().join(', '):L2("fără magazie","no super");
  return'<div class="hv-ico" title="'+lbl+'"><i class="r"></i>'+(n>6?'<i class="more">+'+(n-6)+'</i>':'')+sup+'<i class="b"></i><i class="ft"></i>'
    +(n?'<span class="hv-ico-n">'+n+' '+L2("mag.","sup.")+'</span>':'')+'</div>';
}
// ★ „CAPPING-PERCENTAGE MODULE” (kept for Pastorare — currently unused on the card, at your request, 26.10.2026)
// Stack of supers (top → bottom), each with a bar colored by % capped frames + frame count.
// Usage: hvMagsHTML(hive) → HTML; .hv-mgs / .hv-mg* styles are in css/style.css.
function hvMagsHTML(h){
  var ms=hvMags(h),n=ms.length;if(!n)return"";
  var rows="";
  for(var i=n-1;i>=0;i--){var m=ms[i];
    rows+='<div class="hv-mg"><span class="hv-mg-n">M'+(i+1)+'</span>'
      +'<div class="hv-mg-bar'+(m.cap<25?' lo':'')+'" style="'+magBarStyle(m.cap)+'"><span>'+m.cap+'%</span></div>'
      +'<span class="hv-mg-f">'+m.f+' '+L2("rame","fr.")+'</span></div>';}
  return'<div class="hv-mgs"><div class="hv-mgs-t"><span class="hv-tl">📦 '+n+' '+(n===1?L2("magazie","super"):L2("magazii","supers"))+'</span>'
    +'<span class="hv-ts">'+L2("% rame căpăcite","% capped frames")+'</span></div>'+rows+'</div>';
}

// Brood-box frames: total = brood frames + food frames (fH = food frames: honey + bee bread)
function hvTotal(h){return(parseInt(h.fB)||0)+(parseInt(h.fH)||0);}
window.hvUpdTotal=function(){var b=parseInt(($q("hFB")||{}).value)||0,f=parseInt(($q("hFH")||{}).value)||0;var el=$q("hFT");if(el)el.value=b+f;var tx=$q("hFTt");if(tx)tx.textContent=b+f;};

// ── Hive list ───────────────────────────────────────────────
var _hvQ="";   // search text (kept across redraws)
function hvFilter(q){
  if(!q)return D.hives;
  q=q.toLowerCase();
  return D.hives.filter(function(h){
    var qn=hqCurrent(h.id);
    return(h.name+" "+h.loc+" "+String(h.num||"")+(qn?" "+(qn.race||"")+" "+(qn.line||""):"")).toLowerCase().indexOf(q)>=0;
  });
}
// The Hives page has 2 tabs: 🏠 Stupi (existing colonies) and 🐝 Roiuri (nucs in formation)
var _hvTab="hives";   // "hives" | "nucs"
function hvNucAlert(h){   // nuc needs attention: cannot raise a queen / laying check overdue
  if(nucNoQueenSrc(h)&&!hqCurrent(h.id))return true;
  var qs=devQueenState(h.id,todayISO());
  return !!(qs&&qs.phase==="laying");
}
function hvGridHTML(q){
  var nucTab=_hvTab==="nucs";
  var all=D.hives.filter(function(h){return nucTab?hvIsNuc(h):!hvIsNuc(h);});
  var list=hvFilter(q).filter(function(h){return nucTab?hvIsNuc(h):!hvIsNuc(h);});
  if(!all.length)return nucTab
    ?'<div class="al ali">🐝 '+L2("Niciun roi în formare. Apasă «🐝 Roi nou» sau butonul 🐝 de pe cardul unui stup donator.","No nucs in progress. Tap «🐝 New nuc» or the 🐝 button on a donor hive's card.")+'</div>'
    :'<div class="al ali">'+t("hv_empty")+'</div>';
  if(!list.length)return'<div class="al ali">'+t("h_not_found")+' "'+esc(q)+'".</div>';
  if(nucTab)return'<div class="g gc hv-grid">'+list.map(nucCardHTML).join("")+'</div>';
  // hives away on migration: only a small band (full card is in Pastorare)
  var away=list.filter(function(h){return !!pTripOf(h.id);}),home=list.filter(function(h){return !pTripOf(h.id);});
  return(away.length?'<div class="tv-sec-t">🚚 '+L2("În pastorare","On migration")+' <span class="bg gy">'+away.length+'</span></div><div class="ps-tiles">'+away.map(pAwayTileHTML).join("")+'</div>'
      +(home.length?'<div class="tv-sec-t">🏠 '+L2("Acasă","At home")+' <span class="bg gy">'+home.length+'</span></div>':''):'')
    +(home.length?'<div class="g gc hv-grid">'+home.map(function(h){return hvCardHTML(h);}).join("")+'</div>':'');
}
window.hvTab=function(tab){_hvTab=tab;if(tab==="nucs")_hvNucStay=true;renderHives();};   // tapping 🐝 Roiuri opens the tab even when there is no nuc yet
function renderHives(q){
  // Search: updates only the list (search field stays focused, keyboard doesn't close)
  if(typeof q==="string"){
    _hvQ=q;
    var grid=document.getElementById("hvGrid");
    if(grid&&document.getElementById("hvSearch")){grid.innerHTML=hvGridHTML(_hvQ);return;}
  }
  var nu=D.hives.filter(hvIsNuc),st=D.hives.filter(function(h){return !hvIsNuc(h);});
  if(_hvTab==="nucs"&&!nu.length&&!_hvNucStay)_hvTab="hives";
  _hvNucStay=false;
  var nucTab=_hvTab==="nucs",cur=nucTab?nu:st,warn=nu.filter(hvNucAlert).length;
  var tabs='<div class="tv-tabs hv-tabs">'
    +'<button class="tv-tab'+(!nucTab?" on":"")+'" onclick="hvTab(\'hives\')">🏠 '+t("h_title")+' <span class="bg gy">'+st.length+'</span></button>'
    +'<button class="tv-tab'+(nucTab?" on":"")+'" onclick="hvTab(\'nucs\')">🐝 '+L2("Roiuri","Nucs")+' <span class="bg gy">'+nu.length+'</span>'+(warn?' <span class="hv-tab-dot" title="'+L2("Cer atenție","Need attention")+'">⚠️</span>':'')+'</button>'
    +'</div>';
  setP('<div class="hv-top"><h2><i class="fas fa-house" style="color:var(--gold)"></i> '+t("h_title")+'</h2>'
    +(nucTab?'<button class="btn" onclick="nucM()">🐝 '+L2("Roi nou","New nuc")+'</button>':'<button class="btn" onclick="hiveM()">'+t("h_new")+'</button>')+'</div>'
    +tabs
    +(!nucTab&&st.length?hvSummaryHTML():'')
    +(!nucTab?hvAlertHTML():'<div class="hv-ts hv-nuc-note">'+L2("Roiurile nu au avertizarea de inspecție săptămânală. Când regina e împerecheată, roiul trece la 🏠 Stupi.","Nucs have no weekly inspection warning. Once the queen is mated, the nuc moves to 🏠 Hives.")+'</div>')
    +(cur.length>3?'<input id="hvSearch" class="hv-search" type="search" placeholder="'+t("h_search")+'" value="'+esc(_hvQ)+'" oninput="debouncedHiveSearch(this.value)">':'')
    +'<div id="hvGrid">'+hvGridHTML(cur.length>3?_hvQ:"")+'</div>');
}
var _hvNucStay=false;

window.delH=function(id){
  showConfirm(t("h_del_c"),function(){
    genArchiveStub(D.hives.find(function(h){return h.id===id;}));   // trace in genealogy
    D.hives=D.hives.filter(function(h){return h.id!==id;});
    D.inspections=D.inspections.filter(function(i){return i.hiveId!==id;});
    D.queens=D.queens.filter(function(q){return q.hive!==id;});
    try{localStorage.removeItem("bmp5_hive_"+id);}catch(e){}
    save();renderHives();
  });
};

// ── Hive form (with the Queen section) ───────────────────
// Segmented choice (buttons) backed by a hidden input with the same id → $q(id).value keeps working
function segHTML(id,opts,cur,onchg){
  return'<input type="hidden" id="'+id+'" value="'+esc(cur)+'"><div class="seg" data-for="'+id+'">'
    +opts.map(function(o){return'<button type="button" class="seg-b'+(o[0]===cur?" on":"")+'" data-v="'+esc(o[0])+'" onclick="segSet(\''+id+'\',\''+o[0]+'\');'+(onchg||'')+'">'+o[1]+'</button>';}).join("")+'</div>';
}
window.segSet=function(id,v){
  var inp=$q(id);if(inp)inp.value=v;
  var box=document.querySelector('#MB .seg[data-for="'+id+'"]')||document.querySelector('.seg[data-for="'+id+'"]');
  if(box)[].forEach.call(box.querySelectorAll(".seg-b"),function(b){b.classList.toggle("on",b.dataset.v===v);});
};
// form group (card-like section with a title)
function fgHTML(title,inner,sub){return'<div class="fg"><div class="fg-t">'+title+(sub?'<span class="fg-s">'+sub+'</span>':'')+'</div>'+inner+'</div>';}

// ── Hive form (with the Queen section) ───────────────────
// Order: identification → the box → the colony now → the queen → notes; Save / Cancel stay at the bottom.
function hiveM(id){
  var h=id?D.hives.find(function(x){return x.id===id;}):null;
  var mats=t("mat_opts"),mods=t("mod_opts");
  _hqReplace=false;
  var li=h?hvInsps(h.id)[0]:null;
  var magN=hvMagCount(h),magO='<option value="0"'+(magN===0?" selected":"")+'>Fără magazie</option>';
  for(var k=1;k<=8;k++)magO+='<option value="'+k+'"'+(magN===k?" selected":"")+'>'+k+' '+(k===1?"magazie":"magazii")+'</option>';
  openM('<div class="mt">'+(h?"✏️ "+esc(h.name):t("h_new_t"))+'</div>'
    // 1. identification
    +fgHTML("🏷️ Identificare",
      '<div class="r2"><div>'+L("Număr")+'<input id="hNum" type="number" inputmode="numeric" value="'+(esc(xv(h,"num","")))+'" placeholder="1"></div>'
      +'<div>'+L("Nume")+'<input id="hNm" value="'+(esc(xv(h,"name","")))+'" placeholder="'+t("h_name_ph")+'"></div></div>'
      +L("📍 Locație")+'<input id="hLc" value="'+(esc(xv(h,"loc","")))+'" placeholder="'+t("h_loc_ph")+'">')
    // 2. the box
    +fgHTML("📦 Stupul",
      '<div class="r2"><div>'+L("Model")+'<select id="hMd">'+mods.map(function(o){return'<option'+(xv(h,"mod","")=== o?" selected":"")+'>'+o+'</option>';}).join("")+'</select></div>'
      +'<div>'+L("Material")+'<select id="hMt">'+mats.map(function(o){return'<option'+(xv(h,"mat","")=== o?" selected":"")+'>'+o+'</option>';}).join("")+'</select></div></div>'
      +'<div class="r2"><div>'+L("Magazii")+'<select id="hMgN" onchange="document.getElementById(\'mRow\').style.visibility=this.value!==\'0\'?\'visible\':\'hidden\'">'+magO+'</select></div>'
      +'<div id="mRow" style="visibility:'+(magN?"visible":"hidden")+'">'+L("Rame / magazie")+'<input id="hMgF" type="number" inputmode="numeric" value="'+(esc(xv(h,"magF",10)))+'"></div></div>'
      +'<div class="r2"><div>'+L("⬢ Rame cu plastic")+'<input id="hPl" type="number" inputmode="numeric" min="0" value="'+esc(h&&h.plastic?h.plastic:"")+'" placeholder="0"></div><div></div></div>')
    // 3. the colony now
    +fgHTML("🐝 Colonia acum",
      '<div class="r2"><div>'+L("🟤 Rame puiet")+'<input id="hFB" type="number" inputmode="numeric" min="0" value="'+(esc(xv(h,"fB",4)))+'" oninput="aStr();hvUpdTotal()"></div>'
      +'<div>'+L("🍯 Rame mâncare")+'<input id="hFH" type="number" inputmode="numeric" min="0" value="'+(esc(xv(h,"fH",3)))+'" oninput="aStr();hvUpdTotal()"><span class="hint">miere + păstură</span></div></div>'
      +'<div class="fg-tot">În cuib: <b id="hFTt">'+(h?hvTotal(h):7)+'</b> rame<input type="hidden" id="hFT" value="'+(h?hvTotal(h):7)+'"></div>'
      +L("💪 Forță")+segHTML("hSt",[["slab","⚠️ Slab"],["mediu","⚡ Mediu"],["puternic","💪 Puternic"]],xv(h,"str","mediu"))
      +'<div class="hint">Se calculează singură din rame (vara după puiet, iarna după ramele cu albine); o poți schimba.</div>'
      +L("🩺 Stare")+segHTML("hSc",[["green","🟢 Sănătos"],["yellow","🟡 Atenție"],["red","🔴 Problemă"]],xv(h,"sc","green")),
      li?"din inspecția din "+devFmt(li.date):"")
    // 4. queen
    +fgHTML(t("hq_section"),'<div id="hqBox">'+hqBoxHTML(id||"")+'</div>')
    // 5. notes
    +fgHTML("📝 Observații",'<textarea id="hNt" rows="2" placeholder="Orice vrei să ții minte despre stup">'+(esc(xv(h,"notes","")))+'</textarea>')
    +'<div class="br mb-foot"><button class="btn" onclick="saveH(\''+(id||"")+'\')">'+btnS()+'</button><button class="btn gh" onclick="closeM()">'+btnC()+'</button></div>');
}

window.aStr=function(showT){
  var b=parseInt(($q("hFB")||{}).value)||0;var s=strCalc(b,parseInt(($q("hFH")||{}).value)||0);
  segSet("hSt",s);
  if(showT)toast(t("str_auto_t")+" "+t("str_"+s.replace("puternic","strong").replace("mediu","medium").replace("slab","weak")),"🤖");
};

window.saveH=function(id){
  var nm=(($q("hNm")||{}).value||"").trim();
  if(!nm){
    var el=$q("hNm");
    if(el){el.classList.add("err");el.focus();setTimeout(function(){el.classList.remove("err");},2500);}
    toast("⚠️ "+(t("h_name_l")));return;
  }
  var o={id:id||uid(),num:parseInt(($q("hNum")||{}).value)||null,name:nm,loc:($q("hLc")||{}).value||"",mat:($q("hMt")||{}).value||"Lemn",mod:($q("hMd")||{}).value||"Dadant 10 rame",fB:parseInt(($q("hFB")||{}).value)||0,fH:parseInt(($q("hFH")||{}).value)||0,str:($q("hSt")||{}).value||"mediu",magCount:parseInt(($q("hMgN")||{}).value)||0,hasMag:(parseInt(($q("hMgN")||{}).value)||0)>0,magF:parseInt(($q("hMgF")||{}).value)||0,sc:($q("hSc")||{}).value||"green",notes:($q("hNt")||{}).value||""};

  o.fT=o.fB+o.fH;                        // total frames = brood + food
  o.plastic=Math.max(0,parseInt(($q("hPl")||{}).value)||0);   // ⬢ frames with plastic foundation
  // Supers keep their frames and capped percentage; only the changed count is added / removed
  (function(){var old=id?D.hives.find(function(x){return x.id===id;}):null;
    var a=(old&&Array.isArray(old.mags))?old.mags.slice(0,o.magCount):[];
    while(a.length<o.magCount)a.push({f:o.magF||10,cap:0});o.mags=a;})();

  // ── Queen ──
  if(!D.queens)D.queens=[];
  var cur=id?hqCurrent(id):null;
  var hasBox=$q("qR");                       // queen fields exist in the form
  var addNew=$q("hqHas")?$q("hqHas").checked:false;
  if(hasBox){
    var qd=hqRead();
    // queen's mother (for genealogy): natural supersedure → previous queen; from another hive → its queen at the time
    var mom=function(prev){var k=qOrigIdx(qd.orig),d=qd.from||todayISO();
      if(k===0||k===3||k===4)return null;
      if(k===5||qd.origHive===o.id)return prev?prev.id:null;
      if(qd.origHive){var m=qAt(qd.origHive,d);return m?m.id:null;}
      return prev?prev.id:null;};
    if(cur&&!_hqReplace){
      var origChg=cur.orig!==qd.orig||cur.origHive!==qd.origHive;
      Object.assign(cur,qd);                 // edit the current queen
      if(origChg){cur.motherQ=mom(qPrevInHive(cur));cur.motherSet=true;}
    }else if(cur&&_hqReplace){
      cur.status="înlocuită";                // old queen → history
      cur.replacedAt=qd.from||todayISO();
      D.queens.push(Object.assign({id:uid(),hive:o.id,motherQ:mom(cur),motherSet:true},qd));
    }else if(addNew){
      D.queens.push(Object.assign({id:uid(),hive:o.id,motherQ:mom(null),motherSet:true},qd));
    }
  }
  _hqReplace=false;

  if(id){var ex=D.hives.find(function(h){return h.id===id;});if(ex)Object.assign(ex,o);}else{D.hives.push(o);}
  save();closeM();renderHives();
};
