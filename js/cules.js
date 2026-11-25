// BeeManager Pro — cules.js
// 🍯 „Cules” page: honey extractions (frames per hive → total kg → each hive's share), forecast from the
// supers on the hives, comparison of the same flow across years. All numbers come from BM.cules (api.js).
var _cu={tab:"list",cules:null,rows:[],exId:null,from:[]};

function renderCules(){
  var tab=function(id,l,n){return'<button class="tv-tab'+(_cu.tab===id?" on":"")+'" onclick="_cu.tab=\''+id+'\';renderCules()">'+l+(n!=null?' <span class="bg gy">'+n+'</span>':'')+'</button>';};
  var list=BM.cules.lista();
  setP('<div class="hv-top"><h2><i class="fas fa-droplet" style="color:var(--gold)"></i> Cules</h2><button class="btn sm" onclick="cuM()">➕ Extracție</button></div>'
    +'<div class="tv-tabs">'+tab("list","🍯 Extracții",list.length)+tab("prog","🔮 Prognoză")+tab("years","📈 Pe ani")+'</div>'
    +(_cu.tab==="list"?cuListHTML(list):_cu.tab==="prog"?cuProgHTML():cuYearsHTML()));
}
// ── list ──
function cuListHTML(list){
  if(!list.length)return'<div class="al ali">🍯 Nicio extracție încă. Când scoți ramele cu miere, apasă <b>➕ Extracție</b>: notezi câte rame ai luat din fiecare stup, iar după stors pui kilogramele totale — aplicația împarte mierea pe stupi.</div>';
  var open=cuPending(list);
  return(open.length?'<div class="al alw">⏳ '+open.length+(open.length===1?' extracție fără kg':' extracții fără kg')+' — după stors, apasă „Pun kg”.</div>':'')
    +list.map(function(e){var sp=BM.cules.impartire(e);
      return'<div class="c cu-card'+(sp.real?"":" est")+'"><div class="cu-h"><b>'+BM.cules.icoCules(e.cules)+' '+esc(BM.cules.numeCules(e.cules))+'</b><span class="hv-ts">📅 '+devFmt(e.date)+' · '+sp.rame+' rame · '+sp.stupi.length+(sp.stupi.length===1?" stup":" stupi")+'</span></div>'
        +'<div class="cu-kg">'+(sp.real?'<b>'+sp.kg+' kg</b><small>'+(sp.rame?(sp.kg/sp.rame).toFixed(2):"—")+' kg / ramă</small>':'<b class="hv-dim">~'+sp.kg+' kg</b><small>estimat · kg se pun după stors</small>')+'</div>'
        +'<div class="cu-rows">'+cuByHive(sp).map(function(r){return'<span class="cu-chip"><b>'+esc(r.nume)+'</b> '+r.n+' r. → '+(sp.real?"":"~")+r.kg+' kg</span>';}).join("")+'</div>'
        +(e.note?'<div class="hv-ts">📝 '+esc(e.note)+'</div>':'')
        +'<div class="br" style="margin-top:8px;">'+(sp.real?'':'<button class="btn sm" onclick="cuKgM(\''+e.id+'\')">⚖️ Pun kg</button>')+'<button class="btn sm gh" onclick="cuM(\''+e.id+'\')">✏️</button><button class="btn sm gh" onclick="cuDel(\''+e.id+'\')">🗑️</button></div></div>';
    }).join("");
}
function cuByHive(sp){var by={},o=[];sp.stupi.forEach(function(r){if(!by[r.nume]){by[r.nume]={nume:r.nume,n:0,kg:0};o.push(by[r.nume]);}by[r.nume].n+=r.n;by[r.nume].kg=+(by[r.nume].kg+r.kg).toFixed(1);});return o;}
function cuPending(list){return(list||BM.cules.lista()).filter(function(e){return e.kg==null;});}
// ── forecast ──
function cuProgHTML(){
  var c=_cu.cules||BM.cules.culesCurent(),P=BM.cules.prognoza(c);
  var sel='<select onchange="_cu.cules=this.value;renderCules()">'+BM.cules.tipuri().map(function(x){return'<option value="'+x.id+'"'+(x.id===c?" selected":"")+'>'+x.ic+' '+esc(x.n)+'</option>';}).join("")+'</select>';
  var est=BM.cules.estRama(c,"Dadant 1/2 (magazie)");
  var h='<div class="c" style="margin-bottom:12px;"><div class="ct">🔮 Dacă extragi acum</div>'+L("Culesul")+sel
    +'<p class="bk-p">Din magaziile notate la ultima inspecție a fiecărui stup: ramele <b>căpăcite</b> (rame × % căpăcit) înmulțite cu kg pe ramă.</p>';
  if(!P.stupi.length)return h+'<div class="al ali">Niciun stup nu are magazie notată acum.</div></div>'+cuKgRamaHTML(c);
  h+='<div class="cu-big"><b>~'+P.kg+' kg</b><small>din ~'+P.rame+' rame căpăcite · '+P.stupi.length+' stupi</small></div>'
    +'<div class="cu-rows">'+P.stupi.map(function(r){return'<div class="cu-line"><span>'+esc(r.nume)+'</span><span class="hv-ts">'+r.magazii+' mag. · '+r.rame+' rame · '+r.capacite+' căpăcite</span><b>~'+r.kg+' kg</b></div>';}).join("")+'</div></div>';
  return h+cuKgRamaHTML(c);
}
// kg per frame: learned values + the user's own references
function cuKgRamaHTML(c){
  var LR=BM.cules.invatat(),types=BM.cules.tipuriRama();
  var learned=Object.keys(LR).filter(function(k){return k.indexOf("*|")!==0;}).map(function(k){var p=k.split("|");return'<div class="cu-line"><span>'+BM.cules.icoCules(p[0])+' '+esc(BM.cules.numeCules(p[0]))+' · '+esc(p[1])+'</span><b>'+LR[k].kg+' kg</b><span class="hv-ts">'+LR[k].n+(LR[k].n===1?" extracție":" extracții")+'</span></div>';});
  return'<div class="c"><div class="ct">⚖️ Kg la o ramă</div>'
    +'<p class="bk-p">Pentru estimări și pentru împărțirea mierii pe stupi. Aplicația <b>învață</b> din fiecare extracție la care pui kg; până atunci folosește valoarea ta sau cea standard.</p>'
    +(learned.length?'<div class="hv-ts" style="margin-bottom:4px;">📚 Învățat din extracțiile tale:</div><div class="cu-rows">'+learned.join("")+'</div>':'<div class="hv-ts">Nimic învățat încă — după prima extracție cu kg apare aici.</div>')
    +'<div class="hv-ts" style="margin:10px 0 4px;">✍️ Valoarea ta (gol = standard):</div>'
    +types.map(function(t){var u=D.settings.frameKg&&D.settings.frameKg[t];return'<div class="cu-line"><span>'+esc(t)+'</span><span class="hv-ts">standard '+(FW[t]||2)+' kg</span><input type="number" inputmode="decimal" step="0.1" min="0" style="width:84px;" value="'+(u||"")+'" placeholder="'+(FW[t]||2)+'" onchange="cuSetKg(\''+esc(t)+'\',this.value)"></div>';}).join("")
    +'</div>';
}
window.cuSetKg=function(t,v){if(!D.settings.frameKg)D.settings.frameKg={};v=parseFloat(v);if(v>0)D.settings.frameKg[t]=v;else delete D.settings.frameKg[t];save(false);toast("Salvat.","⚖️");};
// ── years ──
function cuYearsHTML(){
  var A=BM.cules.peAni();
  if(!A.length)return'<div class="al ali">📈 Comparația pe ani apare după prima extracție: același cules (salcâm cu salcâm, tei cu tei) de la un an la altul.</div>';
  return A.map(function(c){
    var mx=Math.max.apply(null,c.ani.map(function(y){return y.kg;}))||1;
    return'<div class="c" style="margin-bottom:12px;"><div class="ct">'+c.ico+' '+esc(c.nume)+'</div>'
      +c.ani.slice().reverse().map(function(y){
        var d=y.delta,dl=d==null?'<span class="hv-ts">primul an</span>':'<span class="bg '+(d>=0?"gg":"gr")+'">'+(d>=0?"▲ +":"▼ ")+d+'% față de anul trecut</span>';
        return'<div class="cu-yr"><div class="cu-yr-h"><b>'+y.an+'</b>'+dl+'</div>'
          +'<div class="cu-bar"><i style="width:'+Math.round(y.kg/mx*100)+'%"></i></div>'
          +'<div class="cu-yr-kv"><span><b>'+(y.estimat?"~":"")+y.kg+'</b> kg</span><span><b>'+y.kgStup+'</b> kg / stup'+(y.deltaStup!=null?' <small class="'+(y.deltaStup>=0?"up":"dn")+'">'+(y.deltaStup>=0?"+":"")+y.deltaStup+'%</small>':'')+'</span><span><b>'+y.kgRama+'</b> kg / ramă</span><span><b>'+y.rame+'</b> rame · '+y.stupi+' stupi · '+y.extractii+(y.extractii===1?" extracție":" extracții")+'</span></div></div>';
      }).join("")+'</div>';
  }).join("")
  +'<div class="al ali" style="font-size:.78rem;">ℹ️ „kg / stup” compară producția medie, ca să vezi dacă familiile au cules mai mult sau mai puțin chiar dacă numărul de stupi s-a schimbat.</div>';
}
// ── form ──
// rows: {hiveId, n, type, src ("mag:i" super, "nest" brood boxes) | inspId (already taken off in an inspection)}
window.cuM=function(id){
  var ex=id?BM.cules.get(id):null;_cu.exId=id||null;_cu.inapoi=ex?!!ex.inapoi:false;_cu.sel={};
  _cu.cules=ex?ex.cules:(_cu.cules||BM.cules.culesCurent());
  _cu.rows=ex?ex.rows.map(function(r){return{hiveId:r.hiveId,n:r.n,type:r.type,src:r.src||null,inspId:r.inspId||null};}):[];
  _cu.from=ex?(ex.fromInsp||[]).slice():[];
  var cands=ex?[]:BM.cules.dinInspectii(21,id);
  cands.forEach(function(c){_cu.rows.push({hiveId:c.hiveId,n:c.n,type:c.type,inspId:c.inspId});_cu.from.push(c.inspId);});
  _cu.hives=[];_cu.rows.forEach(function(r){if(_cu.hives.indexOf(r.hiveId)<0)_cu.hives.push(r.hiveId);});
  openM('<div class="mt">🍯 '+(ex?"Extracție":"Extracție nouă")+'</div>'
    +'<div class="r2"><div>'+L("📅 Data")+'<input type="date" id="cuDt" value="'+(ex?ex.date:todayISO())+'"></div>'
    +'<div>'+L("🌸 Culesul")+'<select id="cuC" onchange="_cu.cules=this.value;cuEstUpd()">'+BM.cules.tipuri().map(function(x){return'<option value="'+x.id+'"'+(x.id===_cu.cules?" selected":"")+'>'+x.ic+' '+esc(x.n)+'</option>';}).join("")+'<option value="__new">➕ Alt cules (scriu eu)</option></select><input id="cuCn" placeholder="numele culesului" style="display:none;margin-top:6px;"></div></div>'
    +(cands.length?'<div class="al alo" style="font-size:.8rem;">📋 Am preluat ramele scoase la inspecții în ultimele 3 săptămâni ('+cands.length+(cands.length===1?" stup":" stupi")+'). Ele sunt deja scoase din stup.</div>':'')
    +(ex&&ex.applied?'<div class="al ali" style="font-size:.8rem;">ℹ️ Ramele acestei extracții au fost deja scoase din stupi la salvare; aici schimbi doar numerele pentru împărțirea mierii.</div>':'')
    +L("🧱 Rame luate din fiecare stup")+'<div id="cuRows"></div>'
    +'<div class="cu-addh">'+L("➕ Adaugă stup")+'<select id="cuAddH" onchange="if(this.value){cuHiveAdd(this.value);this.value=\'\';}"><option value="">alege stupul…</option></select></div>'
    +'<div id="cuEst" class="cu-est"></div>'
    +(ex&&ex.applied?'':'<div class="isc-seg" style="margin:6px 0 10px;"><button type="button" class="'+(_cu.inapoi?"":"on")+'" onclick="_cu.inapoi=false;cuRowsDraw()">📤 Ramele rămân scoase<br><small>stupul are mai puține rame</small></button><button type="button" class="'+(_cu.inapoi?"on":"")+'" onclick="_cu.inapoi=true;cuRowsDraw()">🔁 Le pun înapoi goale<br><small>după stors, ca rame clădite</small></button></div>')
    +L("⚖️ Kg miere în total (după stors)")+'<input type="number" inputmode="decimal" step="0.1" min="0" id="cuKg" value="'+(ex&&ex.kg!=null?ex.kg:"")+'" placeholder="gol = pui mai târziu" oninput="cuEstUpd()">'
    +L("📝 Notă")+'<input id="cuNt" value="'+esc(ex?ex.note||"":"")+'" placeholder="ex. 2 magazii pline, miere deschisă">'
    +'<div class="br" style="margin-top:14px;"><button class="btn" onclick="cuSave()">💾 Salvează</button><button class="btn gh" onclick="closeM()">Anulează</button></div>');
  var sel=$q("cuC");if(sel)sel.addEventListener("change",function(){var n=$q("cuCn");if(n)n.style.display=sel.value==="__new"?"block":"none";});
  cuRowsDraw();
};
function cuRowsDraw(){
  var box=$q("cuRows");if(!box)return;var applied=!!(_cu.exId&&(BM.cules.get(_cu.exId)||{}).applied);
  var hs=BM.stupi.toate();
  // hive picker: hives not yet in the form, with what they have
  var add=$q("cuAddH");if(add){add.innerHTML='<option value="">alege stupul…</option>'+hs.filter(function(h){return _cu.hives.indexOf(h.id)<0;}).map(function(h){var sr=BM.cules.surse(h.id),n=sr.reduce(function(s,x){return s+x.max;},0);return'<option value="'+h.id+'">'+esc(h.name)+' — '+(n?n+' rame cu miere':'nimic de extras')+'</option>';}).join("");}
  if(!_cu.hives.length){box.innerHTML='<div class="hv-ts" style="margin:4px 0 8px;">Alege de jos stupii din care ai luat rame.</div>';cuEstUpd();return;}
  box.innerHTML=_cu.hives.map(function(hid){
    var h=BM.stupi.get(hid)||{name:"—"},srcs=applied?[]:BM.cules.surse(hid),rows=_cu.rows.filter(function(r){return r.hiveId===hid;});
    var inner="";
    rows.filter(function(r){return r.inspId;}).forEach(function(r){var i=_cu.rows.indexOf(r);
      inner+='<div class="cu-src"><span>📋 Scoase la inspecția '+devFmt((BM.inspectii.get(r.inspId)||{}).date||"")+'<small>'+esc(r.type)+'</small></span><input type="number" inputmode="numeric" min="0" value="'+(r.n||"")+'" oninput="_cu.rows['+i+'].n=this.value;cuEstUpd()"></div>';});
    if(applied){rows.filter(function(r){return !r.inspId;}).forEach(function(r){var i=_cu.rows.indexOf(r);
      inner+='<div class="cu-src"><span>'+(r.src==="nest"?"🏠 Cuib":"📦 Magazie")+'<small>'+esc(r.type)+'</small></span><input type="number" inputmode="numeric" min="0" value="'+(r.n||"")+'" oninput="_cu.rows['+i+'].n=this.value;cuEstUpd()"></div>';});}
    else if(cuGrafic())inner+=cuHiveGfx(hid,srcs,rows);
    else srcs.forEach(function(sr){var r=rows.find(function(x){return x.src===sr.src;});var i=r?_cu.rows.indexOf(r):-1;
      inner+='<div class="cu-src"><span>'+sr.nume+'<small>'+sr.info+' · '+esc(sr.type)+'</small></span>'
        +'<div class="cu-stp"><button type="button" onclick="cuSrcN(\''+hid+'\',\''+sr.src+'\',-1)">−</button><input type="number" inputmode="numeric" min="0" max="'+sr.max+'" value="'+(r&&r.n?r.n:"")+'" placeholder="0" oninput="cuSrcSet(\''+hid+'\',\''+sr.src+'\',this.value,this)"><button type="button" onclick="cuSrcN(\''+hid+'\',\''+sr.src+'\',1)">+</button></div>'
        +'<small class="cu-max">din '+sr.max+'</small></div>';});
    if(!applied&&!srcs.length&&!rows.length)inner+='<div class="hv-ts">Stupul n-are rame cu miere notate (nici magazie, nici în cuib).</div>';
    return'<div class="cu-hive"><div class="cu-hh"><b>'+esc(h.name)+'</b><button type="button" class="bx-x" onclick="cuHiveRm(\''+hid+'\')" aria-label="Scoate stupul">✕</button></div>'+inner+'</div>';
  }).join("");
  cuEstUpd();
}
// ── 🖼️ the hive drawn: every super and brood box as a row of frames; tap the honey frames you took ──
function cuGrafic(){return D.settings.culesGrafic!==false;}
function cuSel(hid,src){_cu.sel=_cu.sel||{};var k=hid+"|"+src;if(!_cu.sel[k])_cu.sel[k]=[];return _cu.sel[k];}
function cuHiveGfx(hid,srcs,rows){
  var h=BM.stupi.get(hid);if(!h)return"";var html="",byS={};srcs.forEach(function(x){byS[x.src]=x;});
  var slots=function(src,order,cnt,size,honeyKey){var arr=[];order.forEach(function(k){for(var x=0;x<(cnt[k]||0);x++)arr.push(k);});
    var n=Math.max(size,arr.length),sel=cuSel(hid,src),out="",hi=0;
    for(var j=0;j<n;j++){var k=arr[j]||"";
      if(k===honeyKey){var q=hi++,on=sel.indexOf(q)>=0;out+='<button type="button" class="bx-s k-'+k+(on?" tk":"")+'" onclick="cuTap(\''+hid+'\',\''+src+'\','+q+')" aria-label="'+(on?"luată":"ramă cu miere")+'">'+(on?"✓":"")+'</button>';}
      else out+='<span class="bx-s '+(k?"k-"+k:"")+' dis"></span>';}
    return'<div class="bx-sl" style="grid-template-columns:repeat('+Math.min(n,12)+',1fr)">'+out+'</div>';};
  var ms=h.mags||[];
  for(var i=ms.length-1;i>=0;i--){var m=ms[i],sr=byS["mag:"+i];if(!sr)continue;magNorm(m,10);var sel=cuSel(hid,"mag:"+i);
    html+='<div class="bx-box m cu-gb"><div class="bx-h"><b>📦 Magazia '+(i+1)+'</b><span class="hv-ts">'+m.f+' rame'+(m.cap?' · '+m.cap+'% căpăcit':'')+'</span><span class="cu-tkn">'+(sel.length?'<b>'+sel.length+'</b> luate':'atinge ramele luate')+'</span></div>'
      +slots("mag:"+i,["h","e","n"],{h:m.h,e:m.e,n:m.n},m.size||10,"h")+'</div>';}
  var nf=hvNestF(h),sz=hvCap1(h),nest=byS["nest"];
  for(var b=nf.length-1;b>=0;b--){var F=nf[b];var selN=cuSel(hid,"nest");
    html+='<div class="bx-box n cu-gb"><div class="bx-h"><b>🏠 '+(nf.length>1?"Cuibul "+(b+1):"Cuib")+'</b><span class="hv-ts">'+((parseInt(F.b)||0)+(parseInt(F.f)||0)+(parseInt(F.e)||0)+(parseInt(F.n)||0))+'/'+(F.size||sz)+'</span>'+(b===nf.length-1&&nest?'<span class="cu-tkn">'+(selN.length?'<b>'+selN.length+'</b> luate':'')+'</span>':'')+'</div>'
      +(nest?cuNestSlots(hid,nf,b,F.size||sz):'<div class="hv-ts">fără rame cu miere</div>')+'</div>';}
  html+='<div class="bx-pal cu-leg"><span class="bx-p k-h"><i></i>Miere — atinge ca s-o iei</span><span class="bx-p k-b"><i></i>Puiet</span><span class="bx-p k-e"><i></i>Clădită</span><span class="bx-p k-n"><i></i>Nouă</span></div>';
  return html;
}
// nest boxes share one source ("nest"): honey frames are numbered across the boxes, bottom box first
function cuNestSlots(hid,nf,b,size){
  var before=0;for(var k=0;k<b;k++)before+=parseInt(nf[k].f)||0;
  var F=nf[b],arr=[],order=["b","f","e","n"];order.forEach(function(k){for(var x=0;x<(parseInt(F[k])||0);x++)arr.push(k);});
  var n=Math.max(size,arr.length),sel=cuSel(hid,"nest"),out="",hi=before;
  for(var j=0;j<n;j++){var k=arr[j]||"";
    if(k==="f"){var q=hi++,on=sel.indexOf(q)>=0;out+='<button type="button" class="bx-s k-f'+(on?" tk":"")+'" onclick="cuTap(\''+hid+'\',\'nest\','+q+')">'+(on?"✓":"")+'</button>';}
    else out+='<span class="bx-s '+(k?"k-"+k:"")+' dis"></span>';}
  return'<div class="bx-sl" style="grid-template-columns:repeat('+Math.min(n,12)+',1fr)">'+out+'</div>';
}
window.cuTap=function(hid,src,q){var sel=cuSel(hid,src),i=sel.indexOf(q);if(i>=0)sel.splice(i,1);else sel.push(q);
  var r=cuSrcRow(hid,src);r.n=sel.length;cuRowsDraw();};
window.cuHiveAdd=function(hid){if(_cu.hives.indexOf(hid)<0)_cu.hives.push(hid);cuRowsDraw();};
window.cuHiveRm=function(hid){_cu.hives=_cu.hives.filter(function(x){return x!==hid;});Object.keys(_cu.sel||{}).forEach(function(k){if(k.indexOf(hid+'|')===0)delete _cu.sel[k];});_cu.rows=_cu.rows.filter(function(r){return r.hiveId!==hid;});cuRowsDraw();};
function cuSrcRow(hid,src){var r=_cu.rows.find(function(x){return x.hiveId===hid&&x.src===src;});if(!r){var sr=BM.cules.surse(hid).find(function(x){return x.src===src;});r={hiveId:hid,n:0,type:sr?sr.type:"Dadant 1/2 (magazie)",src:src};_cu.rows.push(r);}return r;}
window.cuSrcSet=function(hid,src,v,inp){var sr=BM.cules.surse(hid).find(function(x){return x.src===src;}),max=sr?sr.max:0,n=parseInt(v)||0;
  if(n>max){n=max;if(inp)inp.value=max;toast("Doar "+max+" rame sunt în "+(sr?sr.nume.replace(/^\S+ /,""):"sursă")+".","⚠️");}
  if(n<0)n=0;cuSrcRow(hid,src).n=n;cuEstUpd();};
window.cuSrcN=function(hid,src,d){var r=cuSrcRow(hid,src),sr=BM.cules.surse(hid).find(function(x){return x.src===src;}),max=sr?sr.max:0;r.n=Math.max(0,Math.min(max,(parseInt(r.n)||0)+d));cuRowsDraw();};
window.cuEstUpd=function(){
  var el=$q("cuEst");if(!el)return;var c=($q("cuC")||{}).value;if(c==="__new")c="altul";
  var rows=_cu.rows.filter(function(r){return parseInt(r.n)>0;}),e=BM.cules.estimare(c,rows),kg=parseFloat(($q("cuKg")||{}).value);
  if(!e.rame){el.innerHTML="";return;}
  if(kg>0){var sp=BM.cules.impartire({cules:c,rows:rows,kg:kg});
    el.innerHTML='<div class="al alo">⚖️ <b>'+kg+' kg</b> din '+e.rame+' rame = <b>'+(kg/e.rame).toFixed(2)+' kg / ramă</b> · pe stupi: '+cuSplitTxt(sp)+(Math.abs(kg-e.kg)>0.5?'<br><span class="hv-ts">Estimarea era ~'+e.kg+' kg — aplicația își ajustează kg pe ramă după salvare.</span>':'')+'</div>';}
  else el.innerHTML='<div class="al ali">🔮 Estimat: <b>~'+e.kg+' kg</b> din '+e.rame+' rame <span class="hv-ts">('+rows.map(function(r){var s=BM.cules.estRama(c,r.type);return r.n+" × "+s.kg+" kg"+(s.sursa==="cules"?" (învățat)":s.sursa==="tip"?" (învățat, alt cules)":s.sursa==="setare"?" (valoarea ta)":" (standard)");}).join(" · ")+')</span></div>';
};
function cuSplitTxt(sp){var by={};sp.stupi.forEach(function(r){by[r.nume]=(by[r.nume]||0)+r.kg;});return Object.keys(by).map(function(k){return esc(k)+" "+(+by[k].toFixed(1))+" kg";}).join(" · ");}
window.cuSave=function(){
  var c=($q("cuC")||{}).value,rows=_cu.rows.filter(function(r){return r.hiveId&&parseInt(r.n)>0;});
  if(c==="__new"){c=(($q("cuCn")||{}).value||"").trim();if(!c){toast("Scrie numele culesului.","🌸");return;}}
  if(!rows.length){toast("Pune cel puțin un stup cu rame.","🧱");return;}
  // never more than the hive has
  for(var i=0;i<rows.length;i++){var r=rows[i];if(r.src){var sr=BM.cules.surse(r.hiveId).find(function(x){return x.src===r.src;});if(!_cu.exId&&(!sr||parseInt(r.n)>sr.max)){toast((BM.stupi.nume(r.hiveId))+": doar "+(sr?sr.max:0)+" rame disponibile.","⚠️");return;}}}
  var isNew=!_cu.exId,e={id:_cu.exId||null,date:($q("cuDt")||{}).value||todayISO(),cules:c,rows:rows,kg:($q("cuKg")||{}).value,note:($q("cuNt")||{}).value||"",fromInsp:_cu.from.filter(function(i){return rows.some(function(r){return r.inspId===i;});})};
  if(isNew){var touched=BM.cules.aplica(e,_cu.inapoi);}
  var saved=BM.cules.salveaza(e);closeM();_cu.tab="list";renderCules();
  toast((saved.kg!=null?"Extracție salvată: "+saved.kg+" kg împărțite pe "+_cu.hives.length+" stupi.":"Extracție salvată — pune kg după stors.")+(isNew&&touched&&touched.length?" Ramele au fost scoase din "+touched.length+(touched.length===1?" stup.":" stupi."):""),"🍯");
};
// quick: enter the kg of a pending extraction
window.cuKgM=function(id){var e=BM.cules.get(id);if(!e)return;var sp=BM.cules.impartire(e);
  openM('<div class="mt">⚖️ Kg miere · '+esc(BM.cules.numeCules(e.cules))+' · '+devFmt(e.date)+'</div>'
    +'<p class="bk-p">'+sp.rame+' rame din '+sp.stupi.length+' stupi · estimat ~'+sp.kg+' kg</p>'
    +L("Kg în total, după stors")+'<input type="number" inputmode="decimal" step="0.1" min="0" id="cuKg2" autofocus>'
    +'<div class="br" style="margin-top:14px;"><button class="btn" onclick="cuKgSave(\''+id+'\')">💾 Salvează</button><button class="btn gh" onclick="closeM()">Anulează</button></div>');
};
window.cuKgSave=function(id){var e=BM.cules.get(id),v=parseFloat(($q("cuKg2")||{}).value);if(!e||!(v>0)){toast("Pune kilogramele.","⚖️");return;}
  var pred=e.pred;BM.cules.salveaza(Object.assign(e,{kg:v}));closeM();renderCules();
  toast(pred?"Salvat. Estimat ~"+pred+" kg, real "+v+" kg — kg pe ramă actualizat.":"Salvat: "+v+" kg.","🍯");};
window.cuDel=function(id){showConfirm("Ștergi această extracție?",function(){BM.cules.sterge(id);renderCules();});};
// 🍯 small badge for the hive card: this year's honey
function cuHiveBadge(h){var y=String(new Date().getFullYear()),k=BM.cules.kgStup(h.id,y);if(!k.kg)return"";return'<span class="bg gy" title="Miere extrasă în '+y+'">🍯 '+y+': '+(k.estimat?"~":"")+k.kg+' kg</span>';}
