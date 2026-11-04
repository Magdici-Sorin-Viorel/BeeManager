// BeeManager Pro — boxes.js
// 🧱 Frames edited ONLY by tapping — two separate editors:
//   • „Rame cuib” card: the brood boxes. Palette 🟨 puiet · 🟩 mâncare · 🟫 clădită · ⬜ nouă · ✖ scoate.
//     Tap an empty slot → adds that frame, a full one → changes it. A full top box → „➕ Cuib nou” row.
//     One tick for plastic foundation.
//   • „Magazii” card: closed until you say you put a super („📦 Am pus magazie”) — then every super is a row of
//     slots (🟩 miere · 🟫 clădită · ⬜ nouă / ceară), its number of slots (− / +), % capped, ✕ to take it off,
//     and a „➕ Magazie nouă” row.
// The real fields (iFB / iFH / iFE, _nst boxes, _magSt supers) are updated underneath, so saving, frame moves,
// the voice inspection and the hive card keep working exactly as before.

var _bx={brush:"b",mbrush:"h",on:false,roi:false,magOpen:false,pl:false,put:0,take:0,adj:{b:0,f:0,e:0}};
var BX_K={b:["🟨","Puiet"],h:["🟩","Miere"],f:["🟩","Mâncare"],e:["🟫","Clădită"],n:["⬜","Nouă"],rm:["✖","Scoate"]};

// Frames put in / taken out straight in the brood boxes (a tap on an empty slot, ✖, or what the voice said it put in):
// they explain the new count, so the „Erau … → acum …” check (frames.js mvCheck) does not ask where they came from.
// Changing the kind of a frame that is already there (built comb → brood, food → built…) is no change in number.
// put / take = frames in / out · adj = net change per kind (b brood · f food · e empty = built + new)
function bxNote(k,d){
  var a=_bx.adj,q=k==="n"?"e":k;a[q]=(a[q]||0)+d;
  if(d>0)_bx.put+=d;
  else if(d<0){var u=Math.min(_bx.put,-d);_bx.put-=u;_bx.take+=-d-u;}   // taking out a frame put in now = undo
}
function bxKindChg(a,b){var A=_bx.adj;A[a==="n"?"e":a]--;A[b==="n"?"e":b]++;}

function bxInit(){
  var fb=$q("iFB");if(!fb||document.getElementById("bxEd"))return;
  var hid=(($q("iHive")||{}).value)||_mvSelf,h=D.hives.find(function(x){return x.id===hid;})||{};
  _bx.roi=h.kind==="roi";_bx.pl=false;
  // editing a saved inspection: the frames put in / taken out in the boxes back then still explain its count
  var mbE=document.getElementById("MB"),exE=mbE&&mbE.dataset.inspId?D.inspections.find(function(i){return i.id===mbE.dataset.inspId;}):null,fd=exE&&exE.frDir;
  _bx.put=fd?parseInt(fd.put)||0:0;_bx.take=fd?parseInt(fd.take)||0:0;
  _bx.adj={b:fd&&fd.adj?parseInt(fd.adj.b)||0:0,f:fd&&fd.adj?parseInt(fd.adj.f)||0:0,e:fd&&fd.adj?parseInt(fd.adj.e)||0:0};
  if(!$q("iNst0")){   // a nuc: one box, no supers — the box state is built here
    var g=function(id){return Math.max(0,parseInt(($q(id)||{}).value)||0);};
    _nst={n0:1,n:1,per:hvCap1(h),F:[{b:g("iFB"),f:g("iFH"),e:g("iFE"),n:0}]};}
  var host=document.getElementById("nstBox")||fb.closest(".r2"),w=document.createElement("div");
  w.id="bxEd";w.className="bx";host.parentNode.insertBefore(w,host);
  ["iFB","iFE"].forEach(function(id){var r=$q(id).closest(".r2");if(r)r.classList.add("bx-hide");});   // old controls stay hidden underneath
  // supers editor in the „Magazii” card (the old supers block stays hidden underneath)
  var mg=document.getElementById("magBlock");
  if(mg&&!_bx.roi){var m=document.createElement("div");m.id="bxMag";m.className="bx";mg.parentNode.insertBefore(m,mg);}
  _bx.magOpen=!!(typeof _magSt!=="undefined"&&_magSt&&(_magSt.cur.length||_magSt.before.length));
  var bal=document.getElementById("mvBal");if(bal)w.parentNode.insertBefore(bal,w.nextSibling);   // „Erau 9 → acum 10” belongs to the brood frames
  var mb=document.getElementById("MB");if(mb)mb.classList.add("bx-on");
  _bx.on=true;bxDraw();
  if(typeof mvBal==="function")mvBal();   // the frame check again, now with this form's taps
}
function bxSlots(order,cnt,size,kind,i){
  var arr=[];order.forEach(function(k){for(var x=0;x<(cnt[k]||0);x++)arr.push(k);});
  var n=Math.max(size,arr.length),h="";
  for(var j=0;j<n;j++){var k=arr[j]||"";
    h+='<button type="button" class="bx-s '+(k?"k-"+k:"")+(j>=size?" over":"")+'" onclick="bxTap(\''+kind+'\','+i+','+j+')" aria-label="'+(k?BX_K[k][1]:"loc gol")+'"></button>';}
  return'<div class="bx-sl" style="grid-template-columns:repeat('+Math.min(n,12)+',1fr)">'+h+'</div>';
}
function bxPal(keys,cur,fn){
  return'<div class="bx-pal">'+keys.map(function(k){return'<button type="button" class="bx-p k-'+k+(cur===k?" on":"")+'" onclick="'+fn+'(\''+k+'\')"><i></i>'+BX_K[k][1]+'</button>';}).join("")+'</div>'
    +'<div class="bx-hint">'+L2("Alege tipul, apoi atinge locurile: loc gol = adaugi ramă, loc plin = o schimbi.","Pick a kind, then tap slots: empty = add a frame, full = change it.")+'</div>';
}
function bxDraw(){bxDrawNest();bxDrawMag();}
// ── 🏠 brood boxes ──
function bxDrawNest(){
  var el=document.getElementById("bxEd");if(!el||!_bx.on)return;
  if(typeof nstFromTotals==="function")nstFromTotals();
  var s=_nst,h=bxPal(["b","f","e","n","rm"],_bx.brush,"bxBrush");
  var top=s.F[s.n-1],full=top&&(top.b+top.f+(top.e||0)+(top.n||0))>=nstSz(s.n-1);
  if(!_bx.roi&&s.n<3&&full)h+='<div class="bx-box ghost n"><div class="bx-h"><b>➕ '+L2("Cuib nou","New brood box")+'</b><span class="hv-ts">'+L2("cuibul e plin — atinge un loc","the box is full — tap a slot")+'</span></div>'+bxSlots([],{},s.per,"gn",0)+'</div>';
  for(var b=s.n;b>=1;b--){var F=s.F[b-1],t=F.b+F.f+(F.e||0)+(F.n||0),SZ=nstSz(b-1);
    h+='<div class="bx-box n'+(b>s.n0?" new":"")+(t>SZ?" bad":"")+'"><div class="bx-h"><b>🏠 '+(s.n>1?L2("Cuibul","Box")+' '+b:L2("Cuib","Brood box"))+'</b>'
      +(s.n>1?'<span class="hv-ts">'+(b===1?"jos":b===s.n?"sus":"")+'</span>':'')+(b>s.n0?'<span class="bg gg">nou</span>':'')
      +'<span class="hv-ts">'+t+'/'+SZ+'</span>'
      +'<span class="bx-sz"><button type="button" onclick="bxNSize('+(b-1)+',-1)">−</button>'+SZ+' '+L2("locuri","slots")+'<button type="button" onclick="bxNSize('+(b-1)+',1)">+</button></span>'
      +(b===s.n&&s.n>1?'<button type="button" class="bx-x" onclick="nstSet('+(s.n-1)+');bxCommit()" aria-label="Scoate cuibul">✕</button>':'')+'</div>'
      +bxSlots(["b","f","e","n"],F,SZ,"n",b-1)+'</div>';}
  h+='<label class="bx-pl"><input type="checkbox" id="iPlA"'+(_bx.pl?" checked":"")+' onchange="_bx.pl=this.checked;_mDirty=true"> ⬢ '+L2("Am pus și rame cu fundație de plastic","I also put in plastic-foundation frames")+'</label>';
  var e=nstSum("e"),tot=nstSum(),cap=nstCap();
  h+='<div class="bx-sum"><b>'+tot+'</b>/'+cap+' '+L2("rame în cuib","frames in brood")+' · '+nstSum("b")+' puiet · '+nstSum("f")+' mâncare'+(e?' · '+e+' goale':'')+'</div>';
  el.innerHTML=h;
}
// ── 📦 supers ──
function bxDrawMag(){
  var el=document.getElementById("bxMag");if(!el||!_bx.on||typeof _magSt==="undefined"||!_magSt)return;
  var ms=_magSt.cur,per=_magSt.per||10,b0=_magSt.before.length,h="";
  if(!_bx.magOpen&&!ms.length){
    el.innerHTML='<div class="bx-mag0"><div class="hv-ts">'+(b0?L2("Ai scos toate magaziile.","All supers taken off."):L2("Stupul n-are magazie.","No super on this hive."))+'</div>'
      +'<button type="button" class="mv-add bx-mag-on" onclick="bxMagOpen()"><b>📦</b>'+L2("Am pus magazie","I put a super on")+'<small>'+L2("apoi alegi ramele din ea","then pick its frames")+'</small></button></div>';
    return;}
  h+=bxPal(["h","e","n","rm"],_bx.mbrush,"bxMBrush");
  h+='<div class="hv-ts" style="margin:-2px 0 8px;">'+L2("La deschidere","At start")+': '+(b0?b0+' '+(b0===1?"magazie":"magazii")+' · '+magSum(_magSt.before)+' rame':L2("fără magazie","no super"))+'</div>';
  if(ms.length<8)h+='<div class="bx-box ghost m"><div class="bx-h"><b>➕ '+L2("Magazie nouă","New super")+'</b><span class="hv-ts">'+L2("atinge un loc ca s-o pui","tap a slot to add it")+'</span></div>'+bxSlots([],{},per,"gm",0)+'</div>';
  for(var i=ms.length-1;i>=0;i--){var m=ms[i];magNorm(m,per);
    var isNew=!_magSt.before.some(function(x){return x.k===m.k;}),opts="";
    for(var p=0;p<=100;p+=10)opts+='<option value="'+p+'"'+(p===m.cap?" selected":"")+'>'+p+'%</option>';
    h+='<div class="bx-box m"><div class="bx-h"><b>📦 '+L2("Magazia","Super")+' '+(i+1)+'</b>'+(ms.length>1?'<span class="hv-ts">'+(i===ms.length-1?"sus":i===0?"jos":"")+'</span>':'')+(isNew?'<span class="bg gg">nouă</span>':'')
      +'<span class="hv-ts">'+m.f+'/'+m.size+'</span>'
      +'<span class="bx-sz"><button type="button" onclick="bxSize('+i+',-1)">−</button>'+m.size+' '+L2("locuri","slots")+'<button type="button" onclick="bxSize('+i+',1)">+</button></span>'
      +'<button type="button" class="bx-x" onclick="magDel('+i+');bxDraw()" aria-label="Scoate magazia">✕</button></div>'
      +bxSlots(["h","e","n"],{h:m.h,e:m.e,n:m.n},m.size,"m",i)
      +(m.f<m.size?'<div class="bx-fill">'+L2("Umple locurile libere cu","Fill the free slots with")+': <button type="button" onclick="bxFill('+i+',\'e\')">🟫 '+L2("clădite","built")+'</button><button type="button" onclick="bxFill('+i+',\'n\')">⬜ '+L2("noi","new")+'</button></div>':'')
      +'<div class="bx-cap">✅ '+L2("Căpăcit","Capped")+' <select onchange="magCap('+i+',this.value);bxDraw()">'+opts+'</select></div></div>';}
  var d=magDiff(),ch=[];
  if(d.addS)ch.push('➕ '+d.addS+' '+magWord(d.addS));if(d.rmS)ch.push('➖ '+d.rmS+' '+magWord(d.rmS));
  if(d.addF)ch.push('➕ '+d.addF+' rame');if(d.rmF)ch.push('➖ '+d.rmF+' rame');
  if(d.removed.length)h+='<div class="mg-rm">'+d.removed.map(function(r){return'<span>🗑️ '+L2("Scoasă","Removed")+': '+r.f+' rame <button type="button" class="mg-ib" onclick="magBack('+r.k+');bxDraw()">↺ '+L2("Pune înapoi","Put back")+'</button></span>';}).join("")+'</div>';
  h+='<div class="bx-sum">'+(ch.length?L2("Azi","Today")+': <b>'+ch.join(" · ")+'</b><br>':'')+'📦 <b>'+ms.length+'</b> '+magWord(ms.length)+(ms.length?' · '+magSum(ms)+' rame':'')+'</div>';
  el.innerHTML=h;
}
window.bxMagOpen=function(){_bx.magOpen=true;if(_magSt&&!_magSt.cur.length)magAdd(0);bxDraw();if(typeof inspCardsRefresh==="function")inspCardsRefresh();};
window.bxBrush=function(k){_bx.brush=k;bxDrawNest();};
window.bxMBrush=function(k){_bx.mbrush=k;bxDrawMag();};
function bxKindAt(order,cnt,j){var a=[];order.forEach(function(k){for(var x=0;x<(cnt[k]||0);x++)a.push(k);});return a[j]||"";}
window.bxTap=function(kind,i,j){
  if(kind==="gn"||kind==="n"){
    var br=_bx.brush;
    if(kind==="gn"){if(br==="rm")return;nstSet(_nst.n+1);i=_nst.n-1;j=0;}
    var F=_nst.F[i];if(!F)return;var cur=bxKindAt(["b","f","e","n"],F,j),t=F.b+F.f+(F.e||0)+(F.n||0);
    if(br==="rm"){if(!cur)return;F[cur]--;bxNote(cur,-1);}                 // ✖ frame taken out
    else{if(cur===br)return;
      if(cur){F[cur]--;bxKindChg(cur,br);}                                 // the same frame, now another kind
      else{if(t>=nstSz(i))return;bxNote(br,1);}                            // empty slot → frame put in
      F[br]=(F[br]||0)+1;}
    bxCommit();return;
  }
  var mk=_bx.mbrush;
  if(kind==="gm"){if(mk==="rm")return;magAdd(0);i=_magSt.cur.length-1;j=0;}
  var m=_magSt.cur[i];if(!m)return;
  var c2=bxKindAt(["h","e","n"],m,j);
  if(mk==="rm"){if(c2)m[c2]--;}
  else{if(c2===mk)return;if(c2)m[c2]--;else if(m.f>=m.size)return;m[mk]=(m[mk]||0)+1;}
  bxMagDone(m);
};
window.bxFill=function(i,k){var m=_magSt&&_magSt.cur[i];if(!m)return;m[k]=(m[k]||0)+Math.max(0,m.size-m.f);bxMagDone(m);};
window.bxSize=function(i,d){var m=_magSt&&_magSt.cur[i];if(!m)return;m.size=Math.max(Math.max(1,m.f),Math.min(30,(m.size||10)+d));bxDrawMag();_mDirty=true;};
// slots of a brood box (a non-standard box can hold more than 10)
window.bxNSize=function(i,d){var F=_nst.F[i];if(!F)return;var t=F.b+F.f+(F.e||0)+(F.n||0);F.size=Math.max(Math.max(1,t),Math.min(30,nstSz(i)+d));if(F.size===_nst.per)delete F.size;bxCommit();};
function bxMagDone(m){m.f=m.h+m.e+m.n;magRedraw();bxDrawMag();if(typeof inspCardsRefresh==="function")inspCardsRefresh();_mDirty=true;}
// brood boxes → the total fields (iFB / iFH / iFE) → everything else follows
function bxCommit(){
  var fb=$q("iFB"),fh=$q("iFH"),fe=$q("iFE");
  if(fb)fb.value=nstSum("b");if(fh)fh.value=nstSum("f");if(fe)fe.value=nstSum("e");
  var nb=document.getElementById("nstBox");if(nb&&typeof nstBodyHTML==="function")nb.innerHTML=nstBodyHTML();
  if(typeof _mDirty!=="undefined")_mDirty=true;
  if(fb)fb.dispatchEvent(new Event("input",{bubbles:true}));   // frame-move balance, tips, card summary
  bxDrawNest();
}
// brood / food totals set from outside (the „Da, rămân …” quick fix of the frame check), touching as few frames as
// possible: missing ones are taken from the top box down, new ones go where there is room from the bottom box up
function bxSetBF(b,f){
  [["b",b],["f",f]].forEach(function(x){var k=x[0],d=x[1]-nstSum(k),i;
    for(i=_nst.n-1;i>=0&&d<0;i--){var F=_nst.F[i],r=Math.min(F[k]||0,-d);F[k]-=r;d+=r;}
    for(i=0;i<_nst.n&&d>0;i++){var G=_nst.F[i],p=Math.min(Math.max(0,nstSz(i)-(G.b+G.f+(G.e||0)+(G.n||0))),d);G[k]+=p;d-=p;}
    if(d>0)_nst.F[_nst.n-1][k]+=d;});
  bxCommit();
}
