// BeeManager Pro — tasks.js
// Tasks

// ═══════════════════════════════════════════
// TASKS — Tasks & Reminders
// ═══════════════════════════════════════════

var _tkTab="pending";

function renderSarcini(){
  var isEN=D.settings.lang==="en";
  var tasks=D.tasks||[];
  var todayStr=todayISO();
  var prioCols={high:"var(--danger)",medium:"var(--gold)",low:"var(--ok)"};
  var prioLabels={high:t("tk_prio")[0],medium:t("tk_prio")[1],low:t("tk_prio")[2]};

  // Filter tasks per active tab
  var tabTasks;
  if(_tkTab==="pending") tabTasks=tasks.filter(function(tk){return !tk.done;});
  else if(_tkTab==="today") tabTasks=tasks.filter(function(tk){return !tk.done&&tk.dueDate===todayStr;});
  else if(_tkTab==="overdue") tabTasks=tasks.filter(function(tk){return !tk.done&&tk.dueDate&&tk.dueDate<todayStr;});
  else tabTasks=tasks.filter(function(tk){return tk.done;});

  // Sort: overdue first, then by date, then by priority weight
  var prioW={high:0,medium:1,low:2};
  tabTasks=tabTasks.slice().sort(function(a,b){
    var aOvd=a.dueDate&&a.dueDate<todayStr?0:1;
    var bOvd=b.dueDate&&b.dueDate<todayStr?0:1;
    if(aOvd!==bOvd)return aOvd-bOvd;
    if(a.dueDate&&b.dueDate&&a.dueDate!==b.dueDate)return a.dueDate>b.dueDate?1:-1;
    return (prioW[a.priority]||1)-(prioW[b.priority]||1);
  });

  // Stats
  var nPending=tasks.filter(function(tk){return !tk.done;}).length;
  var nOverdue=tasks.filter(function(tk){return !tk.done&&tk.dueDate&&tk.dueDate<todayStr;}).length;
  var nToday=tasks.filter(function(tk){return !tk.done&&tk.dueDate===todayStr;}).length;
  var nDone=tasks.filter(function(tk){return tk.done;}).length;

  // Tabs
  var tabs='<div style="display:flex;gap:6px;margin:12px 0 14px;flex-wrap:wrap;">'
    +[["pending",t("tk_tab_pending")+" ("+nPending+")"],
      ["today",t("tk_tab_today")+(nToday?" ("+nToday+")":"")],
      ["overdue",t("tk_tab_overdue")+(nOverdue?" ("+nOverdue+")":"")],
      ["done",t("tk_tab_done")+" ("+nDone+")"]
    ].map(function(tb){
      var extra="";
      if(tb[0]==="overdue"&&nOverdue>0)extra=' style="background:var(--danger);border-color:var(--danger);"';
      return'<button class="btn sm'+(tb[0]===_tkTab?"":" gh")+'"'+extra+' onclick="_tkTab=\''+tb[0]+'\';renderSarcini();">'+tb[1]+'</button>';
    }).join("")+'</div>';

  // Task list
  var listH=tabTasks.length?tabTasks.map(function(tk){
    var hv=D.hives.find(function(h){return h.id===tk.hiveId;});
    var isOvd=!tk.done&&tk.dueDate&&tk.dueDate<todayStr;
    var isTdy=!tk.done&&tk.dueDate===todayStr;
    var isTmr=!tk.done&&tk.dueDate===new Date(Date.now()+86400000).toISOString().slice(0,10);
    var dueLbl=tk.done?(tk.doneDate?'✅ '+tk.doneDate:"✅")
      :isOvd?('<span style="color:var(--danger);font-weight:700;">⏰ '+t("tk_overdue")+' ('+tk.dueDate+')</span>')
      :isTdy?('<span style="color:var(--gold);font-weight:700;">📅 '+t("tk_today")+'</span>')
      :isTmr?('<span style="color:var(--gold);">🌅 '+t("tk_tomorrow")+'</span>')
      :(tk.dueDate?'📅 '+tk.dueDate:"");
    var col=tk.done?"var(--mut)":(prioCols[tk.priority]||"var(--mut)");
    return'<div class="c" style="padding:11px 14px;margin-bottom:8px;border-left:3px solid '+col+(tk.done?';opacity:.65':"")+';">'
      +'<div style="display:flex;align-items:flex-start;gap:10px;">'
      +'<div style="flex:1;min-width:0;">'
      +'<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px;flex-wrap:wrap;">'
      +'<span style="font-size:.9rem;font-weight:600;color:var(--txt);">'+tk.title+'</span>'
      +(tk.category?'<span style="font-size:.65rem;background:var(--sur);padding:2px 7px;border-radius:20px;color:var(--mut);white-space:nowrap;">'+tk.category+'</span>':"")
      +'</div>'
      +'<div style="font-size:.74rem;color:var(--mut);margin-top:4px;display:flex;flex-wrap:wrap;gap:6px;">'
      +dueLbl
      +(hv?'<span>🏠 '+hv.name+'</span>':"")
      +'<span style="color:'+col+';">'+prioLabels[tk.priority||"medium"]+'</span>'
      +(tk.recurring&&tk.recurDays?'<span>🔄 /'+tk.recurDays+(isEN?"d":"z")+'</span>':"")
      +'</div>'
      +(tk.notes?'<div style="font-size:.72rem;color:var(--mut);font-style:italic;margin-top:3px;">'+tk.notes+'</div>':"")
      +'</div>'
      +'<div style="display:flex;flex-direction:column;gap:4px;flex-shrink:0;">'
      +(!tk.done?'<button class="btn sm" style="background:var(--ok);border-color:var(--ok);font-size:.72rem;padding:4px 8px;" onclick="tkDone(\''+tk.id+'\')">✓</button>':"")
      +'<button class="btn sm be" onclick="tkM(\''+tk.id+'\')" style="font-size:.72rem;padding:4px 8px;">✏️</button>'
      +'<button class="btn sm bd" onclick="delTk(\''+tk.id+'\')" style="font-size:.72rem;padding:4px 8px;">🗑️</button>'
      +'</div>'
      +'</div></div>';
  }).join("")
  :'<div class="al ali">'+(_tkTab==="pending"?t("tk_no_pending"):t("tk_no_data"))+'</div>';

  setP('<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;margin-bottom:4px;">'
    +'<h2 style="margin:0;font-size:1.2rem;"><i class="fas fa-list-check" style="color:var(--gold)"></i> '+t("tk_title")+'</h2>'
    +'<button class="btn sm" onclick="tkM(\'\')">'+t("tk_new")+'</button>'
    +'</div>'
    +tabs+listH);
}

window.delTk=function(id){
  showConfirm(t("tk_del_c"),function(){
    D.tasks=D.tasks.filter(function(tk){return tk.id!==id;});
    save();renderSarcini();
  });
};

window.tkDone=function(id){
  var tk=(D.tasks||[]).find(function(x){return x.id===id;});
  if(!tk)return;
  tk.done=true;tk.doneDate=todayISO();
  var msg=t("tk_completed");
  if(tk.recurring&&tk.recurDays){
    var base=tk.dueDate?new Date(tk.dueDate):new Date();
    base.setDate(base.getDate()+parseInt(tk.recurDays));
    D.tasks.push({id:uid(),title:tk.title,hiveId:tk.hiveId,dueDate:base.toISOString().slice(0,10),priority:tk.priority,category:tk.category,recurring:true,recurDays:tk.recurDays,done:false,doneDate:null,notes:tk.notes,autoGenerated:true});
    msg+=" "+t("tk_next_created");
  }
  save();renderSarcini();toast(msg,"✅");
};

function tkM(id){
  var ex=id?((D.tasks||[]).find(function(tk){return tk.id===id;})):null;
  var isEN=D.settings.lang==="en";
  var cats=t("tk_cats");
  var prios=t("tk_prio");
  var prioVals=t("tk_prio_vals");
  var curPrio=xv(ex,"priority","medium");
  var curRec=xv(ex,"recurring",false);

  openM('<div class="mt">'+(id?t("tk_edit_t"):t("tk_new_t"))+'</div>'
    +L(t("tk_name"))+'<input type="text" id="tkTitle" value="'+esc(xv(ex,"title",""))+'" placeholder="'+(isEN?"e.g. Inspect hive, add supers...":"ex. Inspectează stupul 3, adaugă corp...")+'">'
    +'<div class="r2">'
    +'<div>'+L(t("tk_due"))+'<input type="date" id="tkDue" value="'+xv(ex,"dueDate",todayISO())+'"></div>'
    +'<div>'+L(t("tk_priority"))
    +'<select id="tkPrio">'
    +prios.map(function(p,i){return'<option value="'+prioVals[i]+'"'+(curPrio===prioVals[i]?" selected":"")+'>'+p+'</option>';}).join("")
    +'</select></div></div>'
    +L(t("tk_category"))
    +'<select id="tkCat">'
    +'<option value="">—</option>'
    +cats.map(function(c){return'<option value="'+c+'"'+(xv(ex,"category","")=== c?" selected":"")+'>'+c+'</option>';}).join("")
    +'</select>'
    +L(t("tk_hive"))
    +'<select id="tkHive"><option value="">—</option>'
    +D.hives.map(function(h){return'<option value="'+h.id+'"'+(xv(ex,"hiveId","")=== h.id?" selected":"")+'>'+h.name+'</option>';}).join("")
    +'</select>'
    +'<div style="display:flex;align-items:center;gap:10px;margin:10px 0 4px;">'
    +'<label style="display:flex;align-items:center;gap:7px;font-size:.84rem;cursor:pointer;">'
    +'<input type="checkbox" id="tkRec"'+(curRec?" checked":"")+'  onchange="tkToggleRec(this.checked)">'
    +'<span>'+t("tk_recurring")+'</span></label></div>'
    +'<div id="tkRecDiv"'+(curRec?"":" style=\"display:none;\"")+'>'+L(t("tk_recur_days"))
    +'<input type="number" id="tkRecDays" inputmode="numeric" min="1" max="365" value="'+esc(xv(ex,"recurDays",10))+'" style="width:100px;"></div>'
    +L(t("tk_notes"))+'<textarea id="tkNotes" rows="2">'+esc(xv(ex,"notes",""))+'</textarea>'
    +'<div class="br" style="margin-top:14px;"><button class="btn" onclick="saveTk(\''+( id||"")+'\')">'+btnS()+'</button><button class="btn gh" onclick="closeM()">'+btnC()+'</button></div>');
}

window.tkToggleRec=function(checked){
  var d=document.getElementById("tkRecDiv");
  if(d)d.style.display=checked?"":"none";
};

window.saveTk=function(id){
  var title=($q("tkTitle")||{}).value||"";
  if(!title.trim()){toast("⚠️ "+(D.settings.lang==="en"?"Enter a title!":"Introduceți titlul!"));return;}
  var rec=($q("tkRec")||{}).checked||false;
  var recDays=rec?(parseInt(($q("tkRecDays")||{}).value)||10):null;
  var o={
    id:id||uid(),
    title:title.trim(),
    hiveId:($q("tkHive")||{}).value||null,
    dueDate:($q("tkDue")||{}).value||todayISO(),
    priority:($q("tkPrio")||{}).value||"medium",
    category:($q("tkCat")||{}).value||"",
    recurring:rec,
    recurDays:recDays,
    done:false,
    doneDate:null,
    notes:($q("tkNotes")||{}).value||"",
    autoGenerated:false
  };
  if(!D.tasks)D.tasks=[];
  if(id){
    var ex=D.tasks.find(function(tk){return tk.id===id;});
    if(ex){var wasDone=ex.done,wasDoneDate=ex.doneDate,wasAuto=ex.autoGenerated;Object.assign(ex,o);ex.done=wasDone;ex.doneDate=wasDoneDate||null;ex.autoGenerated=!!wasAuto;}
  }else{D.tasks.push(o);}
  save();closeM();renderSarcini();toast(t("tk_saved"),"📋");
};
