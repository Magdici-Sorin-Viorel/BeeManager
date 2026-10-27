// BeeManager Pro — demo.js
// 🧪 DEMO DATA for trying the app in the Claude preview only: 3 hives with a full year 2026
// (10 inspections each, two genetic lines + a nuc made from hive 1, feedings, treatments, varroa
// counts, pastorage, supers with % capped, queen cells, frames added / removed, wintering check,
// January winter-mode checks and weighings).
// It NEVER runs on the real app (GitHub Pages) or on localhost — only on other hosts (the preview),
// or anywhere when the address ends with ?demo. The file can be deleted anytime
// (plus its line in index.html and the call in app.js / settings.js).

var DEMO_V=7;   // bump to reload the demo data once more in the preview

function demoHost(){
  var h=location.hostname||"",q=location.search||"";
  if(/[?&]demo\b/.test(q))return true;
  return !(/github\.io$/.test(h)||h==="localhost"||h==="127.0.0.1");
}
function demoMaybe(){
  if(!demoHost())return;
  if(D.settings&&D.settings.demoV===DEMO_V)return;
  demoApply();
}
function demoApply(){
  var R=demoBuild();
  ["hives","queens","inspections","treatments","varroa","feedings","pastorage","tasks","hivesArchive","bloomObs"].forEach(function(k){D[k]=R[k]||[];});
  D.settings.demoV=DEMO_V;
  save(false);
}
window.demoReload=function(){
  showConfirm("Reîncarc datele de probă (3 stupi, anul 2026)? Ce ai modificat aici se pierde.",function(){demoApply();location.reload();},null,"🧪 Da, reîncarcă");
};
function demoCardHTML(){
  if(!demoHost())return"";
  return'<div class="c" style="margin-bottom:14px;border-color:rgba(230,180,34,.5);"><div class="ct">🧪 Date de probă</div>'
    +'<p style="font-size:.78rem;color:var(--mut);margin:4px 0 10px;line-height:1.45;">Aici (în previzualizare) aplicația are 3 stupi de probă cu tot anul 2026. În aplicația de pe telefon (GitHub) datele de probă nu apar niciodată.</p>'
    +'<button class="btn gh" onclick="demoReload()">🔄 Reîncarcă datele de probă</button></div>';
}

function demoBuild(){
  var O=t("q_origins")||[];   // 0 Cumpărată · 1 Din roi propriu · 3 Import · 4 Natural (roi) · 5 Schimbare naturală
  var R={hives:[],queens:[],inspections:[],treatments:[],varroa:[],feedings:[],pastorage:[],tasks:[],hivesArchive:[],bloomObs:[]};
  var W={sun:"☀️ Însorit",part:"⛅ Parțial noros",cloud:"☁️ Înnorat"};
  function M(list){return list.map(function(x){return{f:x[0],cap:x[1]};});}
  function capSum(m){return Math.round(m.reduce(function(s,x){return s+x.f*x.cap/100;},0));}
  // one inspection; o overrides the defaults
  function I(hid,date,o){
    var mags=o.mags||[];
    var x=Object.assign({id:"di_"+hid+"_"+date,hiveId:hid,date:date,weather:W.sun,temp:22,smoke:"putin",structC:"ok",structN:"",
      behav:2,qSeen:true,eggs:true,larvae:true,capped:true,qQual:"buna",calcBrood:false,
      botci:false,botciN:0,botciS:"",botciF:"",botciAction:"",fB:5,fH:3,fP:0,popPct:90,bp:"compact",space:"suficient",
      diseases:["Sănătos"],diseaseN:"",notes:"",winter:null,feeding:null,treatments:[]},o);
    // frame movements (🔄): build the movement rows from the short fIn / fOut notation
    if(!x.mv&&(x.fIn||x.fOut)){x.mv={out:[],in:[]};var fi=x.fIn||{},fo=x.fOut||{};
      if(fi.n)x.mv.in.push({n:fi.n,t:"f",src:"new"});if(fi.h)x.mv.in.push({n:fi.h,t:"h",src:"store"});if(fi.b)x.mv.in.push({n:fi.b,t:"b",src:"other"});
      if(fo.h)x.mv.out.push({n:fo.h,t:"h",dest:"extract"});if(fo.p)x.mv.out.push({n:fo.p,t:"p",dest:"store"});if(fo.n)x.mv.out.push({n:fo.n,t:"e",dest:"store"});
      if(fo.b)x.mv.out.push({n:fo.b,t:"b",dest:"other"});}
    x.mags=mags;x.magCount=mags.length;x.hasMag=mags.length>0;x.magT=mags.reduce(function(s,m){return s+m.f;},0);x.magCap=capSum(mags);
    R.inspections.push(x);return x;
  }
  function Q(id,hid,from,race,orig,o){
    var q=Object.assign({id:id,hive:hid,yr:parseInt(from.slice(0,4)),from:from,race:race,lay:4,aggr:null,orig:orig,origHive:null,line:"",status:"activă",motherQ:null,motherSet:true},o||{});
    R.queens.push(q);return q;
  }

  // ── Hives ──
  R.hives.push({id:"d1",num:1,name:"Stupul 1",loc:"Stupina Giroc",mat:"Lemn",mod:"Dadant 10 rame",sc:"green",notes:"",magF:10});
  R.hives.push({id:"d2",num:2,name:"Stupul 2",loc:"Stupina Giroc",mat:"Lemn",mod:"Dadant 10 rame",sc:"green",notes:"",magF:10});
  R.hives.push({id:"d3",num:3,name:"Stupul 3",loc:"Stupina Giroc",mat:"Polistiren",mod:"Dadant 10 rame",sc:"green",notes:"Format din Stupul 1 (roi artificial)",magF:10,
    parentId:"d1",genParent:"d1",promotedAt:"2026-06-12",
    nuc:{start:"2026-05-08",found:false,max:6,stage:{egg:true,larva:true,capped:true,cell:false},taken:{donor:"d1",fB:2,fH:1},motherQ:"dq1"}});

  // Roi 1: nuc made from Stupul 2 on 5 September, queen raised in it (daughter of the Buckfast) — wintered as a nuc
  R.hives.push({id:"dr1",num:101,name:"Roi 1",kind:"roi",loc:"Stupina Giroc",mat:"Polistiren",mod:"Cutie roi 6 rame",sc:"green",notes:"Roi de rezervă, iernează în cutie de roi",magF:0,
    parentId:"d2",genParent:"d2",
    nuc:{start:"2026-09-05",found:false,max:6,stage:{egg:true,larva:true,capped:true,cell:false},taken:{donor:"d2",fB:2,fH:1},motherQ:"dq3"}});
  // a failed nuc (closed branch in Genealogie): from Stupul 1 in June, the queen didn't come back from mating
  R.hivesArchive.push({id:"dx1",num:102,name:"Roi A",kind:"roi",fB:2,fH:1,parentId:"d1",genParent:"d1",mod:"Cutie roi 6 rame",
    nuc:{start:"2026-06-15",found:false,max:6,stage:{egg:true,larva:true,capped:true,cell:false},taken:{donor:"d1",fB:2,fH:1},motherQ:"dq1"},
    closed:{date:"2026-07-12",reason:"esuat",into:null,note:"Matca nu s-a mai întors de la zborul de împerechere"}});

  // ── Queens / genealogy ──
  // Stupul 1: Carpatina bought in 2025 → root of the CPT line
  Q("dq1","d1","2025-05-14","Carpatina",O[0]);
  // Stupul 2: old queen from a caught swarm (2024), replaced in April 2026 by an imported Buckfast → new BUK line
  Q("dq2","d2","2024-06-02","",O[4],{status:"înlocuită",replacedAt:"2026-04-25"});
  Q("dq3","d2","2026-04-25","Buckfast",O[3]);
  // Stupul 3: nuc made from Stupul 1 on 8 May, own queen raised there → daughter of dq1 (generation 2 of CPT)
  Q("dq4","d3","2026-06-05","Carpatina",O[1],{origHive:"d1",motherQ:"dq1"});
  // Roi 1: queen raised from Stupul 2's Buckfast → generation 2 of BUK
  Q("dq5","dr1","2026-10-02","Buckfast",O[1],{origHive:"d2",motherQ:"dq3"});

  // ── January: winter-mode checks (oxalic acid treatment day) + weighing ──
  I("d1","2026-01-10",{weather:W.cloud,temp:4,winterMode:true,behav:null,qSeen:false,eggs:false,larvae:false,capped:false,fB:0,fH:7,
    winter:{frames:6,food:null},wch:{food:"ok",buzz:"ok",dead:"few",flags:[]},weight:{kg:34.5,raw:34.5,method:"full"},notes:"Tratament cu acid oxalic"});
  I("d2","2026-01-10",{weather:W.cloud,temp:4,winterMode:true,behav:null,qSeen:false,eggs:false,larvae:false,capped:false,fB:0,fH:6,
    winter:{frames:4,food:null},wch:{food:"limit",buzz:"ok",dead:"many",flags:["damp"]},weight:{kg:13.6,raw:13.6,method:"back"},notes:"Am pus candy, umezeală la capac"});

  // ── Stupul 1 — strong colony, acacia + sunflower pastorage ──
  I("d1","2026-03-18",{weather:W.part,temp:14,fB:4,fH:5,qSeen:false,capped:true,notes:"Prima revizie, iernare bună"});
  I("d1","2026-04-08",{temp:18,fB:6,fH:4,behav:2,fIn:{n:2,h:0,b:0},notes:"Am lărgit cuibul cu 2 faguri"});
  I("d1","2026-04-25",{temp:21,fB:8,fH:3,mags:M([[10,10]]),notes:"Pus magazia pentru rapiță"});
  I("d1","2026-05-10",{temp:24,fB:9,fH:2,mags:M([[10,40],[10,0]]),botci:true,botciN:4,botciS:"incipient",botciAction:"removed",
    fOut:{n:0,h:0,p:0,b:2,a:2},mv:{out:[{n:2,t:"ba",dest:"nuc",nucId:"d3"}],in:[]},notes:"Botci de roire — am scos 2 rame cu puiet și albine pentru roiul nou (Stupul 3)"});
  I("d1","2026-05-24",{temp:26,fB:8,fH:3,mags:M([[10,90],[10,60],[10,10]]),notes:"La salcâm, cules foarte bun"});
  I("d1","2026-06-10",{temp:27,fB:8,fH:3,mags:M([[10,20]]),magRmS:2,magRmF:20,fOut:{n:0,h:20,p:0,b:0,a:0},notes:"Extras 2 magazii de salcâm"});
  I("d1","2026-06-28",{temp:30,fB:7,fH:3,mags:M([[10,70],[10,20]]),notes:"Tei, cules mediu"});
  I("d1","2026-07-20",{temp:31,fB:6,fH:4,mags:M([[10,100],[10,80],[10,40]]),behav:3,notes:"La floarea-soarelui, ceva mai agitate"});
  I("d1","2026-08-25",{temp:27,fB:4,fH:5,mags:M([]),magRmS:3,magRmF:30,fOut:{n:0,h:28,p:2,b:0,a:0},diseases:["Varroa"],
    notes:"Extras floarea-soarelui, pus Apivar"});
  I("d1","2026-10-08",{weather:W.cloud,temp:13,fB:2,fH:7,eggs:false,larvae:false,capped:true,qSeen:true,winter:{frames:8,food:7},weight:{kg:42.5,raw:42.5,method:"full"},
    notes:"Pregătit de iarnă, provizii suficiente"});

  // ── Stupul 2 — queen replaced with Buckfast in April ──
  I("d2","2026-03-20",{weather:W.part,temp:14,fB:3,fH:4,behav:4,notes:"Familie medie, albine agresive"});
  I("d2","2026-04-10",{temp:18,fB:4,fH:3,behav:4,notes:"Matca veche slăbită — comandat matcă Buckfast"});
  I("d2","2026-04-25",{temp:20,fB:3,fH:3,qSeen:false,eggs:false,larvae:true,behav:3,notes:"Introdus matca Buckfast în cușcă"});
  I("d2","2026-05-12",{temp:23,fB:5,fH:3,behav:2,mags:M([[10,30]]),fIn:{n:2,h:0,b:0},notes:"Matca nouă depune frumos"});
  I("d2","2026-05-26",{temp:25,fB:7,fH:3,behav:1,mags:M([[10,80],[10,30]]),notes:"La salcâm, foarte blânde"});
  I("d2","2026-06-12",{temp:28,fB:8,fH:3,behav:1,mags:M([[10,20]]),magRmS:2,magRmF:20,botci:true,botciN:2,botciS:"incipient",botciAction:"removed",
    fOut:{n:0,h:18,p:0,b:0,a:0},notes:"Extras salcâm, 2 botci eliminate"});
  I("d2","2026-07-01",{temp:30,fB:8,fH:3,behav:1,mags:M([[10,60],[10,20]]),notes:"Tei"});
  I("d2","2026-07-22",{temp:32,fB:7,fH:4,behav:1,mags:M([[10,90],[10,50]]),notes:"Cules de vară"});
  I("d2","2026-08-27",{temp:26,fB:5,fH:5,behav:1,mags:M([]),magRmS:2,magRmF:20,fOut:{n:0,h:14,p:0,b:0,a:0},
    diseases:["Varroa"],notes:"Extras, pus Apivar"});
  I("d2","2026-10-10",{weather:W.cloud,temp:12,fB:2,fH:6,eggs:false,larvae:false,behav:1,winter:{frames:7,food:6},weight:{kg:19.4,raw:19.4,method:"back"},notes:"Bun de iernare"});

  // ── Stupul 3 — nuc from Stupul 1 (8 May), queen raised in it, promoted to hive on 12 June ──
  I("d3","2026-05-15",{temp:23,fB:2,fH:1,qSeen:false,eggs:false,larvae:false,capped:true,botci:true,botciN:3,botciS:"căpăcite",botciAction:"keep",
    notes:"Roiul a crescut 3 botci, le-am lăsat"});
  I("d3","2026-05-22",{temp:24,fB:2,fH:1,qSeen:false,eggs:false,larvae:false,capped:true,qEmerged:true,notes:"Matca a ieșit din botcă"});
  I("d3","2026-05-29",{temp:25,fB:1,fH:2,qSeen:true,eggs:false,larvae:false,capped:false,notes:"Matca văzută, încă neîmperecheată"});
  I("d3","2026-06-05",{temp:26,fB:2,fH:2,qSeen:true,eggs:true,larvae:false,capped:false,qMated:true,notes:"Ouă depuse — matca împerecheată"});
  I("d3","2026-06-12",{temp:27,fB:3,fH:2,fIn:{n:2,h:1,b:0},mv:{out:[],in:[{n:2,t:"f",pl:true,src:"new"},{n:1,t:"h",src:"store"}]},notes:"Mutat din cutia de roi în stup Dadant — pornit pe rame cu fundație de plastic"});
  I("d3","2026-06-26",{temp:29,fB:4,fH:3,notes:"Se dezvoltă bine"});
  I("d3","2026-07-15",{temp:31,fB:5,fH:3,fIn:{n:1,h:0,b:0},mv:{out:[],in:[{n:1,t:"f",pl:true,src:"new"}]},nFramesB:2,mags:M([[10,20]]),notes:"Pus o magazie"});
  I("d3","2026-08-05",{temp:30,fB:5,fH:4,mags:M([[10,60]]),notes:"Albine blânde"});
  I("d3","2026-09-02",{temp:24,fB:4,fH:5,mags:M([]),magRmS:1,magRmF:10,fOut:{n:0,h:6,p:0,b:0,a:0},diseases:["Varroa"],notes:"Scos magazia, hrănire de toamnă"});
  I("d3","2026-10-12",{weather:W.cloud,temp:12,fB:2,fH:5,eggs:false,larvae:false,winter:{frames:6,food:5},weight:{kg:31,raw:31,method:"full"},notes:"Familie tânără, iernează pe 6 rame"});

  // ── Roi 1 (nuc from Stupul 2) ──
  I("dr1","2026-09-12",{temp:24,fB:2,fH:1,qSeen:false,eggs:false,larvae:false,capped:true,botci:true,botciN:2,botciS:"căpăcite",botciAction:"keep",notes:"2 botci căpăcite"});
  I("dr1","2026-09-20",{temp:22,fB:1,fH:2,qSeen:false,eggs:false,larvae:false,capped:true,qEmerged:true,notes:"Matca a ieșit"});
  I("dr1","2026-10-02",{temp:19,fB:1,fH:2,qSeen:true,eggs:true,larvae:false,capped:false,qMated:true,notes:"Ouă — matca e împerecheată"});
  I("dr1","2026-10-20",{temp:14,fB:2,fH:2,qSeen:true,eggs:true,larvae:true,capped:true,notes:"Iernează ca roi pe 4 rame, hrănit cu candy"});

  // ── end of October: hives 1 and 2 already checked in winter mode → shown as „În iernare” ──
  I("d1","2026-10-25",{weather:W.cloud,temp:9,winterMode:true,behav:null,qSeen:false,eggs:false,larvae:false,capped:false,fB:2,fH:7,
    winter:{frames:8,food:null},wch:{food:"ok",buzz:"ok",dead:"few",flags:[]},weight:{kg:41.8,raw:41.8,method:"full"},notes:"Redus urdinișul, pus gratie anti-șoareci"});
  I("d2","2026-10-25",{weather:W.cloud,temp:9,winterMode:true,behav:null,qSeen:false,eggs:false,larvae:false,capped:false,fB:2,fH:5,
    winter:{frames:6,food:null},wch:{food:"limit",buzz:"ok",dead:"few",flags:[]},weight:{kg:17.9,raw:17.9,method:"back"},notes:"Proviziile la limită — de pus candy"});

  // current hive state = last inspection
  R.hives.forEach(function(h){
    var last=R.inspections.filter(function(i){return i.hiveId===h.id;}).sort(function(a,b){return a.date<b.date?-1:1;}).pop();
    if(!last)return;h.fB=last.fB;h.fH=last.fH;h.fT=h.fB+h.fH;h.str=strCalc(h.fB,h.fH,last.winter?last.winter.frames:null,last.date);
    if(last.winter){h.bees=last.winter.frames;h.beesDate=last.date;}
    h.mags=last.mags.slice();h.magCount=h.mags.length;h.hasMag=h.mags.length>0;
    // ⬜ plastic frames = the ones on the rows (Stupul 3 started with 4 plastic frames when moved into the Dadant box)
    h.plastic=(h.id==="d3"?1:0)+R.inspections.filter(function(i){return i.hiveId===h.id&&i.mv;}).reduce(function(a,i){return a+mvPlNet(i.mv);},0);
  });

  // ── Pastorage: acacia (Stupul 1 + 2) and sunflower (Stupul 1) ──
  R.pastorage=[
    {id:"dp1",trip:true,hiveIds:["d1","d2"],location:"Pădurea Bazoș",target:"Salcâm",startDate:"2026-05-14",plannedEnd:"2026-06-05",returned:{d1:"2026-06-04",d2:"2026-06-04"},endDate:"2026-06-04",notes:"Lângă cantonul silvic"},
    {id:"dp2",trip:true,hiveIds:["d1"],location:"Câmpia Recaș",target:"Floarea-soarelui",startDate:"2026-07-08",plannedEnd:"2026-08-15",returned:{d1:"2026-08-18"},endDate:"2026-08-18",notes:""}];
  R.inspections.forEach(function(i){R.pastorage.forEach(function(p){
    var back=p.returned[i.hiveId]||p.endDate;
    if(p.hiveIds.indexOf(i.hiveId)>=0&&i.date>=p.startDate&&i.date<back){i.pastId=p.id;i.pastLoc=p.location;}});});

  // ── Feedings ──
  R.feedings=[
    {id:"df1",per:true,allHives:false,hiveIds:["d1","d2"],date:"2026-03-18",feedType:"sirop_1_1",unit:"L",reason:"🌱 Stimulare primăvară",notes:"",
      portions:[{date:"2026-03-18",qty:1},{date:"2026-03-28",qty:1},{date:"2026-04-08",qty:1}],qty:3,endDate:"2026-04-15",doneHives:{}},
    {id:"df2",per:false,allHives:false,hiveIds:["d2"],hiveId:"d2",date:"2026-03-20",feedType:"candy",unit:"g",reason:"🌱 Stimulare primăvară",notes:"Turtă de 300 g",
      portions:[{date:"2026-03-20",qty:300}],qty:300,endDate:"2026-04-10",doneHives:{}},
    {id:"df3",per:true,allHives:false,hiveIds:["d3"],date:"2026-05-15",feedType:"sirop_1_1",unit:"L",reason:"🆕 Familie nouă / roi",notes:"",
      portions:[{date:"2026-05-15",qty:0.5},{date:"2026-05-22",qty:0.5},{date:"2026-05-29",qty:0.5},{date:"2026-06-05",qty:0.5}],qty:2,endDate:"2026-06-12",doneHives:{}},
    {id:"df4",per:true,allHives:false,hiveIds:["d1","d2","d3"],date:"2026-08-28",feedType:"sirop_2_1",unit:"L",reason:"📦 Completare rezerve",notes:"",
      portions:[{date:"2026-08-28",qty:5},{date:"2026-09-02",qty:4},{date:"2026-09-08",qty:5},{date:"2026-09-15",qty:4}],qty:18,endDate:"2026-09-25",doneHives:{}},
    {id:"df6",per:true,allHives:false,hiveIds:["dr1"],date:"2026-09-05",feedType:"sirop_1_1",unit:"L",reason:"🆕 Familie nouă / roi",notes:"",
      portions:[{date:"2026-09-05",qty:0.5},{date:"2026-09-12",qty:0.5},{date:"2026-09-20",qty:0.5}],qty:1.5,endDate:"2026-10-02",doneHives:{}},
    {id:"df5",per:true,allHives:false,hiveIds:["d3"],date:"2026-10-12",feedType:"candy",unit:"kg",reason:"❄️ Hrănire de iarnă",notes:"Familia tânără",
      portions:[{date:"2026-10-12",qty:1}],qty:1,doneHives:{}}];

  // ── Treatments (varroa) ──
  R.treatments=[
    {id:"dt1",target:"varroa",product:"💧 Acid oxalic — picurare (soluție 3,5% în sirop)",hiveId:null,date:"2026-01-10",endDate:"2026-01-10",done:"2026-01-10",dosage:"5 ml / interval",notes:"Tratament de iarnă, fără puiet"},
    {id:"dt2",target:"varroa",product:"Amitraz — Apivar benzi",hiveId:null,date:"2026-08-25",endDate:"2026-10-06",done:"2026-10-08",dosage:"2 benzi / stup",notes:"După extracția de vară"},
    {id:"dt3",target:"varroa",product:"💧 Acid oxalic — picurare (soluție 3,5% în sirop)",hiveId:null,date:"2026-12-05",endDate:"2026-12-05",dosage:"5 ml / interval",notes:"Planificat — când nu mai e puiet"}];

  // ── Varroa counts ──
  R.varroa=[
    {id:"dv1",hiveId:"d1",date:"2026-08-12",method:"natural",miteCount:24,beeCount:null,hours:72,infestationPct:null,hasBrood:true,treatmentId:null,reapplied:false,inspectionId:null,notes:"Placă 3 zile"},
    {id:"dv2",hiveId:"d2",date:"2026-08-14",method:"alcohol",miteCount:9,beeCount:300,hours:null,infestationPct:3,hasBrood:true,treatmentId:null,reapplied:false,inspectionId:null,notes:""},
    {id:"dv3",hiveId:"d3",date:"2026-08-30",method:"sugar",miteCount:4,beeCount:300,hours:null,infestationPct:1.33,hasBrood:true,treatmentId:null,reapplied:false,inspectionId:null,notes:""},
    {id:"dv4",hiveId:"d1",date:"2026-10-08",method:"natural",miteCount:2,beeCount:null,hours:72,infestationPct:null,hasBrood:false,treatmentId:"dt2",reapplied:false,inspectionId:null,notes:"După Apivar"},
    {id:"dv5",hiveId:"d2",date:"2026-10-10",method:"alcohol",miteCount:1,beeCount:300,hours:null,infestationPct:0.33,hasBrood:false,treatmentId:"dt2",reapplied:false,inspectionId:null,notes:"După Apivar"}];

  // ── Bloom observations (👀 Calendar) ──
  R.bloomObs=[["rapita","start","2026-04-12"],["salcam","start","2026-04-30"],["salcam","peak","2026-05-08"],["tei","start","2026-06-04"],["floarea","start","2026-06-28"]]
    .map(function(x,i){return{id:"dbo"+i,plant:x[0],phase:x[1],date:x[2],lat:null,lon:null};});
  return R;
}
