// BeeManager Pro — treatments.js
// Treatments

// ═══════════════════════════════════════════
// TREATMENTS
// ═══════════════════════════════════════════
// The „Tratamente” page is in treatvarroa.js (renderTreatments)
window.delTr=function(id){showConfirm(t("tr_del_c"),function(){
  D.treatments=D.treatments.filter(function(t2){return t2.id!==id;});
  // counts are kept but no longer linked to the deleted treatment
  (D.varroa||[]).forEach(function(v){if(v.treatmentId===id)v.treatmentId=null;});
  save();render();
});};
function treatM(id){
  var ex=id?D.treatments.find(function(t2){return t2.id===id;}):null;
  var prods=(t("tr_products")||[]).slice();
  // Treatment saved with a product no longer in the list (e.g. from the old list):
  // keep it as an option so editing doesn't change it by mistake
  if(ex&&ex.product&&prods.indexOf(ex.product)<0)prods.unshift(ex.product);
  openM('<div class="mt">'+(ex?t("tr_edit_t"):t("tr_new_t"))+'</div>'
    +L(t("tr_product"))+'<select id="tPr">'+prods.map(function(p){var isSep=p.startsWith("──");return'<option'+(isSep?' disabled style="color:var(--gold);font-weight:700;font-size:.8rem;"':'')+((xv(ex,"product","")=== p&&!isSep)?" selected":"")+'>'+p+'</option>';}).join("")+'</select>'
    +L(L2("🎯 Scop","🎯 Purpose"))+'<select id="tTg">'
    +'<option value="varroa"'+(!ex||trIsVarroa(ex)?" selected":"")+'>🕷️ Varroa</option>'
    +'<option value="other"'+(ex&&!trIsVarroa(ex)?" selected":"")+'>🩺 '+L2("Alt scop (ex. nosemoză, locă)","Other (e.g. nosema, foulbrood)")+'</option></select>'
    +L(t("tr_hive"))+'<select id="tHv"><option value="">'+t("tr_all_h")+'</option>'+D.hives.map(function(h){return'<option value="'+h.id+'"'+(xv(ex,"hiveId","")=== h.id?" selected":"")+'>'+h.name+'</option>';}).join("")+'</select>'
    +'<div class="r2"><div>'+L(t("tr_date"))+'<input type="date" id="tDt" value="'+(xv(ex,"date",todayISO()))+'"></div>'
    +'<div>'+L(t("tr_end"))+'<input type="date" id="tEnd" value="'+esc(xv(ex,"endDate",""))+'"><span class="hint">'+t("tr_end_h")+'</span></div></div>'
    +L(t("tr_dose"))+'<input id="tDs" value="'+(esc(xv(ex,"dosage","")))+'" placeholder="'+t("tr_dose_ph")+'">'
    +'<div class="al ali" style="font-size:.76rem;padding:6px 10px;margin:8px 0;">'
    +'💡 '+L2("La tratamentele pentru varroa, numără acarieni căzuți pe placă (din 🔍 Inspecție sau ➕ Numărătoare). O numărătoare înainte și una după tratament arată cât de eficient a fost.","For varroa treatments, count the mites fallen on the board (from 🔍 Inspect or ➕ Count). One count before and one after the treatment shows how effective it was.")
    +'</div>'
    +(ex&&(ex.done||(ex.doneHives&&Object.keys(ex.doneHives).length))?'<div class="al ali" style="font-size:.76rem;margin:8px 0;">✅ '+L2("Încheiat","Finished")+': '
      +(ex.done?L2("toți stupii","all hives")+' · '+ex.done:Object.keys(ex.doneHives).map(function(hid){var hv=D.hives.find(function(h){return h.id===hid;});return esc(hv?hv.name:"?")+' · '+ex.doneHives[hid];}).join(", "))
      +'<div class="ck" style="margin-top:6px;"><input type="checkbox" id="tReopen"><label for="tReopen">↩️ '+L2("Anulează încheierea (tratamentul redevine în curs)","Undo finishing (treatment becomes active again)")+'</label></div></div>':'')
    +L(t("tr_notes"))+'<textarea id="tNt" rows="2">'+(esc(xv(ex,"notes","")))+'</textarea>'
    +'<div class="br" style="margin-top:14px;"><button class="btn" onclick="saveTr(\''+(id||'')+'\')">'+btnS()+'</button><button class="btn gh" onclick="closeM()">'+btnC()+'</button></div>');
}
window.saveTr=function(id){
  var o={id:id||uid(),target:($q("tTg")||{}).value||"varroa",product:($q("tPr")||{}).value,hiveId:($q("tHv")||{}).value||null,date:($q("tDt")||{}).value,endDate:($q("tEnd")||{}).value||"",dosage:($q("tDs")||{}).value,notes:($q("tNt")||{}).value};
  if(o.endDate&&o.date&&o.endDate<o.date){toast("⚠️ "+t("tr_end_err"));var e=$q("tEnd");if(e){e.classList.add("err");setTimeout(function(){e.classList.remove("err");},2500);}return;}
  if(id){var ex=D.treatments.find(function(t2){return t2.id===id;});if(ex){Object.assign(ex,o);if($q("tReopen")&&$q("tReopen").checked){delete ex.done;delete ex.doneHives;}}}else{D.treatments.push(o);}
  save(false);closeM();render();toast(id?t("tr_upd"):t("tr_saved"),"💊");
};

// Helper: equipment items where 1 unit is sufficient (no warning when qty===min===1)
var EQUIP_SINGLE=["Mască apicol","Mănuși apicole","Combinezon","Fumigător mic","Fumigător mare",
  "Daltă apicol","Perie albine",
  "Beekeeping Veil","Beekeeping Gloves","Beekeeping Suit","Small Smoker","Large Smoker",
  "Hive Tool","Bee Brush"];
function isLowStock(i){
  // For individual equipment: warning only if qty < min (not when equal)
  if(EQUIP_SINGLE.some(function(n){return i.name&&i.name.toLowerCase()===n.toLowerCase();})){
    return i.qty<i.min;
  }
  return i.qty<=i.min;
}
