// BeeManager Pro — calendar.js
// Calendar

// ═══════════════════════════════════════════
// CALENDAR — weather & location aware
// ═══════════════════════════════════════════
var _calView="pri";   // year calendar: "main" | "pri" | "all"
function renderCalendar(){
  var isEN=D.settings.lang==="en";
  var now=new Date(),yr=now.getFullYear(),cd=cdoy(),w=D.weather,off=getLatOffset();
  function foragQuality(plant,wx){
    if(!wx||wx.temp===null||wx.temp===undefined)return{cls:"gy",ic:"❓",lbl:isEN?"No weather data":"Fără date meteo",score:0,pct:0}; // FIX: null safety
    var rain=wx.rain||wx.prec>0,temp=wx.temp,wind=wx.wind||0;
    if(rain)return{cls:"gb",ic:"🌧️",lbl:t("fl_rain"),score:0,pct:0};
    if(temp<plant.nt[0]-4)return{cls:"gr",ic:"❄️",lbl:isEN?"Too cold — no foraging":"Prea rece — fără cules",score:0,pct:5};
    if(temp<plant.nt[0])return{cls:"gy",ic:"🥶",lbl:t("fl_sub_t"),score:1,pct:30};
    if(wind>35)return{cls:"gy",ic:"💨",lbl:t("bee_wind_t"),score:1,pct:25};
    if(temp>plant.nt[1]+4)return{cls:"gy",ic:"🌡️",lbl:isEN?"Too hot — reduced secretion":"Prea cald — secreție redusă",score:1,pct:35};
    if(temp>plant.nt[1])return{cls:"gy",ic:"🌡️",lbl:t("bee_heat_t"),score:2,pct:60};
    if(wind>20)return{cls:"gy",ic:"💨",lbl:isEN?"Windy — moderate foraging":"Vântos — cules moderat",score:2,pct:60};
    var center=(plant.nt[0]+plant.nt[1])/2;
    var dist=Math.abs(temp-center)/((plant.nt[1]-plant.nt[0])/2);
    var pct=Math.min(100,Math.round((1-dist*0.3)*100));
    return{cls:"gg",ic:"🐝🐝🐝",lbl:t("bee_active_t"),score:3,pct:pct};
  }


  var dStr=function(dn){var d=new Date(yr,0,dn);return d.getDate()+"."+String(d.getMonth()+1).padStart(2,"0");};
  var dots=function(v,ic){var o="";for(var i=0;i<3;i++)o+='<i class="'+(i<v?"on":"")+'">'+ic+'</i>';return'<span class="cl-dots">'+o+'</span>';};
  // deviation from the calendar (from your observations) + „👀 am văzut-o” button
  var adjB=function(st){if(!st.adj)return"";return' <span class="bg '+(st.adj<0?"gg":"gb")+' cl-adj" title="'+L2("ajustat după observațiile tale","adjusted from your observations")+'">'+(st.own?"👀 ":"↻ ")+(st.adj>0?"+":"")+st.adj+' '+L2("zile","days")+'</span>';};
  var seeB=function(p){return'<button class="cl-see" onclick="bloomObsM(\''+p.id+'\')" title="'+L2("Am văzut-o înflorită","I saw it in bloom")+'">👀</button>';};
  var phLbl=function(st){return{start:"🌱 "+L2("început de înflorire","bloom starting"),peak:"💯 "+L2("nectar maxim","peak nectar"),end:"🍂 "+L2("spre final","ending"),before:"⏳ "+L2("urmează","coming"),after:"✔ "+L2("trecut","over")}[st.phase];};
  var dy0=doy(yr,12,31);
  var all=MELIFERE.map(function(p){return{p:p,st:plState(p,yr,cd,off)};});
  // bloom bar: full period + nectar peak + today
  var bar=function(st){var span=st.e-st.s||1,pct=function(x){return Math.max(0,Math.min(100,(x-st.s)/span*100));};
    return'<div class="cl-bar"><i class="pk" style="left:'+pct(st.ps)+'%;width:'+(pct(st.pe)-pct(st.ps))+'%"></i>'+(st.inBloom?'<b style="left:'+pct(cd)+'%"></b>':'')+'</div>'
      +'<div class="cl-bar-l"><span>'+dStr(st.s)+'</span><span>💯 '+dStr(st.ps)+' – '+dStr(st.pe)+'</span><span>'+dStr(st.e)+'</span></div>';};

  // ── 1. Main flow ──
  var mains=all.filter(function(x){return x.p.cat==="main";});
  var curM=mains.filter(function(x){return x.st.inBloom;}).sort(function(a,b){return(b.st.inPeak?1:0)-(a.st.inPeak?1:0);});
  var nextM=mains.filter(function(x){return x.st.until>0;}).sort(function(a,b){return a.st.until-b.st.until;});
  // Off-season: „Urmează” shows next year's main flows (cd shifted into next year's day numbers)
  var nextY=false;
  if(!nextM.length){nextY=true;
    nextM=mains.map(function(x){return{p:x.p,st:plState(x.p,yr+1,cd-dy0,off)};}).sort(function(a,b){return a.st.until-b.st.until;});}
  // ── 2. Secondary flows: in bloom now / starting within 14 days ──
  var sec=all.filter(function(x){return x.p.cat!=="main"&&x.st.inBloom;})
    .sort(function(a,b){var pa=(a.p.cat==="pri"?10:0)+(a.st.inPeak?3:0)+a.p.nec,pb=(b.p.cat==="pri"?10:0)+(b.st.inPeak?3:0)+b.p.nec;return pb-pa;});
  var soon=all.filter(function(x){return x.p.cat!=="main"&&x.st.until>0&&x.st.until<=14;}).sort(function(a,b){return a.st.until-b.st.until;});
  // ── 3. Year calendar (12-month bars) ──
  var view=all.filter(function(x){return _calView==="all"||x.p.cat==="main"||(_calView==="pri"&&x.p.cat==="pri");})
    .sort(function(a,b){return(a.p.cat==="main"?0:1)-(b.p.cat==="main"?0:1)||a.st.s-b.st.s;});
  var dy=doy(yr,12,31),P=function(dn){return Math.max(0,Math.min(100,dn/dy*100));};
  var months=L2("I F M A M I I A S O N D","J F M A M J J A S O N D").split(" ");
  var yearCard='<div class="c"><div class="ct">📅 '+L2("Calendarul anului","Year calendar")+'</div>'
    +'<div class="tv-tabs gen-sort" style="margin-top:8px;">'+[["main",L2("Principale","Main")],["pri",L2("+ prioritare","+ priority")],["all",L2("Toate","All")+" ("+MELIFERE.length+")"]].map(function(x){return'<button class="tv-tab'+(_calView===x[0]?" on":"")+'" onclick="_calView=\''+x[0]+'\';renderCalendar()">'+x[1]+'</button>';}).join("")+'</div>'
    +'<div class="cl-y"><div class="cl-yh"><span></span><div class="cl-ym">'+months.map(function(mm){return'<i>'+mm+'</i>';}).join("")+'</div></div>'
    +view.map(function(x){var st=x.st;
      return'<div class="cl-yr'+(x.p.cat==="main"?" mn":"")+(st.inBloom?" now":"")+'" onclick="calPlM(\''+x.p.id+'\')" style="cursor:pointer"><span class="cl-yn">'+x.p.ic+' '+esc(plantN(x.p))+'</span>'
        +'<div class="cl-yb"><i class="bl" style="left:'+P(st.s)+'%;width:'+(P(st.e)-P(st.s))+'%"></i><i class="pk" style="left:'+P(st.ps)+'%;width:'+(P(st.pe)-P(st.ps))+'%"></i><b style="left:'+P(cd)+'%"></b></div></div>';}).join("")
    +'</div><div class="hv-ts" style="margin-top:6px;">▬ '+L2("înflorire","bloom")+' · <span style="color:var(--gold)">▬</span> '+L2("nectar maxim","peak nectar")+' · <span style="color:var(--danger)">│</span> '+L2("azi","today")+'</div></div>';

  var locNote='<div class="cl-loc">📍 '+(D.userLoc?D.userLoc.lat.toFixed(2)+'°N, '+D.userLoc.lon.toFixed(2)+'°E · '+(off?L2("datele sunt mutate cu","dates shifted by")+' '+(off>0?"+":"")+off+' '+t("hv_days")+' '+L2("față de câmpia de referință","vs. the reference plain"):L2("fără decalaj față de referință (câmpie, 45,5°N)","no shift vs. the reference (plain, 45.5°N)")):L2("Locația nu e cunoscută — datele sunt pentru câmpie, 45,5°N. Pornește locația din Setări.","Location unknown — dates are for a plain at 45.5°N. Enable location in Settings."))
    +' · '+L2("La deal / munte înfloritul vine mai târziu (~3–4 zile / 100 m).","Hills / mountains bloom later (~3–4 days / 100 m).")+'</div>';

  var A=plAdjModel(yr),curObs=A.cur.slice().sort(function(a,b){return a.o.date<b.o.date?1:-1;});
  var tot=A.avgCur!=null?A.avgCur+A.B:null;
  // ═══ Board layout: ring for the main flow, swipeable cards, field chips, year bars ═══
  var head='<div class="hv-top"><h2><i class="fas fa-calendar-days" style="color:var(--gold)"></i> '+t("cal_title")+'</h2>'
    +'<button class="btn" onclick="bloomObsM()">👀 '+L2("Am văzut înflorit","I saw it bloom")+'</button></div>';
  // observation chip + observations grouped by plant
  var obChip=function(c){var dv=c.dev+A.B;
    return'<span class="cl-ob">'+c.p.ic+' <b>'+esc(plantN(c.p))+'</b> '+(c.o.phase==="peak"?"💯":"🌱")+' '+c.o.date.slice(8,10)+'.'+c.o.date.slice(5,7)
      +' <span class="'+(dv<0?"ok":dv>0?"lt":"")+'">'+(dv===0?L2("la timp","on time"):(dv>0?"+":"")+dv+L2("z","d"))+'</span><button onclick="event.stopPropagation();bloomObsDel(\''+c.o.id+'\')" aria-label="✕">✕</button></span>';};
  var obsBy={};curObs.forEach(function(c){(obsBy[c.p.id]=obsBy[c.p.id]||[]).push(c);});
  var devTxt=tot!=null&&tot!==0?L2("Anul acesta înfloritul e","This year bloom is")+' <b>'+Math.abs(tot)+' '+L2("zile","days")+' '+(tot<0?L2("mai devreme","earlier"):L2("mai târziu","later"))+'</b> '+L2("față de calendar","vs. the calendar")
    :tot===0?L2("Anul acesta înfloritul e <b>la timp</b>.","This year bloom is <b>on time</b>."):L2("Când vezi o plantă înflorită, notează — calendarul își mută singur datele pentru tot ce urmează.","When you see a plant in bloom, note it — the calendar shifts everything that follows.");
  if(A.B)devTxt+=' '+L2("Din anii trecuți","From past years")+' ('+A.pastYears+'): '+(A.B>0?"+":"")+A.B+' '+L2("zile","days")+'.';
  {
    var ring,hm;
    if(curM.length){var m0=curM[0],s0=m0.st,pc=Math.round(Math.max(0,Math.min(1,(cd-s0.s)/((s0.e-s0.s)||1)))*100);
      ring='<div class="bd-ring" style="--p:'+pc+'"><div><b>'+Math.max(0,s0.left)+'</b><span>'+L2("zile rămase","days left")+'</span></div></div>';
      hm='<div class="bd-hk">🌼 '+L2("Cules principal","Main flow")+'</div><div class="bd-hn" onclick="calPlM(\''+m0.p.id+'\')">'+m0.p.ic+' '+esc(plantN(m0.p))+'</div>'
        +'<div><span class="bg '+(s0.inPeak?"gg":"gy")+'">'+phLbl(s0)+'</span>'+adjB(s0)+'</div>'
        +'<div class="hv-ts" style="margin-top:6px;">🌸 '+dStr(s0.s)+' → '+dStr(s0.e)+' · 💯 '+dStr(s0.ps)+' – '+dStr(s0.pe)+'</div>'
        +(w?(function(){var q=foragQuality(m0.p,w);return'<div style="margin-top:6px;"><span class="bg '+q.cls+'">'+q.ic+' '+q.lbl+'</span> <span class="hv-ts">🌡️ '+showTemp(w.temp)+' · '+L2("optim","optimal")+' '+showTempRange(m0.p.nt[0],m0.p.nt[1])+'</span></div>';})():'')
        +'<div class="hv-ts" style="margin-top:6px;">🍯 '+dots(m0.p.nec,"●")+' 🟡 '+dots(m0.p.pol,"●")+(m0.p.kg?' · ⚖️ '+m0.p.kg+' kg/ha':'')+'</div>';
    }else{var n0=nextM[0];
      ring='<div class="bd-ring off" style="--p:0"><div><b>'+(n0?n0.st.until:"–")+'</b><span>'+L2("zile până la","days until")+'</span></div></div>';
      hm='<div class="bd-hk">⏸️ '+L2("Fără cules principal","No main flow")+'</div>'
        +(n0?'<div class="bd-hn" onclick="calPlM(\''+n0.p.id+'\')">⏭️ '+n0.p.ic+' '+esc(plantN(n0.p))+'</div><div class="hv-ts">'+(nextY?(yr+1)+' · ':'')+'🌸 '+dStr(n0.st.s)+' → '+dStr(n0.st.e)+'</div>':'');}
    var card=function(x,ny){var st=x.st;
      return'<div class="bd-k'+(x.p.cat==="main"?" mn":"")+(x.p.cat==="pri"?" pri":"")+'" onclick="calPlM(\''+x.p.id+'\')"><div class="bd-ki">'+x.p.ic+'</div>'
        +'<div class="bd-kn">'+esc(plantN(x.p))+(x.p.cat==="pri"?' ★':'')+'</div>'
        +'<div class="bd-kw">'+(st.inBloom?(st.inPeak?"💯 "+L2("nectar maxim","peak"):phLbl(st)):'⏳ '+L2("în","in")+' '+st.until+' '+t("hv_days"))+'</div>'
        +(st.inBloom?bar(st).replace(/<div class="cl-bar-l">[\s\S]*$/,''):'<div class="hv-ts">🌸 '+dStr(st.s)+(ny?' '+(yr+1):'')+'</div>')
        +'<div class="bd-kd">🍯 '+dots(x.p.nec,"●")+'</div>'
        +(obsBy[x.p.id]&&!ny?'<span class="bd-ko">👀</span>':'')+'</div>';};
    var nowC=curM.slice(1).concat(sec),upC=(nextY?[]:nextM.slice(curM.length?0:1)).concat(soon);
    upC=upC.filter(function(x,i){return upC.indexOf(x)===i;}).sort(function(a,b){return a.st.until-b.st.until;});
    var rail=function(ttl,l,ny){return l.length?'<div class="bd-sh">'+ttl+' <span class="hv-ts">'+l.length+' · '+L2("glisează →","swipe →")+'</span></div><div class="bd-rail">'+l.map(function(x){return card(x,ny);}).join("")+'</div>':'';};
    vbody='<div class="bd-hero">'+ring+'<div class="bd-hb">'+hm+'</div></div>'
      +rail("🌸 "+L2("Tot în floare acum","Also in bloom now"),nowC)
      +rail("⏭️ "+L2("Urmează","Coming up"),upC)
      +(nextY?rail("📆 "+L2("Sezonul","Season")+" "+(yr+1),nextM,true):'')
      +'<div class="bd-sh">👀 '+L2("Teren","Field")+'</div><div class="bd-field"><div class="hv-ts">'+devTxt+'</div>'+(curObs.length?'<div class="cl-obs-l">'+curObs.map(obChip).join("")+'</div>':'')+'</div>'
      +yearCard+locNote;
  }

  setP(head+vbody);
}

// ── Plant detail sheet (tap any plant on the board) ──
window.calPlM=function(id){
  var p=plFind(id);if(!p)return;
  var yr=new Date().getFullYear(),cd=cdoy(),off=getLatOffset(),st=plState(p,yr,cd,off);
  if(st.phase==="after"&&p.cat==="main"&&cd-st.e>60){st=plState(p,yr+1,cd-doy(yr,12,31),off);}
  var dS=function(dn){var d=new Date(yr,0,dn);return d.getDate()+"."+String(d.getMonth()+1).padStart(2,"0");};
  var dots=function(v){var o="";for(var i=0;i<3;i++)o+='<i class="'+(i<v?"on":"")+'">●</i>';return'<span class="cl-dots">'+o+'</span>';};
  var span=st.e-st.s||1,pc=function(x){return Math.max(0,Math.min(100,(x-st.s)/span*100));};
  var ph={start:"🌱 "+L2("început de înflorire","bloom starting"),peak:"💯 "+L2("nectar maxim","peak nectar"),end:"🍂 "+L2("spre final","ending"),before:"⏳ "+L2("în","in")+" "+st.until+" "+t("hv_days"),after:"✔ "+L2("s-a terminat","over")}[st.phase];
  var obs=(plAdjModel(yr).cur||[]).filter(function(c){return c.p.id===id;});
  openM('<div class="mt">'+p.ic+' '+esc(plantN(p))+'</div><div class="hv-ts"><i>'+esc(p.lat)+'</i> · '+(p.cat==="main"?L2("cules principal","main flow"):p.cat==="pri"?"★ "+L2("secundar prioritar","priority secondary"):L2("secundar","secondary"))+'</div>'
    +'<div style="margin:10px 0 4px;"><span class="bg '+(st.inPeak?"gg":"gy")+'">'+ph+'</span>'+(st.adj?' <span class="bg '+(st.adj<0?"gg":"gb")+'">'+(st.own?"👀 ":"↻ ")+(st.adj>0?"+":"")+st.adj+' '+L2("zile","days")+'</span>':'')+'</div>'
    +'<div class="cl-bar"><i class="pk" style="left:'+pc(st.ps)+'%;width:'+(pc(st.pe)-pc(st.ps))+'%"></i>'+(st.inBloom?'<b style="left:'+pc(cd)+'%"></b>':'')+'</div>'
    +'<div class="cl-bar-l"><span>'+dS(st.s)+'</span><span>💯 '+dS(st.ps)+' – '+dS(st.pe)+'</span><span>'+dS(st.e)+'</span></div>'
    +'<div class="cl-kv">'+(st.inBloom?'<span>⏳ '+L2("încă","still")+' ~'+Math.max(0,st.left)+' '+t("hv_days")+'</span>':'')+'<span>🍯 '+L2("nectar","nectar")+' '+dots(p.nec)+'</span><span>🟡 '+L2("polen","pollen")+' '+dots(p.pol)+'</span>'+(p.kg?'<span>⚖️ '+p.kg+' kg/ha</span>':'')+'<span>🌡️ '+showTempRange(p.nt[0],p.nt[1])+'</span></div>'
    +'<div class="hv-ts" style="margin-top:8px;">📍 '+esc(p.z)+'</div>'
    +(p.dc?'<div style="margin-top:6px;font-size:.85rem;">'+esc(p.dc)+'</div>':'')
    +(obs.length?'<div class="cl-obs-l">'+obs.map(function(c){return'<span class="cl-ob">'+(c.o.phase==="peak"?"💯":"🌱")+' '+c.o.date.slice(8,10)+'.'+c.o.date.slice(5,7)+'</span>';}).join("")+'</div>':'')
    +'<div class="br" style="margin-top:14px;"><button class="btn" onclick="closeM();bloomObsM(\''+p.id+'\')">👀 '+L2("Am văzut-o înflorită","I saw it in bloom")+'</button><button class="btn gh" onclick="closeM()">'+L2("Închide","Close")+'</button></div>');
};

// ── 👀 I saw a plant in bloom ──
window.bloomObsM=function(pid){
  var yr=new Date().getFullYear(),cd=cdoy(),off=getLatOffset();
  var near=[],main=[],pri=[],rest=[];
  MELIFERE.slice().sort(function(a,b){return plDoy(yr,a.b[0],a.b[1],0)-plDoy(yr,b.b[0],b.b[1],0);}).forEach(function(p){
    var st=plState(p,yr,cd,off);
    if(st.s-25<=cd&&st.e+10>=cd)near.push(p);else if(p.cat==="main")main.push(p);else if(p.cat==="pri")pri.push(p);else rest.push(p);});
  var opt=function(p){return'<option value="'+p.id+'"'+(p.id===pid?" selected":"")+'>'+p.ic+' '+esc(plantN(p))+'</option>';};
  var grp=function(l,t2){return l.length?'<optgroup label="'+t2+'">'+l.map(opt).join("")+'</optgroup>':'';};
  openM('<div class="mt">👀 '+L2("Am văzut înflorit","I saw it in bloom")+'</div>'
    +L(L2("🌸 Ce plantă?","🌸 Which plant?"))+'<select id="boP" onchange="bloomObsPrev()">'
    +grp(near,L2("Acum / în curând","Now / soon"))+grp(main,L2("Culesuri principale","Main flows"))+grp(pri,L2("Secundare prioritare","Priority secondary"))+grp(rest,L2("Alte plante","Other plants"))+'</select>'
    +'<div class="dev-act" style="flex-direction:row;flex-wrap:wrap;gap:14px;margin:8px 0;">'
    +'<label><input type="radio" name="boF" value="start" checked onchange="bloomObsPrev()"> 🌱 '+L2("Au apărut primele flori","First flowers")+'</label>'
    +'<label><input type="radio" name="boF" value="peak" onchange="bloomObsPrev()"> 💯 '+L2("E în plină floare","In full bloom")+'</label></div>'
    +L(L2("📅 Când","📅 When"))+'<input type="date" id="boD" value="'+todayISO()+'" onchange="bloomObsPrev()">'
    +'<div id="boPrev" class="fd-box" style="margin-top:10px;"></div>'
    +'<div class="hv-ts">📍 '+(D.userLoc?L2("Se salvează pentru zona ta","Saved for your area")+' ('+D.userLoc.lat.toFixed(2)+'°N, '+D.userLoc.lon.toFixed(2)+'°E · '+BLOOM_RADIUS_KM+' km)':L2("Locația nu e cunoscută — se aplică oriunde.","Location unknown — applies everywhere."))+'</div>'
    +'<div class="br" style="margin-top:14px;"><button class="btn" onclick="bloomObsSave()">👀 '+btnS()+'</button><button class="btn gh" onclick="closeM()">'+btnC()+'</button></div>');
  bloomObsPrev();
};
window.bloomObsPrev=function(){
  var p=plFind(($q("boP")||{}).value),ph=(document.querySelector("input[name='boF']:checked")||{}).value||"start",d=($q("boD")||{}).value;
  var el=document.getElementById("boPrev");if(!p||!el||!d)return;
  var dv=plObsDev({plant:p.id,phase:ph,date:d});
  var y=parseInt(d.slice(0,4)),base=ph==="peak"?plDoy(y,p.pk[0],p.pk[1],getLatOffset()):plDoy(y,p.b[0],p.b[1],getLatOffset());
  var bd=new Date(y,0,base);
  el.innerHTML=p.ic+' <b>'+esc(plantN(p))+'</b> — '+L2("calendarul spunea","the calendar said")+' '+bd.getDate()+'.'+String(bd.getMonth()+1).padStart(2,"0")
    +' → '+(dv===0?'<b>'+L2("exact la timp","exactly on time")+'</b>':'<b>'+Math.abs(dv)+' '+L2("zile","days")+' '+(dv<0?L2("mai devreme","earlier"):L2("mai târziu","later"))+'</b>')
    +'<div class="hv-ts">'+L2("Plantele care urmează se mută și ele, cu atât mai mult cu cât sunt mai aproape în timp.","The plants that follow shift too — more the closer they are in time.")+'</div>';
};
window.bloomObsSave=function(){
  var p=($q("boP")||{}).value,ph=(document.querySelector("input[name='boF']:checked")||{}).value||"start",d=($q("boD")||{}).value;
  if(!p||!d)return;
  if(!D.bloomObs)D.bloomObs=[];
  var yr=d.slice(0,4),here=plObsHere();
  // same plant + phase + year in the same area → replaced
  D.bloomObs=D.bloomObs.filter(function(o){return !(o.plant===p&&o.phase===ph&&o.date.slice(0,4)===yr&&here.indexOf(o)>=0);});
  D.bloomObs.push({id:uid(),plant:p,phase:ph,date:d,lat:D.userLoc?D.userLoc.lat:null,lon:D.userLoc?D.userLoc.lon:null});
  save(false);closeM();renderCalendar();toast(L2("Observație salvată — calendarul s-a actualizat","Observation saved — calendar updated"),"👀");
};
window.bloomObsDel=function(id){showConfirm(L2("Ștergi observația?","Delete the observation?"),function(){D.bloomObs=(D.bloomObs||[]).filter(function(o){return o.id!==id;});save(false);renderCalendar();});};
