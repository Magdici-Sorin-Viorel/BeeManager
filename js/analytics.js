// BeeManager Pro — analytics.js
// Analytics

// ═══════════════════════════════════════════
// ANALYTICS
// ═══════════════════════════════════════════
function renderAnalytics(){
  var isEN=D.settings.lang==="en";
  var curYear=new Date().getFullYear();
  var prevYear=curYear-1;

  // ── Global totals ─────────────────────────────────────────────
  var tR=D.honeyHarvests.reduce(function(s,h){return s+(h.actualQty||h.qty||0);},0);
  var tE=D.honeyHarvests.reduce(function(s,h){return s+(h.estQty||0);},0);
  var eff=tE>0?((tR/tE)*100).toFixed(0):"—";
  var avgB=D.inspections.length?(D.inspections.reduce(function(s,i){return s+(i.fB||0);},0)/D.inspections.length).toFixed(1):"—";
  var sc={p:D.hives.filter(function(h){return h.str==="puternic";}).length,m:D.hives.filter(function(h){return h.str==="mediu";}).length,s:D.hives.filter(function(h){return h.str==="slab";}).length};

  // ── Helper: per-hive production per year ─────────────────────
  function hiveYearProd(hid,year){
    return D.honeyHarvests.filter(function(h){var d=h.extractionDate||h.date||"";return h.hiveId===hid&&d.startsWith(String(year));})
      .reduce(function(s,h){return s+(h.actualQty||h.qty||0);},0);
  }
  function hiveYearEst(hid,year){
    return D.honeyHarvests.filter(function(h){var d=h.extractionDate||h.date||"";return h.hiveId===hid&&d.startsWith(String(year));})
      .reduce(function(s,h){return s+(h.estQty||0);},0);
  }

  // ── Production per hive ──────────────────────────────────────
  var hiveProd=D.hives.map(function(h){
    var real=hiveYearProd(h.id,curYear);
    var realAll=D.honeyHarvests.filter(function(hr){return hr.hiveId===h.id;}).reduce(function(s,hr){return s+(hr.actualQty||hr.qty||0);},0);
    var est=hiveYearEst(h.id,curYear);
    var estAll=D.honeyHarvests.filter(function(hr){return hr.hiveId===h.id;}).reduce(function(s,hr){return s+(hr.estQty||0);},0);
    var effH=estAll>0?((realAll/estAll)*100).toFixed(0):null;
    var prevR=hiveYearProd(h.id,prevYear);
    return{h:h,real:realAll,realCur:real,est:estAll,estCur:est,eff:effH,prevR:prevR};
  }).sort(function(a,b){return b.real-a.real;});

  var maxReal=hiveProd.length?Math.max.apply(null,hiveProd.map(function(x){return Math.max(x.real,0.01);})):1;
  var hasPrevData=hiveProd.some(function(x){return x.prevR>0;});

  var prodRows=hiveProd.map(function(x){
    var barW=Math.round((x.real/maxReal)*100);
    var trend=hasPrevData?(x.real>x.prevR?"↑":x.real<x.prevR?"↓":"—"):"";
    var trendCls=x.real>x.prevR?"color:var(--ok)":x.real<x.prevR?"color:var(--danger)":"color:var(--mut)";
    var badge=x.h.str==="puternic"?'<span class="bg gg" style="font-size:.58rem;">💪</span>':x.h.str==="slab"?'<span class="bg gr" style="font-size:.58rem;">⚠️</span>':"";
    return'<tr>'
      +'<td style="font-weight:700;font-size:.8rem;">'+x.h.name+' '+badge+'</td>'
      +'<td style="text-align:right;font-weight:800;color:var(--gold);">'+x.real.toFixed(1)+'</td>'
      +'<td style="text-align:right;font-size:.76rem;color:var(--mut);">'+x.est.toFixed(1)+'</td>'
      +'<td style="text-align:right;font-size:.76rem;">'+(x.eff!==null?x.eff+'%':'—')+'</td>'
      +(hasPrevData?'<td style="text-align:right;font-size:.78rem;font-weight:700;'+trendCls+';">'+trend+' '+(x.prevR>0?x.prevR.toFixed(1):'—')+'</td>':'')
      +'<td style="min-width:60px;"><div style="background:rgba(255,255,255,.07);border-radius:20px;height:5px;overflow:hidden;">'
      +'<div style="width:'+barW+'%;height:100%;background:linear-gradient(90deg,var(--gold),#ffcf4a);border-radius:20px;"></div></div></td>'
      +'</tr>';
  }).join("");

  var prodHTML='<div class="c" style="margin-bottom:14px;">'
    +'<div class="ct">🍯 '+(isEN?"Production per hive (all time)":"Producție per stup (total)")+'</div>'
    +'<div class="rt-wrap"><table class="rt" style="white-space:normal;min-width:unset;">'
    +'<thead><tr><th>'+(isEN?"Hive":"Stup")+'</th><th style="text-align:right;">Real(kg)</th><th style="text-align:right;">Est.(kg)</th><th style="text-align:right;">Ef.%</th>'
    +(hasPrevData?'<th style="text-align:right;">vs '+prevYear+'</th>':'')+'<th></th></tr></thead>'
    +'<tbody>'+prodRows+'</tbody></table></div>'
    +(hiveProd.every(function(x){return x.real===0;})?'<div class="al ali" style="margin-top:8px;font-size:.78rem;">'+(isEN?"No harvest data yet.":"Nicio recoltă înregistrată.")+'</div>':"")
    +'</div>';

  // ── Season efficiency: kg/hive per year ─────────────────────
  var nHives=D.hives.length||1;
  var curYearTotal=D.honeyHarvests.filter(function(h){var d=h.extractionDate||h.date||"";return d.startsWith(String(curYear));}).reduce(function(s,h){return s+(h.actualQty||h.qty||0);},0);
  var prevYearTotal=D.honeyHarvests.filter(function(h){var d=h.extractionDate||h.date||"";return d.startsWith(String(prevYear));}).reduce(function(s,h){return s+(h.actualQty||h.qty||0);},0);
  var curEff=(curYearTotal/nHives).toFixed(2);
  var prevEff=prevYearTotal>0?(prevYearTotal/nHives).toFixed(2):null;
  var delta=prevYearTotal>0?(((curYearTotal-prevYearTotal)/prevYearTotal)*100).toFixed(0):null;
  var deltaStr=delta!==null?((parseFloat(delta)>0?"+":"")+delta+"%"):"—";
  var deltaPos=delta!==null?parseFloat(delta)>=0:null;

  // Production per season (honey type)
  var byFlowCur={},byFlowPrev={};
  D.honeyHarvests.forEach(function(h){
    var d=h.extractionDate||h.date||"",tp=h.honeyType||h.type||"?",qty=h.actualQty||h.qty||0;
    if(d.startsWith(String(curYear)))byFlowCur[tp]=(byFlowCur[tp]||0)+qty;
    if(d.startsWith(String(prevYear)))byFlowPrev[tp]=(byFlowPrev[tp]||0)+qty;
  });
  var allSeasonKeys=[].concat(Object.keys(byFlowCur),Object.keys(byFlowPrev)).filter(function(v,i,a){return a.indexOf(v)===i;});

  var seasonRows=allSeasonKeys.map(function(tp){
    var cur=byFlowCur[tp]||0,prev=byFlowPrev[tp]||0;
    var curKH=(cur/nHives).toFixed(2),prevKH=prev>0?(prev/nHives).toFixed(2):"—";
    var d=prev>0?((((cur-prev)/prev)*100).toFixed(0)):null;
    var dStr=d!==null?((parseFloat(d)>0?"+":"")+d+"%"):"—";
    var dCls=d===null?"color:var(--mut)":parseFloat(d)>=0?"color:var(--ok)":"color:var(--danger)";
    return'<tr>'
      +'<td style="font-size:.78rem;">'+tp+'</td>'
      +'<td style="text-align:right;font-weight:700;color:var(--gold);">'+cur.toFixed(1)+'<br><span style="font-size:.65rem;color:var(--mut);font-weight:400;">'+curKH+' kg/'+( isEN?"hive":"stup")+'</span></td>'
      +'<td style="text-align:right;font-size:.76rem;color:var(--mut);">'+(prev>0?prev.toFixed(1)+'<br><span style="font-size:.65rem;">'+prevKH+' kg</span>':'—')+'</td>'
      +'<td style="text-align:right;font-weight:700;'+dCls+';">'+dStr+'</td>'
      +'</tr>';
  }).join("");

  var seasonHTML=(curYearTotal>0||prevYearTotal>0)?
    '<div class="c" style="margin-bottom:14px;">'
    +'<div class="ct">📊 '+(isEN?"Season efficiency — kg/hive":"Eficiență sezon — kg/stup")+'</div>'
    +'<div style="display:flex;gap:10px;flex-wrap:wrap;margin:10px 0 8px;">'
    +'<div style="flex:1;min-width:110px;background:rgba(230,180,34,.08);border-radius:var(--rs);padding:10px;text-align:center;">'
    +'<div style="font-size:.68rem;color:var(--mut);">'+curYear+'</div>'
    +'<div style="font-size:1.4rem;font-weight:800;color:var(--gold);">'+curYearTotal.toFixed(1)+' kg</div>'
    +'<div style="font-size:.72rem;color:var(--mut);">÷ '+nHives+' = <strong>'+curEff+'</strong> kg/'+(isEN?"hive":"stup")+'</div>'
    +'</div>'
    +(prevYearTotal>0?
      '<div style="flex:1;min-width:110px;background:rgba(255,255,255,.04);border-radius:var(--rs);padding:10px;text-align:center;">'
      +'<div style="font-size:.68rem;color:var(--mut);">'+prevYear+'</div>'
      +'<div style="font-size:1.4rem;font-weight:800;color:var(--mut);">'+prevYearTotal.toFixed(1)+' kg</div>'
      +'<div style="font-size:.72rem;color:var(--mut);">÷ '+nHives+' = <strong>'+prevEff+'</strong> kg/'+(isEN?"hive":"stup")+'</div>'
      +'</div>'
      +'<div style="flex:1;min-width:90px;background:rgba('+(deltaPos?"111,191,76":"224,124,76")+',.1);border-radius:var(--rs);padding:10px;text-align:center;">'
      +'<div style="font-size:.68rem;color:var(--mut);">'+(isEN?"vs last year":"față de "+prevYear)+'</div>'
      +'<div style="font-size:1.4rem;font-weight:800;color:'+(deltaPos?"var(--ok)":"var(--danger)")+';">'+deltaStr+'</div>'
      +'</div>'
      :"")
    +'</div>'
    +(allSeasonKeys.length?
      '<div class="rt-wrap"><table class="rt" style="white-space:normal;min-width:unset;">'
      +'<thead><tr><th>'+(isEN?"Season":"Sezon")+'</th><th style="text-align:right;">'+curYear+'</th><th style="text-align:right;">'+prevYear+'</th><th style="text-align:right;">'+(isEN?"Change":"Variație")+'</th></tr></thead>'
      +'<tbody>'+seasonRows+'</tbody></table></div>':'')
    +'</div>':"";

  // ── Inspections per hive (current year) ─────────────────────
  var inspYr=D.inspections.filter(function(i){return i.date&&i.date.startsWith(String(curYear));});
  var hiveInspC=D.hives.map(function(h){
    var cnt=inspYr.filter(function(i){return i.hiveId===h.id;}).length;
    return{h:h,cnt:cnt};
  }).sort(function(a,b){return b.cnt-a.cnt;});
  var maxInsp=hiveInspC.length?Math.max.apply(null,hiveInspC.map(function(x){return Math.max(x.cnt,1);})):1;

  var inspRows=hiveInspC.map(function(x){
    var barW=Math.round((x.cnt/maxInsp)*100);
    var cls=x.cnt===0?"gr":x.cnt<3?"gy":"gg";
    return'<tr>'
      +'<td style="font-weight:700;font-size:.8rem;">'+x.h.name+'</td>'
      +'<td style="text-align:center;"><span class="bg '+cls+'" style="font-size:.7rem;">'+x.cnt+'</span></td>'
      +'<td style="min-width:60px;"><div style="background:rgba(255,255,255,.07);border-radius:20px;height:5px;overflow:hidden;">'
      +'<div style="width:'+barW+'%;height:100%;background:linear-gradient(90deg,var(--info),#74b3ff);border-radius:20px;"></div></div></td>'
      +'</tr>';
  }).join("");

  var inspHiveHTML='<div class="c" style="margin-bottom:14px;">'
    +'<div class="ct">🔍 '+(isEN?"Inspections per hive — "+curYear:"Inspecții per stup — "+curYear)+'</div>'
    +'<div class="rt-wrap"><table class="rt" style="white-space:normal;min-width:unset;">'
    +'<thead><tr><th>'+(isEN?"Hive":"Stup")+'</th><th style="text-align:center;">'+(isEN?"Nr.":"Nr.")+'</th><th></th></tr></thead>'
    +'<tbody>'+inspRows+'</tbody></table></div>'
    +'</div>';

  // ── Queen cell trend per hive ────────────────────────────────
  var hiveBotci=D.hives.map(function(h){
    var insps=D.inspections.filter(function(i){return i.hiveId===h.id&&i.date;}).sort(function(a,b){return new Date(a.date)-new Date(b.date);});
    var last4=insps.slice(-4);
    var hasBotci=last4.some(function(i){return i.botci;});
    if(!hasBotci)return null;
    var vals=last4.map(function(i){return i.botciN||0;});
    var trend="stable";
    if(vals.length>=2){var first=vals[0],last=vals[vals.length-1];if(last>first)trend="up";else if(last<first)trend="down";}
    return{h:h,insps:last4,trend:trend};
  }).filter(Boolean);

  var botciHTML="";
  if(hiveBotci.length){
    var botciCards=hiveBotci.map(function(x){
      var ic=x.trend==="up"?"📈":x.trend==="down"?"📉":"➡️";
      var lbl=x.trend==="up"?(isEN?"Increasing":"Creștere"):x.trend==="down"?(isEN?"Decreasing":"Scădere"):(isEN?"Stable":"Stabil");
      var tcls=x.trend==="up"?"gy":x.trend==="down"?"gg":"gb";
      var dots=x.insps.map(function(i){
        return'<div style="display:flex;align-items:center;gap:5px;padding:3px 0;border-bottom:1px solid var(--bdr);font-size:.73rem;">'
          +'<span style="color:var(--mut);min-width:82px;flex-shrink:0;">'+i.date+'</span>'
          +(i.botci?'<span class="bg gy">🐛 '+(i.botciN||0)+(i.botciS?' · '+i.botciS:'')+'</span>':'<span class="bg gg" style="font-size:.65rem;">✅ '+(isEN?"none":"fără")+'</span>')
          +'</div>';
      }).join("");
      return'<div style="background:rgba(255,255,255,.03);border:1px solid var(--bdr);border-radius:var(--rs);padding:9px;margin-bottom:6px;">'
        +'<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:5px;">'
        +'<strong style="font-size:.82rem;">🏠 '+x.h.name+'</strong>'
        +'<span class="bg '+tcls+'" style="font-size:.65rem;">'+ic+' '+lbl+'</span>'
        +'</div>'+dots+'</div>';
    }).join("");
    botciHTML='<div class="c" style="margin-bottom:14px;">'
      +'<div class="ct">🐛 '+(isEN?"Queen cells trend per hive":"Evoluție botci per stup")+'</div>'
      +'<div style="margin-top:8px;">'+botciCards+'</div>'
      +'</div>';
  }

  // ── Honey charts by type and trend ──────────────────────────
  var byT={};D.honeyHarvests.forEach(function(h){var tp=h.honeyType||"?";byT[tp]=(byT[tp]||0)+(h.actualQty||h.qty||0);});
  var byTChart=Object.keys(byT).length?'<div class="c" style="margin-bottom:14px;"><div class="ct">'+t("an_by_t")+'</div><canvas id="ch1" height="90"></canvas></div>':"";
  var evolChart='<div class="c" style="margin-bottom:14px;"><div class="ct">'+t("an_evol")+'</div><canvas id="ch2" height="90"></canvas></div>';

  // ── Colony strength distribution — small chart, only if ≥5 hives ──
  var distHTML="";
  if(D.hives.length>=5){
    var tot2=sc.p+sc.m+sc.s||1;
    var bars=[
      {n:sc.p,c:"var(--ok)",l:isEN?"Strong":"Puternice"},
      {n:sc.m,c:"var(--gold)",l:isEN?"Medium":"Medii"},
      {n:sc.s,c:"var(--danger)",l:isEN?"Weak":"Slabe"}
    ].map(function(b){
      var h2=Math.max(6,Math.round((b.n/tot2)*52));
      return'<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:2px;">'
        +'<div style="font-size:.68rem;font-weight:800;color:'+b.c+';">'+b.n+'</div>'
        +'<div style="width:100%;height:'+h2+'px;background:'+b.c+';border-radius:4px 4px 0 0;opacity:.8;"></div>'
        +'<div style="font-size:.58rem;color:var(--mut);text-align:center;">'+b.l+'</div>'
        +'</div>';
    }).join("");
    distHTML='<div class="c" style="margin-bottom:14px;max-width:260px;">'
      +'<div class="ct" style="font-size:.8rem;">💪 '+(isEN?"Colony strength":"Forță colonii")+'</div>'
      +'<div style="display:flex;gap:6px;align-items:flex-end;height:70px;margin:10px 0 4px;">'+bars+'</div>'
      +'</div>';
  }

  // ── KPI cards ─────────────────────────────────────────────────
  var kpiHTML='<div class="g gs" style="margin-bottom:14px;">'
    +'<div class="c"><div class="cl">'+(isEN?"Total real":"Total real")+'</div><div class="cv">'+tR.toFixed(1)+' kg</div></div>'
    +'<div class="c"><div class="cl">'+(isEN?"Estimated":"Estimat")+'</div><div class="cv">'+tE.toFixed(1)+' kg</div><div class="cs">'+t("an_eff")+' '+eff+'%</div></div>'
    +'<div class="c"><div class="cl">'+(isEN?"Avg brood frames":"Rame puiet med.")+'</div><div class="cv">'+avgB+'</div></div>'
    +'<div class="c"><div class="cl">'+(isEN?"Strong colonies":"Colonii puternice")+'</div><div class="cv">'+sc.p+'</div></div>'
    +'<div class="c"><div class="cl">'+(isEN?"Inspections w/ queen cells":"Insp. cu botci")+'</div><div class="cv">'+D.inspections.filter(function(i){return i.botci;}).length+'</div></div>'
    +'<div class="c"><div class="cl">'+(isEN?"Total inspections":"Total inspecții")+'</div><div class="cv">'+D.inspections.length+'</div></div>'
    +'</div>';

  setP('<h2 style="margin-bottom:12px;font-size:1.2rem;"><i class="fas fa-chart-bar" style="color:var(--gold)"></i> '+t("an_title")+'</h2>'
    +kpiHTML
    +prodHTML
    +seasonHTML
    +inspHiveHTML
    +(botciHTML||"")
    +(byTChart||"")
    +evolChart
    +distHTML
    +'<button class="btn" onclick="exportToPDF()" style="margin-top:4px;">'+t("an_export")+'</button>');

  setTimeout(function(){
    var cO={responsive:true,plugins:{legend:{labels:{color:"#b9b5ae",font:{size:10}}}},scales:{x:{ticks:{color:"#b9b5ae",font:{size:9}},grid:{color:"rgba(255,255,255,.05)"}},y:{ticks:{color:"#b9b5ae",font:{size:9}},grid:{color:"rgba(255,255,255,.05)"}}}};
    var c1=document.getElementById("ch1");
    if(c1&&Object.keys(byT).length>0)new Chart(c1.getContext("2d"),{type:"bar",data:{labels:Object.keys(byT),datasets:[{label:"kg",data:Object.values(byT),backgroundColor:"rgba(230,180,34,.7)",borderColor:"#e6b422",borderWidth:2,borderRadius:6}]},options:{...cO,plugins:{legend:{display:false}}}});
    var sorted=[].concat(D.honeyHarvests).sort(function(a,b){return new Date(a.extractionDate||a.date)-new Date(b.extractionDate||b.date);});
    var c2=document.getElementById("ch2");
    if(c2&&sorted.length>0)new Chart(c2.getContext("2d"),{type:"line",data:{labels:sorted.map(function(h){return h.extractionDate||h.date||"";}),datasets:[{label:t("an_real_c"),data:sorted.map(function(h){return h.actualQty||h.qty||0;}),borderColor:"#e6b422",backgroundColor:"rgba(230,180,34,.15)",fill:true,tension:.4},{label:t("an_est_c"),data:sorted.map(function(h){return h.estQty||0;}),borderColor:"rgba(74,158,255,.7)",backgroundColor:"rgba(74,158,255,.05)",fill:true,tension:.4,borderDash:[5,5]}]},options:cO});
  },80);
}
