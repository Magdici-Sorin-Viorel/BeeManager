// BeeManager Pro — varroa.js
// Varroa: counts, link to treatments, efficacy
//
// A count (D.varroa) can be linked to a treatment (treatmentId).
// The phase is computed from dates, so it updates if you change the treatment period:
//   "before"  – before the treatment starts (baseline)
//   "during"  – during treatment (mites dropped = treatment effect)
//   "after"   – after finishing (control: what remains)
//   "monitor" – regular count, no treatment
// Natural drop / board: miteCount mites over (hours/24) days.
// Alcohol / sugar wash: miteCount mites per beeCount bees → infestationPct.

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════
function vrLevel(v){
  if(!v)return"ok";
  var m=v.method||"natural";
  if(m==="natural"||m==="sticky"){
    var rate=(v.miteCount||0)/((v.hours||24)/24);   // mites / 24h
    if(rate<3)return"ok";
    if(rate<10)return"watch";
    return"treat";
  }else{
    var pct=v.infestationPct||0;
    if(pct<1)return"ok";
    if(pct<2)return"watch";
    return"treat";
  }
}
function vrTint(col,a){
  var rgb=col.indexOf("--ok")>=0?"111,191,76":col.indexOf("--gold")>=0?"230,180,34":col.indexOf("--info")>=0?"74,158,255":"224,124,76";
  return"rgba("+rgb+","+a+")";
}
function vrCalcPct(v){
  if(v.method==="natural"||v.method==="sticky")return null;
  return parseFloat((((v.miteCount||0)/(v.beeCount||300))*100).toFixed(2));
}
function vrIsDrop(v){return !v.method||v.method==="natural"||v.method==="sticky";}
function vrDays(v){return Math.max(1,Math.round((v.hours||24)/24));}
function vrPerDay(v){return(v.miteCount||0)/vrDays(v);}
function vrToday(){return todayISO();}
function vrDayDiff(a,b){return Math.round((new Date(b)-new Date(a))/86400000);}   // b − a, in days

// ── Treatments ──
function trIsVarroa(tr){return !tr.target||tr.target==="varroa";}
// Finishing: tr.done = finish date for all hives; tr.doneHives = {hiveId: date} for some hives only.
// A treatment finished on day X is no longer „în curs” from day X (counts on day X still count).
function trFinFor(tr,hiveId){
  var f=tr.done||null,h=(hiveId&&tr.doneHives)?tr.doneHives[hiveId]:null;
  if(h&&(!f||h<f))f=h;return f;
}
function trEnd(tr,hiveId){var e=tr.endDate||tr.date,f=trFinFor(tr,hiveId);if(f&&f<e)e=f;return e;}
function trIsActive(tr,hiveId,date){var f=trFinFor(tr,hiveId);return !!tr.date&&tr.date<=date&&trEnd(tr,hiveId)>=date&&!(f&&f<=date);}
function trShort(tr){return((tr&&tr.product)||"").replace(/^[^A-Za-zÀ-ž0-9]+/,"").trim();}
function trAppliesTo(tr,hiveId){return !tr.hiveId||tr.hiveId===hiveId;}
function trHives(tr){return tr.hiveId?D.hives.filter(function(h){return h.id===tr.hiveId;}):D.hives.slice();}
// Varroa treatment ongoing on a date (default today)
function trActiveFor(hiveId,date){
  date=date||vrToday();
  return(D.treatments||[]).filter(function(tr){return trIsVarroa(tr)&&trAppliesTo(tr,hiveId)&&trIsActive(tr,hiveId,date);})
    .sort(function(a,b){return a.date<b.date?1:-1;})[0]||null;
}
// Matching treatment for a count: ongoing, else the nearest (30 days before / 45 after)
function trAutoFor(hiveId,date){
  var a=trActiveFor(hiveId,date);if(a)return a;
  var c=(D.treatments||[]).filter(function(tr){
    if(!(trIsVarroa(tr)&&tr.date&&trAppliesTo(tr,hiveId)))return false;
    var toStart=vrDayDiff(date,tr.date);      // > 0: treatment starts after the count (→ „înainte”)
    var sinceEnd=vrDayDiff(trEnd(tr,hiveId),date);   // > 0: count is after finishing (→ „după / control”)
    return(toStart>0&&toStart<=14)||(sinceEnd>0&&sinceEnd<=45);
  });
  c.sort(function(x,y){
    var dx=Math.min(Math.abs(vrDayDiff(date,x.date)),Math.abs(vrDayDiff(date,trEnd(x,hiveId))));
    var dy=Math.min(Math.abs(vrDayDiff(date,y.date)),Math.abs(vrDayDiff(date,trEnd(y,hiveId))));
    return dx-dy;
  });
  return c[0]||null;
}
function vrPhase(v){
  if(!v||!v.treatmentId)return"monitor";
  var tr=(D.treatments||[]).find(function(x){return x.id===v.treatmentId;});
  if(!tr)return"monitor";
  if(v.date<tr.date)return"before";
  if(v.date<=trEnd(tr,v.hiveId))return"during";
  return"after";
}
function vrPhaseLbl(ph){
  return{before:L2("înainte","before"),during:L2("în tratament","during treatment"),after:L2("după (control)","after (control)"),monitor:L2("monitorizare","monitoring")}[ph]||ph;
}
function vrPhaseIcon(ph){return{before:"⏮️",during:"💊",after:"✅",monitor:"🔎"}[ph]||"";}
// A treatment's counts on a hive (ascending by date)
function vrCountsFor(trId,hiveId,phase){
  return(D.varroa||[]).filter(function(v){return v.treatmentId===trId&&v.hiveId===hiveId&&(!phase||vrPhase(v)===phase);})
    .sort(function(a,b){return a.date<b.date?-1:a.date>b.date?1:0;});
}
// Treatment × hive statistics
function trStats(tr,hiveId){
  var all=vrCountsFor(tr.id,hiveId);
  var during=all.filter(function(v){return vrPhase(v)==="during";});
  var before=all.filter(function(v){return vrPhase(v)==="before";});
  var after=all.filter(function(v){return vrPhase(v)==="after";});
  var dd=during.filter(vrIsDrop);
  var total=dd.reduce(function(s,v){return s+(v.miteCount||0);},0);
  var days=dd.reduce(function(s,v){return s+vrDays(v);},0);
  var st={counts:all.length,during:during.length,total:total,days:days,perDay:days?total/days:null,
    last:all.length?all[all.length-1]:null,before:before,after:after,reduction:null,redTxt:""};
  // Estimated reduction: same measurement type before and after treatment
  var lb=before.length?before[before.length-1]:null,la=after.length?after[after.length-1]:null;
  if(lb&&la){
    if(vrIsDrop(lb)&&vrIsDrop(la)){
      var rb=vrPerDay(lb),ra=vrPerDay(la);
      if(rb>0){st.reduction=Math.max(0,Math.round((rb-ra)/rb*100));st.redTxt=rb.toFixed(1)+" → "+ra.toFixed(1)+" "+L2("/zi","/day");}
    }else if(!vrIsDrop(lb)&&!vrIsDrop(la)){
      var pb=lb.infestationPct!=null?lb.infestationPct:vrCalcPct(lb),pa=la.infestationPct!=null?la.infestationPct:vrCalcPct(la);
      if(pb>0){st.reduction=Math.max(0,Math.round((pb-pa)/pb*100));st.redTxt=pb.toFixed(1)+"% → "+pa.toFixed(1)+"%";}
    }
  }
  return st;
}
// Suggested drop days: from this treatment's previous count, else from its start
function vrDefaultDays(hiveId,trId,date,exceptId){
  if(!trId)return 1;
  var tr=(D.treatments||[]).find(function(x){return x.id===trId;});
  // previous count during the treatment (those before the start don't count)
  var prev=(D.varroa||[]).filter(function(v){return v.treatmentId===trId&&v.hiveId===hiveId&&v.id!==exceptId&&v.date<date&&(!tr||v.date>=tr.date);})
    .sort(function(a,b){return a.date<b.date?1:-1;})[0];
  var from=prev?prev.date:(tr&&tr.date<date?tr.date:null);
  var d=from?vrDayDiff(from,date):1;
  return Math.min(30,Math.max(1,d));
}
function vrValStr(v){
  if(vrIsDrop(v))return(v.miteCount||0)+' '+L2("acarieni","mites")+' / '+vrDays(v)+' '+(vrDays(v)===1?L2("zi","day"):L2("zile","days"));
  var p=v.infestationPct!=null?v.infestationPct:vrCalcPct(v);
  return(p||0).toFixed(1)+'% ('+(v.miteCount||0)+'/'+(v.beeCount||300)+')';
}

// ═══════════════════════════════════════════
// „NUMĂRĂTORI” TAB (former Varroa page)
// ═══════════════════════════════════════════
var _vrHiveFilter="all";

// The Varroa page is now a tab in „Tratamente”
function renderVarroa(){_trTab="counts";renderTreatments();}



window.delVr=function(id){
  showConfirm(t("vr_del_c"),function(){
    D.varroa=D.varroa.filter(function(v){return v.id!==id;});
    save();render();
  });
};

// ═══════════════════════════════════════════
// COUNT FORM
// ═══════════════════════════════════════════
// vrM(id)                          – edit
// vrM("",{hiveId,treatmentId})      – new count for a hive / treatment
function vrTrOptions(hiveId,date,selId){
  var list=(D.treatments||[]).filter(function(tr){return trIsVarroa(tr)&&tr.date&&trAppliesTo(tr,hiveId)
      &&(tr.id===selId||(vrDayDiff(date,tr.date)<=30&&vrDayDiff(trEnd(tr,hiveId),date)<=60));})
    .sort(function(a,b){return a.date<b.date?1:-1;});
  return'<option value="">'+L2("— fără (monitorizare)","— none (monitoring)")+'</option>'
    +list.map(function(tr){
      var st=tr.date>date?L2("planificat","planned"):!trIsActive(tr,hiveId,date)?L2("încheiat","ended"):L2("în curs","active");
      return'<option value="'+tr.id+'"'+(tr.id===selId?" selected":"")+'>'+esc(trShort(tr))+' · '+tr.date+(tr.endDate&&tr.endDate!==tr.date?' → '+tr.endDate:'')+' ('+st+')</option>';
    }).join("");
}
function vrTrHint(trId,date){
  if(!trId)return'<span class="hint">'+L2("Numărătoare obișnuită — se compară cu pragurile.","Regular count — compared with the thresholds.")+'</span>';
  var tr=(D.treatments||[]).find(function(x){return x.id===trId;});if(!tr)return"";
  var ph=vrPhase({treatmentId:trId,date:date});
  var extra=ph==="during"?' · '+L2("ziua","day")+' '+(vrDayDiff(tr.date,date)+1)+(tr.endDate?' / '+(vrDayDiff(tr.date,tr.endDate)+1):''):'';
  return'<span class="hint">'+vrPhaseIcon(ph)+' '+L2("Faza:","Phase:")+' <b>'+vrPhaseLbl(ph)+'</b>'+extra+'</span>';
}
function vrFieldsHTML(meth,mites,daysOrBees){
  var isWash=meth==="alcohol"||meth==="sugar";
  return isWash
    ?'<div class="r2"><div>'+L(t("vr_bees"))+'<input type="number" id="vrBees" inputmode="numeric" min="1" value="'+esc(daysOrBees||300)+'" oninput="vrLiveCalc()"></div>'
     +'<div>'+L(t("vr_mites"))+'<input type="number" id="vrMites" inputmode="numeric" min="0" value="'+esc(mites)+'" oninput="vrLiveCalc()"></div></div>'
    :'<div class="r2"><div>'+L(L2("⏱️ Zile de cădere","⏱️ Days of drop"))+'<input type="number" id="vrDays" inputmode="numeric" min="1" max="30" value="'+esc(daysOrBees||1)+'" oninput="vrLiveCalc()"><span class="hint">'+L2("de la ultima curățare a plăcii","since the board was last cleaned")+'</span></div>'
     +'<div>'+L(L2("🕷️ Acarieni căzuți","🕷️ Mites fallen"))+'<input type="number" id="vrMites" inputmode="numeric" min="0" value="'+esc(mites)+'" oninput="vrLiveCalc()"></div></div>';
}
function vrM(id,preset){
  var ex=id?((D.varroa||[]).find(function(v){return v.id===id;})):null;
  preset=preset||{};
  var hid=ex?ex.hiveId:(preset.hiveId||(_vrHiveFilter!=="all"?_vrHiveFilter:((D.hives[0]||{}).id||"")));
  var date=ex?ex.date:vrToday();
  var trId=ex?(ex.treatmentId||""):(preset.treatmentId!==undefined?preset.treatmentId:((trAutoFor(hid,date)||{}).id||""));
  var meth=ex?(ex.method||"natural"):(preset.method||"sticky");
  var methods=t("vr_methods")||[];
  var d0=ex?(vrIsDrop(ex)?vrDays(ex):(ex.beeCount||300)):(vrIsDrop({method:meth})?vrDefaultDays(hid,trId,date,null):300);
  openM('<div class="mt">'+(id?t("vr_edit_t"):"🕷️ "+L2("Numărătoare varroa","Varroa count"))+'</div>'
    +'<div class="r2"><div>'+L(t("vr_hive"))+'<select id="vrHv" onchange="vrRefreshTr()">'
    +D.hives.map(function(h){return'<option value="'+h.id+'"'+(hid===h.id?" selected":"")+'>'+esc(h.name)+'</option>';}).join("")+'</select></div>'
    +'<div>'+L(t("vr_date"))+'<input type="date" id="vrDt" value="'+date+'" onchange="vrRefreshTr()"></div></div>'
    +L(L2("🔗 Tratament asociat","🔗 Linked treatment"))+'<select id="vrTr" onchange="vrRefreshTr(true)">'+vrTrOptions(hid,date,trId)+'</select>'
    +'<div id="vrTrHint" style="margin:-4px 0 8px;">'+vrTrHint(trId,date)+'</div>'
    +L(t("vr_method"))+'<select id="vrMeth" onchange="vrToggleFields(this.value)">'
    +methods.map(function(m){return'<option value="'+m.v+'"'+(meth===m.v?" selected":"")+'>'+m.l+'</option>';}).join("")+'</select>'
    +'<div id="vrFields">'+vrFieldsHTML(meth,ex?ex.miteCount:"",d0)+'</div>'
    +'<div id="vrReBox" class="ck" style="display:'+(trId&&vrPhase({treatmentId:trId,date:date})==="during"?"flex":"none")+';"><input type="checkbox" id="vrRe"'+(ex&&ex.reapplied?" checked":"")+'><label for="vrRe">💧 '+L2("Tratament reaplicat azi","Treatment re-applied today")+'</label></div>'
    +'<div id="vrResult" style="margin:10px 0;padding:10px 13px;border-radius:var(--rs);border:1px solid var(--bdr);font-size:.82rem;min-height:36px;"></div>'
    +L(t("vr_brood"))
    +'<div style="display:flex;gap:10px;margin-bottom:10px;">'
    +'<label style="display:flex;align-items:center;gap:5px;font-size:.82rem;cursor:pointer;"><input type="radio" name="vrBrood" value="1"'+(xv(ex,"hasBrood",true)?" checked":"")+'>'+t("vr_yes")+'</label>'
    +'<label style="display:flex;align-items:center;gap:5px;font-size:.82rem;cursor:pointer;"><input type="radio" name="vrBrood" value="0"'+(!xv(ex,"hasBrood",true)?" checked":"")+'>'+t("vr_no")+'</label>'
    +'</div>'
    +L(t("vr_notes"))+'<textarea id="vrNotes" rows="2">'+esc(xv(ex,"notes",""))+'</textarea>'
    +'<div class="br" style="margin-top:14px;"><button class="btn" onclick="saveVr(\''+(id||"")+'\')">'+btnS()+'</button><button class="btn gh" onclick="closeM()">'+btnC()+'</button></div>');
  if(ex)document.getElementById("MB").dataset.vrId=ex.id;
  setTimeout(vrLiveCalc,40);
}
// Hive / date / treatment changed → update treatment list, phase and suggested days
window.vrRefreshTr=function(keepTr){
  var hid=($q("vrHv")||{}).value,date=($q("vrDt")||{}).value||vrToday();
  var sel=$q("vrTr");if(!sel)return;
  var trId=keepTr?sel.value:((trAutoFor(hid,date)||{}).id||"");
  sel.innerHTML=vrTrOptions(hid,date,trId);sel.value=trId;
  var hint=document.getElementById("vrTrHint");if(hint)hint.innerHTML=vrTrHint(trId,date);
  var rb=document.getElementById("vrReBox");if(rb)rb.style.display=(trId&&vrPhase({treatmentId:trId,date:date})==="during")?"flex":"none";
  var dEl=$q("vrDays"),mb=document.getElementById("MB");
  if(dEl)dEl.value=vrDefaultDays(hid,trId,date,mb?mb.dataset.vrId:null);
  vrLiveCalc();
};
window.vrToggleFields=function(meth){
  var cont=document.getElementById("vrFields");if(!cont)return;
  var mites=($q("vrMites")||{}).value||"";
  var isWash=meth==="alcohol"||meth==="sugar";
  var hid=($q("vrHv")||{}).value,date=($q("vrDt")||{}).value||vrToday(),trId=($q("vrTr")||{}).value||"";
  cont.innerHTML=vrFieldsHTML(meth,mites,isWash?300:vrDefaultDays(hid,trId,date,null));
  vrLiveCalc();
};
window.vrLiveCalc=function(){
  var res=document.getElementById("vrResult");if(!res)return;
  var meth=($q("vrMeth")||{}).value||"natural";
  var mitesRaw=($q("vrMites")||{}).value;
  var mites=parseInt(mitesRaw)||0;
  var isWash=meth==="alcohol"||meth==="sugar";
  var trId=($q("vrTr")||{}).value||"",date=($q("vrDt")||{}).value||vrToday();
  var during=trId&&vrPhase({treatmentId:trId,date:date})==="during";
  var col,txt,badge;
  if(isWash){
    var bees=parseInt(($q("vrBees")||{}).value)||300,pct=(mites/bees)*100;
    var lvl=pct<1?"ok":pct<2?"watch":"treat";
    txt=t("vr_infestation")+" <strong>"+pct.toFixed(2)+"%</strong> ("+mites+" / "+bees+")";
    col=lvl==="ok"?"var(--ok)":lvl==="watch"?"var(--gold)":"var(--danger)";
    badge=lvl==="ok"?t("vr_result_ok"):lvl==="watch"?t("vr_result_watch"):t("vr_result_treat");
  }else{
    var days=Math.max(1,parseInt(($q("vrDays")||{}).value)||1),rate=mites/days;
    txt=L2("Cădere:","Drop:")+" <strong>"+mites+"</strong> "+L2("în","in")+" "+days+" "+(days===1?L2("zi","day"):L2("zile","days"))+" = <strong>"+rate.toFixed(1)+" "+L2("acarieni / zi","mites / day")+"</strong>";
    if(during){col="var(--info)";badge="💊 "+L2("Acarieni căzuți în tratament — se adună la eficiența tratamentului.","Mites fallen during treatment — added to the treatment's efficacy.");}
    else{var l2=rate<3?"ok":rate<10?"watch":"treat";col=l2==="ok"?"var(--ok)":l2==="watch"?"var(--gold)":"var(--danger)";badge=l2==="ok"?t("vr_result_ok"):l2==="watch"?t("vr_result_watch"):t("vr_result_treat");}
  }
  res.style.background=vrTint(col,0.08);res.style.borderColor=vrTint(col,0.4);
  res.innerHTML='<span style="color:'+col+';">'+txt+'</span><br><span style="color:'+col+';font-weight:700;font-size:.8rem;">'+badge+'</span>';
};
window.saveVr=function(id){
  var meth=($q("vrMeth")||{}).value||"natural";
  var mitesRaw=(($q("vrMites")||{}).value||"").trim();
  if(mitesRaw===""){toast("⚠️ "+L2("Introdu numărul de acarieni","Enter the number of mites"));var me=$q("vrMites");if(me)me.focus();return;}
  var mites=Math.max(0,parseInt(mitesRaw)||0);
  var isWash=meth==="alcohol"||meth==="sugar";
  var bees=parseInt(($q("vrBees")||{}).value)||300;
  var days=Math.max(1,parseInt(($q("vrDays")||{}).value)||1);
  var hasBrood=document.querySelector("input[name='vrBrood']:checked");
  var ex=id?(D.varroa||[]).find(function(v){return v.id===id;}):null;
  var trId=($q("vrTr")||{}).value||null;
  var date=($q("vrDt")||{}).value||vrToday();
  var o={
    id:id||uid(),
    hiveId:($q("vrHv")||{}).value||"",
    date:date,
    method:meth,
    miteCount:mites,
    beeCount:isWash?bees:null,
    hours:isWash?null:days*24,
    infestationPct:isWash?parseFloat(((mites/bees)*100).toFixed(2)):null,
    hasBrood:hasBrood?hasBrood.value==="1":true,
    treatmentId:trId,
    reapplied:!!(trId&&($q("vrRe")||{}).checked&&vrPhase({treatmentId:trId,date:date})==="during"),
    inspectionId:ex?ex.inspectionId||null:null,
    notes:($q("vrNotes")||{}).value||""
  };
  if(!D.varroa)D.varroa=[];
  if(ex)Object.assign(ex,o);else D.varroa.push(o);
  save(false);closeM();render();toast(t("vr_saved"),"🕷️");
};
