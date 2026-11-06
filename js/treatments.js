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
    +L(t("tr_product"))+trProdPickHTML("tPr",xv(ex,"product",""))
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

// ═══════════════════════════════════════════
// 🧪 Product picker — phone friendly (the native <select> showed the long names cut off)
// A button with the chosen product opens a sheet: groups, big rows (emoji · name · how it is applied),
// a search box and „Alt produs” with its own text. The value lives in a hidden input (same id as before:
// tPr / iTrPlP), so saving, the voice inspection and old data work unchanged.
// ═══════════════════════════════════════════
function trProdParts(p){
  var m=/^(\S+)\s+(.*)$/.exec(p||""),ico=m&&!/[A-Za-z0-9]/.test(m[1])?m[1]:"",rest=ico?m[2]:(p||"");
  var i=rest.indexOf(" — ");
  return{ico:ico,name:i>=0?rest.slice(0,i):rest,det:i>=0?rest.slice(i+3):""};
}
function trProdIsOther(p){return /Alt produs|Other product/i.test(p||"");}
function trProdLabel(p){
  if(!p)return'<span class="tp-ph">'+L2("Alege produsul…","Pick the product…")+'</span>';
  var x=trProdParts(p);return(x.ico?'<i>'+x.ico+'</i>':'')+'<b>'+esc(x.name)+'</b>'+(x.det?'<small>'+esc(x.det)+'</small>':'');
}
// value = product text saved in the treatment; a product typed by hand is kept as it is
function trProdPickHTML(id,cur){
  var list=(t("tr_products")||[]),known=list.indexOf(cur)>=0,other=cur&&!known;
  return'<input type="hidden" id="'+id+'" value="'+esc(cur||"")+'">'
    +'<button type="button" class="tp-btn" id="'+id+'_b" onclick="trProdOpen(\''+id+'\')">'+trProdLabel(cur)+'<span class="hv-arr">›</span></button>'
    +'<input id="'+id+'_o" class="tp-other" style="display:'+(other||trProdIsOther(cur)?"block":"none")+';" value="'+esc(other?cur:"")+'" placeholder="'+L2("Numele produsului (ex. Apivar, Thymovar…)","Product name (e.g. Apivar, Thymovar…)")+'" oninput="trProdOther(\''+id+'\',this.value)">';
}
window.trProdSync=function(id){var h=$q(id),b=$q(id+"_b"),o=$q(id+"_o");if(!h||!b)return;
  b.innerHTML=trProdLabel(h.value)+'<span class="hv-arr">›</span>';
  if(o){var known=(t("tr_products")||[]).indexOf(h.value)>=0;o.style.display=trProdIsOther(h.value)||(h.value&&!known)?"block":"none";if(h.value&&!known)o.value=h.value;}
};
window.trProdSet=function(id,val){var h=$q(id);if(!h)return;h.value=val;trProdSync(id);if(typeof _mDirty!=="undefined")_mDirty=true;trProdClose();
  var o=$q(id+"_o");if(o&&trProdIsOther(val)){o.value="";setTimeout(function(){o.focus();},80);}};
window.trProdOther=function(id,v){var h=$q(id);if(!h)return;v=(v||"").trim();h.value=v||(t("tr_products")||[]).filter(trProdIsOther)[0]||"";var b=$q(id+"_b");if(b)b.innerHTML=trProdLabel(v?"📦 "+v:h.value)+'<span class="hv-arr">›</span>';if(typeof _mDirty!=="undefined")_mDirty=true;};
window.trProdOpen=function(id){
  trProdClose();var cur=($q(id)||{}).value||"",list=(t("tr_products")||[]),h="";
  list.forEach(function(p){
    if(p.indexOf("──")===0){h+='<div class="tp-g">'+esc(p.replace(/─/g,"").trim())+'</div>';return;}
    var x=trProdParts(p),on=p===cur;
    h+='<button type="button" class="tp-it'+(on?" on":"")+'" data-s="'+esc((x.name+" "+x.det).toLowerCase())+'" onclick="trProdSet(\''+id+'\',this.getAttribute(\'data-v\'))" data-v="'+esc(p)+'">'
      +'<i>'+(x.ico||"🧪")+'</i><span><b>'+esc(x.name)+'</b>'+(x.det?'<small>'+esc(x.det)+'</small>':'')+'</span>'+(on?'<em>✓</em>':'')+'</button>';
  });
  var sh=document.createElement("div");sh.id="tpSheet";sh.className="tp-wrap";
  sh.innerHTML='<div class="tp-bg" onclick="trProdClose()"></div><div class="tp-sh" role="dialog">'
    +'<div class="tp-h"><b>'+t("tr_product")+'</b><button type="button" class="mb-x" onclick="trProdClose()" aria-label="Închide">✕</button></div>'
    +'<input id="tpQ" class="tp-q" placeholder="🔍 '+L2("Caută (ex. oxalic, benzi, formic)","Search (e.g. oxalic, strips, formic)")+'" oninput="trProdFilter(this.value)">'
    +'<div class="tp-list">'+h+'</div></div>';
  (document.getElementById("MB")||document.body).appendChild(sh);
  requestAnimationFrame(function(){sh.classList.add("in");var on=sh.querySelector(".tp-it.on");if(on)on.scrollIntoView({block:"center"});});
};
window.trProdFilter=function(q){
  q=(q||"").toLowerCase().trim();var sh=$q("tpSheet");if(!sh)return;
  [].forEach.call(sh.querySelectorAll(".tp-it"),function(b){b.style.display=!q||b.getAttribute("data-s").indexOf(q)>=0?"":"none";});
  [].forEach.call(sh.querySelectorAll(".tp-g"),function(g){var n=g.nextElementSibling,any=false;while(n&&!n.classList.contains("tp-g")){if(n.style.display!=="none")any=true;n=n.nextElementSibling;}g.style.display=any?"":"none";});
};
window.trProdClose=function(){var sh=$q("tpSheet");if(sh)sh.parentNode.removeChild(sh);};
