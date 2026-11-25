// BeeManager Pro — genea.js
// 🌳 Genealogy — the calculations only (no HTML): queens of a hive, mother / daughters, time in the hive, line codes,
// the queen score with its six qualities and the user's weights, the genealogy model (lines, nodes, children).
// Moved unchanged from nucs.js so that every page and the internal API (BM.regine / BM.genealogie, api.js) use the
// same numbers. nucs.js keeps the nuc forms and the drawing of the tree.
// Genetic parent: by the hive's queens (from the current one back to older ones)
function genParentOf(h){
  if(!h)return{root:true,why:"start"};
  if(h.genRoot)return h.genRoot;   // trace of a deleted hive
  var qs=BM.regine.randuri().filter(function(q){return q.hive===h.id;});
  for(var i=qs.length-1;i>=0;i--){
    var q=qs[i],k=qOrigIdx(q.orig);
    if(k===0||k===3)return{root:true,why:"bought",q:q};
    if(k===4)return{root:true,why:"natural",q:q};
    if(q.origHive&&q.origHive!==h.id)return{parent:q.origHive,q:q};
    // raised in hive / no source hive → same line: go to the previous queen
  }
  if(h.genParent)return{parent:h.genParent};
  if(h.nuc&&h.nuc.found)return{root:true,why:"found"};
  return{root:true,why:"start"};
}
function qHiveQs(hid){return BM.regine.randuri().filter(function(q){return q.hive===hid;});}
function qFind(id){return id?BM.regine.rand(id):null;}
function qFrom(q){
  if(q.from)return q.from;
  var hs=qHiveQs(q.hive),i=hs.indexOf(q);
  if(i>0&&hs[i-1].replacedAt)return hs[i-1].replacedAt;
  var h=genFind(q.hive);if(h&&h.promotedAt&&i<=0)return h.promotedAt;
  return q.yr?q.yr+"-04-01":"2000-01-01";
}
function qTo(q){
  if(q.replacedAt)return q.replacedAt;
  if(q.status==="înlocuită"){var hs=qHiveQs(q.hive),i=hs.indexOf(q);return hs[i+1]?qFrom(hs[i+1]):qFrom(q);}
  return null;
}
function qAt(hid,date){
  var hs=qHiveQs(hid);if(!hs.length)return null;
  var m=hs.filter(function(q){var t2=qTo(q);return qFrom(q)<=date&&(!t2||t2>date);});
  return m.length?m[m.length-1]:hs[0];
}
function qPrevInHive(q){var hs=qHiveQs(q.hive),i=hs.indexOf(q);return i>0?hs[i-1]:null;}
function qMother(q){
  if(q.motherQ!==undefined&&q.motherQ!==null)return qFind(q.motherQ);
  if(q.motherQ===null&&q.motherSet)return null;
  var k=qOrigIdx(q.orig);
  if(k===0||k===3||k===4)return null;
  if(k===5)return qPrevInHive(q);
  if(q.origHive&&q.origHive!==q.hive)return qAt(q.origHive,qFrom(q));
  if(q.origHive===q.hive)return qPrevInHive(q);
  var h=genFind(q.hive);
  if(h&&h.nuc&&!h.nuc.found&&qHiveQs(q.hive)[0]===q)return qFind(h.nuc.motherQ)||(h.genParent?qAt(h.genParent,h.nuc.start||qFrom(q)):null);
  return qPrevInHive(q);
}
function qRootWhy(q){var k=qOrigIdx(q.orig);return k===0||k===3?"bought":k===4?"natural":"start";}
function genStoppedAtQ(q){var seen={};while(q&&!seen[q.id]){seen[q.id]=1;if(q.lineStop)return q.lineStop;q=qMother(q);}return null;}
function genStoppedAt(h){var q=hqCurrent(h.id);return q?genStoppedAtQ(q):(h.lineStop||null);}
function qYr2(d){return d?"'"+d.slice(2,4):"";}
function qLabel(q){var h=genFind(q.hive),c=qCode(q);return c.code+" G"+c.gen+" · "+(h?genShort(h):"?")+" "+qYr2(qFrom(q));}
function qLabelS(q){var h=genFind(q.hive);return"G"+qCode(q).gen+" "+(h?genShort(h):"?")+" "+qYr2(qFrom(q));}

// ── Genealogy line code: BREED-NNN (e.g. CPT-001), same for all generations of the line ──
// Given to the queen at the start of the line (bought / import / found swarm) and stays fixed (q.lineCode).
// Generation (G0 = line start, G1 = daughters, G2 = granddaughters…) is shown next to the code.
var RACE_CODES=[[/carpat/,"CPT"],[/buckfast/,"BUK"],[/ital|ligust|cordovan/,"ITA"],[/carni/,"CAR"],[/cauca/,"CAU"]];
function raceCode(race){var r=(race||"").toLowerCase();if(!r)return"NEC";for(var i=0;i<RACE_CODES.length;i++)if(RACE_CODES[i][0].test(r))return RACE_CODES[i][1];return"ALT";}
function qRoot(q){var seen={},m;while(q&&!seen[q.id]&&(m=qMother(q))){seen[q.id]=1;q=m;}return q;}
function qGen(q){var g=0,seen={},m;while(q&&!seen[q.id]&&(m=qMother(q))){seen[q.id]=1;q=m;g++;}return g;}
var _lcT=0;
function ensureLineCodes(force){
  var n=Date.now();if(!force&&n-_lcT<1500)return;_lcT=n;
  var roots=BM.regine.randuri().filter(function(q){return !qMother(q);}).sort(function(a,b){return qFrom(a)<qFrom(b)?-1:1;});
  var max={},changed=false;
  BM.regine.randuri().forEach(function(q){var m=/^([A-Z]{3})-(\d+)$/.exec(q.lineCode||"");if(m)max[m[1]]=Math.max(max[m[1]]||0,parseInt(m[2]));});
  roots.forEach(function(q){var pre=raceCode(q.race);
    if(q.lineCode&&q.lineCode.indexOf(pre+"-")===0)return;
    max[pre]=(max[pre]||0)+1;q.lineCode=pre+"-"+("00"+max[pre]).slice(-3);changed=true;});
  if(changed)save(false);
}
function qCode(q){if(!q)return{code:"—",gen:0};ensureLineCodes();var r=qRoot(q);return{code:r.lineCode||raceCode(r.race),gen:qGen(q),root:r};}
function qCodeTag(q){var c=qCode(q);return'<span class="qc-tag">'+esc(c.code)+' <b>G'+c.gen+'</b></span>';}

// ── Scores: per year, from inspections made while the queen was in the hive ──
// 🍯 honey 40% (peak capped frames in supers, vs. the best in the same year)
// 😊 gentleness 20% (aggressiveness 1 → 100, 5 → 0) · 🐝 swarming 20% (0% inspections with cells → 100, ≥50% → 0)
// ❄️ wintering 20% (frames with bees going into winter: ≤3 → 0, ≥9 → 100)
// A missing component → weight spread over the others. Weights: GEN_PRESETS below / the user's own (D.settings.genW).
// 🎯 what matters to you: the weights of the score. Presets, or your own numbers (D.settings.genW).
var GEN_PRESETS=[
  {id:"bal",l:"⚖️ Echilibrat",w:{honey:25,gentle:15,swarm:15,brood:15,winter:15,health:15}},
  {id:"honey",l:"🍯 Miere",w:{honey:50,gentle:10,swarm:10,brood:10,winter:10,health:10}},
  {id:"gentle",l:"😊 Blândețe",w:{honey:10,gentle:50,swarm:10,brood:10,winter:10,health:10}},
  {id:"swarm",l:"🐝 Fără roire",w:{honey:10,gentle:10,swarm:50,brood:10,winter:10,health:10}},
  {id:"brood",l:"🥚 Puiet / pontă",w:{honey:10,gentle:10,swarm:10,brood:50,winter:10,health:10}},
  {id:"winter",l:"🌤️ Adaptare la vreme",w:{honey:10,gentle:10,swarm:10,brood:10,winter:50,health:10}},
  {id:"health",l:"🩺 Sănătate",w:{honey:10,gentle:10,swarm:10,brood:10,winter:10,health:50}}];
var GEN_COMP=[["honey","🍯","Miere"],["gentle","😊","Blândețe"],["swarm","🐝","Fără roire"],["brood","🥚","Puiet"],["winter","🌤️","Adaptare"],["health","🩺","Sănătate"]];
function genW(){var g=D.settings.genW;if(g&&g.custom)return Object.assign({health:0},g.custom);var p=GEN_PRESETS.find(function(x){return x.id===(g&&g.preset);})||GEN_PRESETS[0];return p.w;}
window.genSetPreset=function(id){BM.genealogie.setProfil(id);renderGenealogy();};
window.genSetCustom=function(k,v){var w={};w[k]=Math.max(0,Math.min(100,parseInt(v)||0));BM.genealogie.setPonderi(w);renderGenealogy();};
function genScoresAll(){
  var W=genW();
  var res={},best={},bestKg={},bestBr={},bestSpr={},worstV={};
  // 🌤️ first flow of each year = first extraction (Cules); without one, 10 May — spring build-up is judged until then
  var flowAt={};BM.cules.randuri().forEach(function(e){var y=String(e.date||"").slice(0,4);if(y&&(!flowAt[y]||e.date<flowAt[y]))flowAt[y]=e.date;});
  BM.regine.randuri().forEach(function(q){
    var f=qFrom(q),t2=qTo(q),h=genFind(q.hive),yrs={};
    BM.inspectii.randuri().forEach(function(i){
      if(i.hiveId!==q.hive||!i.date||i.date<f||(t2&&i.date>=t2))return;
      if(h&&h.nuc&&!h.promotedAt&&h.kind==="roi")return;
      var y=i.date.slice(0,4),Y=yrs[y]=yrs[y]||{n:0,ag:[],sw:0,cap:null,win:null,sup:0};
      if(i.winterMode){   // ❄️ winter inspection: only the cluster size counts (no temperament / swarming data)
        if(i.winter&&i.winter.frames!=null&&(i.date.slice(5,7)>="10"||Y.win==null))Y.win=parseInt(i.winter.frames);
        return;}
      Y.n++;if(i.behav)Y.ag.push(parseInt(i.behav));if(i.botci)Y.sw++;
      var mo=i.date.slice(5,7);if(mo>="04"&&mo<="08"){Y.br=Y.br||[];Y.br.push(parseInt(i.fB)||0);}   // 🥚 brood frames in the laying season
      // 🌤️ spring build-up: brood frames reached by the first flow (relative to the brood-box capacity) — the earlier/bigger, the better
      var fl=flowAt[y]||(y+"-05-10");if(mo>="02"&&i.date<=fl){var cap=h?hvCap(h):10,ratio=Math.min(1,(parseInt(i.fB)||0)/Math.max(1,cap));Y.spr=Math.max(Y.spr||0,ratio);}
      // 🩺 health: inspections with a disease noted (anything but „Sănătos”), varroa counted that year (below)
      Y.hn=(Y.hn||0)+1;if((i.diseases||[]).some(function(d){return d&&!/^s[ăa]n[ăa]tos$/i.test(d);}))Y.ill=(Y.ill||0)+1;
      var ms=Array.isArray(i.mags)?i.mags:null;
      var capF=ms?ms.reduce(function(s,m){return s+(parseInt(m.f)||0)*(parseInt(m.cap)||0)/100;},0):(i.magCap!=null?parseInt(i.magCap)||0:null);
      if(capF!=null)Y.cap=Math.max(Y.cap||0,capF);
      Y.sup=Math.max(Y.sup,ms?ms.length:(parseInt(i.magCount)||0));
      if(i.winter&&i.winter.frames!=null)Y.win=parseInt(i.winter.frames);
    });
    // 🍯 real honey: kg extracted from this hive while this queen was in it (Cules page) — beats the capped-frames proxy
    BM.cules.randuri().forEach(function(e){if(!e.date||e.date<f||(t2&&e.date>=t2))return;var y=e.date.slice(0,4);
      BM.cules.impartire(e).stupi.forEach(function(r){if(r.hiveId!==q.hive)return;var Y=yrs[y]=yrs[y]||{n:0,ag:[],sw:0,cap:null,win:null,sup:0};Y.kg=+((Y.kg||0)+r.kg).toFixed(1);});});
    // 🕷️ varroa: the worst count of the year for this hive (sticky board / wash), while this queen was there
    BM.varroa.randuri().forEach(function(v){if(v.hiveId!==q.hive||!v.date||v.date<f||(t2&&v.date>=t2)||v.miteCount==null)return;var y=v.date.slice(0,4),Y=yrs[y]=yrs[y]||{n:0,ag:[],sw:0,cap:null,win:null,sup:0};Y.vmax=Math.max(Y.vmax||0,parseInt(v.miteCount)||0);});
    Object.keys(yrs).forEach(function(y){var Y=yrs[y];if(Y.cap)best[y]=Math.max(best[y]||0,Y.cap);if(Y.kg){bestKg[y]=Math.max(bestKg[y]||0,Y.kg);}
      if(Y.spr!=null)bestSpr[y]=Math.max(bestSpr[y]||0,Y.spr);if(Y.vmax!=null)worstV[y]=Math.max(worstV[y]||0,Y.vmax);
      if(Y.br&&Y.br.length){Y.brAvg=Y.br.reduce(function(a,b){return a+b;},0)/Y.br.length;bestBr[y]=Math.max(bestBr[y]||0,Y.brAvg);}});
    res[q.id]={yrs:yrs};
  });
  Object.keys(res).forEach(function(id){
    var r=res[id],tot=[],comp={honey:[],gentle:[],swarm:[],brood:[],winter:[],health:[]},qq=BM.regine.rand(id),f=qq?qFrom(qq):"";
    Object.keys(r.yrs).sort().forEach(function(y){
      var Y=r.yrs[y],c={};
      // 🍯 honey: real kg extracted (Cules) vs the best hive of that year. In a year with extractions, a hive with none
      // scores 0 — unless this queen had only part of the season (came after 1 June): then honey is not judged yet.
      // only a part of the season (came after 1 June, or left before 1 June) → honey is not judged for that year
      var t2q=qq?qTo(qq):null,partial=(String(f||"").slice(0,4)===y&&String(f||"").slice(5,7)>="06")||(t2q&&String(t2q).slice(0,4)===y&&String(t2q).slice(5,7)<"06");
      if(partial){}
      else if(bestKg[y])c.honey=Y.kg?Math.round(Y.kg/bestKg[y]*100):0;
      else if(Y.cap!=null&&best[y])c.honey=Math.round(Y.cap/best[y]*100);
      if(Y.ag.length){var a=Y.ag.reduce(function(x,z){return x+z;},0)/Y.ag.length;Y.aggr=a;c.gentle=Math.round((5-a)/4*100);}
      if(Y.n>=2){Y.swPct=Math.round(Y.sw/Y.n*100);c.swarm=Math.max(0,100-2*Y.swPct);}
      // 🌤️ adaptation to the weather = wintering (frames of bees going into winter) + spring build-up by the first flow
      var wsc=Y.win!=null?Math.round(Math.max(0,Math.min(1,(Y.win-3)/6))*100):null,ssc=Y.spr!=null&&bestSpr[y]?Math.round(Y.spr/bestSpr[y]*100):null;
      if(wsc!=null&&ssc!=null)c.winter=Math.round((wsc+ssc)/2);else if(wsc!=null)c.winter=wsc;else if(ssc!=null)c.winter=ssc;
      // 🩺 health: fewer inspections with disease, fewer varroa than the worst hive that year
      var hsc=[];if(Y.hn)hsc.push(Math.round((1-(Y.ill||0)/Y.hn)*100));if(Y.vmax!=null&&worstV[y])hsc.push(Math.round((1-Y.vmax/worstV[y])*100));else if(Y.vmax===0)hsc.push(100);
      if(hsc.length)c.health=Math.round(hsc.reduce(function(a,b){return a+b;},0)/hsc.length);
      if(Y.brAvg!=null&&bestBr[y])c.brood=Math.round(Y.brAvg/bestBr[y]*100);   // 🥚 laying: average brood frames vs the best hive that year
      var sw=0,sv=0;Object.keys(c).forEach(function(k){sw+=W[k];sv+=W[k]*c[k];});
      Y.c=c;Y.score=sw&&(Y.n>=2||c.winter!=null)?Math.max(1,Math.round(sv/sw)):null;
      if(Y.score!=null){tot.push(Y.score);Object.keys(c).forEach(function(k){comp[k].push(c[k]);});}
    });
    var avg=function(a){return a.length?Math.round(a.reduce(function(x,z){return x+z;},0)/a.length):null;};
    r.score=avg(tot);r.years=tot.length;r.avg={honey:avg(comp.honey),gentle:avg(comp.gentle),swarm:avg(comp.swarm),brood:avg(comp.brood),winter:avg(comp.winter),health:avg(comp.health)};
  });
  return res;
}
var _gsC=null,_gsT=0;
function genScoresCached(){var n=Date.now();if(!_gsC||n-_gsT>1500){_gsC=genScoresAll();_gsT=n;}return _gsC;}
function qScoreOf(q){var s=q?genScoresCached()[q.id]:null;return s&&s.score!=null?s.score:null;}

// Model: nodes = queens + nucs in formation (queen doesn't exist yet)
function genModel(){
  ensureLineCodes(true);
  var S=genScoresAll(),nodes=[],byId={},kids={};
  BM.regine.randuri().forEach(function(q){var h=genFind(q.hive);if(!h)return;var n={id:q.id,q:q,h:h};nodes.push(n);byId[n.id]=n;});
  genAll().forEach(function(h){
    if(!h.nuc||h.nuc.found||qHiveQs(h.id).length)return;
    var m=qFind(h.nuc.motherQ)||(h.genParent?qAt(h.genParent,h.nuc.start||nucToday()):null);
    var n={id:"p_"+h.id,pseudo:true,h:h,mother:m?m.id:null};nodes.push(n);byId[n.id]=n;
  });
  var roots=[];
  nodes.forEach(function(n){var m=n.pseudo?n.mother:(qMother(n.q)||{}).id;
    if(m&&byId[m]&&m!==n.id){(kids[m]=kids[m]||[]).push(n);n.parent=m;}else roots.push(n);});
  var fromOf=function(n){return n.pseudo?(n.h.nuc.start||""):qFrom(n.q);};
  Object.keys(kids).forEach(function(k){kids[k].sort(function(a,b){return fromOf(a)<fromOf(b)?-1:1;});});
  var mem=function(r){var o=[r];(kids[r.id]||[]).forEach(function(c){o=o.concat(mem(c));});return o;};
  var lines=roots.map(function(r){
    var m=mem(r),sc=m.filter(function(n){return !n.pseudo&&S[n.id]&&S[n.id].score!=null;}).map(function(n){return S[n.id].score;});
    return{r:r,mem:m,score:sc.length?Math.round(sc.reduce(function(x,y){return x+y;},0)/sc.length):null,
      active:m.filter(function(n){return !n.h.closed&&(n.pseudo||!qTo(n.q));}).length};
  }).sort(function(a,b){return b.mem.length-a.mem.length;});
  var lineOf={};
  lines.forEach(function(l,i){l.color=GEN_COLORS[i%GEN_COLORS.length];l.mem.forEach(function(n){lineOf[n.id]=l;});});
  _genCache={S:S,nodes:nodes,byId:byId,kids:kids,lines:lines,lineOf:lineOf,fromOf:fromOf};
  return _genCache;
}
function genLineName(l){
  var r=l.r;if(r.pseudo)return"NEC · "+genShort(r.h);
  return(r.q.lineCode||raceCode(r.q.race))+(qRootWhy(r.q)==="natural"?" 🌳":"");
}
function genLineSub(l){var r=l.r;if(r.pseudo)return"";var q=r.q;return(q.race||L2("rasă nenotată","race not set"))+(q.line?' · '+q.line:'');}
function genRootLblQ(n){
  if(n.pseudo)return'🐝 '+L2("Roi în formare","Nuc in progress");
  var q=n.q,why=qRootWhy(q);
  if(why==="bought")return'🛒 '+L2("Linie nouă: regină cumpărată","New line: purchased queen")+(q.race||q.line?' ('+esc([q.race,q.line].filter(Boolean).join(" · "))+')':'')+' · '+L2("în","in")+' '+esc(n.h.name)+' · '+qFrom(q);
  if(why==="natural")return'🌳 '+L2("Origine necunoscută (roi găsit)","Unknown origin (found swarm)")+' · '+esc(n.h.name);
  return'🏁 '+L2("Început de linie (fără date despre mamă)","Start of line (no data on the mother)")+' · '+esc(n.h.name);
}
