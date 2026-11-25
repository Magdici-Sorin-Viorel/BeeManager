// BeeManager Pro — advisor.js
// 🧭 SFATURI — the app looks at the data it already has and tells the beekeeper what needs attention.
// Nothing here asks for new input: everything is computed from inspections, frames, supers, treatments,
// varroa counts, feedings, extractions, the bloom calendar, the queens' scores and the weather forecast.
//
// BM.sfaturi  deFacut()            the list „De făcut” (all hives), most urgent first
//             stup(id)             what concerns one hive: {provizii, roire, spatiu, varroa, tendinta}
//             provizii(h)          winter stores: kg in the hive, target, missing kg, syrup needed
//             roire(h)             swarming risk (April–July): level 0 / 1 / 2 + the reasons
//             spatiu(h)            hive full before / during a main flow → put a super on
//             varroa(h)            last count against the thresholds: ok / urmareste / trateaza
//             tendinta(h)          brood going down over the last inspections / far below the apiary's median
//             regineDeSchimbat()   old queens / queens with a low score
//             mamaRecomandata()    the best queen to raise from (the user's own priorities — Genealogie)
//             vreme()              the 7-day forecast marked: good day for an inspection or not
//             produsVreme(p, zi)   is the forecast inside the temperature window of a treatment product?
//             backup()             days since the last backup
// Settings (D.settings.sf): on (the „De făcut” card), winterKg (target stores for a full hive), ascuns {key:day}.
//
// Thresholds (general beekeeping practice — the beekeeper decides, the app only points):
//   • winter stores (shown August–October, until wintering starts): 18 kg for a full hive (Setări → Sfaturi), 8 kg for a nuc; 1 L of 2:1 syrup → ~0,9 kg of stores
//   • varroa, natural drop / day: < 3 ok · 3–10 watch · ≥ 10 treat;  wash (alcohol / sugar): < 1 % · 1–2 % · ≥ 2 %
//   • inspection weather: max ≥ 14 °C, no rain (< 1 mm), wind < 30 km/h

var SF_WINTER_KG=18,SF_WINTER_NUC_KG=8,SF_SYRUP_KG_PER_L=0.9;
var SFATURI=(function(){
  var today=function(){return todayISO();};
  var month=function(){return parseInt(today().slice(5,7));};
  var cfg=function(){var s=D.settings.sf;if(!s||typeof s!=="object")s=D.settings.sf={};return s;};
  var hiveOf=function(h){return typeof h==="object"?h:BM.stupi.get(h);};
  var dAgo=function(d){return hvDaysSince(d);};
  // normal inspections (not winter checks, not frame transfers), newest first
  var normal=function(hid){var td=today();return hvInsps(hid).filter(function(i){return !i.winterMode&&!i.transfer&&i.date<=td;});};

  // ── 🍯 winter stores ──
  var provizii=function(h){
    h=hiveOf(h);if(!h)return null;
    var lg=/langstroth/i.test(String(h.mod||"")),tNest=lg?"Langstroth 1/1":"Dadant 1/1 (cuib)",tMag=lg?"Langstroth 1/2":"Dadant 1/2 (magazie)";
    var fr=parseInt(h.fH)||0,kg=fr*BM.cules.refRama(tNest),mf=0;
    (h.mags||[]).forEach(function(m){var c=Object.assign({},m);if(typeof magNorm==="function")magNorm(c,10);mf+=parseInt(c.h)||0;});
    kg+=mf*BM.cules.refRama(tMag);
    var nuc=hvIsNuc(h),tinta=nuc?SF_WINTER_NUC_KG:(parseFloat(cfg().winterKg)||SF_WINTER_KG);
    var lipsa=Math.max(0,tinta-kg),L=lipsa/SF_SYRUP_KG_PER_L;
    return{kg:+kg.toFixed(1),rameCuib:fr,rameMagazii:mf,tinta:tinta,lipsa:+lipsa.toFixed(1),
      sirop:lipsa>0?Math.ceil(L*2)/2:0,zahar:lipsa>0?+(Math.ceil(L*2)/2*0.89).toFixed(1):0,
      sezon:month()>=8&&month()<=10&&!hvWinterState(h)};       // syrup time: August–October, until the hive is in wintering
  };

  // ── 🐝 swarming risk ──
  var roire=function(h){
    h=hiveOf(h);if(!h||hvIsNuc(h)||hvWinterState(h))return null;
    var m=month();if(m<4||m>7)return null;
    var ins=normal(h.id),li=ins[0];if(!li||dAgo(li.date)>21)return null;      // needs a recent inspection
    var pts=0,why=[],cap=hvCap(h),tot=hvTotal(h),fB=parseInt(h.fB)||0,cap1=hvCap1(h);
    if(li.botci&&li.botciAction!=="removed"){pts+=3;why.push("botci în stup");}
    else if(li.botci){pts+=2;why.push("botci eliminate la ultima inspecție");}
    if(cap-tot<=0){pts+=2;why.push("nicio ramă liberă");}else if(cap-tot===1){pts+=1;why.push("o singură ramă liberă");}
    if(fB>=Math.round(cap1*0.7)){pts+=1;why.push(fB+" rame cu puiet");}
    if(!(h.mags||[]).length){pts+=1;why.push("fără magazie");}
    var q=hqCurrent(h.id),yr=parseInt(today().slice(0,4));
    if(q&&q.yr&&yr-parseInt(q.yr)>=2){pts+=1;why.push("regină din "+q.yr);}
    var fl=flWith(flCtxOfHive(h.id),function(){return FLORA.culesCurent();});if(fl){pts+=1;why.push("cules în curs ("+fl.n.toLowerCase()+")");}
    // a hive that is not strong has no reason to swarm
    if(fB<Math.round(cap1*0.5)&&!li.botci)return{nivel:0,puncte:pts,motive:why};
    var nivel=pts>=5?2:pts>=3?1:0;
    return{nivel:nivel,puncte:pts,motive:why,
      sfat:nivel?(li.botci&&li.botciAction!=="removed"?"Decide ce faci cu botcile: le lași (schimbi regina) sau faci roi":!(h.mags||[]).length?"Pune magazie sau fă un roi":"Dă spațiu (rame de clădit) sau fă un roi"):""};
  };

  // ── 📦 space before / during a main flow ──
  var spatiu=function(h){
    h=hiveOf(h);if(!h||hvIsNuc(h)||hvWinterState(h))return null;
    var m=month();if(m<4||m>8)return null;
    var cap=hvCap(h),tot=hvTotal(h);if(cap-tot>1)return null;
    var mags=h.mags||[],full=mags.length&&mags.every(function(x){var c=Object.assign({},x);if(typeof magNorm==="function")magNorm(c,10);return c.f>0&&c.h>=c.f*0.7;});
    if(mags.length&&!full)return null;
    var cx=flCtxOfHive(h.id),now=flWith(cx,function(){return FLORA.culesCurent();}),next=flWith(cx,function(){return FLORA.urmeaza().filter(function(x){return x.principal&&x.inZile<=10;})[0];});
    if(!now&&!next)return null;
    return{magazii:mags.length,cules:now?now.n:next.nume,inZile:now?0:next.inZile,
      text:(mags.length?"magaziile sunt pline":"cuibul e plin și nu are magazie")+" și "+(now?"e cules de "+now.n.toLowerCase():next.nume.toLowerCase()+" începe în "+next.inZile+" zile")};
  };

  // ── 🕷️ varroa against the thresholds ──
  var vrLevelOf=function(v){
    if(vrIsDrop(v)){var r=vrPerDay(v);return{val:+r.toFixed(1),unit:"/zi",nivel:r<3?"ok":r<10?"urmareste":"trateaza"};}
    var p=v.infestationPct!=null?v.infestationPct:vrCalcPct(v)||0;return{val:p,unit:"%",nivel:p<1?"ok":p<2?"urmareste":"trateaza"};
  };
  var varroa=function(h){
    h=hiveOf(h);if(!h)return null;
    var v=BM.varroa.numaratori(h.id).filter(function(x){return x.date<=today();})[0];if(!v||v.miteCount==null||dAgo(v.date)>45)return null;
    var ph=typeof vrPhase==="function"?vrPhase(v):"monitor";
    if(ph==="during")return null;                       // mites falling during a treatment = the treatment working
    if(BM.tratamente.activePentru(h.id).some(trIsVarroa))return null;
    var L=vrLevelOf(v);
    return{nivel:L.nivel,valoare:L.val,unitate:L.unit,data:v.date,dupaTratament:ph==="after",
      fa:L.nivel==="trateaza"?(ph==="after"?"Repetă tratamentul":"Tratează împotriva varroa"):L.nivel==="urmareste"?"Numără din nou în 2 săptămâni":"",
      text:L.nivel==="trateaza"?(ph==="after"?"după tratament a rămas multă varroa (eficiență slabă)":"peste prag"):L.nivel==="urmareste"?"aproape de prag":"sub prag"};
  };

  // ── 📉 colony going down ──
  var median=function(a){if(!a.length)return 0;a=a.slice().sort(function(x,y){return x-y;});var m=Math.floor(a.length/2);return a.length%2?a[m]:(a[m-1]+a[m])/2;};
  var tendinta=function(h){
    h=hiveOf(h);if(!h||hvIsNuc(h)||hvWinterState(h))return null;
    var m=month();if(m<4||m>8)return null;               // in autumn the brood goes down anyway
    var ins=normal(h.id).filter(function(i){return dAgo(i.date)<=60;}).slice(0,3);
    var out=null;
    if(ins.length>=3){var a=parseInt(ins[2].fB)||0,b=parseInt(ins[1].fB)||0,c=parseInt(ins[0].fB)||0;
      if(c<b&&b<a&&a-c>=2)out={tip:"scade",fa:"Verifică regina și puietul",text:"puietul scade de două inspecții: "+a+" → "+b+" → "+c+" rame",de:a,la:c};}
    if(!out&&ins.length>=1){
      var all=BM.stupi.lista().filter(function(x){return !hvWinterState(x);}).map(function(x){return parseInt(x.fB)||0;}),med=median(all),fB=parseInt(h.fB)||0;
      if(all.length>=4&&med>=4&&fB<=med*0.5)out={tip:"subMedie",fa:"Verifică stupul",text:"mult sub media stupinei: "+fB+" rame cu puiet (mediana "+String(med).replace(".",",")+")",de:med,la:fB};}
    return out;
  };

  // ── 👑 queens ──
  var regineDeSchimbat=function(){
    var yr=parseInt(today().slice(0,4)),out=[];
    BM.stupi.lista().forEach(function(h){var q=hqCurrent(h.id);if(!q)return;
      var age=q.yr?yr-parseInt(q.yr):null,sc=typeof qScoreOf==="function"?qScoreOf(q):null,why=[];
      if(age!=null&&age>=3)why.push("are "+age+" ani");
      if(sc!=null&&sc<40)why.push("nota "+sc);
      if(why.length)out.push({stupId:h.id,stup:h.name,reginaId:q.id,varsta:age,nota:sc,motive:why});});
    return out.sort(function(a,b){return(a.nota!=null?a.nota:50)-(b.nota!=null?b.nota:50);});
  };
  var mamaRecomandata=function(){
    var r=BM.genealogie.clasament().filter(function(x){return x.nota!=null&&!x.oprita;})[0];
    return r?{stupId:r.stupId,stup:r.stup,nota:r.nota,regina:r.regina}:null;
  };

  // ── 🌤️ weather: good days for work ──
  var DOW=["Du","Lu","Ma","Mi","Jo","Vi","Sâ"];
  var vreme=function(){
    var ds=D.weather&&D.weather.days;if(!ds||!ds.length)return[];
    var td=today();
    return ds.filter(function(x){return x.d>=td;}).map(function(x){
      var why=[];if(x.tmax<14)why.push("prea rece, "+x.tmax+"°");if(x.prec>=1)why.push("ploaie");if(x.wind>=30)why.push("vânt "+x.wind+" km/h");
      var dt=new Date(x.d+"T12:00:00");
      return{data:x.d,zi:x.d===td?"Azi":DOW[dt.getDay()],tmax:x.tmax,tmin:x.tmin,prec:x.prec,vant:x.wind,ico:wmoI(x.wc).i,buna:!why.length,ideala:!why.length&&x.tmax>=18&&x.wind<20,motiv:why.join(", ")};});
  };
  // temperature windows of the products (from the product's own leaflet in general terms)
  var PROD_T=[
    {re:/timol|thymol|apiguard|thymovar|apilife/i,min:15,max:30,txt:"timolul lucrează bine între 15 și 30 °C"},
    {re:/formic|maqs|formicpro|formic pro|varromed/i,min:10,max:29,txt:"acidul formic se aplică între 10 și 29 °C"},
    {re:/oxalic|api-?bioxal|oxuvar|dany/i,min:3,max:14,txt:"acidul oxalic se aplică la rece (3–14 °C), când nu e puiet"},
    {re:/amitraz|apivar|varachet|flumetrin|bayvarol|fluvalinat|apistan|mavrirol/i,min:10,max:35,txt:"benzile lucrează când albinele sunt active (peste 10 °C)"}
  ];
  var produsVreme=function(prod,zi){
    var p=PROD_T.filter(function(x){return x.re.test(prod||"");})[0];if(!p)return null;
    var ds=(D.weather&&D.weather.days||[]).filter(function(x){return x.d>=(zi||today());}).slice(0,5);
    if(!ds.length)return{ok:null,text:cap(p.txt)+" (nu am prognoza ca să verific).",min:p.min,max:p.max};
    var lo=Math.min.apply(null,ds.map(function(x){return x.tmax;})),hi=Math.max.apply(null,ds.map(function(x){return x.tmax;}));
    var ok=hi<=p.max&&lo>=p.min;
    // the verdict first, the explanation after
    return{ok:ok,min:p.min,max:p.max,text:(ok?"✓ Vremea e potrivită pentru acest produs":hi>p.max?"⚠️ Prea cald pentru acest produs":"⚠️ Prea rece pentru acest produs")+" — maxime de "+lo+"…"+hi+" °C în zilele următoare; "+p.txt+"."};
  };

  // ── 💾 backup ──
  var backup=function(){
    var n=BM.stupi.numar(),last=D.settings.driveLastExport||0;
    if(!n||BM.inspectii.numar()<3)return null;
    var d=last?Math.floor((Date.now()-last)/86400000):null;
    return{zile:d,necesar:d==null||d>=14};
  };

  // ── everything about one hive (for its card) ──
  var stup=function(h){h=hiveOf(h);if(!h)return null;return{provizii:provizii(h),roire:roire(h),spatiu:spatiu(h),varroa:varroa(h),tendinta:tendinta(h)};};

  // ── 📋 „De făcut” ──
  // item: {key, tip, urg (3 urgent · 2 this week · 1 good to know), ico, t, s, hid, act}
  var deFacut=function(){
    var td=today(),out=[],m=month();
    var add=function(o){out.push(o);};
    var hs=BM.stupi.randuri();
    // inspections overdue
    var th=hvThreshold();
    BM.inspectii.neinspectati(th).forEach(function(x){add({key:"insp:"+x.id,tip:"insp",urg:x.zile==null||x.zile>=th*2?3:2,ico:"🔍",t:x.nume,s:x.zile==null?"Fă prima inspecție — stupul nu a fost inspectat niciodată":"Fă inspecția — au trecut "+x.zile+" zile de la ultima",hid:x.id,act:"inspM('"+x.id+"')"});});
    hs.forEach(function(h){
      var nuc=hvIsNuc(h),ins=hvInsps(h.id);
      // queen cells removed → check again
      var iq=ins.filter(function(i){return i.botci&&i.botciAction;})[0];
      if(iq&&iq.botciAction==="removed"){
        var rc=devAdd(iq.date,DEV.recheckRemoved),last=devAdd(iq.date,DEV.capDeadline),chk=ins.some(function(i){return i.date>iq.date;});
        if(!chk&&last>=td&&td>=devAdd(rc,-1))add({key:"botci:"+h.id+iq.date,tip:"botci",urg:td>=rc?3:2,ico:"✂️",t:h.name,s:(td===rc?"Verifică botcile azi":td>rc?"Verifică botcile acum":"Verifică botcile mâine")+" — "+(td>rc?"termen depășit, ultima zi e "+devFmt(last):"le-ai eliminat pe "+devFmt(iq.date)+", pot fi altele noi"),hid:h.id,act:"inspM('"+h.id+"')"});
      }
      // new queen: laying check
      var qs=devQueenState(h.id,td);
      if(qs&&qs.phase==="laying")add({key:"ponta:"+h.id+qs.q.layFrom,tip:"regina",urg:td>qs.q.layTo?3:2,ico:"👑",t:h.name,s:td>qs.q.layTo?"Verifică dacă are regină — nicio pontă confirmată până la termen ("+devFmt(qs.q.layTo)+")":"Verifică ponta până pe "+devFmt(qs.q.layTo)+" — regină nouă",hid:h.id,act:"inspM('"+h.id+"')"});
      if(nuc&&typeof nucNoQueenSrc==="function"&&nucNoQueenSrc(h)&&!hqCurrent(h.id))add({key:"nucq:"+h.id,tip:"regina",urg:3,ico:"🐝",t:h.name,s:"Dă-i o ramă cu ouă sau o botcă — roiul nu are din ce crește regină",hid:h.id,act:"inspM('"+h.id+"')"});
      // planned feeding due
      var fp=fdPlannedFor(h.id)[0];
      if(fp&&fp.date<=devAdd(td,1))add({key:"hrana:"+fp.id+h.id,tip:"hrana",urg:fp.date<td?3:2,ico:"🍬",t:h.name,s:(fp.date<td?"Hrănește acum":fp.date===td?"Hrănește azi":"Hrănește mâine")+" — hrănire planificată"+(fp.date<td?" pe "+devFmt(fp.date)+", întârziată":"")+" · "+fdTypeShort(fp),hid:h.id,act:"fdStartM('"+fp.id+"','"+h.id+"')"});
      // advice computed from the hive's data
      var A=stup(h);
      if(A.roire&&A.roire.nivel)add({key:"roire:"+h.id,tip:"roire",urg:A.roire.nivel===2?3:2,ico:"🐝",t:h.name,s:A.roire.sfat+" — risc de roire"+(A.roire.nivel===2?" mare":"")+": "+A.roire.motive.slice(0,3).join(", "),hid:h.id,act:"inspM('"+h.id+"')"});
      if(A.spatiu)add({key:"spatiu:"+h.id,tip:"spatiu",urg:A.spatiu.inZile<=3?3:2,ico:"📦",t:h.name,s:"Pune magazie — "+A.spatiu.text,hid:h.id,act:"inspM('"+h.id+"')"});
      if(A.varroa&&A.varroa.nivel!=="ok")add({key:"varroa:"+h.id+A.varroa.data,tip:"varroa",urg:A.varroa.nivel==="trateaza"?3:1,ico:"🕷️",t:h.name,s:A.varroa.fa+" — varroa "+String(A.varroa.valoare).replace(".",",")+" "+A.varroa.unitate+", "+A.varroa.text,hid:h.id,act:"go('treatments')"});
      if(A.tendinta)add({key:"scade:"+h.id,tip:"scade",urg:2,ico:"📉",t:h.name,s:A.tendinta.fa+" — "+A.tendinta.text,hid:h.id,act:"inspM('"+h.id+"')"});
      if(A.provizii&&A.provizii.sezon&&A.provizii.lipsa>=2&&!fdActiveFor(h.id).length)add({key:"provizii:"+h.id,tip:"provizii",urg:m>=10?3:2,ico:"🍯",t:h.name,s:"Hrănește: ~"+String(A.provizii.sirop).replace(".",",")+" L sirop 2:1 — are ~"+String(A.provizii.kg).replace(".",",")+" kg provizii din "+A.provizii.tinta,hid:h.id,act:"hrM('',{hiveId:'"+h.id+"'})"});
    });
    // treatments: ending now / planned soon / count after
    BM.tratamente.randuri().forEach(function(tr){
      if(!tr.date)return;var e=tr.endDate||"";
      if(e&&!tr.done&&dAgo(e)>=0&&dAgo(e)<=3&&tr.date<=td)add({key:"trfin:"+tr.id,tip:"tratament",urg:2,ico:"💊",t:trShort(tr)||"Tratament",s:"Încheie tratamentul (scoate benzile) — "+(dAgo(e)===0?"se termină azi":"s-a terminat acum "+dAgo(e)+" zile")+(tr.hiveId?" · "+BM.stupi.nume(tr.hiveId):" · toți stupii"),act:"go('treatments')"});
      if(tr.date>td&&dAgo(tr.date)>=-3)add({key:"trpl:"+tr.id,tip:"tratament",urg:dAgo(tr.date)>=-1?3:2,ico:"🗓️",t:trShort(tr)||"Tratament",s:"Pregătește tratamentul — planificat "+(dAgo(tr.date)===-1?"mâine":"în "+(-dAgo(tr.date))+" zile")+(tr.hiveId?" · "+BM.stupi.nume(tr.hiveId):" · toți stupii"),act:"go('treatments')"});
      if(trIsVarroa(tr)&&e&&dAgo(e)>=5&&dAgo(e)<=30){
        var ids=tr.hiveId?[tr.hiveId]:BM.stupi.lista().map(function(h){return h.id;});
        var noCount=ids.filter(function(id){return BM.stupi.get(id)&&!BM.varroa.numaratori(id).some(function(v){return v.date>e;});});
        if(noCount.length)add({key:"vrdupa:"+tr.id,tip:"varroa",urg:1,ico:"🕷️",t:trShort(tr)||"Tratament",s:"Numără varroa — tratamentul s-a încheiat, "+noCount.length+" "+(noCount.length===1?"stup":"stupi")+" fără numărătoare de control (așa vezi cât a fost de eficient)",act:"vrM('',{hiveId:'"+noCount[0]+"',treatmentId:'"+tr.id+"'})"});
      }
    });
    // harvest
    BM.cules.lista().filter(function(e){return e.kg==null;}).forEach(function(e){add({key:"kg:"+e.id,tip:"cules",urg:1,ico:"⚖️",t:"Extracție "+BM.cules.numeCules(e.cules).toLowerCase(),s:"Pune kilogramele — extracția din "+devFmt(e.date)+" nu are cantitatea",act:"go('cules');cuKgM('"+e.id+"')"});});
    var di=BM.cules.dinInspectii(21);
    if(di.length)add({key:"rame:"+di.map(function(x){return x.inspId;}).join(""),tip:"cules",urg:1,ico:"🍯",t:"Rame de miere scoase",s:"Trece ramele la Cules — "+di.reduce(function(s,x){return s+x.n;},0)+" rame scoase din "+di.length+" "+(di.length===1?"stup":"stupi")+", neînregistrate",act:"go('cules');cuM()"});
    // a main flow about to start
    FLORA.vetre().forEach(function(cx){
      if(cx.tip==="trip"&&!BM.pastorala.randuri().some(function(p){return p.id===cx.id&&pActive(p);}))return;   // planned trips: not yet
      flWith(cx,function(){FLORA.urmeaza().filter(function(x){return x.principal&&x.inZile<=7;}).forEach(function(x){
        add({key:"cules:"+cx.id+x.id+td.slice(0,4),tip:"flora",urg:1,ico:"🌸",t:x.nume+(cx.tip==="trip"?" · "+cx.nume:""),s:"Pregătește magaziile — culesul începe în "+x.inZile+" "+(x.inZile===1?"zi":"zile"),act:"BM.flora.alegeContext('"+cx.id+"');go('calendar')"});});});});
    // queens to replace (in the season when it can be done)
    if(m>=4&&m<=8){var rq=regineDeSchimbat();if(rq.length)add({key:"regine:"+rq.length,tip:"regine",urg:1,ico:"👑",t:rq.length+" "+(rq.length===1?"regină":"regine")+" de schimbat",s:"Schimbă regina — "+rq.slice(0,3).map(function(r){return r.stup+" ("+r.motive.join(", ")+")";}).join(" · "),act:"go('genealogie')"});}
    // backup
    var bk=backup();
    if(bk&&bk.necesar)add({key:"backup",tip:"backup",urg:1,ico:"💾",t:"Backup",s:bk.zile==null?"Fă un backup — nu ai niciunul, datele stau doar în telefon":"Fă un backup — ultimul e de acum "+bk.zile+" zile",act:"go('settings');seOpen('backup')"});
    // hidden for today
    var off=cfg().ascuns||{};
    return out.filter(function(o){return off[o.key]!==td;}).sort(function(a,b){return b.urg-a.urg;});
  };
  var ascunde=function(key){var c=cfg();if(!c.ascuns)c.ascuns={};var td=today();Object.keys(c.ascuns).forEach(function(k){if(c.ascuns[k]!==td)delete c.ascuns[k];});c.ascuns[key]=td;save(false);};

  return{deFacut:deFacut,ascunde:ascunde,stup:stup,provizii:provizii,roire:roire,spatiu:spatiu,varroa:varroa,tendinta:tendinta,
    regineDeSchimbat:regineDeSchimbat,mamaRecomandata:mamaRecomandata,vreme:vreme,produsVreme:produsVreme,backup:backup,setari:cfg};
})();
if(typeof BM==="object"&&BM)BM.sfaturi=SFATURI;

// ═══════════════════════════════════════════
// DISPLAY
// ═══════════════════════════════════════════
// 📋 the „De făcut” card on top of the Hives page (replaces the old „neinspectați” alert when it is on)
// "Action — reason" → the action in bold on its own line, the reason under it
function sfActHTML(s){var i=s.indexOf(" — ");return i<0?'<b>'+esc(cap(s))+'</b>':'<b>'+esc(cap(s.slice(0,i)))+'</b><span>'+esc(cap(s.slice(i+3)))+'</span>';}
var SF_TIP={insp:"Inspecții",botci:"Botci",regina:"Regine noi",hrana:"Hrăniri",roire:"Risc de roire",spatiu:"Spațiu",varroa:"Varroa",scade:"Colonii în scădere",provizii:"Provizii de iarnă",tratament:"Tratamente",cules:"Cules",flora:"Culesuri",regine:"Regine",backup:"Date"};
function sfOn(){return SFATURI.setari().on!==false;}
var SF_DAY=["duminică","luni","marți","miercuri","joi","vineri","sâmbătă"];
function sfWxVerdictHTML(w){
  // said so it cannot be misread: first whether there is a good day at all, then which ones
  var good=w.filter(function(x){return x.buna;}),nm=function(x){return x.zi==="Azi"?"azi":SF_DAY[new Date(x.data+"T12:00:00").getDay()];};
  if(!good.length)return'<div class="td-wxl no">❌ <b>Nicio zi bună de inspecție</b> în următoarele '+w.length+' zile'+(w[0].motiv?' <span>· azi: '+esc(w[0].motiv)+'</span>':'')+'</div>';
  var today=w[0].zi==="Azi"&&w[0].buna,rest=good.filter(function(x){return x.zi!=="Azi";}).map(nm);
  if(today)return'<div class="td-wxl ok">✅ <b>Azi e zi bună de inspecție</b>'+(rest.length?' <span>· mai sunt bune: '+rest.join(", ")+'</span>':' <span>· singura din următoarele '+w.length+' zile</span>')+'</div>';
  return'<div class="td-wxl wait">⏳ <b>Azi NU e zi bună de inspecție</b>'+(w[0].motiv?' — '+esc(w[0].motiv):'')+'<br><span>Zile bune: <b>'+rest.join(", ")+'</b></span></div>';
}
function sfWxStripHTML(){
  var w=SFATURI.vreme().slice(0,7);if(!w.length)return"";
  return sfWxVerdictHTML(w)+'<div class="td-wx" title="Zi bună de inspecție: cel puțin 14 °C, fără ploaie, fără vânt tare">'+w.map(function(x){
    return'<div class="td-wd'+(x.buna?(x.ideala?" best":" ok"):" no")+'"><b>'+x.zi+'</b><span>'+x.ico+'</span><i>'+x.tmax+'°</i><em>'+(x.buna?"✓":"✕")+'</em></div>';}).join("")+'</div>';
}
var _sfOpen=false;   // closed at every start of the app — the user opens it to see what there is to do
function sfTodoHTML(){
  if(!sfOn())return typeof hvAlertHTML==="function"?hvAlertHTML():"";
  var l=SFATURI.deFacut(),open=_sfOpen;
  var u3=l.filter(function(x){return x.urg===3;}).length,u2=l.filter(function(x){return x.urg===2;}).length;
  var wx=sfWxStripHTML();
  if(!l.length&&!wx)return"";
  // same kind more than 3 times → one row with a chip per hive
  var groups={},order=[];l.forEach(function(x){var k=x.tip+"|"+x.urg;if(!groups[k]){groups[k]=[];order.push(k);}groups[k].push(x);});
  var row=function(x){return'<div class="td-it u'+x.urg+'">'
    +'<button class="td-ck" title="Gata pentru azi" aria-label="Gata pentru azi" onclick="event.stopPropagation();sfDone(\''+esc(x.key)+'\')"></button>'
    +'<div class="td-b" role="button" onclick="'+x.act+'"><span class="td-i">'+x.ico+'</span><div class="td-tx"><small>'+esc(x.t)+'</small>'+sfActHTML(x.s)+'</div><span class="hv-arr">›</span></div></div>';};
  var body=order.map(function(k){var g=groups[k];
    if(g.length<=3||!g[0].hid)return g.map(row).join("");
    return'<div class="td-it u'+g[0].urg+' grp"><span class="td-i">'+g[0].ico+'</span><div class="td-tx"><b>'+esc(cap(g[0].s.split(" — ")[0].replace(/ (azi|mâine|acum)$/,"")))+' · '+g.length+' stupi</b>'
      +'<div class="td-chips">'+g.map(function(x){return'<span class="bg '+(x.urg===3?"gr":"gy")+'" role="button" title="'+esc(x.s)+'" onclick="'+x.act+'">'+esc(x.t)+'</span>';}).join("")+'</div></div></div>';}).join("");
  return'<div class="c td-card'+(u3?" has3":"")+'">'
    +'<div class="td-h" role="button" onclick="sfToggle()"><b>📋 De făcut</b>'
    +(u3?'<span class="bg gr">'+u3+' urgent'+(u3>1?"e":"")+'</span>':'')+(u2?'<span class="bg gy">'+u2+' săptămâna asta</span>':'')+(l.length&&!u3&&!u2?'<span class="bg gb">'+l.length+' de știut</span>':'')+(!l.length?'<span class="bg gg">✓ nimic de făcut</span>':'')
    +'<span class="hv-arr">'+(open?"▲":"▼")+'</span></div>'
    +'<div class="td-body" style="display:'+(open?"block":"none")+'">'+wx+(l.length?'<div class="td-list">'+body+'</div>':'')+'</div></div>';
}
window.sfToggle=function(){_sfOpen=!_sfOpen;render();};
window.sfDone=function(key){SFATURI.ascunde(key);render();toast("Ascuns pentru azi — revine mâine dacă mai e valabil","✓");};

// rows on the hive card (only what applies now)
function sfHiveRows(h){
  if(!sfOn())return[];
  var A=SFATURI.stup(h),rows=[];if(!A)return rows;
  if(A.roire&&A.roire.nivel)rows.push(hvStRow(A.roire.nivel===2?"bad":"warn","🐝",A.roire.sfat,"Risc de roire"+(A.roire.nivel===2?" mare":"")+": "+A.roire.motive.join(" · "),"inspM('"+h.id+"')"));
  if(A.spatiu)rows.push(hvStRow("warn","📦","Pune magazie",cap(A.spatiu.text),"inspM('"+h.id+"')"));
  if(A.varroa&&A.varroa.nivel!=="ok")rows.push(hvStRow(A.varroa.nivel==="trateaza"?"bad":"warn","🕷️",A.varroa.fa,"Varroa "+String(A.varroa.valoare).replace(".",",")+" "+A.varroa.unitate+" — "+A.varroa.text+' · numărat '+hvAgo(A.varroa.data),"go('treatments')"));
  if(A.tendinta)rows.push(hvStRow("warn","📉",A.tendinta.fa,"Colonie în scădere — "+A.tendinta.text,"hvInspToggle('"+h.id+"')"));
  if(A.provizii&&A.provizii.sezon&&!hvWinterState(h)){var P=A.provizii,k=function(x){return String(x).replace(".",",");};
    rows.push(P.lipsa>=2
      ?hvStRow("warn","🍯","Hrănește: ~"+k(P.sirop)+" L sirop 2:1 ("+k(P.zahar)+" kg zahăr)","Provizii de iarnă prea puține: ~"+k(P.kg)+" kg din "+P.tinta+" (lipsesc ~"+k(P.lipsa)+" kg)","hrM('',{hiveId:'"+h.id+"'})")
      :hvStRow("ok","🍯","Provizii de iarnă suficiente","~"+k(P.kg)+" kg din "+P.tinta+(P.rameCuib?" · "+P.rameCuib+" rame cu miere în cuib":""),""));}
  return rows;
}

// 👑 Genealogie: queens worth replacing
function sfQueensCardHTML(){
  if(!sfOn())return"";
  var l=SFATURI.regineDeSchimbat();if(!l.length)return"";
  return'<div class="c td-q"><div class="ct">👑 Regine de schimbat</div>'
    +'<p class="hv-ts" style="margin:0 0 8px;">Regine de 3 ani sau mai mult, ori cu nota sub 40 (după ce contează pentru tine).</p>'
    +l.map(function(r){return'<div class="td-qr" role="button" onclick="genCard(\''+r.reginaId+'\')"><b>'+esc(r.stup)+'</b><span>'+esc(r.motive.join(" · "))+'</span><span class="hv-arr">›</span></div>';}).join("")+'</div>';
}
// 🐝 nuc form: the recommended mother
function sfNucHintHTML(){
  if(!sfOn())return"";
  var r=SFATURI.mamaRecomandata();if(!r)return"";
  return'<div class="td-hint">⭐ Cea mai bună mamă după ce contează pentru tine: <b>'+esc(r.stup)+'</b> (nota '+r.nota+') '
    +'<button type="button" class="gen-chip" onclick="var s=$q(\'nDon\');if(s){s.value=\''+r.stupId+'\';nucPrev();}">alege</button></div>';
}
// 💊 treatment form: product against the forecast
window.sfTrWx=function(){
  var el=document.getElementById("tWx");if(!el)return;
  var r=sfOn()?SFATURI.produsVreme(($q("tPr")||{}).value,($q("tDt")||{}).value):null;
  el.innerHTML=r?'<div class="al '+(r.ok===false?"alw":"ali")+'" style="font-size:.76rem;padding:6px 10px;margin:8px 0;">🌡️ '+esc(cap(r.text))+'</div>':"";
};

// ⚙️ Settings card
function sfCardHTML(){
  var c=SFATURI.setari();
  return'<div class="c" style="margin-bottom:14px;"><div class="ct">🧭 Sfaturi</div>'
    +'<p class="bk-p">Aplicația se uită la ce ai notat (inspecții, rame, tratamente, hrăniri, cules, calendar, vreme) și îți arată ce cere atenție: lista „De făcut” de pe pagina Stupi și rândurile de pe cardul stupului.</p>'
    +'<div class="ck" style="margin:0 0 12px;padding:10px 12px;border:1px solid var(--bdr);border-radius:var(--rs);"><input type="checkbox" id="sfOnC"'+(c.on!==false?" checked":"")+' onchange="BM.sfaturi.setari().on=this.checked;save(false);"><label for="sfOnC">📋 Arată „De făcut” și sfaturile pe carduri</label></div>'
    +'<div class="ck" style="margin:0 0 12px;padding:10px 12px;border:1px solid var(--bdr);border-radius:var(--rs);"><input type="checkbox" id="sfWxC"'+(c.wx!==false?" checked":"")+' onchange="BM.sfaturi.setari().wx=this.checked;plAdjReset();save(false);"><label for="sfWxC">🌡️ Mută calendarul de înflorire după temperaturile de anul acesta (Open-Meteo, gratuit)</label></div>'
    +L("🍯 Provizii de iarnă pentru un stup plin (kg)")
    +'<input type="number" inputmode="decimal" min="8" max="30" step="1" value="'+esc(c.winterKg||SF_WINTER_KG)+'" style="max-width:110px;" oninput="BM.sfaturi.setari().winterKg=parseFloat(this.value)||'+SF_WINTER_KG+';save(false);">'
    +'<p class="hv-ts" style="margin:8px 0 0;line-height:1.5;">Calculul: rame cu miere din cuib și magazii × kg pe ramă (Cules → kg pe ramă). 1 L sirop 2:1 ≈ 0,9 kg provizii. Roiurile: '+SF_WINTER_NUC_KG+' kg.<br>'
    +'Varroa: cădere naturală sub 3 / zi e bine, 3–10 de urmărit, peste 10 de tratat; spălare: sub 1 % · 1–2 % · peste 2 %.<br>'
    +'Zi bună de inspecție: cel puțin 14 °C, fără ploaie, vânt sub 30 km/h.</p></div>';
}
