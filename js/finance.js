// BeeManager Pro — finance.js
// Finance + honey sales

// ═══════════════════════════════════════════
// FINANCE — Income & Expenses
// ═══════════════════════════════════════════
var _finTab="all";
var _finYear=new Date().getFullYear();

function renderFinanciar(){
  var isEN=D.settings.lang==="en";
  var fins=D.finances||[];
  var allYears=[new Date().getFullYear()];
  fins.forEach(function(f){var y=parseInt((f.date||"").slice(0,4));if(y&&allYears.indexOf(y)===-1)allYears.push(y);});
  allYears.sort(function(a,b){return b-a;});
  if(allYears.indexOf(_finYear)===-1)_finYear=allYears[0];

  var yearFins=fins.filter(function(f){return(f.date||"").startsWith(String(_finYear));});
  var tabFins=_finTab==="income"?yearFins.filter(function(f){return f.type==="income";}):_finTab==="expense"?yearFins.filter(function(f){return f.type==="expense";}):yearFins;
  tabFins=[].concat(tabFins).sort(function(a,b){return new Date(b.date)-new Date(a.date);});

  var totInc=yearFins.filter(function(f){return f.type==="income";}).reduce(function(s,f){return s+f.amount;},0);
  var totExp=yearFins.filter(function(f){return f.type==="expense";}).reduce(function(s,f){return s+f.amount;},0);
  var netPL=totInc-totExp;
  var totKg=D.honeyHarvests.filter(function(h){return(h.extractionDate||h.date||"").startsWith(String(_finYear));}).reduce(function(s,h){return s+(h.actualQty||h.qty||0);},0);
  var cpkg=totKg>0?(totExp/totKg).toFixed(2):"—";

  // KPI cards
  var kpiH='<div class="g gs" style="margin-bottom:14px;">'
    +'<div class="c"><div class="cl">'+t("fin_total_income")+'</div><div class="cv" style="color:var(--ok)">'+totInc.toFixed(0)+'</div><div class="cs">RON</div></div>'
    +'<div class="c"><div class="cl">'+t("fin_total_expense")+'</div><div class="cv" style="color:var(--danger)">'+totExp.toFixed(0)+'</div><div class="cs">RON</div></div>'
    +'<div class="c"><div class="cl">'+t("fin_net")+'</div><div class="cv" style="color:'+(netPL>=0?"var(--ok)":"var(--danger)");
  kpiH+=(netPL>=0?"+":"")+netPL.toFixed(0)+'</div><div class="cs">RON</div></div>'
    +'<div class="c"><div class="cl">'+t("fin_cost_per_kg")+'</div><div class="cv" style="font-size:1.1rem">'+cpkg+'</div><div class="cs">'+(cpkg==="—"?"":"RON / kg")+'</div></div>'
    +'</div>';

  // Monthly income/expense bar chart data
  var months=Array.from({length:12},function(_,i){return i;});
  var incByM=months.map(function(m){return yearFins.filter(function(f){return f.type==="income"&&parseInt((f.date||"").slice(5,7))-1===m;}).reduce(function(s,f){return s+f.amount;},0);});
  var expByM=months.map(function(m){return yearFins.filter(function(f){return f.type==="expense"&&parseInt((f.date||"").slice(5,7))-1===m;}).reduce(function(s,f){return s+f.amount;},0);});
  var hasMonthlyData=incByM.some(function(v){return v>0;})||expByM.some(function(v){return v>0;});
  var chartH=hasMonthlyData?'<div class="c" style="margin-bottom:14px;"><div class="ct">📊 '+(isEN?"Monthly overview — "+_finYear:"Evoluție lunară — "+_finYear)+'</div><canvas id="finChart" height="80"></canvas></div>':"";

  // Category breakdown
  var incCats={},expCats={};
  yearFins.forEach(function(f){
    if(f.type==="income"){incCats[f.category]=(incCats[f.category]||0)+f.amount;}
    else{expCats[f.category]=(expCats[f.category]||0)+f.amount;}
  });
  var incCatRows=Object.keys(incCats).sort(function(a,b){return incCats[b]-incCats[a];}).map(function(c){
    var pct=totInc>0?((incCats[c]/totInc)*100).toFixed(0):0;
    return'<div style="display:flex;align-items:center;gap:8px;padding:5px 0;border-bottom:1px solid var(--bdr);">'
      +'<span style="font-size:.78rem;flex:1;color:var(--txt);">'+c+'</span>'
      +'<span style="font-size:.78rem;font-weight:700;color:var(--ok);">'+incCats[c].toFixed(0)+' RON</span>'
      +'<div style="width:50px;background:rgba(111,191,76,.15);border-radius:20px;height:4px;overflow:hidden;">'
      +'<div style="width:'+pct+'%;height:100%;background:var(--ok);border-radius:20px;"></div></div>'
      +'</div>';
  }).join("");
  var expCatRows=Object.keys(expCats).sort(function(a,b){return expCats[b]-expCats[a];}).map(function(c){
    var pct=totExp>0?((expCats[c]/totExp)*100).toFixed(0):0;
    return'<div style="display:flex;align-items:center;gap:8px;padding:5px 0;border-bottom:1px solid var(--bdr);">'
      +'<span style="font-size:.78rem;flex:1;color:var(--txt);">'+c+'</span>'
      +'<span style="font-size:.78rem;font-weight:700;color:var(--danger);">'+expCats[c].toFixed(0)+' RON</span>'
      +'<div style="width:50px;background:rgba(224,124,76,.15);border-radius:20px;height:4px;overflow:hidden;">'
      +'<div style="width:'+pct+'%;height:100%;background:var(--danger);border-radius:20px;"></div></div>'
      +'</div>';
  }).join("");
  var catH=(Object.keys(incCats).length||Object.keys(expCats).length)?
    '<div class="g" style="grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px;">'
    +(Object.keys(incCats).length?'<div class="c"><div class="ct" style="color:var(--ok)">💰 '+(isEN?"By income category":"Pe categorii venituri")+'</div>'+incCatRows+'</div>':"")
    +(Object.keys(expCats).length?'<div class="c"><div class="ct" style="color:var(--danger)">💸 '+(isEN?"By expense category":"Pe categorii cheltuieli")+'</div>'+expCatRows+'</div>':"")
    +'</div>':"";

  // Year selector
  var yearSel='<select onchange="_finYear=parseInt(this.value);renderFinanciar();" style="font-size:.8rem;padding:5px 8px;border-radius:var(--rs);background:var(--sur);border:1px solid var(--bdr);color:var(--txt);margin-left:8px;">'
    +allYears.map(function(y){return'<option value="'+y+'"'+(y===_finYear?" selected":"")+'>'+y+'</option>';}).join("")+'</select>';

  // Tabs
  var tabs='<div style="display:flex;gap:6px;margin:12px 0 10px;flex-wrap:wrap;">'
    +[["all",t("fin_tab_all")],["income",t("fin_tab_income")],["expense",t("fin_tab_expense")]].map(function(tb){
      return'<button class="btn sm'+(tb[0]===_finTab?"":" gh")+'" onclick="_finTab=\''+tb[0]+'\';renderFinanciar();">'+tb[1]+'</button>';
    }).join("")+'</div>';

  // Transaction list
  var rows=tabFins.map(function(f){
    var hv=D.hives.find(function(h){return h.id===f.hiveId;});
    var isInc=f.type==="income";
    return'<div class="c" style="padding:10px 13px;margin-bottom:7px;">'
      +'<div style="display:flex;align-items:flex-start;gap:9px;">'
      +'<div style="width:34px;height:34px;border-radius:50%;background:'+(isInc?"rgba(111,191,76,.15)":"rgba(224,124,76,.15)")+';display:flex;align-items:center;justify-content:center;font-size:1rem;flex-shrink:0;">'+(isInc?"💰":"💸")+'</div>'
      +'<div style="flex:1;min-width:0;">'
      +'<div style="display:flex;justify-content:space-between;align-items:center;gap:6px;flex-wrap:wrap;">'
      +'<div style="font-size:.86rem;font-weight:700;color:'+(isInc?"var(--ok)":"var(--danger)")+';">'+(isInc?"+":"-")+f.amount.toFixed(2)+' RON</div>'
      +'<span class="bg '+(isInc?"gg":"gr")+'" style="font-size:.65rem;">'+f.category+'</span>'
      +'</div>'
      +'<div style="font-size:.74rem;color:var(--mut);margin-top:2px;">📅 '+f.date+(hv?'  ·  🏠 '+hv.name:"")+(f.qty?'  ·  📦 '+f.qty+' kg @'+f.pricePerUnit+' RON/kg':"")+'</div>'
      +(f.notes?'<div style="font-size:.72rem;color:var(--mut);font-style:italic;margin-top:2px;">'+f.notes+'</div>':"")
      +'</div>'
      +'<div style="display:flex;gap:4px;flex-shrink:0;">'
      +'<button class="btn sm be" onclick="finM(\''+f.id+'\')">✏️</button>'
      +'<button class="btn sm bd" onclick="delFin(\''+f.id+'\')">🗑️</button>'
      +'</div></div></div>';
  }).join("");

  setP('<h2 style="margin-bottom:4px;font-size:1.2rem;"><i class="fas fa-coins" style="color:var(--gold)"></i> '+t("fin_title")+'</h2>'
    +'<div style="display:flex;align-items:center;gap:6px;margin-bottom:12px;flex-wrap:wrap;">'
    +t("fin_filter_year")+yearSel
    +'<button class="btn sm" style="margin-left:auto;" onclick="finM(\'\',-1)">'+t("fin_new_income")+'</button>'
    +'<button class="btn sm gh" onclick="finM(\'\',-2)">'+t("fin_new_expense")+'</button>'
    +'<button class="btn sm be" onclick="finAutoHoney()">'+t("fin_auto_honey")+'</button>'
    +'<button class="btn sm" style="background:linear-gradient(135deg,var(--gold),#c8860a);color:#1a1a1a;font-weight:700;" onclick="honeySaleM()">🍯 '+t("inv_sell_title")+'</button>'
    +'</div>'
    +kpiH+chartH+catH
    +tabs
    +(tabFins.length?rows:'<div class="al ali">'+t("fin_no_data")+'</div>'));

  if(hasMonthlyData){
    setTimeout(function(){
      var c=document.getElementById("finChart");if(!c)return;
      var mLbls=isEN?["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]:["Ian","Feb","Mar","Apr","Mai","Iun","Iul","Aug","Sep","Oct","Nov","Dec"];
      new Chart(c.getContext("2d"),{
        type:"bar",
        data:{labels:mLbls,datasets:[
          {label:isEN?"Income":"Venituri",data:incByM,backgroundColor:"rgba(111,191,76,.65)",borderColor:"#6fbf4c",borderWidth:1.5,borderRadius:4},
          {label:isEN?"Expenses":"Cheltuieli",data:expByM,backgroundColor:"rgba(224,124,76,.65)",borderColor:"#e07c4c",borderWidth:1.5,borderRadius:4}
        ]},
        options:{responsive:true,plugins:{legend:{labels:{color:"#b9b5ae",font:{size:10}}}},
          scales:{x:{ticks:{color:"#b9b5ae",font:{size:9}},grid:{color:"rgba(255,255,255,.04)"}},
                  y:{ticks:{color:"#b9b5ae",font:{size:9}},grid:{color:"rgba(255,255,255,.05)"}}}}
      });
    },80);
  }
}

window.delFin=function(id){
  showConfirm(t("fin_del_c"),function(){
    var fin=D.finances.find(function(f){return f.id===id;});
    // Restore inventory if this is a honey sale with saleLines
    if(fin&&fin.saleLines&&fin.saleLines.length){
      fin.saleLines.forEach(function(ln){
        var pkg=D.inventory.find(function(p){return p.id===ln.invId;});
        if(pkg)pkg.qty=(pkg.qty||0)+(parseInt(ln.pcs)||0);
      });
    }
    D.finances=D.finances.filter(function(f){return f.id!==id;});
    save();renderFinanciar();
  });
};

// ── Honey Sale Modal ──────────────────────────────────────────
var _hSaleLines=[];

// Recalculate totals from DOM without re-rendering the modal
function _hsUpdateTotals(){
  var pkgItems=D.inventory.filter(function(i){return i.cat==="Ambalaje"||i.cat==="Packaging";});
  var grandTotal=0,grandHoney=0;
  _hSaleLines.forEach(function(ln,idx){
    var pkg=pkgItems.find(function(i){return i.id===ln.invId;})||pkgItems[0];
    var hkg=pkg?pkg.honeyKg||0:0;
    var pcs=parseInt(ln.pcs)||0;
    var price=parseFloat(ln.price)||0;
    var lineTotal=price*pcs;
    grandTotal+=lineTotal;
    grandHoney+=hkg*pcs;
    var lineTotEl=document.getElementById("hsLT_"+idx);
    if(lineTotEl)lineTotEl.textContent=lineTotal.toFixed(2)+" RON";
    var honeyEl=document.getElementById("hsLH_"+idx);
    if(honeyEl)honeyEl.textContent="\ud83c\udf6f "+(hkg*pcs>0?(hkg*pcs).toFixed(3)+" kg miere":(hkg?hkg+" kg/buc":"\u2014 kg nedefinit"));
  });
  var gtEl=document.getElementById("hsGrandTotal");
  if(gtEl)gtEl.textContent=grandTotal.toFixed(2)+" RON";
  var ghEl=document.getElementById("hsGrandHoney");
  if(ghEl)ghEl.textContent=grandHoney>0?grandHoney.toFixed(3)+" kg":"\u2014";
}

window.honeySaleM=function(){
  var pkgItems=D.inventory.filter(function(i){return i.cat==="Ambalaje"||i.cat==="Packaging";});
  if(!pkgItems.length){toast("\u26a0\ufe0f "+t("inv_sell_no_pkg"));return;}
  _hSaleLines=[{invId:pkgItems[0].id,pcs:1,price:""}];
  _renderHoneySaleM(pkgItems);
};

function _renderHoneySaleM(pkgItems){
  var isEN=D.settings.lang==="en";
  var linesHTML=_hSaleLines.map(function(ln,idx){
    var pkg=pkgItems.find(function(i){return i.id===ln.invId;})||pkgItems[0];
    var hkg=pkg?pkg.honeyKg||0:0;
    var lineTotal=((parseFloat(ln.price)||0)*(parseInt(ln.pcs)||0)).toFixed(2);
    var honeyTotal=hkg*(parseInt(ln.pcs)||0);
    return'<div id="hsLine_'+idx+'" style="background:var(--sur2,rgba(255,255,255,.04));border:1px solid var(--bdr);border-radius:var(--rs);padding:10px;margin-bottom:8px;">'
      +'<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:7px;">'
      +'<span style="font-size:.78rem;font-weight:700;color:var(--gold);">\ud83e\udd6f '+(isEN?"Line":"Linie")+' '+(idx+1)+'</span>'
      +(_hSaleLines.length>1?'<button class="btn sm bd" onclick="hsRemoveLine('+idx+')">\u2715</button>':"")
      +'</div>'
      +'<div>'+L(isEN?"Packaging":"Ambalaj")
      +'<select onchange="hsSelectChange('+idx+',this.value)">'
      +pkgItems.map(function(i){return'<option value="'+i.id+'"'+(i.id===ln.invId?" selected":"")+'>'+i.name+' (stoc: '+i.qty+')</option>';}).join("")
      +'</select></div>'
      +'<div class="r2" style="margin-top:6px;">'
      +'<div>'+L(isEN?"Quantity (pcs)":"Cantitate (buc)")
        +'<input type="number" inputmode="numeric" min="1" value="'+(ln.pcs||1)+'"'
        +' onchange="_hSaleLines['+idx+'].pcs=parseInt(this.value)||1;_hsUpdateTotals();"'
        +' oninput="_hSaleLines['+idx+'].pcs=parseInt(this.value)||1;_hsUpdateTotals();">'
      +'</div>'
      +'<div>'+L(isEN?"Price/unit (RON)":"Pre\u021b/buc (RON)")
        +'<input type="number" inputmode="decimal" step="0.01" value="'+(ln.price||"")+'" placeholder="0.00"'
        +' onchange="_hSaleLines['+idx+'].price=this.value;_hsUpdateTotals();"'
        +' oninput="_hSaleLines['+idx+'].price=this.value;_hsUpdateTotals();">'
      +'</div>'
      +'</div>'
      +'<div style="display:flex;justify-content:space-between;margin-top:7px;font-size:.78rem;">'
      +'<span id="hsLH_'+idx+'" style="color:var(--mut);">\ud83c\udf6f '+(honeyTotal>0?honeyTotal.toFixed(3)+' kg miere':(hkg?hkg+" kg/buc":"\u2014 kg nedefinit"))+'</span>'
      +'<span id="hsLT_'+idx+'" style="color:var(--ok);font-weight:700;">'+lineTotal+' RON</span>'
      +'</div>'
      +'</div>';
  }).join("");

  var grandTotal=_hSaleLines.reduce(function(s,ln){return s+(parseFloat(ln.price)||0)*(parseInt(ln.pcs)||0);},0);
  var grandHoney=_hSaleLines.reduce(function(s,ln){
    var pkg=pkgItems.find(function(i){return i.id===ln.invId;})||pkgItems[0];
    return s+(pkg?pkg.honeyKg||0:0)*(parseInt(ln.pcs)||0);
  },0);

  var innerHTML='<div class="mt">\ud83c\udf6f '+t("inv_sell_title")+'</div>'
    +'<div style="margin-bottom:8px;">'
    +L(isEN?"Sale date":"Data v\u00e2nz\u0103rii")+'<input type="date" id="hsSaleDate" value="'+todayISO()+'">'
    +'</div>'
    +linesHTML
    +'<button class="btn sm gh" style="width:100%;margin-bottom:10px;" onclick="hsAddLine()">'+t("inv_sell_add_line")+'</button>'
    +'<div style="background:var(--sur2,rgba(255,255,255,.05));border-radius:var(--rs);padding:10px 12px;border:1px solid var(--bdr);margin-bottom:12px;">'
    +'<div style="display:flex;justify-content:space-between;align-items:center;">'
    +'<span style="font-size:.82rem;color:var(--mut);">\ud83c\udf6f Total miere: <strong id="hsGrandHoney" style="color:var(--txt);">'+(grandHoney>0?grandHoney.toFixed(3)+' kg':"\u2014")+'</strong></span>'
    +'<span id="hsGrandTotal" style="font-size:1.05rem;font-weight:800;color:var(--ok);">'+grandTotal.toFixed(2)+' RON</span>'
    +'</div>'
    +'</div>'
    +L(isEN?"Notes":"Note")+'<textarea id="hsNotes" rows="2" placeholder="'+(isEN?"Optional notes...":"Note op\u021bionale...")+'"></textarea>'
    +'<div class="br" style="margin-top:10px;"><button class="btn" onclick="saveHoneySale()">'+btnS()+'</button><button class="btn gh" onclick="closeM()">'+btnC()+'</button></div>';

  // If modal is already open, update its content without opening a new one
  var existingMB=document.getElementById("MB");
  if(existingMB){
    var mbBody=existingMB.querySelector(".mb-b");
    if(mbBody){mbBody.innerHTML=innerHTML;return;}
  }
  openM(innerHTML);
}

// Packaging select change — requires re-render to update displayed stock
window.hsSelectChange=function(idx,val){
  if(!_hSaleLines[idx])return;
  _hSaleLines[idx].invId=val;
  var pkgItems=D.inventory.filter(function(i){return i.cat==="Ambalaje"||i.cat==="Packaging";});
  _renderHoneySaleM(pkgItems);
};
window.hsAddLine=function(){
  var pkgItems=D.inventory.filter(function(i){return i.cat==="Ambalaje"||i.cat==="Packaging";});
  _hSaleLines.push({invId:pkgItems[0].id,pcs:1,price:""});
  _renderHoneySaleM(pkgItems);
};
window.hsRemoveLine=function(idx){
  _hSaleLines.splice(idx,1);
  var pkgItems=D.inventory.filter(function(i){return i.cat==="Ambalaje"||i.cat==="Packaging";});
  _renderHoneySaleM(pkgItems);
};
window.saveHoneySale=function(){
  var pkgItems=D.inventory.filter(function(i){return i.cat==="Ambalaje"||i.cat==="Packaging";});
  var isEN=D.settings.lang==="en";
  for(var i=0;i<_hSaleLines.length;i++){
    var ln=_hSaleLines[i];
    var pkg=pkgItems.find(function(p){return p.id===ln.invId;});
    if(!pkg)continue;
    if((parseInt(ln.pcs)||0)<1){toast("\u26a0\ufe0f "+(isEN?"Quantity must be at least 1":"Cantitatea trebuie s\u0103 fie cel pu\u021bin 1"));return;}
    if(ln.price===undefined||ln.price===null||ln.price===""||parseFloat(ln.price)<0){toast("\u26a0\ufe0f "+(isEN?"Enter price (0 for gift/donation)":"Introduce\u021bi pre\u021bul (0 pentru cadou)"));return;}
    if((parseInt(ln.pcs)||0)>pkg.qty){toast("\u26a0\ufe0f "+pkg.name+": "+t("inv_sell_stock_warn")+" (stoc: "+pkg.qty+")");return;}
  }
  var grandTotal=_hSaleLines.reduce(function(s,ln){return s+(parseFloat(ln.price)||0)*(parseInt(ln.pcs)||0);},0);
  var grandHoney=_hSaleLines.reduce(function(s,ln){
    var pkg=pkgItems.find(function(p){return p.id===ln.invId;})||pkgItems[0];
    return s+(pkg?pkg.honeyKg||0:0)*(parseInt(ln.pcs)||0);
  },0);
  var isGift=grandTotal===0;
  var saleDate=($q("hsSaleDate")||{}).value||todayISO();
  var notes=($q("hsNotes")||{}).value||"";
  var desc=_hSaleLines.map(function(ln){
    var pkg=pkgItems.find(function(p){return p.id===ln.invId;})||pkgItems[0];
    var priceStr=parseFloat(ln.price)===0?(isEN?"gift":"cadou"):(parseFloat(ln.price)||0).toFixed(2)+" RON";
    return(parseInt(ln.pcs)||0)+"\u00d7 "+pkg.name+" @ "+priceStr;
  }).join(", ");
  _hSaleLines.forEach(function(ln){
    var pkg=D.inventory.find(function(p){return p.id===ln.invId;});
    if(pkg)pkg.qty=Math.max(0,pkg.qty-(parseInt(ln.pcs)||0));
  });
  D.finances.push({
    id:uid(),type:"income",
    date:saleDate,
    amount:grandTotal,
    category:isGift?(isEN?"Honey gift":"Cadou miere"):(isEN?"Honey sale":"V\u00e2nzare miere"),
    qty:grandHoney>0?parseFloat(grandHoney.toFixed(3)):null,
    notes:(notes?(notes+"\n"):"")+desc,
    saleLines:JSON.parse(JSON.stringify(_hSaleLines))
  });
  save();closeM();renderFinanciar();
  toast(isGift?"\ud83c\udf81 "+(isEN?"Gift saved! Stock updated.":"Cadou salvat! Stoc actualizat."):"\ud83c\udf6f "+t("inv_sell_saved"));
};
// ── End Honey Sale ────────────────────────────────────────────

function finM(id,preset){
  // preset: -1 = force income, -2 = force expense, undefined = free choice
  var ex=id?D.finances.find(function(f){return f.id===id;}):null;
  var isInc=ex?ex.type==="income":preset!==-2;
  var isEN=D.settings.lang==="en";
  var incCats=t("fin_income_cats"),expCats=t("fin_expense_cats");
  var iTitle=ex?t("fin_edit_t"):(isInc?t("fin_new_t_i"):t("fin_new_t_e"));

  // Type selector (hidden if preset from button)
  var typeRow=(ex||preset===-1||preset===-2)?""
    :'<div style="display:flex;gap:8px;margin-bottom:10px;">'
    +'<button id="finTpInc" class="btn sm'+(isInc?"":" gh")+'" type="button" onclick="finToggleType(true)">💰 '+(isEN?"Income":"Venit")+'</button>'
    +'<button id="finTpExp" class="btn sm'+(isInc?" gh":"")+'" type="button" onclick="finToggleType(false)">💸 '+(isEN?"Expense":"Cheltuială")+'</button>'
    +'</div>';

  var catOpts=function(type){
    var cats=type==="income"?incCats:expCats;
    return cats.map(function(c){return'<option'+(xv(ex,"category","")=== c?" selected":"")+'>'+c+'</option>';}).join("");
  };

  // Build multi-checkbox category selector for expenses
  var buildExpCatCheckboxes=function(selectedRaw){
    var sel=selectedRaw?selectedRaw.split(" + "):[];
    return expCats.map(function(c,i){
      var chk=sel.indexOf(c)!==-1?" checked":"";
      return'<label style="display:flex;align-items:center;gap:7px;padding:5px 8px;border-radius:6px;cursor:pointer;background:rgba(255,255,255,.03);margin-bottom:3px;">'
        +'<input type="checkbox" id="finExpCat_'+i+'" name="finExpCats" value="'+c+'"'+chk+' style="width:16px;height:16px;accent-color:var(--danger);cursor:pointer;">'
        +'<span style="font-size:.83rem;color:var(--txt);">'+c+'</span>'
        +'</label>';
    }).join("");
  };

  var catHTML=isInc
    ? L(t("fin_category"))+'<select id="finCat">'+catOpts("income")+'</select>'
    : L(t("fin_category"))
      +'<div id="finExpCatBox" style="background:var(--sur2,var(--sur));border:1px solid var(--bdr);border-radius:var(--rs);padding:8px 10px;max-height:200px;overflow-y:auto;">'
      +buildExpCatCheckboxes(xv(ex,"category",""))
      +'</div>'
      +'<input type="hidden" id="finCat" value="'+esc(xv(ex,"category",""))+'">';

  openM('<div class="mt">'+iTitle+'</div>'
    +'<input type="hidden" id="finType" value="'+(isInc?"income":"expense")+'">'
    +typeRow
    +'<div class="r2">'
    +'<div>'+L(t("fin_date"))+'<input type="date" id="finDt" value="'+(xv(ex,"date",todayISO()))+'"></div>'
    +'<div>'+L(t("fin_amount"))+'<input type="number" inputmode="decimal" step="0.01" id="finAmt" value="'+(esc(xv(ex,"amount","")))+'" placeholder="0.00" oninput="finCalcAmt()"></div>'
    +'</div>'
    +catHTML
    +'<div id="finHoneyExtra">'+(isInc?'<div class="r2" style="margin-top:6px;"><div>'+L(t("fin_qty"))+'<input type="number" inputmode="decimal" step="0.1" id="finQty" value="'+(esc(xv(ex,"qty","")))+'" placeholder="0.0" oninput="finCalcAmt()"></div><div>'+L(t("fin_price_kg"))+'<input type="number" inputmode="decimal" step="0.01" id="finPpk" value="'+(esc(xv(ex,"pricePerUnit","")))+'" placeholder="0.00" oninput="finCalcAmt()"></div></div>':"")+'</div>'
    +L(t("fin_hive"))+'<select id="finHv"><option value="">—</option>'+D.hives.map(function(h){return'<option value="'+h.id+'"'+(xv(ex,"hiveId","")=== h.id?" selected":"")+'>'+h.name+'</option>';}).join("")+'</select>'
    +L(t("fin_notes"))+'<textarea id="finNt" rows="2">'+(esc(xv(ex,"notes","")))+'</textarea>'
    +'<div class="br" style="margin-top:14px;"><button class="btn" onclick="saveFin(\''+(id||"")+'\')" >'+btnS()+'</button><button class="btn gh" onclick="closeM()">'+btnC()+'</button></div>');
}

window.finToggleType=function(isInc){
  var incCats=t("fin_income_cats"),expCats=t("fin_expense_cats");
  document.getElementById("finType").value=isInc?"income":"expense";
  var incBtn=document.getElementById("finTpInc"),expBtn=document.getElementById("finTpExp");
  if(incBtn){incBtn.className="btn sm"+(isInc?"":" gh");}
  if(expBtn){expBtn.className="btn sm"+(isInc?" gh":"");}
  // Replace category selector depending on type
  // Find label before finCat and the finCat element
  if(isInc){
    // Restore select for income
    var expBox=document.getElementById("finExpCatBox");
    var hiddenCat=document.getElementById("finCat");
    var container=expBox?expBox.parentNode:(hiddenCat?hiddenCat.parentNode:null);
    if(expBox&&hiddenCat&&container){
      var sel=document.createElement("select");sel.id="finCat";
      sel.innerHTML=incCats.map(function(c){return'<option>'+c+'</option>';}).join("");
      container.replaceChild(sel,expBox);
      hiddenCat.parentNode&&hiddenCat.parentNode.removeChild(hiddenCat);
    }
  } else {
    // Replace select with checkboxes for expense
    var selEl=document.getElementById("finCat");
    if(selEl&&selEl.tagName==="SELECT"){
      var par=selEl.parentNode;
      var boxDiv=document.createElement("div");
      boxDiv.id="finExpCatBox";
      boxDiv.style.cssText="background:var(--sur2,var(--sur));border:1px solid var(--bdr);border-radius:var(--rs);padding:8px 10px;max-height:200px;overflow-y:auto;";
      boxDiv.innerHTML=expCats.map(function(c,i){
        return'<label style="display:flex;align-items:center;gap:7px;padding:5px 8px;border-radius:6px;cursor:pointer;background:rgba(255,255,255,.03);margin-bottom:3px;">'
          +'<input type="checkbox" id="finExpCat_'+i+'" name="finExpCats" value="'+c+'" style="width:16px;height:16px;accent-color:var(--danger);cursor:pointer;">'
          +'<span style="font-size:.83rem;color:var(--txt);">'+c+'</span>'
          +'</label>';
      }).join("");
      var hidInp=document.createElement("input");hidInp.type="hidden";hidInp.id="finCat";hidInp.value="";
      par.replaceChild(boxDiv,selEl);
      par.insertBefore(hidInp,boxDiv.nextSibling);
    }
  }
  var extra=document.getElementById("finHoneyExtra");
  if(extra){extra.innerHTML=isInc?('<div class="r2" style="margin-top:6px;"><div>'+L(t("fin_qty"))+'<input type="number" inputmode="decimal" step="0.1" id="finQty" placeholder="0.0" oninput="finCalcAmt()"></div><div>'+L(t("fin_price_kg"))+'<input type="number" inputmode="decimal" step="0.01" id="finPpk" placeholder="0.00" oninput="finCalcAmt()"></div></div>'):"";} 
};

window.finCalcAmt=function(){
  var qty=parseFloat(($q("finQty")||{}).value)||0;
  var ppk=parseFloat(($q("finPpk")||{}).value)||0;
  var amtEl=$q("finAmt");
  if(qty>0&&ppk>0&&amtEl&&!amtEl._userEdited){amtEl.value=(qty*ppk).toFixed(2);}
};

window.saveFin=function(id){
  var type=($q("finType")||{}).value||"expense";
  var amt=parseFloat(($q("finAmt")||{}).value)||0;
  if(!amt){toast("⚠️ "+(D.settings.lang==="en"?"Enter an amount!":"Introduceți suma!"));return;}
  var qty=parseFloat(($q("finQty")||{}).value)||null;
  var ppk=parseFloat(($q("finPpk")||{}).value)||null;
  // Read category: for expense use checkboxes, for income use select
  var category="";
  if(type==="expense"){
    var checked=document.querySelectorAll('input[name="finExpCats"]:checked');
    var cats=[];
    checked.forEach(function(cb){cats.push(cb.value);});
    category=cats.join(" + ");
    if(!category){toast("⚠️ "+(D.settings.lang==="en"?"Select at least one category!":"Selectați cel puțin o categorie!"));return;}
  } else {
    category=($q("finCat")||{}).value||"";
  }
  var o={id:id||uid(),type:type,
    date:($q("finDt")||{}).value||todayISO(),
    amount:amt,
    category:category,
    hiveId:($q("finHv")||{}).value||null,
    qty:qty,pricePerUnit:ppk,
    notes:($q("finNt")||{}).value||""};
  if(id){var ex=D.finances.find(function(f){return f.id===id;});if(ex)Object.assign(ex,o);}
  else{D.finances.push(o);}
  save();closeM();renderFinanciar();toast(t("fin_saved"),"💰");
};

// Auto-import honey harvest as income entries
window.finAutoHoney=function(){
  var isEN=D.settings.lang==="en";
  var ppkStr=prompt(isEN?"Enter honey price per kg (RON):":"Introduceți prețul pe kg de miere (RON):");
  if(!ppkStr)return;
  var ppk=parseFloat(ppkStr.replace(",","."));
  if(!ppk||ppk<=0){toast("⚠️ "+(isEN?"Invalid price!":"Preț invalid!"));return;}
  var added=0;
  D.honeyHarvests.forEach(function(h){
    var qty=h.actualQty||h.qty||0;
    if(!qty)return;
    // Check not already imported (by source ref)
    if(D.finances.some(function(f){return f._srcHarvestId===h.id;}))return;
    var cat=isEN?"Honey sales":"Vânzare miere";
    D.finances.push({id:uid(),type:"income",date:h.extractionDate||h.date||todayISO(),amount:parseFloat((qty*ppk).toFixed(2)),category:cat,hiveId:h.hiveId||null,qty:qty,pricePerUnit:ppk,notes:(h.honeyType||h.type||""),_srcHarvestId:h.id});
    added++;
  });
  if(added){save();renderFinanciar();toast(added+(isEN?" harvest entries imported as income!":" intrări importate ca venituri!"),"💰");}
  else toast(isEN?"All harvests already imported!":"Toate recoltele sunt deja importate!","ℹ️");
};
