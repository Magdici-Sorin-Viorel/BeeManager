// BeeManager Pro — queens.js
// Queens

// ═══════════════════════════════════════════
// QUEENS
// ═══════════════════════════════════════════
function renderQueens(){
  var cards=D.queens.map(function(q){
    var hv=D.hives.find(function(h){return h.id===q.hive;});
    var oh=D.hives.find(function(h){return h.id===q.origHive;});
    var sc=((q.lay||3)+(6-(q.aggr||3)))/2;
    var qSts=t("q_statuses")||[];var stEntry=qSts.find(function(s){return s[0]===q.status;});
    var stLbl=stEntry?stEntry[1]:q.status;
    var stCls=(t("qs_cls")||{})[q.status]||"gy";
    return'<div class="c">'
      +'<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:7px;"><h3 style="font-size:.92rem;">👑 '+q.race+'</h3><span class="bg '+stCls+'">'+stLbl+'</span></div>'
      +'<div style="font-size:.8rem;">🏠 <strong>'+(hv?hv.name:"—")+'</strong></div>'
      +'<div style="font-size:.8rem;">📅 '+q.yr+' · '+q.orig+(oh?" (→ "+oh.name+")":'')+'</div>'
      +'<div style="font-size:.8rem;">⭐ '+t("q_lay").split("(")[0].trim()+': '+q.lay+'/5 · 😠 '+t("q_aggr").split("(")[0].trim()+': '+q.aggr+'/5 · '+t("q_score")+' <strong>'+sc.toFixed(1)+'/5.5</strong></div>'
      +(q.line?'<div style="font-size:.75rem;color:var(--mut)">🧬 '+q.line+'</div>':"")
      +'<div class="br"><button class="btn sm be" onclick="queenM(\''+q.id+'\')">✏️</button><button class="btn sm bd" onclick="delQ(\''+q.id+'\')">🗑️</button></div>'
      +'</div>';
  }).join("");
  setP('<h2 style="margin-bottom:12px;font-size:1.2rem;"><i class="fas fa-crown" style="color:var(--gold)"></i> '+t("q_title")+'</h2>'
    +'<button class="btn" style="margin-bottom:14px;" onclick="queenM()">'+t("q_new")+'</button>'
    +(D.queens.length===0?'<div class="al ali">'+t("q_no")+'</div>':'<div class="g gc">'+cards+'</div>'));
}
window.delQ=function(id){showConfirm(t("q_del_c"),function(){D.queens=D.queens.filter(function(q){return q.id!==id;});save();renderQueens();});};

function queenM(id){
  var q=id?D.queens.find(function(x){return x.id===id;}):null;
  var races=t("queen_races"),qSts=t("q_statuses"),qOrigs=t("q_origins");
  openM('<div class="mt">'+(q?t("q_edit_t"):t("q_new_t"))+'</div>'
    +L(t("q_hive"))+'<select id="qH">'+D.hives.map(function(h){return'<option value="'+h.id+'"'+(xv(q,"hive","")=== h.id?" selected":"")+'>'+h.name+'</option>';}).join("")+'</select>'
    +'<div class="r2"><div>'+L(t("q_year"))+'<input id="qY" type="number" inputmode="numeric" value="'+(xv(q,"yr",new Date().getFullYear()))+'"></div>'
    +'<div>'+L(t("q_race"))+'<select id="qR">'+races.map(function(r){return'<option'+(xv(q,"race","")=== r?" selected":"")+'>'+r+'</option>';}).join("")+'</select></div></div>'
    +'<div class="r2"><div>'+L(t("q_lay"))+'<input id="qLy" type="number" inputmode="numeric" min="1" max="5" value="'+(esc(xv(q,"lay",4)))+'"><span class="hint">'+t("q_lay_h")+'</span></div>'
    +'<div>'+L(t("q_aggr"))+'<input id="qAg" type="number" inputmode="numeric" min="1" max="5" value="'+(esc(xv(q,"aggr",2)))+'"><span class="hint">'+t("q_aggr_h")+'</span></div></div>'
    +L(t("q_origin"))+'<select id="qOr">'+qOrigs.map(function(o){return'<option'+(xv(q,"orig","")=== o?" selected":"")+'>'+o+'</option>';}).join("")+'</select>'
    +L(t("q_orig_h"))+'<select id="qOH"><option value="">'+t("q_orig_none")+'</option>'+D.hives.map(function(h){return'<option value="'+h.id+'"'+(xv(q,"origHive","")===h.id?" selected":"")+'>'+h.name+'</option>';}).join("")+'</select>'
    +L(t("q_line"))+'<input id="qLn" value="'+(esc(xv(q,"line","")))+'" placeholder="'+t("q_line_ph")+'">'
    +L(t("q_status"))+'<select id="qSt">'+qSts.map(function(s){return'<option value="'+s[0]+'"'+(xv(q,"status","activă")=== s[0]?" selected":"")+'>'+s[1]+'</option>';}).join("")+'</select>'
    +'<div class="br" style="margin-top:14px;"><button class="btn" onclick="saveQ(\''+(id||"")+'\')">'+btnS()+'</button><button class="btn gh" onclick="closeM()">'+btnC()+'</button></div>');
}
window.saveQ=function(id){
  var o={id:id||uid(),hive:($q("qH")||{}).value,yr:parseInt(($q("qY")||{}).value),race:($q("qR")||{}).value,lay:parseInt(($q("qLy")||{}).value),aggr:parseInt(($q("qAg")||{}).value),orig:($q("qOr")||{}).value,origHive:($q("qOH")||{}).value||null,line:($q("qLn")||{}).value,status:($q("qSt")||{}).value};
  if(id){var ex=D.queens.find(function(q){return q.id===id;});if(ex)Object.assign(ex,o);}else{D.queens.push(o);}
  save();closeM();renderQueens();
};
