// BeeManager Pro — report.js
// 📊 Annual report (Settings → Raport anual) — the first page built only on the internal API (api.js):
// per hive: inspections, treatments, feed given, max varroa, frames given / received, super frames extracted,
// nucs made, queen cells; totals for the year. Export as CSV (opens in Excel / Sheets).
var _rpYear=null;
function rpYear(){return _rpYear||String(new Date().getFullYear());}
window.rpSetYear=function(y){_rpYear=y;renderSettings();};
function rpCardHTML(){
  var years=BM.rapoarte.ani(),y=rpYear(),R=BM.rapoarte.an(y),T=R.total;
  var h='<div class="c" style="margin-bottom:14px;"><div class="ct">📊 Raport anual</div>'
    +'<p class="bk-p">Tot ce s-a întâmplat în stupină într-un an, pe fiecare stup. Calculat din inspecții, tratamente, hrăniri și numărători.</p>'
    +'<div class="seg" style="margin-bottom:12px;">'+years.map(function(x){return'<button type="button" class="seg-b'+(x===y?" on":"")+'" onclick="rpSetYear(\''+x+'\')">'+x+'</button>';}).join("")+'</div>'
    +'<div class="rp-tot">'
    +rpTile("🏠",T.stupi,"stupi și roiuri")+rpTile("🔍",T.inspectii,"inspecții")+rpTile("💊",T.tratamente,"tratamente")
    +rpTile("🍬",(T.hranaL?T.hranaL+" L":"")+(T.hranaL&&T.hranaKg?" + ":"")+(T.hranaKg?T.hranaKg+" kg":"")||"0","hrană dată")
    +rpTile("🍯",T.rameMiereScoase,"rame de magazie extrase")+rpTile("🐝",T.roiuri,"roiuri făcute")
    +'</div></div>';
  if(!R.stupi.length)return h+'<div class="c"><p class="bk-p" style="margin:0;">Niciun stup în '+y+'.</p></div>';
  h+='<div class="c" style="margin-bottom:14px;"><div class="ct">🏠 Pe stupi · '+y+'</div>';
  R.stupi.forEach(function(r){
    var hr=[];Object.keys(r.hrana.peTip).forEach(function(k){hr.push(k+" "+r.hrana.peTip[k]+(/sirop/i.test(k)?" L":" kg"));});
    var trs={};r.tratamente.forEach(function(x){trs[x]=(trs[x]||0)+1;});
    h+='<div class="rp-row"><div class="rp-h"><b>'+(r.roi?"🐝 ":"🏠 ")+esc(r.nume)+'</b>'+(r.arhivat?'<span class="bg gy">arhivat</span>':'')+'<span class="hv-ts">'+r.inspectii+(r.inspectii===1?' inspecție':' inspecții')+(r.iarna?' · '+r.iarna+' de iarnă':'')+'</span></div>'
      +'<div class="rp-grid">'
      +rpCell("💊 Tratamente",Object.keys(trs).length?Object.keys(trs).map(function(k){return esc(k)+(trs[k]>1?" ×"+trs[k]:"");}).join("<br>"):"—")
      +rpCell("🍬 Hrană",hr.length?hr.join("<br>"):"—")
      +rpCell("🕷️ Varroa max.",r.varroaMax!=null?r.varroaMax+" căzuți":"—")
      +rpCell("🧱 Rame mutate",(r.rameDate||r.ramePrimite)?(r.rameDate?"↗ "+r.rameDate+" date":"")+(r.rameDate&&r.ramePrimite?" · ":"")+(r.ramePrimite?"↙ "+r.ramePrimite+" primite":""):"—")
      +rpCell("🍯 Magazii",r.rameMiereScoase?r.rameMiereScoase+" rame extrase":"—")
      +rpCell("🐝 Roiuri / botci",(r.roiuriFacute?r.roiuriFacute+(r.roiuriFacute===1?" roi":" roiuri"):"")+(r.roiuriFacute&&r.botci?" · ":"")+(r.botci?r.botci+" insp. cu botci":"")||"—")
      +'</div></div>';
  });
  h+='<div class="bk-btns" style="margin-top:12px;"><button type="button" class="btn" onclick="rpExport()">📄 Export CSV</button><button type="button" class="btn gh" onclick="seOpen(\'backup\')">💾 Backup</button></div></div>';
  return h;
}
function rpTile(ic,v,l){return'<div class="rp-tile"><i>'+ic+'</i><b>'+v+'</b><small>'+l+'</small></div>';}
function rpCell(l,v){return'<div class="rp-cell"><small>'+l+'</small><div>'+v+'</div></div>';}
// CSV with ; (Excel in Romanian), UTF-8 with BOM so diacritics show
window.rpExport=function(){
  var y=rpYear(),R=BM.rapoarte.an(y),rows=[["Stup","Tip","Inspecții","De iarnă","Tratamente","Hrană (L)","Hrană (kg)","Varroa max.","Rame date","Rame primite","Rame magazie extrase","Roiuri făcute","Inspecții cu botci"]];
  R.stupi.forEach(function(r){rows.push([r.nume,r.roi?"roi":"stup",r.inspectii,r.iarna,r.tratamente.join(" | "),r.hrana.L,r.hrana.kg,r.varroaMax!=null?r.varroaMax:"",r.rameDate,r.ramePrimite,r.rameMiereScoase,r.roiuriFacute,r.botci]);});
  var csv="﻿"+rows.map(function(r){return r.map(function(c){c=String(c==null?"":c);return/[;"\n]/.test(c)?'"'+c.replace(/"/g,'""')+'"':c;}).join(";");}).join("\r\n");
  var blob=new Blob([csv],{type:"text/csv;charset=utf-8"}),name="BeeManager_raport_"+y+".csv";
  if(navigator.share&&navigator.canShare){try{var f=new File([blob],name,{type:"text/csv"});if(navigator.canShare({files:[f]})){navigator.share({files:[f],title:name}).catch(function(){});return;}}catch(e){}}
  var a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();setTimeout(function(){a.remove();},500);
  toast("Raport "+y+" exportat (CSV).","📄");
};
// 🗄️ data status card (Settings → Backup): what is stored and where
function dbCardHTML(){
  var s=BM.date.stare(),db=s.bazaDeDate||{};
  return'<div class="c" style="margin-bottom:14px;"><div class="ct">🗄️ Datele aplicației</div>'
    +'<div class="rp-tot">'+rpTile("🏠",s.stupi,"stupi")+rpTile("🔍",s.inspectii,"inspecții")+rpTile("💊",s.tratamente,"tratamente")+rpTile("🍬",s.hraniri,"hrăniri")+rpTile("🕷️",s.varroa,"numărători")+'</div>'
    +'<p class="bk-p" style="margin:8px 0 0;">'+(db.ok?'✅ Baza de date a telefonului (IndexedDB, '+db.tables+' tabele) · ultima salvare: <b>'+s.salvat+'</b>':'⚠️ Baza de date nu e disponibilă aici — datele se țin în memoria browserului (localStorage).')
    +' Datele rămân pe telefon; fă backup periodic.</p></div>';
}
