// BeeManager Pro — export.js
// JSON backup: export / share to Drive / import

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
      toast(isEN?"✅ Saved! Move file to Google Drive folder.":"✅ Backup salvat.","☁️");
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
  toast(isEN?"⬇️ Download started — move file to Google Drive.":"⬇️ Backup salvat în Descărcări (Downloads).","☁️");
  if(curP==="settings")renderSettings();
}

// Backup to Google Drive through the phone's share sheet (Web Share API with files):
// one tap opens the share menu → the user picks Drive → Save. After a successful share a local copy
// is also downloaded on the device (double backup). Where file sharing isn't supported (e.g. PC
// browsers) it falls back to the normal save/download.
async function driveShareJSON(){
  var filename="BeeManagerPro_backup_"+todayISO()+".json";
  var json=JSON.stringify(D,null,2);
  var file=null;
  try{file=new File([json],filename,{type:"application/json"});}catch(e){}
  if(file&&navigator.canShare&&navigator.canShare({files:[file]})){
    try{
      await navigator.share({files:[file],title:"BeeManager Pro — backup",text:"Backup BeeManager Pro "+todayISO()});
    }catch(e){
      if(e&&e.name==="AbortError"){toast("Backup anulat.","☁️");return;}
      toast("Partajarea nu a mers — salvez fișierul pe telefon.","⚠️");
      driveExportJSON();return;
    }
    // local copy on the phone too
    var url=URL.createObjectURL(new Blob([json],{type:"application/json"}));
    var a=document.createElement("a");a.href=url;a.download=filename;
    document.body.appendChild(a);a.click();
    setTimeout(function(){document.body.removeChild(a);URL.revokeObjectURL(url);},1000);
    D.settings.driveLastExport=Date.now();save(false);
    toast("✅ Backup trimis în Drive + copie pe telefon","☁️");
    if(curP==="settings")renderSettings();
    return;
  }
  toast("Acest browser nu poate trimite direct în Drive — salvez fișierul.","ℹ️");
  driveExportJSON();
}

// Import data from a JSON backup file selected by the user.
function driveImportJSON(){
  var isEN=D.settings.lang==="en";
  var input=document.createElement("input");
  input.type="file";input.accept=".json,application/json,text/plain,application/octet-stream"; // wider filter: some Android pickers grey out .json from Drive
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
