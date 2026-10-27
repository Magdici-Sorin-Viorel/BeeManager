// BeeManager Pro — devcalc.js
// Development calculations (former „Calcule Apicole” module), used from inspection and the hive card.
//
// Actual periods (Apis mellifera, days from egg laying):
//   Worker: egg 1–3 · open larva 4–9 · capped 9–21 · emerges day 21 (≈ forager after another ~21 days)
//   Queen:  egg 1–3 · larva 4–8 · capped 8–16 · emerges day 16
//               mating flights 5–10 days after emerging · laying usually 10–21 days after emerging
//
// From what you see at inspection a range is computed (earliest – latest), because
// you don't know the exact age of the egg / larva / brood seen.

var DEV={
  worker:{emerge:21,forager:21,
    // [min days, max days] until emergence, by stage seen
    egg:[18,21],larva:[12,18],capped:[0,12]},
  queen:{
    // queen-cell stage (the „bt” list from inspection) → [min, max] days until the queen emerges
    incipient:[11,15],aproape_cap:[8,10],capacite:[1,8],mixt:[1,8],
    mating:[5,10],layStart:10,layEnd:21},
  // Queen cells removed → check BEFORE a larva in a new cell gets fed as a queen:
  // an egg laid today in a cell hatches on day 3; from day 3–4 the larva gets royal jelly.
  recheckRemoved:3,
  capDeadline:7       // deadline: new cells are capped around day ~8 (after that swarming is hard to stop)
};

function devAdd(dateStr,n){var p=String(dateStr).slice(0,10).split("-");return isoLocal(new Date(+p[0],+p[1]-1,+p[2]+n));}
function devFmt(dateStr){
  try{return new Date(dateStr).toLocaleDateString(D.settings.lang==="en"?"en-GB":"ro-RO",{day:"numeric",month:"short"});}
  catch(e){return dateStr;}
}
function devRange(a,b){return a===b?devFmt(a):devFmt(a)+" – "+devFmt(b);}

// New bees: from stages seen → {from,to,foragers,parts:[{st,from,to}]}
function devWorker(date,st){
  var parts=[];
  [["capped","🟤"],["larva","🐛"],["egg","🥚"]].forEach(function(x){
    if(st[x[0]]){var r=DEV.worker[x[0]];parts.push({st:x[0],ic:x[1],from:devAdd(date,r[0]),to:devAdd(date,r[1])});}
  });
  if(!parts.length)return null;
  var from=parts.map(function(p){return p.from;}).sort()[0];
  var to=parts.map(function(p){return p.to;}).sort().reverse()[0];
  // foragers: from the youngest brood seen
  var young=parts[parts.length-1];
  return{from:from,to:to,parts:parts,foragers:devAdd(young.from,DEV.worker.forager)};
}
function devStageLbl(st){return{egg:L2("ouă","eggs"),larva:L2("larve","larvae"),capped:L2("căpăcit","capped")}[st]||st;}

// New queen from cells left to mature → {emFrom,emTo,matFrom,matTo,layFrom,layTo}
function devQueen(date,stage){
  var r=DEV.queen[stage]||DEV.queen.mixt;
  var emFrom=devAdd(date,r[0]),emTo=devAdd(date,r[1]);
  return{emFrom:emFrom,emTo:emTo,
    matFrom:devAdd(emFrom,DEV.queen.mating[0]),matTo:devAdd(emTo,DEV.queen.mating[1]),
    layFrom:devAdd(emFrom,DEV.queen.layStart),layTo:devAdd(emTo,DEV.queen.layEnd)};
}

// ── Preview in the inspection form ──
function devBroodPreviewHTML(){
  var date=($q("iDt")||{}).value||vrToday();
  var st={egg:!!($q("iEg")||{}).checked,larva:!!($q("iLv")||{}).checked,capped:!!($q("iCap")||{}).checked};
  var w=devWorker(date,st);
  if(!w)return'<div class="hv-ts">'+L2("Bifează mai sus ce ai văzut: ouă, larve sau puiet căpăcit.","Tick above what you saw: eggs, larvae or capped brood.")+'</div>';
  return w.parts.map(function(p){
      return'<div class="dev-row">'+p.ic+' '+L2("Din","From")+' '+devStageLbl(p.st)+': <b>'+devRange(p.from,p.to)+'</b></div>';
    }).join("")
    +'<div class="dev-row">🐝 '+L2("Culegătoare (din cel mai tânăr puiet):","Foragers (from the youngest brood):")+' <b>~ '+devFmt(w.foragers)+'</b></div>';
}
function devQueenPreviewHTML(){
  var date=($q("iDt")||{}).value||vrToday();
  var act=(document.querySelector("input[name='iBtcAct']:checked")||{}).value;
  if(act==="removed")return'<div class="dev-row">✂️ '+L2("Verifică din nou până pe","Check again by")+' <b>'+devFmt(devAdd(date,DEV.recheckRemoved))+'</b></div>'
    +'<div class="hv-ts">'+L2("Oul dintr-o botcă nouă eclozează în 3 zile; de atunci albinele hrănesc larva cu lăptișor ca să devină regină. Verifică înainte, ca să oprești roirea.","An egg in a new cell hatches in 3 days; from then on the bees feed the larva royal jelly to raise a queen. Check before that to stop swarming.")
    +' '+L2("Ultimul termen (înainte de căpăcire):","Last deadline (before capping):")+' '+devFmt(devAdd(date,DEV.capDeadline))+'</div>';
  if(act!=="keep")return"";
  var q=devQueen(date,($q("iBtcS")||{}).value||"mixt");
  return'<div class="dev-row">👑 '+L2("Regina nouă iese:","New queen emerges:")+' <b>'+devRange(q.emFrom,q.emTo)+'</b></div>'
    +'<div class="dev-row">💞 '+L2("Zboruri de împerechere:","Mating flights:")+' <b>'+devRange(q.matFrom,q.matTo)+'</b></div>'
    +'<div class="dev-row">🥚 '+L2("Verifică ponta:","Check for eggs:")+' <b>'+devRange(q.layFrom,q.layTo)+'</b></div>'
    +'<div class="hv-ts">'+L2("Calcul din stadiul botcilor ales mai sus (cea mai avansată botcă).","Calculated from the cell stage chosen above (most advanced cell).")+'</div>';
}
window.devUpd=function(){
  var b=document.getElementById("devBrood");if(b&&b.style.display!=="none")b.innerHTML=devBroodPreviewHTML();
  var q=document.getElementById("devQueen");if(q)q.innerHTML=devQueenPreviewHTML();
};

// ── New queen: status + confirmations from inspections ──
// Starts from the latest inspection with cells left to mature. Later inspections can confirm:
//   qEmerged – „A ieșit din botcă”  → later periods are recalculated from the confirmation date
//   qMated   – „E împerecheată” (or „Ouă depuse” ticked after emerging) → tracking ends
// Returns null if there's nothing to track on the given date.
function devQueenState(hid,refDate,excludeInspId){
  var insps=hvInsps(hid).filter(function(i){return i.id!==excludeInspId;});
  var iq=insps.find(function(i){return i.botci&&i.botciAction;});
  // nuc: the queen is raised from frames given when the nuc was made (nucs.js)
  var nq=typeof nucQueenIQ==="function"?nucQueenIQ(hid):null;
  if(nq&&(!iq||iq.date<nq.date))iq=nq;
  if(!iq||iq.botciAction!=="keep")return null;
  var q=devQueen(iq.date,iq.botciS||"mixt");
  var later=insps.filter(function(i){return i.date>iq.date;}).sort(function(a,b){return a.date<b.date?-1:1;});
  var em=later.find(function(i){return i.qEmerged;});
  var mated=later.find(function(i){return i.qMated||(i.eggs&&i.date>=q.emFrom);});
  if(mated)return null;
  var emergedOn=em?em.date:null;
  if(emergedOn){
    var e=emergedOn<q.emTo?emergedOn:q.emTo;
    q.matTo=devAdd(e,DEV.queen.mating[1]);q.layTo=devAdd(e,DEV.queen.layEnd);
    if(q.matFrom>q.matTo)q.matFrom=devAdd(e,DEV.queen.mating[0]);
  }
  if(refDate>devAdd(q.layTo,7))return null;   // too old
  var phase=!emergedOn&&refDate<q.emFrom?"before":!emergedOn&&refDate<=q.emTo?"emerge":refDate<=q.matTo?"mating":"laying";
  return{iq:iq,q:q,emergedOn:emergedOn,phase:phase};
}
function devPhaseTitle(ph){
  return{before:L2("urmează ieșirea din botcă","emergence coming up"),emerge:L2("în perioada de ieșire din botcă","in the emergence period"),
    mating:L2("în perioada de împerechere","in the mating period"),laying:L2("verifică ponta","check for eggs")}[ph];
}
function devQueenPeriodsHTML(qs){
  var q=qs.q,ph=qs.phase,mk=function(p){return ph===p?"▶ ":"";};
  return mk("emerge")+L2("Ieșire din botcă","Emergence")+': '+(qs.emergedOn?'✅ '+devFmt(qs.emergedOn):'~'+devRange(q.emFrom,q.emTo))
    +'<br>'+mk("mating")+L2("Împerechere","Mating")+': ~'+devRange(q.matFrom,q.matTo)
    +'<br>'+mk("laying")+L2("Pontă","Laying")+': ~'+devRange(q.layFrom,q.layTo);
}
function devQueenRow(h,qs,today){
  var late=qs.phase==="laying"&&today>qs.q.layTo;
  return hvStRow(late?"warn":qs.phase==="laying"?"warn":"info","👑",
    L2("Regină nouă","New queen")+' · '+(late?L2("nicio pontă confirmată","no eggs confirmed yet"):devPhaseTitle(qs.phase)),
    devQueenPeriodsHTML(qs),"inspM('"+h.id+"')");
}

// ── Inspection: new queen confirmation (shown only while the hive awaits a new queen) ──
function devQueenInspHTML(hid,ex){
  var date=ex?ex.date:vrToday();
  var qs=devQueenState(hid,date,ex?ex.id:null);
  if(!qs&&!(ex&&(ex.qEmerged||ex.qMated)))return"";
  var cur=hqCurrent(hid);
  return'<div class="dv"><div class="stt">👑 '+L2("Regina nouă","New queen")+'</div></div>'
    +(qs?'<div class="tv-insp-tr">'+cap(qs.iq.nuc?L2("din roiul făcut pe","from the nuc made on"):L2("din botcile lăsate pe","from the cells left on"))+' '+devFmt(qs.iq.date)+'<br><span class="hv-ts">'+devQueenPeriodsHTML(qs)+'</span></div>':'')
    +(qs&&qs.emergedOn&&!(ex&&ex.qEmerged)
      ?'<div class="ck" style="color:var(--ok);">✅ '+L2("A ieșit din botcă — confirmat pe","Emerged — confirmed on")+' '+devFmt(qs.emergedOn)+'</div>'
      :'<div class="ck"><input type="checkbox" id="iQEm"'+(ex&&ex.qEmerged?" checked":"")+'><label for="iQEm">🐣 '+L2("A ieșit din botcă (botci deschise / regină virgină văzută)","Emerged (cells opened / virgin queen seen)")+'</label></div>')
    +'<div class="ck"><input type="checkbox" id="iQMt"'+(ex&&ex.qMated?" checked":"")+' onchange="var r=document.getElementById(\'iQRepW\');if(r)r.style.display=this.checked?\'flex\':\'none\'"><label for="iQMt">💞 '+L2("E împerecheată (pontă / ouă văzute)","Mated (eggs / laying seen)")+'</label></div>'
    +(!(ex&&ex.qMated)?'<div class="ck" id="iQRepW" style="display:none;margin-left:22px;"><input type="checkbox" id="iQRep" checked><label for="iQRep">🔄 '+L2("Trec regina nouă ca regina stupului","Set the new queen as the hive's queen")+(cur?' <span class="hv-dim">('+L2("cea veche","old one")+': '+esc(cur.race||"—")+(cur.yr?' '+cur.yr:'')+' → '+L2("înlocuită","replaced")+')</span>':'')+'</label></div>':'');
}
// On save: the new queen becomes the hive's queen (if ticked)
function devQueenInspSave(o){
  if(!o.qMated||!$q("iQRep")||!$q("iQRep").checked)return;
  if(!D.queens)D.queens=[];
  var cur=hqCurrent(o.hiveId);
  if(cur){cur.status="înlocuită";cur.replacedAt=o.date;}
  var origins=t("q_origins")||[];
  // nuc: queen comes from the donor's line; hive: raised in the hive → same line
  var hv=D.hives.find(function(h){return h.id===o.hiveId;}),isN=hv&&hv.kind==="roi"&&hv.genParent;
  var dq=isN?hqCurrent(hv.genParent):null,src=cur||dq;
  // mother: for a nuc = donor's queen (on the nuc's day); in hive = previous queen (natural supersedure)
  var mq=isN?((hv.nuc&&hv.nuc.motherQ)||(dq?dq.id:null)):(cur?cur.id:null);
  D.queens.push({id:uid(),hive:o.hiveId,yr:parseInt((o.date||"").slice(0,4))||new Date().getFullYear(),from:o.date,
    race:src?src.race:"",lay:null,aggr:null,orig:isN?(origins[1]||""):(origins[5]||origins[1]||""),origHive:isN?hv.genParent:o.hiveId,line:src?src.line:"",status:"activă",motherQ:mq,motherSet:true});
}

// ── Rows on the hive card (only while valid) ──
function devHiveRows(h){
  var today=vrToday(),rows=[];
  var insps=hvInsps(h.id);   // descending by date
  // New bees: latest inspection with the calculation ticked
  var ib=insps.find(function(i){return i.calcBrood;});
  if(ib){
    var w=devWorker(ib.date,{egg:ib.eggs,larva:ib.larvae,capped:ib.capped});
    if(w&&w.to>=today){
      var going=w.from<=today;
      rows.push(hvStRow("ok","🐝",L2("Albine noi","New bees")+' · '+(going?L2("ies până pe","emerging until")+' '+devFmt(w.to):devRange(w.from,w.to)),
        '🐝 '+L2("culegătoare","foragers")+' ~ '+devFmt(w.foragers)+' · '+L2("din inspecția din","from the inspection of")+' '+devFmt(ib.date),
        "hvInspOpenOne('"+h.id+"','"+ib.id+"')"));
    }
  }
  // Queen cells: latest inspection with cells and a decision (keep / removed)
  var iq=insps.find(function(i){return i.botci&&i.botciAction;});
  if(iq&&iq.botciAction==="removed"){
    {
      var rc=devAdd(iq.date,DEV.recheckRemoved),last=devAdd(iq.date,DEV.capDeadline);
      // disappears when you do a new inspection after removal, or after the deadline
      var checked=insps.some(function(i){return i.date>iq.date;});
      if(!checked&&last>=today){
        var late=today>rc;
        rows.push(hvStRow(today>=rc?"warn":"mut","✂️",L2("Verifică botcile","Check queen cells")+' · '+(today===rc?L2("azi","today"):late?L2("ai depășit","overdue"):L2("până pe","by")+' '+devFmt(rc)),
          late?L2("ultimul termen înainte de căpăcire:","last deadline before capping:")+' '+devFmt(last)
              :L2("înainte ca larvele să fie hrănite ca regine","before larvae are fed to become queens")+' · '+L2("eliminate pe","removed on")+' '+devFmt(iq.date),
          "inspM('"+h.id+"')"));
      }
    }
  }
  // New queen from kept cells: approximate periods + current stage
  var qs=devQueenState(h.id,today);
  if(qs)rows.push(devQueenRow(h,qs,today));
  return rows;
}
// Opens the hive's inspection history with that inspection expanded
window.hvInspOpenOne=function(hid,iid){
  _hvInspOpen[hid]=true;_hvInspDetail[iid]=true;
  var el=document.getElementById("hvI_"+hid);
  if(el){el.style.display="block";var a=document.getElementById("hvIA_"+hid);if(a)a.textContent="▲";
    var d=document.getElementById("hvID_"+iid);if(d){d.style.display="block";d.scrollIntoView({behavior:"smooth",block:"center"});}}
};
