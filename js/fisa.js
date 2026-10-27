// BeeManager Pro — fisa.js
// 📋 Observation sheet ("Fișă de observație"): one sheet per hive per calendar year (January–December),
// filled automatically from the inspections, feedings, treatments, pastorage and queen data.
// Filled-in values use a handwriting-style font (Caveat, lib/fonts). It is printed / saved as PDF through the browser print dialog (A4 landscape).

var FS_MIN_ROWS=10;    // minimum rows in the inspections table (so the sheet keeps the look of the paper form)
var FS_MIN_PER=6;      // minimum rows in "Observații periodice"

function fsD(d){return d?d.slice(8,10)+"."+d.slice(5,7):"";}
function fsN(x){x=+x||0;return x?String(parseFloat(x.toFixed(2))).replace(".",","):"";}
function fsE(v){return v===null||v===undefined||v===0?"":esc(String(v));}
function fsStrip(s){return String(s||"").replace(/^[^A-Za-zÀ-ž0-9]+/,"").trim();}   // drops a leading emoji

// Years that have inspections for the hive(s), plus the current year
function fsYears(){
  var ys={},cur=new Date().getFullYear();ys[cur]=1;
  (D.inspections||[]).forEach(function(i){var y=parseInt((i.date||"").slice(0,4));if(y)ys[y]=1;});
  return Object.keys(ys).map(Number).sort(function(a,b){return b-a;});
}

// Feeding portions of a hive in a year: [{date, qty, unit, type}]
function fsFeeds(hid,yr){
  var out=[];
  (D.feedings||[]).forEach(function(f){
    if(f.planned||!fdCovers(f,hid))return;
    var u=f.unit||fdType(f).u||"kg";
    fdPortions(f).forEach(function(p){
      if((p.date||"").slice(0,4)!==String(yr)||!(parseFloat(p.qty)>0))return;
      out.push({date:p.date,qty:parseFloat(p.qty),unit:u,type:fsStrip(fdType(f).l),fid:f.id});
    });
  });
  return out;
}
function fsQtyTxt(list){   // grams → kg; "2 L + 0,3 kg"
  var by={};
  list.forEach(function(p){var u=p.unit==="g"?"kg":p.unit,q=p.unit==="g"?p.qty/1000:p.qty;by[u]=(by[u]||0)+q;});
  return Object.keys(by).map(function(u){return fsN(by[u])+" "+u;}).join(" + ");
}

// The queen of the hive for that year (the one active at year end, or the current one)
function fsQueen(hid,yr){
  var q=null;
  if(typeof qAt==="function")q=qAt(hid,yr+"-12-31");
  return q||hqCurrent(hid);
}

function fsData(hive,yr){
  var Y=String(yr),hid=hive.id;
  var insps=(D.inspections||[]).filter(function(i){return i.hiveId===hid&&(i.date||"").slice(0,4)===Y;})
    .sort(function(a,b){return a.date<b.date?-1:a.date>b.date?1:0;});
  var feeds=fsFeeds(hid,yr),inspDays={};
  insps.forEach(function(i){inspDays[i.date]=1;});
  var rows=insps.map(function(i){
    var fi=i.fIn||(i.nFrames?{n:i.nFrames}:{}),fo=i.fOut||{};
    var cat=i.magCount!==undefined?i.magCount:(i.mags?i.mags.length:"");
    var bees=i.winter&&i.winter.frames!=null?i.winter.frames:(i.winterMode?"":((parseInt(i.fB)||0)+inspFood(i))||"");
    var dis=(i.diseases||[]).filter(function(d){return d&&!/sănătos|healthy/i.test(d);}).map(fsStrip).join(", ");
    var obs=[];
    if(i.winterMode)obs.push("Inspecție de iarnă: "+wchTxt(i));
    else if(i.fB&&!i.transfer)obs.push("Puiet: "+i.fB+" rame");
    if(i.weight&&i.weight.kg)obs.push("Cântărire: "+weighTxt(i));
    if(i.transfer)obs.unshift("Transfer rame");
    if(i.mv&&typeof mvTxt==="function"){var mt=mvTxt(i);if(mt)obs.push(mt.charAt(0).toUpperCase()+mt.slice(1));}
    if(i.notes)obs.push(i.notes);
    return{d:fsD(i.date),cat:cat===0?"0":cat,hr:fsQtyTxt(feeds.filter(function(p){return p.date===i.date;})),
      inN:fi.n,inH:fi.h,inB:fi.b,exCat:i.magRmS||"",exN:fo.n,exH:fo.h,exP:fo.p,exB:fo.b,exA:fo.a,
      bees:bees,food:i.winterMode?"":(inspFood(i)||""),egg:i.eggs?"✓":"",lar:i.larvae?"✓":"",cap:i.capped?"✓":"",
      botci:i.botci?(i.botciN||"✓"):"",q:i.qSeen?"✓":"",dis:dis,obs:obs.join(" · ")};
  });
  // periodic observations: treatments, pastorage, queens, varroa counts, feedings outside inspection days
  var ev=[];
  (D.treatments||[]).forEach(function(tr){
    if(!tr.date||!trHives(tr).some(function(h){return h.id===hid;}))return;
    if(tr.date.slice(0,4)!==Y&&(tr.endDate||"").slice(0,4)!==Y)return;
    ev.push({date:tr.date,txt:(tr.date>todayISO()?"Tratament planificat: ":"Tratament: ")+trShort(tr)+(tr.disease?" ("+fsStrip(tr.disease)+")":"")+(tr.endDate&&tr.endDate!==tr.date?" — până la "+fsD(tr.endDate):"")+(tr.dosage?" · doză: "+tr.dosage:"")});
  });
  (D.pastorage||[]).forEach(function(p){
    if(pHives(p).indexOf(hid)<0||(p.startDate||"").slice(0,4)!==Y)return;
    var back=(p.returned&&p.returned[hid])||p.endDate||"";
    ev.push({date:p.startDate,txt:"Pastorare: "+(p.location||"—")+(p.target?" · cules "+p.target:"")+(back?" — întors pe "+fsD(back):"")});
  });
  (D.queens||[]).forEach(function(q){
    var d=q.from||(q.yr?q.yr+"-01-01":"");
    if(q.hive!==hid||d.slice(0,4)!==Y||!q.from)return;
    ev.push({date:q.from,txt:"Matcă nouă: "+[q.race,q.orig].filter(Boolean).join(", ")});
  });
  (D.varroa||[]).forEach(function(v){
    if(v.hiveId!==hid||(v.date||"").slice(0,4)!==Y)return;
    ev.push({date:v.date,txt:"Varroa: "+fsStrip(typeof vrValStr==="function"?vrValStr(v):(v.miteCount||0)+" acarieni")});
  });
  // feedings outside inspection days: one line per feeding (portions, period, total)
  var byF={},fOrder=[];
  feeds.forEach(function(p){if(inspDays[p.date])return;if(!byF[p.fid]){byF[p.fid]=[];fOrder.push(p.fid);}byF[p.fid].push(p);});
  fOrder.forEach(function(fid){
    var ps=byF[fid].sort(function(a,b){return a.date<b.date?-1:1;}),a=ps[0],z=ps[ps.length-1];
    ev.push({date:a.date,txt:"Hrănire: "+a.type+" — "+(ps.length>1?ps.length+" porții ("+fsD(a.date)+"–"+fsD(z.date)+"), total ":"")+fsQtyTxt(ps)});
  });
  ev.sort(function(a,b){return a.date<b.date?-1:a.date>b.date?1:0;});
  return{rows:rows,ev:ev};
}

// HTML of one sheet (blank=true → only the header, all rows empty)
function fsSheetHTML(hive,yr,blank){
  var data=blank?{rows:[],ev:[]}:fsData(hive,yr);
  var q=fsQueen(hive.id,yr);
  var head='<div class="fs-hd"><span><b>FIȘĂ DE OBSERVAȚIE</b></span>'
    +'<span><i>ANUL</i><em class="fs-w">'+yr+'</em></span>'
    +'<span><i>NR. STUP</i><em class="fs-w">'+esc(hive.num?String(hive.num):hive.name)+(hive.num&&hive.name&&hive.name.indexOf(String(hive.num))<0?' ('+esc(hive.name)+')':'')+'</em></span>'
    +'<span><i>STUP TIP/SISTEM</i><em class="fs-w">'+esc([hive.mod,hive.mat].filter(Boolean).join(", "))+'</em></span>'
    +'<span><i>MATCA AN</i><em class="fs-w">'+(q&&q.yr?q.yr:"")+'</em></span>'
    +'<span><i>MATCA ORIGINE</i><em class="fs-w">'+esc(q?[q.orig,q.race].filter(Boolean).join(", "):"")+'</em></span></div>';
  var cols=[4.5,3,5.5, 4.5,4.8,4, 3,4.5,4,4.8,4,4.5, 4.5,4.8,3.5,3.8,4.2,3.6,4.2, 8];
  var used=cols.reduce(function(s,c){return s+c;},0);
  var cg='<colgroup>'+cols.map(function(c){return'<col style="width:'+c+'%">';}).join("")+'<col style="width:'+(100-used)+'%"></colgroup>';
  var th='<thead><tr><th rowspan="4">Data</th><th rowspan="4">Cat</th><th rowspan="4">Hrăniri Kg</th>'
    +'<th colspan="3">Introdus</th><th colspan="6">Extras</th><th colspan="7">Stare generală</th>'
    +'<th rowspan="4">Semne clinice</th><th rowspan="4">OBSERVAȚII</th></tr>'
    +'<tr><th colspan="3">Rame</th><th rowspan="3">Cat</th><th colspan="5">Rame</th><th colspan="7">Rame</th></tr>'
    +'<tr><th rowspan="2">Noi/ Goale</th><th rowspan="2">Miere/ Păstură</th><th rowspan="2">Puiet</th>'
    +'<th rowspan="2">Noi/ Goale</th><th rowspan="2">Miere</th><th rowspan="2">Păstură</th><th rowspan="2">Puiet</th><th rowspan="2">Rame albine</th>'
    +'<th rowspan="2">Total rame albine</th><th rowspan="2">Miere/ Păstură</th><th colspan="3">Puiet</th><th rowspan="2">Botci</th><th rowspan="2">Matcă</th></tr>'
    +'<tr><th>Ouă</th><th>Larve</th><th>Căpăcit</th></tr></thead>';
  var keys=["d","cat","hr","inN","inH","inB","exCat","exN","exH","exP","exB","exA","bees","food","egg","lar","cap","botci","q","dis","obs"];
  var body=data.rows.map(function(r){
    return'<tr>'+keys.map(function(k){return'<td class="fs-w'+(k==="obs"||k==="dis"?' l':'')+'">'+(k==="cat"&&r.cat==="0"?"0":fsE(r[k]))+'</td>';}).join("")+'</tr>';
  }).join("");
  for(var n=data.rows.length;n<FS_MIN_ROWS;n++)body+='<tr>'+keys.map(function(){return'<td></td>';}).join("")+'</tr>';
  var per='<div class="fs-h2">OBSERVAȚII PERIODICE</div>'
    +'<table class="fs-t fs-p"><colgroup><col style="width:11%"><col style="width:89%"></colgroup>'
    +'<thead><tr><th>Data</th><th>Lucrări și observații</th></tr></thead><tbody>'
    +data.ev.map(function(e){return'<tr><td class="fs-w">'+fsD(e.date)+'</td><td class="fs-w l">'+esc(e.txt)+'</td></tr>';}).join("");
  for(var m=data.ev.length;m<FS_MIN_PER;m++)per+='<tr><td></td><td></td></tr>';
  per+='</tbody></table>';
  return'<div class="fs-pg">'+head+'<table class="fs-t">'+cg+th+'<tbody>'+body+'</tbody></table>'+per+'</div>';
}

// Builds the sheets and opens the print dialog (→ "Salvează ca PDF")
// Builds the sheets and shows them on screen (preview); „Salvează PDF” opens the print dialog.
// The preview always works; printing can be blocked inside some embedded previews — then the sheet is
// still visible on screen and can be saved from the installed app.
window.fisaPrint=function(){
  var yr=parseInt(($q("fsYr")||{}).value)||new Date().getFullYear();
  var hv=($q("fsHv")||{}).value||"all";
  var hives=hv==="all"?D.hives.slice():D.hives.filter(function(h){return h.id===hv;});
  if(!hives.length){toast("Nu ai niciun stup.","⚠️");return;}
  hives.sort(function(a,b){return(a.num||9999)-(b.num||9999)||String(a.name).localeCompare(String(b.name));});
  var old=document.getElementById("fisaPrint");if(old)old.remove();
  var box=document.createElement("div");box.id="fisaPrint";box.className="fs-ov";
  box.innerHTML='<div class="fs-bar"><b>📋 Fișa de observație '+yr+'</b>'
    +'<button class="btn" onclick="fisaDoPrint()">🖨️ Salvează PDF / Printează</button>'
    +'<button class="btn gh" onclick="fisaClose()">✕ Închide</button></div>'
    +'<div class="fs-pages">'+hives.map(function(h){return fsSheetHTML(h,yr,false);}).join("")+'</div>';
  document.body.appendChild(box);
  box.dataset.title="Fisa_observatie_"+yr+(hives.length===1?"_"+String(hives[0].num||hives[0].name).replace(/[^A-Za-z0-9]+/g,"_"):"_toti_stupii");
  fisaFit();
};
// scale the A4 pages to the screen width (only on screen; printing uses the real size)
function fisaFit(){
  var pg=document.querySelector("#fisaPrint .fs-pages");if(!pg)return;
  var w=Math.min(1,(window.innerWidth-16)/1120);pg.style.zoom=w;
}
window.addEventListener("resize",function(){if(document.getElementById("fisaPrint"))fisaFit();});
window.fisaClose=function(){var b=document.getElementById("fisaPrint");if(b)b.remove();};
window.fisaDoPrint=function(){
  var box=document.getElementById("fisaPrint");if(!box)return;
  var title=document.title;document.title=box.dataset.title||title;
  var back=function(){document.title=title;window.removeEventListener("afterprint",back);};
  window.addEventListener("afterprint",back);
  var t0=Date.now();
  var go=function(){
    setTimeout(function(){
      try{window.print();}catch(e){}
      // print() returns at once when it is blocked (e.g. inside an embedded preview)
      if(Date.now()-t0<400)toast("Printarea nu e permisă aici — fișa o salvezi ca PDF din aplicația instalată (telefon / GitHub).","ℹ️");
    },120);};
  // wait for the handwriting font, otherwise the first print may use a fallback font
  try{if(document.fonts&&document.fonts.load){document.fonts.load('600 12pt "BmHand"',"aăâîșțAĂÂÎȘȚ0123").then(go,go);}else go();}catch(e){go();}
};

// Settings card
function fisaCardHTML(){
  var yrs=fsYears();
  var hs=D.hives.slice().sort(function(a,b){return(a.num||9999)-(b.num||9999);});
  return'<div class="c" style="margin-bottom:14px;"><div class="ct">📋 Fișa de observație</div>'
    +'<p style="font-size:.78rem;color:var(--mut);margin:4px 0 10px;line-height:1.45;">Câte o fișă pe stup pentru un an (ianuarie–decembrie), completată automat din inspecții, hrăniri, tratamente și pastorare, cu un scris asemănător scrisului de mână.</p>'
    +'<div class="r2"><div>'+L("📅 Anul")+'<select id="fsYr">'+yrs.map(function(y){return'<option>'+y+'</option>';}).join("")+'</select></div>'
    +'<div>'+L("🏠 Stupul")+'<select id="fsHv"><option value="all">Toți stupii ('+hs.length+' fișe)</option>'
    +hs.map(function(h){return'<option value="'+h.id+'">'+esc(h.name)+'</option>';}).join("")+'</select></div></div>'
    +'<button class="btn" style="width:100%;margin-top:10px;" onclick="fisaPrint()">🖨️ Salvează PDF / Printează</button>'
    +'<p style="font-size:.72rem;color:var(--mut);margin:8px 0 0;line-height:1.45;">În fereastra care se deschide alege <b>Salvează ca PDF</b> (sau imprimanta). Foaia e A4 pe orizontală.</p></div>';
}
