// BeeManager Pro — dashboard.js
// Dashboard

// ═══════════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════════
function renderDashboard(){
  var w=D.weather,act=beeAct(w),fl=getFlow();
  var low=D.inventory.filter(function(i){return isLowStock(i);});
  var totH=D.honeyHarvests.reduce(function(s,h){return s+(h.actualQty||h.qty||0);},0);
  var pend=D.treatments.filter(function(t2){return new Date(t2.date)>new Date();}).length;
  var lastArr=[].concat(D.inspections).sort(function(a,b){return new Date(b.date)-new Date(a.date);});
  var last=lastArr[0];
  var tmpPct=w?Math.min(100,Math.max(0,(w.temp/40)*100)):0;
  var ago=w?Math.round((Date.now()-w.ts)/60000):null;
  var agoL=ago!==null?(ago<2?"acum/now":"acum "+ago+" min"):"";
  var strong=D.hives.filter(function(h){return h.str==="puternic";}).length;
  var med=D.hives.filter(function(h){return h.str==="mediu";}).length;
  var slb=D.hives.filter(function(h){return h.str==="slab";}).length;
  var curYr=new Date().getFullYear();
  var finYr=(D.finances||[]).filter(function(f){return(f.date||"").startsWith(String(curYr));});
  var finInc=finYr.filter(function(f){return f.type==="income";}).reduce(function(s,f){return s+f.amount;},0);
  var finExp=finYr.filter(function(f){return f.type==="expense";}).reduce(function(s,f){return s+f.amount;},0);
  var finNet=finInc-finExp;

  // Flow card
  var culesH="";
  if(w&&(w.rain||(w.prec>0))){
    culesH='<div class="bb" style="background:rgba(74,158,255,.12)"><span style="font-size:1.6rem">🌧️</span><div><strong>'+t("fl_rain")+'</strong><br><small style="color:var(--mut)">'+t("fl_rain_d")+'</small></div></div>';
  } else if(fl){
    var tmpOk=w&&w.temp>=fl.nt[0]&&w.temp<=fl.nt[1];
    culesH='<div class="bb" style="background:rgba(111,191,76,.1)"><span style="font-size:1.6rem">'+plantIC(fl)+'</span><div><strong>'+t("fl_active")+' '+plantN(fl)+'</strong>'+(w?' — '+showTemp(w.temp)+' <span class="bg '+(tmpOk?'gg':'gy')+'">'+(tmpOk?t("fl_opt_t"):t("fl_sub_t"))+'</span>':'')+'<br><small style="color:var(--mut)">'+plantDC(fl)+' '+t("fl_opt_range")+' '+showTempRange(fl.nt[0],fl.nt[1])+'</small></div></div>';
  } else {
    culesH='<div class="bb" style="background:rgba(224,124,76,.12)"><span style="font-size:1.6rem">⏸️</span><div><strong>'+t("fl_between")+'</strong><br><small style="color:var(--mut)">'+t("fl_between_d")+'</small></div></div>';
  }

  // Weather card
  var wCard="";
  if(w){
    var wLbl=w.wc!==undefined?wmoLabel(w.wc):(w.lbl||"");
    wCard='<div class="c"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:5px;"><div class="cl">🌦️ '+(agoL?'— '+agoL:'')+'</div><button class="btn sm gh" onclick="if(D.userLoc)fetchW(D.userLoc.lat,D.userLoc.lon)">'+t("w_refresh")+'</button></div>'
      +'<div class="wp" style="background:'+act.bg+'"><span class="wi">'+w.ic+'</span><div>'
      +'<div style="font-size:1.4rem;font-weight:800">'+showTemp(w.temp)+' <small style="font-size:.9rem;font-weight:400">'+wLbl+'</small></div>'
      +'<div style="font-size:.76rem;color:var(--mut)">💨 '+w.wind+' km/h · 💧 '+w.hum+'% · 🌧️ '+w.prec+' mm</div>'
      +'<div style="color:var(--gold);font-weight:700;margin-top:3px;">'+act.ic+' '+act.ttl+'</div>'
      +'<div style="font-size:.74rem;color:var(--mut)">'+act.det+'</div>'
      +'</div></div>'
      +'<div class="gauge"><div class="gf" style="width:'+tmpPct+'%"></div></div>'
      +(function(){var gl=tempGaugeLabels();return'<div class="gl">'+gl.map(function(l){return'<span>'+l+'</span>';}).join('')+'</div>';})()
      +culesH+'</div>';
  } else {
    wCard='<div class="c"><div class="cl">🌦️</div><div class="al alw" style="margin-top:7px;">'+t("w_no_loc")+'</div>'+culesH+'</div>';
  }

  // Low stock alert
  var stockA=low.length?'<div class="sa"><strong>'+t("dash_low_stock_alert")+' — '+low.length+'</strong>'+low.map(function(i){return'<div style="margin-top:3px;font-size:.8rem;">📦 <strong>'+i.name+'</strong>: '+i.qty+' '+t("inv_units")+' ('+t("inv_min_d")+' '+i.min+')</div>';}).join("")+'<button class="btn sm" style="margin-top:8px" onclick="go(\'inventory\')">'+t("dash_manage_inv")+'</button></div>':"";

  // Active pastoral moves widget
  var pastActive=D.pastorage.filter(function(p){return !p.endDate||new Date(p.endDate)>=new Date();});
  var pastHTML="";
  if(pastActive.length){
    pastHTML='<div class="c" style="margin-top:14px;"><div class="ct">'+t("dash_past_label")+'</div>'
      +pastActive.map(function(p){
        var hv=D.hives.find(function(h){return h.id===p.hiveId;});
        var days=Math.round((Date.now()-new Date(p.startDate))/86400000);
        return'<div class="bb" style="background:rgba(230,180,34,.06);margin-top:7px;">'
          +'<span style="font-size:1.4rem">🚚</span>'
          +'<div><strong>'+(hv?hv.name:"—")+'</strong> → '+p.location
          +'<br><small style="color:var(--mut)">'+t("past_target_d")+' '+p.target+' · '+days+' '+t("past_days")+'</small></div>'
          +'<button class="btn sm be" onclick="go(\'pastorare\')" style="margin-left:auto;flex-shrink:0;">→</button>'
          +'</div>';
      }).join("")
      +'</div>';
  }

  // Varroa alerts on dashboard
  var vrAlertHives=[];
  (D.varroa||[]).forEach(function(v){
    var lvl=vrLevel(v);
    if(lvl==="treat"){
      var hv=D.hives.find(function(h){return h.id===v.hiveId;});
      if(hv&&vrAlertHives.indexOf(hv.name)===-1)vrAlertHives.push(hv.name);
    }
  });
  // Only show if the test is recent (≤30 days)
  var vrAlertRecent=[];
  (D.varroa||[]).forEach(function(v){
    var daysDiff=Math.round((Date.now()-new Date(v.date))/86400000);
    if(daysDiff<=30&&vrLevel(v)==="treat"){
      var hv=D.hives.find(function(h){return h.id===v.hiveId;});
      if(hv&&vrAlertRecent.indexOf(hv.name)===-1)vrAlertRecent.push(hv.name);
    }
  });
  var vrAlertA=vrAlertRecent.length
    ?'<div class="sa" style="background:rgba(224,80,60,.12);border-color:rgba(224,80,60,.5);">'
      +'<strong>'+t("vr_dash_alert")+' '+vrAlertRecent.length+' '+t("vr_dash_hives")+'</strong>'
      +'<div style="margin-top:4px;font-size:.78rem;">'+vrAlertRecent.map(function(n){return'🏠 '+n;}).join(' &nbsp;')+'</div>'
      +'<button class="btn sm" style="margin-top:8px;background:var(--danger);border-color:var(--danger);" onclick="go(\'varroa\')">'+t("nav_varroa")+' →</button>'
      +'</div>'
    :"";

  var lastHiveName=last?D.hives.find(function(h){return h.id===last.hiveId;})?.name||"":"";

  // Varroa KPI card — most recent test across all hives
  var vrLatest=(D.varroa||[]).slice().sort(function(a,b){return new Date(b.date)-new Date(a.date);})[0];
  var vrCardH='';
  if(vrLatest){
    var vrLvl=vrLevel(vrLatest);
    var vrCol=vrLvl==="ok"?"var(--ok)":vrLvl==="watch"?"var(--gold)":"var(--danger)";
    var vrHv=D.hives.find(function(h){return h.id===vrLatest.hiveId;});
    var vrPctStr=vrLatest.method==="natural"||vrLatest.method==="sticky"
      ?(vrLatest.miteCount||0)+" "+t("vr_mites_day")
      :(vrLatest.infestationPct||0).toFixed(1)+"%";
    vrCardH='<div class="c" style="cursor:pointer;" onclick="go(\'varroa\')"><div class="cl">🕷️ Varroa</div><div class="cv" style="color:'+vrCol+';font-size:1.1rem;">'+vrPctStr+'</div><div class="cs">'+(vrHv?vrHv.name:"")+" · "+vrLatest.date+'</div></div>';
  }

  // ── Remaining honey stock ─────────────────────────────────────
  // Total sold = sum of kg from all honey sales (from saleLines × honeyKg/unit)
  var totHoneySold=(D.finances||[]).reduce(function(s,f){
    if(f.saleLines&&f.saleLines.length){
      return s+f.saleLines.reduce(function(s2,ln){
        var pkg=D.inventory.find(function(p){return p.id===ln.invId;});
        return s2+(pkg?pkg.honeyKg||0:0)*(parseInt(ln.pcs)||0);
      },0);
    }
    // Fallback for old sales saved with the qty field
    if(f.qty&&(f.category==="Vânzare miere"||f.category==="Honey sale"||f.category==="Cadou miere"||f.category==="Honey gift"))return s+(f.qty||0);
    return s;
  },0);
  var honeyStock=Math.max(0,totH-totHoneySold);
  var isEN=D.settings.lang==="en";
  var honeyStockColor=honeyStock<=0?"var(--mut)":honeyStock<10?"var(--gold)":"var(--ok)";
  var honeyCardH='<div class="c" style="cursor:pointer;" onclick="go(\'honey\')">'
    +'<div class="cl">🍯 '+(isEN?"Honey in stock":"Stoc miere")+'</div>'
    +'<div class="cv" style="color:'+honeyStockColor+';">'+honeyStock.toFixed(1)+' kg</div>'
    +'<div class="cs">'+(isEN?"harvested":"recoltat")+' '+totH.toFixed(1)+' · '+(isEN?"sold":"vândut")+' '+totHoneySold.toFixed(1)+' kg</div>'
    +'</div>';

  var finCardH='<div class="c" style="cursor:pointer;" onclick="go(\'financiar\')"><div class="cl">'+t("fin_dash_profit")+' <span style="font-size:.6rem;font-weight:400;color:var(--mut);">'+t("fin_dash_this_year")+'</span></div><div class="cv" style="color:'+(finNet>=0?"var(--ok)":"var(--danger)")+';">'+(finNet>=0?"+":"")+finNet.toFixed(0)+' RON</div><div class="cs">'+(finInc>0||finExp>0?'↑ '+finInc.toFixed(0)+' · ↓ '+finExp.toFixed(0):(D.settings.lang==="en"?"No data yet":"Fără date"))+'</div></div>';

  // ── Tasks: build alerts + urgent panel + KPI ──────────────────
  var todayStr=todayISO();
  var tmrStr=new Date(Date.now()+86400000).toISOString().slice(0,10);
  var pendingTasks=(D.tasks||[]).filter(function(tk){return !tk.done;});
  var overdueTasks=pendingTasks.filter(function(tk){return tk.dueDate&&tk.dueDate<todayStr;}).sort(function(a,b){return a.dueDate>b.dueDate?1:-1;});
  var todayTasks=pendingTasks.filter(function(tk){return tk.dueDate===todayStr;});
  var tmrTasks=pendingTasks.filter(function(tk){return tk.dueDate===tmrStr;});
  var urgentTasks=overdueTasks.concat(todayTasks).concat(tmrTasks).slice(0,5);

  // Task alert banner for overdue
  var tkAlertA=overdueTasks.length
    ?'<div class="sa" style="background:rgba(200,100,20,.12);border-color:rgba(200,100,20,.5);margin-bottom:10px;">'
      +'<strong>⏰ '+(D.settings.lang==="en"?"You have "+overdueTasks.length+" overdue task(s)!":"Ai "+overdueTasks.length+" sarcin"+(overdueTasks.length===1?"ă":"i")+" depășit"+(overdueTasks.length===1?"ă":"e")+"!")+'</strong>'
      +'<div style="margin-top:3px;font-size:.76rem;color:var(--mut);">'+overdueTasks.slice(0,3).map(function(tk){return'📋 '+tk.title+(tk.dueDate?' ('+tk.dueDate+')':'');}).join(' &nbsp;·&nbsp; ')+'</div>'
      +'<button class="btn sm" style="margin-top:8px;" onclick="go(\'sarcini\')">'+t("nav_sarcini")+' →</button>'
      +'</div>'
    :"";

  // KPI card for tasks
  var tkKpiH='<div class="c" style="cursor:pointer;" onclick="go(\'sarcini\')">'
    +'<div class="cl">'+t("tk_kpi_pending")+'</div>'
    +'<div class="cv" style="color:'+(overdueTasks.length?"var(--danger)":pendingTasks.length?"var(--gold)":"var(--ok)")+';">'+pendingTasks.length+'</div>'
    +'<div class="cs">'+(overdueTasks.length?overdueTasks.length+(D.settings.lang==="en"?" overdue":" depășite"):(D.settings.lang==="en"?"all on time":"la timp"))+'</div>'
    +'</div>';

  // Urgent tasks panel
  var prioCols={high:"var(--danger)",medium:"var(--gold)",low:"var(--ok)"};
  var tkPanelH='<div class="c" style="margin-top:14px;">'
    +'<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">'
    +'<div class="ct" style="margin:0;">'+t("tk_dash_title")+'</div>'
    +'<button class="btn sm gh" onclick="go(\'sarcini\')" style="font-size:.72rem;padding:4px 10px;">'+t("tk_dash_see_all")+'</button>'
    +'</div>';
  if(!urgentTasks.length){
    tkPanelH+='<div style="font-size:.8rem;color:var(--mut);padding:6px 0;">'+t("tk_dash_none")+'</div>';
  }else{
    tkPanelH+=urgentTasks.map(function(tk){
      var hv=D.hives.find(function(h){return h.id===tk.hiveId;});
      var isOvd=tk.dueDate&&tk.dueDate<todayStr;
      var isTdy=tk.dueDate===todayStr;
      var dueLbl=isOvd?('<span style="color:var(--danger);font-weight:700;">⏰ '+t("tk_overdue")+'</span>')
        :isTdy?('<span style="color:var(--gold);font-weight:700;">📅 '+t("tk_today")+'</span>')
        :('<span style="color:var(--mut);">🌅 '+t("tk_tomorrow")+'</span>');
      var col=prioCols[tk.priority]||"var(--mut)";
      return'<div style="display:flex;align-items:center;gap:9px;padding:7px 0;border-bottom:1px solid var(--bdr);">'
        +'<div style="width:3px;height:32px;border-radius:3px;background:'+col+';flex-shrink:0;"></div>'
        +'<div style="flex:1;min-width:0;">'
        +'<div style="font-size:.82rem;font-weight:600;color:var(--txt);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">'+tk.title+'</div>'
        +'<div style="font-size:.7rem;color:var(--mut);">'+dueLbl+(hv?' &nbsp;🏠 '+hv.name:"")+(tk.category?' &nbsp;'+tk.category.split(' ')[0]:"")+'</div>'
        +'</div>'
        +'<button class="btn sm" style="padding:4px 9px;font-size:.72rem;background:var(--ok);border-color:var(--ok);flex-shrink:0;" onclick="tkQuickDone(\''+tk.id+'\')">✓</button>'
        +'</div>';
    }).join("");
  }
  tkPanelH+='</div>';

  // ── Feeding: KPI card + recent 3 entries panel ────────────────
  var curYrStr=String(new Date().getFullYear());
  var yrFeeds=(D.feedings||[]).filter(function(f){return(f.date||"").startsWith(curYrStr);});
  var totFeedQty=yrFeeds.reduce(function(s,f){return s+(f.qty||0);},0);
  var hrKpiH='<div class="c" style="cursor:pointer;" onclick="go(\'hranire\')">'
    +'<div class="cl">🍬 '+t("hr_kpi_label")+'</div>'
    +'<div class="cv" style="font-size:1.1rem;">'+totFeedQty.toFixed(1)+'</div>'
    +'<div class="cs">'+t("hr_kpi_unit")+' · '+yrFeeds.length+' '+t("hr_total_entries")+'</div>'
    +'</div>';

  var recentFeeds=(D.feedings||[]).slice().sort(function(a,b){return new Date(b.date)-new Date(a.date);}).slice(0,4);
  var hrPanelH='<div class="c" style="margin-top:14px;">'
    +'<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">'
    +'<div class="ct" style="margin:0;">'+t("hr_dash_title")+'</div>'
    +'<button class="btn sm gh" onclick="go(\'hranire\')" style="font-size:.72rem;padding:4px 10px;">'+t("tk_dash_see_all")+'</button>'
    +'</div>';
  if(!recentFeeds.length){
    hrPanelH+='<div style="font-size:.8rem;color:var(--mut);padding:6px 0;">'+t("hr_dash_none")+'</div>';
  }else{
    hrPanelH+=recentFeeds.map(function(f){
      var hv=f.allHives?{name:t("hr_all_hives")}:D.hives.find(function(h){return h.id===f.hiveId;})||{name:"—"};
      var tp=(t("hr_types")||[]).find(function(x){return x.v===f.feedType;})||{l:f.feedType||"?"};
      return'<div style="display:flex;align-items:center;gap:9px;padding:7px 0;border-bottom:1px solid var(--bdr);">'
        +'<div style="font-size:1.3rem;">🍬</div>'
        +'<div style="flex:1;min-width:0;">'
        +'<div style="font-size:.82rem;font-weight:600;color:var(--txt);">'+tp.l.replace(/^[^ ]+ /,"")+'</div>'
        +'<div style="font-size:.7rem;color:var(--mut);">📅 '+f.date+' · 🏠 '+hv.name+' · <strong>'+f.qty+' '+(f.unit||"kg")+'</strong></div>'
        +'</div></div>';
    }).join("");
  }
  hrPanelH+='</div>';

  setP('<h1 style="margin-bottom:16px;font-size:1.35rem;"><i class="fas fa-tachometer-alt" style="color:var(--gold)"></i> '+t("dash_title")+'</h1>'
    +(modOn("inventory")?stockA:"")+vrAlertA+tkAlertA
    +'<div class="g gs">'
    +'<div class="c"><div class="cl">'+t("dash_colonies")+'</div><div class="cv">'+D.hives.length+'</div><div class="cs">'+strong+' '+t("dash_s")+' · '+med+' '+t("dash_m")+' · '+slb+' '+t("dash_w")+'</div></div>'
    +'<div class="c"><div class="cl">'+t("dash_queens_active")+'</div><div class="cv">'+D.queens.filter(function(q){return q.status==="activă";}).length+'</div><div class="cs">'+D.queens.filter(function(q){return q.status==="în imperechere";}).length+' '+t("dash_mating")+'</div></div>'
    +(modOn("honey")?'<div class="c"><div class="cl">'+t("dash_honey_kg")+'</div><div class="cv">'+totH.toFixed(1)+'</div><div class="cs">'+D.honeyHarvests.length+' '+t("dash_sessions")+'</div></div>'
    +honeyCardH:"")
    +'<div class="c"><div class="cl">'+t("dash_treatments")+'</div><div class="cv">'+pend+'</div></div>'
    +'<div class="c"><div class="cl">'+t("dash_last_insp")+'</div><div class="cv" style="font-size:1rem">'+(last?last.date:"—")+'</div><div class="cs">'+lastHiveName+'</div></div>'
    +(modOn("inventory")?'<div class="c"><div class="cl">'+t("dash_low_stock")+'</div><div class="cv" style="color:'+(low.length?"var(--danger)":"var(--ok)")+'">'+low.length+'</div></div>':"")
    +(modOn("financiar")?finCardH:"")+(vrCardH||'')+tkKpiH+hrKpiH
    +'</div>'+tkPanelH+hrPanelH+wCard+pastHTML);
}

window.tkQuickDone=function(id){
  var tk=(D.tasks||[]).find(function(x){return x.id===id;});
  if(!tk)return;
  tk.done=true;tk.doneDate=todayISO();
  if(tk.recurring&&tk.recurDays){
    var nxt=new Date(tk.dueDate||Date.now());
    nxt.setDate(nxt.getDate()+parseInt(tk.recurDays));
    D.tasks.push({id:uid(),title:tk.title,hiveId:tk.hiveId,dueDate:nxt.toISOString().slice(0,10),priority:tk.priority,category:tk.category,recurring:true,recurDays:tk.recurDays,done:false,doneDate:null,notes:tk.notes,autoGenerated:true});
  }
  save(false);renderDashboard();
  toast(t("tk_completed")+(tk.recurring&&tk.recurDays?" "+t("tk_next_created"):""),"✅");
};
