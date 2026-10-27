// BeeManager Pro — inventory.js
// Inventory

// ═══════════════════════════════════════════
// INVENTORY
// ═══════════════════════════════════════════
function renderInventory(){
  var low=D.inventory.filter(function(i){return isLowStock(i);});
  var byCat={};D.inventory.forEach(function(i){if(!byCat[i.cat])byCat[i.cat]=[];byCat[i.cat].push(i);});
  var catHTML=Object.keys(byCat).map(function(cat){
    var items=byCat[cat].map(function(i){var lw=isLowStock(i);
      return'<div class="c" style="'+(lw?"border-color:var(--danger)":"")+'">'
        +'<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:5px;margin-bottom:5px;"><h3 style="font-size:.85rem;">'+i.name+'</h3>'+(lw?'<span class="bg gr">⚠️</span>':"")+'</div>'
        +'<div style="font-size:1.8rem;font-weight:800;color:'+(lw?"var(--danger)":"var(--gold)")+'">'+i.qty+'</div>'
        +'<div style="font-size:.73rem;color:var(--mut)">'+t("inv_units")+' · '+t("inv_min_d")+' '+i.min+'</div>'
        +'<div class="br"><button class="btn sm bd" onclick="chI(\''+i.id+'\',-1)">−1</button><button class="btn sm" onclick="chI(\''+i.id+'\',1)">+1</button><button class="btn sm be" onclick="invM(\''+i.id+'\')">✏️</button><button class="btn sm bd" onclick="delI(\''+i.id+'\')">🗑️</button></div>'
        +'</div>';
    }).join("");
    return'<div style="margin-bottom:18px;"><h3 style="color:var(--gold);font-size:.82rem;margin-bottom:9px;text-transform:uppercase;letter-spacing:.5px;">📂 '+cat+'</h3><div class="g gc">'+items+'</div></div>';
  }).join("");
  setP('<h2 style="margin-bottom:12px;font-size:1.2rem;"><i class="fas fa-boxes-stacked" style="color:var(--gold)"></i> '+t("inv_title")+'</h2>'
    +'<button class="btn" style="margin-bottom:12px;" onclick="invM()">'+t("inv_new")+'</button>'
    +(low.length?'<div class="sa"><strong>'+t("inv_low")+' — '+low.length+'</strong>'+low.map(function(i){return'<div style="margin-top:2px;font-size:.8rem;">📦 <strong>'+i.name+'</strong>: '+i.qty+' '+t("inv_units")+' ('+t("inv_min_d")+' '+i.min+')</div>';}).join("")+'</div>':"")
    +(Object.keys(byCat).length===0?'<div class="al ali">'+t("inv_no")+'</div>':catHTML));
}
window.chI=function(id,d){var i=D.inventory.find(function(x){return x.id===id;});if(!i)return;i.qty=Math.max(0,i.qty+d);save(false);renderInventory();};
window.delI=function(id){showConfirm(t("inv_del_c"),function(){D.inventory=D.inventory.filter(function(i){return i.id!==id;});save();renderInventory();});};
function invM(id){
  var ex=id?D.inventory.find(function(i){return i.id===id;}):null;
  var ic=t("icat")||{};var allIt=Object.values(ic).reduce(function(a,b){return a.concat(b);},[]);
  var isPkg=ex&&(ex.cat==="Ambalaje"||ex.cat==="Packaging");
  var catOnChange="invCatChanged(this.value)";
  var selectOnChange="var v=this.value;document.getElementById('iMN').value=v;var ct=getCt(v)||document.getElementById('iCt').value;document.getElementById('iCt').value=ct;invCatChanged(ct);";
  openM('<div class="mt">'+(ex?t("inv_edit_t"):t("inv_new_t"))+'</div>'
    +L(t("inv_sel"))+'<select id="iSN" onchange="'+selectOnChange+'"><option value="">'+t("inv_sel_ph")+'</option>'+allIt.map(function(n){return'<option value="'+n+'"'+(xv(ex,"name","")=== n?" selected":"")+'>'+n+'</option>';}).join("")+'</select>'
    +L(t("inv_man"))+'<input id="iMN" value="'+(esc(xv(ex,"name","")))+'" placeholder="'+t("inv_man_ph")+'">'
    +L(t("inv_cat"))+'<select id="iCt" onchange="'+catOnChange+'">'+Object.keys(ic).map(function(c){return'<option'+(xv(ex,"cat","")=== c?" selected":"")+'>'+c+'</option>';}).join("")+'</select>'
    +'<div class="r2"><div>'+L(t("inv_qty"))+'<input id="iQt" type="number" inputmode="numeric" value="'+(esc(xv(ex,"qty",0)))+'"></div>'
    +'<div>'+L(t("inv_min"))+'<input id="iMn" type="number" inputmode="numeric" value="'+(esc(xv(ex,"min",5)))+'"></div></div>'
    +'<div id="invPkgBox" style="'+(isPkg?"":"display:none;")+'">'
    +L(t("inv_pkg_honey_kg"))+'<input id="iHkg" type="number" inputmode="decimal" step="0.001" value="'+(esc(xv(ex,"honeyKg","")))+'" placeholder="ex: 0.950">'
    +'<div style="font-size:.73rem;color:var(--mut);margin-top:-4px;margin-bottom:6px;">'+t("inv_pkg_hint")+'</div>'
    +'</div>'
    +'<div class="br" style="margin-top:14px;"><button class="btn" onclick="saveI(\''+(id||'')+'\')">'+btnS()+'</button><button class="btn gh" onclick="closeM()">'+btnC()+'</button></div>');
}
window.invCatChanged=function(cat){
  var box=document.getElementById("invPkgBox");
  if(box)box.style.display=(cat==="Ambalaje"||cat==="Packaging")?"":"none";
};
window.getCt=function(n){var ic=t("icat")||{};var cats=Object.keys(ic);for(var i=0;i<cats.length;i++){if(ic[cats[i]].indexOf(n)>=0)return cats[i];}return null;};
window.saveI=function(id){
  var nm=(($q("iMN")||{}).value||($q("iSN")||{}).value||"").trim();
  if(!nm){toast("⚠️ "+t("inv_name_r"));return;}
  var cat=($q("iCt")||{}).value;
  var hkgVal=parseFloat(($q("iHkg")||{}).value)||null;
  var o={id:id||uid(),name:nm,cat:cat,qty:parseInt(($q("iQt")||{}).value)||0,min:parseInt(($q("iMn")||{}).value)||5};
  if(cat==="Ambalaje"||cat==="Packaging")o.honeyKg=hkgVal;
  if(id){var ex=D.inventory.find(function(i){return i.id===id;});if(ex)Object.assign(ex,o);}else{D.inventory.push(o);}
  save();closeM();renderInventory();
};
