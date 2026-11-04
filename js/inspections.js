// BeeManager Pro — inspections.js
// Inspections

// ═══════════════════════════════════════════
// INSPECTIONS
// ═══════════════════════════════════════════

// Post-treatment assessment: only if the hive had a treatment that ended in the last 30 days
// (or the inspection already has a completed assessment)
function inspPostTrNeeded(hid,ex){
  // Efficacy is now computed from varroa counts (Tratamente module → Eficiență).
  // The old section stays visible only on inspections that already have it filled in.
  return !!(ex&&ex.postTr);
}
// „Sănătos” excludes the other checkboxes (and vice versa)
window.inspDisClick=function(el){
  if(el&&el.checked){
    if(el.id==="dOk"){(t("dis")||[]).forEach(function(d){if(d[0]!=="dOk"){var c=$q(d[0]);if(c)c.checked=false;}});var o=$q("dOther");if(o)o.checked=false;}
    else{var ok=$q("dOk");if(ok)ok.checked=false;}
  }
  inspDisUpd();
};
// „Alte observații boli”: shown if a disease is checked (not „Sănătos”) or „Altă problemă”
window.inspDisUpd=function(){
  var any=(t("dis")||[]).some(function(d){var el=$q(d[0]);return el&&el.checked&&d[0]!=="dOk";});
  var o=$q("dOther");if(o&&o.checked)any=true;
  var w=document.getElementById("iDNw");if(w)w.style.display=any?"block":"none";
  hlNowUpd();
};
// Health: only the hive status is shown (Sănătos / condition currently treated). The full list opens
// with „🔎 Am observat ceva”. A new condition (not currently treated) → „🗓️ Planifică tratament”.
function hlActiveTr(){
  var hid=($q("iHive")||{}).value,date=($q("iDt")||{}).value||todayISO();
  var a=hid?(D.treatments||[]).filter(function(tr){return trAppliesTo(tr,hid)&&trIsActive(tr,hid,date);}):[];
  return{varroa:a.some(trIsVarroa),other:a.some(function(tr){return !trIsVarroa(tr);})};
}
function hlChecked(){
  var r=[];(t("dis")||[]).forEach(function(d){var el=$q(d[0]);if(el&&el.checked)r.push({id:d[0],l:d[1]});});
  var o=$q("dOther");if(o&&o.checked)r.push({id:"dOther",l:"📝 "+((($q("iDN")||{}).value||"").trim()||L2("Altă problemă","Other problem"))});
  return r;
}
window.hlNowUpd=function(){
  var box=document.getElementById("hlNow");if(!box)return;
  var c=hlChecked(),at=hlActiveTr();
  box.innerHTML=c.length?c.map(function(x){
    var ok=x.id==="dOk",tr=(x.id==="dV"&&at.varroa)||(x.id!=="dV"&&!ok&&at.other);
    return'<span class="hl-chip '+(ok?"ok":"bad")+'">'+esc(x.l)+(tr?' <small>· '+L2("sub tratament","under treatment")+'</small>':'')+'</span>';
  }).join(""):'<span class="hl-chip mut">'+L2("Nimic bifat","Nothing ticked")+'</span>';
  // new conditions, no ongoing treatment → planning
  var nw=c.filter(function(x){return x.id!=="dOk"&&!((x.id==="dV"&&at.varroa)||(x.id!=="dV"&&at.other));});
  var pl=document.getElementById("hlPlan");
  if(pl){pl.style.display=nw.length?"flex":"none";
    var tt=document.getElementById("hlPlanT");if(tt)tt.textContent=nw.length?L2("Ai observat","You noticed")+": "+nw.map(function(x){return x.l.replace(/^[^ ]+ /,"");}).join(", "):"";
    pl.dataset.tg=nw.some(function(x){return x.id==="dV";})?"varroa":"other";
    pl.dataset.note=nw.map(function(x){return x.l.replace(/^[^ ]+ /,"");}).join(", ");}
};
window.hlToggle=function(){
  var l=document.getElementById("hlList");if(!l)return;var on=l.style.display==="none";
  l.style.display=on?"block":"none";
  var b=document.getElementById("hlMoreB");if(b)b.textContent=on?"▲ "+L2("Închide lista","Close list"):"🔎 "+L2("Am observat ceva – modific","I noticed something – change");
};
window.hlPlan=function(){
  var pl=document.getElementById("hlPlan");if(!pl)return;
  var cb=$q("iTrPl"),w=document.getElementById("iTrPlW");if(!cb||!w)return;
  cb.checked=true;w.style.display="block";
  var tg=$q("iTrPlTg");if(tg){tg.value=pl.dataset.tg||"varroa";trPlTgChg();}
  var n=$q("iTrPlN");if(n&&!n.value)n.value=pl.dataset.note||"";
  if(typeof _mDirty!=="undefined")_mDirty=true;
  w.scrollIntoView({behavior:"smooth",block:"center"});
  w.classList.add("hl-flash");setTimeout(function(){w.classList.remove("hl-flash");},1600);
};

// Food frames = honey + bee bread. Old inspections had pollen separate (fP) → added in.
function inspFood(i){return(parseInt(i.fH)||0)+(parseInt(i.fP)||0);}

// Helper: format month name from "YYYY-MM"
function monthName(ym){
  var ro=["Ianuarie","Februarie","Martie","Aprilie","Mai","Iunie","Iulie","August","Septembrie","Octombrie","Noiembrie","Decembrie"];
  var en=["January","February","March","April","May","June","July","August","September","October","November","December"];
  var p=ym.split("-");var mo=parseInt(p[1])-1;
  return(D.settings.lang==="en"?en:ro)[mo]+" "+p[0];
}

// Helper: render one inspection card (full detail)
function inspCardHTML(i,showHiveName){
  var hv=D.hives.find(function(h){return h.id===i.hiveId;});
  var bp=t("bp")||[];var bpEntry=bp.find(function(x){return x[0]===i.bp;});
  var bpCls=i.bp==="compact"?"gg":i.bp==="necompact"?"gy":"gr";
  var bpLbl=bpEntry?bpEntry[1]:(i.bp||"—");
  var nm=showHiveName?(hv?hv.name:t("insp_hive")):(i.date||"");
  return'<div class="c">'
    +'<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:5px;margin-bottom:6px;"><h3 style="font-size:.88rem;">'+nm+'</h3>'+(i.winterMode||i.transfer?'':'<span class="bg '+bpCls+'">'+bpLbl+'</span>')+'</div>'
    +'<div style="font-size:.75rem;color:var(--mut);margin-bottom:6px;">📅 '+i.date+' · '+(i.weather||"")+'  · 🌡️ '+showTemp(i.temp)+'</div>'
    +(i.structC&&i.structC!=="ok"?'<div class="al alw" style="padding:4px 8px;margin:3px 0;font-size:.75rem;">🔩 '+i.structC+(i.structN?" — "+i.structN:"")+'</div>':"")
    +(i.transfer?'<div style="font-size:.78rem;margin:5px 0;"><span class="bg gb">🔄 Transfer rame</span> înregistrat automat</div>'
      +'<div style="font-size:.78rem;">'+t("insp_brood")+': <b>'+(i.fB||0)+'</b> · '+t("insp_honey")+': <b>'+inspFood(i)+'</b></div>'
    :i.winterMode?'<div style="font-size:.78rem;margin:5px 0;"><span class="bg gb">❄️ Inspecție de iarnă</span> '+esc(wchTxt(i))+'</div>':''
    +'<div style="display:flex;gap:4px;flex-wrap:wrap;margin:5px 0;">'
    +'<span class="bg '+(i.qSeen?"gg":"gy")+'">'+(i.qSeen?"👑 "+t("insp_q_seen"):"👑 ?")+'</span>'
    +'<span class="bg '+(i.eggs?"gg":"gy")+'">'+(i.eggs?"🥚 "+t("insp_eggs"):"❌")+'</span>'
    +'<span class="bg gb">🐝 '+(i.popPct||"?")+'%</span></div>'
    +'<div style="font-size:.78rem;">'+t("insp_brood")+': <b>'+(i.fB||0)+'</b> · '+t("insp_honey")+': <b>'+inspFood(i)+'</b></div>')
    +(i.weight&&i.weight.kg?'<div style="font-size:.78rem;margin-top:3px;">⚖️ '+weighTxt(i)+'</div>':'')
    +(i.botci?'<div class="al alw" style="padding:4px 8px;margin:4px 0;font-size:.75rem;">🐛 '+i.botciN+' · '+(i.botciS||"")+(i.botciF?" — "+i.botciF:"")+'</div>':"")
    +'<div style="font-size:.78rem;">🦠 '+((i.diseases||[]).join(", ")||"—")+'</div>'
    +(i.postTr&&i.postTrEff?'<div style="font-size:.73rem;margin-top:3px;"><span class="bg gb" style="font-size:.65rem;">🔬 '+t("insp_post_tr_t")+'</span> <span class="bg '+(i.postTrEff&&i.postTrEff.indexOf("90")>=0?"gg":i.postTrEff&&i.postTrEff.indexOf("60")>=0?"gy":"gr")+'" style="font-size:.65rem;">📈 '+i.postTrEff+'</span>'+(i.postTrVarroa!==null&&i.postTrVarroa!==undefined?' <span class="bg" style="font-size:.63rem;background:rgba(255,255,255,.08);">🕷️ '+i.postTrVarroa+'/24h</span>':"")+'</div>':"")
    +(i.calcBrood?(function(){var w=devWorker(i.date,{egg:i.eggs,larva:i.larvae,capped:i.capped});return w?'<div style="font-size:.76rem;margin-top:3px;">🐝 '+L2("Albine noi:","New bees:")+' <b>'+devRange(w.from,w.to)+'</b> · '+L2("culegătoare","foragers")+' ~ '+devFmt(w.foragers)+'</div>':"";})():"")
    +(i.botci&&i.botciAction==="keep"?(function(){var q=devQueen(i.date,i.botciS||"mixt");return'<div style="font-size:.76rem;margin-top:3px;">👑 '+L2("Regină nouă:","New queen:")+' <b>'+devRange(q.emFrom,q.emTo)+'</b> · 🥚 '+devRange(q.layFrom,q.layTo)+'</div>';})():"")
    +((i.trFinished||[]).length?'<div style="font-size:.76rem;margin-top:3px;">✅ '+L2("Încheiat:","Finished:")+' '+(i.trFinished||[]).map(function(f){var tr=(D.treatments||[]).find(function(x){return x.id===f.id;});return esc(tr?trShort(tr):"—")+(f.all?'':' ('+L2("acest stup","this hive")+')');}).join(", ")+'</div>':"")
    +(i.trPlannedId?(function(){var tr=(D.treatments||[]).find(function(x){return x.id===i.trPlannedId;});return tr?'<div style="font-size:.76rem;margin-top:3px;">🗓️ '+L2("Planificat:","Planned:")+' '+esc(trShort(tr))+' · '+tr.date+'</div>':"";})():"")
    +(i.qMated?'<div style="font-size:.76rem;margin-top:3px;">💞 '+L2("Regina nouă e împerecheată","New queen is mated")+'</div>':i.qEmerged?'<div style="font-size:.76rem;margin-top:3px;">🐣 '+L2("Regina nouă a ieșit din botcă","New queen emerged")+'</div>':"")
    +(i.botci&&i.botciAction==="removed"?'<div style="font-size:.76rem;margin-top:3px;">✂️ '+L2("Botci eliminate","Cells removed")+'</div>':"")
    +(function(){var x=i.mv?mvTxt(i):rxTxt(i);return x?'<div style="font-size:.76rem;margin-top:3px;">🔄 '+esc(x)+'</div>':"";})()
    +(function(){var v=(D.varroa||[]).find(function(x){return x.inspectionId===i.id;});return v?'<div style="font-size:.76rem;margin-top:3px;">🕷️ '+vrValStr(v)+(v.reapplied?' · 💧':'')+' <span class="bg gb" style="font-size:.6rem;">💊 '+vrPhaseLbl(vrPhase(v))+'</span></div>':"";})()
    +(i.notes?'<div style="font-size:.72rem;color:var(--mut);margin-top:3px;font-style:italic">'+esc(i.notes)+'</div>':"")
    +(i.voiceTx?'<details class="vc-full"><summary>🎙️ Tot ce ai spus</summary><div>'+esc(i.voiceTx)+'</div></details>':"")
    +'<div class="br"><button class="btn sm be" onclick="inspM(\''+i.hiveId+'\',\''+i.id+'\')">✏️</button>'
    +'<button class="btn sm bd" onclick="delInsp(\''+i.id+'\')">🗑️</button></div>'
    +'</div>';
}

// Helper: toggle archive accordion panels
window.toggleArc=function(id){
  var el=document.getElementById(id);
  if(el)el.style.display=el.style.display==="none"?"block":"none";
};


function renderInspections(){
  var now=new Date();
  var curMonth=now.getFullYear()+"-"+String(now.getMonth()+1).padStart(2,"0");

  // Sort all inspections descending
  var allSorted=[].concat(D.inspections).sort(function(a,b){return new Date(b.date)-new Date(a.date);});

  // Current month inspections
  var curInsp=allSorted.filter(function(i){return i.date&&i.date.startsWith(curMonth);});

  // Alert: hives not inspected in the last 7 days
  var today7=new Date();today7.setHours(0,0,0,0);
  var warnHives=D.hives.filter(function(h){
    var lastI=D.inspections.filter(function(i){return i.hiveId===h.id&&i.date;})
      .sort(function(a,b){return new Date(b.date)-new Date(a.date);})[0];
    if(!lastI)return true;
    var lastD=new Date(lastI.date);lastD.setHours(0,0,0,0);
    return (today7-lastD)/86400000>=7;
  });

  // Last inspection per hive in current month (already sorted desc so first = last)
  var seenHive={};var curCards=[];var shownIds={};
  curInsp.forEach(function(i){
    if(!seenHive[i.hiveId]){seenHive[i.hiveId]=true;shownIds[i.id]=true;curCards.push(inspCardHTML(i,true));}
  });

  // Archive = ALL inspections except the ones shown as current-month cards
  // (includes older inspections from current month + all past months)
  var archiveInsp=allSorted.filter(function(i){return i.date&&!shownIds[i.id];});
  var byMonth={};
  archiveInsp.forEach(function(i){
    var m=i.date.slice(0,7);
    if(!byMonth[m])byMonth[m]={};
    if(!byMonth[m][i.hiveId])byMonth[m][i.hiveId]=[];
    byMonth[m][i.hiveId].push(i);
  });
  var monthKeys=Object.keys(byMonth).sort().reverse();

  var alertHTML=warnHives.length?
    '<div class="sa" style="margin-bottom:16px;">'
    +'<strong>⚠️ '+t("insp_alert_title")+'</strong><br>'
    +'<span style="font-size:.82rem;color:var(--mut);">'+(D.settings.lang==="en"?"Not inspected in the last 7 days:":"Nu au fost verificați în ultimele 7 zile:")+'</span><br style="margin-bottom:5px;">'
    +warnHives.map(function(h){
      var lastI=D.inspections.filter(function(i){return i.hiveId===h.id&&i.date;})
        .sort(function(a,b){return new Date(b.date)-new Date(a.date);})[0];
      var daysAgo=lastI?Math.floor((today7-new Date(lastI.date))/86400000):null;
      return'<span class="bg gr" style="margin:4px 3px 0 0;display:inline-block;">🏠 '+h.name+(daysAgo!==null?" ("+daysAgo+"d)":"")+'</span>';
    }).join("")
    +'</div>':"";

  // Build current month HTML
  var curHTML='<div style="margin-bottom:8px;display:flex;align-items:center;gap:8px;">'
    +'<span style="font-size:.82rem;font-weight:800;color:var(--gold);text-transform:uppercase;letter-spacing:.5px;">'+t("insp_cur_month")+'</span>'
    +(curCards.length?'<span class="bg gy" style="font-size:.68rem;">'+curCards.length+' '+t("insp_stupi")+'</span>':"")
    +'</div>'
    +(curCards.length?'<div class="g gc">'+curCards.join("")+'</div>':'<div class="al ali">'+t("insp_no_cur")+'</div>');

  // Build archive HTML
  var arcHTML='<div style="margin-top:22px;margin-bottom:10px;"><span style="font-size:.82rem;font-weight:800;color:var(--mut);text-transform:uppercase;letter-spacing:.5px;">'+t("insp_archive")+'</span></div>';
  if(monthKeys.length===0){
    arcHTML+='<div class="al ali">'+t("insp_no_arc")+'</div>';
  } else {
    arcHTML+=monthKeys.map(function(ym,mi){
      var arcId="arc_m"+mi;
      var hivesInMonth=byMonth[ym];
      var hiveKeys=Object.keys(hivesInMonth);
      var totalInMonth=0;
      hiveKeys.forEach(function(hid){totalInMonth+=hivesInMonth[hid].length;});
      var hivesHTML=hiveKeys.map(function(hid,hi){
        var hv=D.hives.find(function(h){return h.id===hid;});
        var hivArcId=arcId+"_h"+hi;
        // Sort ascending (chronological)
        var insps=hivesInMonth[hid].slice().sort(function(a,b){return new Date(a.date)-new Date(b.date);});
        var rowsHTML=insps.map(function(insp){
          return'<div style="display:flex;align-items:center;gap:6px;padding:8px 12px;border-bottom:1px solid var(--bdr);flex-wrap:wrap;">'
            +'<span style="font-size:.82rem;font-weight:700;min-width:95px;">📅 '+insp.date+'</span>'
            +'<span class="bg '+(insp.qSeen?"gg":"gy")+'" style="font-size:.63rem;">'+(insp.qSeen?"👑✅":"👑❓")+'</span>'
            +'<span class="bg gb" style="font-size:.63rem;">🥚 '+(insp.fB||0)+'</span>'
            +'<span class="bg gg" style="font-size:.63rem;">🍯 '+(insp.fH||0)+'</span>'
            +(insp.botci?'<span class="bg gr" style="font-size:.63rem;">🐛</span>':"")
            +'<div style="margin-left:auto;display:flex;gap:4px;">'
            +'<button class="btn sm be" onclick="inspM(\''+insp.hiveId+'\',\''+insp.id+'\')">✏️</button>'
            +'<button class="btn sm bd" onclick="delInsp(\''+insp.id+'\')">🗑️</button>'
            +'</div></div>';
        }).join("");
        return'<div style="margin:3px 0;">'
          +'<div onclick="toggleArc(\''+hivArcId+'\')" style="cursor:pointer;padding:9px 14px;background:rgba(230,180,34,.04);border:1px solid var(--bdr);border-radius:var(--rs);display:flex;justify-content:space-between;align-items:center;user-select:none;">'
          +'<span style="font-weight:700;font-size:.83rem;">🏠 '+(hv?hv.name:hid)+'</span>'
          +'<div style="display:flex;gap:6px;align-items:center;">'
          +'<span class="bg gy" style="font-size:.65rem;">'+insps.length+' '+t("insp_insp")+'</span>'
          +'<span style="color:var(--mut);font-size:.75rem;">▼</span>'
          +'</div></div>'
          +'<div id="'+hivArcId+'" style="display:none;border:1px solid var(--bdr);border-top:none;border-radius:0 0 var(--rs) var(--rs);overflow:hidden;">'
          +rowsHTML+'</div></div>';
      }).join("");
      return'<div style="margin-bottom:10px;">'
        +'<div onclick="toggleArc(\''+arcId+'\')" style="cursor:pointer;padding:11px 16px;background:rgba(230,180,34,.09);border:1px solid rgba(230,180,34,.28);border-radius:var(--rm);display:flex;justify-content:space-between;align-items:center;user-select:none;">'
        +'<span style="font-weight:800;font-size:.92rem;">📅 '+monthName(ym)+'</span>'
        +'<div style="display:flex;gap:7px;align-items:center;">'
        +'<span class="bg gy" style="font-size:.68rem;">'+hiveKeys.length+' '+t("insp_stupi")+'</span>'
        +'<span class="bg gb" style="font-size:.68rem;">'+totalInMonth+' '+t("insp_insp")+'</span>'
        +'<span style="color:var(--gold);font-size:.8rem;">▼</span>'
        +'</div></div>'
        +'<div id="'+arcId+'" style="display:none;padding:8px 4px;">'
        +hivesHTML+'</div></div>';
    }).join("");
  }

  setP('<h2 style="margin-bottom:12px;font-size:1.2rem;"><i class="fas fa-book-open" style="color:var(--gold)"></i> '+t("insp_title")+' <span class="cs">('+D.inspections.length+')</span></h2>'
    +'<button class="btn" style="margin-bottom:14px;" onclick="inspM(null)">'+t("insp_new")+'</button>'
    +alertHTML+curHTML+arcHTML);
}

window.delInsp=function(id){showConfirm(t("insp_del_c"),function(){
  // undo the inspection's side effects: feeding actions, treatment finishes, a planned treatment not started yet
  var ex=D.inspections.find(function(i){return i.id===id;});
  if(ex){
    if(ex.fdActs&&ex.fdActs.length)fdRevert(ex.fdActs,D.feedings||[],ex.id,true);
    (ex.trFinished||[]).forEach(function(f){var tr=(D.treatments||[]).find(function(x){return x.id===f.id;});if(!tr)return;
      if(f.all&&tr.done===f.date)delete tr.done;
      else if(tr.doneHives&&tr.doneHives[ex.hiveId]===f.date)delete tr.doneHives[ex.hiveId];});
    mvRevert(ex);   // frames given to / taken from other hives
    mvPlAdd(ex.hiveId,-mvPlNet(ex.mv));   // ⬢ plastic frames count
    if(ex.trPlannedId)D.treatments=(D.treatments||[]).filter(function(tr){return !(tr.id===ex.trPlannedId&&tr.fromInspection===ex.id&&tr.date>todayISO());});
  }
  D.inspections=D.inspections.filter(function(i){return i.id!==id;});
  D.varroa=(D.varroa||[]).filter(function(v){return v.inspectionId!==id;});   // and the count made during the inspection
  // it was the hive's latest inspection → the hive goes back to the frames of the previous one
  if(ex){var hvD=D.hives.find(function(h){return h.id===ex.hiveId;}),liD=hvInsps(ex.hiveId)[0];
    if(hvD&&liD&&ex.date>=liD.date){hvD.fB=parseInt(liD.fB)||0;hvD.fH=inspFood(liD);hvD.fT=hvD.fB+hvD.fH;
      hvD.str=strCalc(hvD.fB,hvD.fH,liD.winter?liD.winter.frames:null,liD.date);if(liD.mags){hvD.mags=liD.mags;hvD.magCount=liD.mags.length;hvD.hasMag=liD.mags.length>0;}}}
  save();render();
});};

function inspM(hiveId,editId,pick){
  hiveId=hiveId||null;editId=editId||null;
  // opened without a hive („Inspecție nouă” on the Inspections page): show the hive picker and build the
  // whole form for the hive selected in it (prefill, brood boxes, supers…); changing it rebuilds the form (inspPick)
  if(!hiveId&&!editId){pick=true;hiveId=(D.hives[0]||{}).id||null;}
  if(typeof _bx!=="undefined"){_bx.on=false;_bx.put=0;_bx.take=0;_bx.adj={b:0,f:0,e:0};}   // box-editor taps belong to one form (boxes.js)
  var ex=editId?D.inspections.find(function(i){return i.id===editId;}):null;
  var effHid=ex?ex.hiveId:hiveId;
  var hive=effHid?D.hives.find(function(h){return h.id===effHid;}):null;
  var disArr=ex?ex.diseases||[]:[];
  // Health on a new inspection: „Sănătos” checked by default; if the hive is under treatment,
  // Varroa (varroa treatment) or „Altă problemă” (other-purpose treatment) is auto-checked.
  var disNoteDef=ex?(ex.diseaseN||""):"";
  if(!ex&&effHid){
    var tdI=todayISO();
    var actI=(D.treatments||[]).filter(function(tr){return trAppliesTo(tr,effHid)&&trIsActive(tr,effHid,tdI);});
    var vA=actI.some(trIsVarroa),oT=actI.filter(function(tr){return !trIsVarroa(tr);})[0];
    disArr=vA?["Varroa"]:(oT?[]:["Sănătos"]);
    if(oT){   // condition of an other-purpose treatment: if it is in the list (e.g. Nosemoză) check it, else „Altă problemă”
      var dz=(oT.disease||"").trim(),hit=dz?(t("dis")||[]).filter(function(d){return d[0]!=="dOk"&&disName(d[1]).toLowerCase()===dz.toLowerCase();})[0]:null;
      if(hit)disArr.push(disName(hit[1]));else disNoteDef=dz||trShort(oT);
    }
  }
  // New inspection: prefill from the hive's last inspection the things that usually stay the same
  // (structure, temperament, laying, population, brood pattern, space, supers).
  // Things to re-check (queen, eggs, larvae, queen cells, diseases) are NOT prefilled.
  var pf=(!ex&&effHid)?(hvInsps(effHid)[0]||null):null;
  var exP=ex||pf;
  var autoW=!ex&&D.weather?mapWeatherLabel():"";
  var autoT=(!ex&&D.weather)?fmtTempInput(D.weather.temp):"";
  var wtDefault=xv(ex,"weather",autoW);
  var tempDefault=xv(ex,"temp",autoT);
  var wo=t("wo"),sm=t("sm"),stc=t("stc"),bh=t("bh"),qq=t("qq"),bt=t("bt"),bp=t("bp"),sp=t("sp"),dis=t("dis");

  var hiveSelHTML=(pick||!hive)&&!ex?'<div class="isc-pick">'+L(t("insp_hive"))+'<select id="iHive" data-cur="'+(effHid||"")+'" oninput="event.stopPropagation()" onchange="inspPick(this)">'+D.hives.map(function(h){return'<option value="'+h.id+'"'+(effHid===h.id?" selected":"")+'>'+esc(h.name)+'</option>';}).join("")+'</select></div>'
    :'<input type="hidden" id="iHive" value="'+effHid+'">';

  var magHTML=(hive&&hive.kind==="roi")?'':magBlockHTML(hive,ex);   // a swarm has no supers

  var pfNote=pf?'<div class="pf-note">↺ '+L2("Precompletat din ultima inspecție","Pre-filled from the last inspection")+' ('+devFmt(pf.date)+') — '+L2("schimbă doar ce e diferit.","change only what's different.")+'</div>':"";
  var wNotice=(!ex&&D.weather)?'<div style="font-size:.72rem;color:var(--ok);margin-top:3px;">'+t("insp_w_auto")+' ('+showTemp(D.weather.temp)+')</div>':"";

  openM('<div class="mt">'+(ex?t("insp_edit_t"):t("insp_new_t"))+(hive?" — "+hive.name:"")+'</div>'
    +pfNote
    +(function(){var pt=effHid&&typeof pTripOf==="function"?pTripOf(effHid,ex?ex.date:todayISO()):null;
      return pt?'<div class="ps-note">🚚 '+L2("Inspecție în pastorare","Inspection on migration")+' · 📍 <b>'+esc(pt.location)+'</b> · 🌸 '+esc(pt.target||"")+'</div>':'';})()
    +hiveSelHTML
    +'<div class="r2"><div>'+L(t("insp_date"))+'<input type="date" id="iDt" value="'+(xv(ex,"date",todayISO()))+'" onchange="inspTrRefresh();inspFdRefresh();devUpd();hlNowUpd()"></div>'
    +'<div>'+L(t("insp_weather"))+'<select id="iWt">'+wo.map(function(w){return'<option'+(wtDefault===w?" selected":"")+'>'+w+'</option>';}).join("")+'</select></div></div>'
    +wNotice
    +'<div class="r2"><div>'+L(tempInputLabel())+'<input type="number" inputmode="numeric" id="iTemp" step="0.5" value="'+fmtTempInput(tempDefault)+'"></div>'
    +'<div>'+L(t("insp_smoke"))+'<select id="iSmk">'+sm.map(function(s){return'<option value="'+s[0]+'"'+(xv(ex,"smoke","")=== s[0]?" selected":"")+'>'+s[1]+'</option>';}).join("")+'</select></div></div>'
    +inspWinterTopHTML(ex,hive,pf)
    +'<div class="dv"><div class="stt">'+t("insp_phys")+'</div></div>'
    +L(t("insp_struct"))+'<select id="iStC" onchange="document.getElementById(\'iStNw\').style.display=this.value===\'ok\'?\'none\':\'block\'">'+stc.map(function(s){return'<option value="'+s[0]+'"'+(xv(exP,"structC","ok")=== s[0]?" selected":"")+'>'+s[1]+'</option>';}).join("")+'</select>'
    +'<div id="iStNw" style="display:'+(xv(exP,"structC","ok")==="ok"?"none":"block")+'">'+L(t("insp_struct_n"))+'<input id="iStN" value="'+(esc(xv(exP,"structN","")))+'" placeholder="'+t("insp_struct_ph")+'"></div>'
    +'<div class="iw-h">'
    +'<div class="dv"><div class="stt">'+t("insp_behav_t")+'</div></div>'
    +L(t("insp_behav"))+'<select id="iBhv">'+bh.map(function(a){return'<option value="'+a[0]+'"'+(String(xv(exP,"behav","3"))===String(a[0])?" selected":"")+'>'+a[1]+'</option>';}).join("")+'</select>'
    +'<div class="dv"><div class="stt">'+t("insp_queen_t")+'</div></div>'
    +'<div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:7px;">'
    +'<div class="ck"><input type="checkbox" id="iQS"'+(xv(ex,"qSeen",false)?" checked":"")+'>  <label for="iQS">'+t("insp_q_seen")+'</label></div>'
    +'<div class="ck"><input type="checkbox" id="iEg" onchange="devUpd()"'+(xv(ex,"eggs",false)?" checked":"")+'>  <label for="iEg">'+t("insp_eggs")+'</label></div>'
    +'<div class="ck"><input type="checkbox" id="iLv" onchange="devUpd()"'+(xv(ex,"larvae",false)?" checked":"")+'>  <label for="iLv">'+t("insp_larvae")+'</label></div>'
    +'<div class="ck"><input type="checkbox" id="iCap" onchange="devUpd()"'+(xv(ex,"capped",false)?" checked":"")+'>  <label for="iCap">🟤 '+L2("Puiet căpăcit","Capped brood")+'</label></div>'
    +'</div>'
    +'<div class="ck"><input type="checkbox" id="iBrCalc"'+(xv(ex,"calcBrood",false)?" checked":"")+' onchange="var b=document.getElementById(\'devBrood\');b.style.display=this.checked?\'block\':\'none\';devUpd()"><label for="iBrCalc">📅 '+L2("Calculează când ies albinele noi","Calculate when new bees emerge")+'</label></div>'
    +'<div id="devBrood" class="dev-box" style="display:'+(xv(ex,"calcBrood",false)?"block":"none")+'"></div>'
    +L(t("insp_q_qual"))+'<select id="iQQ">'+qq.map(function(a){return'<option value="'+a[0]+'"'+(xv(exP,"qQual","buna")=== a[0]?" selected":"")+'>'+a[1]+'</option>';}).join("")+'</select>'
    +devQueenInspHTML(effHid,ex)
    +'<div class="dv"><div class="stt">'+t("insp_botci_t")+'</div></div>'
    +'<div class="ck"><input type="checkbox" id="iBtc"'+(xv(ex,"botci",false)?" checked":"")+' onchange="document.getElementById(\'bSec\').style.display=this.checked?\'block\':\'none\'"> <label for="iBtc">'+t("insp_botci_chk")+'</label></div>'
    +'<div id="bSec" style="display:'+(xv(ex,"botci",false)?"block":"none")+';background:rgba(230,180,34,.07);border-radius:var(--rs);padding:10px;margin-top:6px;">'
    +'<div class="r2"><div>'+L(t("insp_botci_n"))+'<input type="number" inputmode="numeric" id="iBtcN" value="'+(esc(xv(ex,"botciN",0)))+'"></div>'
    +'<div>'+L(t("insp_botci_s"))+'<select id="iBtcS" onchange="devUpd()">'+bt.map(function(a){return'<option value="'+a[0]+'"'+(xv(ex,"botciS","")=== a[0]?" selected":"")+'>'+a[1]+'</option>';}).join("")+'</select></div></div>'
    +L(t("insp_botci_f"))+'<input id="iBtcF" value="'+(esc(xv(ex,"botciF","")))+'" placeholder="'+t("insp_botci_f_ph")+'">'
    +'<div class="al alw" style="font-size:.76rem;padding:4px 8px;margin-top:5px;">'+t("insp_botci_w")+'</div>'
    +L(L2("Ce faci cu botcile?","What do you do with the cells?"))
    +'<div class="dev-act">'
    +'<label><input type="radio" name="iBtcAct" value="keep" onchange="devUpd()"'+(xv(ex,"botciAction","")==="keep"?" checked":"")+'> 👑 '+L2("Le las să se matureze","Let them mature")+'</label>'
    +'<label><input type="radio" name="iBtcAct" value="removed" onchange="devUpd()"'+(xv(ex,"botciAction","")==="removed"?" checked":"")+'> ✂️ '+L2("Le-am eliminat","I removed them")+'</label>'
    +'</div>'
    +'<div id="devQueen" class="dev-box"></div></div>'
    +'<div class="dv"><div class="stt">'+t("insp_frames_t")+'</div></div>'
    +'<div class="r2"><div>'+L(t("insp_brood"))+'<input type="number" inputmode="numeric" id="iFB" oninput="mvBal();inspNestTip()" value="'+(esc(xv(ex,"fB",hive?hive.fB||0:0)))+'"></div>'
    +'<div>'+L(t("insp_honey"))+'<input type="number" inputmode="numeric" id="iFH" oninput="mvBal();inspNestTip()" value="'+(ex?inspFood(ex):(hive?parseInt(hive.fH)||0:0))+'"><span class="hint">'+t("insp_food_h")+'</span></div></div>'
    // 🪹 empty frames (built comb / foundation) added for the queen
    +'<div class="r2"><div>'+L("🪹 Rame goale")+'<input type="number" inputmode="numeric" min="0" id="iFE" oninput="mvBal();inspNestTip()" value="'+esc(ex?(ex.fE!=null?ex.fE:0):(hive?parseInt(hive.fE)||0:0))+'"><span class="hint">clădite / cu fundație</span></div>'
    +'<div>'+L("📏 În cuib")+'<div id="iNestTot" class="nst-tot"></div></div></div>'
    // 🏠 brood boxes: shown like the supers — „➕ Adaugă cuib” only when you need it
    +(hive&&hive.kind==="roi"?'<input type="hidden" id="iNst" value="1">':nstBlockHTML(hive,ex))
    +'<div id="iNestTip"></div>'
    +'<div class="r2"><div>'+L(t("insp_pop"))+'<select id="iPop">'
    +[30,50,70,90,100].map(function(v){return'<option value="'+v+'"'+(xv(exP,"popPct",90)===v?" selected":"")+'>'+v+'%</option>';}).join("")
    +'</select></div>'
    +'<div>'+L(t("insp_bp"))+'<select id="iBP">'+bp.map(function(a){return'<option value="'+a[0]+'"'+(xv(exP,"bp","compact")=== a[0]?" selected":"")+'>'+a[1]+'</option>';}).join("")+'</select></div></div>'
    +L(t("insp_space"))+'<select id="iSp">'+sp.map(function(a){return'<option value="'+a[0]+'"'+(xv(exP,"space","suficient")=== a[0]?" selected":"")+'>'+a[1]+'</option>';}).join("")+'</select>'
    // ❄️ Wintering: how many frames the colony goes into winter with (feeds the queen score in Genealogie)
    +(function(){var w=ex&&ex.winter;
      return'<div class="ck" style="margin-top:8px;"><input type="checkbox" id="iWn"'+(w?" checked":"")+' onchange="document.getElementById(\'iWnW\').style.display=this.checked?\'grid\':\'none\'"><label for="iWn">❄️ '+L2("Evaluare de iernare (intră pe iarnă)","Wintering check (going into winter)")+'</label></div>'
      +'<div class="r2" id="iWnW" style="display:'+(w?"grid":"none")+'"><div>'+L(L2("🐝 Rame ocupate de albine","🐝 Frames covered by bees"))+'<input type="number" inputmode="numeric" min="0" id="iWnF" value="'+esc(w?w.frames:(hive?hvTotal(hive):""))+'"></div>'
      +'<div>'+L(L2("🍯 Rame cu hrană","🍯 Frames of stores"))+'<input type="number" inputmode="numeric" min="0" id="iWnH" value="'+esc(w?w.food||"":(hive?hive.fH||"":""))+'"></div></div>';})()
    // 🔄 Frames taken out / put in (frames.js) — its own section (card)
    +'<div class="dv"><div class="stt">🔀 '+L2("Rame mutate între stupi","Frames moved between hives")+'</div></div>'
    +mvSecHTML(effHid,ex,hive)
    +'</div>'
    +'<div class="dv iw-h"></div>'
    +'<div id="magBlock" class="iw-h">'+magHTML+'</div>'
    +'<div id="iFdSec">'+inspFdSecHTML(effHid,ex)+'</div>'
    +'<div id="iTrSec">'+inspTrSecHTML(effHid,ex)+'</div>'
    +'<div class="iw-h">'
    +'<div class="dv"><div class="stt">'+t("insp_health_t")+'</div></div>'
    +'<div id="hlNow" class="hl-now"></div>'
    +'<button type="button" class="hl-more" id="hlMoreB" onclick="hlToggle()">🔎 '+L2("Am observat ceva – modific","I noticed something – change")+'</button>'
    +'<div id="hlList" class="hl-list" style="display:none">'
    +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;margin-bottom:7px;">'
    +dis.map(function(d){return'<div class="ck"><input type="checkbox" onchange="inspDisClick(this)" id="'+d[0]+'"'+(disArr.some(function(x){return disName(x)===disName(d[1]);})?" checked":"")+'>  <label for="'+d[0]+'">'+d[1]+'</label></div>';}).join("")
    +'</div>'
    +'<div class="ck"><input type="checkbox" id="dOther"'+(disNoteDef?" checked":"")+' onchange="inspDisClick(this)"><label for="dOther">📝 '+L2("Altă problemă / observații","Other problem / notes")+'</label></div>'
    +'<div id="iDNw" style="display:'+(disNoteDef?"block":"none")+'"><input id="iDN" oninput="hlNowUpd()" value="'+esc(disNoteDef)+'" placeholder="'+t("insp_dis_ph")+'"></div>'
    +'</div>'
    +'<div id="hlPlan" class="hl-plan" style="display:none"><span id="hlPlanT"></span><button type="button" class="btn sm" onclick="hlPlan()">🗓️ '+L2("Planifică tratament","Plan treatment")+'</button></div>'
    +(inspPostTrNeeded(effHid,ex)?''
    +'<div class="dv"><div class="stt">'+t("insp_post_tr_t")+'</div></div>'
    +'<div class="ck" style="margin-bottom:8px;"><input type="checkbox" id="iPostTr"'+(xv(ex,"postTr",false)?" checked":"")+' onchange="togglePostTrSec(this.checked)"> <label for="iPostTr">'+t("insp_post_tr_chk")+'</label></div>'
    +'<div id="postTrSec" style="display:'+(xv(ex,"postTr",false)?"block":"none")+';background:rgba(74,158,255,.06);border:1px solid rgba(74,158,255,.2);border-radius:var(--rs);padding:10px 12px;margin-bottom:8px;">'
    +'<div style="font-size:.72rem;color:var(--info);margin-bottom:8px;">💡 '+t("insp_post_tr_hint")+'</div>'
    +L(t("insp_post_tr_prod"))
    +'<select id="iPostTrProd">'
    +'<option value="">—</option>'
    +(D.treatments||[]).filter(function(tr){return !hiveId||!tr.hiveId||tr.hiveId===hiveId||tr.hiveId===(ex?ex.hiveId:null);}).slice().sort(function(a,b){return new Date(b.date)-new Date(a.date);}).map(function(tr){return'<option value="'+tr.id+'"'+(xv(ex,"postTrId","")=== tr.id?" selected":"")+'>💊 '+tr.product+' ('+tr.date+')</option>';}).join("")
    +'</select>'
    +'<div class="r2">'
    +'<div>'+L(t("insp_post_tr_eff"))+'<select id="iPostTrEff">'
    +'<option value="">—</option>'
    +t("tr_eff_opts").map(function(e){return'<option'+(xv(ex,"postTrEff","")=== e?" selected":"")+'>'+e+'</option>';}).join("")
    +'</select></div>'
    +'<div>'+L(t("insp_post_tr_varroa"))+'<input type="number" inputmode="numeric" id="iPostTrVarroa" value="'+(esc(xv(ex,"postTrVarroa","")))+'" placeholder="0" min="0"></div>'
    +'</div>'
    +L(t("insp_post_tr_notes"))+'<textarea id="iPostTrNotes" rows="2">'+esc(xv(ex,"postTrNotes",""))+'</textarea>'
    +'</div>'
    :'')
    +'</div>'
    +inspWeighHTML(effHid,ex)
    +'<div class="dv"></div>'+L(t("insp_notes"))+'<textarea id="iNt" rows="3">'+(esc(xv(ex,"notes","")))+'</textarea>'
    +'<div class="br" style="margin-top:14px;"><button class="btn" onclick="saveInsp(\''+(editId||"")+'\',\''+(effHid||"")+'\')">'+t("insp_save")+'</button><button class="btn gh" onclick="closeM()">'+btnC()+'</button></div>');
  if(ex){var mbI=document.getElementById("MB");if(mbI)mbI.dataset.inspId=ex.id;}
  inspWinterApply();
  _mvNet=null;mvBal();inspNestTip();if(typeof mvSumAll==="function")mvSumAll();
  inspDisUpd();devUpd();
  if(typeof inspCardify==="function")inspCardify();   // 🃏 cards layout (inspui.js)
  if($q("iNst0"))nstVis();
  // opened without a hive (hive picker): build the hive-dependent blocks for the hive shown in the picker
  if(!hive&&!ex){var hs=$q("iHive");if(hs&&hs.value){updMag(hs.value);inspTrRefresh();inspFdRefresh();hlNowUpd();}}
}


// ── Supers in inspection ─────────────────────────────────────────
// Each super is kept separately: {f: frames, cap: % capped frames}. Order: [0] = bottom (above brood box) … last = top.
// Starts from what the hive has now; in the inspection you can add / remove supers, add / remove frames,
// move supers (▲▼) and pick the capped percentage for each. The "before" state is saved too (magsBefore).
var _magSt=null;   // {before:[{k,f,cap}], cur:[{k,f,cap}], per, next}
function magFromInsp(ex,before){
  if(!ex)return[];
  if(before){
    if(Array.isArray(ex.magsBefore))return ex.magsBefore;
    if(ex.magBefore)return magSpread(ex.magBefore.count,ex.magBefore.total,0);
    return magFromInsp(ex,false);
  }
  if(Array.isArray(ex.mags))return ex.mags;
  var n=ex.magCount!=null?parseInt(ex.magCount)||0:(ex.hasMag?1:0);
  return magSpread(n,ex.magT,0);
}
function magSpread(n,total,cap){   // old inspections: only count + total frames → split the frames across supers
  n=parseInt(n)||0;var a=[];if(!n)return a;
  var tot=parseInt(total);if(!(tot>=0))tot=n*10;
  for(var i=0;i<n;i++)a.push({f:Math.floor(tot/n)+(i<tot%n?1:0),cap:cap||0});
  return a;
}
function magInit(hive,ex){
  var per=(hive&&parseInt(hive.magF))||10;
  var before=ex?magFromInsp(ex,true):hvMags(hive);
  var cur=ex?magFromInsp(ex,false):before;
  var cp=function(m){return magNorm({f:parseInt(m.f)||0,cap:parseInt(m.cap)||0,h:m.h,e:m.e,n:m.n,size:m.size},per);};
  var k=0,bk=before.map(function(m){var x=cp(m);x.k=k++;return x;});
  // when editing, match "after" supers to "before" ones by position (as far as they exist)
  var ck=cur.map(function(m,i){var x=cp(m);x.k=i<bk.length?bk[i].k:k++;return x;});
  _magSt={before:bk,cur:ck,per:per,next:k};
}
// a super's frames by kind: h honey · e built comb (empty) · n new (foundation); f = their sum; size = frames that fit
function magNorm(m,per,isNew){
  var has=m.h!=null||m.e!=null||m.n!=null;
  m.h=parseInt(m.h)||0;m.e=parseInt(m.e)||0;m.n=parseInt(m.n)||0;m.f=parseInt(m.f)||0;
  if(!has){if(m.cap>0)m.h=m.f;else if(isNew)m.n=m.f;else m.e=m.f;}   // older data: only a frame count
  var s=m.h+m.e+m.n,d=m.f-s;
  if(d>0){if(isNew)m.n+=d;else m.h+=d;}
  else if(d<0){d=-d;["n","e","h"].forEach(function(k){var x=Math.min(d,m[k]);m[k]-=x;d-=x;});}
  m.f=m.h+m.e+m.n;m.size=Math.max(parseInt(m.size)||per||10,m.f);
  return m;
}
function magPctCol(p){   // light yellow (barely capped) → dark amber (100%)
  p=Math.max(0,Math.min(100,parseInt(p)||0))/100;
  var a=[247,215,116],b=[184,110,8];
  return'rgb('+a.map(function(v,i){return Math.round(v+(b[i]-v)*p);}).join(",")+')';
}
function magBarStyle(p){p=parseInt(p)||0;return'background:linear-gradient(90deg,'+magPctCol(p)+' '+p+'%,rgba(247,215,116,.14) '+p+'%);';}
function magDiff(){
  var s=_magSt,r={addS:0,rmS:0,addF:0,rmF:0,removed:[]};if(!s)return r;
  s.cur.forEach(function(m){var b=s.before.filter(function(x){return x.k===m.k;})[0];
    if(!b){r.addS++;return;}
    if(m.f>b.f)r.addF+=m.f-b.f;else if(m.f<b.f)r.rmF+=b.f-m.f;});
  s.before.forEach(function(b){if(!s.cur.some(function(m){return m.k===b.k;})){r.rmS++;r.removed.push(b);}});
  return r;
}
function magSum(a){return a.reduce(function(t,m){return t+(parseInt(m.f)||0);},0);}
function magWord(n){return n===1?L2("magazie","super"):L2("magazii","supers");}
function magBlockHTML(hive,ex){
  magInit(hive,ex);
  var full=ex?ex.magFull||0:0;
  return'<div class="mag-box mg2"><div id="mgBody">'+magBodyHTML()+'</div>'
    // „Rame pline” removed: the % capped of each super already says how full it is

    +'</div>';
}
function magBodyHTML(){
  var s=_magSt,b=s.before,c=s.cur,d=magDiff(),n=c.length;
  var h='<div class="mag-h">📦 '+L2("Magazii","Supers")+' <span class="hv-ts">· '+L2("la deschidere","at start")+': '
    +(b.length?b.length+' '+magWord(b.length)+' · '+magSum(b)+' '+L2("rame","frames"):L2("fără magazie","no super"))+'</span></div>';
  if(n)h+='<div class="mg-hint">'+L2("Sus e magazia de deasupra. Alege pentru fiecare cât e căpăcit.","The top one is the highest super. Set how much each one is capped.")+'</div>';
  for(var i=n-1;i>=0;i--){
    var m=c[i],pos=n>1?(i===n-1?L2("sus","top"):i===0?L2("jos, peste cuib","bottom, above brood"):""):"";
    var isNew=!b.some(function(x){return x.k===m.k;});
    var opts="";for(var p=0;p<=100;p+=10)opts+='<option value="'+p+'"'+(p===m.cap?" selected":"")+'>'+p+'%</option>';
    h+='<div class="mg-row">'
      +'<div class="mg-top"><b>'+L2("Magazia","Super")+' '+(i+1)+'</b>'+(pos?'<span class="hv-ts">· '+pos+'</span>':'')
      +(isNew?'<span class="bg gg">'+L2("nouă","new")+'</span>':'')
      +'<span class="mg-mv">'
      +(n>1?'<button type="button" class="mg-ib" onclick="magMove('+i+',1)"'+(i===n-1?' disabled':'')+' aria-label="▲">▲</button>'
        +'<button type="button" class="mg-ib" onclick="magMove('+i+',-1)"'+(i===0?' disabled':'')+' aria-label="▼">▼</button>':'')
      +'<button type="button" class="mg-ib mg-x" onclick="magDel('+i+')">➖ '+L2("Scoate","Remove")+'</button></span></div>'
      +'<div class="mg-bar'+(m.cap<25?' lo':'')+'" style="'+magBarStyle(m.cap)+'"><span>'+m.cap+'% '+L2("căpăcit","capped")+'</span></div>'
      +'<div class="mg-ctl">'
      +'<span class="mg-l">🖼️ '+L2("Rame","Frames")+'</span>'
      +'<span class="mag-ctl"><button type="button" class="mag-b" onclick="magFr('+i+',-1)" aria-label="−">−</button><b>'+m.f+'</b><button type="button" class="mag-b" onclick="magFr('+i+',1)" aria-label="+">+</button></span>'
      +'<span class="mg-l">✅ '+L2("Căpăcite","Capped")+'</span>'
      +'<select class="mg-cap" onchange="magCap('+i+',this.value)">'+opts+'</select>'
      +'</div></div>';
  }
  h+='<button type="button" class="mg-add" onclick="magAdd()">➕ '+L2("Adaugă magazie","Add super")+'</button>';
  if(d.removed.length)h+='<div class="mg-rm">'+d.removed.map(function(r){
    return'<span>🗑️ '+L2("Scoasă","Removed")+': '+r.f+' '+L2("rame","frames")+(r.cap?' · '+r.cap+'%':'')
      +' <button type="button" class="mg-ib" onclick="magBack('+r.k+')">↺ '+L2("Pune înapoi","Put back")+'</button></span>';}).join("")+'</div>';
  var ch=[];
  if(d.addS)ch.push('➕ '+d.addS+' '+magWord(d.addS));
  if(d.rmS)ch.push('➖ '+d.rmS+' '+magWord(d.rmS));
  if(d.addF)ch.push('➕ '+d.addF+' '+(d.addF===1?L2("ramă","frame"):L2("rame","frames")));
  if(d.rmF)ch.push('➖ '+d.rmF+' '+(d.rmF===1?L2("ramă","frame"):L2("rame","frames")));
  h+='<div class="mag-res">'+(ch.length?L2("Azi","Today")+': <b class="mg-ch">'+ch.join(" · ")+'</b><br>':'')
    +L2("După inspecție","After inspection")+': <b>'+n+'</b> '+magWord(n)+(n?' · <b>'+magSum(c)+'</b> '+L2("rame","frames"):'')+'</div>';
  return h;
}
function magRedraw(){var el=document.getElementById("mgBody");if(el)el.innerHTML=magBodyHTML();
  if(typeof mvBoxRefresh==="function")mvBoxRefresh();   // 📍 „Magazie” appears among the boxes of the frame moves
  if(typeof bxDrawMag==="function")bxDrawMag();
  var fw=document.getElementById("mgFullW");if(fw)fw.style.display=_magSt.cur.length?"block":"none";
  if(typeof _mDirty!=="undefined")_mDirty=true;}
window.magAdd=function(f0){if(!_magSt||_magSt.cur.length>=8)return;_magSt.cur.push(magNorm({k:_magSt.next++,f:f0!=null?f0:_magSt.per,cap:0,size:_magSt.per},_magSt.per,true));magRedraw();};
window.magDel=function(i){if(!_magSt)return;_magSt.cur.splice(i,1);magRedraw();};
window.magBack=function(k){if(!_magSt)return;var b=_magSt.before.filter(function(x){return x.k===k;})[0];if(!b)return;
  var bi=_magSt.before.indexOf(b),pos=_magSt.cur.length;
  for(var j=0;j<_magSt.cur.length;j++){var cb=_magSt.before.filter(function(x){return x.k===_magSt.cur[j].k;})[0];if(cb&&_magSt.before.indexOf(cb)>bi){pos=j;break;}}
  _magSt.cur.splice(pos,0,{k:b.k,f:b.f,cap:b.cap,h:b.h,e:b.e,n:b.n,size:b.size});magRedraw();};
window.magMove=function(i,d){if(!_magSt)return;var c=_magSt.cur,j=i+d;if(j<0||j>=c.length)return;var x=c[i];c[i]=c[j];c[j]=x;magRedraw();};
window.magFr=function(i,d){if(!_magSt)return;var m=_magSt.cur[i];if(!m)return;m.f=Math.max(0,Math.min(30,m.f+d));magNorm(m,_magSt.per,!_magSt.before.some(function(x){return x.k===m.k;}));magRedraw();};
window.magCap=function(i,v){if(!_magSt)return;var m=_magSt.cur[i];if(!m)return;m.cap=parseInt(v)||0;magRedraw();};





// Legacy post-treatment block (only shown when editing old inspections that have it)
window.togglePostTrSec=function(show){var el=document.getElementById("postTrSec");if(el)el.style.display=show?"block":"none";};

window.updMag=function(hid){
  var box=document.getElementById("magBlock");if(!box)return;
  var hive=D.hives.find(function(h){return h.id===hid;});
  box.innerHTML=magBlockHTML(hive,null);
};
// hive picker of a new inspection: the form is rebuilt for the chosen hive (its boxes, supers, last inspection).
// What was already filled in would be lost → ask first; „Anulează” puts the previous hive back.
window.inspPick=function(sel){
  var hid=sel.value,prev=sel.getAttribute("data-cur")||"",dirty=_mDirty;
  if(!hid||hid===prev)return;
  // rebuild after the change event has finished (it would mark the new form as changed)
  var rebuild=function(){setTimeout(function(){inspM(hid,null,true);},0);};
  if(dirty)showConfirm(L2("Schimbi stupul? Ce ai completat până acum nu se păstrează.","Change the hive? What you filled in so far is not kept."),rebuild,function(){sel.value=prev;},L2("Da, schimbă","Yes, change"));
  else rebuild();
};

// ❄️ WINTER MODE — the inspection shows only what is usually done in winter: hive condition,
// cluster size (frames with bees), stores, feeding, treatments (e.g. oxalic acid), weighing, notes.
// On by default in November–February; can be switched on/off any time.
var WCH_FLAGS=[["damp","💧 Umezeală / mucegai"],["diar","💩 Pete de diaree"],["mice","🐭 Urme de șoareci"],["ent","🚪 Urdiniș blocat (l-am curățat)"]];
var WCH_FOOD=[["ok","✅ Suficiente"],["limit","⚠️ La limită"],["low","❌ Insuficiente — trebuie hrănit"]];
var WCH_BUZZ=[["ok","🔊 Normal, liniștit"],["weak","🔉 Slab, abia se aude"],["loud","📢 Neliniștit / puternic (posibil fără matcă)"]];
var WCH_DEAD=[["few","Puține (normal)"],["many","Multe"]];
function inspWinterTopHTML(ex,hive,pf){
  var m=parseInt(todayISO().slice(5,7)),on=ex?!!ex.winterMode:(m>=11||m<=2);
  var w=(ex&&ex.wch)||{},fl=w.flags||[];
  var last=(ex&&ex.winter&&ex.winter.frames!=null)?ex.winter.frames:(hive&&hive.bees!=null?hive.bees:(hive?(parseInt(hive.fB)||0)+(parseInt(hive.fH)||0):""));
  var opt=function(list,cur,def){return list.map(function(o){return'<option value="'+o[0]+'"'+((cur||def)===o[0]?" selected":"")+'>'+o[1]+'</option>';}).join("");};
  return'<div class="iw-tg"><div class="ck"><input type="checkbox" id="iWM"'+(on?" checked":"")+' onchange="inspWinterApply()"><label for="iWM">❄️ Mod iarnă — doar verificările de iarnă</label></div></div>'
    +'<div class="iw-s">'
    +'<div class="dv"><div class="stt">❄️ Verificare de iarnă</div></div>'
    +'<div class="r2"><div>'+L("🐝 Ghemul ocupă (rame / intervale)")+'<input type="number" inputmode="numeric" min="0" max="20" id="iWiB" value="'+esc(last)+'"><span class="hint">câte intervale dintre rame sunt pline de albine</span></div>'
    +'<div>'+L("🍯 Provizii")+'<select id="iWiF">'+opt(WCH_FOOD,w.food,"ok")+'</select></div></div>'
    +'<div class="r2"><div>'+L("👂 Zumzet (bătând ușor în stup)")+'<select id="iWiZ">'+opt(WCH_BUZZ,w.buzz,"ok")+'</select></div>'
    +'<div>'+L("💀 Albine moarte la urdiniș / pe fund")+'<select id="iWiD">'+opt(WCH_DEAD,w.dead,"few")+'</select></div></div>'
    +'<div class="iw-fl">'+WCH_FLAGS.map(function(f){return'<div class="ck"><input type="checkbox" id="iWc_'+f[0]+'"'+(fl.indexOf(f[0])>=0?" checked":"")+'><label for="iWc_'+f[0]+'">'+f[1]+'</label></div>';}).join("")+'</div>'
    +'</div>';
}
function inspWinterOn(){var c=$q("iWM");return !!(c&&c.checked);}
window.inspWinterApply=function(){var mb=document.getElementById("MB");if(mb)mb.classList.toggle("iw-on",inspWinterOn());
  if(typeof mvBal==="function"&&document.getElementById("mvBal"))mvBal();};   // the frame check is off in winter mode → redo it
function winterRead(){
  var v=($q("iWiB")||{}).value,fr=v===""||v==null?null:parseInt(v);
  return{frames:isNaN(fr)?null:fr,wch:{food:($q("iWiF")||{}).value||"ok",buzz:($q("iWiZ")||{}).value||"ok",dead:($q("iWiD")||{}).value||"few",
    flags:WCH_FLAGS.filter(function(f){var c=$q("iWc_"+f[0]);return c&&c.checked;}).map(function(f){return f[0];})}};
}
function wchTxt(i){   // short text of the winter check (inspection card, observation sheet)
  var w=i.wch;if(!w)return"";
  var lb=function(list,v){var x=list.filter(function(o){return o[0]===v;})[0];return x?x[1].replace(/^[^A-Za-zĂÂÎȘȚăâîșț]+/,""):"";};
  var p=[];
  if(i.winter&&i.winter.frames!=null)p.push("ghem pe "+i.winter.frames+" rame");
  p.push("provizii: "+lb(WCH_FOOD,w.food).toLowerCase());
  p.push("zumzet: "+lb(WCH_BUZZ,w.buzz).toLowerCase());
  if(w.dead==="many")p.push("multe albine moarte");
  (w.flags||[]).forEach(function(f){p.push(lb(WCH_FLAGS,f).toLowerCase());});
  return p.join(" · ");
}

// ⚖️ WEIGHING — optional, any time of year: whole hive, or only the back lifted (× 2)
function weighPrev(hid,date,exId){
  var l=(D.inspections||[]).filter(function(i){return i.hiveId===hid&&i.id!==exId&&i.weight&&i.weight.kg&&i.date<date;})
    .sort(function(a,b){return a.date<b.date?1:-1;});
  return l[0]||null;
}
function weighTxt(i){
  if(!i.weight||!i.weight.kg)return"";
  var k=i.weight.kg,p=weighPrev(i.hiveId,i.date,i.id),d=p?Math.round((k-p.weight.kg)*10)/10:null;
  return String(k).replace(".",",")+" kg"+(d!==null?" ("+(d>0?"+":"")+String(d).replace(".",",")+" față de "+devFmt(p.date)+")":"");
}
function inspWeighHTML(hid,ex){
  var w=ex&&ex.weight,on=!!(w&&w.kg),p=hid?weighPrev(hid,ex?ex.date:"9999",ex?ex.id:null):null;
  return'<div class="dv"></div><div class="ck"><input type="checkbox" id="iWgOn"'+(on?" checked":"")+' onchange="document.getElementById(\'iWgW\').style.display=this.checked?\'block\':\'none\'"><label for="iWgOn">⚖️ Cântărire</label></div>'
    +'<div id="iWgW" class="rx-box" style="display:'+(on?"block":"none")+'">'
    +'<div class="r2"><div>'+L("Greutate citită (kg)")+'<input type="number" inputmode="decimal" step="0.1" min="0" id="iWgK" value="'+esc(w?w.raw||w.kg:"")+'" oninput="weighUpd()"></div>'
    +'<div>'+L("Cum am cântărit")+'<select id="iWgM" onchange="weighUpd()"><option value="full"'+(!w||w.method!=="back"?" selected":"")+'>Tot stupul</option><option value="back"'+(w&&w.method==="back"?" selected":"")+'>Doar spatele ridicat (× 2)</option></select></div></div>'
    +'<div class="hv-ts" id="iWgT">'+(p?'Cântărirea anterioară: '+String(p.weight.kg).replace(".",",")+' kg ('+devFmt(p.date)+')':'')+'</div>'
    +'<input type="hidden" id="iWgP" value="'+(p?p.weight.kg:"")+'"></div>';
}
window.weighUpd=function(){
  var r=parseFloat(($q("iWgK")||{}).value),m=($q("iWgM")||{}).value,el=$q("iWgT"),pv=parseFloat(($q("iWgP")||{}).value);
  if(!el||isNaN(r))return;var k=Math.round((m==="back"?r*2:r)*10)/10;
  el.innerHTML='Greutate stup: <b>'+String(k).replace(".",",")+' kg</b>'+(!isNaN(pv)?' · '+(k-pv>0?"+":"")+String(Math.round((k-pv)*10)/10).replace(".",",")+' kg față de cântărirea anterioară':'');
};
function weighRead(){
  if(!$q("iWgOn")||!$q("iWgOn").checked)return null;
  var r=parseFloat(($q("iWgK")||{}).value);if(isNaN(r)||r<=0)return null;
  var m=($q("iWgM")||{}).value==="back"?"back":"full";
  return{kg:Math.round((m==="back"?r*2:r)*10)/10,raw:r,method:m};
}

// 🔄 Frames added / removed: reads the section (null when unticked or all zero)
function rxRead(kind){
  if(!$q("iRxOn")||!$q("iRxOn").checked)return null;
  var g=function(id){return parseInt(($q(id)||{}).value)||0;},o;
  if(kind==="in")o={n:g("iInN"),h:g("iInH"),b:g("iInB")};
  else o={n:g("iOutN"),h:g("iOutH"),p:g("iOutP"),b:g("iOutB"),a:g("iOutA")};
  for(var k in o)if(o[k])return o;
  return null;
}
function rxTxt(i){   // short text for the inspection card
  var fi=i.fIn||(i.nFrames?{n:i.nFrames}:null),fo=i.fOut,p=[];
  var part=function(o,map){return map.filter(function(m){return o[m[0]];}).map(function(m){return o[m[0]]+' '+m[1];}).join(", ");};
  if(fi)p.push("➕ "+part(fi,[["n","noi/goale"],["h","miere/păstură"],["b","puiet"]]));
  if(fo)p.push("➖ "+part(fo,[["n","noi/goale"],["h","miere"],["p","păstură"],["b","puiet"],["a","cu albine"]]));
  if(i.nFramesB)p.push("🏗️ "+i.nFramesB+" clădite");
  return p.join(" · ");
}
window.saveInsp=function(editId,hiveId){
  var hid=($q("iHive")||{}).value||hiveId;
  if(!hid){toast("⚠️ "+t("insp_sel_h"));return;}
  var dis=[];var disArr=t("dis")||[];
  disArr.forEach(function(d){var el=$q(d[0]);if(el&&el.checked)dis.push(disName(d[1]));});
  var dnW=document.getElementById("iDNw");
  var dn=(dnW&&dnW.style.display==="none")?"":(($q("iDN")||{}).value||"");if(dn)dis.push(dn);
  var brood=parseInt(($q("iFB")||{}).value)||0;
  // editing an older inspection saved with more frames than fit (allowed before brood boxes existed) without touching
  // its frames (e.g. only the notes are fixed) → it may be saved as it was
  var ex0=editId?D.inspections.find(function(i){return i.id===editId;}):null,iv=function(id){return parseInt(($q(id)||{}).value)||0;};
  var frSame=!!ex0&&(parseInt(ex0.fB)||0)===iv("iFB")&&(parseInt(ex0.fH)||0)===iv("iFH")&&(parseInt(ex0.fE)||0)===iv("iFE")&&(parseInt(ex0.nests)||1)===(iv("iNst")||1);
  if(!frSame&&!(typeof inspWinterOn==="function"&&inspWinterOn())&&(inspNestOver(hid)>0||(typeof nstOver==="function"&&$q("iNst0")&&nstOver()))){
    toast(L2("Ai trecut mai multe rame decât încap în cuib — adaugă un cuib sau corectează.","More frames than fit — add a brood box or fix the numbers."),"⚠️");
    var tp=document.getElementById("iNestTip");if(tp)tp.scrollIntoView({behavior:"smooth",block:"center"});return;}
  var o={
    id:editId||uid(),hiveId:hid,
    date:($q("iDt")||{}).value||"",weather:($q("iWt")||{}).value||"",
    temp:parseTempInput(($q("iTemp")||{}).value),smoke:($q("iSmk")||{}).value||"",
    structC:($q("iStC")||{}).value||"ok",structN:(($q("iStC")||{}).value||"ok")==="ok"?"":(($q("iStN")||{}).value||""),
    behav:parseInt(($q("iBhv")||{}).value)||3,
    qSeen:($q("iQS")||{}).checked||false,eggs:($q("iEg")||{}).checked||false,larvae:($q("iLv")||{}).checked||false,
    capped:($q("iCap")||{}).checked||false,calcBrood:($q("iBrCalc")||{}).checked||false,
    qEmerged:!!($q("iQEm")||{}).checked||!!($q("iQMt")||{}).checked,qMated:!!($q("iQMt")||{}).checked,
    botciAction:(($q("iBtc")||{}).checked&&document.querySelector("input[name='iBtcAct']:checked"))?document.querySelector("input[name='iBtcAct']:checked").value:"",
    qQual:($q("iQQ")||{}).value||"buna",
    botci:($q("iBtc")||{}).checked||false,botciN:parseInt(($q("iBtcN")||{}).value)||0,
    botciS:($q("iBtcS")||{}).value||"",botciF:($q("iBtcF")||{}).value||"",
    fB:brood,fH:parseInt(($q("iFH")||{}).value)||0,fP:0,
    fE:parseInt(($q("iFE")||{}).value)||0,nests:parseInt(($q("iNst")||{}).value)||1,nestsBefore:parseInt(($q("iNst0")||{}).value)||null,
    nestF:(typeof nstRead==="function"&&$q("iNst0"))?nstRead():null,
    plAdd:!!($q("iPlA")&&$q("iPlA").checked),   // ⬢ plastic-foundation frames put in (one tick, boxes.js)
    popPct:parseInt(($q("iPop")||{}).value)||90,bp:($q("iBP")||{}).value||"compact",
    mv:mvRead(),
    nFramesB:(function(){var e=editId?D.inspections.find(function(i){return i.id===editId;}):null;return e?e.nFramesB||0:0;})(),   // old field (no longer in the form) — kept on edit
    space:($q("iSp")||{}).value||"suficient",
    magFull:(function(){var e=editId?D.inspections.find(function(i){return i.id===editId;}):null;return e?e.magFull||0:0;})(),   // old field, kept on edit
    winter:($q("iWn")&&$q("iWn").checked)?{frames:parseInt(($q("iWnF")||{}).value)||0,food:parseInt(($q("iWnH")||{}).value)||0}:null,
    diseases:dis,diseaseN:dn,notes:($q("iNt")||{}).value||"",
    voiceTx:($q("iVoiceTx")||{}).value||(function(){var e=editId?D.inspections.find(function(i){return i.id===editId;}):null;return e?e.voiceTx||"":"";})(),   // 🎙️ everything said (voice.js)
    postTr:!!($q("iPostTr")||{}).checked,
    postTrId:($q("iPostTrProd")||{}).value||null,
    postTrEff:($q("iPostTrEff")||{}).value||"",
    postTrVarroa:($q("iPostTrVarroa")||{}).value?parseInt(($q("iPostTrVarroa")||{}).value):null,
    postTrNotes:($q("iPostTrNotes")||{}).value||""
  };
  o.weight=weighRead();          // ⚖️ optional weighing (any time of year)
  o.winterMode=inspWinterOn();   // ❄️ winter mode: only the winter checks are recorded
  // 🔄 frames: final count vs before − out + in; an unexplained difference asks before saving
  var exO=editId?D.inspections.find(function(i){return i.id===editId;}):null;
  var bfV=($q("mvBefore")||{}).value;o.frBefore=bfV===""||bfV==null?(exO?exO.frBefore:null):parseInt(bfV);
  var bbV=($q("mvBefB")||{}).value,bhV=($q("mvBefF")||{}).value,bgV=($q("mvBefG")||{}).value;
  o.frBeforeG=bgV===""||bgV==null?(exO?exO.frBeforeG:null):parseInt(bgV);
  o.frBeforeB=bbV===""||bbV==null?(exO?exO.frBeforeB:null):parseInt(bbV);o.frBeforeF=bhV===""||bhV==null?(exO?exO.frBeforeF:null):parseInt(bhV);
  if(o.winterMode)o.mv=exO?exO.mv||null:null;
  var mc=o.winterMode?null:mvCheck();
  if(mc&&mc.diff!==0&&!window._mvForce){
    showConfirm("Ai scris <b>"+mc.fin+"</b> rame în cuib, dar înainte erau <b>"+mc.before+"</b>"+(mc.out?", scoase "+mc.out:"")+(mc.inn?", puse "+mc.inn:"")+".<br>"
      +(mc.diff<0?"Lipsesc <b>"+(-mc.diff)+"</b> rame":"Sunt <b>"+mc.diff+"</b> rame în plus")+" fără motiv notat.<br><br>Poți apăsa „Anulează” și le treci la „🔀 Rame mutate între stupi”, sau salvezi așa (se notează „fără motiv”).",
      function(){window._mvForce=true;saveInsp(editId,hiveId);},null,"💾 Salvez așa");
    return;
  }
  window._mvForce=false;
  o.frDiff=mc&&mc.diff?mc.diff:0;
  // frames put in / taken out straight in the boxes (boxes.js) — kept, so editing this inspection later does not ask again
  o.frDir=(typeof _bx!=="undefined"&&_bx.on&&!o.winterMode&&(_bx.put||_bx.take||_bx.adj.b||_bx.adj.f||_bx.adj.e))?{put:_bx.put,take:_bx.take,adj:{b:_bx.adj.b,f:_bx.adj.f,e:_bx.adj.e}}:(o.winterMode&&exO?exO.frDir||null:null);
  if(o.mv){var ms=mvSums(o.mv);o.fIn=ms.fIn;o.fOut=ms.fOut;}else{o.fIn=null;o.fOut=null;}
  o.wch=null;
  if(o.winterMode){
    var wr=winterRead();
    o.wch=wr.wch;o.winter=wr.frames!=null?{frames:wr.frames,food:null}:null;
    o.behav=null;o.qSeen=false;o.eggs=false;o.larvae=false;o.capped=false;o.calcBrood=false;o.qEmerged=false;o.qMated=false;
    o.botci=false;o.botciN=0;o.botciS="";o.botciF="";o.botciAction="";o.fIn=null;o.fOut=null;o.nFramesB=0;
    o.postTr=false;o.postTrId=null;o.postTrEff="";o.postTrVarroa=null;o.postTrNotes="";
  }
  if(!o.winterMode&&_magSt&&document.querySelector("#MB .mg2")){   // supers: post-inspection state, per super
    var md=magDiff();
    o.mags=_magSt.cur.map(function(m){magNorm(m,_magSt.per);return{f:m.f,cap:m.cap,h:m.h,e:m.e,n:m.n,size:m.size};});
    o.magsBefore=_magSt.before.map(function(m){return{f:m.f,cap:m.cap,h:m.h,e:m.e,n:m.n,size:m.size};});
    o.magCount=o.mags.length;o.hasMag=o.magCount>0;o.magT=magSum(o.mags);
    o.magCap=Math.round(o.mags.reduce(function(t,m){return t+m.f*m.cap/100;},0));
    o.magAddS=md.addS;o.magRmS=md.rmS;o.magAddF=md.addF;o.magRmF=md.rmF;
    if(!o.magCount)o.magFull=0;
  }
  // 🚚 inspection done during migratory beekeeping → record the location
  var ptI=typeof pTripOf==="function"?pTripOf(hid,o.date):null;
  o.pastId=ptI?ptI.id:null;o.pastLoc=ptI?ptI.location:"";
  var prevI=editId?JSON.parse(JSON.stringify(D.inspections.find(function(i){return i.id===editId;})||null)):null;
  inspTrSave(o,prevI); // treatments: end / plan from the inspection
  inspFdSave(o,prevI); // feeding: start / top up / stop / plan from the inspection
  mvRevert(prevI);     // frames given to / taken from other hives: undo the old version first
  if(editId){var ei=D.inspections.find(function(i){return i.id===editId;});if(ei)Object.assign(ei,o);}
  else{D.inspections.push(o);}
  mvApply(o);          // frames given to / taken from other hives → recorded there too
  mvPlAdd(hid,mvPlNet(o.mv)-mvPlNet(prevI&&prevI.mv));   // ⬢ plastic frames count of this hive
  inspVarroaSave(o);   // varroa count from the inspection (if a treatment is ongoing)
  devQueenInspSave(o); // new mated queen → becomes the hive's queen (if checked)
  var hive=D.hives.find(function(h){return h.id===hid;});
  // The hive takes the frames from the inspection only if it is its most recent inspection
  // (an edited old inspection does not overwrite the current state)
  var isLatest=!D.inspections.some(function(i){return i.hiveId===hid&&i.id!==o.id&&i.date&&o.date&&i.date>o.date;});
  if(hive&&isLatest){
    hive.fB=brood;hive.fH=o.fH;hive.fE=o.fE;hive.nests=o.nests;hive.nestF=o.nestF||null;if(o.plAdd)hive.plAny=true;hive.fT=brood+o.fH+o.fE;   // total = brood + food + empty
    hive.str=strCalc(brood,o.fH,o.winter?o.winter.frames:null,o.date);if(o.space==="urgent")hive.sc="red";
    if(o.winter&&o.winter.frames!=null){hive.bees=o.winter.frames;hive.beesDate=o.date;}
    // Supers: the hive takes the count from the inspection (0 = no super)
    if(o.mags){hive.mags=o.mags;hive.magCount=o.magCount;hive.hasMag=o.magCount>0;}
  }
  save();closeM();
  if(typeof vcSaved==="function")vcSaved(hid);   // 🎙️ voice draft of this hive is now saved
  // Per-hive auto-snapshot (saved to separate localStorage key)
  saveHiveSnapshot(hid);
  render();
  toast(editId?t("insp_upd"):t("insp_saved"),"🐝");
  // swarm with a confirmed mated queen → suggest moving it to hives
  if(hive&&hive.kind==="roi"&&o.qMated)setTimeout(function(){nucPromoteM(hid,true);},450);
  mvNucAfterSave(o);   // „🐝 Fac un roi nou” → open the nuc form with these frames
};

// 🏠 BROOD BOXES in the inspection (like the supers): 1 by default, „➕ Adaugă cuib” adds one, „➖ Scoate” on the top one.
// With 2+ boxes every box has its own frames (puiet / mâncare / goale) — edited right in its row; the totals
// (iFB / iFH / iFE, used everywhere else) are their sum. o.nestF = [{b,f,e}, …] (bottom → top), only when 2+ boxes.
var _nst={n0:1,n:1,per:10,F:[{b:0,f:0,e:0,n:0}]};
var _bxDrawing=false;
function nstSplit(b,f,e,n,per){   // totals → boxes, filling from the bottom box up (brood first, then food, then empty)
  var F=[];for(var i=0;i<n;i++)F.push({b:0,f:0,e:0,n:0});
  var put=function(k,v){for(var i=0;i<n&&v>0;i++){var room=per-(F[i].b+F[i].f+F[i].e+F[i].n);if(i===n-1)room=v;var x=Math.min(room,v);F[i][k]+=x;v-=x;}};
  put("b",b);put("f",f);put("e",e);return F;
}
// same as nstSplit, but every box keeps its own size
function nstSplitSz(b,f,e,sizes,per){
  var n=sizes.length,F=[];for(var i=0;i<n;i++){F.push({b:0,f:0,e:0,n:0});if(sizes[i])F[i].size=sizes[i];}
  var put=function(k,v){for(var i=0;i<n&&v>0;i++){var room=(sizes[i]||per)-(F[i].b+F[i].f+F[i].e+F[i].n);if(i===n-1)room=v;var x=Math.min(Math.max(0,room),v);F[i][k]+=x;v-=x;}};
  put("b",b);put("f",f);put("e",e);return F;
}
function nstBlockHTML(hive,ex){
  var n0=parseInt(ex?(ex.nestsBefore!=null?ex.nestsBefore:ex.nests):(hive&&hive.nests))||1,n=parseInt(ex?ex.nests:(hive&&hive.nests))||1;
  var per=hvCap1(hive),src=ex?ex.nestF:(hive&&hive.nestF);
  var b=parseInt(ex?ex.fB:(hive&&hive.fB))||0,f=parseInt(ex?inspFood(ex):(hive&&hive.fH))||0,e=parseInt(ex?ex.fE:(hive&&hive.fE))||0;
  var F=(Array.isArray(src)&&src.length===n)?src.map(function(x){var o={b:parseInt(x.b)||0,f:parseInt(x.f)||0,e:parseInt(x.e)||0,n:parseInt(x.n)||0};if(parseInt(x.size))o.size=parseInt(x.size);return o;}):nstSplit(b,f,e,n,per);
  _nst={n0:n0,n:n,per:per,F:F};
  return'<input type="hidden" id="iNst" value="'+n+'"><input type="hidden" id="iNst0" value="'+n0+'"><div class="mag-box mg2 nst-box" id="nstBox">'+nstBodyHTML()+'</div>';
}
function nstSz(i){var F=_nst.F[i];return(F&&parseInt(F.size))||_nst.per;}           // frames that fit in box i
function nstCap(){var c=0;for(var i=0;i<_nst.n;i++)c+=nstSz(i);return c;}
function nstSum(k){return _nst.F.reduce(function(a,x){return a+(k==="e"?(x.e||0)+(x.n||0):k?(x[k]||0):x.b+x.f+(x.e||0)+(x.n||0));},0);}
function nstBodyHTML(){
  var s=_nst,tot=nstSum(),cap=nstCap();
  var h='<div class="mag-h">🏠 '+L2("Cuiburi","Brood boxes")+' <span class="hv-ts">· '+L2("la deschidere","at start")+': '+s.n0+' '+(s.n0===1?"cuib":"cuiburi")
    +(s.n>1?' · <b>'+tot+'</b> / '+cap+' '+L2("rame","frames"):' · '+L2("încap","fit")+' '+cap+' '+L2("rame","frames"))+'</span></div>';
  if(s.n>1){
    h+='<div class="mg-hint">'+L2("Fiecare cuib cu ramele lui — sus e cuibul de deasupra.","Each box with its own frames — the top one is the upper box.")+'</div>';
    for(var i=s.n;i>=1;i--){var F=s.F[i-1],t=F.b+F.f+(F.e||0)+(F.n||0),sl="",SZ=nstSz(i-1);
      for(var k=0;k<Math.max(SZ,t);k++){var c=k<F.b?"b":k<F.b+F.f?"f":k<t?"e":"";sl+='<i class="'+c+(k>=SZ?" over":"")+'"></i>';}
      var st=function(key,ic,lbl){return'<div class="nst-st"><span>'+ic+' '+lbl+'</span><span class="mv-step"><button type="button" onclick="nstFr('+(i-1)+',\''+key+'\',-1)">−</button><b>'+F[key]+'</b><button type="button" onclick="nstFr('+(i-1)+',\''+key+'\',1)">+</button></span></div>';};
      h+='<div class="mg-row nst-row'+(i>s.n0?' nst-new':'')+'"><div class="mg-top"><b>'+L2("Cuibul","Box")+' '+i+'</b><span class="hv-ts">· '+(i===1?L2("jos","bottom"):i===s.n?L2("sus","top"):"")+' · '+t+'/'+SZ+'</span>'
        +(i>s.n0?'<span class="bg gg">'+L2("nou","new")+'</span>':'')
        +(i===s.n?'<span class="mg-mv"><button type="button" class="mg-ib mg-x" onclick="nstSet('+(s.n-1)+')">➖ '+L2("Scoate","Remove")+'</button></span>':'')+'</div>'
        +'<div class="isc-sl nst-sl" style="grid-template-columns:repeat('+Math.min(Math.max(SZ,t),12)+',1fr)">'+sl+'</div>'
        +(i>s.n0&&!t?'<div class="hv-ts" style="margin:6px 0 2px;">'+L2("Ce rame ai pus în cuibul nou?","Which frames did you put in the new box?")+'</div>':'')
        +st("b","🟤",L2("Puiet","Brood"))+st("f","🍯",L2("Mâncare","Food"))+st("e","🪹",L2("Goale / fundație","Empty / foundation"))
        +(t>SZ?'<div class="hv-tip bad">⚠️ '+L2("În cuib încap doar","Only")+' '+SZ+' '+L2("rame","frames fit")+'</div>':'')
        +'</div>';}
  }
  if(s.n<3)h+='<button type="button" class="mg-add" onclick="nstSet('+(s.n+1)+')">➕ '+L2("Adaugă cuib","Add brood box")+'</button>';
  if(s.n!==s.n0)h+='<div class="mag-res">'+L2("Azi","Today")+': <b class="mg-ch">'+(s.n>s.n0?'➕ '+(s.n-s.n0)+' cuib':'➖ '+(s.n0-s.n)+' cuib')+'</b> → '+s.n+' '+(s.n===1?"cuib":"cuiburi")+'</div>';
  return h;
}
// boxes → totals (iFB / iFH / iFE); with one box the totals are edited directly
function nstSync(){
  if(_nst.n>1){var fb=$q("iFB"),fh=$q("iFH"),fe=$q("iFE");
    if(fb)fb.value=nstSum("b");if(fh)fh.value=nstSum("f");if(fe)fe.value=nstSum("e");
    if(typeof mvBal==="function")mvBal();}
  nstVis();inspNestTip();
  if(typeof inspCardsRefresh==="function")inspCardsRefresh();
}
// totals changed from outside (voice, a frame-move row with one box…) → split them over the boxes again
function nstFromTotals(){
  var g=function(id){return Math.max(0,parseInt(($q(id)||{}).value)||0);};
  if(nstSum("b")!==g("iFB")||nstSum("f")!==g("iFH")||nstSum("e")!==g("iFE")){
    if(_nst.n>1){var sz=_nst.F.map(function(x){return x.size;});_nst.F=nstSplitSz(g("iFB"),g("iFH"),g("iFE"),sz,_nst.per);}
    else{var o=_nst.F[0]||{},nn=Math.min(o.n||0,g("iFE"));_nst.F=[{b:g("iFB"),f:g("iFH"),e:g("iFE")-nn,n:nn}];}}
}
// 2+ boxes: the per-box rows replace the total steppers
function nstVis(){
  var multi=_nst.n>1;
  ["iFB","iFE"].forEach(function(id){var el=$q(id),r=el&&el.closest(".r2");if(r)r.style.display=multi?"none":"";});
  var sl=document.getElementById("iscSlots");if(sl)sl.style.display=multi?"none":"";
}
window.nstFr=function(i,k,d){
  var F=_nst.F[i];if(!F)return;F[k]=Math.max(0,F[k]+d);
  var b=document.getElementById("nstBox");if(b)b.innerHTML=nstBodyHTML();
  if(typeof _mDirty!=="undefined")_mDirty=true;nstSync();
};
window.nstSet=function(n,size){
  n=Math.max(1,Math.min(3,parseInt(n)||1));
  nstFromTotals();
  while(_nst.F.length<n){var nb={b:0,f:0,e:0,n:0};if(parseInt(size))nb.size=parseInt(size);_nst.F.push(nb);}
  while(_nst.F.length>n){var x=_nst.F.pop(),y=_nst.F[_nst.F.length-1];y.b+=x.b;y.f+=x.f;y.e+=x.e;y.n=(y.n||0)+(x.n||0);}   // a removed box: its frames go to the box below
  _nst.n=n;
  var el=$q("iNst");if(el)el.value=n;
  var b=document.getElementById("nstBox");if(b)b.innerHTML=nstBodyHTML();
  if(typeof _mDirty!=="undefined")_mDirty=true;
  if(typeof mvBoxRefresh==="function")mvBoxRefresh();
  nstSync();
};
function nstOver(){return _nst.F.some(function(x,i){return x.b+x.f+(x.e||0)+(x.n||0)>nstSz(i);});}
function nstRead(){nstFromTotals();return _nst.F.map(function(x){var o={b:x.b,f:x.f,e:x.e||0,n:x.n||0};if(x.size)o.size=x.size;return o;});}

// ➕ live tip under the nest frames (brood filled the nest → add an empty frame; nest full → 2nd box / super)
function inspNestTip(){
  if(typeof inspSlotsUpd==="function")inspSlotsUpd();
  if(typeof bxDraw==="function"&&!_bxDrawing){_bxDrawing=true;try{bxDraw();}finally{_bxDrawing=false;}}
  var el=document.getElementById("iNestTip");if(!el)return;
  var hid=($q("iHive")||{}).value||_mvSelf,h=D.hives.find(function(x){return x.id===hid;})||{};
  var b=parseInt(($q("iFB")||{}).value)||0,f=parseInt(($q("iFH")||{}).value)||0,e=parseInt(($q("iFE")||{}).value)||0,ns=parseInt(($q("iNst")||{}).value)||1;
  var cap=$q("iNst0")&&typeof nstCap==="function"?nstCap():hvCap(h,ns),tot=b+f+e,tt=document.getElementById("iNestTot");
  if(tt)tt.innerHTML='<b>'+tot+'</b> / '+cap+' '+L2("rame","frames")+(cap>tot&&h.kind!=="roi"?' <span class="hv-ts">· '+(cap-tot)+' '+L2("libere","free")+'</span>':'');
  // more frames than fit in the boxes → not allowed (add a box or fix the numbers)
  if(h.kind!=="roi"&&tot>cap){
    el.innerHTML='<div class="hv-tip bad">⚠️ '+(ns===1?L2("În cuib încap doar ","Only ")+cap:L2("În cele "+ns+" cuiburi încap doar ","Only ")+cap)+' '+L2("rame — ai trecut ","frames fit — you entered ")+tot+'. '
      +(ns<3?'<button type="button" class="btn sm" onclick="nstSet('+(ns+1)+')">➕ '+L2("Adaug un cuib","Add a box")+'</button> '+L2("sau corectează numerele.","or fix the numbers."):L2("Corectează numerele.","Fix the numbers."))+'</div>';
    return;}
  var tp=h.kind==="roi"?null:hvNestTip(h,b,f,e,ns);
  el.innerHTML=tp?'<div class="hv-tip '+tp.c+'">'+tp.t+'</div>':'';
}
// frames vs room in the boxes (used when saving)
function inspNestOver(hid){
  var h=D.hives.find(function(x){return x.id===hid;})||{};if(h.kind==="roi")return 0;
  var tot=(parseInt(($q("iFB")||{}).value)||0)+(parseInt(($q("iFH")||{}).value)||0)+(parseInt(($q("iFE")||{}).value)||0);
  return Math.max(0,tot-($q("iNst0")?nstCap():hvCap(h,parseInt(($q("iNst")||{}).value)||1)));
}
