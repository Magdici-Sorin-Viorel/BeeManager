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
    +'<textarea id="vcTx" rows="5" class="vc-tx" oninput="vcPrev()" placeholder="Vorbește liber, de exemplu: „matca văzută, ouă și larve, puiet compact pe 6 rame, 3 rame cu miere, albine blânde, două botci tăiate, are nevoie de magazie”"></textarea>'
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
};
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
  r.onerror=function(e){
    if(e.error==="no-speech"||e.error==="aborted")return;
    if(e.error==="network"){vcStop();vcStatus('📴 <b>Semnalul a căzut.</b> Continuă cu <b>🎤 de pe tastatură</b> în casetă — ce ai spus până acum a rămas.');return;}
    if(e.error==="not-allowed"||e.error==="service-not-allowed"){vcStop();vcStatus('⚠️ Microfonul nu e permis. Permite microfonul pentru aplicație (lacătul de lângă adresă → Permisiuni) sau folosește 🎤 de pe tastatură.');return;}
    if(e.error==="language-not-supported"){vcStop();vcStatus('⚠️ Româna nu e disponibilă aici. Folosește 🎤 de pe tastatură.');return;}
  };
  r.onend=function(){   // Android stops after a pause → restart until you press stop
    if(_vc.on&&document.getElementById("vcTx")){try{r.start();}catch(e){}}
    else vcUI(false);
  };
  _vc.rec=r;_vc.on=true;_vc.last="";
  try{r.start();}catch(e){_vc.on=false;return;}
  vcUI(true);
  try{if(navigator.wakeLock)navigator.wakeLock.request("screen").then(function(l){_vc.wl=l;}).catch(function(){});}catch(e){}
}
function vcStop(){
  _vc.on=false;
  if(_vc.rec){try{_vc.rec.stop();}catch(e){}_vc.rec=null;}
  if(_vc.wl){try{_vc.wl.release();}catch(e){}_vc.wl=null;}
  var iv=document.getElementById("vcInt");if(iv)iv.textContent="";
  vcUI(false);
}
function vcUI(on){
  var b=document.getElementById("vcMic"),l=document.getElementById("vcMicL");
  if(b)b.classList.toggle("on",on);
  if(l)l.textContent=on?"Ascult… apasă ca să opresc":"Apasă și vorbește";
}
// Android sometimes repeats a final phrase with more words → replace instead of duplicating
function vcAppend(tx,s){
  var cur=tx.value.replace(/\s+$/,""),n=vcNorm(s),ln=vcNorm(_vc.last);
  if(_vc.last&&n.indexOf(ln)===0&&cur.slice(-_vc.last.length)===_vc.last){cur=cur.slice(0,cur.length-_vc.last.length).replace(/[,\s]+$/,"");}
  else if(_vc.last&&ln.indexOf(n)===0&&ln.length>=n.length)return;
  tx.value=(cur?cur+", ":"")+s;_vc.last=s;
  tx.scrollTop=tx.scrollHeight;
}
function vcStopAll(){vcStop();if(_vc.mr)vcRecStop();}

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
function vcParse(raw){
  var s=" "+vcDigits(vcNorm(raw))+" ";
  var R={v:{},c:{},chips:[],post:[],extra:{}};
  var neg=function(i){return /\b(nu|n am|nam|fara|niciun|nicio|nici)\b[^,]{0,14}$/.test(s.slice(Math.max(0,i-22),i));};
  var find=function(re){var m=re.exec(s);return m;};
  var set=function(id,val,chip){R.v[id]=val;if(chip)R.chips.push(chip);};
  var chk=function(id,val,chip){R.c[id]=val;if(chip)R.chips.push(chip);};
  var m;
  // 👑 queen
  if(/\b((nu|n) (am )?(vazut|gasit|gasesc|vad) (nici )?(matca|regina)|nam (vazut|gasit) (matca|regina)|(matca|regina) nu (am )?(vazut|gasit|e |este|se vede|apare)|fara matca|orfan\w*|bezmetic\w*)/.test(s)){
    chk("iQS",false,"👑 Matca nevăzută");
    if(/orfan|bezmetic|fara matca/.test(s))R.chips.push("⚠️ Posibil orfan");
  }else if(/\b((matca|regina) (e |este |a fost )?(vazuta|prezenta|ok|gasita|acolo|la vedere|buna|frumoasa|excelenta|tanara|marcata)|(am )?(vazut|gasit) (si )?(matca|regina)|matca da)\b/.test(s))chk("iQS",true,"👑 Matca văzută");
  // 🥚 eggs / larvae / capped brood
  if(/\b(fara|nu (am vazut|are|sunt|gasesc|vad|vazut))( niciun| nici un| nici)? (oua|ou|ponta)\b|\boua nu\b/.test(s))chk("iEg",false,"🥚 Fără ouă");
  else if(/\b(oua|ou|ouat|depune|ponta)\b/.test(s))chk("iEg",true,"🥚 Ouă");
  if(/\b(fara|nu (am vazut|are|sunt|gasesc|vad))( nicio| nici o| nici)? larv/.test(s))chk("iLv",false,"🐛 Fără larve");
  else if(/\blarv/.test(s))chk("iLv",true,"🐛 Larve");
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
  if(/\b(fara|nu (are|am vazut|sunt|gasesc|vad))( niciun| nicio| nici o| nici)? botc/.test(s))chk("iBtc",false,"👑 Fără botci");
  else if((m=find(/\b(\d+)\s*botc/)||find(/\bbotc\w*\s*(?:\w+ )?(\d+)\b/))){chk("iBtc",true);set("iBtcN",m[1],"👑 "+m[1]+" botci");}
  else if(/\bbotc/.test(s)){chk("iBtc",true,"👑 Botci");}
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
  [["dV",/\b(varro\w*|varo\w*|capus\w*|acarian\w*)\b/,"🕷️ Varroa"],["dL",/\bloca\b/,"🦠 Locă"],["dN",/\b(nosem\w*|diaree)\b/,"💩 Nosemoză"],["dVr",/\b(puiet varos|varos|ascosfer\w*|mumii|mumifiat\w*)\b/,"🍄 Puiet văros"]].forEach(function(d){
    var mm=d[1].exec(s);if(mm&&!neg(mm.index)){dz.push(d[0]);chk(d[0],true,d[2]);}
  });
  if(dz.length)chk("dOk",false);
  else if(/\b(sanatoas\w*|sanatos|fara boli|nicio boala|nici o boala)\b/.test(s))chk("dOk",true,"✅ Sănătos");
  if((m=find(/\bvarro\w*\D{0,14}?\b(\d+)\b/)||find(/\b(\d+)\s*(?:de )?(?:varro\w*|capus\w*|acarien\w*)/))&&R.c.dV){R.extra.varN=m[1];R.chips.push("🕷️ "+m[1]+" varroa căzute");}
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
  if((m=find(/\bam (pus|adaugat|dat)\s*(?:inca |si )?(?:(\d+|o|a doua|a treia) )?magazi/))){R.extra.magAdd=m[2]&&/^\d+$/.test(m[2])?parseInt(m[2]):1;R.chips.push("📦 +"+R.extra.magAdd+" magazie");}
  if((m=find(/\bam (scos|luat|ridicat)\s*(?:(\d+|o) )?magazi/))){R.extra.magRm=m[2]&&/^\d+$/.test(m[2])?parseInt(m[2]):1;R.chips.push("📦 −"+R.extra.magRm+" magazie");}
  // ⚖️ weight
  if((m=find(/\b(?:cantar\w*|greutate\w*|cantarit\w*|cantareste)\b[^,]{0,12}?\b(\d+(?: virgula \d)?)\s*(?:kg|kile|kilograme)?\b/))){R.extra.kg=m[1].replace(" virgula ",".");R.chips.push("⚖️ "+R.extra.kg+" kg");}
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
// live preview of what was understood
window.vcPrev=function(){
  var tx=document.getElementById("vcTx"),el=document.getElementById("vcChips");if(!tx||!el)return;
  var R=vcParse(tx.value);
  el.innerHTML=R.chips.length?'<div class="hv-ts" style="width:100%;margin-bottom:2px;">Am înțeles:</div>'+R.chips.map(function(c){return'<span class="vc-chip">'+esc(c)+'</span>';}).join(""):"";
};
function vcHelpHTML(){
  var rows=[["👑 Matca","matca văzută · n-am văzut matca · orfan · matcă bună / slabă / excelentă"],
    ["🥚 Puiet","ouă · larve · puiet căpăcit · puiet compact / împrăștiat · 6 rame cu puiet"],
    ["🍯 Mâncare","3 rame cu miere · hrană puțină · am pus sirop 2 litri · am pus turtă · s-a terminat siropul"],
    ["😊 Albinele","foarte blânde · blânde · normale · agitate · agresive"],
    ["🐝 Familia","familie puternică / medie / slabă · populație 70%"],
    ["👑 Botci","două botci · botci căpăcite · le-am tăiat · le las · fără botci"],
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
  var R=vcParse(txt);
  inspM(hid);
  var hit=function(el){if(!el)return;var c=el.closest(".ck")||el.closest(".tr-fin")||el;c.classList.add("vc-hit");};
  var fire=function(el){try{el.dispatchEvent(new Event("change",{bubbles:true}));el.dispatchEvent(new Event("input",{bubbles:true}));}catch(e){}};
  var n=0;
  var SUM=["iQS","iEg","iLv","iCap","iFB","iFH","iBhv","iQQ","iBtc","iBtcN","iPop","iBP","iSp"];
  var summer=SUM.some(function(k){return k in R.v||k in R.c;})||R.extra.magAdd||R.extra.magRm;
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
  if(E.varN&&$q("iPostTrVarroa")){$q("iPostTrVarroa").value=E.varN;hit($q("iPostTrVarroa"));}
  if(E.fd){
    var nw=$q("iFdNw"),rf=document.querySelector("#MB .iFdRf");
    if(nw&&!nw.checked){nw.checked=true;fire(nw);}
    if(nw){var tp=$q("iFdNwT");if(tp){tp.value=E.fd.type;fire(tp);}if(E.fd.q&&$q("iFdNwQ"))$q("iFdNwQ").value=E.fd.q;if(E.fd.u&&$q("iFdNwU"))$q("iFdNwU").value=E.fd.u;hit(nw);n++;}
    else if(rf){if(!rf.checked){rf.checked=true;fire(rf);}var q=$q("iFdRfQ_"+rf.dataset.id);if(q&&E.fd.q)q.value=E.fd.q;hit(rf);n++;}
  }
  if(E.fdFin){var fn=document.querySelector("#MB .iFdFin");if(fn&&!fn.checked){fn.checked=true;fire(fn);hit(fn);n++;}}
  if(E.fdPlan&&!E.fd){var pl=$q("iFdPl");if(pl&&!pl.checked){pl.checked=true;fire(pl);hit(pl);n++;}}
  if(typeof _magSt!=="undefined"&&_magSt&&document.querySelector("#MB .mg2")){
    for(var a=0;a<(E.magAdd||0);a++)magAdd();
    for(var b=0;b<(E.magRm||0)&&_magSt.cur.length;b++)magDel(_magSt.cur.length-1);
    if(E.magAdd||E.magRm){hit(document.getElementById("magBlock"));n++;}
  }
  if(E.kg&&$q("iWgOn")){var wg=$q("iWgOn");if(!wg.checked){wg.checked=true;fire(wg);}if($q("iWgK")){$q("iWgK").value=E.kg;fire($q("iWgK"));}hit(wg);n++;}
  if(txt&&$q("iNt")){var nt=$q("iNt");nt.value=(nt.value?nt.value+"\n":"")+"🎙️ "+txt.charAt(0).toUpperCase()+txt.slice(1);hit(nt);}
  // banner on top of the form
  var mt=document.querySelector("#MB .mt");
  if(mt){var bn=document.createElement("div");bn.className="vc-ban";
    bn.innerHTML=txt?('🎙️ <b>Completat din voce: '+n+' '+(n===1?"câmp":"câmpuri")+'</b> — marcate cu galben. Verifică și apasă Salvează.'
      +(wasW&&summer?'<br>❄️ Am oprit „Mod iarnă”, pentru că ai spus lucruri din inspecția completă (matcă, puiet, rame…).':'')+(R.chips.length?'<div class="vc-chips">'+R.chips.map(function(c){return'<span class="vc-chip">'+esc(c)+'</span>';}).join("")+'</div>':''))
      :'🎙️ Nu ai spus nimic — completează manual.';
    mt.parentNode.insertBefore(bn,mt.nextSibling);}
  _mDirty=true;
};
