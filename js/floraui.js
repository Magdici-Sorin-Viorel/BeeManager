// BeeManager Pro — floraui.js
// 🌼 Flora — what the user sees and edits (the calculations are in flora.js / BM.flora):
//   • the place switch on the Calendar (🏠 Acasă · 🚚 trips) and „Ce se schimbă aici” for a migration site
//   • „Toate plantele”: the whole Romanian list with search — add / remove from „flora mea”, edit dates, add a plant
//   • the place of a migration (relief, altitude, GPS) in the trip form and the bloom forecast on the trip card

function flDM(yr,dn){var d=new Date(yr,0,dn);return d.getDate()+"."+String(d.getMonth()+1).padStart(2,"0");}
function flCtxLbl(c){return(c.tip==="home"?"🏠 ":"🚚 ")+esc(c.nume)+' <span class="hv-dim">'+c.ico+' '+c.reliefNume+(c.alt!=null?' · '+Math.round(c.alt)+' m':'')+'</span>';}

// ── place switch (only when there is more than one place) ──
function flCtxChipsHTML(){
  var sites=BM.flora.vetre(),cur=BM.flora.context();
  if(sites.length<2)return"";
  return'<div class="fl-ctx">'+sites.map(function(c){return'<button class="gen-chip'+(c.id===cur.id?" on":"")+'" onclick="flPick(\''+c.id+'\')">'+flCtxLbl(c)+'</button>';}).join("")+'</div>';
}
window.flPick=function(id){BM.flora.alegeContext(id);render();};

// ── the note under the calendar: where the dates are computed for ──
function flLocNoteHTML(){
  var c=BM.flora.context(),W=BM.flora.vreme.corectie(c);
  var where=c.lat!=null?(c.coords?c.lat.toFixed(2)+'°N, '+c.lon.toFixed(2)+'°E':'poziție aproximativă'):'locație necunoscută';
  return'<div class="cl-loc">📍 <b>'+(c.tip==="home"?"Acasă":esc(c.nume))+'</b> · '+c.ico+' '+c.reliefNume+(c.alt!=null?' ('+Math.round(c.alt)+' m)':' (altitudine necunoscută)')+' · '+where
    +' · '+(c.off?'datele sunt mutate cu <b>'+(c.off>0?"+":"")+c.off+' zile</b> față de câmpia de referință':'fără decalaj față de câmpia de referință')
    +(W&&W.shift?' · 🌡️ după temperaturi, anul acesta vegetația e cu <b>'+Math.abs(W.shift)+' zile mai '+(W.shift<0?"devreme":"târziu")+'</b>':'')
    +(c.tip==="home"&&D.userLoc&&c.lat!=null&&plKm(D.userLoc,c)>20?' · <button class="lnk" onclick="flSetHomeHere()">📍 Vatra de acasă e aici, unde sunt acum</button>':'')
    +(c.lat==null?' · Pornește locația ca datele să fie pentru zona ta.':'')+'</div>';
}
window.flSetHomeHere=function(){if(!D.userLoc)return;showConfirm("Setezi vatra de acasă la poziția de acum a telefonului?",function(){BM.flora.seteazaAcasa(D.userLoc);render();toast("Vatra de acasă a fost mutată aici","📍");},null,"Da, setează");};

// ── „Ce se schimbă aici” (a migration site compared with home) ──
function flDiffHTML(){
  var c=BM.flora.context();if(c.tip!=="trip")return"";
  var home=BM.flora.acasa(),yr=new Date().getFullYear(),cd=cdoy(),d=c.off-home.off;
  var mineH={};BM.flora.aleMele(home).forEach(function(p){mineH[p.id]=1;});
  var here=BM.flora.aleMele(c),mineC={};here.forEach(function(p){mineC[p.id]=1;});
  var apar=here.filter(function(p){return !mineH[p.id];}),lipsa=BM.flora.aleMele(home).filter(function(p){return !mineC[p.id]&&p.cat==="main";});
  if(!d&&!apar.length&&!lipsa.length)return c.coords?"":'<div class="al ali" style="font-size:.78rem;margin-bottom:12px;">📍 '+esc(c.nume)+': același relief ca acasă — aceleași plante și aceleași date. Când ajungi la vatră, apasă „📍 Sunt la vatră acum” în ✏️ pastorală ca să fie calculate pentru locul exact.</div>';
  var rows=here.filter(function(p){return p.cat==="main"||(p.cat==="pri"&&!mineH[p.id]);}).map(function(p){
    var sc=plState(p,yr,cd,c.off),sh=mineH[p.id]?BM.flora.cu(home,function(){return plState(p,yr,cd,home.off);}):null;
    return'<div class="fl-dr" role="button" onclick="calPlM(\''+p.id+'\')"><span class="fl-dn">'+p.ic+' '+esc(plantN(p))+'</span>'
      +'<span class="fl-dd"><b>'+flDM(yr,sc.s)+' – '+flDM(yr,sc.e)+'</b><small>💯 '+flDM(yr,sc.ps)+' – '+flDM(yr,sc.pe)+'</small></span>'
      +'<span class="fl-dh">'+(sh?'acasă '+flDM(yr,sh.s):'<span class="bg gg">doar aici</span>')+'</span></div>';}).join("");
  return'<div class="c fl-diff"><div class="ct">🚚 Ce se schimbă la '+esc(c.nume)+'</div>'
    +'<p class="hv-ts" style="margin:2px 0 8px;line-height:1.5;">'+c.ico+' '+cap(c.reliefNume)+(c.alt!=null?', ~'+Math.round(c.alt)+' m':'')
    +(d?': înfloritul vine cu <b>'+Math.abs(d)+' zile mai '+(d>0?"târziu":"devreme")+'</b> decât acasă':': aceleași date ca acasă')+'.'
    +(apar.length?' Apar aici: <b>'+apar.slice(0,6).map(function(p){return esc(plantN(p));}).join(", ")+(apar.length>6?'…':'')+'</b>.':'')
    +(lipsa.length?' Nu contează aici: '+lipsa.map(function(p){return esc(plantN(p));}).join(", ")+'.':'')+'</p>'
    +(rows?'<div class="fl-dl">'+rows+'</div>':'')
    +(c.coords?'':'<p class="hv-ts" style="margin:8px 0 0;">📍 Locul e cunoscut doar după relief. Când ajungi la vatră, apasă „📍 Sunt la vatră” în ✏️ pastorală — datele se calculează pentru locul exact.</p>')+'</div>';
}

// ═══════════════════════════════════════════
// 🌍 ALL PLANTS — search, flora mea, edit
// ═══════════════════════════════════════════
var _flMan={q:"",f:"all"};
function flManRowsHTML(){
  var c=BM.flora.context(),yr=new Date().getFullYear(),q=_flMan.q.trim().toLowerCase(),nrm=function(x){return String(x||"").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"");};
  var qn=nrm(q);
  var l=BM.flora.catalog().filter(function(p){
    var mine=flIsMine(p,c);
    if(_flMan.f==="mine"&&!mine)return false;if(_flMan.f==="rest"&&mine)return false;
    return !qn||nrm(p.n).indexOf(qn)>=0||nrm(p.lat).indexOf(qn)>=0||nrm(p.ne).indexOf(qn)>=0||nrm(p.z).indexOf(qn)>=0;})
    .sort(function(a,b){return plDoy(yr,a.b[0],a.b[1],0)-plDoy(yr,b.b[0],b.b[1],0);});
  if(!l.length)return'<div class="al ali">Nicio plantă găsită.</div>';
  return l.map(function(p){var mine=flIsMine(p,c),s=plDoy(yr,p.b[0],p.b[1],c.off),e=plDoy(yr,p.b[2],p.b[3],c.off);
    return'<div class="fl-row'+(mine?" on":"")+'"><button class="fl-star" aria-label="'+(mine?"Scoate din flora mea":"Pune în flora mea")+'" onclick="flToggle(\''+p.id+'\')">'+(mine?"★":"☆")+'</button>'
      +'<div class="fl-rb" role="button" onclick="flEditM(\''+p.id+'\')"><b>'+p.ic+' '+esc(plantN(p))+(p.cat==="main"?' <span class="bg gy">cules principal</span>':'')+(p.custom?' <span class="bg gb">a mea</span>':p.edited&&(p.b!==undefined)&&flIsEdited(p)?' <span class="bg gb">modificată</span>':'')+'</b>'
      +'<span>🌸 '+flDM(yr,s)+' – '+flDM(yr,e)+' · 🍯'+"●".repeat(p.nec||0)+"○".repeat(3-(p.nec||0))+' · '+(p.zn||"cdm").split("").map(function(k){return FL_RELIEF[k]?FL_RELIEF[k].ic:"";}).join("")+'</span></div>'
      +'<span class="hv-arr">✏️</span></div>';}).join("");
}
function flIsEdited(p){var r=BM.tabel("flora").rand(p.id);return !!r&&Object.keys(r).some(function(k){return k!=="id"&&k!=="mine"&&k!=="hide"&&k!=="custom";});}
window.flManM=function(){
  var c=BM.flora.context(),n=BM.flora.aleMele(c).length,tot=BM.flora.catalog().length;
  openM('<div class="mt">🌍 Toate plantele</div>'
    +'<div class="hv-ts" style="margin-bottom:8px;line-height:1.5;">★ = în <b>flora mea</b> pentru '+c.ico+' '+c.reliefNume+' — doar ele apar în calendar ('+n+' din '+tot+'). Apasă ☆ ca să adaugi o plantă pe care o ai în zonă, sau pe plantă ca să-i schimbi datele.</div>'
    +'<input type="search" class="hv-search" id="flQ" placeholder="🔍 Caută: tei, salcie, Robinia…" value="'+esc(_flMan.q)+'" oninput="_flMan.q=this.value;flManDraw()">'
    +'<div class="tv-tabs gen-sort" style="margin:8px 0;">'+[["all","Toate ("+tot+")"],["mine","★ Flora mea ("+n+")"],["rest","☆ Restul"]].map(function(x){return'<button class="tv-tab'+(_flMan.f===x[0]?" on":"")+'" onclick="_flMan.f=\''+x[0]+'\';flManM()">'+x[1]+'</button>';}).join("")+'</div>'
    +'<div id="flList" class="fl-list">'+flManRowsHTML()+'</div>'
    +'<div class="br" style="margin-top:12px;"><button class="btn" onclick="flEditM()">➕ Plantă nouă</button><button class="btn gh" onclick="closeM();render()">Închide</button></div>');
};
window.flManDraw=function(){var el=document.getElementById("flList");if(el)el.innerHTML=flManRowsHTML();};
window.flToggle=function(id){var c=BM.flora.context();BM.flora.seteazaAMea(id,!BM.flora.eAMea(id,c),c);flManDraw();};

// edit / new plant. Dates are shown as they fall at the current place and saved back as reference-plain dates.
function flMD(yr,m,d,off){var x=new Date(yr,m-1,d+off);return yr+"-"+String(x.getMonth()+1).padStart(2,"0")+"-"+String(x.getDate()).padStart(2,"0");}
window.flEditM=function(id){
  var p=id?BM.flora.get(id):null,c=BM.flora.context(),yr=new Date().getFullYear(),off=c.off;
  var b=p?p.b:[5,1,5,31],pk=p?p.pk:[5,8,5,25],zn=p?(p.zn||"cdm"):c.relief;
  var num=function(idn,v){return'<select id="'+idn+'">'+[0,1,2,3].map(function(n){return'<option value="'+n+'"'+(n===v?" selected":"")+'>'+["0 — deloc","1 — puțin","2 — bun","3 — foarte bun"][n]+'</option>';}).join("")+'</select>';};
  openM('<div class="mt">'+(p?'✏️ '+p.ic+' '+esc(plantN(p)):'➕ Plantă nouă')+'</div>'
    +'<div class="r2"><div>'+L("Nume")+'<input id="feN" value="'+esc(p?p.n:"")+'" placeholder="ex: Rapiță de toamnă"></div>'
    +'<div>'+L("Iconiță")+'<input id="feI" value="'+esc(p?p.ic:"🌼")+'" maxlength="4" style="max-width:90px;"></div></div>'
    +L("Categorie")+'<select id="feC">'+[["main","🌼 Cules principal"],["pri","★ Secundar prioritar"],["sec","Secundar"]].map(function(x){return'<option value="'+x[0]+'"'+((p?p.cat:"sec")===x[0]?" selected":"")+'>'+x[1]+'</option>';}).join("")+'</select>'
    +'<div class="fg"><div class="fg-t">🌸 Înflorire <span class="fg-s">cum cade la '+(c.tip==="home"?"tine acasă":esc(c.nume))+'</span></div>'
    +'<div class="r2"><div>'+L("De la")+'<input type="date" id="feB1" value="'+flMD(yr,b[0],b[1],off)+'"></div><div>'+L("Până la")+'<input type="date" id="feB2" value="'+flMD(yr,b[2],b[3],off)+'"></div></div>'
    +'<div class="r2"><div>'+L("💯 Nectar maxim de la")+'<input type="date" id="feP1" value="'+flMD(yr,pk[0],pk[1],off)+'"></div><div>'+L("până la")+'<input type="date" id="feP2" value="'+flMD(yr,pk[2],pk[3],off)+'"></div></div></div>'
    +'<div class="r2"><div>'+L("🍯 Nectar")+num("feNe",p?p.nec:2)+'</div><div>'+L("🟡 Polen")+num("fePo",p?p.pol:2)+'</div></div>'
    +L("Unde contează")+'<div class="nuc-st">'+["c","d","m"].map(function(k){return'<label><input type="checkbox" id="feZ'+k+'"'+(zn.indexOf(k)>=0?" checked":"")+'> '+FL_RELIEF[k].ic+' '+cap(FL_RELIEF[k].n)+'</label>';}).join("")+'</div>'
    +L("📍 Unde crește")+'<input id="feZt" value="'+esc(p?p.z||"":"")+'" placeholder="ex: lunca Timișului">'
    +L("📝 Note")+'<textarea id="feD" rows="2">'+esc(p?p.dc||"":"")+'</textarea>'
    +(p&&!p.custom?'<div class="hv-ts" style="margin-top:6px;"><i>'+esc(p.lat||"")+'</i>'+(flIsEdited(p)?' · <button class="lnk" onclick="flReset(\''+p.id+'\')">↩︎ Revino la datele standard</button>':'')+'</div>':'')
    +'<div class="br" style="margin-top:14px;"><button class="btn" onclick="flSave(\''+(id||"")+'\')">'+btnS()+'</button>'
    +(p&&p.custom?'<button class="btn bd" onclick="flDel(\''+p.id+'\')">🗑️ Șterge</button>':'')
    +'<button class="btn gh" onclick="flManM()">'+btnC()+'</button></div>');
};
window.flSave=function(id){
  var c=BM.flora.context(),off=c.off,n=(($q("feN")||{}).value||"").trim();
  if(!n){toast("Scrie numele plantei.","🌼");return;}
  var md=function(idn){var v=($q(idn)||{}).value;if(!v)return null;var d=new Date(v+"T12:00:00");d.setDate(d.getDate()-off);return[d.getMonth()+1,d.getDate()];};
  var b1=md("feB1"),b2=md("feB2"),p1=md("feP1"),p2=md("feP2");
  if(!b1||!b2){toast("Pune perioada de înflorire.","🌸");return;}
  var o=function(x){return x[0]*31+x[1];};
  if(o(b2)<o(b1)){toast("Sfârșitul înfloririi e înaintea începutului.","⚠️");return;}
  if(!p1||o(p1)<o(b1))p1=b1.slice();if(!p2||o(p2)>o(b2))p2=b2.slice();if(o(p2)<o(p1))p2=p1.slice();
  var zn=["c","d","m"].filter(function(k){return($q("feZ"+k)||{}).checked;}).join("")||c.relief;
  var f={n:n,ic:(($q("feI")||{}).value||"").trim()||"🌼",cat:($q("feC")||{}).value||"sec",b:b1.concat(b2),pk:p1.concat(p2),nec:($q("feNe")||{}).value,pol:($q("fePo")||{}).value,zn:zn,z:($q("feZt")||{}).value||"",dc:($q("feD")||{}).value||""};
  if(id){
    // keep only what differs from the built-in plant, so „modificată” means really changed
    var std=MELIFERE.filter(function(x){return x.id===id;})[0];
    if(std){var same=function(a,b2){return JSON.stringify(a)===JSON.stringify(b2);};var row=BM.tabel("flora").rand(id)||{id:id};
      ["n","ic","cat","b","pk","zn","z","dc"].forEach(function(k){if(same(f[k],std[k]===undefined?"":std[k]))delete row[k];else row[k]=f[k];});
      ["nec","pol"].forEach(function(k){if(parseInt(f[k])===std[k])delete row[k];else row[k]=parseInt(f[k])||0;});
      if(Object.keys(row).length===1)BM.tabel("flora").sterge(id);else BM.tabel("flora").pune(row);save(false);}
    else BM.flora.editeaza(id,f);
  }else{var nid=BM.flora.adauga(f);if(nid)BM.flora.seteazaAMea(nid,true,c);}
  toast("Plantă salvată — calendarul s-a actualizat","🌼");flManM();
};
window.flReset=function(id){var r=BM.tabel("flora").rand(id),keep=r&&r.mine?{id:id,mine:r.mine}:null;BM.flora.reseteaza(id);if(keep){BM.tabel("flora").adauga(keep);save(false);}toast("Date standard","↩︎");flEditM(id);};
window.flDel=function(id){showConfirm("Ștergi planta adăugată de tine?",function(){BM.flora.sterge(id);flManM();});};

// ═══════════════════════════════════════════
// 🚚 MIGRATION — the place of a trip and what blooms there
// ═══════════════════════════════════════════
// fields in the trip form (pastorage.js): relief by hand, altitude, or the GPS position taken at the site
function flSiteFieldsHTML(ex){
  var has=ex&&ex.lat!=null,home=BM.flora.acasa(),rel=ex&&(ex.relief||(ex.alt!=null?flRelief(parseFloat(ex.alt)):null))||home.relief;
  return'<div class="fg"><div class="fg-t">📍 Unde e vatra? <span class="fg-s">calendarul și prognoza se mută după loc</span></div>'
    +'<div class="isc-seg fl-rel" id="pRelSeg">'+["c","d","m"].map(function(k){return'<button type="button" class="'+(rel===k?"on":"")+'" data-v="'+k+'" onclick="flRelPick(\''+k+'\')">'+FL_RELIEF[k].ic+' '+cap(FL_RELIEF[k].n)+'</button>';}).join("")+'</div>'
    +'<input type="hidden" id="pRel" value="'+rel+'"><input type="hidden" id="pLat" value="'+(has?ex.lat:"")+'"><input type="hidden" id="pLon" value="'+(has?ex.lon:"")+'">'
    +'<div class="r2" style="margin-top:8px;"><div>'+L("⛰️ Altitudine (m)")+'<input type="number" inputmode="numeric" id="pAlt" min="0" max="2500" value="'+esc(ex&&ex.alt!=null?ex.alt:"")+'" placeholder="~'+FL_RELIEF[rel].alt+'" oninput="flAltChg()"><span class="hint">opțional</span></div>'
    +'<div>'+L("&nbsp;")+'<button type="button" class="btn sm gh" style="width:100%;min-height:42px;" onclick="flSiteGPS()">📍 Sunt la vatră acum</button></div></div>'
    +'<div id="pSiteInfo" class="hv-ts" style="margin-top:6px;">'+(has?'✔ Poziție salvată: '+(+ex.lat).toFixed(3)+'°N, '+(+ex.lon).toFixed(3)+'°E':'Dacă nu ești încă acolo, alege relieful — poziția exactă o salvezi când ajungi.')+'</div></div>';
}
window.flRelPick=function(k){var h=$q("pRel");if(h)h.value=k;document.querySelectorAll("#pRelSeg button").forEach(function(b){b.classList.toggle("on",b.getAttribute("data-v")===k);});var a=$q("pAlt");if(a)a.placeholder="~"+FL_RELIEF[k].alt;};
window.flAltChg=function(){var v=parseFloat(($q("pAlt")||{}).value);if(!isNaN(v)){var k=flRelief(v);if(k)flRelPick(k);}};
window.flSiteGPS=function(){
  var info=document.getElementById("pSiteInfo");
  if(!navigator.geolocation){if(info)info.textContent="Telefonul nu dă poziția.";return;}
  if(info)info.textContent="📡 Caut poziția…";
  navigator.geolocation.getCurrentPosition(function(p){
    var la=p.coords.latitude,lo=p.coords.longitude;if($q("pLat"))$q("pLat").value=la;if($q("pLon"))$q("pLon").value=lo;
    if(info)info.textContent="✔ Poziție: "+la.toFixed(3)+"°N, "+lo.toFixed(3)+"°E";
    var setAlt=function(a){if(a==null||isNaN(a))return;var el=$q("pAlt");if(el&&!el.value){el.value=Math.round(a);flAltChg();}if(info)info.textContent+=" · "+Math.round(a)+" m";};
    if(p.coords.altitude!=null&&!navigator.onLine)setAlt(p.coords.altitude);
    else if(navigator.onLine)fetch("https://api.open-meteo.com/v1/elevation?latitude="+la+"&longitude="+lo).then(function(r){return r.json();}).then(function(d){setAlt(d&&d.elevation?d.elevation[0]:p.coords.altitude);}).catch(function(){setAlt(p.coords.altitude);});
  },function(){if(info)info.textContent="Nu am putut lua poziția — alege relieful de mână.";},{timeout:10000,enableHighAccuracy:true});
};
// read by savePast
function flSiteRead(o){
  var la=parseFloat(($q("pLat")||{}).value),lo=parseFloat(($q("pLon")||{}).value),al=parseFloat(($q("pAlt")||{}).value);
  o.relief=($q("pRel")||{}).value||null;o.alt=isNaN(al)?null:al;
  if(!isNaN(la)&&!isNaN(lo)){o.lat=la;o.lon=lo;}else{o.lat=null;o.lon=null;}
  return o;
}
// what blooms at the trip's place (on the trip card)
function flTripHTML(p){
  var c=flTripCtx(p),home=BM.flora.acasa(),yr=new Date().getFullYear(),cd=cdoy();
  return BM.flora.cu(c,function(){
    var mine=BM.flora.aleMele(c),nrm=function(x){return String(x||"").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"");};
    // the plant the trip is for (by the name written in „target”)
    var tg=nrm(p.target),tp=tg?BM.flora.catalog().filter(function(x){var n=nrm(x.n).split(/[ (/]/)[0];return n.length>2&&tg.indexOf(n)>=0;}).sort(function(a,b){var v=function(x){return(flIsMine(x,c)?2:0)+(x.cat==="main"?1:0);};return v(b)-v(a);})[0]:null;
    var now=mine.filter(function(x){return plState(x,yr,cd,c.off).inBloom;}).sort(function(a,b){return(b.cat==="main"?10:b.cat==="pri"?5:0)+b.nec-((a.cat==="main"?10:a.cat==="pri"?5:0)+a.nec);});
    var next=mine.map(function(x){return{p:x,st:plState(x,yr,cd,c.off)};}).filter(function(x){return x.st.until>0&&x.p.cat!=="sec";}).sort(function(a,b){return a.st.until-b.st.until;})[0];
    var d=c.off-home.off,out='<div class="fl-trip"><div class="fl-th">'+c.ico+' '+cap(c.reliefNume)+(c.alt!=null?' · ~'+Math.round(c.alt)+' m':'')+(d?' · <b>'+(d>0?"+":"−")+Math.abs(d)+' zile</b> față de acasă':'')+(c.coords?'':' · <span class="hv-dim">poziție aproximativă</span>')+'</div>';
    if(tp){var st=plState(tp,yr,cd,c.off);
      out+='<div class="fl-tl">'+tp.ic+' <b>'+esc(plantN(tp))+'</b> aici: '+flDM(yr,st.s)+' – '+flDM(yr,st.e)+' · 💯 '+flDM(yr,st.ps)+' – '+flDM(yr,st.pe)
        +' <span class="bg '+(st.inPeak?"gg":st.inBloom?"gy":"gb")+'">'+(st.inPeak?"nectar maxim":st.inBloom?(st.phase==="start"?"început":"spre final")+" · încă "+Math.max(0,st.left)+" zile":st.until>0?"în "+st.until+" zile":"s-a terminat")+'</span></div>';}
    if(now.length)out+='<div class="fl-tl">🌸 În floare acum: '+now.slice(0,5).map(function(x){return x.ic+' '+esc(plantN(x));}).join(" · ")+(now.length>5?' +'+(now.length-5):'')+'</div>';
    if(next&&(!tp||next.p.id!==tp.id))out+='<div class="fl-tl">⏭️ Urmează: '+next.p.ic+' '+esc(plantN(next.p))+' în '+next.st.until+' zile</div>';
    return out+'<button class="lnk" onclick="BM.flora.alegeContext(\''+p.id+'\');go(\'calendar\')">📅 Calendarul de la vatră ›</button></div>';
  });
}
