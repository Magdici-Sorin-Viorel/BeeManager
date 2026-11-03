// BeeManager Pro — voice.js
// 🏷️ QR codes on hives · 📷 scanning in the field · 🎙️ voice inspection (Romanian keywords → inspection form)
//
// Flow: scan the QR on a hive → the voice inspection opens for that hive → you talk freely →
// „Completează formularul” opens the normal inspection form, filled from the keywords you said
// (filled fields are marked), you check and save. The full text goes into Observații.
// No signal: dictate with the keyboard microphone (Gboard works offline with Romanian downloaded),
// or just record audio to listen to later (stored on the phone, IndexedDB).

// ═══════════════════════════════════════════
// QR CODES
// ═══════════════════════════════════════════
var QR_BASE="https://magdici-sorin-viorel.github.io/BeeManager/";
// the link inside the QR: opens the app on this hive (in-app scanner only needs the ?stup= part)
function qrUrl(h){
  var base=/github\.io$/.test(location.hostname)?location.origin+location.pathname:QR_BASE;
  return base.replace(/index\.html$/,"")+"?stup="+encodeURIComponent(h.id);
}
function qrSvg(txt){
  if(typeof qrcode!=="function")return"";
  var q=qrcode(0,"M");q.addData(txt);q.make();
  return q.createSvgTag({cellSize:4,margin:0,scalable:true});
}
function qrHives(){return D.hives.slice().sort(function(a,b){return((a.kind==="roi")-(b.kind==="roi"))||(a.num||9999)-(b.num||9999)||String(a.name).localeCompare(String(b.name));});}
// Settings card
function qrCardHTML(){
  var hs=qrHives(),nS=hs.filter(function(h){return h.kind!=="roi";}).length,nR=hs.length-nS;
  return'<div class="c" style="margin-bottom:14px;"><div class="ct">🏷️ Etichete QR</div>'
    +'<p class="bk-p">Câte o etichetă cu cod QR pentru fiecare stup sau roi. O lipești pe stup (ideal plastifiată sau sub bandă lată transparentă). Pe teren apeși <b>📷</b> sus, scanezi și se deschide direct <b>inspecția vocală</b> pentru stupul acela.</p>'
    +'<div class="r2"><div>'+L("🏠 Pentru")+'<select id="qrWho"><option value="all">Toți ('+hs.length+')</option><option value="st">Doar stupii ('+nS+')</option><option value="roi">Doar roiurile ('+nR+')</option>'
    +hs.map(function(h){return'<option value="'+h.id+'">'+(h.kind==="roi"?"🐝 ":"🏠 ")+esc(h.name)+'</option>';}).join("")+'</select></div>'
    +'<div>'+L("📐 Mărime")+'<select id="qrSz"><option value="L">Mari — 6 pe pagină</option><option value="M" selected>Medii — 12 pe pagină</option><option value="S">Mici — 24 pe pagină</option></select></div></div>'
    +'<button class="btn" style="width:100%;margin-top:10px;" onclick="qrPrint()">🖨️ Salvează PDF / Printează etichetele</button>'
    +'<button class="btn gh" style="width:100%;margin-top:8px;" onclick="qrScan()">📷 Încearcă scanarea</button>'
    +'<p style="font-size:.72rem;color:var(--mut);margin:8px 0 0;line-height:1.45;">Codul conține adresa aplicației cu stupul respectiv, deci merge și cu camera obișnuită a telefonului. Dacă ștergi un stup și faci altul, printează-i o etichetă nouă.</p></div>';
}
window.qrPrint=function(){
  var who=($q("qrWho")||{}).value||"all",sz=($q("qrSz")||{}).value||"M";
  var hs=qrHives().filter(function(h){return who==="all"||(who==="st"?h.kind!=="roi":who==="roi"?h.kind==="roi":h.id===who);});
  if(!hs.length){toast("Nu e niciun stup de pus pe etichete.","⚠️");return;}
  var old=document.getElementById("qrPrint");if(old)old.remove();
  var box=document.createElement("div");box.id="qrPrint";box.className="fs-ov";
  box.innerHTML='<div class="fs-bar"><b>🏷️ Etichete QR ('+hs.length+')</b>'
    +'<button class="btn" onclick="qrDoPrint()">🖨️ Salvează PDF / Printează</button>'
    +'<button class="btn gh" onclick="qrClose()">✕ Închide</button></div>'
    +'<div class="qr-sheet qr-'+sz+'">'+hs.map(function(h){
      return'<div class="qr-lb"><div class="qr-code">'+qrSvg(qrUrl(h))+'</div>'
        +'<div class="qr-tx"><b>'+esc(h.name)+'</b><span>'+(h.kind==="roi"?"🐝 Roi":"🏠 Stup")+(h.num?" nr. "+esc(h.num):"")+'</span>'
        +(h.loc?'<span>'+esc(h.loc)+'</span>':'')+'<i>BeeManager · scanează 📷</i></div></div>';}).join("")+'</div>';
  document.body.appendChild(box);
};
window.qrClose=function(){var b=document.getElementById("qrPrint");if(b)b.remove();};
window.qrDoPrint=function(){
  var title=document.title;document.title="Etichete_QR_stupi";
  var back=function(){document.title=title;window.removeEventListener("afterprint",back);};
  window.addEventListener("afterprint",back);
  var t0=Date.now();
  setTimeout(function(){try{window.print();}catch(e){}
    if(Date.now()-t0<400)toast("Printarea nu e permisă aici — etichetele le salvezi ca PDF din aplicația instalată (telefon / GitHub).","ℹ️");},120);
};

// ═══════════════════════════════════════════
// 📷 SCANNER
// ═══════════════════════════════════════════
var _qs=null;   // {stream, timer, det}
function qrIdFrom(txt){
  if(!txt)return null;
  var m=String(txt).match(/[?&#]stup=([^&#\s]+)/);
  var id=m?decodeURIComponent(m[1]):(/^BMP:/.test(txt)?txt.slice(4):null);
  return id&&D.hives.some(function(h){return h.id===id;})?id:(id?"?":null);
}
window.qrScan=function(){
  if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia){toast("Telefonul nu permite camera aici. Deschide aplicația instalată.","⚠️");return;}
  qrStop();
  var ov=document.createElement("div");ov.id="qrScan";ov.className="qs-ov";
  ov.innerHTML='<video id="qsV" playsinline muted></video><div class="qs-frame"><i></i><i></i><i></i><i></i></div>'
    +'<div class="qs-top"><b>📷 Scanează codul de pe stup</b><button onclick="qrStop()" aria-label="Închide">✕</button></div>'
    +'<div class="qs-bot"><div id="qsMsg">Ține telefonul la 20–30 cm de etichetă.</div>'
    +'<button class="btn gh" onclick="qrStop(true);qrPick()">🏠 Aleg stupul din listă</button></div>';
  document.body.appendChild(ov);
  mHistPush("modal");   // Back closes the scanner
  navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:"environment"},width:{ideal:1280}},audio:false}).then(function(st){
    if(!document.getElementById("qrScan")){st.getTracks().forEach(function(t){t.stop();});return;}
    _qs={stream:st,timer:null,det:null,busy:false};
    var v=document.getElementById("qsV");v.srcObject=st;v.play();
    var useDet=("BarcodeDetector" in window);
    var startLoop=function(){_qs.timer=setInterval(qrTick,220);};
    if(useDet){
      BarcodeDetector.getSupportedFormats().then(function(f){
        if(f.indexOf("qr_code")>=0){_qs.det=new BarcodeDetector({formats:["qr_code"]});startLoop();}else qrLoadJsQR(startLoop);
      }).catch(function(){qrLoadJsQR(startLoop);});
    }else qrLoadJsQR(startLoop);
  }).catch(function(e){
    var m=document.getElementById("qsMsg");
    if(m)m.innerHTML="⚠️ Nu am acces la cameră. Permite camera pentru aplicație (lacătul de lângă adresă → Permisiuni) sau alege stupul din listă.";
  });
};
function qrLoadJsQR(cb){
  if(typeof jsQR==="function"){cb();return;}
  var s=document.createElement("script");s.src="lib/jsQR.js";s.onload=cb;
  s.onerror=function(){var m=document.getElementById("qsMsg");if(m)m.textContent="⚠️ Scanerul nu s-a putut încărca.";};
  document.head.appendChild(s);
}
function qrTick(){
  if(!_qs||_qs.busy)return;
  var v=document.getElementById("qsV");if(!v||v.readyState<2)return;
  _qs.busy=true;
  var done=function(txt){if(_qs)_qs.busy=false;if(txt)qrFound(txt);};
  if(_qs.det){_qs.det.detect(v).then(function(c){done(c&&c[0]?c[0].rawValue:null);}).catch(function(){done(null);});return;}
  try{
    var w=480,h=Math.round(v.videoHeight*w/v.videoWidth)||360;
    var cv=_qs.cv||(_qs.cv=document.createElement("canvas"));cv.width=w;cv.height=h;
    var cx=cv.getContext("2d",{willReadFrequently:true});cx.drawImage(v,0,0,w,h);
    var r=jsQR(cx.getImageData(0,0,w,h).data,w,h,{inversionAttempts:"dontInvert"});
    done(r?r.data:null);
  }catch(e){done(null);}
}
function qrFound(txt){
  var id=qrIdFrom(txt);
  if(!id)return;
  if(id==="?"){var m=document.getElementById("qsMsg");if(m)m.innerHTML="⚠️ Codul e de la un stup care nu mai există în aplicație.";return;}
  try{navigator.vibrate&&navigator.vibrate(80);}catch(e){}
  qrStop(true);
  vcOpen(id);
}
window.qrStop=function(keepHist){
  if(_qs){clearInterval(_qs.timer);try{_qs.stream.getTracks().forEach(function(t){t.stop();});}catch(e){}_qs=null;}
  var ov=document.getElementById("qrScan");
  if(ov){ov.remove();if(keepHist!==true&&typeof mHistPop==="function")mHistPop("modal");}
};
// fallback: pick the hive from a list (no label / camera refused)
window.qrPick=function(){
  var hs=qrHives();
  openM('<div class="mt">🎙️ Inspecție vocală — alege stupul</div>'
    +'<div class="qp-list">'+hs.map(function(h){return'<button class="qp-it" onclick="vcOpen(\''+h.id+'\')">'+(h.kind==="roi"?"🐝":"🏠")+' <b>'+esc(h.name)+'</b></button>';}).join("")+'</div>');
};
// app opened from a QR link (phone camera): …/?stup=ID
function qrFromUrl(){
  var m=location.search.match(/[?&]stup=([^&#]+)/);if(!m)return;
  var id=decodeURIComponent(m[1]);
  try{history.replaceState(null,"",location.pathname+location.hash);}catch(e){}
  if(D.hives.some(function(h){return h.id===id;}))setTimeout(function(){vcOpen(id);},350);
  else setTimeout(function(){toast("Codul scanat e de la un stup care nu există în aplicație.","⚠️");},400);
}

// ═══════════════════════════════════════════
// 🎙️ VOICE INSPECTION
// ═══════════════════════════════════════════
var _vc={rec:null,on:false,hid:null,last:"",local:false,wl:null,mr:null,chunks:[],t0:0};
function vcSR(){return window.SpeechRecognition||window.webkitSpeechRecognition||null;}
window.vcOpen=function(hid){
  var h=D.hives.find(function(x){return x.id===hid;});if(!h)return;
  vcStopAll();
  _vc.hid=hid;_vc.last="";
  var SR=vcSR(),on=navigator.onLine;
  var lastI=hvInsps(hid)[0];
  openM('<div class="mt">🎙️ Inspecție vocală — '+esc(h.name)+'</div>'
    +'<div class="hv-ts" style="margin:-4px 0 10px;">'+(lastI?'Ultima inspecție: '+devFmt(lastI.date):'Nicio inspecție până acum')+'</div>'
    +'<div id="vcStat" class="vc-stat"></div>'
    +'<div class="vc-micw"><button id="vcMic" class="vc-mic" onclick="vcToggle()" aria-label="Pornește / oprește"><span>🎙️</span></button>'
    +'<div id="vcMicL" class="vc-micl">Apasă și vorbește</div></div>'
    +'<textarea id="vcTx" rows="5" class="vc-tx" oninput="vcPrev();vcDraftSave()" placeholder="Vorbește liber, de exemplu: „matca văzută, ouă și larve, puiet compact pe 6 rame, 3 rame cu miere, albine blânde, două botci tăiate, are nevoie de magazie”"></textarea>'
    +'<div id="vcInt" class="vc-int"></div>'
    +'<div id="vcChips" class="vc-chips"></div>'
    +'<div class="br" style="margin-top:12px;"><button class="btn" onclick="vcFill()">✅ Completează formularul</button>'
    +'<button class="btn gh" onclick="vcStopAll();inspM(\''+hid+'\')">✍️ Manual</button></div>'
    +'<details class="vc-det"><summary>❔ Ce cuvinte înțelege aplicația</summary>'+vcHelpHTML()+'</details>'
    +'<details class="vc-det" id="vcAudD"><summary>🎧 Fără semnal: înregistrare audio <span id="vcAudN"></span></summary>'
    +'<p class="hv-ts" style="margin:6px 0 8px;">Înregistrarea se păstrează pe telefon ca să o asculți mai târziu (de ex. acasă, apoi apeși 🎙️ și repeți pe scurt). În timp ce înregistrează audio, dictarea nu merge — microfonul e ocupat.</p>'
    +'<button class="btn sm gh" id="vcRecB" onclick="vcRecToggle()">⏺ Înregistrează audio</button>'
    +'<div id="vcAudL" class="vc-audl"></div></details>');
  try{_vc.local=localStorage.getItem("vcLocal")==="available";}catch(e){}
  vcStatus();vcAudList();
  // what you said earlier for this hive and did not save yet (app closed, phone locked…) comes back
  var dr=vcDraftGet(hid);
  if(dr&&dr.txt){var tx=document.getElementById("vcTx");tx.value=dr.txt;vcPrev();
    var d=new Date(dr.ts),st=document.getElementById("vcStat");
    if(st)st.insertAdjacentHTML("afterend",'<div class="vc-draft">↺ Am păstrat ce ai spus la '+String(d.getHours()).padStart(2,"0")+':'+String(d.getMinutes()).padStart(2,"0")+(d.toDateString()!==new Date().toDateString()?' ('+devFmt(dr.ts.slice(0,10))+')':'')+'. Continui de unde ai rămas. <button class="lnk" onclick="vcDraftClear(_vc.hid);document.getElementById(\'vcTx\').value=\'\';vcPrev();this.parentNode.remove()">Încep din nou</button></div>');}
};
// ── draft: the text is saved on the phone after every phrase, until the inspection is saved ──
function vcDraftGet(hid){try{var d=JSON.parse(localStorage.getItem("vcDraft_"+hid)||"null");if(d&&Date.now()-new Date(d.ts).getTime()<2*86400000)return d;}catch(e){}return null;}
function vcDraftSave(){var tx=document.getElementById("vcTx");if(!tx||!_vc.hid)return;
  try{if(tx.value.trim())localStorage.setItem("vcDraft_"+_vc.hid,JSON.stringify({txt:tx.value,ts:new Date().toISOString()}));else localStorage.removeItem("vcDraft_"+_vc.hid);}catch(e){}}
window.vcDraftClear=function(hid){try{localStorage.removeItem("vcDraft_"+hid);}catch(e){}};
// called by saveInsp (inspections.js): the voice text of this hive is now in the inspection
function vcSaved(hid){if(_vc.pend===hid){vcDraftClear(hid);_vc.pend=null;}}
function vcStatus(msg){
  var el=document.getElementById("vcStat");if(!el)return;
  var SR=vcSR(),on=navigator.onLine;
  if(msg){el.innerHTML=msg;return;}
  if(!SR){el.innerHTML='⌨️ Telefonul nu are recunoaștere vocală în aplicație. Apasă în casetă și folosește <b>🎤 de pe tastatură</b>.';el.className="vc-stat w";vcMicShow(false);return;}
  var locB=typeof SR.available==="function"&&!_vc.local?' <button class="lnk" onclick="vcLocalCheck()">Verifică dictarea offline Chrome</button>':'';
  if(!on&&!_vc.local){el.innerHTML='📴 <b>Fără semnal.</b> Apasă în casetă și vorbește cu <b>🎤 de pe tastatură</b> (Gboard merge și offline dacă ai descărcat româna: Setări Gboard → Dictare vocală → Recunoaștere offline).'+locB+'<span id="vcLoc"></span>';el.className="vc-stat w";vcMicShow(false);return;}
  el.innerHTML=(on?'🟢 Apasă 🎙️, vorbește cât vrei, apoi apasă din nou ca să oprești.':'🟢 Recunoaștere offline (Chrome). Apasă 🎙️ și vorbește.')+'<span id="vcLoc"></span>';el.className="vc-stat";vcMicShow(true);
}
function vcMicShow(v){var w=document.querySelector(".vc-micw");if(w)w.style.display=v?"flex":"none";}
window.addEventListener("online",function(){if(document.getElementById("vcTx")&&!_vc.on)vcStatus();});
window.addEventListener("offline",function(){if(document.getElementById("vcTx")&&!_vc.on)vcStatus();});
// Chrome offline speech pack for Romanian (newer Chrome only) — checked on demand, result remembered
window.vcLocalCheck=function(){
  var SR=vcSR();var el0=document.getElementById("vcLoc");
  if(!SR||typeof SR.available!=="function"){if(el0)el0.innerHTML='<br><span class="hv-ts">Chrome-ul de pe acest telefon nu are dictare offline în aplicație — folosește 🎤 de pe tastatură.</span>';return;}
  try{
    SR.available({langs:["ro-RO"],processLocally:true}).then(function(r){
      _vc.local=(r==="available");try{localStorage.setItem("vcLocal",r);}catch(e){}
      if(!navigator.onLine)vcStatus();
      var el=document.getElementById("vcLoc");if(!el)return;
      if(r==="downloadable")el.innerHTML='<br><button class="btn sm gh" style="margin-top:6px;" onclick="vcLocalInstall()">⬇️ Descarcă româna pentru dictare fără semnal (Chrome)</button>';
      else if(r==="downloading")el.innerHTML='<br><span class="hv-ts">⏳ Româna offline se descarcă…</span>';
      else if(r==="available")el.innerHTML='<br><span class="hv-ts">✅ Româna offline e instalată — merge și fără semnal.</span>';
      else el.innerHTML='<br><span class="hv-ts">Chrome nu are încă româna offline — folosește 🎤 de pe tastatură.</span>';
    }).catch(function(){});
  }catch(e){}
};
window.vcLocalInstall=function(){
  var SR=vcSR();if(!SR||typeof SR.install!=="function")return;
  var el=document.getElementById("vcLoc");if(el)el.innerHTML='<br><span class="hv-ts">⏳ Se descarcă…</span>';
  SR.install({langs:["ro-RO"],processLocally:true}).then(function(ok){
    if(ok){_vc.local=true;toast("Româna offline e instalată","✅");}else toast("Descărcarea nu a mers acum.","⚠️");vcLocalCheck();
  }).catch(function(){toast("Descărcarea nu a mers acum.","⚠️");});
};

// ── live recognition ──
window.vcToggle=function(){if(_vc.on)vcStop();else vcStart();};
function vcStart(){
  var SR=vcSR();if(!SR)return;
  if(_vc.mr){toast("Oprește întâi înregistrarea audio.","⚠️");return;}
  var r=new SR();r.lang="ro-RO";r.continuous=true;r.interimResults=true;r.maxAlternatives=1;
  if(!navigator.onLine&&_vc.local){try{r.processLocally=true;}catch(e){}}
  r.onresult=function(e){
    var tx=document.getElementById("vcTx");if(!tx){vcStop();return;}
    var interim="";
    for(var i=e.resultIndex;i<e.results.length;i++){
      var s=e.results[i][0].transcript.trim();if(!s)continue;
      if(e.results[i].isFinal)vcAppend(tx,s);else interim+=" "+s;
    }
    var iv=document.getElementById("vcInt");if(iv)iv.textContent=interim.trim();
    vcPrev();
  };
  r.onstart=function(){_vc.active=true;};
  r.onerror=function(e){
    if(e.error==="no-speech"||e.error==="aborted")return;
    if(e.error==="network"){_vc.resume=true;vcStop(true);vcStatus('📴 <b>Semnalul a căzut.</b> Ce ai spus până acum a rămas. Reiau ascultarea singur când revine semnalul — sau continuă cu <b>🎤 de pe tastatură</b>.');return;}
    if(e.error==="not-allowed"||e.error==="service-not-allowed"){vcStop();vcStatus('⚠️ Microfonul nu e permis. Permite microfonul pentru aplicație (lacătul de lângă adresă → Permisiuni) sau folosește 🎤 de pe tastatură.');return;}
    if(e.error==="language-not-supported"){vcStop();vcStatus('⚠️ Româna nu e disponibilă aici. Folosește 🎤 de pe tastatură.');return;}
  };
  // the phone stops listening after every silence → start again until you press stop (an inspection can last 30 min)
  r.onend=function(){
    _vc.active=false;
    if(_vc.on&&_vc.rec===r&&document.getElementById("vcTx"))vcRestart(r,0);
    else if(!_vc.on)vcUI(false);
  };
  _vc.rec=r;_vc.on=true;_vc.last="";_vc.resume=false;
  try{r.start();}catch(e){_vc.on=false;return;}
  if(!_vc.t0s)_vc.t0s=Date.now();
  clearInterval(_vc.tick);_vc.tick=setInterval(function(){if(!document.getElementById("vcTx")){vcStop();return;}vcUI(_vc.on);},1000);
  vcUI(true);vcWake();
}
function vcRestart(r,n){
  setTimeout(function(){
    if(!_vc.on||_vc.rec!==r||!document.getElementById("vcTx"))return;
    if(document.hidden)return;                     // screen off: resumes when you come back (visibilitychange)
    try{r.start();}catch(e){if(n<20)vcRestart(r,n+1);}
  },n?800:250);
}
function vcWake(){try{if(navigator.wakeLock&&!_vc.wl)navigator.wakeLock.request("screen").then(function(l){_vc.wl=l;l.addEventListener&&l.addEventListener("release",function(){_vc.wl=null;});}).catch(function(){});}catch(e){}}
document.addEventListener("visibilitychange",function(){
  if(document.hidden||!_vc.on||!document.getElementById("vcTx"))return;
  vcWake();if(!_vc.active&&_vc.rec)vcRestart(_vc.rec,0);
});
window.addEventListener("online",function(){if(_vc.resume&&document.getElementById("vcTx")){_vc.resume=false;vcStatus();vcStart();toast("Semnalul a revenit — ascult din nou","🎙️");}});
function vcStop(keepTimer){
  _vc.on=false;_vc.active=false;
  if(!keepTimer){clearInterval(_vc.tick);}
  if(_vc.rec){try{_vc.rec.stop();}catch(e){}_vc.rec=null;}
  if(_vc.wl){try{_vc.wl.release();}catch(e){}_vc.wl=null;}
  var iv=document.getElementById("vcInt");if(iv)iv.textContent="";
  vcUI(false);
}
function vcUI(on){
  var b=document.getElementById("vcMic"),l=document.getElementById("vcMicL");
  if(b)b.classList.toggle("on",on);
  var el=_vc.t0s?Math.round((Date.now()-_vc.t0s)/1000):0,tm=Math.floor(el/60)+":"+String(el%60).padStart(2,"0");
  if(l)l.textContent=on?"Ascult… "+tm+" · apasă ca să opresc":(el?"Oprit la "+tm+" · apasă ca să continui":"Apasă și vorbește");
}
// Android sometimes repeats a final phrase with more words → replace instead of duplicating
function vcAppend(tx,s){
  var cur=tx.value.replace(/\s+$/,""),n=vcNorm(s),ln=vcNorm(_vc.last);
  if(_vc.last&&n.indexOf(ln)===0&&cur.slice(-_vc.last.length)===_vc.last){cur=cur.slice(0,cur.length-_vc.last.length).replace(/[,\s]+$/,"");}
  else if(_vc.last&&ln.indexOf(n)===0&&ln.length>=n.length)return;
  // voice command: „gata inspecția” / „termin inspecția” → stop and fill the form (hands busy, gloves on)
  var cmd=/\b(gata|termin\w*|stop|incheie|inchei|final)\s+(cu\s+)?(inspectia|inspectie|inspectiei)\b/;
  if(cmd.test(vcNorm(s))){s=s.replace(/(gata|termin\S*|stop|[iî]ncheie|[iî]nchei|final)\s+(cu\s+)?inspec\S*/i,"").replace(/^[\s,.]+|[\s,.]+$/g,"");
    if(s){tx.value=(cur?cur+", ":"")+s;}else tx.value=cur;_vc.last="";vcDraftSave();vcStop();setTimeout(vcFill,300);return;}
  tx.value=(cur?cur+", ":"")+s;_vc.last=s;
  tx.scrollTop=tx.scrollHeight;
  vcDraftSave();
}
function vcStopAll(){vcStop();_vc.t0s=0;_vc.resume=false;if(_vc.mr)vcRecStop();}

// ── audio recording (no signal) ──
window.vcRecToggle=function(){if(_vc.mr)vcRecStop();else vcRecStart();};
function vcRecStart(){
  if(_vc.on)vcStop();
  if(!window.MediaRecorder||!navigator.mediaDevices){toast("Telefonul nu permite înregistrarea aici.","⚠️");return;}
  navigator.mediaDevices.getUserMedia({audio:true}).then(function(st){
    var mr=new MediaRecorder(st);_vc.mr=mr;_vc.chunks=[];_vc.t0=Date.now();
    mr.ondataavailable=function(e){if(e.data&&e.data.size)_vc.chunks.push(e.data);};
    mr.onstop=function(){
      st.getTracks().forEach(function(t){t.stop();});
      var blob=new Blob(_vc.chunks,{type:mr.mimeType||"audio/webm"}),dur=Math.round((Date.now()-_vc.t0)/1000);
      _vc.mr=null;vcRecUI();
      if(dur<1)return;
      audPut({id:uid(),hid:_vc.hid,ts:new Date().toISOString(),dur:dur,blob:blob}).then(function(){vcAudList();toast("Înregistrarea e salvată pe telefon","🎧");})
        .catch(function(){toast("Nu am putut salva înregistrarea.","⚠️");});
    };
    mr.start(1000);vcRecUI();
    _vc.recT=setInterval(vcRecUI,1000);
  }).catch(function(){toast("Microfonul nu e permis.","⚠️");});
}
function vcRecStop(){if(_vc.mr){try{_vc.mr.stop();}catch(e){}}clearInterval(_vc.recT);}
function vcRecUI(){
  var b=document.getElementById("vcRecB");if(!b){if(_vc.mr)vcRecStop();return;}
  if(_vc.mr){var s=Math.round((Date.now()-_vc.t0)/1000);b.innerHTML="⏹ Oprește ("+Math.floor(s/60)+":"+String(s%60).padStart(2,"0")+")";b.classList.add("rec");}
  else{b.innerHTML="⏺ Înregistrează audio";b.classList.remove("rec");clearInterval(_vc.recT);}
}
function vcAudList(){
  var el=document.getElementById("vcAudL");if(!el)return;
  audList(_vc.hid).then(function(l){
    var n=document.getElementById("vcAudN");if(n)n.innerHTML=l.length?'<span class="bg gy">'+l.length+'</span>':'';
    if(l.length&&document.getElementById("vcAudD"))document.getElementById("vcAudD").open=true;
    el.innerHTML=l.map(function(r){var d=new Date(r.ts);
      return'<div class="vc-aud"><div class="hv-ts">🎧 '+devFmt(r.ts.slice(0,10))+' '+String(d.getHours()).padStart(2,"0")+':'+String(d.getMinutes()).padStart(2,"0")+' · '+Math.floor(r.dur/60)+':'+String(r.dur%60).padStart(2,"0")+'</div>'
        +'<audio controls preload="none" src="'+URL.createObjectURL(r.blob)+'"></audio>'
        +'<button class="hv-ib" onclick="vcAudDel(\''+r.id+'\')" aria-label="Șterge">🗑️</button></div>';}).join("");
  }).catch(function(){});
}
window.vcAudDel=function(id){showConfirm("Ștergi înregistrarea?",function(){audDel(id).then(vcAudList);});};
// tiny IndexedDB store for recordings (too big for localStorage; not part of the backup file)
function audDB(){return new Promise(function(ok,ko){
  if(!window.indexedDB){ko();return;}
  var q=indexedDB.open("bmpAudio",1);
  q.onupgradeneeded=function(){var s=q.result.createObjectStore("rec",{keyPath:"id"});s.createIndex("hid","hid");};
  q.onsuccess=function(){ok(q.result);};q.onerror=function(){ko(q.error);};});}
function audPut(r){return audDB().then(function(db){return new Promise(function(ok,ko){var t=db.transaction("rec","readwrite");t.objectStore("rec").put(r);t.oncomplete=ok;t.onerror=ko;});});}
function audDel(id){return audDB().then(function(db){return new Promise(function(ok,ko){var t=db.transaction("rec","readwrite");t.objectStore("rec").delete(id);t.oncomplete=ok;t.onerror=ko;});});}
function audList(hid){return audDB().then(function(db){return new Promise(function(ok,ko){
  var q=db.transaction("rec").objectStore("rec").index("hid").getAll(hid);
  q.onsuccess=function(){ok((q.result||[]).sort(function(a,b){return a.ts<b.ts?1:-1;}));};q.onerror=ko;});});}

// ═══════════════════════════════════════════
// 🧠 KEYWORD PARSER (Romanian) → form fields
// ═══════════════════════════════════════════
function vcNorm(s){
  return String(s||"").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"")
    .replace(/ş/g,"s").replace(/ţ/g,"t").replace(/[^a-z0-9%]+/g," ").replace(/\s+/g," ").trim();
}
var VC_NUM={zero:0,unu:1,una:1,doi:2,doua:2,trei:3,patru:4,cinci:5,sase:6,sapte:7,opt:8,noua:9,zece:10,
  unsprezece:11,unspe:11,doisprezece:12,douasprezece:12,doispe:12,treisprezece:13,treispe:13,paisprezece:14,paispe:14,
  cincisprezece:15,cinspe:15,saisprezece:16,saispe:16,saptesprezece:17,saptespe:17,optsprezece:18,optspe:18,nouasprezece:19,nouaspe:19,
  douazeci:20,treizeci:30,patruzeci:40,cincizeci:50,saizeci:60,saptezeci:70,optzeci:80,nouazeci:90};
// number words → digits („douăzeci și cinci” → 25); „noua” stays a word unless followed by a counted noun
function vcDigits(s){
  s=s.replace(/\b(douazeci|treizeci|patruzeci|cincizeci|saizeci|saptezeci|optzeci|nouazeci) si (unu|una|doi|doua|trei|patru|cinci|sase|sapte|opt|noua)\b/g,function(m,a,b){return String(VC_NUM[a]+VC_NUM[b]);});
  s=s.replace(/\bnoua (rame|botci|grade|kg|kile|litri|magazii|zile|%|la suta)\b/g,"9 $1");
  s=s.replace(/\b(o|un|una) (rama|botca|magazie|singura rama|singura botca)\b/g,"1 $2");
  return s.replace(/\b[a-z]+\b/g,function(w){return w!=="noua"&&VC_NUM.hasOwnProperty(w)?String(VC_NUM[w]):w;});
}
// Speech recognition gives almost no punctuation → cut the text into short clauses at connector words,
// so a „nu” or a number only applies to its own clause.
function vcClauses(raw){
  var x=" "+vcDigits(vcNorm(String(raw||"").replace(/[,.;:!?\n]+/g," qqsep "))).replace(/\bqqsep\b/g,",")+" ";
  x=x.replace(/ (si|iar|dar|apoi|deci|plus|insa|totusi|dupa aceea|pe urma|in rest|mai departe|acum) (?!(pe )?(rama|ramele|\d)\b)/g," , $1 ");
  x=x.replace(/ (la) (?=(matca|regina|botc|potc|magazi|cat|caturi|varro|varoa|puiet|oua|hrana|mancare|spatiu|albine|familie|familia|temperament|boli|sanatate|cantar|vreme))/g," , $1 ");
  // „am pus / am adăugat / am văzut …” starts a new clause (not after a „nu”)
  x=x.replace(/(\w+) (am (?:pus|adaugat|scos|luat|dat|vazut|gasit|taiat|eliminat|hranit|montat|ridicat|observat))\b/g,function(m0,w,v){return /^(nu|n|nam|mai|le|l|o|i)$/.test(w)?m0:w+" , "+v;});
  return x.replace(/\s*,\s*(,\s*)*/g," , ").replace(/\s+/g," ");
}
function vcParse(raw,hid){
  var s=" "+vcClauses(raw).trim()+" ";
  var C=s.split(",").map(function(c){return" "+c.trim()+" ";});
  var NEG=/\b(nu|n am|nam|fara|niciun|nicio|nici|lipsa|zero)\b/;
  // frame movements are read first; their clauses are then left out (so „o ramă de puiet” is not taken as the brood count)
  var MVS=hid?vcMoves(C,hid):[];
  if(MVS.length){MVS.forEach(function(r){C[r.i]=" ";});s=" "+C.join(",")+" ";}
  var R={v:{},c:{},chips:[],post:[],extra:{}};
  var neg=function(i){return /\b(nu|n am|nam|fara|niciun|nicio|nici)\b[^,]{0,14}$/.test(s.slice(Math.max(0,i-22),i));};
  // last mention wins: during a long inspection you correct yourself („nu, de fapt 7 rame”)
  var find=function(re){var g=new RegExp(re.source,"g"),m,last=null;while((m=g.exec(s))){last=m;if(m[0]==="")g.lastIndex++;}return last;};
  var lastC=function(re){for(var i=C.length-1;i>=0;i--)if(re.test(C[i]))return C[i];return null;};
  var set=function(id,val,chip){R.v[id]=val;if(chip)R.chips.push(chip);};
  var chk=function(id,val,chip){R.c[id]=val;if(chip)R.chips.push(chip);};
  var m;
  // 👑 queen
  var qc=lastC(/\b(matca|regina|matcuta)\b[^,]*\b(vazut\w*|gasit\w*|vad|gasesc|prezenta|la vedere|se vede|apare)\b|\b(vazut\w*|gasit\w*|vad|gasesc)\b[^,]*\b(matca|regina|matcuta)\b|\b(orfan\w*|bezmetic\w*|fara matca)\b/);
  if(qc&&(NEG.test(qc)||/orfan|bezmetic/.test(qc))){
    chk("iQS",false,"👑 Matca nevăzută");
    if(/orfan|bezmetic|fara matca/.test(qc))R.chips.push("⚠️ Posibil orfan");
  }else if(qc)chk("iQS",true,"👑 Matca văzută");
  // 🥚 eggs / larvae / capped brood
  var ec=lastC(/\b(oua|ou|ouat|depune|ponta)\b/);
  if(ec)chk("iEg",!NEG.test(ec),NEG.test(ec)?"🥚 Fără ouă":"🥚 Ouă");
  var lc=lastC(/\blarv/);
  if(lc)chk("iLv",!NEG.test(lc),NEG.test(lc)?"🐛 Fără larve":"🐛 Larve");
  m=find(/\b(puiet capacit|capacit\w*)/);
  if(m&&!/botc\w*\s*$/.test(s.slice(Math.max(0,m.index-14),m.index))&&!/botc/.test(s.slice(Math.max(0,m.index-14),m.index)))chk("iCap",!neg(m.index),neg(m.index)?"🟤 Fără puiet căpăcit":"🟤 Puiet căpăcit");
  // 📊 frames
  m=find(/\bpuiet\b[^,]{0,14}?\b(\d+)\s*(?:de )?rame?\b/)||find(/\b(\d+)\s*(?:de )?rame?\s*(?:cu |de )?puiet\b/)||find(/\brame (?:cu |de )?puiet\s*(\d+)\b/);
  if(m)set("iFB",m[1],"🥚 "+m[1]+" rame puiet");
  m=find(/\b(?:miere|hrana|mancare|provizii|rezerve|rezerva)\b[^,]{0,14}?\b(\d+)\s*(?:de )?rame?\b/)||find(/\b(\d+)\s*(?:de )?rame?\s*(?:cu |de )?(?:miere|hrana|mancare|provizii|rezerv\w*|pastura)\b/);
  if(m)set("iFH",m[1],"🍯 "+m[1]+" rame mâncare");
  // 😊 temperament
  var bh=null;
  if(/\b(foarte (blande|calme|linistite)|deloc agresive|ca (niste )?miei)\b/.test(s))bh=1;
  else if(/\bfoarte (agresive|rele|nervoase)\b/.test(s))bh=5;
  else if(/\b(nu (sunt |erau )?(agresive|rele)|nu (m au )?intep\w*)\b/.test(s))bh=2;
  else if(/\b(blande|calme|linistite|bune la lucru|pasnice)\b/.test(s))bh=2;
  else if(/\b(agitate|nervoase|urduroase|cam rele|zumzaie)\b/.test(s))bh=4;
  else if((m=find(/\b(agresive|rele|intep\w*|ataca|furioase)\b/))&&!neg(m.index))bh=5;
  else if(/\b(albine\w* (sunt |erau )?normale|temperament normal|comportament normal)\b/.test(s))bh=3;
  if(bh)set("iBhv",String(bh),["","😊 Foarte blânde","😌 Blânde","😐 Normale","😤 Agitate","😡 Agresive"][bh]);
  // ⭐ queen quality
  var QW="(?:matca|regina|ponta)\\s*(?:e |este |pare )?(?:foarte )?";
  if(new RegExp("\\b(?:matca|regina|ponta)\\s*(?:e |este |pare )?(?:foarte buna|excelenta|super|extraordinara|deosebita)\\b").test(s))set("iQQ","excelenta","⭐ Matcă excelentă");
  else if(new RegExp("\\b"+QW+"(?:slaba|proasta|batrana|rara|de schimbat|nu (?:mai )?e buna)\\b").test(s)||/\b(schimb matca|trebuie schimbata matca|matca de schimbat)\b/.test(s))set("iQQ","slaba","⚠️ Matcă slabă");
  else if(new RegExp("\\b"+QW+"(?:medie|asa si asa|mediocra)\\b").test(s))set("iQQ","medie","⭐ Matcă medie");
  else if(new RegExp("\\b"+QW+"(?:buna|ok|frumoasa)\\b").test(s))set("iQQ","buna","⭐ Matcă bună");
  // 👑 queen cells
  var BT=/\b(botc\w*|potc\w*|botce|botcute)\b/;
  var bC=C.filter(function(c){return BT.test(c);});
  if(bC.length){
    if(bC.every(function(c){return NEG.test(c);}))chk("iBtc",false,"👑 Fără botci");
    else{
      chk("iBtc",true);var bn=0,bMax=0,pos=[];
      bC.forEach(function(c){if(NEG.test(c))return;
        var q=/\b(\d+)\s*(?:de )?(?:botc|potc)\w*/.exec(c)||/\b(?:botc|potc)\w*\s*(?:\w+ )?(\d+)\b(?! ?rame?)/.exec(c);
        var k=q?parseInt(q[1]):/\b(botca|potca|botce)\b/.test(c)?1:0;
        if(q&&k>1)bMax=k;
        var rr=c.match(/\b(?:pe )?ram(?:a|ele)? (?:nr |numarul )?(\d+(?: si \d+)*)/g);
        if(rr)rr.forEach(function(r){pos.push(r.replace(/^pe /,"").replace(/^ram\w*/,"rama"));});
        if(!(q&&k>1))bn+=k;});
      bn=Math.max(bMax,bn);
      if(bn){set("iBtcN",String(bn),"👑 "+bn+(bn===1?" botcă":" botci"));}else R.chips.push("👑 Botci");
      if(pos.length){R.extra.btcF=pos.join(", ");R.chips.push("📍 "+R.extra.btcF);}
    }
  }
  if(R.c.iBtc){
    if(/\baproape capacit/.test(s))set("iBtcS","aproape_cap","· aproape căpăcite");
    else if(/\bbotc\w*\s*(?:\w+ )?(capacit\w*|inchise)/.test(s))set("iBtcS","capacite","· căpăcite");
    else if(/\bbotc\w*\s*(?:\w+ )?(noi|incipiente|deschise|la inceput|cu larv\w*|mici|tinere)/.test(s))set("iBtcS","incipient","· incipiente");
    if(/\b(taiat\w*|eliminat\w*|distrus\w*|rupt\w*|sters\w*|scos)\b[^,]{0,18}botc|\bbotc\w*[^,]{0,18}\b(taiat\w*|eliminat\w*|distrus\w*|rupt\w*|sters\w*|scoase)\b|\b(le am|am) (taiat|eliminat|distrus|rupt)\b/.test(s))R.extra.btcAct="removed";
    else if(/\b(le las|las botc\w*|las sa (iasa|se matureze|eclozeze)|pastrez botc\w*)\b/.test(s))R.extra.btcAct="keep";
    if(R.extra.btcAct)R.chips.push(R.extra.btcAct==="removed"?"✂️ Botci eliminate":"👑 Botci lăsate");
  }
  // 🐝 population
  if((m=find(/\b(?:populatie|populatia|putere|puterea|familie|familia)\b[^,]{0,10}?\b(\d+)\s*(?:%|la suta|procent\w*)/))){
    var pv=parseInt(m[1]),pp=[30,50,70,90,100].reduce(function(a,b){return Math.abs(b-pv)<Math.abs(a-pv)?b:a;});set("iPop",String(pp),"🐝 Populație "+pp+"%");
  }else{
    var FP="(?:familia|familie|populatia|populatie|colonia|colonie|stupul)\\s*(?:e |este |pare )?";
    var pop=null;
    if(new RegExp("\\b"+FP+"foarte slaba\\b|\\b(aproape goala|pe moarte|foarte putine albine)\\b").test(s))pop=30;
    else if(new RegExp("\\b"+FP+"foarte (puternica|mare|buna)\\b|\\bplin de albine\\b|\\bplina de albine\\b").test(s))pop=100;
    else if(new RegExp("\\b"+FP+"(slaba|mica)\\b|\\bputine albine\\b").test(s))pop=50;
    else if(new RegExp("\\b"+FP+"(medie|mijlocie)\\b").test(s))pop=70;
    else if(new RegExp("\\b"+FP+"(puternica|mare|buna)\\b").test(s))pop=90;
    if(pop)set("iPop",String(pop),"🐝 Populație "+pop+"%");
  }
  // 🧩 brood pattern
  if(/\bpuiet\w* (?:e |este )?(bolnav|cu probleme|ciudat|mort|perforat|scufundat)/.test(s))set("iBP","probleme","🔴 Puiet cu probleme");
  else if(/\bpuiet\w* (?:e |este )?(necompact|imprastiat|sarit|ciuruit|rar|pestrit|cu goluri)/.test(s))set("iBP","necompact","⚠️ Puiet necompact");
  else if(/\bpuiet\w* (?:e |este )?(compact|frumos|uniform|bun|plin|ok)/.test(s))set("iBP","compact","✅ Puiet compact");
  // 📦 space
  if(/\b((lipsa|fara) (de )?(spatiu|loc)|nu (mai )?are (spatiu|loc)|blocat\w* cu miere|stramt\w*|pregatire de roire|risc de roire|vor sa roiasca|frigurile roirii|stupul e plin|e plin de tot)\b/.test(s))set("iSp","urgent","🔴 Lipsă spațiu");
  else if(/\b(aproape plin|se umple|trebuie magazie|are nevoie de magazie|de pus magazie|aproape fara loc)\b/.test(s))set("iSp","plin","⚠️ Aproape plin");
  else if(/\b((are )?(spatiu|loc) (suficient|destul|ok)|are (spatiu|loc))\b/.test(s))set("iSp","suficient","✅ Spațiu suficient");
  // 🔥 smoke
  if(/\b((fara|deloc|nu am (dat|folosit)) fum)\b/.test(s))set("iSmk","deloc","🚫 Fără fum");
  else if(/\b((foarte )?mult fum|fum mult)\b/.test(s))set("iSmk","mult","🔥🔥🔥 Fum mult");
  else if(/\b(fum (moderat|normal)|fum potrivit)\b/.test(s))set("iSmk","moderat","🔥🔥 Fum moderat");
  else if(/\b((putin|un pic de) fum|fum putin)\b/.test(s))set("iSmk","putin","🔥 Fum puțin");
  // 🌤️ weather + temperature
  var wt=null;
  if(/\bfurtun/.test(s))wt="Furtunos";else if(/\b(ploua|ploaie|ploios|burnit\w*)\b/.test(s))wt="Ploios";
  else if(/\b(vant\w*|bate vantul)\b/.test(s))wt="Vântos";else if(/\b(partial noros|cativa nori|nori si soare|soare cu nori)\b/.test(s))wt="Parțial noros";
  else if(/\b(innorat|noros|cer acoperit)\b/.test(s))wt="Noros";else if(/\b(soare|insorit|senin)\b/.test(s))wt="Însorit";
  if(wt)set("iWt",wt,"🌤️ "+wt);
  if((m=find(/\b(\d+(?: virgula \d)?)\s*(?:de )?grade\b/)))set("iTemp",m[1].replace(" virgula ","."),"🌡️ "+m[1].replace(" virgula ",",")+"°");
  // 🏚️ hive body
  if((m=find(/\b(?:stup\w*|cutie|cutia|capac\w*|fund\w*|corp\w*) (?:e |este )?(?:putin )?(crapat\w*|fisurat\w*|cu fisuri|fisuri)/))){set("iStC","fisuri","⚠️ Stup cu fisuri");R.extra.stN=m[0].trim();}
  else if((m=find(/\b(?:stup\w*|cutie|cutia|capac\w*|fund\w*|corp\w*) (?:e |este )?(deteriorat\w*|putred\w*|stricat\w*|rupt\w*|spart\w*|gaurit\w*)/))){set("iStC","deteriorat","🔴 Stup deteriorat");R.extra.stN=m[0].trim();}
  // 🩺 health
  var dz=[];
  var VR=/\b(varro\w*|varo\w*|varoa|capus\w*|acarian\w*)\b/;
  // varroa count: number in the varroa clause, or in the clause right after it („… deci e 0”, „căzute 3”)
  var vN=null,vNeg=false,vPos=false;
  C.forEach(function(c,i){if(!VR.test(c))return;
    var q=/\b(?:varro\w*|varo\w*|capus\w*|acarian\w*)\s*(?:cazute |gasite |numarate |pe fund |e |sunt )?(\d+)\b/.exec(c)||/\b(\d+)\s*(?:de )?(?:varro\w*|varo\w*|capus\w*|acarian\w*)/.exec(c);
    if(q==null&&C[i+1]&&/^\s*(deci|adica|e|sunt|am numarat|cazute|au cazut)\b/.test(C[i+1])&&!/\b(puiet|rame?|botc|matca|magazi|miere|hrana)\b/.test(C[i+1]))q=/\b(\d+)\b/.exec(C[i+1]);
    if(q)vN=parseInt(q[1]);
    if(NEG.test(c))vNeg=true;else vPos=true;});
  if(vN===0)vNeg=true,vPos=false;
  if(vN!=null){R.extra.varN=String(vN);}
  if(vNeg&&!vN)R.chips.push("🕷️ Varroa: 0 (nu am văzut)");
  [["dV",VR,"🕷️ Varroa"],["dL",/\bloca\b/,"🦠 Locă"],["dN",/\b(nosem\w*|diaree)\b/,"💩 Nosemoză"],["dVr",/\b(puiet varos|varos|ascosfer\w*|mumii|mumifiat\w*)\b/,"🍄 Puiet văros"]].forEach(function(d){
    var cs=C.filter(function(c){return d[1].test(c);});if(!cs.length)return;
    var yes=d[0]==="dV"?(vPos&&!(vNeg&&!vN)):cs.some(function(c){return !NEG.test(c);});
    if(yes){dz.push(d[0]);chk(d[0],true,d[2]);}
  });
  if(dz.length)chk("dOk",false);
  else if(/\b(sanatoas\w*|sanatos|fara boli|nicio boala|nici o boala)\b/.test(s))chk("dOk",true,"✅ Sănătos");
  if(vN)R.chips.push("🕷️ "+vN+" varroa");
  // 🍬 feeding
  if(/\b(s a terminat|a terminat|au terminat|au mancat tot|gata) (siropul|hrana|mancarea|turta|turtele|candy|fondantul)\b|\bopr\w* hranirea\b/.test(s)){R.extra.fdFin=true;R.chips.push("⏹️ Hrănire oprită");}
  if((m=find(/\bam (mai )?(pus|dat|completat|turnat)\b[^,]{0,20}\b(sirop|turt\w*|candy|fondant|apifond\w*|serbet|zahar|hrana|mancare|inlocuitor|polen)\b[^,]*|\bam hranit\b[^,]*/))){
    var fs=m[0];
    var fdT=/\b(turt\w*|candy|serbet)\b/.test(fs)?"candy":/\b(fondant|apifond\w*)\b/.test(fs)?"apifonda":/\b(inlocuitor|polen)\b/.test(fs)?"inlocuitor":
      /\b(2 la 1|gros|de toamna|rezerve)\b/.test(fs)?"sirop_2_1":/\b(1 la 1|subtire|stimul\w*)\b/.test(fs)?"sirop_1_1":(new Date().getMonth()>=7?"sirop_2_1":"sirop_1_1");
    R.extra.fd={type:fdT,more:/\bam mai\b/.test(fs)};
    if((m=/\b(\d+(?: virgula \d)?)\s*(litri|litru|l|kg|kile|kilograme|kilogram)\b/.exec(fs))||(m=find(/\b(\d+(?: virgula \d)?)\s*(litri|litru|l|kg|kile|kilograme|kilogram)\b/)))R.extra.fd.q=m[1].replace(" virgula ","."),R.extra.fd.u=/^l/.test(m[2])?"L":"kg";
    R.chips.push("🍬 Hrănit"+(R.extra.fd.q?" "+R.extra.fd.q+" "+R.extra.fd.u:""));
  }else if(/\b(hrana putina|putina hrana|fara hrana|nu (mai )?are hrana|de hranit|trebuie hranit\w*|trebuie sa hranesc|nu are mancare|putina mancare)\b/.test(s)){R.extra.fdPlan=true;R.chips.push("🗓️ De hrănit — planific");}
  // 📦 supers
  var MG=/\b(magazi\w*|cat|caturi|catul|etaj\w*|corp de magazie)\b/;
  C.forEach(function(c){if(!MG.test(c)||NEG.test(c))return;
    var cnt=function(){var q=/\b(\d+)\s*(?:de )?(?:magazi|caturi|cat|etaj)/.exec(c);return q&&parseInt(q[1])<5?parseInt(q[1]):(/\b(a doua|inca o|inca un|un|o|1)\b/.test(c)?1:1);};
    var fr=/\b(\d+)\s*(?:de )?rame?\b/.exec(c);
    if(/\b(adaug\w*|pus|pun|dat|montat|ridicat cu|marit)\b/.test(c)&&!/\b(scos|luat|scot)\b/.test(c)){R.extra.magAdd=(R.extra.magAdd||0)+cnt();if(fr)R.extra.magF=parseInt(fr[1]);}
    else if(/\b(scos|luat|scot|ridicat|recoltat)\b/.test(c)){R.extra.magRm=(R.extra.magRm||0)+cnt();}
  });
  if(R.extra.magAdd)R.chips.push("📦 +"+R.extra.magAdd+" magazie"+(R.extra.magF?" cu "+R.extra.magF+" rame":""));
  if(R.extra.magRm)R.chips.push("📦 −"+R.extra.magRm+" magazie");
  // ⚖️ weight
  if((m=find(/\b(?:cantar\w*|greutate\w*|cantarit\w*|cantareste)\b[^,]{0,12}?\b(\d+(?: virgula \d)?)\s*(?:kg|kile|kilograme)?\b/))){R.extra.kg=m[1].replace(" virgula ",".");R.chips.push("⚖️ "+R.extra.kg+" kg");}
  // 🔄 frames moved between hives / to a new nuc
  R.extra.mv=MVS;
  R.extra.mv.forEach(function(r){R.chips.push(vcMoveTxt(r));});
  // ✏️ corrections: „puiet pe 6 rame … nu stai, de fapt 7” → the number goes to what you talked about just before
  var lastT=null;
  C.forEach(function(c){
    var num=/\b(\d+)\b/.exec(c);
    if(/\bpuiet\b/.test(c)&&/\brame?\b/.test(c))lastT="iFB";
    else if(/\b(miere|hrana|mancare|provizii|rezerv\w*)\b/.test(c)&&/\brame?\b/.test(c))lastT="iFH";
    else if(/\b(magazi\w*|cat|caturi)\b/.test(c))lastT="mag";
    else if(/\b(botc\w*|potc\w*)\b/.test(c))lastT="btc";
    else if(/\bvarro\w*|\bvaro\w*/.test(c))lastT="var";
    else if(num&&lastT&&/\b(de fapt|corectez|corect|adica|stai|gresit|ba nu|nu nu|ba)\b/.test(c)){
      var v=num[1];
      if(lastT==="iFB"){set("iFB",v);}else if(lastT==="iFH"){set("iFH",v);}
      else if(lastT==="mag"){R.extra.magF=parseInt(v);}else if(lastT==="btc"){set("iBtcN",v);}else if(lastT==="var"){R.extra.varN=v;}
      var lbl={iFB:["rame puiet","🥚 "+v+" rame puiet"],iFH:["rame mâncare","🍯 "+v+" rame mâncare"],mag:["magazie","📦 magazie cu "+v+" rame"],btc:["botc","👑 "+v+" botci"],var:["varroa","🕷️ "+v+" varroa"]}[lastT];
      R.chips=R.chips.filter(function(x){return x.indexOf(lbl[0])<0;});R.chips.push(lbl[1]+" ✏️");
    }
  });
  // ❄️ winter check (used when the form is in winter mode)
  if((m=find(/\bghem\w*\D{0,14}?\b(\d+)\b/))){set("iWiB",m[1],"❄️ Ghem pe "+m[1]+" rame");}
  if(/\b(provizii|hrana|rezerve)\w* (?:sunt |e |este )?(suficient\w*|destul\w*|multe|multa|bune|ok)\b|\bare (destula )?hrana\b/.test(s))set("iWiF","ok","❄️ Provizii suficiente");
  else if(/\b(la limita|provizii putine|provizii cam putine)\b/.test(s))set("iWiF","limit","❄️ Provizii la limită");
  else if(/\b(provizii insuficiente|insuficient\w*|hrana putina|putina hrana|fara hrana|nu (mai )?are hrana|trebuie hranit\w*)\b/.test(s))set("iWiF","low","❄️ Provizii insuficiente");
  if(/\b(zumzet\w* (slab|stins)|abia se aude|nu se aude)\b/.test(s))set("iWiZ","weak","❄️ Zumzet slab");
  else if(/\b(zumzet\w* (puternic|nelinistit|tare|agitat)|urla|vajaie)\b/.test(s))set("iWiZ","loud","❄️ Zumzet neliniștit");
  else if(/\b(zumzet\w* (normal|linistit|bun|ok)|zumzaie normal)\b/.test(s))set("iWiZ","ok","❄️ Zumzet normal");
  if(/\b(multe (albine )?moarte|multe albine moarte|mortalitate mare)\b/.test(s))set("iWiD","many","❄️ Multe albine moarte");
  else if(/\b(putine (albine )?moarte|cateva (albine )?moarte)\b/.test(s))set("iWiD","few","❄️ Puține moarte");
  if(/\b(umezeala|umed|mucegai\w*|condens)\b/.test(s))chk("iWc_damp",true,"💧 Umezeală");
  if(/\b(pete de diaree|diaree)\b/.test(s))chk("iWc_diar",true,"💩 Pete de diaree");
  if(/\bsoarec\w*|\bsoareci\b/.test(s))chk("iWc_mice",true,"🐭 Urme de șoareci");
  if(/\burdinis\w* (blocat|infundat|astupat)|\b(am )?curatat urdinis\w*/.test(s))chk("iWc_ent",true,"🚪 Urdiniș curățat");
  return R;
}
// ── 🔄 frame movements: „am luat o ramă de puiet de la stupul 2”, „am scos 2 rame pentru un roi nou” ──
// which hive a clause talks about: „stupul 2” / „stupul doi” / „roiul 1” / a hive name
function vcHiveRef(c,self){
  var hs=D.hives||[],m=/\b(stup\w*|roi\w*)\s+(?:nr |numarul |numar )?(\d+)\b/.exec(c);
  if(m){var isR=/^roi/.test(m[1]),n=parseInt(m[2]);
    var h=hs.filter(function(x){return(x.kind==="roi")===isR&&parseInt(x.num)===n;})[0]
      ||hs.filter(function(x){return vcNorm(x.name)===vcNorm(m[1].replace(/ul$|ului$/,"")+"ul "+n)||vcNorm(x.name)===(isR?"roi ":"stupul ")+n||vcNorm(x.name)===(isR?"roiul ":"stup ")+n;})[0]
      ||hs.filter(function(x){return parseInt(x.num)===n;})[0];
    if(h)return h.id;}
  var byName=hs.filter(function(x){var nm=vcNorm(x.name);return nm.length>2&&(" "+c+" ").indexOf(" "+nm+" ")>=0;}).sort(function(a,b){return b.name.length-a.name.length;})[0];
  return byName?byName.id:null;
}
function vcFrameType(c){
  return /\bpuiet\w* cu albin\w*|\bcu albine\b/.test(c)?"ba":/\bpuiet\w*\b/.test(c)?"b":/\b(miere|mancare|hrana|provizii)\b/.test(c)?"h":/\b(pastura|polen)\b/.test(c)?"p":
    /\b(fundati\w*|artificial\w*|faguri artificiali)\b/.test(c)?"f":/\b(vech\w*|negr\w*)\b/.test(c)?"old":/\b(cladit\w*|goal\w*|gol|faguri)\b/.test(c)?"e":null;
}
function vcMoves(C,self){
  var out=[];
  var MOVE=/\b(luat|scos|pus|adaugat|dat|mutat|transferat|bagat|introdus|trecut|primit|facut|fac|format)\b/;
  C.forEach(function(c,i){
    if(!/\bram(a|e|ele|ei)\b/.test(c)||!MOVE.test(c)||/\b(magazi\w*|cat|caturi)\b/.test(c)||/\bnu\b/.test(c))return;
    var nm=/\b(\d+)\s*(?:de )?ram(?:a|e|ele)\b/.exec(c),n=nm?parseInt(nm[1]):(/\bram(a|ei)\b/.test(c)?1:0);
    if(!n||n>12)return;
    var t=vcFrameType(c)||(C[i+1]&&!/\bram(a|e|ele)\b/.test(C[i+1])&&vcFrameType(C[i+1]))||"b";
    var ref=vcHiveRef(c,self),other=ref&&ref!==self?ref:null;
    var nuc=/\broi\b|\broiul nou\b|\broi nou\b|\bpentru roi|\bun roi\b/.test(c)&&!/\broi(ul)? \d/.test(c);
    var next=(C[i+1]||"")+" "+(C[i+2]||"");
    var c2=c.replace(/\bde la\b/g,"dela"),fromW=/\b(dela|din|de pe)\b/.test(c2),toW=/\b(in|la|pentru|spre|catre)\s+(stup|roi)|\b(stupului|roiului)\b/.test(c2)||/\b(dat|mutat|transferat|trecut)\b[^,]*\b(stup\w*|roi\w*) \d/.test(c);
    var r=null;
    if(nuc||(!other&&/\b(facut|fac|format)\b[^,]*\broi\b/.test(next)&&/\b(luat|scos)\b/.test(c))){r={k:"out",n:n,t:t,dest:"nuc"};
      var z=c+" "+next;r.nf={eg:/\b(oua|ou|ponta)\b/.test(z),lv:/\blarv/.test(z),cp:/\bcapacit/.test(z)&&!/\bbotc\w* capacit/.test(z),bc:/\b(botc\w*|potc\w*)\b/.test(z)};}
    else if(other&&fromW&&!toW&&/\b(luat|adus|pus|adaugat|bagat|primit|introdus|mutat|transferat|trecut)\b/.test(c))r={k:"in",n:n,t:t,src:"hive",from:other};
    else if(other)r={k:"out",n:n,t:t,dest:"hive",to:other};
    else if(/\b(extractie|extractor|centrifug\w*|recoltat)\b/.test(c))r={k:"out",n:n,t:t==="b"?"h":t,dest:"extract"};
    else if(/\b(scos|luat)\b/.test(c)&&/\b(depozit|magazie de rame|lada)\b/.test(c))r={k:"out",n:n,t:t,dest:"store"};
    else if(/\b(pus|adaugat|bagat|introdus)\b/.test(c)&&/\b(fundati\w*|artificial\w*|noi|noua|goale|goala|cladit\w*|faguri)\b/.test(c))r={k:"in",n:n,t:vcFrameType(c)||"f",src:/\bdepozit\b/.test(c)?"store":"new"};
    if(r){r.i=i;out.push(r);}
  });
  return out;
}
function vcMoveTxt(r){
  var tl=mvPlain(mvTLbl(r.t)).toLowerCase(),n=r.n+" "+(r.n===1?"ramă":"rame")+" "+tl;
  if(r.k==="in")return"🔄 +"+n+" ← "+(r.src==="hive"?mvHiveName(r.from):r.src==="store"?"depozit":"noi");
  return"🔄 −"+n+" → "+(r.dest==="nuc"?"roi nou":r.dest==="hive"?mvHiveName(r.to):r.dest==="extract"?"extracție":r.dest==="store"?"depozit":"altceva");
}
// the nuc form opened after saving (frames.js mvNucAfterSave): tick what you said is on its frames
function vcNucFill(){
  var f=_vc.nucF;_vc.nucF=null;if(!f)return;
  [["nEg","eg"],["nLv","lv"],["nCp","cp"],["nBc","bc"]].forEach(function(x){var el=$q(x[0]);if(el&&f[x[1]]&&!el.checked){el.checked=true;try{el.dispatchEvent(new Event("change",{bubbles:true}));}catch(e){}var c=el.closest("label")||el;c.classList.add("vc-hit");}});
  if(typeof nucPrev==="function")nucPrev();
}
// phrases that mention something about the hive (keywords) — the rest is small talk
var VC_KW=/\b(matc\w*|regin\w*|oua|ou|ponta|larv\w*|puiet\w*|capacit\w*|rame?|ramele|miere|hrana|mancare|provizii|rezerv\w*|pastura|polen|botc\w*|potc\w*|albin\w*|familia|familie|populati\w*|blande|calme|agresiv\w*|agitate|intep\w*|spatiu|loc|plin|roi\w*|magazi\w*|cat|caturi|varro\w*|varo\w*|capus\w*|nosem\w*|diaree|loca|varos|boal\w*|bolnav\w*|sanatos\w*|tratament\w*|sirop|turt\w*|candy|fondant|hranit\w*|fum|grade|ploaie|soare|vant\w*|noros|stup\w*|capac\w*|fund\w*|cantar\w*|kg|kile|litri|ghem\w*|zumzet\w*|moarte|umezeal\w*|mucegai|soarec\w*|urdinis\w*)\b/;
function vcRelevant(txt){
  return String(txt).split(/\s*[,.;\n]\s*/).filter(function(p){return p&&VC_KW.test(vcDigits(vcNorm(p)));})
    .map(function(p){return p.charAt(0).toUpperCase()+p.slice(1);}).join(". ");
}
// live preview of what was understood
window.vcPrev=function(){
  var tx=document.getElementById("vcTx"),el=document.getElementById("vcChips");if(!tx||!el)return;
  var R=vcParse(tx.value,_vc.hid);
  el.innerHTML=R.chips.length?'<div class="hv-ts" style="width:100%;margin-bottom:2px;">Am înțeles:</div>'+R.chips.map(function(c){return'<span class="vc-chip">'+esc(c)+'</span>';}).join(""):"";
};
function vcHelpHTML(){
  var rows=[["👑 Matca","matca văzută · n-am văzut matca · orfan · matcă bună / slabă / excelentă"],
    ["🥚 Puiet","ouă · larve · puiet căpăcit · puiet compact / împrăștiat · 6 rame cu puiet"],
    ["🍯 Mâncare","3 rame cu miere · hrană puțină · am pus sirop 2 litri · am pus turtă · s-a terminat siropul"],
    ["😊 Albinele","foarte blânde · blânde · normale · agitate · agresive"],
    ["🐝 Familia","familie puternică / medie / slabă · populație 70%"],
    ["👑 Botci","două botci · botci căpăcite · le-am tăiat · le las · fără botci"],
    ["🔄 Rame","am luat o ramă de puiet de la stupul 2 · am dat o ramă cu miere stupului 3 · am scos 2 rame cu albine și am făcut un roi nou (cu ouă și o botcă) · am pus 2 rame cu fundație"],
    ["📦 Spațiu","are loc · aproape plin · lipsă spațiu · am pus magazie · am scos magazia"],
    ["🩺 Sănătate","sănătoasă · varroa · 3 varroa căzute · nosema · puiet văros · locă"],
    ["🌤️ Vremea","soare · noros · vânt · ploaie · 22 de grade · fum puțin / fără fum"],
    ["🏚️ Stupul","capacul crăpat · fundul putred · cântar 38 kg"]];
  return'<div class="vc-help">'+rows.map(function(r){return'<div><b>'+r[0]+'</b><span>'+r[1]+'</span></div>';}).join("")+'</div>'
    +'<p class="hv-ts" style="margin-top:6px;">Nu trebuie să dictezi formularul: vorbește normal, aplicația caută cuvintele cheie. Ce nu înțelege rămâne oricum scris la Observații.</p>';
}

// ── fill the normal inspection form ──
window.vcFill=function(){
  var tx=document.getElementById("vcTx");if(!tx)return;
  var txt=tx.value.trim(),hid=_vc.hid;
  vcStopAll();
  var R=vcParse(txt,hid);
  inspM(hid);
  var hit=function(el){if(!el)return;var c=el.closest(".ck")||el.closest(".tr-fin")||el;c.classList.add("vc-hit");};
  var fire=function(el){try{el.dispatchEvent(new Event("change",{bubbles:true}));el.dispatchEvent(new Event("input",{bubbles:true}));}catch(e){}};
  var n=0;
  if(R.extra.mv&&R.extra.mv.length&&typeof mvAdd==="function"){
    R.extra.mv.forEach(function(r){var pre={n:r.n,t:r.t};if(r.k==="out"){pre.dest=r.dest;if(r.to)pre.to=r.to;}else{pre.src=r.src;if(r.from)pre.from=r.from;}mvAdd(r.k,pre);n++;});
    hit(document.getElementById("iRxW"));
  }
  var SUM=["iQS","iEg","iLv","iCap","iFB","iFH","iBhv","iQQ","iBtc","iBtcN","iPop","iBP","iSp"];
  var summer=SUM.some(function(k){return k in R.v||k in R.c;})||R.extra.magAdd||R.extra.magRm||(R.extra.mv&&R.extra.mv.length);
  var wm=$q("iWM"),wasW=wm&&wm.checked;
  if(wasW&&summer){wm.checked=false;inspWinterApply();}
  Object.keys(R.v).forEach(function(id){var el=$q(id);if(!el)return;
    if(el.tagName==="SELECT"&&![].some.call(el.options,function(o){return o.value===R.v[id]||o.text===R.v[id];}))return;
    el.value=R.v[id];fire(el);hit(el);n++;});
  var dis=false;
  Object.keys(R.c).forEach(function(id){var el=$q(id);if(!el)return;
    if(/^d(V|L|N|Vr|Ok)$/.test(id))dis=true;
    if(el.checked!==R.c[id]){el.checked=R.c[id];fire(el);}hit(el);n++;});
  if(dis){var hl=document.getElementById("hlList");if(hl&&hl.style.display==="none"&&typeof hlToggle==="function")hlToggle();if(typeof inspDisUpd==="function")inspDisUpd();}
  var E=R.extra;
  if(E.stN&&$q("iStN")){$q("iStN").value=E.stN.charAt(0).toUpperCase()+E.stN.slice(1);hit($q("iStN"));}
  if(E.btcAct){var rb=document.querySelector("input[name='iBtcAct'][value='"+E.btcAct+"']");if(rb){rb.checked=true;fire(rb);hit(rb.parentNode);n++;}}
  if(E.varN!=null){["iVrMites","iPostTrVarroa"].forEach(function(id){var el=$q(id);if(el){el.value=E.varN;fire(el);hit(el);}});}
  if(E.btcF&&$q("iBtcF")){$q("iBtcF").value=E.btcF.charAt(0).toUpperCase()+E.btcF.slice(1);hit($q("iBtcF"));}
  if(E.fd){
    var nw=$q("iFdNw"),rf=document.querySelector("#MB .iFdRf");
    if(nw&&!nw.checked){nw.checked=true;fire(nw);}
    if(nw){var tp=$q("iFdNwT");if(tp){tp.value=E.fd.type;fire(tp);}if(E.fd.q&&$q("iFdNwQ"))$q("iFdNwQ").value=E.fd.q;if(E.fd.u&&$q("iFdNwU"))$q("iFdNwU").value=E.fd.u;hit(nw);n++;}
    else if(rf){if(!rf.checked){rf.checked=true;fire(rf);}var q=$q("iFdRfQ_"+rf.dataset.id);if(q&&E.fd.q)q.value=E.fd.q;hit(rf);n++;}
  }
  if(E.fdFin){var fn=document.querySelector("#MB .iFdFin");if(fn&&!fn.checked){fn.checked=true;fire(fn);hit(fn);n++;}}
  if(E.fdPlan&&!E.fd){var pl=$q("iFdPl");if(pl&&!pl.checked){pl.checked=true;fire(pl);hit(pl);n++;}}
  if(typeof _magSt!=="undefined"&&_magSt&&document.querySelector("#MB .mg2")){
    for(var a=0;a<(E.magAdd||0);a++){magAdd();if(E.magF){_magSt.cur[_magSt.cur.length-1].f=Math.min(12,E.magF);}}
    if(E.magF)magRedraw();
    for(var b=0;b<(E.magRm||0)&&_magSt.cur.length;b++)magDel(_magSt.cur.length-1);
    if(E.magAdd||E.magRm){hit(document.getElementById("magBlock"));n++;}
  }
  if(E.kg&&$q("iWgOn")){var wg=$q("iWgOn");if(!wg.checked){wg.checked=true;fire(wg);}if($q("iWgK")){$q("iWgK").value=E.kg;fire($q("iWgK"));}hit(wg);n++;}
  // Observații: only the phrases that talk about the hive (the chatting in between is left out);
  // everything said is kept with the inspection („🎙️ Tot ce ai spus”)
  if(txt&&$q("iNt")){
    var rel=vcRelevant(txt),nt=$q("iNt");
    if(rel){nt.value=(nt.value?nt.value+"\n":"")+"🎙️ "+rel;hit(nt);}
    var hv=document.createElement("input");hv.type="hidden";hv.id="iVoiceTx";hv.value=txt;nt.parentNode.appendChild(hv);
  }
  _vc.pend=hid;
  _vc.nucF=null;(R.extra.mv||[]).forEach(function(r){if(r.nf)_vc.nucF=r.nf;});
  // banner on top of the form
  var mt=document.querySelector("#MB .mt");
  if(mt){var bn=document.createElement("div");bn.className="vc-ban";
    bn.innerHTML=txt?('🎙️ <b>Completat din voce: '+n+' '+(n===1?"câmp":"câmpuri")+'</b> — marcate cu galben. Verifică și apasă Salvează.'
      +(wasW&&summer?'<br>❄️ Am oprit „Mod iarnă”, pentru că ai spus lucruri din inspecția completă (matcă, puiet, rame…).':'')+(R.chips.length?'<div class="vc-chips">'+R.chips.map(function(c){return'<span class="vc-chip">'+esc(c)+'</span>';}).join("")+'</div>':''))
      :'🎙️ Nu ai spus nimic — completează manual.';
    mt.parentNode.insertBefore(bn,mt.nextSibling);}
  _mDirty=true;
};
