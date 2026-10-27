// BeeManager Pro — calculator.js
// Beekeeping calculator

// ═══════════════════════════════════════════
// BEEKEEPING CALCULATOR
// ═══════════════════════════════════════════
var CALC_WORKER_AGE={egg:2,larva:6,capped:15};
var CALC_QUEEN_AGE={cell_uncapped:0,cell_capped:8,virgin:16,mating:20,laying:26};
var CALC_WORKER_TOTAL=42;
var CALC_QUEEN_MAX=26;

function calcAddDays(date,days){var r=new Date(date);r.setDate(r.getDate()+days);return r;}
function calcFmtDate(date){
  var isEN=D.settings.lang==="en";
  try{return date.toLocaleDateString(isEN?'en-GB':'ro-RO',{day:'numeric',month:'long',year:'numeric'});}
  catch(e){return date.toISOString().slice(0,10);}
}

window.calcTypeChange=function(){
  var isEN=D.settings.lang==="en";
  var tp=($q("calcType")||{}).value||"worker";
  var sel=$q("calcStage");if(!sel)return;
  var stages=t(tp==="worker"?"calc_worker_stages":"calc_queen_stages")||[];
  sel.innerHTML=stages.map(function(s){return'<option value="'+s.v+'">'+s.l+'</option>';}).join("");
  calcRender();
};

window.calcResetDate=function(){
  var el=$q("calcDate");
  if(el){el.value=todayISO();calcRender();}
};

window.calcRender=function(){
  var isEN=D.settings.lang==="en";
  var dateStr=($q("calcDate")||{}).value;
  var tp=($q("calcType")||{}).value||"worker";
  var stage=($q("calcStage")||{}).value||"egg";
  var res=document.getElementById("calcResult");
  if(!res||!dateStr)return;
  var obsDate=new Date(dateStr);
  if(isNaN(obsDate.getTime())){res.innerHTML="";return;}

  if(tp==="worker"){
    var ageNow=CALC_WORKER_AGE[stage]||2;
    var daysLeft=CALC_WORKER_TOTAL-ageNow;
    var forageDate=calcAddDays(obsDate,daysLeft);
    var pct=Math.min(100,Math.max(0,(ageNow/CALC_WORKER_TOTAL)*100));
    var stages=t("calc_worker_stages")||[];
    var stEntry=stages.find(function(s){return s.v===stage;});
    var stLbl=stEntry?stEntry.l.replace(/^[^A-Za-zÀ-ÿ]*/,"").split("(")[0].trim():stage;
    if(daysLeft<=0){
      res.innerHTML='<div class="c" style="border-color:var(--ok);margin-top:0;">'
        +'<div class="ct" style="color:var(--ok);">✅ '+(isEN?"CURRENT STATUS":"STAREA ACTUALĂ")+'</div>'
        +'<div style="font-size:1.3rem;font-weight:800;color:var(--ok);margin:8px 0;">'+t("calc_already_foraging")+'</div>'
        +'<div><span class="bg gg">'+t("calc_stage_obs")+' '+stLbl+'</span></div>'
        +'</div>';
    } else {
      res.innerHTML='<div class="c" style="margin-top:0;">'
        +'<div class="ct">'+t("calc_foraging_title")+'</div>'
        +'<div style="font-size:1.5rem;font-weight:800;color:var(--gold);margin:8px 0;">📅 '+calcFmtDate(forageDate)+'</div>'
        +'<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px;">'
        +'<span class="bg gy">⏳ '+daysLeft+' '+t("calc_days_left")+'</span>'
        +'<span class="bg gb">🐛 '+stLbl+'</span>'
        +'</div>'
        +'<div style="background:rgba(0,0,0,.25);border-radius:20px;height:10px;overflow:hidden;margin-bottom:4px;">'
        +'<div style="width:'+pct+'%;height:100%;background:linear-gradient(90deg,var(--gold),#ffcf4a);border-radius:20px;transition:width .5s;"></div>'
        +'</div>'
        +'<div style="font-size:.74rem;color:var(--mut);">'+t("calc_progress")+' '+Math.floor(pct)+'%</div>'
        +'</div>';
    }
  } else {
    var ageQ=CALC_QUEEN_AGE[stage]||0;
    var daysToMating=Math.max(0,24-ageQ);
    var daysToLay=Math.max(0,CALC_QUEEN_MAX-ageQ);
    var matingDate=calcAddDays(obsDate,daysToMating);
    var layingDate=calcAddDays(obsDate,daysToLay);
    var pctQ=Math.min(100,Math.max(0,(ageQ/CALC_QUEEN_MAX)*100));
    var qstages=t("calc_queen_stages")||[];
    var qEntry=qstages.find(function(s){return s.v===stage;});
    var qLbl=qEntry?qEntry.l.replace(/^[^A-Za-zÀ-ÿ]*/,"").trim():stage;
    if(daysToLay<=0){
      res.innerHTML='<div class="c" style="border-color:var(--ok);margin-top:0;">'
        +'<div class="ct" style="color:var(--ok);">'+t("calc_queen_active")+'</div>'
        +'<div style="font-size:1.3rem;font-weight:800;color:var(--ok);margin:8px 0;">'+t("calc_already_laying")+'</div>'
        +'<span class="bg gg">'+qLbl+'</span>'
        +'<div style="background:rgba(111,191,76,.3);border-radius:20px;height:10px;overflow:hidden;margin-top:10px;">'
        +'<div style="width:100%;height:100%;background:linear-gradient(90deg,var(--ok),#8de860);border-radius:20px;"></div></div>'
        +'</div>';
    } else {
      res.innerHTML='<div class="c" style="margin-top:0;">'
        +'<div class="ct">'+t("calc_queen_title")+'</div>'
        +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:10px 0;">'
        +'<div style="background:rgba(255,255,255,.05);border-radius:var(--rs);padding:10px;text-align:center;">'
        +'<div style="font-size:.7rem;color:var(--mut);margin-bottom:4px;">'+t("calc_mating")+'</div>'
        +'<div style="font-size:.95rem;font-weight:800;color:var(--info);">'+calcFmtDate(matingDate)+'</div>'
        +'</div>'
        +'<div style="background:rgba(255,255,255,.05);border-radius:var(--rs);padding:10px;text-align:center;">'
        +'<div style="font-size:.7rem;color:var(--mut);margin-bottom:4px;">'+t("calc_laying_start")+'</div>'
        +'<div style="font-size:.95rem;font-weight:800;color:var(--gold);">'+calcFmtDate(layingDate)+'</div>'
        +'</div></div>'
        +'<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px;">'
        +'<span class="bg gy">⏳ '+daysToLay+' '+t("calc_days_to_lay")+'</span>'
        +'<span class="bg gb">'+qLbl+'</span>'
        +'</div>'
        +'<div style="background:rgba(0,0,0,.25);border-radius:20px;height:10px;overflow:hidden;margin-bottom:4px;">'
        +'<div style="width:'+pctQ+'%;height:100%;background:linear-gradient(90deg,var(--info),#74b3ff);border-radius:20px;transition:width .5s;"></div>'
        +'</div>'
        +'<div style="font-size:.74rem;color:var(--mut);">'+t("calc_cycle")+'</div>'
        +'</div>';
    }
  }
};



function renderCalculator(){
  var isEN=D.settings.lang==="en";
  var today=todayISO();
  var wStages=t("calc_worker_stages")||[];
  setP('<h2 style="margin-bottom:12px;font-size:1.2rem;"><i class="fas fa-calculator" style="color:var(--gold)"></i> '+t("calc_title")+'</h2>'
    +'<div class="c" style="margin-bottom:14px;">'
    +'<div class="ct">'+t("calc_params")+'</div>'
    +'<div class="r2" style="margin-top:9px;">'
    +'<div>'+L(t("calc_obs_date"))+'<input type="date" id="calcDate" value="'+today+'" oninput="calcRender()"></div>'
    +'<div>'+L(t("calc_bee_type"))+'<select id="calcType" onchange="calcTypeChange()">'
    +'<option value="worker">'+t("calc_worker")+'</option>'
    +'<option value="queen">'+t("calc_queen")+'</option>'
    +'</select></div></div>'
    +L(t("calc_stage"))
    +'<select id="calcStage" onchange="calcRender()">'
    +wStages.map(function(s){return'<option value="'+s.v+'">'+s.l+'</option>';}).join("")
    +'</select>'
    +'<div class="br" style="margin-top:10px;">'
    +'<button class="btn sm gh" onclick="calcResetDate()">'+t("calc_reset")+'</button>'
    +'</div></div>'
    +'<div id="calcResult"></div>'
    +'<div class="al ali" style="margin-top:12px;font-size:.72rem;">'
    +'<i class="fas fa-leaf"></i> '+t("calc_footer")+'</div>');
  calcRender();
}
