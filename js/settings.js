// BeeManager Pro — settings.js
// Settings, local backup, per-hive PDF

// ═══════════════════════════════════════════
// SETTINGS
// ═══════════════════════════════════════════
function renderSettings(){
  var totH=D.honeyHarvests.reduce(function(s,h){return s+(h.actualQty||h.qty||0);},0);
  var th=parseInt(D.settings.inspAlertThreshold)||INSP_ALERT_DEFAULT;
  var isEN=D.settings.lang==="en";

  // ── Archive build (unchanged logic) ──────────────────────────
  var allSorted2=[].concat(D.inspections).sort(function(a,b){return new Date(b.date)-new Date(a.date);});
  var seenHive2={};var shownIds2={};
  allSorted2.forEach(function(i){if(i.date&&!seenHive2[i.hiveId]){seenHive2[i.hiveId]=true;shownIds2[i.id]=true;}});
  var pastInsp2=allSorted2.filter(function(i){return i.date&&!shownIds2[i.id];});
  var byMonth2={};
  pastInsp2.forEach(function(i){var m=i.date.slice(0,7);if(!byMonth2[m])byMonth2[m]={};if(!byMonth2[m][i.hiveId])byMonth2[m][i.hiveId]=[];byMonth2[m][i.hiveId].push(i);});
  var monthKeys2=Object.keys(byMonth2).sort().reverse();
  var arcInnerHTML=monthKeys2.length===0?'<div class="al ali">'+t("insp_no_arc")+'</div>':monthKeys2.map(function(ym,mi){
    var arcId2="se_arc_m"+mi;var hivesInMonth2=byMonth2[ym];var hiveKeys2=Object.keys(hivesInMonth2);
    var total2=0;hiveKeys2.forEach(function(hid){total2+=hivesInMonth2[hid].length;});
    var hivesHTML2=hiveKeys2.map(function(hid,hi){
      var hv=D.hives.find(function(h){return h.id===hid;});var hivArcId2=arcId2+"_h"+hi;
      var insps2=hivesInMonth2[hid].slice().sort(function(a,b){return new Date(a.date)-new Date(b.date);});
      var rows2=insps2.map(function(insp){
        return'<div style="display:flex;align-items:center;gap:6px;padding:8px 12px;border-bottom:1px solid var(--bdr);flex-wrap:wrap;">'
          +'<span style="font-size:.82rem;font-weight:700;min-width:95px;">📅 '+insp.date+'</span>'
          +'<span class="bg '+(insp.qSeen?"gg":"gy")+'" style="font-size:.63rem;">'+(insp.qSeen?"👑✅":"👑❓")+'</span>'
          +'<span class="bg gb" style="font-size:.63rem;">🥚 '+(insp.fB||0)+'</span>'
          +'<span class="bg gg" style="font-size:.63rem;">🍯 '+inspFood(insp)+'</span>'
          +'<div style="margin-left:auto;display:flex;gap:4px;">'
          +'<button class="btn sm be" onclick="inspM(\''+insp.hiveId+'\',\''+insp.id+'\')">✏️</button>'
          +'<button class="btn sm gh" onclick="exportInspPDF(\''+insp.id+'\')">📄</button>'
          +'<button class="btn sm gh" onclick="exportInspXLS(\''+insp.id+'\')">📊</button>'
          +'</div></div>';
      }).join("");
      return'<div style="margin:3px 0;"><div onclick="toggleArc(\''+hivArcId2+'\')" style="cursor:pointer;padding:9px 14px;background:rgba(230,180,34,.04);border:1px solid var(--bdr);border-radius:var(--rs);display:flex;justify-content:space-between;align-items:center;user-select:none;">'
        +'<span style="font-weight:700;font-size:.83rem;">🏠 '+(hv?hv.name:hid)+'</span>'
        +'<div style="display:flex;gap:6px;align-items:center;"><span class="bg gy" style="font-size:.65rem;">'+insps2.length+' insp.</span><span style="color:var(--mut);font-size:.75rem;">▼</span></div>'
        +'</div><div id="'+hivArcId2+'" style="display:none;border:1px solid var(--bdr);border-top:none;border-radius:0 0 var(--rs) var(--rs);overflow:hidden;">'+rows2+'</div></div>';
    }).join("");
    return'<div style="margin-bottom:10px;"><div onclick="toggleArc(\''+arcId2+'\')" style="cursor:pointer;padding:11px 16px;background:rgba(230,180,34,.09);border:1px solid rgba(230,180,34,.28);border-radius:var(--rm);display:flex;justify-content:space-between;align-items:center;user-select:none;">'
      +'<span style="font-weight:800;font-size:.92rem;">📅 '+monthName(ym)+'</span>'
      +'<div style="display:flex;gap:7px;align-items:center;"><span class="bg gy" style="font-size:.68rem;">'+hiveKeys2.length+' stupi</span><span class="bg gb" style="font-size:.68rem;">'+total2+' insp.</span><span style="color:var(--gold);font-size:.8rem;">▼</span></div>'
      +'</div><div id="'+arcId2+'" style="display:none;padding:8px 4px;">'+hivesHTML2+'</div></div>';
  }).join("");

  // ── Drive: manual JSON export/import ────────────────────────────
  var driveLastExport=D.settings.driveLastExport?new Date(D.settings.driveLastExport).toLocaleString():"—";
  var driveStatusHTML='<div style="background:rgba(255,255,255,.04);border:1px solid var(--bdr);border-radius:var(--rs);padding:11px 14px;font-size:.8rem;">'    +'<p style="margin:0 0 10px;font-size:.78rem;color:var(--mut);line-height:1.45;">'+(isEN      ?"Save a JSON backup directly to any folder (including Google Drive). No login or token required — just pick the location when prompted."      :"Salvează un backup JSON direct în orice folder (inclusiv Google Drive). Fără autentificare sau token — alegi locația la salvare.")+'</p>'    +'<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px;">'    +'<button class="btn" onclick="driveExportJSON()" style="flex:1;min-width:140px;">⬆️ '+(isEN?"Save JSON to Drive":"Salvează JSON pe Drive")+'</button>'    +'<button class="btn gh" onclick="driveImportJSON()" style="flex:1;min-width:140px;">⬇️ '+(isEN?"Load JSON from file":"Încarcă JSON din fișier")+'</button>'    +'</div>'    +'<div style="font-size:.7rem;color:var(--mut);">'+(isEN?"Last export: ":"Ultimul export: ")+driveLastExport+'</div>'    +'</div>';
  // ── Per-hive snapshots status ─────────────────────────────────
  var hiveSnapHTML='';
  if(D.hives.length>0){
    var snapRows=D.hives.map(function(h){
      var snap=null;try{var s=localStorage.getItem("bmp5_hive_"+h.id);if(s)snap=JSON.parse(s);}catch(e){}
      var savedAt=snap?new Date(snap.savedAt).toLocaleString():"—";
      var inspCnt=snap?(snap.inspections||[]).length:0;
      return'<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid var(--bdr);font-size:.76rem;">'
        +'<span style="font-weight:700;">🏠 '+h.name+'</span>'
        +'<span style="color:var(--mut);font-size:.7rem;">'+inspCnt+' insp. · '+savedAt+'</span>'
        +'<button class="btn sm gh" style="font-size:.65rem;" onclick="exportHivePDF(\''+h.id+'\')">📄</button>'
        +'</div>';
    }).join("");
    hiveSnapHTML='<div class="c" style="margin-bottom:14px;"><div class="ct">🏠 '+(isEN?"Auto-save per hive":"Auto-salvare per stup")+'</div>'
      +'<p style="font-size:.78rem;color:var(--mut);margin:4px 0 10px;">'+(isEN?"Each hive has its own local snapshot updated on every save. Export individual hive reports below.":"Fiecare stup are propriul snapshot local, actualizat la fiecare salvare. Exportați rapoarte individuale mai jos.")+'</p>'
      +snapRows
      +'</div>';
  }

  setP('<h2 style="margin-bottom:12px;font-size:1.2rem;"><i class="fas fa-sliders" style="color:var(--gold)"></i> '+t("se_title")+'</h2>'

    // ── Account & Drive ──
    +'<div class="c" style="margin-bottom:14px;"><div class="ct">👤 '+(isEN?"Account & Cloud Sync":"Cont & Sincronizare Cloud")+'</div>'
    +'<div style="margin-top:8px;">'
    +L(isEN?"Your email (used for identification)":"Email-ul tău (identificare)")
    +'<input type="email" id="userEmailInp" placeholder="exemplu@gmail.com" value="'+esc(D.settings.userEmail||"")+'" oninput="D.settings.userEmail=this.value.trim();save(false);">'
    +'</div>'
    +'<div style="margin:14px 0 6px;font-size:.78rem;font-weight:700;color:var(--gold);">☁️ '+(isEN?"Google Drive Backup":"Backup Google Drive")+'</div>'
    +driveStatusHTML
    +'</div>'

    // ── Inspection archive ──
    +'<div class="c" style="margin-bottom:14px;"><div class="ct">📁 '+(isEN?"Inspection Archive":"Arhivă Inspecții")+'</div>'
    +'<p style="font-size:.8rem;color:var(--mut);margin:4px 0 10px;">'+(isEN?"All inspections from previous months, organised by month and hive.":"Toate inspecțiile din lunile anterioare, organizate pe lună și stup.")+'</p>'
    +arcInnerHTML+'</div>'

    // ── Display ──
    +'<div class="c" style="margin-bottom:14px;"><div class="ct">'+t("se_display")+'</div>'
    +'<div class="ck" style="margin-top:8px;"><input type="checkbox" id="dkTg"'+(D.settings.dark?" checked":"")
    +' onchange="D.settings.dark=this.checked;applyTheme();save();"><label for="dkTg">'+t("se_dark")+'</label></div>'
    +'<div style="margin-top:10px;display:flex;align-items:center;gap:10px;flex-wrap:wrap;">'
    +'<span style="font-size:.78rem;font-weight:700;color:var(--gold);">'+t("se_lang")+'</span>'
    +'<button class="btn sm'+(D.settings.lang==="ro"?" ":" gh ")+'" onclick="setLang(\'ro\')">'+t("se_lang_ro")+'</button>'
    +'<button class="btn sm'+(D.settings.lang==="en"?" ":" gh ")+'" onclick="setLang(\'en\')">'+t("se_lang_en")+'</button>'
    +'</div>'
    +'<div style="margin-top:10px;display:flex;align-items:center;gap:10px;flex-wrap:wrap;">'
    +'<span style="font-size:.78rem;font-weight:700;color:var(--gold);">'+t("temp_unit_lbl")+'</span>'
    +'<button class="btn sm'+(D.settings.tempUnit==="C"?" ":" gh ")+'" onclick="setTempUnit(\'C\')">'+t("temp_C")+'</button>'
    +'<button class="btn sm'+(D.settings.tempUnit==="F"?" ":" gh ")+'" onclick="setTempUnit(\'F\')">'+t("temp_F")+'</button>'
    +'</div></div>'

    // ── Menu order ──
    +'<div class="c" style="margin-bottom:14px;"><div class="ct">'+t("mno_title")+'</div>'
    +'<p style="font-size:.78rem;color:var(--mut);margin:4px 0 10px;line-height:1.45;">'+t("mno_info")+'</p>'
    +'<div id="mnoList">'+menuOrderListHTML()+'</div>'
    +'<button class="btn sm gh" style="margin-top:10px;" onclick="mnoReset()">'+t("mno_reset")+'</button>'
    +'</div>'

    // ── Alerts ──
    +'<div class="c" style="margin-bottom:14px;"><div class="ct">🔔 '+(isEN?"Inspection Alerts":"Alerte Inspecții")+'</div>'
    +'<p style="font-size:.8rem;color:var(--mut);margin:6px 0 10px;">'+(isEN?"Hives not inspected for more than this many days show a warning (default: 7).":"Stupi neverificați de mai mult decât atâtea zile afișează o avertizare (implicit: 7).")+'</p>'
    +'<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">'
    +'<span style="font-size:.82rem;font-weight:700;">'+(isEN?"Days without inspection → alert":"Zile fără inspecție → alertă")+'</span>'
    +'<input type="number" inputmode="numeric" min="1" max="90" value="'+th+'" style="width:70px;" oninput="D.settings.inspAlertThreshold=parseInt(this.value)||INSP_ALERT_DEFAULT;save(false);">'
    +'</div>'
    +'<div class="ck" style="margin-top:12px;"><input type="checkbox" id="autoDlTg"'+(D.settings.autoDownloadInsp?" checked":"")
    +' onchange="D.settings.autoDownloadInsp=this.checked;save(false);"><label for="autoDlTg">'+t("se_auto_dl")+'</label></div>'
    +'</div>'

    // ── Weather ──
    +'<div class="c" style="margin-bottom:14px;"><div class="ct">'+t("se_weather")+'</div>'
    +'<p style="font-size:.82rem;color:var(--mut);margin-bottom:8px;">'+t("se_w_info")
    +(D.weather&&D.weather.manual?" <span class='bg gy' style='font-size:.65rem;'>✍️ manual</span>":"")
    +'</p>'
    +(D.weather?'<div class="al alo">'+t("se_w_ok")+' '+Math.round((Date.now()-D.weather.ts)/60000)+' '+t("se_w_min")+(D.weather.manual?" (manual)":"")+'</div>'
    :'<div class="al alw">'+t("se_w_no")+'</div>')
    +'<div style="display:flex;gap:8px;margin-top:9px;flex-wrap:wrap;">'
    +'<button class="btn sm" onclick="if(navigator.onLine){if(D.userLoc)fetchW(D.userLoc.lat,D.userLoc.lon);else initLoc();}else{openManualWeather();}">'+(isEN?"Update weather":"Actualizează vreme")+'</button>'
    +'<button class="btn sm gh" onclick="openManualWeather()">✍️ '+(isEN?"Manual entry":"Introdu manual")+'</button>'
    +'</div></div>'

    // ── Auto-save per hive ──
    +hiveSnapHTML

    // ── Backup & Export ──
    +'<div class="c" style="margin-bottom:14px;"><div class="ct">'+t("se_backup")+'</div>'
    +'<p style="font-size:.78rem;color:var(--mut);margin:4px 0 10px;">'+(isEN?"Manual export: all hives + all inspections in one file.":"Export manual: toți stupii + toate inspecțiile într-un singur fișier.")+'</p>'
    +'<button class="btn" style="margin-top:4px;display:block;" onclick="exportToExcel()">📊 Export Excel complet</button>'
    +'<button class="btn gh" style="margin-top:8px;display:block;" onclick="exportToPDF()">📄 Export PDF complet</button>'
    +'<button class="btn gh" style="margin-top:8px;display:block;" onclick="expData()">'+t("se_exp")+' (JSON)</button>'
    +'<button class="btn gh" style="margin-top:8px;display:block;" onclick="impData()">'+t("se_imp")+'</button>'
    +'<button class="btn bd" style="margin-top:8px;display:block;" onclick="rstData()">'+t("se_rst")+'</button></div>'

    // ── Stats ──
    +'<div class="c"><div class="ct">'+t("se_stats")+'</div>'
    +'<p style="font-size:.83rem;margin-top:6px;">'+t("se_st_h")+' <strong>'+D.hives.length+'</strong> · '+t("se_st_i")+' <strong>'+D.inspections.length+'</strong>'+(modOn("honey")?' · '+t("se_st_hr")+' <strong>'+totH.toFixed(1)+' kg</strong>':'')+(modOn("inventory")?' · '+t("se_st_inv")+' <strong>'+D.inventory.length+' '+t("se_st_a")+'</strong>':'')+'</p>'
    +'<p style="font-size:.72rem;color:var(--mut);margin-top:8px;">💾 Stocare locală: '+(Math.round(JSON.stringify(D).length/1024))+' KB · Conexiune: '+(navigator.onLine?'<span style="color:var(--ok)">Online</span>':'<span style="color:var(--danger)">Offline</span>')+'</p>'
    +'</div>');
  mnoInitDrag();
}

// ── Menu order (drag & drop + arrows) ─────────────────────
function menuOrderListHTML(){
  return PGS.map(function(p,i){
    return'<div class="mno-row" data-id="'+p.id+'">'
      +'<span class="mno-h" title="☰">☰</span>'
      +'<span class="mno-n">'+(i+1)+'</span>'
      +'<i class="fas '+p.i+'" style="color:var(--gold);width:18px;text-align:center;"></i>'
      +'<span class="mno-l">'+t(p.lk)
      +(i===0?' <span class="bg gg mno-b">🏠 '+t("mno_start")+'</span>':'')
      +(i<4?' <span class="bg gb mno-b">📱 '+t("mno_bar")+'</span>':'')
      +'</span>'
      +'<button type="button" class="btn sm gh mno-a" onclick="mnoMove(\''+p.id+'\',-1)"'+(i===0?' disabled':'')+'>▲</button>'
      +'<button type="button" class="btn sm gh mno-a" onclick="mnoMove(\''+p.id+'\',1)"'+(i===PGS.length-1?' disabled':'')+'>▼</button>'
      +'</div>';
  }).join("");
}
function mnoApply(ids){
  D.settings.menuOrder=ids;save(false);
  applyMenuOrder();buildNav();
  var l=document.getElementById("mnoList");if(l)l.innerHTML=menuOrderListHTML();
}
window.mnoMove=function(id,dir){
  var ids=PGS.map(function(p){return p.id;});
  var i=ids.indexOf(id),j=i+dir;if(i<0||j<0||j>=ids.length)return;
  ids.splice(i,1);ids.splice(j,0,id);mnoApply(ids);
};
window.mnoReset=function(){
  delete D.settings.menuOrder;save(false);
  applyMenuOrder();buildNav();
  var l=document.getElementById("mnoList");if(l)l.innerHTML=menuOrderListHTML();
  toast(t("mno_saved"),"☰");
};
// Drag & drop: works with finger (phone) and mouse, holding ☰
function mnoInitDrag(){
  var list=document.getElementById("mnoList");if(!list||list._dnd)return;list._dnd=true;
  list.addEventListener("pointerdown",function(e){
    var h=e.target.closest?e.target.closest(".mno-h"):null;if(!h)return;
    var row=h.closest(".mno-row");if(!row)return;
    e.preventDefault();
    var startOrder=[].map.call(list.querySelectorAll(".mno-row"),function(r){return r.dataset.id;}).join(",");
    row.classList.add("drag");
    var scroller=document.scrollingElement||document.documentElement;
    function mv(ev){
      var y=ev.clientY;
      var rows=[].slice.call(list.querySelectorAll(".mno-row")).filter(function(r){return r!==row;});
      var before=null;
      for(var k=0;k<rows.length;k++){var r=rows[k].getBoundingClientRect();if(y<r.top+r.height/2){before=rows[k];break;}}
      if(before){if(row.nextSibling!==before)list.insertBefore(row,before);}else if(list.lastChild!==row)list.appendChild(row);
      // auto-scroll near the screen edges
      if(y<90)scroller.scrollTop-=12;else if(y>window.innerHeight-110)scroller.scrollTop+=12;
    }
    function up(){
      document.removeEventListener("pointermove",mv);document.removeEventListener("pointerup",up);document.removeEventListener("pointercancel",up);
      row.classList.remove("drag");
      var ids=[].map.call(list.querySelectorAll(".mno-row"),function(r){return r.dataset.id;});
      if(ids.join(",")!==startOrder){mnoApply(ids);toast(t("mno_saved"),"☰");}
    }
    document.addEventListener("pointermove",mv);document.addEventListener("pointerup",up);document.addEventListener("pointercancel",up);
  });
}
window.expData=function(){var a=document.createElement("a");a.href=URL.createObjectURL(new Blob([JSON.stringify(D,null,2)],{type:"application/json"}));a.download="beemanager_backup_"+todayISO()+".json";a.click();};
window.impData=function(){driveImportJSON();};
window.rstData=function(){showConfirm(t("se_rst"),function(){localStorage.removeItem("bmp5");location.reload();});};

// Export PDF per hive (individual hive report)
window.exportHivePDF=function(hiveId){
  var hive=D.hives.find(function(h){return h.id===hiveId;});
  if(!hive){toast("Stupul nu a fost găsit","❌");return;}
  var isEN=D.settings.lang==="en";
  var insps=D.inspections.filter(function(i){return i.hiveId===hiveId;}).sort(function(a,b){return new Date(b.date)-new Date(a.date);});
  var harvests=D.honeyHarvests.filter(function(h){return h.hiveId===hiveId;});
  var totalReal=harvests.reduce(function(s,h){return s+(h.actualQty||h.qty||0);},0);
  var html='<!DOCTYPE html><html><head><meta charset="UTF-8"><title>'+hive.name+'</title>'
    +'<style>body{font-family:Arial,sans-serif;font-size:12px;color:#222;margin:30px;}h1{color:#c8860a;font-size:18px;}h2{color:#555;font-size:13px;margin-top:18px;border-bottom:1px solid #eee;padding-bottom:4px;}table{width:100%;border-collapse:collapse;margin-top:8px;}th,td{border:1px solid #ddd;padding:5px 8px;text-align:left;}th{background:#f5f5f5;font-size:11px;}tr:nth-child(even){background:#fafafa;}.label{font-weight:bold;color:#666;font-size:11px;}.val{font-weight:bold;font-size:13px;}.badge{display:inline-block;padding:2px 7px;border-radius:10px;font-size:10px;margin-right:3px;}</style>'
    +'</head><body>'
    +'<h1>🏠 '+hive.name+(hive.loc?" — "+hive.loc:"")+'</h1>'
    +'<p style="color:#888;font-size:11px;">'+(isEN?"Report generated":"Raport generat")+': '+new Date().toLocaleString()+'</p>'
    +'<table><tr><th colspan="4">🐝 '+(isEN?"Hive info":"Informații stup")+'</th></tr>'
    +'<tr><td><span class="label">'+(isEN?"Material":"Material")+'</span><br><span class="val">'+(hive.mat||"—")+'</span></td>'
    +'<td><span class="label">'+(isEN?"Model":"Model")+'</span><br><span class="val">'+(hive.mod||"—")+'</span></td>'
    +'<td><span class="label">'+(isEN?"Strength":"Forță")+'</span><br><span class="val">'+(hive.str||"—")+'</span></td>'
    +'<td><span class="label">'+L2("Magazii","Supers")+'</span><br><span class="val">'+(hvMagCount(hive)?hvMags(hive).map(function(m,i){return'M'+(i+1)+': '+m.f+' '+L2("rame","fr.")+' · '+m.cap+'%';}).join('<br>'):"—")+'</span></td></tr>'
    +'<tr><td><span class="label">'+(isEN?"Brood frames":"Rame puiet")+'</span><br><span class="val">'+(hive.fB||0)+'</span></td>'
    +'<td><span class="label">'+(isEN?"Food frames":"Rame mâncare")+'</span><br><span class="val">'+(hive.fH||0)+' <small style="color:#888;font-weight:normal;">('+(isEN?"total":"total")+' '+hvTotal(hive)+')</small></span></td>'
    +(modOn("honey")?'<td colspan="2"><span class="label">'+(isEN?"Total honey harvested":"Total miere recoltată")+'</span><br><span class="val">'+totalReal.toFixed(1)+' kg</span></td>':'<td colspan="2"></td>')+'</tr></table>'
    +(insps.length>0?
      '<h2>📋 '+(isEN?"Inspections ("+insps.length+")":"Inspecții ("+insps.length+")")+'</h2>'
      +'<table><tr><th>Data</th><th>'+(isEN?"Brood":"Puiet")+'</th><th>'+(isEN?"Food":"Mâncare")+'</th><th>Regina</th><th>Botci</th><th>Note</th></tr>'
      +insps.slice(0,15).map(function(i){
        return'<tr><td>'+i.date+'</td><td>'+i.fB+'</td><td>'+inspFood(i)+'</td>'
          +'<td>'+(i.qSeen?"✅":"❓")+'</td>'
          +'<td>'+(i.botci?"🐛 "+(i.botciN||0):"—")+'</td>'
          +'<td style="font-size:10px;">'+(i.notes||"")+'</td></tr>';
      }).join("")
      +'</table>':"")
    +(harvests.length>0&&modOn("honey")?
      '<h2>🍯 '+(isEN?"Honey harvests":"Recolte miere")+'</h2>'
      +'<table><tr><th>Data</th><th>Tip</th><th>Estimat(kg)</th><th>Real(kg)</th><th>Umid.%</th></tr>'
      +harvests.map(function(h){return'<tr><td>'+(h.extractionDate||h.date||"")+'</td><td>'+(h.honeyType||"")+'</td><td>'+(h.estQty||0)+'</td><td>'+(h.actualQty||h.qty||0)+'</td><td>'+(h.humidity||"")+'</td></tr>';}).join("")
      +'</table>':"")
    +'</body></html>';
  var w=window.open("","_blank");if(!w)return;
  w.document.write(html);w.document.close();
  setTimeout(function(){w.print();},500);
};
