// BeeManager Pro — settings.js
// Settings, local backup

// ═══════════════════════════════════════════
// SETTINGS
// ═══════════════════════════════════════════
function renderSettings(){
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
  var driveStatusHTML='<div style="background:rgba(255,255,255,.04);border:1px solid var(--bdr);border-radius:var(--rs);padding:11px 14px;font-size:.8rem;">'
    +'<p style="margin:0 0 10px;font-size:.78rem;color:var(--mut);line-height:1.45;">Apeși butonul, alegi <b>Drive</b> din meniul telefonului și apeși <b>Salvează</b>. O copie rămâne și pe telefon (backup dublu).</p>'
    +'<button class="btn" onclick="driveShareJSON()" style="width:100%;margin-bottom:8px;">☁️ Backup în Google Drive</button>'
    +'<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px;">'
    +'<button class="btn gh" onclick="driveExportJSON()" style="flex:1;min-width:140px;">💾 Doar pe telefon</button>'
    +'<button class="btn gh" onclick="driveImportJSON()" style="flex:1;min-width:140px;">⬇️ Încarcă backup din fișier</button>'
    +'</div>'
    +'<div style="font-size:.7rem;color:var(--mut);">Ultimul backup: '+driveLastExport+'</div>'
    +'</div>';
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
        +'</div>';
    }).join("");
    hiveSnapHTML='<div class="c" style="margin-bottom:14px;"><div class="ct">🏠 '+(isEN?"Auto-save per hive":"Auto-salvare per stup")+'</div>'
      +'<p style="font-size:.78rem;color:var(--mut);margin:4px 0 10px;">'+(isEN?"Each hive has its own local snapshot updated on every save.":"Fiecare stup are propriul snapshot local, actualizat la fiecare salvare.")+'</p>'
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
    +'</div>'

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

    // ── Observation sheet ──
    +fisaCardHTML()
    +(typeof demoCardHTML==="function"?demoCardHTML():"")

    // ── Backup & Export ──
    +'<div class="c" style="margin-bottom:14px;"><div class="ct">'+t("se_backup")+'</div>'
    +'<p style="font-size:.78rem;color:var(--mut);margin:4px 0 10px;">📥 Import JSON — alege de unde iei fișierul de backup (.json):</p>'
    +'<div style="display:flex;gap:8px;flex-wrap:wrap;">'
    +'<button class="btn" style="flex:1;min-width:150px;" onclick="impFrom(\'phone\')">📱 Din telefon</button>'
    +'<button class="btn" style="flex:1;min-width:150px;" onclick="impFrom(\'drive\')">☁️ Din Google Drive</button>'
    +'</div>'
    +'<p style="font-size:.72rem;color:var(--mut);margin:10px 0 0;line-height:1.45;">📱 <b>Telefon:</b> fișierul e de obicei în <b>Descărcări</b> (Downloads).<br>☁️ <b>Drive:</b> în fereastra care se deschide apasă <b>☰</b> (sus, stânga) și alege <b>Drive</b>, apoi fișierul.<br>⚠️ Importul înlocuiește datele actuale din aplicație.</p></div>');
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
// Import source buttons: both open the system file picker (a web app can't open Drive directly);
// the toast reminds where to tap for the chosen source.
window.impFrom=function(src){toast(src==="drive"?"Apasă ☰ (sus, stânga) → Drive → alege fișierul":"Alege fișierul din Descărcări (Downloads)",src==="drive"?"☁️":"📱");driveImportJSON();};
window.rstData=function(){showConfirm(t("se_rst"),function(){localStorage.removeItem("bmp5");location.reload();});};

