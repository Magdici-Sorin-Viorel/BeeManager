// BeeManager Pro — honey.js
// Honey harvest

// ═══════════════════════════════════════════
// HONEY
// ═══════════════════════════════════════════
function renderHoney(){
  var byT={};
  D.honeyHarvests.forEach(function(h){var tp=h.honeyType||h.type||"?";if(!byT[tp])byT[tp]={e:0,a:0};byT[tp].e+=(h.estQty||0);byT[tp].a+=(h.actualQty||h.qty||0);});
  var reconRows=Object.keys(byT).map(function(tp){var d=byT[tp],df=d.a-d.e,ef=d.e>0?((d.a/d.e)*100).toFixed(0):"—";return'<tr><td><strong>'+tp+'</strong></td><td>'+d.e.toFixed(1)+' kg</td><td><strong>'+d.a.toFixed(1)+' kg</strong></td><td style="color:'+(df>=0?"var(--ok)":"var(--danger)")+'">'+(df>=0?"+":"")+df.toFixed(1)+' kg</td><td><span class="bg '+(parseInt(ef)>=85?"gg":parseInt(ef)>=65?"gy":"gr")+'">'+ef+'%</span></td></tr>';}).join("");
  var recon=Object.keys(byT).length?'<div class="c" style="margin-bottom:16px;"><div class="ct">'+t("hn_recon")+'</div><div style="overflow-x:auto;"><table class="rt"><thead><tr><th>'+t("hn_rc_t")+'</th><th>'+t("hn_rc_e")+'</th><th>'+t("hn_rc_r")+'</th><th>'+t("hn_rc_d")+'</th><th>'+t("hn_rc_ef")+'</th></tr></thead><tbody>'+reconRows+'</tbody></table></div><div style="font-size:.68rem;color:var(--mut);margin-top:5px;">'+t("hn_rc_note")+'</div></div>':"";
  var cards=D.honeyHarvests.map(function(h){
    var hv=D.hives.find(function(hive){return hive.id===h.hiveId;});
    var df=h.actualQty&&h.estQty?h.actualQty-h.estQty:null;
    return'<div class="c"><h3 style="font-size:.92rem;margin-bottom:6px;">🍯 '+(h.honeyType||h.type||"")+'</h3>'
      +'<div style="font-size:.78rem;">🏠 '+(hv?hv.name:h.hiveId||"—")+' · 📅 '+(h.extractionDate||h.date||"")+'</div>'
      +(h.estQty?'<div style="font-size:.78rem;">'+t("hn_rc_e")+': <strong>'+h.estQty.toFixed(1)+' kg</strong></div>':"")
      +'<div style="font-size:.78rem;">⚖️ '+t("hn_rc_r")+': <strong>'+((h.actualQty||h.qty||0)).toFixed(1)+' kg</strong>'+((!h.actualQty)?'<span class="bg gy" style="margin-left:6px;">'+t("hn_pend")+'</span>':"")+'</div>'
      +(df!==null?'<div style="font-size:.78rem;color:'+(df>=0?"var(--ok)":"var(--danger)")+'">'+(df>=0?"+":"")+df.toFixed(1)+' kg '+t("hn_vs")+'</div>':"")
      +'<div style="font-size:.78rem;">💧 '+(h.humidity||"—")+'% · ⭐ '+(h.quality||"—")+'</div>'
      +(h.notes?'<div style="font-size:.72rem;color:var(--mut);margin-top:3px;font-style:italic">'+h.notes+'</div>':"")
      +'<div class="br"><button class="btn sm be" onclick="honeyM(\''+h.id+'\')">✏️</button><button class="btn sm bd" onclick="delHn(\''+h.id+'\')">🗑️</button></div>'
      +'</div>';
  }).join("");
  setP('<h2 style="margin-bottom:12px;font-size:1.2rem;"><i class="fas fa-droplet" style="color:var(--gold)"></i> '+t("hn_title")+'</h2>'
    +'<button class="btn" style="margin-bottom:14px;" onclick="honeyM()">'+t("hn_new")+'</button>'
    +recon
    +(D.honeyHarvests.length===0?'<div class="al ali">'+t("hn_no")+'</div>':'<div class="g gc">'+cards+'</div>'));
}
window.delHn=function(id){showConfirm(t("hn_del_c"),function(){D.honeyHarvests=D.honeyHarvests.filter(function(h){return h.id!==id;});save();renderHoney();});};

function honeyM(id){
  var ex=id?D.honeyHarvests.find(function(h){return h.id===id;}):null;
  var htypes=t("honey_types"),quals=t("quality_opts"),fwl=t("fw_labels")||{};
  openM('<div class="mt">'+(ex?t("hn_edit_t"):t("hn_new_t"))+'</div>'
    +'<div class="r2"><div>'+L(t("hn_hive"))+'<select id="hHv"><option value="">'+t("hn_no_hive")+'</option>'+D.hives.map(function(h){return'<option value="'+h.id+'"'+(xv(ex,"hiveId","")=== h.id?" selected":"")+'>'+h.name+'</option>';}).join("")+'</select></div>'
    +'<div>'+L(t("hn_type"))+'<select id="hTp">'+htypes.map(function(tp){return'<option'+(xv(ex,"honeyType",xv(ex,"type",""))=== tp?" selected":"")+'>'+tp+'</option>';}).join("")+'</select></div></div>'
    +L(t("hn_date"))+'<input type="date" id="hDt" value="'+(xv(ex,"extractionDate",xv(ex,"date",todayISO())))+'">'
    +'<div class="dv"><div class="stt">'+t("hn_est_t")+'</div></div>'
    +'<div class="est"><div style="font-size:.76rem;color:var(--mut);margin-bottom:8px;">'+t("hn_est_h")+'</div>'
    +'<div id="fgL">'
    +(function(){
      var fwl=t("fw_labels")||{};
      var fwKeys=Object.keys(FW);
      // If editing and frames were saved, reload them; otherwise show 2 empty rows
      var savedFrames=ex&&ex.frames&&ex.frames.length?ex.frames:null;
      if(savedFrames){
        return savedFrames.map(function(fr){
          var selOpts=fwKeys.map(function(k){return'<option value="'+k+'"'+(fr.typ===k?" selected":"")+'>'+((fwl[k])||k)+'</option>';}).join("");
          var sub=(fr.cnt||0)*(FW[fr.typ]||2);
          return'<div class="er"><input type="number" inputmode="numeric" class="fgC" placeholder="nr" value="'+(fr.cnt||0)+'" min="0" oninput="recE()"><select class="fgT" onchange="recE()" style="margin:0;">'+selOpts+'</select><span class="esb">≈ '+sub.toFixed(1)+' kg</span></div>';
        }).join("");
      } else {
        var d0=fwKeys.map(function(k){return'<option value="'+k+'">'+((fwl[k])||k)+'</option>';}).join("");
        var d1=fwKeys.map(function(k,i){return'<option value="'+k+'"'+(i===1?" selected":"")+'>'+((fwl[k])||k)+'</option>';}).join("");
        return'<div class="er"><input type="number" inputmode="numeric" class="fgC" placeholder="nr" value="0" min="0" oninput="recE()"><select class="fgT" onchange="recE()" style="margin:0;">'+d0+'</select><span class="esb">≈ 0 kg</span></div>'
          +'<div class="er"><input type="number" inputmode="numeric" class="fgC" placeholder="nr" value="0" min="0" oninput="recE()"><select class="fgT" onchange="recE()" style="margin:0;">'+d1+'</select><span class="esb">≈ 0 kg</span></div>';
      }
    })()
    +'</div>'
    +'<button class="btn sm gh" type="button" onclick="addFR()" style="margin-top:5px;">'+t("hn_add_fr")+'</button>'
    +'<div class="etot" id="eT">'+t("hn_est_pfx")+' <strong>'+(ex&&ex.estQty?ex.estQty.toFixed(1):"0.0")+' kg</strong></div>'
    +'<div style="font-size:.66rem;color:var(--mut);margin-top:3px;">'+t("hn_fw_note")+'</div></div>'
    +'<div class="dv"><div class="stt">'+t("hn_real_t")+'</div></div>'
    +'<div class="r2"><div>'+L(t("hn_actual"))+'<input id="hAq" type="number" inputmode="numeric" step="0.1" value="'+(xv(ex,"actualQty",xv(ex,"qty","")))+'" placeholder="'+t("hn_actual_ph")+'"><span class="hint">'+t("hn_actual_h")+'</span></div>'
    +'<div>'+L(t("hn_hum"))+'<input id="hHm" type="number" inputmode="numeric" step="0.1" value="'+(esc(xv(ex,"humidity",17.5)))+'"></div></div>'
    +L(t("hn_qual"))+'<select id="hQl">'+quals.map(function(o){return'<option'+(xv(ex,"quality","")=== o?" selected":"")+'>'+o+'</option>';}).join("")+'</select>'
    +L(t("hn_notes"))+'<textarea id="hNt" rows="2">'+(esc(xv(ex,"notes","")))+'</textarea>'
    +'<div class="br" style="margin-top:14px;"><button class="btn" onclick="saveHn(\''+(id||"")+'\')">'+btnS()+'</button><button class="btn gh" onclick="closeM()">'+btnC()+'</button></div>');
  if(ex)setTimeout(recE,60);
}
window.recE=function(){
  var tot=0;
  document.querySelectorAll("#MB .er").forEach(function(row){
    var cnt=parseInt((row.querySelector(".fgC")||{}).value)||0;
    var typ=(row.querySelector(".fgT")||{}).value||"Alt tip";
    var w=FW[typ]||2;var sub=cnt*w;tot+=sub;
    var sw=row.querySelector(".esb");if(sw)sw.textContent="≈ "+sub.toFixed(1)+" kg";
  });
  var el=document.getElementById("eT");if(el)el.innerHTML=t("hn_est_pfx")+" <strong>"+tot.toFixed(1)+" kg</strong>";
  return tot;
};
window.addFR=function(){
  var fwl=t("fw_labels")||{};
  var d=document.createElement("div");d.className="er";
  d.innerHTML='<input type="number" inputmode="numeric" class="fgC" placeholder="nr" value="0" min="0" oninput="recE()" style="margin:0;width:70px;flex-shrink:0;"><select class="fgT" onchange="recE()" style="margin:0;flex:1;">'+Object.keys(FW).map(function(k){return'<option value="'+k+'">'+((fwl[k])||k)+'</option>';}).join("")+'</select><span class="esb">≈ 0 kg</span><button type="button" class="btn sm bd" onclick="this.parentNode.remove();recE()" style="padding:4px 8px;">✕</button>';
  var list=document.getElementById("fgL");if(list)list.appendChild(d);
};
window.saveHn=function(id){
  // Collect frames data before recE() clears anything
  var frames=[];
  document.querySelectorAll("#MB .er").forEach(function(row){
    var cnt=parseInt((row.querySelector(".fgC")||{}).value)||0;
    var typ=(row.querySelector(".fgT")||{}).value||"";
    if(typ)frames.push({cnt:cnt,typ:typ});
  });
  var est=recE(),aqRaw=($q("hAq")||{}).value,aq=aqRaw?parseFloat(aqRaw):null;
  var o={id:id||uid(),hiveId:($q("hHv")||{}).value||null,honeyType:($q("hTp")||{}).value,type:($q("hTp")||{}).value,extractionDate:($q("hDt")||{}).value,estQty:parseFloat(est.toFixed(2)),actualQty:aq,qty:aq||est,humidity:parseFloat(($q("hHm")||{}).value)||null,quality:($q("hQl")||{}).value,notes:($q("hNt")||{}).value,frames:frames};
  if(id){var ex=D.honeyHarvests.find(function(h){return h.id===id;});if(ex)Object.assign(ex,o);}else{D.honeyHarvests.push(o);}
  save();closeM();renderHoney();toast(id?t("hn_upd"):t("hn_saved"),"🍯");
};
