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
  // 💾 Make a backup: Drive (via the phone's share menu; a copy stays on the phone too) or phone only
  var driveStatusHTML='<p class="bk-p">Salvează toate datele aplicației într-un fișier. Alege unde:</p>'
    +'<div class="bk-btns"><button class="btn" onclick="driveShareJSON()">☁️ În Google Drive<small>+ o copie pe telefon</small></button>'
    +'<button class="btn gh" onclick="driveExportJSON()">📱 Doar pe telefon<small>în Descărcări</small></button></div>'
    +'<div class="hv-ts" style="margin-top:8px;">🕒 Ultimul backup: <b>'+driveLastExport+'</b></div>';
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
    hiveSnapHTML=seFoldHTML("snap","🏠 Auto-salvare per stup",D.hives.length+" stupi",
      '<p style="font-size:.78rem;color:var(--mut);margin:4px 0 10px;">Fiecare stup are propriul snapshot local, actualizat la fiecare salvare.</p>'+snapRows);
  }

  // Settings home = a short menu (like the phone's settings); each item opens its own page with ‹ Setări.
  var arcN=pastInsp2.length,mo=PGS.slice(0,3).map(function(p){return String(t(p.lk)||"").replace(/^[^A-Za-zĂÂÎȘȚ]+/,"");}).join(", ")+(PGS.length>3?"…":"");
  var SEC=[
    {id:"backup",ico:"☁️",t:"Backup și restaurare",s:"Ultimul backup: "+driveLastExport,h:''
    +'<div class="c" style="margin-bottom:14px;"><div class="ct">💾 1. Fă backup</div>'
    +driveStatusHTML
    +'</div>'
    +'<div class="c" style="margin-bottom:14px;"><div class="ct">📥 2. Restaurează un backup</div>'
    +'<p class="bk-p">Aduci înapoi datele dintr-un backup făcut mai devreme. Alege de unde iei fișierul:</p>'
    +'<div class="bk-btns"><button class="btn" onclick="impFrom(\'drive\')">☁️ Din Google Drive</button>'
    +'<button class="btn gh" onclick="impFrom(\'phone\')">📱 Din telefon</button></div>'
    +'<p style="font-size:.72rem;color:var(--mut);margin:10px 0 0;line-height:1.45;">📱 <b>Telefon:</b> fișierul e de obicei în <b>Descărcări</b> (Downloads).<br>☁️ <b>Drive:</b> în fereastra care se deschide apasă <b>☰</b> (sus, stânga) și alege <b>Drive</b>, apoi fișierul.<br>⚠️ Importul înlocuiește datele actuale din aplicație.</p></div>'},
    {id:"fisa",ico:"📋",t:"Fișa de observație",s:"PDF pe stup, pentru un an",h:fisaCardHTML()},
    {id:"arc",ico:"📁",t:"Arhivă inspecții",s:arcN+" inspecții din lunile trecute",h:'<div class="c"><p style="font-size:.8rem;color:var(--mut);margin:0 0 10px;">Toate inspecțiile din lunile anterioare, organizate pe lună și stup.</p>'+arcInnerHTML+'</div>'},
    {id:"menu",ico:"☰",t:"Ordinea meniului",s:mo,h:''
    +'<div class="c" style="margin-bottom:14px;"><div class="ct">'+t("mno_title")+'</div>'
    +'<p style="font-size:.78rem;color:var(--mut);margin:4px 0 10px;line-height:1.45;">'+t("mno_info")+'</p>'
    +'<div id="mnoList">'+menuOrderListHTML()+'</div>'
    +'<button class="btn sm gh" style="margin-top:10px;" onclick="mnoReset()">'+t("mno_reset")+'</button>'
    +'</div>'},
    {id:"alert",ico:"🔔",t:"Alerte inspecții",s:"Avertizare după "+th+" zile fără inspecție",h:''
    +'<div class="c" style="margin-bottom:14px;"><div class="ct">🔔 '+(isEN?"Inspection Alerts":"Alerte Inspecții")+'</div>'
    +'<p style="font-size:.8rem;color:var(--mut);margin:6px 0 10px;">'+(isEN?"Hives not inspected for more than this many days show a warning (default: 7).":"Stupi neverificați de mai mult decât atâtea zile afișează o avertizare (implicit: 7).")+'</p>'
    +'<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">'
    +'<span style="font-size:.82rem;font-weight:700;">'+(isEN?"Days without inspection → alert":"Zile fără inspecție → alertă")+'</span>'
    +'<input type="number" inputmode="numeric" min="1" max="90" value="'+th+'" style="width:70px;" oninput="D.settings.inspAlertThreshold=parseInt(this.value)||INSP_ALERT_DEFAULT;save(false);">'
    +'</div>'
    +'</div>'},
    {id:"disp",ico:"🎨",t:"Afișaj",s:D.settings.dark?"Mod întunecat":"Mod luminos",h:''
    +'<div class="c" style="margin-bottom:14px;"><div class="ct">'+t("se_display")+'</div>'
    +'<div class="ck" style="margin-top:8px;"><input type="checkbox" id="dkTg"'+(D.settings.dark?" checked":"")
    +' onchange="D.settings.dark=this.checked;applyTheme();save();"><label for="dkTg">'+t("se_dark")+'</label></div>'
    +'</div>'},
    {id:"wx",ico:"🌦️",t:"Vreme",s:D.weather?"Actualizată acum "+Math.round((Date.now()-D.weather.ts)/60000)+" min":"Fără date — pornește locația",h:''
    +'<div class="c" style="margin-bottom:14px;"><div class="ct">'+t("se_weather")+'</div>'
    +'<p style="font-size:.82rem;color:var(--mut);margin-bottom:8px;">'+t("se_w_info")
    +(D.weather&&D.weather.manual?" <span class='bg gy' style='font-size:.65rem;'>✍️ manual</span>":"")
    +'</p>'
    +(D.weather?'<div class="al alo">'+t("se_w_ok")+' '+Math.round((Date.now()-D.weather.ts)/60000)+' '+t("se_w_min")+(D.weather.manual?" (manual)":"")+'</div>'
    :'<div class="al alw">'+t("se_w_no")+'</div>')
    +'<div style="display:flex;gap:8px;margin-top:9px;flex-wrap:wrap;">'
    +'<button class="btn sm" onclick="if(navigator.onLine){if(D.userLoc)fetchW(D.userLoc.lat,D.userLoc.lon);else initLoc();}else{openManualWeather();}">'+(isEN?"Update weather":"Actualizează vreme")+'</button>'
    +'<button class="btn sm gh" onclick="openManualWeather()">✍️ '+(isEN?"Manual entry":"Introdu manual")+'</button>'
    +'</div></div>'},
    {id:"snap",ico:"🏠",t:"Auto-salvare per stup",s:D.hives.length+" stupi salvați local",h:(function(){_seOpen.snap=true;return hiveSnapHTML;})()}
  ];
  if(typeof demoCardHTML==="function"&&demoCardHTML())SEC.push({id:"demo",ico:"🧪",t:"Date de probă",s:"Doar în previzualizare",h:demoCardHTML()});
  var cur=SEC.filter(function(x){return x.id===_seSec;})[0];
  if(cur){
    setP('<div class="se-bar"><button class="se-back" onclick="seBack()" aria-label="Înapoi la Setări">‹</button>'
      +'<div class="se-bar-t"><span class="hv-ts">Setări</span><b>'+cur.ico+' '+cur.t+'</b></div></div>'
      +'<div class="se-title" style="display:none"></div><div class="se-page'+(cur.id==="backup"||cur.id==="arc"?'':' one')+'">'+cur.h+'</div>');   // one card → its own title is hidden (the page title says it)
  }else{
    _seSec=null;
    var grp=function(title,ids){return'<div class="se-grp-t">'+title+'</div><div class="c se-list">'+SEC.filter(function(x){return ids.indexOf(x.id)>=0;}).map(function(x){
      return'<div class="se-item" role="button" onclick="seOpen(\''+x.id+'\')"><span class="se-ico">'+x.ico+'</span>'
        +'<div class="se-it"><b>'+x.t+'</b><div class="hv-ts">'+x.s+'</div></div><span class="hv-arr">›</span></div>';}).join("")+'</div>';};
    setP('<h2 style="margin-bottom:12px;font-size:1.2rem;"><i class="fas fa-sliders" style="color:var(--gold)"></i> '+t("se_title")+'</h2>'
      +grp("Date",["backup","fisa","arc"])
      +grp("Aplicația",["menu","alert","disp","wx"])
      +grp("Altele",["snap","demo"]));
  }
  if(_seSec==="menu")mnoInitDrag();
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

// ── Collapsible Settings cards (archive, auto-save list): closed by default, tap the title to open ──
var _seOpen={};
var _seSec=null;   // open Settings page (null = the menu)
// open a Settings page; the phone's Back button (or ‹) returns to the menu
window.seOpen=function(id){
  _seSec=id;try{history.pushState({bm:"se"},"",location.href);}catch(e){}
  renderSettings();window.scrollTo(0,0);
};
window.seBack=function(){
  if(history.state&&history.state.bm==="se"){try{history.back();return;}catch(e){}}   // popstate (nav.js) shows the menu
  _seSec=null;renderSettings();window.scrollTo(0,0);
};
function seFoldHTML(key,title,badge,inner){
  var on=!!_seOpen[key];
  return'<div class="c se-fold" style="margin-bottom:14px;">'
    +'<div class="se-fold-h" role="button" onclick="seFold(\''+key+'\')"><span class="ct" style="margin:0;">'+title+'</span>'
    +'<span class="se-fold-r"><span class="bg gy">'+badge+'</span><span class="hv-arr" id="seFA_'+key+'">'+(on?"▲":"▼")+'</span></span></div>'
    +'<div id="seF_'+key+'" style="display:'+(on?"block":"none")+';margin-top:8px;">'+inner+'</div></div>';
}
window.seFold=function(key){
  _seOpen[key]=!_seOpen[key];
  var b=document.getElementById("seF_"+key),a=document.getElementById("seFA_"+key);
  if(b)b.style.display=_seOpen[key]?"block":"none";if(a)a.textContent=_seOpen[key]?"▲":"▼";
};
