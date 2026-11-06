// BeeManager Pro — vctrain.js
// 🎓 „Antrenează vocea” (Settings): the phone's speech recognition cannot be changed by the app, but the app
// can learn how the phone WRITES your words. A short test shows beekeeping words and phrases, you say them,
// the app checks what the phone wrote and, where it is wrong, remembers „phone writes X → you said Y”.
// The learned pairs (D.settings.vcLearn, saved with the backup) are applied before the voice parser (voice.js).

// words and phrases the voice inspection must understand
var VC_TRAIN=[
  "matcă","matca văzută","regină","botcă","botci","trei botci","puiet","puiet pe 6 rame","ouă","larve","căpăcit",
  "magazie","am pus magazie","am scos magazia","rame","rame cu miere","rame goale","rame clădite","fundație de plastic",
  "cuib nou","roi nou","am făcut un roi","10 rame în total","varroa","am numărat 15 varroa","acarieni",
  "hrănire","sirop","am dat 2 litri de sirop","turtă","candy","tratament","am început tratament","acid oxalic","acid formic",
  "benzi","Apivar","Apiguard","timol","nosema","locă","albine calme","albine agresive","fum puțin","trântori",
  "cântar 35 de kilograme","temperatura 20 de grade","stupul 1","roiul 2","gata inspecția"
];
var _vt={i:0,heard:"",ok:0,bad:0,rec:null,on:false};

function vtLearn(){if(!D.settings.vcLearn)D.settings.vcLearn=[];return D.settings.vcLearn;}
// the phrase as the parser sees it (lowercase, no diacritics, digits, known fixes) — the comparison is done on this
function vtKey(s){return vcClauses(s).replace(/ , /g," ").replace(/\s+/g," ").trim();}
function vtSame(target,heard){return vtKey(target)===vtKey(heard);}

// ── Settings page ──
function vtCardHTML(){
  var LR=vtLearn(),n=VC_TRAIN.length,i=Math.min(_vt.i,n),done=i>=n;
  var h='<div class="c" style="margin-bottom:14px;"><div class="ct">🎓 Antrenează vocea</div>'
    +'<p class="bk-p">Recunoașterea vorbirii o face telefonul, nu aplicația. Aici aplicația învață <b>cum scrie telefonul cuvintele tale</b>: '
    +'citești cuvântul de mai jos, iar dacă telefonul îl scrie altfel (ex. „botcă” → „potcă”), aplicația reține varianta și data viitoare o înțelege. '
    +'Nu e obligatoriu, ajută la accent sau la cuvintele rare. Durează cam 5 minute și poți relua oricând.</p>'
    +'<div class="vt-prog"><span>'+(done?n:i)+'/'+n+'</span><i style="width:'+Math.round((done?n:i)/n*100)+'%"></i></div>';
  if(done){
    h+='<div class="al alo" style="margin:8px 0;">✅ Gata. Ai trecut prin toate cuvintele: <b>'+_vt.ok+'</b> înțelese de prima dată, <b>'+_vt.bad+'</b> învățate.</div>'
      +'<button type="button" class="btn gh" onclick="vtRestart()">🔁 Ia-o de la început</button>';
  }else{
    var w=VC_TRAIN[i];
    h+='<div class="vt-word">'+esc(w)+'</div>'
      +'<div class="vt-hint">Apasă 🎙️ și spune ce scrie sus — sau scrie în câmp cu 🎤 de pe tastatură.</div>'
      +'<div class="bk-btns"><button type="button" class="btn" id="vtMic" onclick="vtListen()">'+(_vt.on?"⏹ Oprește":"🎙️ Spune")+'</button>'
      +'<button type="button" class="btn gh" onclick="vtSkip()">Sari ›</button></div>'
      +'<input id="vtTx" placeholder="…ce a scris telefonul" value="'+esc(_vt.heard)+'" oninput="_vt.heard=this.value" onchange="vtCheck()">'
      +'<div id="vtRes">'+vtResHTML()+'</div>';
  }
  h+='</div>';
  // manual pair
  h+='<div class="c" style="margin-bottom:14px;"><div class="ct">✍️ Adaugă tu un cuvânt</div>'
    +'<p class="bk-p">Dacă știi deja un cuvânt pe care telefonul îl scrie mereu greșit, pune-l aici.</p>'
    +'<div class="r2"><div>'+L("📱 Telefonul scrie")+'<input id="vtH" placeholder="ex. potcă"></div><div>'+L("🗣️ Eu spun")+'<input id="vtS" placeholder="ex. botcă"></div></div>'
    +'<button type="button" class="btn sm" onclick="vtAddManual()">➕ Adaugă</button></div>';
  // learned list
  h+='<div class="c"><div class="ct">📚 Ce a învățat aplicația <span class="bg gy">'+LR.length+'</span></div>';
  h+=LR.length?'<div class="vt-list">'+LR.map(function(r,k){return'<div class="vt-row"><span>„'+esc(r.h)+'” → <b>'+esc(r.s)+'</b></span><button type="button" class="btn sm gh" onclick="vtDel('+k+')" aria-label="Șterge">🗑️</button></div>';}).join("")+'</div>'
    :'<p class="bk-p" style="margin:0;">Nimic încă. Totul merge după lista de cuvinte a aplicației.</p>';
  h+='</div>';
  return h;
}
function vtResHTML(){
  if(!_vt.heard)return"";
  var w=VC_TRAIN[_vt.i];
  if(vtSame(w,_vt.heard))return'<div class="al alo">✅ Telefonul a scris <b>„'+esc(_vt.heard)+'”</b> — înțeles. <button type="button" class="btn sm" onclick="vtNext(true)">Următorul ›</button></div>';
  return'<div class="al alw">✖ Telefonul a scris <b>„'+esc(_vt.heard)+'”</b>, nu „'+esc(w)+'”.'
    +'<div class="bk-btns" style="margin-top:8px;"><button type="button" class="btn" onclick="vtAdopt()">✔ Așa spun eu — reține</button>'
    +'<button type="button" class="btn gh" onclick="_vt.heard=\'\';vtRedraw();">🔁 Încerc din nou</button></div></div>';
}
function vtRedraw(){var p=document.querySelector(".se-page");if(p&&_seSec==="voice"){renderSettings();}}
window.vtCheck=function(){var r=$q("vtRes");if(r)r.innerHTML=vtResHTML();};
window.vtSkip=function(){vtStopRec();_vt.i++;_vt.heard="";vtRedraw();};
window.vtNext=function(ok){vtStopRec();if(ok)_vt.ok++;_vt.i++;_vt.heard="";vtRedraw();};
window.vtRestart=function(){_vt={i:0,heard:"",ok:0,bad:0,rec:null,on:false};vtRedraw();};
// learn: words at the same position that differ → one pair each; otherwise the whole phrase
window.vtAdopt=function(){
  var w=VC_TRAIN[_vt.i],a=vtKey(w).split(" "),b=vtKey(_vt.heard).split(" "),pairs=[];
  if(a.length===b.length){for(var k=0;k<a.length;k++)if(a[k]!==b[k])pairs.push({h:b[k],s:a[k]});}
  else pairs.push({h:vtKey(_vt.heard),s:vtKey(w)});
  pairs.forEach(vtAddPair);_vt.bad++;
  save(false);toast("Reținut. Data viitoare înțeleg „"+w+"”.","🎓");vtNext(false);
};
function vtAddPair(p){
  if(!p.h||!p.s||p.h===p.s||/^\d+$/.test(p.h))return;
  var L=vtLearn(),ex=L.find(function(r){return r.h===p.h;});
  if(ex)ex.s=p.s;else L.push({h:p.h,s:p.s});
}
window.vtAddManual=function(){
  var h=vcNorm(($q("vtH")||{}).value),s=vcNorm(($q("vtS")||{}).value);
  if(!h||!s){toast("Completează amândouă câmpurile.","✍️");return;}
  vtAddPair({h:h,s:s});save(false);toast("Adăugat: „"+h+"” → "+s,"🎓");vtRedraw();
};
window.vtDel=function(k){var L=vtLearn();L.splice(k,1);save(false);vtRedraw();};

// ── listening: one phrase, no auto-restart (the voice inspection keeps its own recognizer) ──
window.vtListen=function(){
  if(_vt.on){vtStopRec();vtRedraw();return;}
  var SR=vcSR();if(!SR){toast("Telefonul nu are recunoaștere vocală aici — scrie cu 🎤 de pe tastatură.","⌨️");var t=$q("vtTx");if(t)t.focus();return;}
  var r=new SR();r.lang="ro-RO";r.continuous=false;r.interimResults=true;r.maxAlternatives=5;
  r.onresult=function(e){
    var fin="",inter="";
    for(var i=e.resultIndex;i<e.results.length;i++){var res=e.results[i],s=res[0].transcript.trim();
      if(res.isFinal){   // among the phone's guesses, keep one that matches if there is one
        for(var a=0;a<res.length;a++)if(vtSame(VC_TRAIN[_vt.i],res[a].transcript)){s=res[a].transcript.trim();break;}
        fin+=" "+s;}else inter+=" "+s;}
    var t=$q("vtTx");if(t)t.value=(fin||inter).trim();
    if(fin){_vt.heard=fin.trim();vtStopRec();vtRedraw();}
  };
  r.onerror=function(e){vtStopRec();if(e.error==="not-allowed"||e.error==="service-not-allowed")toast("Microfonul nu e permis — scrie cu 🎤 de pe tastatură.","⚠️");vtRedraw();};
  r.onend=function(){if(_vt.rec===r){_vt.on=false;_vt.rec=null;var b=$q("vtMic");if(b)b.textContent="🎙️ Spune";}};
  _vt.rec=r;_vt.on=true;try{r.start();}catch(e){_vt.on=false;_vt.rec=null;}
  var b=$q("vtMic");if(b)b.textContent="⏹ Oprește";
};
function vtStopRec(){if(_vt.rec){try{_vt.rec.stop();}catch(e){}_vt.rec=null;}_vt.on=false;}
