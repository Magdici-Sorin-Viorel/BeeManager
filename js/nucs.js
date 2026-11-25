// BeeManager Pro — nucs.js
// 🐝 Nucs (colony splitting) + 🌳 Genealogy
//
// NUC = a hive with kind:"roi" (shown on the Hives page, 🐝 Roiuri section, with a smaller card).
//   nuc: {start, found, max (box frames), stage:{egg,larva,capped,cell}, cellStage, queenIn, taken:{donor,fB,fH}}
//   parentId  = box the frames came from (the donor)
//   genParent = initial genetic parent (the donor; empty for a found swarm)
//   On create: frames taken (brood + food) are deducted from the donor (taken — restored on edit).
//   New queen: periods computed from the chosen stage (eggs / larvae / cell) — see nucQueenIQ + devcalc.js.
//   When inspection confirms a mated queen → „Roiul devine stup?” (promotedAt). Also a manual button.
//   ❌ Failed nuc / 🔗 merged → moved to D.hivesArchive (stays in genealogy as a closed branch).
//
// GENEALOGY (🌳 Genealogie menu): the genetic line follows the QUEEN:
//   bought / imported queen → new line (root) · found / natural swarm → unknown origin (root)
//   queen from own nuc with a source hive → child of that hive · raised in hive → same line
//   Inspection stats: average aggressiveness, swarming tendency (% inspections with cells), honey
//   (peak capped frames in supers per year → average over years, vs. best hive = 100%).
//   ⛔ Stop the branch: hive.lineStop = date (no more nucs from it; shown when picking a donor).

// Periods for a nuc-raised queen (days from making the nuc until the queen emerges)
DEV.queen.roi_oua=[12,16];     // bees pick young larvae from the given eggs
DEV.queen.roi_larve=[10,13];   // young larvae (≤ 3 days)

function hvIsNuc(h){return !!h&&h.kind==="roi";}
function genAll(){return D.hives.concat(D.hivesArchive||[]);}
function genFind(id){return id?genAll().find(function(h){return h.id===id;}):null;}
function nucToday(){return todayISO();}
function qOrigIdx(o){
  o=(o||"").toLowerCase();
  if(/schimbare|replacement|supersed/.test(o))return 5;
  if(/cump|purch|bought/.test(o))return 0;
  if(/import/.test(o))return 3;
  if(/natural/.test(o))return 4;
  if(/local/.test(o))return 2;
  if(/roi|swarm/.test(o))return 1;
  return -1;
}

// Nuc queen: pseudo-inspection "cells left" from the day the nuc was made (used by devQueenState)
function nucQueenIQ(hid){
  var h=BM.stupi.get(hid);
  if(!hvIsNuc(h)||!h.nuc||(h.nuc.found&&h.nuc.queenIn))return null;
  var s=h.nuc.stage||{},st=s.cell?(h.nuc.cellStage||"mixt"):s.larva?"roi_larve":s.egg?"roi_oua":null;
  if(!st)return null;
  return{id:"nuc_"+hid,date:h.nuc.start,botci:true,botciAction:"keep",botciS:st,nuc:true};
}
function nucNoQueenSrc(h){var s=(h.nuc&&h.nuc.stage)||{};return hvIsNuc(h)&&!(h.nuc&&h.nuc.found)&&!s.egg&&!s.larva&&!s.cell;}

// ═══════════════════════════════════════════
// NUC FORM
// ═══════════════════════════════════════════
function nucDonorOpts(sel,exclude){
  return D.hives.filter(function(h){return h.id!==exclude;}).map(function(h){
    var stop=genStoppedAt(h);
    return'<option value="'+h.id+'"'+(sel===h.id?" selected":"")+'>'+(hvIsNuc(h)?"🐝 ":"🏠 ")+esc(h.name)+(function(){var q=hqCurrent(h.id);if(!q)return"";var c=qCode(q);return" · "+c.code+" G"+c.gen;})()+' — '+(h.fB||0)+' '+L2("puiet","brood")+' / '+(h.fH||0)+' '+L2("mâncare","food")+(stop?' ⛔':'')+'</option>';
  }).join("");
}
window.nucM=function(id,donorId){
  var h=id?BM.stupi.get(id):null,n=(h&&h.nuc)||{};
  var found=!!n.found,st=n.stage||{};
  var don=h?(n.taken&&n.taken.donor)||h.parentId:(donorId||"");
  var nextN=D.hives.reduce(function(m,x){return Math.max(m,parseInt(x.num)||0);},0)+1;
  var nucN=genAll().filter(hvIsNucEver).length+1;
  var bt=t("bt")||[];
  openM('<div class="mt">🐝 '+(h?L2("Editează roiul","Edit nuc"):L2("Roi nou","New nuc"))+'</div>'
    +'<div class="dev-act nuc-org">'
    +'<label><input type="radio" name="nOrg" value="donor" onchange="nucOrgChg()"'+(!found?" checked":"")+'> 🏠 '+L2("Făcut din stup donator","Made from a donor hive")+'</label>'
    +'<label><input type="radio" name="nOrg" value="found" onchange="nucOrgChg()"'+(found?" checked":"")+'> 🌳 '+L2("Roi găsit / prins (origine necunoscută)","Found / caught swarm (unknown origin)")+'</label></div>'
    +'<div class="r2"><div>'+L(t("h_num"))+'<input id="nNum" type="number" inputmode="numeric" value="'+esc(h?h.num||"":nextN)+'"></div>'
    +'<div>'+L(t("h_name_l"))+'<input id="nNm" value="'+esc(h?h.name:L2("Roi","Nuc")+" #"+nucN)+'"></div></div>'
    +'<div class="r2"><div>'+L(L2("📅 Început pe","📅 Started on"))+'<input type="date" id="nDt" value="'+esc(n.start||nucToday())+'" onchange="nucPrev()"></div>'
    +'<div>'+L(L2("📦 Cutia are (rame)","📦 Box holds (frames)"))+'<input type="number" inputmode="numeric" id="nMax" min="2" max="12" value="'+esc(n.max||6)+'"></div></div>'
    +'<div id="nDonW" style="display:'+(found?"none":"block")+'">'
    +L(L2("🏠 Stupul donator","🏠 Donor hive"))+'<select id="nDon" onchange="nucPrev()"><option value="">—</option>'+nucDonorOpts(don,id)+'</select>'
    +'</div>'
    +'<div class="r2"><div>'+L('<span id="nFBl">'+(found?L2("🟤 Rame cu puiet","🟤 Brood frames"):L2("🟤 Rame puiet luate","🟤 Brood frames taken"))+'</span>')+'<input type="number" inputmode="numeric" min="0" id="nFB" value="'+esc(h?(n.fB0!=null?n.fB0:(n.taken?n.taken.fB:h.fB)):2)+'" oninput="nucPrev()"></div>'
    +'<div>'+L('<span id="nFHl">'+(found?L2("🍯 Rame mâncare","🍯 Food frames"):L2("🍯 Rame mâncare luate","🍯 Food frames taken"))+'</span>')+'<input type="number" inputmode="numeric" min="0" id="nFH" value="'+esc(h?(n.fH0!=null?n.fH0:(n.taken?n.taken.fH:h.fH)):1)+'" oninput="nucPrev()"></div></div>'
    +'<div id="nDonInfo" class="nuc-info"></div>'
    +'<div id="nStW" style="display:'+(found?"none":"block")+'">'
    +L(L2("🥚 Ce e pe ramele de puiet?","🥚 What is on the brood frames?"))
    +'<div class="nuc-st">'
    +'<label><input type="checkbox" id="nEg" onchange="nucPrev()"'+(st.egg?" checked":"")+'> 🥚 '+L2("Ouă","Eggs")+'</label>'
    +'<label><input type="checkbox" id="nLv" onchange="nucPrev()"'+(st.larva?" checked":"")+'> 🐛 '+L2("Larve","Larvae")+'</label>'
    +'<label><input type="checkbox" id="nCp" onchange="nucPrev()"'+(st.capped?" checked":"")+'> 🟤 '+L2("Căpăcit","Capped")+'</label>'
    +'<label><input type="checkbox" id="nBc" onchange="document.getElementById(\'nBcW\').style.display=this.checked?\'block\':\'none\';nucPrev()"'+(st.cell?" checked":"")+'> 👑 '+L2("Cu botcă","With a queen cell")+'</label>'
    +'</div>'
    +'<div id="nBcW" style="display:'+(st.cell?"block":"none")+'">'+L(L2("Stadiul botcii","Queen cell stage"))+'<select id="nBcS" onchange="nucPrev()">'+bt.map(function(a){return'<option value="'+a[0]+'"'+((n.cellStage||"capacite")===a[0]?" selected":"")+'>'+a[1]+'</option>';}).join("")+'</select></div>'
    +'</div>'
    +'<div id="nQW" style="display:'+(found?"block":"none")+'"><div class="ck"><input type="checkbox" id="nQ"'+(!h||n.queenIn?" checked":"")+'><label for="nQ">👑 '+L2("Are regină (roi natural)","Has a queen (natural swarm)")+'</label></div></div>'
    +'<div id="nPrev" class="dev-box"></div>'
    +L(t("h_loc"))+'<input id="nLc" value="'+esc(h?h.loc||"":"")+'">'
    +L(t("insp_notes"))+'<textarea id="nNt" rows="2">'+esc(h?h.notes||"":"")+'</textarea>'
    +'<div class="br" style="margin-top:14px;"><button class="btn" onclick="nucSave(\''+(id||"")+'\')">🐝 '+btnS()+'</button><button class="btn gh" onclick="closeM()">'+btnC()+'</button></div>');
  var mb=document.getElementById("MB");if(mb)mb.dataset.nucId=id||"";
  nucPrev();
};
function hvIsNucEver(h){return hvIsNuc(h)||!!h.nuc;}
window.nucOrgChg=function(){
  var f=(document.querySelector("input[name='nOrg']:checked")||{}).value==="found";
  ["nDonW","nStW"].forEach(function(k){var e=document.getElementById(k);if(e)e.style.display=f?"none":"block";});
  var q=document.getElementById("nQW");if(q)q.style.display=f?"block":"none";
  var a=document.getElementById("nFBl");if(a)a.textContent=f?L2("🟤 Rame cu puiet","🟤 Brood frames"):L2("🟤 Rame puiet luate","🟤 Brood frames taken");
  var b=document.getElementById("nFHl");if(b)b.textContent=f?L2("🍯 Rame mâncare","🍯 Food frames"):L2("🍯 Rame mâncare luate","🍯 Food frames taken");
  nucPrev();
};
window.nucPrev=function(){
  var f=(document.querySelector("input[name='nOrg']:checked")||{}).value==="found";
  var fb=parseInt(($q("nFB")||{}).value)||0,fh=parseInt(($q("nFH")||{}).value)||0,max=parseInt(($q("nMax")||{}).value)||6;
  var info=document.getElementById("nDonInfo"),pv=document.getElementById("nPrev");
  var mb=document.getElementById("MB"),editId=mb?mb.dataset.nucId:"";
  if(info){
    var tx="";
    if(fb+fh>max)tx+='<div class="nuc-warn">⚠️ '+L2("Mai multe rame decât încap în cutie","More frames than the box holds")+' ('+(fb+fh)+' / '+max+')</div>';
    if(!f){
      var d=BM.stupi.get(($q("nDon")||{}).value);
      if(d){
        var ex=editId?BM.stupi.get(editId):null,tk=ex&&ex.nuc&&ex.nuc.taken&&ex.nuc.taken.donor===d.id?ex.nuc.taken:{fB:0,fH:0};
        var b0=(d.fB||0)+(tk.fB||0),h0=(d.fH||0)+(tk.fH||0);
        if(mb&&mb.dataset.fromInsp){   // frames already taken out in the donor's inspection → its numbers are already the remaining ones
          tx+='<div>🏠 '+esc(d.name)+': '+L2("a rămas cu","is left with")+' <b>'+(d.fB||0)+'</b> '+L2("rame puiet","brood frames")+' · <b>'+(d.fH||0)+'</b> '+L2("mâncare","food")+'</div>';
        }else{
        tx+='<div>🏠 '+esc(d.name)+': '+L2("rămâne cu","is left with")+' <b>'+Math.max(0,b0-fb)+'</b> '+L2("rame puiet","brood frames")+' · <b>'+Math.max(0,h0-fh)+'</b> '+L2("mâncare","food")+' <span class="hv-dim">('+L2("avea","had")+' '+b0+' / '+h0+')</span></div>';
        if(fb>b0)tx+='<div class="nuc-warn">⚠️ '+L2("Donatorul nu are atâtea rame de puiet","The donor doesn't have that many brood frames")+'</div>';
        }
        var stop=genStoppedAt(d);if(stop)tx+='<div class="nuc-warn">⛔ '+L2("Ramura acestui stup e oprită din","This hive's branch was stopped on")+' '+stop+'</div>';
      }
    }
    info.innerHTML=tx;info.style.display=tx?"block":"none";
  }
  if(pv){
    var date=($q("nDt")||{}).value||nucToday(),html="";
    if(f){html=$q("nQ")&&!$q("nQ").checked?'<div class="dev-row">⚠️ '+L2("Fără regină: dă-i o ramă cu ouă sau o botcă.","No queen: give it a frame with eggs or a cell.")+'</div>':'<div class="dev-row">👑 '+L2("Roi natural cu regină — urmărești dezvoltarea din inspecții.","Natural swarm with a queen — follow it in inspections.")+'</div>';}
    else{
      var cell=$q("nBc")&&$q("nBc").checked,lv=$q("nLv")&&$q("nLv").checked,eg=$q("nEg")&&$q("nEg").checked,cp=$q("nCp")&&$q("nCp").checked;
      var stg=cell?(($q("nBcS")||{}).value||"mixt"):lv?"roi_larve":eg?"roi_oua":null;
      if(stg){var q=devQueen(date,stg);
        html+='<div class="dev-row">👑 '+L2("Regina iese:","Queen emerges:")+' <b>'+devRange(q.emFrom,q.emTo)+'</b></div>'
          +'<div class="dev-row">💞 '+L2("Împerechere:","Mating:")+' <b>'+devRange(q.matFrom,q.matTo)+'</b></div>'
          +'<div class="dev-row">🥚 '+L2("Verifică ponta:","Check for eggs:")+' <b>'+devRange(q.layFrom,q.layTo)+'</b></div>';}
      else html+='<div class="dev-row nuc-warn">⚠️ '+L2("Fără ouă, larve tinere sau botcă roiul nu poate crește regină.","Without eggs, young larvae or a cell the nuc can't raise a queen.")+'</div>';
      var w=devWorker(date,{egg:eg,larva:lv,capped:cp});
      if(w)html+='<div class="dev-row">🐝 '+L2("Albine noi:","New bees:")+' <b>'+devRange(w.from,w.to)+'</b></div>';
    }
    pv.innerHTML=html;
  }
};
window.nucSave=function(id){
  var h=id?BM.stupi.get(id):null;
  var f=(document.querySelector("input[name='nOrg']:checked")||{}).value==="found";
  var nm=(($q("nNm")||{}).value||"").trim();if(!nm){toast("⚠️ "+L2("Scrie un nume","Enter a name"));return;}
  var don=f?null:(($q("nDon")||{}).value||null);
  if(!f&&!don){toast("⚠️ "+L2("Alege stupul donator","Choose the donor hive"));return;}
  var fb=Math.max(0,parseInt(($q("nFB")||{}).value)||0),fh=Math.max(0,parseInt(($q("nFH")||{}).value)||0);
  var mbN=document.getElementById("MB"),fromInsp=!h&&mbN&&mbN.dataset.fromInsp?mbN.dataset.fromInsp:null;
  if(!don&&fromInsp&&_mvNuc)don=_mvNuc.donor;   // donor select is locked (disabled) when coming from an inspection
  var inInsp=fromInsp||(h&&h.nuc&&h.nuc.taken&&h.nuc.taken.inInsp)||null;   // frames already out in the donor's inspection → never deducted here
  // frames taken: first restore last time's (when editing), then deduct the new ones
  if(!inInsp&&h&&h.nuc&&h.nuc.taken){var od=BM.stupi.get(h.nuc.taken.donor);
    if(od){od.fB=(od.fB||0)+(h.nuc.taken.fB||0);od.fH=(od.fH||0)+(h.nuc.taken.fH||0);od.fT=hvTotal(od);od.str=strCalc(od.fB);}}
  var taken=null;
  if(don&&inInsp)taken={donor:don,fB:fb,fH:fh,inInsp:inInsp};
  else if(don){var d=BM.stupi.get(don);
    if(d){var tb=Math.min(fb,d.fB||0),th=Math.min(fh,d.fH||0);d.fB=(d.fB||0)-tb;d.fH=(d.fH||0)-th;d.fT=hvTotal(d);d.str=strCalc(d.fB,d.fH);taken={donor:don,fB:tb,fH:th};}}
  var max=parseInt(($q("nMax")||{}).value)||6;
  var nuc={start:($q("nDt")||{}).value||nucToday(),found:f,max:max,
    stage:f?{}:{egg:!!($q("nEg")||{}).checked,larva:!!($q("nLv")||{}).checked,capped:!!($q("nCp")||{}).checked,cell:!!($q("nBc")||{}).checked},
    cellStage:($q("nBc")&&$q("nBc").checked)?(($q("nBcS")||{}).value||"mixt"):null,
    queenIn:f?!!($q("nQ")||{}).checked:false,taken:taken,
    fB0:fb,fH0:fh,   // frames the nuc was made with (shown in the form)
    // queen whose eggs are being raised: the donor's queen on the day the nuc was made (kept on edit)
    motherQ:don?((h&&h.nuc&&h.nuc.motherQ&&h.nuc.taken&&h.nuc.taken.donor===don)?h.nuc.motherQ:(function(){var m=qAt(don,($q("nDt")||{}).value||nucToday());return m?m.id:null;})()):null};
  // on edit the nuc keeps what inspections recorded since; only the change in frames given is applied
  var prevB=h&&h.nuc?(h.nuc.fB0!=null?h.nuc.fB0:(h.nuc.taken?h.nuc.taken.fB:h.fB)):0,prevH=h&&h.nuc?(h.nuc.fH0!=null?h.nuc.fH0:(h.nuc.taken?h.nuc.taken.fH:h.fH)):0;
  var nfB=h?Math.max(0,(parseInt(h.fB)||0)+fb-prevB):fb,nfH=h?Math.max(0,(parseInt(h.fH)||0)+fh-prevH):fh;
  var o=h||{id:uid(),kind:"roi",mat:"Lemn",sc:"green",magCount:0,hasMag:false,magF:0};
  Object.assign(o,{num:parseInt(($q("nNum")||{}).value)||null,name:nm,loc:($q("nLc")||{}).value||"",notes:($q("nNt")||{}).value||"",
    mod:L2("Cutie roi","Nuc box")+" "+max+" "+L2("rame","frames"),fB:nfB,fH:nfH,parentId:don,genParent:don,nuc:nuc});
  o.fT=hvTotal(o);o.str=strCalc(nfB);
  if(!h&&fromInsp&&_mvNuc&&_mvNuc.pl)o.plastic=_mvNuc.pl;   // ⬢ plastic frames that went into the nuc
  if(!h){D.hives.push(o);
    // note it on the donor's record (inspection of the day / automatic transfer entry) — see frames.js
    if(taken&&typeof mvNucSaved==="function")mvNucSaved(o,fromInsp,taken.fB,taken.fH,nuc.start);}
  _mvNuc=null;
  // found swarm with queen → the queen (natural origin); the line starts here
  if(!D.queens)D.queens=[];
  if(f&&nuc.queenIn&&!hqCurrent(o.id))D.queens.push({id:uid(),hive:o.id,yr:parseInt(nuc.start.slice(0,4))||null,from:nuc.start,motherQ:null,motherSet:true,race:"",lay:null,aggr:null,orig:(t("q_origins")||[])[4]||"Natural (roi)",origHive:null,line:"",status:"activă"});
  if(typeof _hvTab!=="undefined"){_hvTab="nucs";_hvNucStay=true;}   // show the 🐝 Roiuri tab
  save();closeM();render();toast(L2("Roi salvat","Nuc saved"),"🐝");
};

// ═══════════════════════════════════════════
// NUC → HIVE  /  FAILED NUC
// ═══════════════════════════════════════════
window.nucPromoteM=function(id,fromInsp){
  var h=BM.stupi.get(id);if(!hvIsNuc(h))return;
  var mods=t("mod_opts")||[];
  openM('<div class="mt">⬆️ '+L2("Roiul devine stup","The nuc becomes a hive")+'</div>'
    +(fromInsp?'<div class="al ali" style="margin-bottom:10px;">💞 '+L2("Ai confirmat că regina e împerecheată. Trec","You confirmed the queen is mated. Move")+' <b>'+esc(h.name)+'</b> '+L2("la stupi?","to hives?")+'</div>':'')
    +'<div class="r2"><div>'+L(t("h_num"))+'<input id="npNum" type="number" inputmode="numeric" value="'+esc(h.num||"")+'"></div>'
    +'<div>'+L(t("h_name_l"))+'<input id="npNm" value="'+esc(h.name)+'"></div></div>'
    +'<div class="r2"><div>'+L(t("h_mod"))+'<select id="npMd">'+mods.map(function(o){return'<option>'+o+'</option>';}).join("")+'<option selected>'+esc(h.mod||"")+'</option></select></div>'
    +'<div>'+L(L2("📅 Data","📅 Date"))+'<input type="date" id="npDt" value="'+nucToday()+'"></div></div>'
    +'<div class="hv-ts">'+(h.genParent?'🧬 '+L2("Rămâne în linia lui","Stays in the line of")+' '+esc((genFind(h.genParent)||{}).name||"—")+'. '+L2("Dacă îi pui o regină cumpărată, schimb-o din ✏️ Editează → Regina (origine: Cumpărată) și pornește o linie nouă.","If you give it a purchased queen, change it in ✏️ Edit → Queen (origin: Purchased) and a new line starts."):'')+'</div>'
    +'<div class="br" style="margin-top:14px;"><button class="btn" onclick="nucPromoteSave(\''+id+'\')">⬆️ '+L2("Devine stup","Make it a hive")+'</button><button class="btn gh" onclick="closeM()">'+(fromInsp?L2("Mai târziu","Later"):btnC())+'</button></div>');
};
window.nucPromoteSave=function(id){
  var h=BM.stupi.get(id);if(!h)return;
  var d=($q("npDt")||{}).value||nucToday();
  h.name=(($q("npNm")||{}).value||h.name).trim();h.num=parseInt(($q("npNum")||{}).value)||h.num;h.mod=($q("npMd")||{}).value||h.mod;
  delete h.kind;h.promotedAt=d;
  if(!D.queens)D.queens=[];
  if(!hqCurrent(h.id)){var dq=h.genParent?hqCurrent(h.genParent):null;
    D.queens.push({id:uid(),hive:h.id,yr:parseInt(d.slice(0,4))||null,from:d,race:dq?dq.race:"",lay:null,aggr:null,orig:(t("q_origins")||[])[1]||"",origHive:h.genParent||null,line:dq?dq.line:"",status:"activă",
      motherQ:(h.nuc&&h.nuc.motherQ)||(dq?dq.id:null),motherSet:true});}
  if(typeof _hvTab!=="undefined")_hvTab="hives";
  save();closeM();render();toast(L2("Roiul a devenit stup","The nuc is now a hive"),"⬆️");
};
window.nucFailM=function(id){
  var h=BM.stupi.get(id);if(!h)return;
  openM('<div class="mt">❌ '+L2("Închide roiul","Close the nuc")+' — '+esc(h.name)+'</div>'
    +'<div class="dev-act">'
    +'<label><input type="radio" name="nfR" value="esuat" checked onchange="document.getElementById(\'nfIW\').style.display=\'none\'"> ❌ '+L2("Eșuat (regina nu s-a împerecheat / s-a pierdut)","Failed (queen not mated / lost)")+'</label>'
    +'<label><input type="radio" name="nfR" value="unit" onchange="document.getElementById(\'nfIW\').style.display=\'block\'"> 🔗 '+L2("Unit cu alt stup","Merged into another hive")+'</label></div>'
    +'<div id="nfIW" style="display:none">'+L(L2("🏠 Unit cu","🏠 Merged into"))+'<select id="nfI">'+D.hives.filter(function(x){return x.id!==id;}).map(function(x){return'<option value="'+x.id+'"'+(x.id===h.parentId?" selected":"")+'>'+esc(x.name)+'</option>';}).join("")+'</select>'
    +'<div class="hv-ts">'+L2("Ramele roiului se adaugă la stupul ales.","The nuc's frames are added to the chosen hive.")+'</div></div>'
    +'<div class="r2"><div>'+L(L2("📅 Data","📅 Date"))+'<input type="date" id="nfD" value="'+nucToday()+'"></div><div>'+L(t("insp_notes"))+'<input id="nfN"></div></div>'
    +'<div class="hv-ts">'+L2("Roiul dispare din Stupi, dar rămâne în 🌳 Genealogie ca ramură închisă (cu inspecțiile lui).","The nuc leaves Hives but stays in 🌳 Genealogy as a closed branch (with its inspections).")+'</div>'
    +'<div class="br" style="margin-top:14px;"><button class="btn bd" onclick="nucFailSave(\''+id+'\')">❌ '+L2("Închide roiul","Close nuc")+'</button><button class="btn gh" onclick="closeM()">'+btnC()+'</button></div>');
};
window.nucFailSave=function(id){
  var h=BM.stupi.get(id);if(!h)return;
  var r=(document.querySelector("input[name='nfR']:checked")||{}).value||"esuat",into=r==="unit"?(($q("nfI")||{}).value||null):null;
  if(into){var t2=BM.stupi.get(into);if(t2){t2.fB=(t2.fB||0)+(h.fB||0);t2.fH=(t2.fH||0)+(h.fH||0);t2.fT=hvTotal(t2);t2.str=strCalc(t2.fB);}}
  if(!D.hivesArchive)D.hivesArchive=[];
  D.hivesArchive.push(Object.assign({},h,{closed:{date:($q("nfD")||{}).value||nucToday(),reason:r,into:into,note:($q("nfN")||{}).value||""}}));
  D.hives=D.hives.filter(function(x){return x.id!==id;});
  save();closeM();render();toast(r==="unit"?L2("Roi unit","Nuc merged"):L2("Roi închis","Nuc closed"),"🐝");
};
// On hive delete: a trace stays in genealogy (name + links) so the tree does not break
function genArchiveStub(h){
  if(!h)return;
  var has=!!h.genParent||genAll().some(function(x){return x.genParent===h.id||x.parentId===h.id;})||(D.queens||[]).some(function(q){return q.origHive===h.id;});
  if(!has)return;
  if(!D.hivesArchive)D.hivesArchive=[];
  D.hivesArchive.push({id:h.id,num:h.num,name:h.name,kind:h.kind,nuc:h.nuc,parentId:h.parentId||null,genParent:h.genParent||null,promotedAt:h.promotedAt||null,lineStop:h.lineStop||null,
    genRoot:genParentOf(h),closed:{date:nucToday(),reason:"sters"}});
}

// ═══════════════════════════════════════════
// NUC CARD (Hives page)
// ═══════════════════════════════════════════
function nucIconHTML(h){
  var max=(h.nuc&&h.nuc.max)||6,b=Math.min(max,parseInt(h.fB)||0),f=Math.min(max-b,parseInt(h.fH)||0),fr="";
  for(var i=0;i<max;i++)fr+='<i class="'+(i<b?"b":i<b+f?"f":"e")+'"></i>';
  return'<div class="nuc-ico" title="'+(b+f)+' / '+max+'"><i class="lid"></i><div class="box">'+fr+'</div></div>';
}
function nucCardHTML(h){
  var n=h.nuc||{},insps=hvInsps(h.id),max=n.max||6,b=parseInt(h.fB)||0,f=parseInt(h.fH)||0;
  var don=genFind(h.parentId),q=hqCurrent(h.id),days=hvDaysSince(n.start||nucToday());
  var origin=n.found?'🌳 '+L2("Roi găsit · origine necunoscută","Found swarm · unknown origin")
    :'🧬 '+L2("din","from")+' <b>'+esc(don?don.name:"—")+'</b>'+(function(){var mq=qFind(n.motherQ)||(don?hqCurrent(don.id):null);if(!mq)return"";var c=qCode(mq);return' · <span class="qc-tag">'+esc(c.code)+' <b>G'+(c.gen+1)+'</b></span>';})()+(n.taken?' <span class="hv-dim">('+n.taken.fB+' '+L2("puiet","brood")+' + '+n.taken.fH+' '+L2("mâncare","food")+')</span>':'');
  var qLine=q?'👑 '+esc(q.race||L2("Regină","Queen"))+(q.yr?' · '+q.yr:'')+(qOrigIdx(q.orig)===0||qOrigIdx(q.orig)===3?' <span class="bg gb">'+L2("cumpărată","purchased")+'</span>':''):'👑 '+L2("Regină în creștere","Queen being raised");
  var warn=nucNoQueenSrc(h)&&!q?hvStRow("bad","⚠️",L2("Nu poate crește regină","Can't raise a queen"),L2("Nu are ouă, larve tinere sau botcă — dă-i o ramă cu ouă.","No eggs, young larvae or cell — give it a frame with eggs."),"nucM('"+h.id+"')"):"";
  return'<div class="c hv-card nuc-card">'
    +'<div class="hv-sec hv-hd">'
    +'<span class="hv-num nuc-num">'+(h.num||"🐝")+'</span>'
    +'<div class="hv-hd-t"><div class="hv-name hv-name-e" role="button" onclick="nucM(\''+h.id+'\')" title="Editează">'+esc(h.name)+'<span class="hv-edit" aria-label="Editează">✏️</span> <span class="bg gy nuc-b">🐝 '+L2("Roi","Nuc")+'</span></div>'
    +'<div class="hv-meta">'+origin+'</div>'
    +'<div class="hv-q">'+qLine+'</div></div>'
    +'<div class="hv-hd-r">'+nucIconHTML(h)+'<span class="hv-ts">'+(b+f)+' / '+max+' '+L2("rame","frames")+'</span>'+(typeof hvPlBadge==="function"?hvPlBadge(h):'')+'</div>'
    +'</div>'
    +'<div class="nuc-meta">📅 '+L2("Început","Started")+' '+devFmt(n.start)+' · '+(days<=0?L2("azi","today"):days+' '+t("hv_days"))
    +' · 🟤 '+b+' '+L2("puiet","brood")+' · 🍯 '+f+' '+L2("mâncare","food")+(h.loc?' · 📍 '+esc(h.loc):'')+'</div>'
    +warn
    +hvStatusHTML(h)
    +hvInspSecHTML(h,insps)
    +'<div class="hv-sec hv-act">'
    +'<button class="btn hv-act-main" onclick="inspM(\''+h.id+'\')">🔍 '+t("hv_new_insp")+'</button>'
    +'<button class="hv-ib" onclick="nucPromoteM(\''+h.id+'\')" title="Devine stup" aria-label="Devine stup">⬆️</button>'
    +'<button class="hv-ib" onclick="vcOpen(\''+h.id+'\')" title="Inspecție vocală" aria-label="Inspecție vocală">🎙️</button>'
    +'<button class="hv-ib hv-del" onclick="nucFailM(\''+h.id+'\')" title="Roi eșuat / unit" aria-label="Roi eșuat / unit">❌</button>'
    +'</div></div>';
}

// ═══════════════════════════════════════════
// GENEALOGY
// ═══════════════════════════════════════════
function genStatusBadge(h){
  if(h.closed){var r=h.closed.reason;return'<span class="bg gr">'+(r==="unit"?"🔗 "+L2("unit","merged"):r==="sters"?"🗑️ "+L2("șters","deleted"):"❌ "+L2("eșuat","failed"))+' '+devFmt(h.closed.date)+'</span>';}
  return hvIsNuc(h)?'<span class="bg gy">🐝 '+L2("roi","nuc")+'</span>':'<span class="bg gg">🏠 '+L2("stup","hive")+'</span>';
}
// ── Genealogy v3: by QUEENS (hive numbers don't change) + score 1–100 per year ──
// Each queen is a node: the hive she lives in, the period (from → replacedAt), her mother.
//   bought / import / found swarm → new line · from nuc (eggs from another hive) → daughter of the donor's queen
//   natural replacement in hive → daughter of the previous queen in the same hive
// So: Hive #1 with Buckfast '24 makes nucs (the Buckfast line continues in them), and in '27 gets a
// bought Carnica → a new line starts in the same hive #1; the old history stays.
// (v1 / v2 = tree by hives; saved in the genealogie_v1 / genealogie_v2 archives)
var GEN_COLORS=["#e6b422","#4a9eff","#6fbf4c","#e07c4c","#b07cf0","#3fc1c9","#f06292","#a1887f"];
var _genLine="all",_genRankAll=false,_genCache=null,_genSort="score";
var _genTab="tree",_genHelp=false;   // Genealogie tabs: "tree" (arbore) · "rank" (clasament) · "lines" (liniile pe scurt)

function genShort(h){   // short label: #10 = hive, R3 = nuc (so Roi #1 isn't confused with Stupul #1)
  var nm=h.name||"?",m=/#\s*([0-9A-Za-z]+)/.exec(nm)||/^\s*roi\s+([0-9A-Za-z]+)/i.exec(nm)||/(\d+)/.exec(nm),isR=hvIsNucEver(h)&&/^\s*roi/i.test(nm);
  if(!m&&h.num)m=[0,String(h.num)];   // no number in the name → the hive number
  return m?(isR?"R":"#")+m[1]:nm.slice(0,7);}
function genScoreCls(s){return s==null?"na":s>=75?"hi":s>=50?"mid":"lo";}
function genScoreBadge(s){return'<span class="gs-b '+genScoreCls(s)+'">⭐ '+(s==null?"—":s)+'</span>';}
// Line chart: queen generations in columns
function genChartSVG(l,M){
  var W=58,H=38,GX=12,GY=7,TOP=20,rows=0,maxD=0,pos={};
  (function lay(n,d){maxD=Math.max(maxD,d);var ch=M.kids[n.id]||[];
    if(!ch.length){pos[n.id]={d:d,y:rows++};return pos[n.id].y;}
    var ys=ch.map(function(c){return lay(c,d+1);});pos[n.id]={d:d,y:(ys[0]+ys[ys.length-1])/2};return pos[n.id].y;})(l.r,0);
  var w=(maxD+1)*(W+GX)-GX+16,ht=TOP+rows*(H+GY)+4;
  var X=function(id){return 8+pos[id].d*(W+GX);},Y=function(id){return TOP+pos[id].y*(H+GY);};
  var s='<svg class="gen-svg" width="'+w+'" height="'+ht+'" viewBox="0 0 '+w+' '+ht+'" xmlns="http://www.w3.org/2000/svg">';
  for(var d=0;d<=maxD;d++)s+='<text x="'+(8+d*(W+GX)+W/2)+'" y="12" class="gen-gh" text-anchor="middle">'+"G"+d+'</text>';
  l.mem.forEach(function(n){(M.kids[n.id]||[]).forEach(function(c){
    var x1=X(n.id)+W,y1=Y(n.id)+H/2,x2=X(c.id),y2=Y(c.id)+H/2,mx=x1+GX/2;
    s+='<path d="M'+x1+' '+y1+' H'+mx+' V'+y2+' H'+x2+'" class="gen-ln'+(c.h.closed?" off":"")+'" style="stroke:'+l.color+'"/>';});});
  // each colony: just the hive number + score (▲/▼ = higher / lower than the mother's)
  l.mem.forEach(function(n){
    var q=n.q,off=!!n.h.closed,old=!n.pseudo&&!!qTo(q),stop=!n.pseudo&&genStoppedAtQ(q);
    var cls=off?"off":n.pseudo?"nuc":old?"old":"hv",sc=n.pseudo?null:(M.S[n.id]||{}).score;
    var ms=n.parent&&M.byId[n.parent]&&!M.byId[n.parent].pseudo?(M.S[n.parent]||{}).score:null;
    var tr=sc!=null&&ms!=null?(sc>ms+2?" ▲":sc<ms-2?" ▼":" ="):"";
    var l2=off?(n.h.closed.reason==="unit"?"🔗":"✕"):n.pseudo?"🐝":"⭐"+(sc==null?"—":sc)+tr;
    s+='<g class="gen-nd '+cls+(stop?" stop":"")+'" onclick="genCard(\''+n.id+'\')" transform="translate('+X(n.id)+','+Y(n.id)+')">'
      +'<rect width="'+W+'" height="'+H+'" rx="8" style="stroke:'+(stop?"var(--danger)":l.color)+';fill:'+(off?"rgba(128,128,128,.12)":old?l.color+"14":l.color+"33")+'"/>'
      +'<text x="'+(W/2)+'" y="15" text-anchor="middle" class="gen-t1">'+esc(genShort(n.h))+(q&&q.lineStop?" ⛔":"")+'</text>'
      +'<text x="'+(W/2)+'" y="30" text-anchor="middle" class="gen-t3 '+(n.pseudo||off?"":genScoreCls(sc))+(tr===" ▼"?" dn":tr===" ▲"?" up":"")+'">'+esc(l2)+'</text></g>';
  });
  return s+'</svg>';
}
function genLineCardHTML(l,M){
  return'<div class="c gen-line" style="border-left:4px solid '+l.color+'">'
    +'<div class="gen-lh"><span class="gen-dot" style="background:'+l.color+'"></span><b class="qc-big">'+esc(genLineName(l))+'</b> <span class="hv-ts">'+esc(genLineSub(l))+'</span> '+(l.score!=null?genScoreBadge(l.score):'')
    +' <span class="hv-ts">· '+l.mem.length+' '+(l.mem.length===1?L2("regină","queen"):L2("regine","queens"))+' ('+l.active+' '+L2("acum","now")+')</span></div>'
    +'<div class="hv-ts">'+genRootLblQ(l.r)+'</div>'
    +'<div class="gen-chart">'+genChartSVG(l,M)+'</div></div>';
}
function renderGenealogy(){
  if(!(D.queens||[]).length&&!genAll().some(function(h){return h.nuc;})){   // empty app: nothing to show yet
    setP('<div class="hv-top"><h2><i class="fas fa-sitemap" style="color:var(--gold)"></i> '+L2("Genealogie","Genealogy")+'</h2></div>'
      +'<div class="al ali">🌳 '+L2("Genealogia apare după ce adaugi stupi cu regina lor (în ✏️ Editează → Regina) sau faci primul roi.","The genealogy appears once you add hives with their queen (✏️ Edit → Queen) or make your first nuc.")+'</div>');
    return;
  }
  var M=genModel(),S=M.S;
  if(_genLine!=="all"&&!M.lines.some(function(l){return l.r.id===_genLine;}))_genLine="all";
  var chips='<div class="gen-chips"><button class="gen-chip'+(_genLine==="all"?" on":"")+'" onclick="_genLine=\'all\';renderGenealogy()">'+L2("Toate liniile","All lines")+' <b>'+M.lines.length+'</b></button>'
    +M.lines.map(function(l){return'<button class="gen-chip'+(_genLine===l.r.id?" on":"")+'" style="--c:'+l.color+'" onclick="_genLine=\''+l.r.id+'\';renderGenealogy()"><span class="gen-dot" style="background:'+l.color+'"></span>'+esc(genLineName(l))+' <b>'+l.mem.length+'</b></button>';}).join("")+'</div>';
  // Ranking: the CURRENT queen of each active hive
  var rows=D.hives.filter(function(h){return !hvIsNuc(h);}).map(function(h){var q=hqCurrent(h.id);return{h:h,q:q,s:q?S[q.id]:null,l:q?M.lineOf[q.id]:null};})
    .filter(function(r){return _genLine==="all"||(r.l&&r.l.r.id===_genLine);});
  var kf={score:function(r){return r.s&&r.s.score!=null?r.s.score:-1;},honey:function(r){return r.s&&r.s.avg.honey!=null?r.s.avg.honey:-1;},
    gentle:function(r){return r.s&&r.s.avg.gentle!=null?r.s.avg.gentle:-1;},swarm:function(r){return r.s&&r.s.avg.swarm!=null?r.s.avg.swarm:-1;},
    brood:function(r){return r.s&&r.s.avg.brood!=null?r.s.avg.brood:-1;},health:function(r){return r.s&&r.s.avg.health!=null?r.s.avg.health:-1;},
    winter:function(r){return r.s&&r.s.avg.winter!=null?r.s.avg.winter:-1;}}[_genSort];
  rows.sort(function(a,b){return kf(b)-kf(a);});
  var shown=_genRankAll?rows:rows.slice(0,5);
  var comp=function(s){if(!s)return'<span class="hv-dim">'+L2("fără regină înregistrată","no queen recorded")+'</span>';var a=s.avg;
    return'🍯 '+(a.honey!=null?a.honey:'—')+' · 😊 '+(a.gentle!=null?a.gentle:'—')+' · 🐝 '+(a.swarm!=null?a.swarm:'—')+' · 🥚 '+(a.brood!=null?a.brood:'—')+' · 🌤️ '+(a.winter!=null?a.winter:'—')+' · 🩺 '+(a.health!=null?a.health:'—')+' <span class="hv-dim">· '+(s.years===1?'1 an':s.years+' ani')+'</span>';};
  var rank=shown.map(function(r,i){var stop=r.q&&genStoppedAtQ(r.q);
    return'<div class="gr-row'+(stop?" stopped":"")+'" onclick="'+(r.q?"genCard('"+r.q.id+"')":"")+'"><span class="gr-i">'+(i<3&&!stop&&r.s&&r.s.score!=null?["🥇","🥈","🥉"][i]:(i+1))+'</span>'
      +'<span class="gen-dot" style="background:'+(r.l?r.l.color:"#888")+'"></span>'
      +'<div class="gr-b"><b>'+esc(r.h.name)+'</b> '+genScoreBadge(r.s?r.s.score:null)+(stop?' <span class="bg gr">⛔</span>':'')
      +'<div class="hv-ts">'+(r.q?qCodeTag(r.q)+' '+esc(r.q.race||"—")+' '+qYr2(qFrom(r.q))+' · ':'')+comp(r.s)+'</div></div>'
      +'<button class="btn sm gh" onclick="event.stopPropagation();nucM(\'\',\''+r.h.id+'\')" title="'+L2("Fă roi din el","Make a nuc from it")+'">🐝</button></div>';
  }).join("");
  var sortBtns=[["score","⭐ Nota"],["honey","🍯 Miere"],["gentle","😊 Blândețe"],["swarm","🐝 Fără roire"],["brood","🥚 Puiet"],["winter","🌤️ Adaptare"],["health","🩺 Sănătate"]]
    .map(function(x){return'<button class="gen-chip'+(_genSort===x[0]?" on":"")+'" onclick="_genSort=\''+x[0]+'\';renderGenealogy()">'+x[1]+'</button>';}).join("");
  var lines=_genLine==="all"?M.lines:M.lines.filter(function(l){return l.r.id===_genLine;});
  var legend='<div class="gen-legend"><span><i class="lg hv"></i>regina de acum</span><span><i class="lg old"></i>înlocuită</span><span><i class="lg nuc"></i>roi</span><span><i class="lg off"></i>eșuat</span><span><i class="lg stop"></i>⛔ oprită</span>'
    +'<span class="hv-dim">G0 = începutul liniei, G1 = fiicele, G2 = nepoatele… · ⭐ nota · ▲ / ▼ = mai mare / mai mică decât a mamei</span></div>';
  var help='<button class="gen-help-b" onclick="_genHelp=!_genHelp;renderGenealogy()">ℹ️ Cum citesc arborele și nota '+(_genHelp?'▲':'▼')+'</button>'
    +(_genHelp?legend+GEN_INFO_HTML():'');
  // ── tab „Liniile”: one row per line (tap → its tree)
  var depth=function(n){var d=0,c=n;while(c&&c.parent){d++;c=M.byId[c.parent];}return d;};
  var linesH=M.lines.map(function(l){
    var qs=l.mem.filter(function(n){return !n.pseudo;}),cur=qs.filter(function(n){return !qTo(n.q)&&!n.h.closed;}),nucs=l.mem.filter(function(n){return n.pseudo&&!n.h.closed;}).length;
    var best=qs.filter(function(n){return S[n.id]&&S[n.id].score!=null;}).sort(function(a,b){return S[b.id].score-S[a.id].score;})[0];
    var gens=l.mem.reduce(function(a,n){return Math.max(a,depth(n));},0)+1;
    return'<div class="c gl-row" role="button" onclick="_genLine=\''+l.r.id+'\';_genTab=\'tree\';renderGenealogy()" style="--c:'+l.color+'">'
      +'<div class="gl-h"><span class="gen-dot" style="background:'+l.color+'"></span><b>'+esc(genLineName(l))+'</b><span class="hv-ts">'+esc(genLineSub(l))+'</span>'+genScoreBadge(l.score)+'</div>'
      +'<div class="gl-kv"><span><b>'+cur.length+'</b> regine acum</span><span><b>'+qs.length+'</b> în total</span><span><b>'+gens+'</b> '+(gens===1?"generație":"generații")+'</span>'+(nucs?'<span><b>'+nucs+'</b> '+(nucs===1?"roi":"roiuri")+' în formare</span>':'')+'</div>'
      +(best?'<div class="hv-ts">🏆 cea mai bună: <b>'+esc(qLabel(best.q))+'</b> '+genScoreBadge(S[best.id].score)+' · '+esc(best.h.name)+'</div>':'')
      +'</div>';
  }).join("");
  var tab=function(id,lbl,n){return'<button class="tv-tab'+(_genTab===id?" on":"")+'" onclick="_genTab=\''+id+'\';renderGenealogy()">'+lbl+(n!=null?' <span class="bg gy">'+n+'</span>':'')+'</button>';};
  var g=D.settings.genW||{},pid=g.custom?"custom":(g.preset||"bal"),Wn=genW();
  var prio='<div class="gen-prio"><div class="hv-ts">🎯 Ce contează pentru mine (nota se recalculează):</div><div class="gen-chips">'
    +GEN_PRESETS.map(function(p){return'<button class="gen-chip'+(pid===p.id?" on":"")+'" onclick="genSetPreset(\''+p.id+'\')">'+p.l+'</button>';}).join("")
    +'<button class="gen-chip'+(pid==="custom"?" on":"")+'" onclick="genSetCustom(\'honey\',genW().honey)">✍️ Eu aleg</button></div>'
    +'<div class="gen-w">'+GEN_COMP.map(function(c){return'<label><span>'+c[1]+' '+c[2]+'</span>'+(pid==="custom"?'<input type="number" min="0" max="100" value="'+Wn[c[0]]+'" onchange="genSetCustom(\''+c[0]+'\',this.value)">':'<b>'+Wn[c[0]]+'%</b>')+'</label>';}).join("")+'</div></div>';
  var body=prio+(_genTab==="rank"
      ?chips+'<div class="tv-sec-t">🏆 Din ce stup fac roi? <span class="hv-dim">(regina de acum)</span></div>'
        +'<div class="gen-sortchips">'+sortBtns+'</div>'
        +(rows.length?'<div class="c gr-list">'+rank
          +(rows.length>5?'<button class="gen-more" onclick="_genRankAll=!_genRankAll;renderGenealogy()">'+(_genRankAll?"▲ Doar primii 5":"▼ Vezi toți ("+rows.length+")")+'</button>':'')+'</div>'
          :'<div class="al ali">Niciun stup în această linie acum.</div>')
        +'<button class="gen-help-b" onclick="_genHelp=!_genHelp;renderGenealogy()">ℹ️ Cum se calculează nota '+(_genHelp?'▲':'▼')+'</button>'+(_genHelp?GEN_INFO_HTML():'')
    :_genTab==="lines"?'<div class="hv-ts" style="margin:0 2px 8px;">Apasă pe o linie ca să-i vezi arborele.</div>'+linesH
    :chips+help+lines.map(function(l){return genLineCardHTML(l,M);}).join(""));
  setP('<div class="hv-top"><h2><i class="fas fa-sitemap" style="color:var(--gold)"></i> '+L2("Genealogie","Genealogy")+'</h2>'
    +'<button class="btn" onclick="nucM()">🐝 Roi nou</button></div>'
    +'<div class="tv-tabs">'+tab("tree","🌳 Arbore",null)+tab("rank","🏆 Clasament",null)+tab("lines","🧬 Linii",M.lines.length)+'</div>'
    +body);
}
// explanation of the tree / score (shown on demand)
function GEN_INFO_HTML(){return '<div class="al ali tv-info" style="margin-top:8px;">ℹ️ '+L2("Arborele e pe <b>regine</b>, nu pe stupi: numărul stupului rămâne, dar când îi pui o regină cumpărată pornește o linie nouă, iar urmașii reginei vechi rămân în linia ei. <b>⭐ Nota (1–100) pe fiecare an</b>, din inspecțiile cât regina a fost în stup: 🍯 miere (kg extrase, față de cel mai bun stup din același an; fără extracții în acel an → rame căpăcite) · 😊 blândețe (agresivitate 1 → 100, 5 → 0) · 🐝 fără roire (0% inspecții cu botci → 100) · 🥚 puiet (rame cu puiet aprilie–august, față de cel mai bun) · 🌤️ adaptare la vreme (cu câte rame de albine intră în iarnă: 3 → 0, 9+ → 100, plus cât de plin de puiet e cuibul la primul cules, față de cel mai bun) · 🩺 sănătate (inspecții fără boli notate și cât varroa a avut față de stupul cu cei mai mulți). Ponderile le alegi tu sus, la „Ce contează pentru mine”. Lipsește ceva → se împarte pe rest. O regină care a stat doar o parte din sezon nu e judecată la miere pe acel an.","The tree is on <b>queens</b>, not hives: the hive number stays, but a purchased queen starts a new line while the old queen's descendants stay in hers. <b>⭐ Score (1–100) per year</b>, from inspections while the queen was in the hive: 🍯 honey 40% (peak capped super frames vs. the best that year) · 😊 gentleness 20% · 🐝 swarming 20% (% inspections with cells) · ❄️ wintering 20% (frames of bees going into winter: 3 → 0, 9+ → 100). Missing parts are spread over the rest.")+'</div>';}
// Queen detail sheet
window.genCard=function(id){
  var M=genModel(),n=M.byId[id];if(!n)return;
  var h=n.h,l=M.lineOf[id],col=l?l.color:"#888";
  if(n.pseudo){
    openM('<div class="mt">🐝 '+esc(h.name)+' '+genStatusBadge(h)+'</div>'
      +(l?'<div class="gen-cl" style="border-color:'+col+'"><span class="gen-dot" style="background:'+col+'"></span><b>'+esc(genLineName(l))+'</b></div>':'')
      +'<div class="hv-ts" style="margin-bottom:10px;">'+L2("Roi în formare — regina se crește din ouăle reginei","Nuc in progress — the queen is raised from the eggs of")+' '+(n.parent&&M.byId[n.parent]?'<b>'+esc(qLabel(M.byId[n.parent].q))+'</b>':'—')+' · '+L2("început","started")+' '+devFmt(h.nuc.start)+'</div>'
      +'<div class="br"><button class="btn gh" onclick="closeM()">'+L2("Închide","Close")+'</button></div>');
    return;
  }
  var q=n.q,s=M.S[id]||{yrs:{}},stop=genStoppedAtQ(q);
  var chain=[],cur=n,seen={};
  while(cur&&!seen[cur.id]){seen[cur.id]=1;chain.unshift(cur);cur=cur.parent?M.byId[cur.parent]:null;}
  var kids=M.kids[id]||[],desc=0;(function cnt(x){(M.kids[x.id]||[]).forEach(function(c){desc++;cnt(c);});})(n);
  var m=qMother(q),k=qOrigIdx(q.orig),to=qTo(q);
  var how=!m?genRootLblQ(n)
    :k===5||m.hive===q.hive?'🔄 '+L2("Schimbare naturală în stup — fiica reginei","Natural replacement in the hive — daughter of")+' '+esc(qLabel(m))
    :'🐝 '+L2("Crescută din ouăle reginei","Raised from the eggs of")+' '+esc(qLabel(m))+' ('+esc((genFind(m.hive)||{}).name||"—")+')';
  var others=qHiveQs(q.hive).filter(function(x){return x!==q;});
  var yrs=Object.keys(s.yrs||{}).sort();
  var tbl=yrs.length?'<table class="gs-tbl"><tr><th>'+L2("An","Year")+'</th><th>⭐</th><th>🍯</th><th>kg</th><th>😊</th><th>🐝</th><th>🥚</th><th>🌤️</th><th>🩺</th></tr>'
    +yrs.map(function(y){var Y=s.yrs[y],c=Y.c||{};
      return'<tr><td>'+y+'</td><td>'+genScoreBadge(Y.score)+'</td><td>'+(c.honey!=null?c.honey:'—')+'</td><td>'+(Y.kg?'<b>'+Y.kg+'</b>':'—')+'</td><td>'+(c.gentle!=null?c.gentle:'—')+'</td><td>'+(c.swarm!=null?c.swarm:'—')+'</td><td>'+(c.brood!=null?c.brood:'—')+'</td><td>'+(c.winter!=null?c.winter+(Y.win!=null?'<small> ('+Y.win+'r)</small>':''):'—')+'</td><td>'+(c.health!=null?c.health:'—')+'</td></tr>';}).join("")+'</table>'
    :'<div class="hv-ts">'+L2("Nicio inspecție încă în perioada acestei regine.","No inspections yet during this queen's time.")+'</div>';
  openM('<div class="mt">👑 '+esc(qCode(q).code)+' · G'+(chain.length-1)+' '+genScoreBadge(s.score)+'</div>'
    +(l?'<div class="gen-cl" style="border-color:'+col+'"><span class="gen-dot" style="background:'+col+'"></span><b>'+esc(genLineName(l))+'</b> · '+esc(q.race||"—")+' · '+L2("generația","generation")+' '+(chain.length-1)+' · '+esc(h.name)+'</div>':'')
    +'<div class="gen-path">'+chain.map(function(x){return'<span class="gen-pp'+(x.id===id?" me":"")+'" style="border-color:'+col+'" onclick="genCard(\''+x.id+'\')">'+esc(x.pseudo?genShort(x.h):qLabelS(x.q))+'</span>';}).join('<span class="gen-ar">→</span>')+'</div>'
    +'<div class="hv-ts" style="margin:6px 0 10px;">'+how+'</div>'
    +'<div class="gen-kv">'
    +'<div><span>📅 '+L2("În stup","In the hive")+'</span><b>'+qFrom(q)+' → '+(to?to+' <span class="hv-dim">('+L2("înlocuită","replaced")+')</span>':L2("acum","now"))+'</b></div>'
    +'<div><span>🏠 '+L2("Stupul","Hive")+'</span><b>'+esc(h.name)+(h.closed?' '+genStatusBadge(h):'')+'</b></div>'
    +(q.line?'<div><span>🧬 '+L2("Linie (notată)","Line (noted)")+'</span><b>'+esc(q.line)+'</b></div>':'')
    +(function(){var kg=0,ys=0;Object.keys(s.yrs||{}).forEach(function(y){if(s.yrs[y].kg){kg+=s.yrs[y].kg;ys++;}});
      return kg?'<div><span>🍯 '+L2("Miere extrasă","Honey extracted")+'</span><b>'+(+kg.toFixed(1))+' kg'+(ys>1?' <span class="hv-dim">· '+(+(kg/ys).toFixed(1))+' kg/an</span>':'')+'</b></div>':'';})()
    +'</div>'
    +'<div class="tv-sec-t" style="margin-top:4px;">⭐ '+L2("Nota pe ani","Score per year")+' <span class="hv-dim">· 🍯 = nota la miere (față de cel mai bun stup din an) · kg = mierea extrasă</span></div>'+tbl
    +'<div class="gen-kids"><b>👶 '+L2("Fiice","Daughters")+':</b> '+(kids.length?kids.map(function(c){return'<span class="gen-pp" style="border-color:'+col+'" onclick="genCard(\''+c.id+'\')">'+esc(c.pseudo?genShort(c.h)+" 🐝":qLabelS(c.q))+'</span>';}).join(" ")+(desc>kids.length?' <span class="hv-dim">+ '+(desc-kids.length)+' '+L2("mai departe","further down")+'</span>':''):'<span class="hv-dim">'+L2("niciuna încă","none yet")+'</span>')+'</div>'
    +(others.length?'<div class="hv-ts" style="margin-top:6px;">🏠 '+L2("Alte regine în","Other queens in")+' '+esc(h.name)+': '+others.map(function(x){var lx=M.lineOf[x.id];return'<span class="gen-pp" style="border-color:'+(lx?lx.color:"#888")+'" onclick="genCard(\''+x.id+'\')">'+esc(qCode(x).code+" G"+qCode(x).gen+" · "+(x.race||"?")+" "+qYr2(qFrom(x)))+'</span>';}).join(" ")+'</div>':'')
    +(stop&&!q.lineStop?'<div class="hv-ts" style="color:var(--danger);margin-top:6px;">⛔ '+L2("Ramura e oprită mai sus, din","The branch is stopped higher up, since")+' '+stop+'</div>':'')
    +'<div class="br" style="margin-top:14px;">'
    +(!to&&!h.closed&&!hvIsNuc(h)?'<button class="btn" onclick="closeM(function(){nucM(\'\',\''+h.id+'\');})">🐝 '+L2("Fă roi","Make a nuc")+'</button>':'')
    +'<button class="btn gh" onclick="genStopToggle(\''+id+'\')">'+(q.lineStop?"▶ "+L2("Repornește ramura","Resume branch"):"⛔ "+L2("Oprește ramura","Stop branch"))+'</button>'
    +'<button class="btn gh" onclick="closeM()">'+L2("Închide","Close")+'</button></div>');
};
window.genStopToggle=function(id){
  var q=qFind(id);if(!q)return;
  var done=function(msg,ic){save(false);if(document.getElementById("MB"))closeM();renderGenealogy();toast(msg,ic);};
  if(q.lineStop){q.lineStop=null;done(L2("Ramură repornită","Branch resumed"),"▶");return;}
  showConfirm(L2("Oprești ramura reginei","Stop the branch of queen")+' „'+esc(qLabel(q))+'”? '+L2("Nu mai faci roi din ea și din fiicele ei (se vede la alegerea donatorului).","You won't breed from her or her daughters (shown when choosing a donor)."),
    function(){q.lineStop=nucToday();done(L2("Ramură oprită","Branch stopped"),"⛔");},null,"⛔ "+L2("Oprește","Stop"));
};
