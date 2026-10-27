// BeeManager Pro — treatvarroa.js
// „Tratamente” page (single module) + varroa count from inspection
//
// Tabs:
//   💊 Tratamente      – only ongoing + planned; for varroa ones, per hive:
//                        mites dropped and counts (added from inspection / hive card)
//   ✅ Încheiate        – finished treatments (all) + efficacy and per-product comparison
// (the „Numărători” tab was removed at your request, 26.10.2026 — its code, varroaTabHTML, stays in varroa.js)
//
// Efficacy:
//   • „căzuți” = total mites dropped on the board during treatment (its effect)
//   • „reducere estimată” = how much infestation fell between a count BEFORE and one AFTER
//     treatment (same method: drop/day or % by wash). Shown only if you have both.

var _trTab="treat";   // "treat" | "archive"
var _tvOpen={};       // open hive×treatment rows ("trId|hiveId")

function trStatus(tr){
  var td=vrToday();
  if(tr.date>td)return"planned";
  if(tr.done&&tr.done<=td)return"done";
  if(trEnd(tr)<td)return"done";
  var hs=trHives(tr);   // on all hives: finished when finished on every hive
  if(hs.length&&hs.every(function(h){return !trIsActive(tr,h.id,td);}))return"done";
  return"active";
}

function tvTabsHTML(){
  var nDone=(D.treatments||[]).filter(function(x){return trStatus(x)==="done";}).length;
  var tabs=[["treat","💊 "+L2("În curs & planificate","Active & planned")],["archive","✅ "+L2("Încheiate · eficiență","Finished · efficacy")+(nDone?' <span class="bg gy">'+nDone+'</span>':'')]];
  return'<div class="tv-tabs">'+tabs.map(function(x){
    return'<button class="tv-tab'+(_trTab===x[0]?" on":"")+'" onclick="tvTab(\''+x[0]+'\')">'+x[1]+'</button>';
  }).join("")+'</div>';
}
window.tvTab=function(tab){_trTab=tab;renderTreatments();};

function renderTreatments(){
  var head='<div class="hv-top"><h2><i class="fas fa-syringe" style="color:var(--gold)"></i> '+L2("Tratamente","Treatments")+'</h2>'
    +'<div class="tv-hbtn"><button class="btn sm" onclick="treatM()">+ '+L2("Tratament","Treatment")+'</button></div></div>';
  if(_trTab!=="archive")_trTab="treat";
  var body=_trTab==="archive"?tvArchiveHTML():tvTreatListHTML();
  setP(head+tvTabsHTML()+body);
}

// ── „Tratamente” tab ──────────────────────────────────────────────
function tvTreatListHTML(){
  var trs=(D.treatments||[]).slice();
  if(!trs.length)return'<div class="al ali">'+t("tr_no")+'</div>';
  var act=trs.filter(function(x){return trStatus(x)==="active";}).sort(function(a,b){return trEnd(a)<trEnd(b)?-1:1;});
  var pl=trs.filter(function(x){return trStatus(x)==="planned";}).sort(function(a,b){return a.date<b.date?-1:1;});

  function sec(title,list){
    if(!list.length)return"";
    return'<div class="tv-sec-t">'+title+' <span class="bg gy">'+list.length+'</span></div><div class="g gc hv-grid">'+list.map(tvCardHTML).join("")+'</div>';
  }
  if(!act.length&&!pl.length)return'<div class="al ali">'+L2("Niciun tratament în curs sau planificat. Cele încheiate sunt în tabul ✅ Încheiate.","No active or planned treatment. Finished ones are in the ✅ Finished tab.")+'</div>';
  return sec("▶️ "+L2("În curs","Active"),act)+sec("🗓️ "+L2("Planificate","Planned"),pl);
}

function tvCardHTML(tr){
  var st=trStatus(tr),td=vrToday(),isV=trIsVarroa(tr),hives=trHives(tr);
  var total=tr.endDate?vrDayDiff(tr.date,tr.endDate)+1:1;
  var day=vrDayDiff(tr.date,td)+1;
  var stBadge=st==="active"?'<span class="bg gb">▶️ '+L2("ziua","day")+' '+Math.min(day,total)+(tr.endDate?' / '+total:'')+'</span>'
    :st==="planned"?'<span class="bg gy">🗓️ '+L2("din","from")+' '+tr.date+'</span>'
    :'<span class="bg gg">✅ '+L2("încheiat","finished")+'</span>';
  var prog=st==="active"&&tr.endDate?'<div class="tv-prog"><i style="width:'+Math.min(100,Math.round(day/total*100))+'%"></i></div>':'';
  var postInsp=(D.inspections||[]).filter(function(i){return i.postTrId===tr.id;});
  var lastEff=postInsp.length?(postInsp.slice().sort(function(a,b){return a.date<b.date?1:-1;})[0].postTrEff||""):"";
  var rows="";
  if(isV){
    rows=hives.map(function(h){return tvHiveRowHTML(tr,h,st);}).join("");
    if(!hives.length)rows='<div class="hv-ts">'+t("vr_no_hives")+'</div>';
  }
  return'<div class="c hv-card tv-card'+(st==="active"?" s-act":st==="planned"?" s-plan":" s-done")+'">'
    +'<div class="hv-sec">'
    +'<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;">'
    +'<div style="min-width:0;"><div class="hv-name" style="font-size:.95rem;">'+esc(tr.product||"—")+'</div>'
    +'<div class="hv-meta">'+(isV?'🕷️ Varroa':'🩺 '+L2("Alt scop","Other purpose"))+' · 🏠 '+(tr.hiveId?esc((hives[0]||{}).name||"—"):t("tr_all_d"))+'</div></div>'
    +stBadge+'</div>'
    +'<div class="hv-meta" style="margin-top:5px;">📅 '+tr.date+(tr.endDate&&tr.endDate!==tr.date?' → '+tr.endDate:'')+(tr.dosage?' · ⚖️ '+esc(tr.dosage):'')+'</div>'
    +prog
    +(postInsp.length?'<div style="margin-top:6px;"><span class="bg gg">🔬 '+postInsp.length+' '+L2("eval.","eval.")+'</span>'+(lastEff?' <span class="bg gb">📈 '+esc(lastEff)+'</span>':'')+'</div>':'')
    +(tr.notes?'<div class="hv-ts" style="font-style:italic;margin-top:5px;">📝 '+esc(tr.notes)+'</div>':'')
    +'</div>'
    +(isV?'<div class="hv-sec tv-rows">'+rows+'</div>':'')
    +'<div class="hv-sec hv-act">'
    +(st==="active"?'<button class="btn sm be" style="flex:1;justify-content:center;" onclick="trFinishM(\''+tr.id+'\')">✅ '+L2("Încheie azi","Finish today")+'</button>':'')
    +'<button class="btn sm gh" style="flex:1;justify-content:center;" onclick="treatM(\''+tr.id+'\')">✏️ '+L2("Editează","Edit")+'</button>'
    +'<button class="btn sm gh hv-del" onclick="delTr(\''+tr.id+'\')">🗑️</button></div>'
    +'</div>';
}

// One hive within a treatment: summary + count history (collapsible)
function tvHiveRowHTML(tr,h,st){
  var s=trStats(tr,h.id),key=tr.id+"|"+h.id,open=!!_tvOpen[key];
  var sum=s.counts
    ?'🕷️ <b>'+s.total+'</b> '+L2("căzuți","fallen")+' · '+s.during+' '+L2("num.","counts")+(s.perDay!=null?' · '+s.perDay.toFixed(1)+L2("/zi","/day"):'')
    :'<span class="hv-dim">'+L2("nicio numărătoare","no counts yet")+'</span>';
  var red=s.reduction!=null?' <span class="bg gg" title="'+esc(s.redTxt)+'">📉 −'+s.reduction+'%</span>':'';
  var fin=trFinFor(tr,h.id);
  if(fin&&st!=="planned")red+=' <span class="bg gg">✅ '+devFmt(fin)+'</span>';
  var list=vrCountsFor(tr.id,h.id).slice().reverse().map(function(v){
    var ph=vrPhase(v);
    return'<div class="tv-cnt">'
      +'<span class="tv-cnt-d">'+vrPhaseIcon(ph)+' '+v.date+'</span>'
      +'<span class="tv-cnt-v">'+vrValStr(v)+(vrIsDrop(v)?' <span class="hv-dim">'+vrPerDay(v).toFixed(1)+L2("/zi","/day")+'</span>':'')+(v.reapplied?' 💧':'')+(v.inspectionId?' 🔍':'')+'</span>'
      +'<span class="tv-cnt-a"><button class="btn sm gh" onclick="vrM(\''+v.id+'\')">✏️</button></span>'
      +'</div>';
  }).join("");
  var hint="";
  if(s.reduction!=null)hint='<div class="hv-ts" style="margin-top:6px;">📉 '+L2("Reducere estimată a infestării:","Estimated infestation reduction:")+' <b>'+s.reduction+'%</b> ('+esc(s.redTxt)+')</div>';
  else if(st!=="planned")hint='<div class="hv-ts" style="margin-top:6px;">💡 '+(!s.before.length&&!s.after.length
      ?L2("Pentru eficiență: o numărătoare înainte (⏮️) și una după tratament (✅).","For efficacy: one count before (⏮️) and one after the treatment (✅).")
      :!s.before.length?L2("Lipsește numărătoarea dinainte (⏮️) pentru reducere.","The before-count (⏮️) is missing for the reduction.")
      :L2("După încheiere, fă o numărătoare de control (✅) ca să vezi reducerea.","After it ends, make a control count (✅) to see the reduction."))+'</div>';
  return'<div class="tv-hr">'
    +'<div class="tv-hr-h" onclick="tvToggle(\''+key+'\')">'
    +'<span class="tv-hn">🏠 '+esc(h.name)+'</span>'
    +'<span class="tv-hs">'+cap(sum)+red+'</span>'
    +'<span class="hv-arr" id="tvA_'+key.replace("|","_")+'">'+(open?"▲":"▼")+'</span></div>'
    +'<div class="tv-tl" id="tvL_'+key.replace("|","_")+'" style="display:'+(open?"block":"none")+';">'
    +(list||'<div class="hv-ts" style="padding:4px 0;">'+L2("Nicio numărătoare încă — se adaugă din inspecție sau cu ➕ Numără de pe cardul stupului.","No counts yet — add them from the inspection or with ➕ Count on the hive card.")+'</div>')
    +hint+'</div></div>';
}
window.tvToggle=function(key){
  _tvOpen[key]=!_tvOpen[key];
  var id=key.replace("|","_");
  var el=document.getElementById("tvL_"+id);if(el)el.style.display=_tvOpen[key]?"block":"none";
  var a=document.getElementById("tvA_"+id);if(a)a.textContent=_tvOpen[key]?"▲":"▼";
};

// ── „Eficiență & arhivă” tab ──────────────────────────────────────
function tvArchiveHTML(){
  var all=(D.treatments||[]).filter(function(tr){return trStatus(tr)==="done";})
    .sort(function(a,b){return trEnd(a)<trEnd(b)?1:-1;});
  var done=all.filter(trIsVarroa);
  var info='<div class="al ali tv-info">ℹ️ '+L2("<b>Căzuți</b> = acarieni căzuți pe placă în timpul tratamentului. <b>Reducere</b> = cât a scăzut infestarea între numărătoarea dinainte și cea de după tratament (aceeași metodă). Valorile sunt estimative.","<b>Fallen</b> = mites fallen on the board during the treatment. <b>Reduction</b> = how much the infestation dropped between the before- and after-count (same method). Values are estimates.")+'</div>';
  if(!all.length)return'<div class="al ali">'+L2("Niciun tratament încheiat încă. Când se încheie, apare aici (cu rezultatele pe fiecare stup la cele pentru varroa).","No finished treatment yet. When one ends it appears here (with per-hive results for varroa).")+'</div>';

  // Per-product comparison
  var byP={};
  done.forEach(function(tr){
    var key=trShort(tr)||"—";
    if(!byP[key])byP[key]={name:key,n:0,totals:[],reds:[]};
    trHives(tr).forEach(function(h){
      var s=trStats(tr,h.id);
      byP[key].n++;
      if(s.during)byP[key].totals.push(s.total);
      if(s.reduction!=null)byP[key].reds.push(s.reduction);
    });
  });
  var avg=function(a){return a.length?a.reduce(function(x,y){return x+y;},0)/a.length:null;};
  var prods=Object.keys(byP).map(function(k){var p=byP[k];p.avgT=avg(p.totals);p.avgR=avg(p.reds);return p;})
    .sort(function(a,b){if(a.avgR!=null&&b.avgR!=null)return b.avgR-a.avgR;if(a.avgR!=null)return -1;if(b.avgR!=null)return 1;return(b.avgT||0)-(a.avgT||0);});
  var cmp=!prods.length?'':'<div class="tv-sec-t">🏆 '+L2("Comparație pe produs (varroa)","Comparison by product (varroa)")+'</div><div class="g gc">'
    +prods.map(function(p,i){
      return'<div class="c tv-prod">'
        +'<div style="display:flex;justify-content:space-between;gap:8px;align-items:flex-start;"><div class="hv-name" style="font-size:.9rem;">'+(i===0&&p.avgR!=null?"🥇 ":"")+esc(p.name)+'</div><span class="bg gy">'+p.n+' '+(p.n===1?L2("stup","hive"):L2("stupi","hives"))+'</span></div>'
        +'<div class="tv-kv"><span>📉 '+L2("Reducere medie","Avg. reduction")+'</span><b>'+(p.avgR!=null?Math.round(p.avgR)+'%':'—')+'</b></div>'
        +(p.avgR!=null?'<div class="tv-prog g"><i style="width:'+Math.min(100,Math.round(p.avgR))+'%"></i></div><div class="hv-ts">'+L2("din","from")+' '+p.reds.length+' '+L2("stupi cu numărătoare înainte și după","hives with before & after counts")+'</div>':'')
        +'<div class="tv-kv"><span>🕷️ '+L2("Media căzuți / stup","Avg. fallen / hive")+'</span><b>'+(p.avgT!=null?Math.round(p.avgT):'—')+'</b></div>'
        +'</div>';
    }).join("")+'</div>';

  // Archive: each finished treatment (varroa: per-hive results; other purpose: the condition), with ✏️ / 🗑️
  var arc='<div class="tv-sec-t">📜 '+L2("Tratamente încheiate","Finished treatments")+' <span class="bg gy">'+all.length+'</span></div>'
    +all.map(function(tr){
      var isV=trIsVarroa(tr);
      var rows=isV?trHives(tr).map(function(h){
        var s=trStats(tr,h.id);
        return'<div class="tv-arow"><span class="tv-hn">🏠 '+esc(h.name)+'</span>'
          +'<span class="tv-am">🕷️ <b>'+(s.during?s.total:'—')+'</b>'+(s.perDay!=null?' <span class="hv-dim">'+s.perDay.toFixed(1)+L2("/zi","/day")+'</span>':'')+'</span>'
          +'<span class="tv-am">'+(s.reduction!=null?'📉 <b>'+s.reduction+'%</b>':'<span class="hv-dim">📉 —</span>')+'</span></div>';
      }).join(""):'<div class="hv-ts" style="margin-top:4px;">🩺 '+(tr.disease?esc(tr.disease):L2("Alt scop","Other purpose"))+' · 🏠 '+(tr.hiveId?esc((trHives(tr)[0]||{}).name||"—"):t("tr_all_d"))+'</div>';
      return'<div class="c tv-arc"><div style="display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap;align-items:center;">'
        +'<b style="font-size:.86rem;">'+(isV?'🕷️ ':'🩺 ')+esc(trShort(tr))+'</b><span class="hv-ts">📅 '+tr.date+(tr.endDate&&tr.endDate!==tr.date?' → '+tr.endDate:'')+'</span></div>'
        +rows
        +'<div class="tv-arc-a"><button class="btn sm gh" onclick="treatM(\''+tr.id+'\')">✏️ '+L2("Editează","Edit")+'</button>'
        +'<button class="btn sm gh hv-del" onclick="delTr(\''+tr.id+'\')" aria-label="🗑️">🗑️</button></div>'
        +'</div>';
    }).join("");
  if(!done.length)info="";
  return info+cmp+arc;
}

// ── Finishing a treatment from the Tratamente page ──
window.trFinishM=function(id){
  var tr=(D.treatments||[]).find(function(x){return x.id===id;});if(!tr)return;
  var td=vrToday();
  if(tr.hiveId){
    showConfirm(L2("Închei azi tratamentul","Finish this treatment today")+' „'+esc(trShort(tr))+'”?',function(){tr.done=td;save(false);render();toast(L2("Tratament încheiat","Treatment finished"),"✅");},null,"✅ "+L2("Da, încheie","Yes, finish"));
    return;
  }
  var act=trHives(tr).filter(function(h){return trIsActive(tr,h.id,td);});
  openM('<div class="mt">✅ '+L2("Încheie tratamentul","Finish treatment")+'</div>'
    +'<div class="tv-insp-tr"><b>'+esc(trShort(tr))+'</b> · '+t("tr_all_d")+'</div>'
    +'<div class="dev-act">'
    +'<label><input type="radio" name="trFinSc" value="all" checked onchange="document.getElementById(\'trFinHvW\').style.display=\'none\'"> '+L2("La toți stupii","For all hives")+'</label>'
    +'<label><input type="radio" name="trFinSc" value="one" onchange="document.getElementById(\'trFinHvW\').style.display=\'block\'"> '+L2("Doar la un stup","For one hive only")+'</label></div>'
    +'<div id="trFinHvW" style="display:none;">'+L(t("tr_hive"))+'<select id="trFinHv">'+act.map(function(h){return'<option value="'+h.id+'">'+esc(h.name)+'</option>';}).join("")+'</select></div>'
    +'<div class="br" style="margin-top:14px;"><button class="btn" onclick="trFinishSave(\''+id+'\')">✅ '+L2("Încheie azi","Finish today")+'</button><button class="btn gh" onclick="closeM()">'+btnC()+'</button></div>');
};
window.trFinishSave=function(id){
  var tr=(D.treatments||[]).find(function(x){return x.id===id;});if(!tr)return;
  var td=vrToday(),sc=(document.querySelector("input[name='trFinSc']:checked")||{}).value;
  if(sc==="one"){var hid=($q("trFinHv")||{}).value;if(!hid)return;tr.doneHives=tr.doneHives||{};tr.doneHives[hid]=td;}
  else tr.done=td;
  save(false);closeM();render();toast(L2("Tratament încheiat","Treatment finished"),"✅");
};

// ═══════════════════════════════════════════
// INSPECTION: treatments (finish + quick planning)
// ═══════════════════════════════════════════
// Always shown in the inspection, compact:
//  • for each ongoing treatment: „✅ S-a terminat azi” (+ this hive only / all hives, for all-hive ones)
//  • „🗓️ Planifică un tratament”: product, start, optional end, this hive / all hives
function inspTrSecHTML(hid,ex){
  var date=ex?ex.date:vrToday();
  var fins=(ex&&ex.trFinished)||[];
  var finIds=fins.map(function(f){return f.id;});
  var list=(D.treatments||[]).filter(function(tr){return trAppliesTo(tr,hid)&&(trIsActive(tr,hid,date)||finIds.indexOf(tr.id)>=0);})
    .sort(function(a,b){return(trIsVarroa(b)?1:0)-(trIsVarroa(a)?1:0);});
  // the treatment the inspection's varroa count is attached to
  var linked=ex&&ex.id?(D.varroa||[]).find(function(v){return v.inspectionId===ex.id;}):null;
  var vrTrId=(linked&&linked.treatmentId)||((trActiveFor(hid,date)||{}).id)||null;
  var html='<div class="dv"><div class="stt">💊 '+L2("Tratament","Treatment")+'</div></div>';
  var vrShown=false;
  html+=list.map(function(tr){
    var rec=fins.find(function(f){return f.id===tr.id;});
    var total=tr.endDate?vrDayDiff(tr.date,tr.endDate)+1:1,day=Math.max(1,Math.min(vrDayDiff(tr.date,date)+1,total));
    var vr=trIsVarroa(tr)&&tr.id===vrTrId;if(vr)vrShown=true;
    return'<div class="tr-card">'
      +'<div class="tr-card-h">'+(trIsVarroa(tr)?'💊 '+L2("Tratament varroa","Varroa treatment"):'🩺 '+(tr.disease?L2("Tratament","Treatment")+' – '+esc(tr.disease):L2("Tratament – alt scop","Treatment – other purpose")))
      +' <span class="hv-ts">· '+L2("ziua","day")+' '+day+(tr.endDate?' / '+total:'')+(tr.hiveId?'':' · '+L2("toți stupii","all hives"))+'</span></div>'
      +(vr?'<div id="iVrSec">'+inspVarroaSecHTML(hid,ex,date,null,true)+'</div>':'')
      +'<label class="tr-fin'+(rec?" on":"")+'"><input type="checkbox" class="iTrFin" data-tr="'+tr.id+'" id="iTrF_'+tr.id+'"'+(rec?" checked":"")
      +' onchange="this.parentNode.classList.toggle(\'on\',this.checked);var s=document.getElementById(\'iTrSc_'+tr.id+'\');if(s)s.style.display=this.checked?\'flex\':\'none\'">'
      +'✅ '+L2("Tratamentul s-a terminat azi","The treatment finished today")+'</label>'
      +(tr.hiveId?'':'<div class="dev-act tr-sc" id="iTrSc_'+tr.id+'" style="display:'+(rec?"flex":"none")+'">'
        +'<label><input type="radio" name="iTrSc_'+tr.id+'" value="one"'+(!rec||!rec.all?" checked":"")+'> '+L2("Doar la acest stup","This hive only")+'</label>'
        +'<label><input type="radio" name="iTrSc_'+tr.id+'" value="all"'+(rec&&rec.all?" checked":"")+'> '+L2("La toți stupii","All hives")+'</label></div>')
      +'</div>';
  }).join("");
  if(!list.length)html+='<div class="hv-ts" style="margin-bottom:6px;">'+L2("Niciun tratament în curs la acest stup.","No active treatment for this hive.")+'</div>';
  // count linked to a treatment no longer in the list (old inspection being edited)
  if(!vrShown&&linked)html+='<div id="iVrSec">'+inspVarroaSecHTML(hid,ex,date,null,true)+'</div>';
  var pl=ex&&ex.trPlannedId?(D.treatments||[]).find(function(x){return x.id===ex.trPlannedId;}):null;
  var prods=(t("tr_products")||[]).slice();if(pl&&pl.product&&prods.indexOf(pl.product)<0)prods.unshift(pl.product);
  html+='<div class="ck"><input type="checkbox" id="iTrPl"'+(pl?" checked":"")+' onchange="document.getElementById(\'iTrPlW\').style.display=this.checked?\'block\':\'none\'"><label for="iTrPl">🗓️ '+L2("Planifică un tratament","Plan a treatment")+'</label></div>'
    +'<div id="iTrPlW" class="dev-box" style="display:'+(pl?"block":"none")+';background:rgba(230,180,34,.06);border-color:rgba(230,180,34,.25);">'
    +'<div class="r2"><div>'+L(L2("🎯 Scop","🎯 Purpose"))+'<select id="iTrPlTg" onchange="trPlTgChg()">'
    +'<option value="varroa"'+(!pl||pl.target!=="other"?" selected":"")+'>🕷️ Varroa</option>'
    +'<option value="other"'+(pl&&pl.target==="other"?" selected":"")+'>🩺 '+L2("Alt scop","Other purpose")+'</option></select></div>'
    +'<div>'+L(L2("🦠 Afecțiune","🦠 Condition"))+'<input id="iTrPlN" value="'+esc(pl?pl.disease||"":"")+'" placeholder="'+L2("ex. Nosemoză","e.g. Nosema")+'"></div></div>'
    +L(t("tr_product"))+'<select id="iTrPlP">'+prods.map(function(p){var sep=p.indexOf("──")===0;return'<option'+(sep?' disabled':'')+((pl&&pl.product===p)?" selected":"")+'>'+p+'</option>';}).join("")+'</select>'
    +'<div class="r2"><div>'+L(t("tr_date"))+'<input type="date" id="iTrPlD" value="'+(pl?pl.date:devAdd(date,7))+'"></div>'
    +'<div>'+L(t("tr_end"))+'<input type="date" id="iTrPlE" value="'+(pl?esc(pl.endDate||""):"")+'"><span class="hint">'+t("tr_end_h")+'</span></div></div>'
    +'<div class="dev-act tr-sc" style="display:flex;margin-left:0;">'
    +'<label><input type="radio" name="iTrPlS" value="one"'+(!pl||pl.hiveId?" checked":"")+'> '+L2("Doar acest stup","This hive only")+'</label>'
    +'<label><input type="radio" name="iTrPlS" value="all"'+(pl&&!pl.hiveId?" checked":"")+'> '+L2("Toți stupii","All hives")+'</label></div>'
    +'<div class="hv-ts">'+L2("Apare în Tratamente → Planificate, iar pe cardul stupului cu 7 zile înainte.","Shows in Treatments → Planned, and on the hive card 7 days before.")+'</div>'
    +'</div>';
  return html;
}
// purpose „alt scop” → product switches to „Alt produs” (the list is varroa products)
window.trPlTgChg=function(){
  var tg=($q("iTrPlTg")||{}).value,ps=$q("iTrPlP");if(!ps)return;
  if(tg==="other"){for(var i=0;i<ps.options.length;i++){if(/Alt produs|Other product/i.test(ps.options[i].text)){ps.selectedIndex=i;break;}}}
};
window.inspTrRefresh=function(){
  var box=document.getElementById("iTrSec");if(!box)return;
  var mb=document.getElementById("MB"),exId=mb?mb.dataset.inspId:"";
  var ex=exId?D.inspections.find(function(i){return i.id===exId;}):null;
  var hid=($q("iHive")||{}).value,date=($q("iDt")||{}).value||vrToday();
  var keepPl=$q("iTrPl")&&$q("iTrPl").checked;
  var keepV={};["iTrPlP","iTrPlD","iTrPlE","iTrPlTg","iTrPlN"].forEach(function(k){if($q(k))keepV[k]=$q(k).value;});
  var keepS=(document.querySelector("input[name='iTrPlS']:checked")||{}).value;
  var keepVr=$q("iVrMites")?{meth:$q("iVrMeth").value,days:$q("iVrDays").value,mites:$q("iVrMites").value,bees:$q("iVrBees").value,re:$q("iVrRe").checked}:null;
  var exD=ex?Object.assign({},ex,{date:date}):{date:date,id:null};
  box.innerHTML=inspTrSecHTML(hid,exD);
  var vb=document.getElementById("iVrSec");if(vb&&keepVr)vb.innerHTML=inspVarroaSecHTML(hid,ex,date,keepVr,true);
  if(keepPl&&$q("iTrPl")&&!$q("iTrPl").checked){$q("iTrPl").checked=true;document.getElementById("iTrPlW").style.display="block";}
  if(keepPl){Object.keys(keepV).forEach(function(k){if($q(k))$q(k).value=keepV[k];});
    if(keepS){var r=document.querySelector("input[name='iTrPlS'][value='"+keepS+"']");if(r)r.checked=true;}}
};
// On inspection save (before writing it): apply finishes and planning.
// prev = inspection before editing (to undo what was unticked)
function inspTrSave(o,prev){
  var prevF=(prev&&prev.trFinished)||[];
  o.trFinished=[];
  [].forEach.call(document.querySelectorAll(".iTrFin"),function(cb){
    var tr=(D.treatments||[]).find(function(x){return x.id===cb.dataset.tr;});if(!tr)return;
    var was=prevF.find(function(f){return f.id===tr.id;});
    if(was){ // undo last time's finish (redone below if still ticked)
      if(was.all&&tr.done===was.date)delete tr.done;
      if(!was.all&&tr.doneHives&&tr.doneHives[o.hiveId]===was.date)delete tr.doneHives[o.hiveId];
    }
    if(!cb.checked)return;
    var all=!!tr.hiveId||((document.querySelector("input[name='iTrSc_"+tr.id+"']:checked")||{}).value==="all");
    if(all)tr.done=o.date;else{tr.doneHives=tr.doneHives||{};tr.doneHives[o.hiveId]=o.date;}
    o.trFinished.push({id:tr.id,all:all,date:o.date});
  });
  var plOn=$q("iTrPl")&&$q("iTrPl").checked;
  var prevPl=prev&&prev.trPlannedId?(D.treatments||[]).find(function(x){return x.id===prev.trPlannedId;}):null;
  if(plOn){
    var prod=($q("iTrPlP")||{}).value||"",start=($q("iTrPlD")||{}).value||devAdd(o.date,7),end=($q("iTrPlE")||{}).value||"";
    if(end&&end<start)end="";
    var all2=(document.querySelector("input[name='iTrPlS']:checked")||{}).value==="all";
    var tg=($q("iTrPlTg")||{}).value||"varroa",dz=(($q("iTrPlN")||{}).value||"").trim();
    var data={product:prod,hiveId:all2?null:o.hiveId,date:start,endDate:end,target:tg,disease:dz};
    if(prevPl)Object.assign(prevPl,data);
    else{prevPl=Object.assign({id:uid(),dosage:"",notes:L2("Planificat din inspecția din","Planned from the inspection of")+" "+o.date+(dz?" · "+dz:""),fromInspection:o.id},data);D.treatments.push(prevPl);}
    o.trPlannedId=prevPl.id;
  }else{
    // unticked on edit: delete planning created from this inspection, if not started yet
    if(prevPl&&prevPl.fromInspection===o.id&&prevPl.date>vrToday())D.treatments=D.treatments.filter(function(x){return x!==prevPl;});
    o.trPlannedId=null;
  }
}

// ═══════════════════════════════════════════
// INSPECTION: varroa count (only with an ongoing varroa treatment)
// ═══════════════════════════════════════════
function inspVarroaSecHTML(hid,ex,dateOverride,keep,compact){
  var date=dateOverride||(ex?ex.date:vrToday());
  var linked=ex?(D.varroa||[]).find(function(v){return v.inspectionId===ex.id;}):null;
  var tr=trActiveFor(hid,date)||(linked&&linked.treatmentId?(D.treatments||[]).find(function(x){return x.id===linked.treatmentId;}):null);
  if(!tr)return"";
  keep=keep||{};
  // method: the one used at this treatment's last count (remembered between inspections)
  var lastC=vrCountsFor(tr.id,hid).filter(function(v){return !linked||v.id!==linked.id;}).pop();
  var meth=keep.meth||(linked?linked.method:(lastC?lastC.method:"sticky"));
  var isWash=meth==="alcohol"||meth==="sugar";
  var days=keep.days||(linked&&vrIsDrop(linked)?vrDays(linked):vrDefaultDays(hid,tr.id,date,linked?linked.id:null));
  var mites=keep.mites!==undefined?keep.mites:(linked?linked.miteCount:"");
  var bees=keep.bees||(linked&&linked.beeCount)||300;
  var total=tr.endDate?vrDayDiff(tr.date,tr.endDate)+1:1,day=vrDayDiff(tr.date,date)+1;
  var s=trStats(tr,hid);
  return(compact
      ?'<div class="tr-vr-h">🕷️ '+L2("Numărătoare varroa","Varroa count")+(s.during?' <span class="hv-ts">· '+L2("până acum","so far")+' '+s.total+' '+L2("căzuți","fallen")+' ('+s.during+' '+L2("num.","counts")+')</span>':'')+'</div>'
      :'<div class="dv"><div class="stt">🕷️ '+L2("Numărătoare varroa","Varroa count")+'</div></div>'
       +'<div class="tv-insp-tr">💊 '+L2("Tratament varroa","Varroa treatment")+' · '+L2("ziua","day")+' '+Math.max(1,Math.min(day,total))+(tr.endDate?' / '+total:'')
       +(s.during?'<br><span class="hv-ts">🕷️ '+L2("până acum:","so far:")+' '+s.total+' '+L2("căzuți în","fallen in")+' '+s.during+' '+L2("numărători","counts")+'</span>':'')+'</div>')
    +'<input type="hidden" id="iVrTr" value="'+tr.id+'">'
    +'<div class="r3">'
    +'<div>'+L(t("vr_method"))+'<select id="iVrMeth" onchange="inspVrMeth(this.value)">'
    +(t("vr_methods")||[]).map(function(m){return'<option value="'+m.v+'"'+(meth===m.v?" selected":"")+'>'+m.l+'</option>';}).join("")+'</select></div>'
    +'<div id="iVrDaysW" style="display:'+(isWash?"none":"block")+'">'+L(L2("⏱️ Zile de cădere","⏱️ Days of drop"))+'<input type="number" id="iVrDays" inputmode="numeric" min="1" max="30" value="'+esc(days)+'"></div>'
    +'<div id="iVrBeesW" style="display:'+(isWash?"block":"none")+'">'+L(t("vr_bees"))+'<input type="number" id="iVrBees" inputmode="numeric" min="1" value="'+esc(bees)+'"></div>'
    +'<div>'+L(L2("🕷️ Acarieni","🕷️ Mites"))+'<input type="number" id="iVrMites" inputmode="numeric" min="0" value="'+esc(mites)+'" placeholder="'+L2("gol = nenumărat","empty = not counted")+'"></div>'
    +'</div>'
    +'<div class="ck"><input type="checkbox" id="iVrRe"'+((keep.re!==undefined?keep.re:(linked&&linked.reapplied))?" checked":"")+'><label for="iVrRe">💧 '+L2("Tratament reaplicat azi","Treatment re-applied today")+'</label></div>'
    +'<div class="hint">'+L2("Lasă gol dacă nu ai numărat acum. Numărătoarea se adaugă la tratament și apare pe cardul stupului.","Leave empty if you didn't count now. The count is added to the treatment and shows on the hive card.")+'</div>';
}
window.inspVrMeth=function(m){
  var w=m==="alcohol"||m==="sugar";
  var a=document.getElementById("iVrDaysW"),b=document.getElementById("iVrBeesW");
  if(a)a.style.display=w?"none":"block";if(b)b.style.display=w?"block":"none";
};
// Inspection date changed → section shows / hides based on the treatment ongoing on that date
window.inspVrRefresh=function(){
  var box=document.getElementById("iVrSec");if(!box)return;
  var hid=($q("iHive")||{}).value,date=($q("iDt")||{}).value||vrToday();
  var mb=document.getElementById("MB"),exId=mb?mb.dataset.inspId:"";
  var ex=exId?D.inspections.find(function(i){return i.id===exId;}):null;
  var keep={};
  if($q("iVrMites")){keep={meth:$q("iVrMeth").value,days:$q("iVrDays").value,mites:$q("iVrMites").value,bees:$q("iVrBees").value,re:$q("iVrRe").checked};}
  box.innerHTML=inspVarroaSecHTML(hid,ex,date,keep,true);
};
// On inspection save: create / update / delete the count linked to it
function inspVarroaSave(insp){
  var el=$q("iVrMites");
  var linked=(D.varroa||[]).find(function(v){return v.inspectionId===insp.id;});
  if(!el){return;}
  var raw=(el.value||"").trim();
  if(raw===""){if(linked)D.varroa=D.varroa.filter(function(v){return v!==linked;});return;}
  var meth=($q("iVrMeth")||{}).value||"sticky",isWash=meth==="alcohol"||meth==="sugar";
  var mites=Math.max(0,parseInt(raw)||0),bees=parseInt(($q("iVrBees")||{}).value)||300;
  var days=Math.max(1,parseInt(($q("iVrDays")||{}).value)||1);
  var trId=($q("iVrTr")||{}).value||null;
  var o={hiveId:insp.hiveId,date:insp.date,method:meth,miteCount:mites,
    beeCount:isWash?bees:null,hours:isWash?null:days*24,infestationPct:isWash?parseFloat(((mites/bees)*100).toFixed(2)):null,
    hasBrood:true,treatmentId:trId,reapplied:!!($q("iVrRe")||{}).checked,inspectionId:insp.id};
  if(!D.varroa)D.varroa=[];
  if(linked)Object.assign(linked,o);else D.varroa.push(Object.assign({id:uid(),notes:""},o));
}
