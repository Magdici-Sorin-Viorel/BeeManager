// BeeManager Pro — export.js
// Excel / PDF / JSON backup export

// FIX: Excel Export using SheetJS
function exportToExcel(){
  if(typeof XLSX==="undefined"){toast(D.settings.lang==="en"?"SheetJS not loaded":"SheetJS indisponibil","❌");return;}
  var isEN=D.settings.lang==="en";
  var wb=XLSX.utils.book_new();

  // Sheet: Hives
  var hdr=isEN?["Hive","Location","Material","Model","Total Frames","Brood Frames","Food Frames","Strength"]:["Stup","Locatie","Material","Model","Rame Total","Rame Puiet","Rame Mancare","Forta"];
  var rows=[hdr];
  D.hives.forEach(function(h){rows.push([h.name,h.loc,h.mat,h.mod,hvTotal(h),h.fB||0,h.fH||0,h.str]);});
  XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(rows),isEN?"Hives":"Stupi");

  // Sheet: Inspections
  var hdr2=isEN?["Hive","Date","Weather","Temp","Brood","Food","Strength","Migration","Notes"]:["Stup","Data","Vreme","Temp","Puiet","Mancare","Forta","Pastorare","Note"];
  var rows2=[hdr2];
  D.inspections.forEach(function(i){
    var hv=D.hives.find(function(h){return h.id===i.hiveId;});
    rows2.push([hv?hv.name:"?",i.date,i.weather,i.temp,i.fB,inspFood(i),i.str||"",i.pastLoc||"",i.notes||""]);
  });
  XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(rows2),isEN?"Inspections":"Inspectii");

  // Sheet: Honey
  var hdr3=isEN?["Hive","Type","Date","Estimated(kg)","Actual(kg)","Moisture%","Quality"]:["Stup","Tip","Data","Estimat(kg)","Real(kg)","Umiditate%","Calitate"];
  var rows3=[hdr3];
  D.honeyHarvests.forEach(function(h){
    var hv=D.hives.find(function(hive){return hive.id===h.hiveId;});
    rows3.push([hv?hv.name:"General",h.honeyType||h.type,h.extractionDate||h.date,h.estQty||0,h.actualQty||h.qty||0,h.humidity||"",h.quality||""]);
  });
  if(modOn("honey"))XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(rows3),isEN?"Honey":"Miere");

  // Sheet: Treatments
  var hdr4=isEN?["Hive","Product","Date","Until","Dose","Efficacy","Notes"]:["Stup","Produs","Data","Pana la","Doza","Eficacitate","Note"];
  var rows4=[hdr4];
  D.treatments.forEach(function(tr){
    var hv=D.hives.find(function(h){return h.id===tr.hiveId;});
    rows4.push([hv?hv.name:(isEN?"All hives":"Toti stupii"),tr.product,tr.date,tr.endDate||"",tr.dosage||"",tr.efficacy||"",tr.notes||""]);
  });
  XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(rows4),isEN?"Treatments":"Tratamente");

  // Sheet: Inventory
  var hdr5=isEN?["Name","Category","Quantity","Min Stock"]:["Denumire","Categorie","Cantitate","Stoc minim"];
  var rows5=[hdr5];
  D.inventory.forEach(function(i){rows5.push([i.name,i.cat,i.qty,i.min]);});
  if(modOn("inventory"))XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(rows5),isEN?"Inventory":"Inventar");

  // Sheet: Pastorage
  if(D.pastorage&&D.pastorage.length){
    var hdr6=isEN?["Hive","Location","Target","Start","End","Notes"]:["Stup","Locatie","Cules","Plecare","Intoarcere","Note"];
    var rows6=[hdr6];
    D.pastorage.forEach(function(p){   // one row per hive in the move
      pHives(p).forEach(function(hid){
        var back=(p.returned&&p.returned[hid])||(p.trip?p.endDate:p.endDate)||"";
        rows6.push([pHiveName(hid),p.location||"",p.target||"",p.startDate||"",back,p.notes||""]);
      });
    });
    XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(rows6),isEN?"Migratory":"Pastorare");
  }

  // Sheet: Finances
  if(D.finances&&D.finances.length&&modOn("financiar")){
    var hdrF=isEN?["Type","Date","Category","Amount (RON)","Hive","Qty (kg)","Price/kg","Notes"]:["Tip","Data","Categorie","Suma (RON)","Stup","Cant. (kg)","Pret/kg","Note"];
    var rowsF=[hdrF];
    D.finances.forEach(function(f){
      var hv=D.hives.find(function(h){return h.id===f.hiveId;});
      rowsF.push([isEN?(f.type==="income"?"Income":"Expense"):(f.type==="income"?"Venit":"Cheltuiala"),f.date||"",f.category||"",f.amount||0,hv?hv.name:"",f.qty||"",f.pricePerUnit||"",f.notes||""]);
    });
    XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(rowsF),isEN?"Financials":"Financiar");
  }

  // Sheet: Varroa
  if(D.varroa&&D.varroa.length){
    var hdrV=isEN
      ?["Hive","Date","Method","Mites","Bees","Days","Infestation %","Level","Treatment","Phase","Brood","Notes"]
      :["Stup","Data","Metoda","Acarieni","Albine","Zile","Infestare %","Nivel","Tratament","Faza","Puiet","Note"];
    var rowsV=[hdrV];
    D.varroa.forEach(function(v){
      var hv=D.hives.find(function(h){return h.id===v.hiveId;});
      var lvl=vrLevel(v);
      var lvlLabel=isEN?(lvl==="ok"?"OK":lvl==="watch"?"Monitor":"TREAT!"):(lvl==="ok"?"OK":lvl==="watch"?"Monitorizare":"TRATAMENT!");
      var mthLabel={natural:isEN?"Natural drop":"Cadere naturala",alcohol:isEN?"Alcohol wash":"Spalare alcool",sugar:isEN?"Sugar roll":"Zahar pudra",sticky:isEN?"Sticky board":"Placa adeziva"}[v.method]||v.method;
      var trV=v.treatmentId?(D.treatments||[]).find(function(x){return x.id===v.treatmentId;}):null;
      rowsV.push([hv?hv.name:"",v.date||"",mthLabel,v.miteCount||0,v.beeCount||"",vrIsDrop(v)?vrDays(v):"",v.infestationPct!=null?v.infestationPct:"",vrPhase(v)==="during"?vrPhaseLbl("during"):lvlLabel,trV?trShort(trV):"",vrPhaseLbl(vrPhase(v)),v.hasBrood?(isEN?"Yes":"Da"):(isEN?"No":"Nu"),v.notes||""]);
    });
    XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(rowsV),t("vr_export_sheet"));
  }

  // Sheet: Tasks
  if(D.tasks&&D.tasks.length&&modOn("sarcini")){
    var hdrT=isEN
      ?["Title","Due Date","Priority","Category","Hive","Recurring","Every (days)","Done","Done Date","Notes"]
      :["Titlu","Termen","Prioritate","Categorie","Stup","Recurenta","La (zile)","Efectuata","Data efectuarii","Note"];
    var rowsT=[hdrT];
    D.tasks.forEach(function(tk){
      var hv=D.hives.find(function(h){return h.id===tk.hiveId;});
      var prioMap={high:isEN?"Urgent":"Urgenta",medium:isEN?"Medium":"Medie",low:isEN?"Low":"Scazuta"};
      rowsT.push([tk.title||"",tk.dueDate||"",prioMap[tk.priority]||tk.priority||"",tk.category||"",hv?hv.name:"",tk.recurring?(isEN?"Yes":"Da"):(isEN?"No":"Nu"),tk.recurDays||"",tk.done?(isEN?"Yes":"Da"):(isEN?"No":"Nu"),tk.doneDate||"",tk.notes||""]);
    });
    XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(rowsT),t("tk_export_sheet"));
  }

  // Sheet: Feedings
  if(D.feedings&&D.feedings.length){
    var hdrHr=isEN
      ?["Date","Hive","All Hives","Feed Type","Quantity","Unit","Reason","Inv. Item","Notes","Status","Stopped on","Portions"]
      :["Data","Stup","Toti stupii","Tip hrana","Cantitate","Unitate","Motiv","Articol inventar","Note","Stare","Oprita la","Portii"];
    if(!modOn("inventory"))hdrHr.splice(7,1); // without the „Articol inventar” column
    var rowsHr=[hdrHr];
    var hrTypes=t("hr_types")||[];
    D.feedings.forEach(function(f){
      var hv={name:fdHiveNames(f)};
      var st=fdStatus(f),stL=st==="planned"?(isEN?"Planned":"Planificata"):st==="active"?(isEN?"In progress":"In curs"):(isEN?"Stopped":"Oprita");
      var tp=hrTypes.find(function(x){return x.v===f.feedType;})||{l:f.feedType||""};
      var invItem=(f.invItemId&&modOn("inventory"))?D.inventory.find(function(i){return i.id===f.invItemId;}):null;
      var rowHr=[f.date||"",hv.name,f.allHives?(isEN?"Yes":"Da"):(isEN?"No":"Nu"),tp.l.replace(/^[^ ]+ /,""),f.qty||0,f.unit||"kg",f.reason||"",invItem?invItem.name:"",f.notes||"",stL,f.endDate||"",fdPortions(f).map(function(p){return p.date+": "+p.qty;}).join("; ")];
      if(!modOn("inventory"))rowHr.splice(7,1);
      rowsHr.push(rowHr);
    });
    XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(rowsHr),t("hr_export_sheet"));
  }

  var fname="BeeManager_"+todayISO()+".xlsx";
  XLSX.writeFile(wb,fname);
  toast(isEN?"Excel exported! 📊":"Excel exportat! 📊","📊");
}

// FIX: PDF export using existing html2pdf.js
function exportToPDF(){
  var isEN=D.settings.lang==="en";
  var pg=document.getElementById("pg");
  if(!pg){toast("❌");return;}
  var opt={margin:10,filename:"BeeManager_"+todayISO()+".pdf",image:{type:"jpeg",quality:0.92},html2canvas:{scale:2,useCORS:true},jsPDF:{unit:"mm",format:"a4",orientation:"portrait"}};
  toast(isEN?"Generating PDF...":"Generez PDF...","📄");
  html2pdf().set(opt).from(pg).save().then(function(){toast(isEN?"PDF exported!":"PDF exportat!","📄");});
}

// ═══════════════════════════════════════════
// DRIVE BACKUP — Manual JSON export / import
// ═══════════════════════════════════════════

// Export full data as JSON; uses File System Access API if available,
// falls back to a standard <a> download (works in WebView too).
async function driveExportJSON(){
  var isEN=D.settings.lang==="en";
  var ts=todayISO();
  var filename="BeeManagerPro_backup_"+ts+".json";
  var json=JSON.stringify(D,null,2);
  var blob=new Blob([json],{type:"application/json"});
  // Try File System Access API (Chrome desktop / Android Chrome 86+)
  if(window.showSaveFilePicker){
    try{
      var fh=await window.showSaveFilePicker({
        suggestedName:filename,
        types:[{description:"JSON backup",accept:{"application/json":[".json"]}}]
      });
      var w=await fh.createWritable();
      await w.write(blob);
      await w.close();
      D.settings.driveLastExport=Date.now();
      save(false);
      toast(isEN?"✅ Saved! Move file to Google Drive folder.":"✅ Salvat! Mută fișierul în folderul Google Drive.","☁️");
      if(curP==="settings")renderSettings();
      return;
    }catch(e){
      // User cancelled or API unavailable — fall through to download
      if(e.name==="AbortError")return;
    }
  }
  // Fallback: trigger browser download
  var url=URL.createObjectURL(blob);
  var a=document.createElement("a");
  a.href=url;a.download=filename;
  document.body.appendChild(a);a.click();
  setTimeout(function(){document.body.removeChild(a);URL.revokeObjectURL(url);},1000);
  D.settings.driveLastExport=Date.now();
  save(false);
  toast(isEN?"⬇️ Download started — move file to Google Drive.":"⬇️ Descărcare pornită — mută fișierul în Google Drive.","☁️");
  if(curP==="settings")renderSettings();
}

// Import data from a JSON backup file selected by the user.
function driveImportJSON(){
  var isEN=D.settings.lang==="en";
  var input=document.createElement("input");
  input.type="file";input.accept=".json,application/json";
  input.onchange=function(e){
    var file=e.target.files[0];
    if(!file)return;
    var reader=new FileReader();
    reader.onload=function(ev){
      try{
        var imported=JSON.parse(ev.target.result);
        if(!imported||!Array.isArray(imported.hives)){toast(isEN?"Invalid backup file.":"Fișier de backup invalid.","❌");return;}
        showConfirm(isEN?"This will overwrite your current data. Continue?":"Aceasta va suprascrie datele curente. Continui?",function(){
          Object.assign(D,imported);
          save(false);
          toast(isEN?"✅ Data loaded from backup!":"✅ Date încărcate din backup!","☁️");
          setTimeout(function(){location.reload();},800);
        },null,isEN?"Yes, load":"Da, încarcă");
      }catch(err){
        toast(isEN?"Error reading file.":"Eroare la citirea fișierului.","❌");
      }
    };
    reader.readAsText(file);
  };
  document.body.appendChild(input);input.click();
  setTimeout(function(){document.body.removeChild(input);},2000);
}
