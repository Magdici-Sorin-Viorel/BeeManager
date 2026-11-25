// BeeManager Pro — api.js
// 🧩 Internal API „BM”: one place for reading and computing the app's data. Pages, the voice inspection,
// the PDF sheet and the reports call these instead of searching the D collections themselves, so a number
// (frames, capacity, days since the inspection, what a hive is under) is computed once and shown the same
// everywhere. Synchronous, works on the in-memory model (db.js keeps it in the database).
//   BM.stupi      lista() · roiuri() · toate() · get(id) · nume(id) · stare(id, data?) · capacitate(id) · istoric(id)
//   BM.inspectii  aleStupului(id) · ultima(id) · zileDeLaUltima(id) · neinspectati(zile) · peAn(an, id?)
//   BM.tratamente activePentru(id, data?) · aleStupului(id) · peAn(an, id?)
//   BM.varroa     numaratori(id) · ultima(id) · maxPeAn(an, id)
//   BM.hraniri    activePentru(id, data?) · aleStupului(id) · totalPeAn(an, id?) → {kg, L, pe tip}
//   BM.rame       total(h) · capacitate(h) · mutariPeAn(an, id)
//   BM.flora      catalog() · toate() · get(id) · stare(id, zi?) · inFloare(zi?) · urmeaza(zi?) · culesCurent() · adauga/editeaza/ascunde · observatii (js/flora.js)
//   BM.calendar   inFloare(data?) · urmeaza(data?)  (alias of BM.flora)
//   BM.genealogie copii(id) · parinte(id) · arbore(id)
//   BM.rapoarte   an(an) → per hive: inspections, treatments, feed, varroa, nucs, frames, honey
//   BM.date       backup() · restaureaza(obj) · stare()
// Everything returns plain objects / arrays, never HTML.
var BM=(function(){
  var today=function(){return todayISO();};
  var yearOf=function(d){return String(d||"").slice(0,4);};
  var hiveLive=function(id){return(D.hives||[]).find(function(h){return h.id===id;})||null;};
  var hiveById=function(id){return hiveLive(id)||(D.hivesArchive||[]).find(function(h){return h.id===id;})||null;};

  // ── 🏠 hives ──
  var stupi={
    lista:function(){return(D.hives||[]).filter(function(h){return h.kind!=="roi";});},
    roiuri:function(){return(D.hives||[]).filter(function(h){return h.kind==="roi";});},
    toate:function(){return(D.hives||[]).slice();},
    arhiva:function(){return(D.hivesArchive||[]).slice();},
    get:hiveLive,                 // an active hive / nuc (null if archived)
    getOriArhiva:hiveById,       // also closed nucs / deleted hives kept in the archive
    nume:function(id){var h=hiveById(id);return h?h.name:"—";},
    capacitate:function(id){var h=typeof id==="object"?id:hiveById(id);return h?{cuib:hvCap1(h),cuiburi:parseInt(h.nests)||1,total:hvCap(h)}:null;},
    // everything the hive card shows, as data
    stare:function(id,day){
      var h=typeof id==="object"?id:hiveById(id);if(!h)return null;day=day||today();
      var last=inspectii.ultima(h.id),w=hvWinterState(h),cap=hvCap(h);
      var tr=tratamente.activePentru(h.id,day),fd=hraniri.activePentru(h.id,day);
      var fB=parseInt(h.fB)||0,fH=parseInt(h.fH)||0,fE=parseInt(h.fE)||0,tot=fB+fH+fE;
      var q=typeof hqCurrent==="function"?hqCurrent(h.id):null;
      return{id:h.id,nume:h.name,roi:h.kind==="roi",
        rame:{puiet:fB,mancare:fH,goale:fE,total:tot,capacitate:cap,cuiburi:parseInt(h.nests)||1,libere:Math.max(0,cap-tot),plastic:parseInt(h.plastic)||0,plasticAny:!!h.plAny},
        magazii:(h.mags||[]).length,rameMagazii:(h.mags||[]).reduce(function(s,m){return s+(parseInt(m.f)||0);},0),
        putere:strCalc(fB,fH,w&&w.frames!=null?w.frames:(h.bees!=null?h.bees:null),day),
        matca:q?{rasa:q.race||"",an:q.yr||null,status:q.status||"activă",id:q.id,cod:regine.cod(q),nota:typeof qScoreOf==="function"?qScoreOf(q):null}:null,
        iernare:w?{din:w.since,ghem:w.frames,provizii:w.food}:null,
        ultimaInspectie:last?last.date:null,zileDeLaInspectie:last?inspectii.zileDeLaUltima(h.id):null,
        tratament:tr.length?{id:tr[0].id,produs:trShort(tr[0]),din:tr[0].date,pana:trEnd(tr[0],h.id)}:null,
        hranire:fd.length?{id:fd[0].id,tip:fdTypeShort(fd[0]),cantitate:fdQtyTxt(fd[0]),din:fd[0].date}:null,
        sanatate:last&&last.diseases&&last.diseases.length?last.diseases.slice():[]};
    },
    // everything that happened to a hive, newest first: inspections, treatments, feedings, nucs made from it
    istoric:function(id){
      var ev=[];
      inspectii.aleStupului(id).forEach(function(i){ev.push({tip:"inspectie",data:i.date,id:i.id,text:(i.winterMode?"❄️ Verificare de iarnă":"🔍 Inspecție")+(i.notes?" — "+i.notes:"")});});
      tratamente.aleStupului(id).forEach(function(tr){ev.push({tip:"tratament",data:tr.date,id:tr.id,text:"💊 "+trShort(tr)+(tr.endDate?" → "+devFmt(tr.endDate):"")});});
      hraniri.aleStupului(id).forEach(function(f){fdPortions(f).forEach(function(p){ev.push({tip:"hranire",data:p.date,id:f.id,text:"🍬 "+fdTypeShort(f)+" "+(p.qty||0)+" "+(f.unit||fdType(f).u)});});});
      varroa.numaratori(id).forEach(function(v){ev.push({tip:"varroa",data:v.date,id:v.id,text:"🕷️ "+(v.miteCount!=null?v.miteCount+" varroa":"numărătoare")});});
      genealogie.copii(id).forEach(function(c){ev.push({tip:"roi",data:c.nuc&&c.nuc.start||c.promotedAt||"",id:c.id,text:"🐝 Roi făcut: "+c.name});});
      return ev.filter(function(e){return e.data;}).sort(function(a,b){return a.data<b.data?1:a.data>b.data?-1:0;});
    }
  };

  // ── 🔍 inspections ──
  var inspectii={
    get:function(id){return id?(D.inspections||[]).find(function(i){return i.id===id;})||null:null;},
    aleStupului:function(id){return hvInsps(id);},
    ultima:function(id){return hvInsps(id)[0]||null;},
    zileDeLaUltima:function(id){var l=hvInsps(id)[0];return l?hvDaysSince(l.date):null;},
    // hives past the alert threshold (Setări); nucs and hives in wintering have no weekly alert — same rule everywhere
    neinspectati:function(zile){zile=zile||parseInt(D.settings.inspAlertThreshold)||INSP_ALERT_DEFAULT;
      return stupi.toate().filter(function(h){return h.kind!=="roi"&&!hvWinterState(h);}).map(function(h){var d=inspectii.zileDeLaUltima(h.id);return{id:h.id,nume:h.name,zile:d,h:h};}).filter(function(x){return x.zile==null||x.zile>=zile;});},
    peAn:function(an,id){return(D.inspections||[]).filter(function(i){return yearOf(i.date)===String(an)&&(!id||i.hiveId===id);});}
  };

  // ── 💊 treatments ──
  var tratamente={
    get:function(id){return id?(D.treatments||[]).find(function(x){return x.id===id;})||null:null;},
    activePentru:function(id,day){day=day||today();return(D.treatments||[]).filter(function(tr){return trAppliesTo(tr,id)&&trIsActive(tr,id,day);});},
    aleStupului:function(id){return(D.treatments||[]).filter(function(tr){return trAppliesTo(tr,id);}).sort(function(a,b){return a.date<b.date?1:-1;});},
    // treatments done in a year (planned ones in the future are not counted); a treatment „for all hives” counts
    // for a hive only while that hive existed (a nuc made in September did not get the January oxalic)
    peAn:function(an,id){var h=id?hiveById(id):null,from=h&&(h.nuc&&h.nuc.start||h.created||""),to=h&&h.closed&&h.closed.date||"",td=today();
      return(D.treatments||[]).filter(function(tr){return yearOf(tr.date)===String(an)&&tr.date<=td&&(!id||trAppliesTo(tr,id))&&(!from||tr.date>=from)&&(!to||tr.date<=to);});}
  };

  // ── 🕷️ varroa counts ──
  var varroa={
    numaratori:function(id){return(D.varroa||[]).filter(function(v){return v.hiveId===id;}).sort(function(a,b){return a.date<b.date?1:-1;});},
    ultima:function(id){return varroa.numaratori(id)[0]||null;},
    maxPeAn:function(an,id){var m=null;(D.varroa||[]).forEach(function(v){if(yearOf(v.date)===String(an)&&(!id||v.hiveId===id)&&v.miteCount!=null)m=m==null?v.miteCount:Math.max(m,v.miteCount);});return m;}
  };

  // ── 🍬 feedings ──
  var hraniri={
    get:function(id){return id?(D.feedings||[]).find(function(x){return x.id===id;})||null:null;},
    activePentru:function(id,day){return fdActiveFor(id,day||today());},
    aleStupului:function(id){return(D.feedings||[]).filter(function(f){return fdCovers(f,id);}).sort(function(a,b){return a.date<b.date?1:-1;});},
    // what a hive got in a year, in base units (kg / L), split by feed type; a feeding for several hives is divided between them
    totalPeAn:function(an,id){
      var out={kg:0,L:0,peTip:{}};
      (D.feedings||[]).forEach(function(f){
        if(f.planned)return;var hs=fdHives(f);if(id&&hs.indexOf(id)<0)return;var share=id?1/Math.max(1,hs.length):1;
        fdPortions(f).forEach(function(p){if(yearOf(p.date)!==String(an))return;var u=f.unit||fdType(f).u,q=fdBase(p.qty,u)*share,bu=u==="L"?"L":"kg";
          out[bu]+=q;var k=fdTypeShort(f);out.peTip[k]=(out.peTip[k]||0)+q;});});
      out.kg=+out.kg.toFixed(2);out.L=+out.L.toFixed(2);Object.keys(out.peTip).forEach(function(k){out.peTip[k]=+out.peTip[k].toFixed(2);});
      return out;
    }
  };

  // ── 🧱 frames ──
  var rame={
    total:function(h){return hvTotal(typeof h==="object"?h:hiveById(h)||{});},
    capacitate:function(h){return hvCap(typeof h==="object"?h:hiveById(h)||{});},
    // frames given to / received from other hives in a year
    mutariPeAn:function(an,id){var out={date:0,primite:0};
      inspectii.peAn(an,id).forEach(function(i){if(!i.mv)return;(i.mv.out||[]).forEach(function(r){if(r.dest==="hive"||r.dest==="nuc"||r.dest==="other")out.date+=parseInt(r.n)||0;});/* not the extracted / stored ones */(i.mv.in||[]).forEach(function(r){if(r.src==="hive"||r.src==="other")out.primite+=parseInt(r.n)||0;});});
      return out;}
  };

  // ── 🌸 bloom calendar — kept for compatibility, the real thing is BM.flora (js/flora.js) ──
  var calendar={
    inFloare:function(day){return FLORA.inFloare(day);},
    urmeaza:function(day){return FLORA.urmeaza(day);}
  };

  // ── 👑 queens (calculations in genea.js) ──
  var regine={
    toate:function(){return(D.queens||[]).slice();},
    get:function(id){return(D.queens||[]).find(function(q){return q.id===id;})||null;},
    aleStupului:function(hid){return qHiveQs(hid);},
    actuala:function(hid){return typeof hqCurrent==="function"?hqCurrent(hid):null;},
    mama:function(q){return qMother(typeof q==="object"?q:regine.get(q));},
    fiice:function(q){var id=typeof q==="object"?q.id:q;return(D.queens||[]).filter(function(x){return x.motherQ===id;});},
    perioada:function(q){q=typeof q==="object"?q:regine.get(q);return q?{din:qFrom(q),pana:qTo(q)||null,inStup:!qTo(q)}:null;},
    generatia:function(q){q=typeof q==="object"?q:regine.get(q);return q?qGen(q):null;},
    cod:function(q){q=typeof q==="object"?q:regine.get(q);return q?qCode(q).code+(qGen(q)?"-G"+qGen(q):""):"";},
    eticheta:function(q){q=typeof q==="object"?q:regine.get(q);return q?qLabel(q):"";},
    // the score: total + the six qualities (0–100), with the chosen weights; per year too
    nota:function(q){q=typeof q==="object"?q:regine.get(q);if(!q)return null;var S=genScoresAll()[q.id];if(!S)return null;
      var ani={};Object.keys(S.yrs||{}).sort().forEach(function(y){var Y=S.yrs[y];ani[y]={nota:Y.score,calitati:Y.c||{},kg:Y.kg||0,inspectii:Y.n,ghem:Y.win!=null?Y.win:null};});
      return{nota:S.score,ani:S.years,calitati:S.avg,peAni:ani};},
    kgMiere:function(q){q=typeof q==="object"?q:regine.get(q);if(!q)return 0;var S=genScoresAll()[q.id],kg=0;if(S)Object.keys(S.yrs).forEach(function(y){kg+=S.yrs[y].kg||0;});return +kg.toFixed(1);}
  };
  // ── 🌳 genealogy ──
  var genealogie={
    // the user's weights („Ce contează pentru mine”)
    ponderi:function(){return Object.assign({},genW());},
    profiluri:function(){return GEN_PRESETS.map(function(p){return{id:p.id,nume:p.l,ponderi:p.w};});},
    setProfil:function(id){D.settings.genW={preset:id};save(false);if(typeof _genCache!=="undefined")_genCache=null;},
    setPonderi:function(w){D.settings.genW={preset:"custom",custom:Object.assign({},genW(),w||{})};save(false);if(typeof _genCache!=="undefined")_genCache=null;},
    calitati:function(){return GEN_COMP.map(function(c){return{id:c[0],ico:c[1],nume:c[2]};});},
    // lines (one per founding queen) with their members and the line score
    linii:function(){var M=genModel();return M.lines.map(function(l){return{id:l.r.id,cod:genLineName(l),culoare:l.color,nota:l.score,regine:l.mem.filter(function(n){return !n.pseudo;}).map(function(n){return n.id;}),roiuri:l.mem.filter(function(n){return n.pseudo;}).map(function(n){return n.h.id;})};});},
    linia:function(q){var id=typeof q==="object"?q.id:q,M=genModel(),l=M.lineOf[id];return l?{id:l.r.id,cod:genLineName(l),culoare:l.color,nota:l.score}:null;},
    // ranking of the current queens (active hives), by the total score or one quality
    clasament:function(criteriu,linie){var M=genModel(),S=M.S;
      return stupi.lista().map(function(h){var q=regine.actuala(h.id),s=q?S[q.id]:null,l=q?M.lineOf[q.id]:null;
        return{stupId:h.id,stup:h.name,reginaId:q?q.id:null,regina:q?qLabel(q):null,linie:l?l.r.id:null,nota:s?s.score:null,calitati:s?s.avg:null,oprita:!!(q&&genStoppedAtQ(q))};})
        .filter(function(r){return !linie||r.linie===linie;})
        .sort(function(a,b){var v=function(r){if(!r.calitati)return -1;if(!criteriu||criteriu==="score")return r.nota!=null?r.nota:-1;return r.calitati[criteriu]!=null?r.calitati[criteriu]:-1;};return v(b)-v(a);});},
    ceaMaiBuna:function(criteriu,linie){return genealogie.clasament(criteriu,linie)[0]||null;},
    // hive-level tree (nucs made from a hive)
    copii:function(id){return(D.hives||[]).concat(D.hivesArchive||[]).filter(function(h){return(h.genParent||h.parentId)===id;});},
    parinte:function(id){var h=hiveById(id);return h?hiveById(h.genParent||h.parentId):null;},
    arbore:function(id){var h=hiveById(id);if(!h)return null;return{id:h.id,nume:h.name,roi:h.kind==="roi",arhivat:!(D.hives||[]).some(function(x){return x.id===h.id;}),copii:genealogie.copii(h.id).map(function(c){return genealogie.arbore(c.id);})};}
  };

  // ── 🍯 harvest (extractions) ──
  // D.extractions = [{id, date, cules, rows:[{hiveId, n, type}], kg (total after extraction, null before), fromInsp:[inspection ids], pred}]
  // Honey is extracted from frames collected from several hives at once, so each hive's share = its frames × the
  // reference weight of their type, scaled to the real total. Reference kg/frame: the user's own value (Setări),
  // else what the app learned from past extractions of the same flow (cules) and type, else the standard weight.
  var CULES_T=[{id:"rapita",n:"Rapiță",ic:"🟨"},{id:"salcam",n:"Salcâm",ic:"🌳"},{id:"tei",n:"Tei",ic:"💛"},{id:"floarea",n:"Floarea-soarelui",ic:"🌻"},{id:"poliflora",n:"Polifloră / fâneață",ic:"🌸"},{id:"mana",n:"Mană",ic:"🌲"},{id:"altul",n:"Alt cules",ic:"🍯"}];
  var FR_T=["Dadant 1/2 (magazie)","Dadant 1/1 (cuib)","Langstroth 1/2","Langstroth 1/1","Alt tip"];
  var cules={
    tipuri:function(){var ex={};(D.extractions||[]).forEach(function(e){if(e.cules&&!CULES_T.some(function(c){return c.id===e.cules;}))ex[e.cules]=1;});
      return CULES_T.concat(Object.keys(ex).map(function(k){return{id:k,n:k,ic:"🍯"};}));},
    numeCules:function(id){var c=cules.tipuri().find(function(x){return x.id===id;});return c?c.n:(id||"—");},
    icoCules:function(id){var c=cules.tipuri().find(function(x){return x.id===id;});return c?c.ic:"🍯";},
    tipuriRama:function(){return FR_T.slice();},
    tipRamaStup:function(h){h=typeof h==="object"?h:hiveById(h);var m=String(h&&h.mod||"");return/langstroth/i.test(m)?"Langstroth 1/2":"Dadant 1/2 (magazie)";},
    // where honey frames can be taken from in a hive right now: each super (its frames) and the brood boxes (food frames).
    // Frame type follows the hive model: supers = 1/2, brood boxes = 1/1 (Langstroth or Dadant).
    surse:function(id){var h=hiveById(id);if(!h)return[];var lg=/langstroth/i.test(String(h.mod||"")),out=[];
      (h.mags||[]).forEach(function(m,i){var f=parseInt(m.f)||0;if(!f)return;out.push({src:"mag:"+i,nume:"📦 Magazia "+(i+1),max:f,type:lg?"Langstroth 1/2":"Dadant 1/2 (magazie)",info:f+" rame"+(m.cap?" · "+m.cap+"% căpăcit":"")});});
      var food=parseInt(h.fH)||0;if(food)out.push({src:"nest",nume:"🏠 Cuib — rame cu miere",max:food,type:lg?"Langstroth 1/1":"Dadant 1/1 (cuib)",info:food+" rame cu miere"+((parseInt(h.nests)||1)>1?" în "+h.nests+" cuiburi":"")});
      return out;},
    // takes the frames out of the hive (new extraction, rows not already removed in an inspection).
    // inapoi=true: the extracted frames go back empty (built comb) → same count, no honey; otherwise the hive keeps fewer frames
    aplica:function(e,inapoi){var touched={};
      (e.rows||[]).forEach(function(r){if(r.inspId||!r.src)return;var h=hiveById(r.hiveId);if(!h)return;var n=parseInt(r.n)||0;if(!n)return;touched[h.id]=1;
        if(r.src.indexOf("mag:")===0){var m=(h.mags||[])[parseInt(r.src.slice(4))];if(!m)return;magNorm(m,10);
          var take=Math.min(n,m.f),d=take;["h","e","n"].forEach(function(k){var x=Math.min(d,m[k]);m[k]-=x;d-=x;});
          if(inapoi){m.e+=take;}else m.f-=take;m.cap=m.f?Math.round(m.h/m.f*100/10)*10:0;}
        else if(r.src==="nest"){var nf=hvNestF(h),take2=Math.min(n,parseInt(h.fH)||0),d2=take2;
          for(var j=nf.length-1;j>=0&&d2>0;j--){var x2=Math.min(d2,parseInt(nf[j].f)||0);nf[j].f-=x2;d2-=x2;if(inapoi)nf[j].e=(parseInt(nf[j].e)||0)+x2;}
          h.nestF=nf;h.fH=(parseInt(h.fH)||0)-take2;if(inapoi)h.fE=(parseInt(h.fE)||0)+take2;}
        h.fT=hvTotal(h);});
      Object.keys(touched).forEach(function(id){var h=hiveById(id);if(h){h.magCount=(h.mags||[]).length;h.hasMag=h.magCount>0;if(typeof saveHiveSnapshot==="function")saveHiveSnapshot(id);}});
      e.applied=true;e.inapoi=!!inapoi;return Object.keys(touched);},
    lista:function(){return(D.extractions||[]).slice().sort(function(a,b){return a.date<b.date?1:a.date>b.date?-1:0;});},
    get:function(id){return(D.extractions||[]).find(function(e){return e.id===id;})||null;},
    // reference kg for one full frame of a type: user's value → standard (core.js FW)
    refRama:function(type){var u=D.settings.frameKg&&parseFloat(D.settings.frameKg[type]);return u>0?u:(FW[type]||2);},
    // what the app learned: kg really obtained per frame, per flow + type (and per type over all flows)
    invatat:function(){return D.settings.culesLearn||{};},
    estRama:function(culesId,type){var L=cules.invatat(),k=L[culesId+"|"+type]||L["*|"+type];return k&&k.kg>0?{kg:k.kg,n:k.n,sursa:L[culesId+"|"+type]?"cules":"tip"}:{kg:cules.refRama(type),n:0,sursa:D.settings.frameKg&&D.settings.frameKg[type]?"setare":"standard"};},
    // expected kg for a set of rows
    estimare:function(culesId,rows){var kg=0,n=0;(rows||[]).forEach(function(r){var c=parseInt(r.n)||0;if(!c)return;n+=c;kg+=c*cules.estRama(culesId,r.type||FR_T[0]).kg;});return{kg:+kg.toFixed(1),rame:n};},
    // per-hive split of one extraction (real kg if entered, else the estimate), with kg/frame
    impartire:function(e){
      var rows=(e.rows||[]).filter(function(r){return(parseInt(r.n)||0)>0;}).map(function(r){return Object.assign({},r);}),W=0;
      rows.forEach(function(r){r._w=(parseInt(r.n)||0)*cules.refRama(r.type||FR_T[0]);W+=r._w;});
      var real=e.kg!=null&&e.kg!=="",tot=real?parseFloat(e.kg)||0:cules.estimare(e.cules,rows).kg;
      return{real:real,kg:tot,rame:rows.reduce(function(s,r){return s+(parseInt(r.n)||0);},0),
        stupi:rows.map(function(r){var kg=W?tot*r._w/W:0,n=parseInt(r.n)||0;return{hiveId:r.hiveId,nume:stupi.nume(r.hiveId)||(hiveById(r.hiveId)||{}).name||"—",n:n,type:r.type||FR_T[0],kg:+kg.toFixed(1),kgRama:n?+(kg/n).toFixed(2):0};})};
    },
    // after the real kg is entered: learn kg/frame for each (flow|type) — moving average that follows the last values
    invata:function(e){
      if(e.kg==null||e.kg==="")return;var sp=cules.impartire(e),L=D.settings.culesLearn||(D.settings.culesLearn={}),byT={};
      sp.stupi.forEach(function(r){var t=byT[r.type]||(byT[r.type]={kg:0,n:0});t.kg+=r.kg;t.n+=r.n;});
      Object.keys(byT).forEach(function(t){var o=byT[t].n?byT[t].kg/byT[t].n:0;if(!o)return;
        [e.cules+"|"+t,"*|"+t].forEach(function(k){var L0=L[k];if(!L0||!L0.n)L[k]={kg:+o.toFixed(2),n:1};else L[k]={kg:+((L0.kg+(o-L0.kg)*0.4)).toFixed(2),n:L0.n+1};});});
      e.learned=true;
    },
    salveaza:function(e){
      if(!D.extractions)D.extractions=[];var ex=e.id?cules.get(e.id):null;
      if(!e.id)e.id=uid();e.rows=(e.rows||[]).filter(function(r){return r.hiveId&&(parseInt(r.n)||0)>0;}).map(function(r){return{hiveId:r.hiveId,n:parseInt(r.n)||0,type:r.type||FR_T[0],src:r.src||null,inspId:r.inspId||null};});
      if(e.kg===""||e.kg==null)e.kg=null;else e.kg=parseFloat(e.kg)||0;
      if(e.kg==null&&!e.pred)e.pred=cules.estimare(e.cules,e.rows).kg;
      if(ex)Object.assign(ex,e);else D.extractions.push(e);
      var cur=ex||e;if(cur.kg!=null&&!cur.learned)cules.invata(cur);
      save(false);return cur;
    },
    sterge:function(id){D.extractions=(D.extractions||[]).filter(function(e){return e.id!==id;});save(false);},
    // super frames taken off in inspections (magRmF) in the last `zile` days and not yet in an extraction → rows to confirm
    dinInspectii:function(zile,excludeId){var td=today(),used={};(D.extractions||[]).forEach(function(e){if(e.id!==excludeId)(e.fromInsp||[]).forEach(function(i){used[i]=1;});});
      var out=[];(D.inspections||[]).forEach(function(i){if(!i.date||used[i.id]||!(parseInt(i.magRmF)>0))return;if(hvDaysSince(i.date)>(zile||21)||i.date>td)return;
        var h=hiveById(i.hiveId);if(!h)return;out.push({inspId:i.id,hiveId:i.hiveId,nume:h.name,data:i.date,n:parseInt(i.magRmF),type:cules.tipRamaStup(h)});});
      return out.sort(function(a,b){return a.data<b.data?1:-1;});},
    // forecast from the supers on the hives now: capped frames × kg/frame for the flow in progress
    prognoza:function(culesId){var rows=[],tot=0,fr=0;
      stupi.toate().forEach(function(h){var ms=h.mags||[];if(!ms.length)return;var t=cules.tipRamaStup(h),capF=0,all=0;
        ms.forEach(function(m){var f=parseInt(m.f)||0,c=parseInt(m.cap)||0;all+=f;capF+=f*c/100;});
        if(!all)return;var est=cules.estRama(culesId,t).kg,kg=capF*est;rows.push({hiveId:h.id,nume:h.name,magazii:ms.length,rame:all,capacite:+capF.toFixed(1),kg:+kg.toFixed(1),type:t});tot+=kg;fr+=capF;});
      return{cules:culesId,kg:+tot.toFixed(1),rame:+fr.toFixed(1),stupi:rows.sort(function(a,b){return b.kg-a.kg;})};},
    culesCurent:function(){var p=typeof getFlow==="function"?getFlow():null;if(p&&CULES_T.some(function(c){return c.id===p.id;}))return p.id;var m=parseInt(today().slice(5,7));return m<=5?"rapita":m===6?"tei":m<=8?"floarea":"poliflora";},
    // kg per hive per year (real or estimated), for the card / genealogy / report
    kgStup:function(id,an){var kg=0,est=false;(D.extractions||[]).forEach(function(e){if(an&&yearOf(e.date)!==String(an))return;var sp=cules.impartire(e);sp.stupi.forEach(function(r){if(r.hiveId===id){kg+=r.kg;if(!sp.real)est=true;}});});return{kg:+kg.toFixed(1),estimat:est};},
    kgPeAni:function(id){var o={};(D.extractions||[]).forEach(function(e){var y=yearOf(e.date);cules.impartire(e).stupi.forEach(function(r){if(r.hiveId===id){o[y]=o[y]||{kg:0,estimat:false};o[y].kg=+(o[y].kg+r.kg).toFixed(1);if(e.kg==null)o[y].estimat=true;}});});return o;},
    // per flow per year: totals, kg/frame, per hive average, difference from the previous year of the same flow
    peAni:function(){var m={};
      (D.extractions||[]).forEach(function(e){var y=yearOf(e.date),k=e.cules||"altul",sp=cules.impartire(e),o=m[k]=m[k]||{};var Y=o[y]=o[y]||{kg:0,rame:0,stupi:{},extractii:0,estimat:false};
        Y.kg+=sp.kg;Y.rame+=sp.rame;Y.extractii++;if(!sp.real)Y.estimat=true;sp.stupi.forEach(function(r){Y.stupi[r.hiveId]=(Y.stupi[r.hiveId]||0)+r.kg;});});
      var out=[];Object.keys(m).forEach(function(k){var ys=Object.keys(m[k]).sort(),rows=ys.map(function(y,i){var Y=m[k][y],ns=Object.keys(Y.stupi).length,prev=i?m[k][ys[i-1]]:null;
          return{an:y,kg:+Y.kg.toFixed(1),rame:Y.rame,extractii:Y.extractii,stupi:ns,kgStup:ns?+(Y.kg/ns).toFixed(1):0,kgRama:Y.rame?+(Y.kg/Y.rame).toFixed(2):0,estimat:Y.estimat,
            delta:prev&&prev.kg?Math.round((Y.kg-prev.kg)/prev.kg*100):null,deltaStup:prev&&Object.keys(prev.stupi).length?Math.round((Y.kg/ns-prev.kg/Object.keys(prev.stupi).length)/(prev.kg/Object.keys(prev.stupi).length)*100):null};});
        out.push({cules:k,nume:cules.numeCules(k),ico:cules.icoCules(k),ani:rows});});
      return out.sort(function(a,b){return b.ani.reduce(function(s,y){return s+y.kg;},0)-a.ani.reduce(function(s,y){return s+y.kg;},0);});}
  };

  // ── 📊 reports ──
  var rapoarte={
    an:function(an){an=String(an||new Date().getFullYear());
      var hs=(D.hives||[]).concat((D.hivesArchive||[]).filter(function(h){return yearOf(h.closed&&h.closed.date)===an;}));
      var rows=hs.map(function(h){
        var ins=inspectii.peAn(an,h.id),trs=tratamente.peAn(an,h.id),fd=hraniri.totalPeAn(an,h.id),mv=rame.mutariPeAn(an,h.id);
        var honey=cules.kgStup(h.id,an).kg;
        var magF=ins.reduce(function(s,i){return s+(parseInt(i.magRmF)||0);},0);   // super frames taken off (extracted)
        return{id:h.id,nume:h.name,roi:h.kind==="roi",arhivat:!!h.closed,
          inspectii:ins.length,iarna:ins.filter(function(i){return i.winterMode;}).length,
          tratamente:trs.map(function(t2){return trShort(t2);}),
          hrana:fd,varroaMax:varroa.maxPeAn(an,h.id),
          rameDate:mv.date,ramePrimite:mv.primite,rameMiereScoase:magF,miereKg:+honey.toFixed(1),
          roiuriFacute:genealogie.copii(h.id).filter(function(c){return yearOf(c.nuc&&c.nuc.start||c.promotedAt)===an;}).length,
          botci:ins.filter(function(i){return i.botci;}).length};
      });
      var tot={stupi:rows.length,inspectii:0,tratamente:0,hranaKg:0,hranaL:0,miereKg:0,roiuri:0,rameMiereScoase:0};
      rows.forEach(function(r){tot.inspectii+=r.inspectii;tot.tratamente+=r.tratamente.length;tot.hranaKg+=r.hrana.kg;tot.hranaL+=r.hrana.L;tot.miereKg+=r.miereKg;tot.roiuri+=r.roiuriFacute;tot.rameMiereScoase+=r.rameMiereScoase;});
      tot.hranaKg=+tot.hranaKg.toFixed(1);tot.hranaL=+tot.hranaL.toFixed(1);tot.miereKg=+tot.miereKg.toFixed(1);
      return{an:an,stupi:rows,total:tot};
    },
    ani:function(){var s={};(D.inspections||[]).forEach(function(i){if(i.date)s[yearOf(i.date)]=1;});(D.treatments||[]).forEach(function(t2){if(t2.date)s[yearOf(t2.date)]=1;});
      var y=String(new Date().getFullYear());s[y]=1;return Object.keys(s).sort().reverse();}
  };

  // ── 💾 data ──
  var date={
    backup:function(){return JSON.parse(JSON.stringify(D));},
    restaureaza:function(obj){if(!obj||typeof obj!=="object")return false;D={...D,...obj};save(false);return true;},
    stare:function(){return{stupi:(D.hives||[]).length,inspectii:(D.inspections||[]).length,tratamente:(D.treatments||[]).length,hraniri:(D.feedings||[]).length,varroa:(D.varroa||[]).length,
      bazaDeDate:typeof dbStatus==="function"?dbStatus():null,salvat:D.settings&&D.settings.savedAt?new Date(D.settings.savedAt).toLocaleString():"—"};}
  };

  return{stupi:stupi,inspectii:inspectii,tratamente:tratamente,varroa:varroa,hraniri:hraniri,rame:rame,calendar:calendar,regine:regine,genealogie:genealogie,cules:cules,rapoarte:rapoarte,date:date};
})();
