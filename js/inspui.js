// BeeManager Pro — inspui.js
// 🃏 Inspection form layout „Carduri cu rezumat”: the form built by inspM() (inspections.js) is re-arranged
// after it opens — nothing is rebuilt, the same fields (same ids, same handlers) are only MOVED into cards:
//   • every section becomes a card that opens / closes; closed, it shows a short summary of what is filled
//   • a bar of shortcuts on top (✓ = section touched), Save always visible at the bottom
//   • yes/no checkboxes → big tiles · short lists → tap buttons (the real <select> stays hidden underneath)
//   • nest frames → steppers (− / +) and a row of frame slots (brood · food · empty · free)
// Saving, the voice inspection, winter mode, supers, brood boxes and frame moves keep working as before.

var INSP_SHORT={day:"Ziua",phys:"Stup",behav:"Albine",queen:"Matcă",botci:"Botci",frames:"Rame",moves:"Mutări",magBlock:"Magazii",iFdSec:"Hrănire",iTrSec:"Tratamente",health:"Sănătate",winter:"Iarnă",weigh:"Cântar",notes:"Note",post:"După tratament"};
var INSP_ATOMS={magBlock:["📦","Magazii"],iFdSec:["🍬","Hrănire"],iTrSec:["💊","Tratamente și varroa"]};

function inspCardify(){
  var mb=document.getElementById("MB"),root=mb&&mb.querySelector(".mb-b");
  if(!root||root.dataset.cards)return;
  root.dataset.cards="1";mb.classList.add("insp2");
  var cards=[];
  var mk=function(ico,title,key){
    var c=document.createElement("div");c.className="isc";c.dataset.key=key||"";
    c.innerHTML='<div class="isc-h" role="button"><span class="isc-i">'+ico+'</span><span class="isc-t"><b>'+esc(title)+'</b><small class="isc-s"></small></span><span class="isc-ok">✓</span><span class="isc-ar">⌄</span></div><div class="isc-b"></div>';
    c.querySelector(".isc-h").addEventListener("click",function(){inspCardToggle(c);});
    c.addEventListener("input",function(){c.classList.add("touched");inspCardSum(c);inspNavUpd();});
    c.addEventListener("change",function(){c.classList.add("touched");inspCardSum(c);inspNavUpd();});
    c.addEventListener("click",function(e){if(e.target.closest(".isc-b"))setTimeout(function(){inspCardSum(c);inspNavUpd();},30);});
    cards.push(c);return{card:c,body:c.querySelector(".isc-b")};
  };
  var split=function(title){var m=String(title).match(/^\s*([^\sA-Za-zĂÂÎȘȚăâîșț0-9]+)\s*(.*)$/);return m?[m[1],m[2]]:["📋",title];};
  var keyOf=function(t){t=vcNorm(t);return /mutar|mutate/.test(t)?"moves":/matc/.test(t)?"queen":/botc/.test(t)?"botci":/rame|cuib/.test(t)?"frames":/comport|temper/.test(t)?"behav":/fizic|stup/.test(t)?"phys":/sanat|boal/.test(t)?"health":/iarn/.test(t)?"winter":/tratament/.test(t)?"post":"x";};
  var process=function(cont,head){
    var cur=null;
    [].slice.call(cont.children).forEach(function(el){
      var cl=el.classList;
      if(cl.contains("mb-xw")||cl.contains("mt")||cl.contains("pf-note")||cl.contains("ps-note")||cl.contains("vc-ban")||cl.contains("isc")){cur=null;return;}
      if(cl.contains("br")){cur=null;return;}
      if(cl.contains("iw-tg")){cur=null;el.classList.add("isc-wm");return;}   // ❄️ winter-mode switch stays outside the cards
      if(cl.contains("isc-pick")){cur=null;return;}                          // 🏠 hive picker (new inspection without a hive) too
      if(INSP_ATOMS[el.id]){cur=null;var a=mk(INSP_ATOMS[el.id][0],INSP_ATOMS[el.id][1],el.id);cont.insertBefore(a.card,el);a.body.appendChild(el);
        if(cl.contains("iw-h")){cl.remove("iw-h");a.card.classList.add("iw-h");}a.card.classList.add("isc-atom");return;}
      if(el.tagName==="DIV"&&!el.id&&(cl.contains("iw-h")||cl.contains("iw-s"))&&!cl.contains("dv")&&!cl.contains("r2")){process(el,false);cur=null;return;}
      if(cl.contains("dv")){
        var st=el.querySelector(".stt");
        if(st&&st.textContent.trim()){var sp=split(st.textContent.trim());cur=mk(sp[0],sp[1],keyOf(sp[1]));cont.insertBefore(cur.card,el);if(cl.contains("iw-h"))cur.card.classList.add("iw-h");}
        else cur=null;
        el.remove();return;}
      if(!cur){
        var isW=el.querySelector&&el.querySelector("#iWgOn"),isN=el.id==="iNt"||(el.tagName==="LABEL"&&el.nextElementSibling&&el.nextElementSibling.id==="iNt");
        cur=head?mk("🌤️","Ziua și vremea","day"):isW?mk("⚖️","Cântărire","weigh"):isN?mk("📝","Observații","notes"):mk("📋","Altele","x");
        cont.insertBefore(cur.card,el);head=false;
      }
      cur.body.appendChild(el);
    });
  };
  process(root,true);
  // shortcut bar (sticky, under the title) + sticky save bar
  var mt=root.querySelector(".mt"),nav=document.createElement("div");nav.className="isc-nav";nav.id="iscNav";
  if(mt)mt.parentNode.insertBefore(nav,mt.nextSibling);
  // 🎙️ switch to the voice inspection (new inspections only)
  if(mt&&!mb.dataset.inspId){var mic=document.createElement("button");mic.type="button";mic.className="isc-mic";mic.title="Inspecție vocală";mic.setAttribute("aria-label","Inspecție vocală");
    mic.innerHTML="🎙️";mic.onclick=inspToVoice;mt.appendChild(mic);}
  var br=root.querySelector(".br");if(br){br.classList.add("isc-bar");br.insertAdjacentHTML("afterbegin",'<span class="isc-prog" id="iscProg"></span>');}
  // keyboard open on the phone → hide the sticky bar so it doesn't cover the field
  root.addEventListener("focusin",function(e){if(/INPUT|TEXTAREA/.test(e.target.tagName)&&e.target.type!=="checkbox"&&e.target.type!=="radio")mb.classList.add("kb");});
  root.addEventListener("focusout",function(){setTimeout(function(){var a=document.activeElement;if(!a||!/INPUT|TEXTAREA/.test(a.tagName))mb.classList.remove("kb");},120);});
  inspControls(root);
  if(typeof bxInit==="function")bxInit();   // 🧱 frames edited by tapping (boxes.js)
  cards.forEach(inspCardSum);
  // first card open: winter check in winter mode, otherwise the queen
  var first=root.querySelector(inspWinterOn()?'.isc[data-key="winter"]':'.isc[data-key="queen"]');
  if(first)first.classList.add("open");
  inspNavUpd();
  // winter mode switched → shortcuts change
  var wm=$q("iWM");if(wm)wm.addEventListener("change",function(){setTimeout(function(){var w=root.querySelector(inspWinterOn()?'.isc[data-key="winter"]':'.isc[data-key="queen"]');[].forEach.call(root.querySelectorAll(".isc.open"),function(x){x.classList.remove("open");});if(w)w.classList.add("open");inspNavUpd();},30);});
}
function inspCardToggle(c,force){
  var open=force!=null?force:!c.classList.contains("open");
  if(open)[].forEach.call(document.querySelectorAll("#MB .isc.open"),function(x){if(x!==c)x.classList.remove("open");});
  c.classList.toggle("open",open);
  if(open)setTimeout(function(){try{c.scrollIntoView({behavior:"smooth",block:"start"});}catch(e){}},40);
  inspNavUpd();
}
function inspCardVisible(c){return c.offsetParent!==null||getComputedStyle(c).display!=="none"&&!c.closest(".iw-h")&&!c.closest(".iw-s");}
function inspNavUpd(){
  var nav=document.getElementById("iscNav");if(!nav)return;
  var cs=[].filter.call(document.querySelectorAll("#MB .isc"),function(c){return c.offsetParent!==null;});
  nav.innerHTML=cs.map(function(c,i){var t=c.querySelector(".isc-t b").textContent,ic=c.querySelector(".isc-i").textContent,done=c.classList.contains("touched")||c.classList.contains("hit");
    var sh=INSP_SHORT[c.dataset.key]||t.split(" ")[0];
    return'<button type="button" class="'+(c.classList.contains("open")?"on":"")+(done?" d":"")+'" data-i="'+i+'">'+(done?"✓ ":ic+" ")+esc(sh)+'</button>';}).join("");
  [].forEach.call(nav.querySelectorAll("button"),function(b){b.onclick=function(){inspCardToggle(cs[parseInt(b.dataset.i)],true);};});
  var p=document.getElementById("iscProg"),d=cs.filter(function(c){return c.classList.contains("touched")||c.classList.contains("hit");}).length;
  if(p)p.innerHTML='<b>'+d+'</b> din '+cs.length+' secțiuni';
}
// ── summaries of closed cards ──
function inspSelTxt(id){var s=$q(id);if(!s||s.selectedIndex<0)return"";return String(s.options[s.selectedIndex].text||"").trim();}
function inspCk(id){var c=$q(id);return !!(c&&c.checked);}
function inspCardSum(c){
  var el=c.querySelector(".isc-s");if(!el)return;
  var k=c.dataset.key,v=function(id){return(($q(id)||{}).value||"").trim();},p=[];
  if(k==="day"){var d=v("iDt");if(d)p.push(devFmt(d));p.push(inspSelTxt("iWt"));if(v("iTemp"))p.push(v("iTemp")+"°");var sm=inspSelTxt("iSmk");if(sm)p.push(sm);}
  else if(k==="phys"){p.push(inspSelTxt("iStC"));if(v("iStN"))p.push(v("iStN"));}
  else if(k==="behav"){p.push(inspSelTxt("iBhv"));}
  else if(k==="queen"){if(inspCk("iQS"))p.push("matcă văzută");if(inspCk("iEg"))p.push("ouă");if(inspCk("iLv"))p.push("larve");if(inspCk("iCap"))p.push("căpăcit");if(!p.length)p.push("matcă nevăzută");p.push(inspSelTxt("iQQ"));}
  else if(k==="botci"){p.push(inspCk("iBtc")?((v("iBtcN")||"")+" botci "+(inspSelTxt("iBtcS")||"")).trim():"fără botci");}
  else if(k==="frames"){var b=parseInt(v("iFB"))||0,f=parseInt(v("iFH"))||0,e=parseInt(v("iFE"))||0,ns=parseInt(v("iNst"))||1,hid=(($q("iHive")||{}).value)||_mvSelf,h=D.hives.find(function(x){return x.id===hid;})||{};
    p.push((b+f+e)+"/"+hvCap(h,ns));p.push(b+" puiet");p.push(f+" mâncare");if(e)p.push(e+" goale");if(ns>1)p.push(ns+" cuiburi");
    var mm=(typeof _magSt!=="undefined"&&_magSt)?_magSt.cur:[];if(mm.length&&document.getElementById("bxEd"))p.push(mm.length+(mm.length===1?" magazie":" magazii"));if(v("iPop"))p.push(v("iPop")+"%");}
  else if(k==="moves"){var mv=typeof mvRead==="function"?mvRead():{out:[],in:[]},o=mv.out.reduce(function(a,r){return a+r.n;},0),n=mv.in.reduce(function(a,r){return a+r.n;},0);
    p.push(o||n?[o?"−"+o+" scoase":"",n?"+"+n+" puse":""].filter(Boolean).join(" · "):"nimic mutat");}
  else if(k==="magBlock"){var ms=(typeof _magSt!=="undefined"&&_magSt)?_magSt.cur:[];p.push(ms.length?ms.length+(ms.length===1?" magazie":" magazii")+" · "+ms.reduce(function(a,m){return a+m.f;},0)+" rame":"fără magazie");}
  else if(k==="health"){var hn=document.getElementById("hlNow");p.push(hn?hn.textContent.trim().slice(0,60):"");}
  else if(k==="winter"){if(v("iWiB"))p.push("ghem pe "+v("iWiB"));p.push(inspSelTxt("iWiF"));}
  else if(k==="weigh"){p.push(inspCk("iWgOn")&&v("iWgK")?v("iWgK")+" kg":"necântărit");}
  else if(k==="notes"){p.push(v("iNt").slice(0,60)||"—");}
  else{var n2=[].filter.call(c.querySelectorAll(".isc-b input[type=checkbox]"),function(x){return x.checked;}).length;p.push(n2?n2+" bifate":"nimic bifat");}
  el.textContent=p.filter(Boolean).join(" · ");
  if(c.querySelector(".vc-hit"))c.classList.add("hit");
}
// ── controls: tiles, tap buttons, steppers ──
var INSP_TILES=[["iQS","👑","Matcă văzută"],["iEg","🥚","Ouă"],["iLv","🐛","Larve"],["iCap","🟤","Puiet căpăcit"],["iBtc","👑","Botci pe rame"]];
var INSP_SEGS={iBhv:"face",iQQ:1,iPop:1,iBP:1,iSp:1,iSmk:1,iWiF:1,iWiZ:1,iWiD:1,iStC:1};
function inspControls(root){
  // tiles
  var made={};
  INSP_TILES.forEach(function(x){
    var cb=$q(x[0]);if(!cb)return;var ck=cb.closest(".ck");if(!ck)return;
    var host=ck.parentNode,grid=host.querySelector(":scope > .isc-tiles");
    if(!grid){grid=document.createElement("div");grid.className="isc-tiles";host.insertBefore(grid,ck);}
    var t=document.createElement("button");t.type="button";t.className="isc-tile";t.dataset.for=x[0];
    t.innerHTML='<b>'+x[1]+'</b>'+x[2]+'<small></small>';
    t.onclick=function(){cb.checked=!cb.checked;cb.dispatchEvent(new Event("change",{bubbles:true}));inspTileUpd(t,cb);};
    cb.addEventListener("change",function(){inspTileUpd(t,cb);});
    grid.appendChild(t);ck.style.display="none";inspTileUpd(t,cb);made[x[0]]=1;
  });
  // tap buttons instead of short lists
  Object.keys(INSP_SEGS).forEach(function(id){
    var s=$q(id);if(!s||s.dataset.seg)return;s.dataset.seg="1";
    var longest=[].reduce.call(s.options,function(a,o){return Math.max(a,String(o.text||"").trim().length);},0);
    var w=document.createElement("div");w.className="isc-seg"+(INSP_SEGS[id]==="face"?" face":"")+(INSP_SEGS[id]!=="face"&&(s.options.length>4||longest>13)?" wrap":"");
    [].forEach.call(s.options,function(o){var b=document.createElement("button");b.type="button";b.dataset.v=o.value;
      var tx=String(o.text||"").trim();b.innerHTML=INSP_SEGS[id]==="face"?(tx.match(/^\S+/)||[tx])[0]+'<small>'+esc(tx.replace(/^\S+\s*/,""))+'</small>':esc(tx);
      b.onclick=function(){s.value=o.value;s.dispatchEvent(new Event("change",{bubbles:true}));inspSegUpd(w,s);};w.appendChild(b);});
    s.parentNode.insertBefore(w,s.nextSibling);s.style.display="none";
    s.addEventListener("change",function(){inspSegUpd(w,s);});inspSegUpd(w,s);
  });
  // steppers on the nest frames
  ["iFB","iFH","iFE"].forEach(function(id){
    var inp=$q(id);if(!inp||inp.dataset.stp)return;inp.dataset.stp="1";
    var w=document.createElement("div");w.className="isc-stp";inp.parentNode.insertBefore(w,inp);
    var mkB=function(d,l){var b=document.createElement("button");b.type="button";b.textContent=l;b.onclick=function(){inp.value=Math.max(0,(parseInt(inp.value)||0)+d);inp.dispatchEvent(new Event("input",{bubbles:true}));};return b;};
    w.appendChild(mkB(-1,"−"));w.appendChild(inp);w.appendChild(mkB(1,"+"));
  });
  // frame slots above the steppers
  var fb=$q("iFB");if(fb){var r2=fb.closest(".r2");if(r2&&!document.getElementById("iscSlots")){var sl=document.createElement("div");sl.id="iscSlots";sl.className="isc-slots";r2.parentNode.insertBefore(sl,r2);}}
  inspSlotsUpd();
}
function inspTileUpd(t,cb){t.classList.toggle("y",cb.checked);var s=t.querySelector("small");if(s)s.textContent=cb.checked?"da":"—";}
function inspSegUpd(w,s){[].forEach.call(w.children,function(b){b.classList.toggle("on",b.dataset.v===s.value);});}
function inspSlotsUpd(){
  var el=document.getElementById("iscSlots");if(!el)return;
  var g=function(id){return Math.max(0,parseInt(($q(id)||{}).value)||0);},b=g("iFB"),f=g("iFH"),e=g("iFE"),ns=parseInt(($q("iNst")||{}).value)||1;
  var hid=(($q("iHive")||{}).value)||_mvSelf,h=D.hives.find(function(x){return x.id===hid;})||{},cap=h.kind==="roi"?Math.max(b+f+e,parseInt((String(h.mod||"").match(/(\d+)/)||[])[1])||6):hvCap(h,ns),tot=b+f+e,n=Math.max(cap,tot),html="";
  for(var i=0;i<n;i++){var c=i<b?"b":i<b+f?"f":i<tot?"e":"";html+='<i class="'+c+(i>=cap?" over":"")+'"></i>';}
  el.innerHTML='<div class="isc-sl" style="grid-template-columns:repeat('+Math.min(n,10)+',1fr)">'+html+'</div>'
    +'<div class="isc-leg"><span><i class="b"></i>'+b+' puiet</span><span><i class="f"></i>'+f+' mâncare</span>'+(e?'<span><i class="e"></i>'+e+' goale</span>':'')+(cap>tot?'<span>'+(cap-tot)+' libere</span>':'')+'</div>';
}

// after the voice inspection filled the form: summaries + ✓ for the cards it touched
function inspCardsRefresh(){[].forEach.call(document.querySelectorAll("#MB .isc"),function(c){inspCardSum(c);});inspSlotsUpd();inspNavUpd();}

// from the inspection form to the voice inspection of the same hive (what was filled here is lost → ask first)
function inspToVoice(){
  var hid=(($q("iHive")||{}).value)||_mvSelf;if(!hid||typeof vcOpen!=="function")return;
  if(_mDirty)showConfirm(L2("Treci la inspecția vocală? Ce ai completat aici nu se păstrează.","Switch to the voice inspection? What you filled in here is not kept."),function(){vcOpen(hid);},null,"🎙️ "+L2("Da, vocal","Yes, voice"));
  else vcOpen(hid);
}
