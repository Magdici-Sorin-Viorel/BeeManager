// BeeManager Pro — frames.js
// 🔄 FRAME MOVEMENTS in the inspection: frames taken out (and what happens to them) and frames put in
// (and where they come from).
//
// Rules:
//  • In the inspection the beekeeper writes the FINAL count of brood / food frames (what is left).
//    If it differs from the count before the inspection, the difference must be explained by
//    movements; otherwise the app warns before saving (and notes "fără motiv").
//  • A movement to / from ANOTHER hive is recorded automatically on that hive too: in its inspection
//    of the same day (frames added to its final count) or, if it has none, in a short automatic
//    inspection "🔄 Transfer rame". The other hive's frame count is updated. Each transfer has an id
//    (tid) on both sides, so editing / deleting the inspection undoes it and nothing is doubled.
//  • "Fac un roi nou": after saving, the nuc form opens with these frames; they are NOT deducted from
//    the donor a second time (the final count already has them out).
//  • A nuc made with the 🐝 button (outside an inspection) is noted on the donor the same way.
//
// Stored on the inspection: o.mv = {out:[{n,t,dest,to,tid,auto,from}], in:[{n,t,src,from,tid,auto}]},
// o.frBefore (frames before the inspection), o.frDiff (unexplained difference, if saved anyway);
// o.fIn / o.fOut keep the sums per type for the observation sheet.

// frame types — the SAME list for frames taken out and put in
var MV_T=[["b","🟤 Puiet"],["ba","🐝 Puiet cu albine"],["h","🍯 Miere"],["p","🌼 Păstură"],["e","🟫 Fagure clădit gol"],["f","🟨 Fundație nouă (neclădită)"],["old","⬛ Fagure vechi (de schimbat)"]];
var MV_OUT_T=MV_T,MV_IN_T=MV_T;
var MV_OLD={d:"🟫 Fagure clădit gol",pl:"🧩 Fagure de plastic"};   // labels of types saved by an earlier version
function mvTLbl(t){return mvLbl(MV_T,t)||MV_OLD[t]||(t==="e"?"🟫 Fagure clădit gol":"");}
function mvInLbl(t){return mvTLbl(t);}
var MV_EMPTY={e:1,f:1,old:1,d:1,pl:1};   // empty frames → column „Noi / Goale” on the sheet
// 🧩 plastic: every frame type can be on a plastic foundation (second group of the type list) → the hive keeps a count (h.plastic)
// frame type list with two groups: wax (normal) foundation and 🧩 plastic foundation — value "t" or "t|pl"
function mvTypeOpts(cur,pl){
  var o=function(x,isPl){var v=x[0]+(isPl?"|pl":""),sel=cur===x[0]&&!!pl===isPl;
    return'<option value="'+v+'"'+(sel?" selected":"")+'>'+(isPl?"🧩 "+mvPlain(x[1])+" (plastic)":x[1])+'</option>';};   // 🧩 first so it shows even when the box is narrow
  return'<optgroup label="Fundație de ceară (normală)">'+MV_T.map(function(x){return o(x,false);}).join("")+'</optgroup>'
    +'<optgroup label="🧩 Fundație de plastic">'+MV_T.map(function(x){return o(x,true);}).join("")+'</optgroup>';
}
function mvIsPl(r){return !!(r&&(r.pl||r.t==="pl"));}
function mvPlTxt(r){return mvIsPl(r)?" (plastic)":"";}
var MV_DEST=[["hive","➡️ Alt stup"],["nuc","🐝 Roi nou"],["extract","🍯 Extracție"],["store","📦 Depozit"],["melt","🔥 Topit"],["other","📝 Altceva"]];
var MV_SRC=[["hive","⬅️ Alt stup"],["store","📦 Depozit"],["new","🆕 Noi"],["other","📝 Altceva"]];
var MV_NEST={b:1,ba:1,h:1,p:1};   // types counted in the brood-nest frames (brood + food)

function mvLbl(list,v){var x=list.filter(function(o){return o[0]===v;})[0];return x?x[1]:"";}
function mvPlain(s){return String(s||"").replace(/^[^A-Za-zĂÂÎȘȚăâîșț0-9]+/,"");}
function mvHiveName(id){var h=D.hives.find(function(x){return x.id===id;})||(typeof genFind==="function"?genFind(id):null);return h?h.name:"—";}
function mvOpts(list,cur){return list.map(function(o){return'<option value="'+o[0]+'"'+(cur===o[0]?" selected":"")+'>'+o[1]+'</option>';}).join("");}
function mvHiveOpts(cur,self){
  return'<option value="">— alege stupul —</option>'+D.hives.filter(function(h){return h.id!==self;}).map(function(h){return'<option value="'+h.id+'"'+(cur===h.id?" selected":"")+'>'+(h.kind==="roi"?"🐝 ":"🏠 ")+esc(h.name)+'</option>';}).join("");
}
// frames in the brood nest moved by a list of rows (nest types only), split in brood / food
function mvNest(rows,inbound){
  var b=0,f=0;(rows||[]).forEach(function(r){var n=parseInt(r.n)||0;if(!n)return;
    if(r.t==="b"||r.t==="ba")b+=n;else if(r.t==="h"||r.t==="p")f+=n;});
  return{b:b,f:f,all:b+f};
}
// counterpart type on the other hive
function mvMapOutToIn(t){return t==="d"?"e":t==="pl"?"f":t;}   // same list both ways (old types → current ones)
function mvMapInToOut(t){return mvMapOutToIn(t);}

// ── Form section ─────────────────────────────────────────────────
var _mvSelf=null;   // hive of the open inspection
function mvRowHTML(kind,r){
  r=r||{};var out=kind==="out";
  if(r.auto){   // came from the other hive's inspection → shown, not editable here
    var txt=out?'➖ '+r.n+' '+mvPlain(mvTLbl(r.t)).toLowerCase()+mvPlTxt(r)+' → '+(r.dest==="nuc"?'roi nou'+(r.nucId?' ('+esc(mvHiveName(r.nucId))+')':''):esc(mvHiveName(r.to)))
      :'➕ '+r.n+' '+mvPlain(mvTLbl(r.t)).toLowerCase()+mvPlTxt(r)+' ← '+esc(mvHiveName(r.from));
    return'<div class="mv-row mv-auto" data-kind="'+kind+'" data-auto="1" data-json="'+esc(JSON.stringify(r))+'">'+txt+' <span class="hv-ts">(înregistrat automat)</span></div>';
  }
  var dest=out?(r.dest||"hive"):(r.src||"hive"),other=out?r.to:r.from;
  return'<div class="mv-row" data-kind="'+kind+'"'+(r.tid?' data-tid="'+esc(r.tid)+'"':'')+'>'
    +'<input type="number" inputmode="numeric" min="1" class="mv-n" value="'+esc(r.n||1)+'" oninput="mvRowsChg()">'
    +'<select class="mv-t" onchange="mvRowsChg()">'+mvTypeOpts(mvMapOutToIn(r.t||"b"),mvIsPl(r))+'</select>'
    +'<select class="mv-d" onchange="mvDestChg(this)">'+mvOpts(out?MV_DEST:MV_SRC,dest)+'</select>'
    +'<select class="mv-h" style="display:'+(dest==="hive"?"block":"none")+'">'+mvHiveOpts(other||"",_mvSelf)+'</select>'
    +'<button type="button" class="mg-ib mv-x" onclick="mvDel(this)" aria-label="✕">✕</button></div>';
}
function mvSecHTML(hid,ex,hive){
  _mvSelf=hid;
  var mv=(ex&&ex.mv)||null;
  if(!mv&&ex&&(ex.fIn||ex.fOut||ex.nFrames)){   // older inspections: fixed numbers → rows with „Altceva”
    mv={out:[],in:[]};var fi=ex.fIn||(ex.nFrames?{n:ex.nFrames}:{}),fo=ex.fOut||{};
    [["n","e"],["h","h"],["b","b"]].forEach(function(k){if(fi[k[0]])mv.in.push({n:fi[k[0]],t:k[1],src:"other"});});
    [["n","e"],["h","h"],["p","p"],["b","b"],["a","ba"]].forEach(function(k){if(fo[k[0]])mv.out.push({n:fo[k[0]],t:k[1],dest:"other"});});
  }
  mv=mv||{out:[],in:[]};
  var on=!!(mv.out.length||mv.in.length);
  var bB=ex?(ex.frBeforeB!=null?ex.frBeforeB:""):(hive?parseInt(hive.fB)||0:""),bF=ex?(ex.frBeforeF!=null?ex.frBeforeF:""):(hive?parseInt(hive.fH)||0:"");
  var before=ex?(ex.frBefore!=null?ex.frBefore:""):(hive?bB+bF:"");
  return'<div id="mvBal" class="mv-bal" style="display:none"></div>'
    +'<input type="hidden" id="mvBefore" value="'+esc(before)+'"><input type="hidden" id="mvBefB" value="'+esc(bB)+'"><input type="hidden" id="mvBefF" value="'+esc(bF)+'">'
    +'<div class="ck"><input type="checkbox" id="iRxOn"'+(on?" checked":"")+' onchange="document.getElementById(\'iRxW\').style.display=this.checked?\'block\':\'none\';mvBal()"><label for="iRxOn">🔄 Am scos sau am pus rame</label></div>'
    +'<div id="iRxW" class="rx-box" style="display:'+(on?"block":"none")+'">'
    +'<div class="rx-t">📤 Am SCOS din acest stup <span class="hv-ts">— câte, ce fel, unde le-am dus</span></div><div id="mvOut">'+mv.out.map(function(r){return mvRowHTML("out",r);}).join("")+'</div>'
    +'<button type="button" class="btn sm gh" onclick="mvAdd(\'out\')">📤 + rând (am scos)</button>'
    +'<div class="rx-t" style="margin-top:10px;">📥 Am PUS în acest stup <span class="hv-ts">— câte, ce fel, de unde sunt</span></div><div id="mvIn">'+mv.in.map(function(r){return mvRowHTML("in",r);}).join("")+'</div>'
    +'<button type="button" class="btn sm gh" onclick="mvAdd(\'in\')">📥 + rând (am pus)</button>'
    +'<div class="hv-ts" style="margin-top:6px;">„Rame cuib” de mai sus se modifică singur după ce scrii aici. Ramele date altui stup (sau luate de la el) se trec automat și la acel stup.</div>'
    +'</div>';
}
window.mvAdd=function(kind,preset){
  var box=document.getElementById(kind==="out"?"mvOut":"mvIn");if(!box)return;
  var w=document.createElement("div");w.innerHTML=mvRowHTML(kind,preset||{});box.appendChild(w.firstChild);
  var on=$q("iRxOn");if(on&&!on.checked){on.checked=true;document.getElementById("iRxW").style.display="block";}
  mvRowsChg();
};
window.mvDel=function(btn){var r=btn.closest(".mv-row");if(r)r.remove();mvRowsChg();};
window.mvDestChg=function(sel){var r=sel.closest(".mv-row"),h=r?r.querySelector(".mv-h"):null;if(h)h.style.display=sel.value==="hive"?"block":"none";mvBal();};
function mvReadKind(kind){
  var box=document.getElementById(kind==="out"?"mvOut":"mvIn");if(!box)return[];
  var on=$q("iRxOn");var ticked=!on||on.checked;
  return[].map.call(box.querySelectorAll(".mv-row"),function(el){
    if(el.dataset.auto){try{return JSON.parse(el.dataset.json);}catch(e){return null;}}
    if(!ticked)return null;
    var n=parseInt((el.querySelector(".mv-n")||{}).value)||0;if(n<=0)return null;
    var tv=((el.querySelector(".mv-t")||{}).value||"b").split("|");   // "b" = wax foundation · "b|pl" = plastic foundation
    var d=(el.querySelector(".mv-d")||{}).value,h=(el.querySelector(".mv-h")||{}).value||null,r={n:n,t:tv[0]};
    if(tv[1]==="pl")r.pl=true;
    if(kind==="out"){r.dest=d;if(d==="hive")r.to=h;}else{r.src=d;if(d==="hive")r.from=h;}
    if(el.dataset.tid)r.tid=el.dataset.tid;
    return r;
  }).filter(Boolean);
}
function mvRead(){return{out:mvReadKind("out"),in:mvReadKind("in")};}

// live check: before − taken out + put in = final count?
function mvCheck(){
  var bf=($q("mvBefore")||{}).value;if(bf===""||bf==null||inspWinterOn&&inspWinterOn())return null;
  var mv=mvRead(),out=mvNest(mv.out,false).all,inn=mvNest(mv.in,true).all;
  var fin=(parseInt(($q("iFB")||{}).value)||0)+(parseInt(($q("iFH")||{}).value)||0);
  var exp=parseInt(bf)-out+inn;
  return{before:parseInt(bf),out:out,inn:inn,exp:exp,fin:fin,diff:fin-exp};
}
// When rows change and the counts were matching, "Rame cuib" follows the rows automatically
// (taking out 2 brood frames → brood frames − 2). If the beekeeper had already written a different
// final count (the rows are the explanation), nothing is changed.
var _mvNet=null;   // net nest change (in − out) last applied: {b,f}
function mvNetNow(){var mv=mvRead(),o=mvNest(mv.out,false),n=mvNest(mv.in,true);return{b:n.b-o.b,f:n.f-o.f};}
window.mvRowsChg=function(){
  var now=mvNetNow(),last=_mvNet||{b:0,f:0},bf=($q("mvBefore")||{}).value;
  if(bf!==""&&bf!=null){
    var fb=$q("iFB"),fh=$q("iFH"),fin=(parseInt(fb&&fb.value)||0)+(parseInt(fh&&fh.value)||0);
    if(fin===parseInt(bf)+last.b+last.f){   // was matching → follow
      if(fb)fb.value=Math.max(0,(parseInt(fb.value)||0)+now.b-last.b);
      if(fh)fh.value=Math.max(0,(parseInt(fh.value)||0)+now.f-last.f);
    }
  }
  _mvNet=now;mvBal();
};
// set "Rame cuib" to what the rows say (before − out + in)
window.mvFix=function(){
  var b0=parseInt(($q("mvBefB")||{}).value),f0=parseInt(($q("mvBefF")||{}).value),net=mvNetNow();
  if(isNaN(b0)||isNaN(f0)){var c=mvCheck();if(!c)return;var fb=$q("iFB");if(fb)fb.value=Math.max(0,(parseInt(fb.value)||0)-c.diff);}
  else{if($q("iFB"))$q("iFB").value=Math.max(0,b0+net.b);if($q("iFH"))$q("iFH").value=Math.max(0,f0+net.f);}
  _mvNet=net;mvBal();
};
window.mvBal=function(){
  var el=document.getElementById("mvBal");if(!el)return;
  if(_mvNet===null)_mvNet=mvNetNow();
  var c=mvCheck();if(!c||(c.out===0&&c.inn===0&&c.diff===0)){el.style.display="none";return;}
  var rm=function(n){return n===1?"1 ramă":n+" rame";};
  var b0=parseInt(($q("mvBefB")||{}).value),f0=parseInt(($q("mvBefF")||{}).value),nt=mvNetNow();
  if(!isNaN(b0)&&(b0+nt.b<0||f0+nt.f<0)){   // more frames taken out than the hive had
    var isB=b0+nt.b<0;el.className="mv-bal bad";
    el.innerHTML='⚠️ Ai scos mai multe rame de '+(isB?'puiet':'mâncare (miere / păstură)')+' decât avea stupul ('+(isB?b0:f0)+'). Verifică numerele de la rândurile de mai jos.';
    el.style.display="block";return;
  }
  // guess the frame type of the quick-fix row from the field that changed (brood or food)
  var curB=parseInt(($q("iFB")||{}).value)||0,go="b",gi="b";
  if(!isNaN(b0)){var eb=b0+nt.b;go=curB<eb?"b":"h";gi=curB>eb?"b":"h";}
  if(c.diff===0){
    el.className="mv-bal ok";
    el.innerHTML='✅ Erau <b>'+c.before+'</b>'+(c.out?' · ai scos <b>'+c.out+'</b>':'')+(c.inn?' · ai pus <b>'+c.inn+'</b>':'')+' → acum <b>'+c.fin+'</b> rame în cuib';
  }else if(c.diff>0){   // count higher than the rows say
    el.className="mv-bal bad";
    el.innerHTML='⚠️ Erau <b>'+c.before+'</b>'+(c.out?', ai scos <b>'+c.out+'</b>':'')+(c.inn?', ai pus <b>'+c.inn+'</b>':'')+' → ar trebui să rămână <b>'+c.exp+'</b>, dar la „Rame cuib” scrie <b>'+c.fin+'</b>.'
      +'<div class="mv-btns"><button type="button" class="btn sm" onclick="mvFix()">✔ Da, rămân '+c.exp+'</button>'
      +'<button type="button" class="btn sm gh" onclick="mvAdd(\'in\',{n:'+c.diff+',t:\''+gi+'\',src:\'hive\'})">📥 Am mai pus '+rm(c.diff)+'</button></div>';
  }else{   // count lower than the rows say
    el.className="mv-bal bad";
    el.innerHTML='⚠️ Erau <b>'+c.before+'</b>'+(c.out?', ai scos <b>'+c.out+'</b>':'')+(c.inn?', ai pus <b>'+c.inn+'</b>':'')+', dar la „Rame cuib” scrie <b>'+c.fin+'</b> — '+(c.diff===-1?'lipsește 1 ramă':'lipsesc '+(-c.diff)+' rame')+'.'
      +'<div class="mv-btns"><button type="button" class="btn sm" onclick="mvAdd(\'out\',{n:'+(-c.diff)+',t:\''+go+'\',dest:\'hive\'})">📤 Le-am scos — spun unde</button>'
      +'<button type="button" class="btn sm gh" onclick="mvFix()">↩ Nu, sunt tot '+c.exp+'</button></div>';
  }
  el.style.display="block";
};
// sums per type for the observation sheet (old fields fIn / fOut)
function mvSums(mv){
  var fi={n:0,h:0,b:0},fo={n:0,h:0,p:0,b:0,a:0};
  (mv.in||[]).forEach(function(r){var n=parseInt(r.n)||0;if(MV_EMPTY[r.t])fi.n+=n;else if(r.t==="h"||r.t==="p")fi.h+=n;else fi.b+=n;});
  (mv.out||[]).forEach(function(r){var n=parseInt(r.n)||0;if(MV_EMPTY[r.t])fo.n+=n;else if(r.t==="h")fo.h+=n;else if(r.t==="p")fo.p+=n;else if(r.t==="ba"){fo.b+=n;fo.a+=n;}else fo.b+=n;});
  var any=function(o){for(var k in o)if(o[k])return true;return false;};
  return{fIn:any(fi)?fi:null,fOut:any(fo)?fo:null};
}
// text for the inspection card / observation sheet
function mvTxt(i){
  var mv=i.mv;if(!mv)return"";
  var p=[];
  (mv.out||[]).forEach(function(r){
    var d=r.dest==="hive"?"→ "+mvHiveName(r.to):mvPlain(mvLbl(MV_DEST,r.dest))+(r.dest==="nuc"&&r.nucId?" — "+mvHiveName(r.nucId):"");
    p.push("scos "+r.n+" "+mvPlain(mvTLbl(r.t)).toLowerCase()+mvPlTxt(r)+" "+(r.dest==="hive"?d:"("+d.toLowerCase()+")"));});
  (mv.in||[]).forEach(function(r){
    var s=r.src==="hive"?"← "+mvHiveName(r.from):"("+mvPlain(mvLbl(MV_SRC,r.src)).toLowerCase()+")";
    p.push("pus "+r.n+" "+mvPlain(mvTLbl(r.t)).toLowerCase()+mvPlTxt(r)+" "+s);});
  if(i.frDiff)p.push((i.frDiff<0?"lipsă ":"în plus ")+Math.abs(i.frDiff)+" rame fără motiv notat");
  return p.join(" · ");
}

// ── 🧩 Plastic frames count per hive ─────────────────────────────
function mvPlAdd(hid,n){var h=D.hives.find(function(x){return x.id===hid;});if(!h||!n)return;h.plastic=Math.max(0,(parseInt(h.plastic)||0)+n);}
// net plastic frames of an inspection's own rows (auto rows are counted when they are created)
function mvPlNet(mv){var n=0;if(!mv)return 0;
  (mv.in||[]).forEach(function(r){if(!r.auto&&mvIsPl(r))n+=parseInt(r.n)||0;});
  (mv.out||[]).forEach(function(r){if(!r.auto&&mvIsPl(r))n-=parseInt(r.n)||0;});return n;}

// ── Applying / undoing transfers on the other hive ──────────────
function mvLatest(hid,date,exceptId){return !(D.inspections||[]).some(function(i){return i.hiveId===hid&&i.id!==exceptId&&i.date>date;});}
function mvHiveAdd(hid,date,db,df,inspId){   // change the hive's current frames (only if that inspection is its latest)
  var h=D.hives.find(function(x){return x.id===hid;});if(!h||!mvLatest(hid,date,inspId))return;
  h.fB=Math.max(0,(parseInt(h.fB)||0)+db);h.fH=Math.max(0,(parseInt(h.fH)||0)+df);h.fT=h.fB+h.fH;h.str=strCalc(h.fB,h.fH,null,date);
}
function mvRefresh(x){var s=mvSums(x.mv||{});x.fIn=s.fIn;x.fOut=s.fOut;}
// the other hive's inspection of that day (or a new automatic "transfer" one)
function mvTarget(hid,src){
  var x=(D.inspections||[]).find(function(i){return i.hiveId===hid&&i.date===src.date&&i.id!==src.id;});
  if(x){if(!x.mv)x.mv={out:[],in:[]};return x;}
  var h=D.hives.find(function(v){return v.id===hid;})||{};
  x={id:uid(),hiveId:hid,date:src.date,transfer:true,weather:src.weather||"",temp:src.temp,smoke:"",structC:"ok",structN:"",
    behav:null,qSeen:false,eggs:false,larvae:false,capped:false,botci:false,botciN:0,fB:parseInt(h.fB)||0,fH:parseInt(h.fH)||0,fP:0,
    popPct:null,bp:"",space:"suficient",diseases:[],diseaseN:"",notes:"",mv:{out:[],in:[]},frBefore:(parseInt(h.fB)||0)+(parseInt(h.fH)||0)};
  D.inspections.push(x);return x;
}
// apply the movements of inspection o (origin rows only: not auto, with another hive)
function mvApply(o){
  if(!o.mv)return;
  (o.mv.out||[]).forEach(function(r){
    if(r.auto||r.dest!=="hive"||!r.to)return;
    if(!r.tid)r.tid=uid();
    var x=mvTarget(r.to,o),t=mvMapOutToIn(r.t);
    if(x.mv.in.some(function(q){return q.tid===r.tid;}))return;
    var man=x.mv.in.filter(function(q){return !q.tid&&!q.auto&&q.src==="hive"&&q.from===o.hiveId&&mvMapOutToIn(q.t)===t&&parseInt(q.n)===parseInt(r.n);})[0];
    if(man){man.tid=r.tid;return;}   // already written on the other hive by hand → just link, no double count
    x.mv.in.push({n:r.n,t:t,pl:mvIsPl(r)||undefined,src:"hive",from:o.hiveId,tid:r.tid,auto:true});
    if(mvIsPl(r))mvPlAdd(r.to,parseInt(r.n));
    var nb=t==="b"?parseInt(r.n):0,nf=t==="h"?parseInt(r.n):0;
    x.fB=(parseInt(x.fB)||0)+nb;x.fH=(parseInt(x.fH)||0)+nf;mvRefresh(x);
    mvHiveAdd(r.to,o.date,nb,nf,x.id);
  });
  (o.mv.in||[]).forEach(function(r){
    if(r.auto||r.src!=="hive"||!r.from)return;
    if(!r.tid)r.tid=uid();
    var x=mvTarget(r.from,o),t=mvMapInToOut(r.t);
    if(x.mv.out.some(function(q){return q.tid===r.tid;}))return;
    var man=x.mv.out.filter(function(q){return !q.tid&&!q.auto&&q.dest==="hive"&&q.to===o.hiveId&&mvMapOutToIn(q.t)===r.t&&parseInt(q.n)===parseInt(r.n);})[0];
    if(man){man.tid=r.tid;return;}
    x.mv.out.push({n:r.n,t:t,pl:mvIsPl(r)||undefined,dest:"hive",to:o.hiveId,tid:r.tid,auto:true});
    if(mvIsPl(r))mvPlAdd(r.from,-parseInt(r.n));
    var nb=t==="b"?parseInt(r.n):0,nf=t==="h"?parseInt(r.n):0;
    x.fB=Math.max(0,(parseInt(x.fB)||0)-nb);x.fH=Math.max(0,(parseInt(x.fH)||0)-nf);mvRefresh(x);
    mvHiveAdd(r.from,o.date,-nb,-nf,x.id);
  });
}
// undo what inspection o did on other hives (before re-saving it, or when deleting it)
function mvRevert(o){
  if(!o||!o.mv)return;
  var tids={};
  (o.mv.out||[]).concat(o.mv.in||[]).forEach(function(r){if(!r.auto&&r.tid)tids[r.tid]=1;});
  if(!Object.keys(tids).length)return;
  (D.inspections||[]).slice().forEach(function(x){
    if(x.id===o.id||!x.mv)return;
    var changed=false;
    ["in","out"].forEach(function(k){
      x.mv[k]=(x.mv[k]||[]).filter(function(q){
        if(!q.tid||!tids[q.tid])return true;
        if(!q.auto){delete q.tid;return true;}   // a hand-written row: keep it, only unlink
        var n=parseInt(q.n)||0,nb=q.t==="b"||q.t==="ba"?n:0,nf=q.t==="h"||q.t==="p"?n:0,sg=k==="in"?-1:1;
        if(mvIsPl(q))mvPlAdd(x.hiveId,sg*n);
        x.fB=Math.max(0,(parseInt(x.fB)||0)+sg*nb);x.fH=Math.max(0,(parseInt(x.fH)||0)+sg*nf);
        mvHiveAdd(x.hiveId,x.date,sg*nb,sg*nf,x.id);changed=true;return false;
      });
    });
    if(changed){mvRefresh(x);
      if(x.transfer&&!x.mv.in.length&&!x.mv.out.length&&!x.notes&&!(x.weight&&x.weight.kg))D.inspections=D.inspections.filter(function(i){return i.id!==x.id;});}
  });
}

// ── Nuc made from frames taken out in the inspection ────────────
var _mvNuc=null;   // {donor, fB, fH, date, inspId}
function mvNucAfterSave(o){
  if(!o.mv)return;
  var rows=(o.mv.out||[]).filter(function(r){return r.dest==="nuc"&&!r.nucId;});
  if(!rows.length)return;
  var s=mvNest(rows,false);
  var pl=rows.reduce(function(a,r){return a+(mvIsPl(r)?parseInt(r.n)||0:0);},0);
  _mvNuc={donor:o.hiveId,fB:s.b,fH:s.f,pl:pl,date:o.date,inspId:o.id};
  setTimeout(function(){
    nucM("",o.hiveId);
    var mb=document.getElementById("MB");if(mb)mb.dataset.fromInsp=o.id;
    if($q("nFB"))$q("nFB").value=s.b;if($q("nFH"))$q("nFH").value=s.f;if($q("nDt"))$q("nDt").value=o.date;
    var dn=$q("nDon");if(dn){dn.value=o.hiveId;dn.disabled=true;}
    var n=document.createElement("div");n.className="mv-bal ok";n.innerHTML="🔄 Ramele vin din inspecția Stupului — sunt deja scăzute din "+esc(mvHiveName(o.hiveId))+", nu se mai scad o dată.";
    var w=$q("nDonW");if(w)w.appendChild(n);
    if(typeof nucPrev==="function")nucPrev();
  },350);
}
// a nuc was saved: link it to the inspection rows (from inspection) or note it on the donor (🐝 button)
function mvNucSaved(nuc,fromInspId,fb,fh,date){
  if(fromInspId){
    var x=(D.inspections||[]).find(function(i){return i.id===fromInspId;});
    if(x&&x.mv)(x.mv.out||[]).forEach(function(r){if(r.dest==="nuc"&&!r.nucId)r.nucId=nuc.id;});
    return;
  }
  var don=nuc.nuc&&nuc.nuc.taken&&nuc.nuc.taken.donor;if(!don||!(fb+fh))return;
  var x2=mvTarget(don,{id:"",date:date,weather:"",temp:null});
  if(fb)x2.mv.out.push({n:fb,t:"b",dest:"nuc",nucId:nuc.id,auto:true});
  if(fh)x2.mv.out.push({n:fh,t:"h",dest:"nuc",nucId:nuc.id,auto:true});
  if(!x2.transfer){x2.fB=Math.max(0,(parseInt(x2.fB)||0)-fb);x2.fH=Math.max(0,(parseInt(x2.fH)||0)-fh);}
  else{var d=D.hives.find(function(v){return v.id===don;});if(d){x2.fB=d.fB;x2.fH=d.fH;x2.frBefore=(parseInt(d.fB)||0)+(parseInt(d.fH)||0)+fb+fh;}}
  mvRefresh(x2);
}
