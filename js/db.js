// BeeManager Pro — db.js
// 🗄️ Local database (IndexedDB "bmpDB"): one table per collection (hives, inspections, treatments…) with the
// record id as key, plus a "meta" table for settings, location and weather.
//   • The app keeps working on the in-memory model D (pages read it synchronously); every save() writes D to
//     the database (debounced, one transaction) and keeps the old localStorage copy "bmp5" as a mirror, so
//     backups, older versions of the app and the test scripts see the same data.
//   • At start the newest of the two (database / localStorage "bmp5") is loaded — a phone that only has the
//     old localStorage data is migrated into the database on first run, nothing is lost.
//   • No IndexedDB (private window, very old browser) → the app silently runs on localStorage as before.
// API: dbInit() → Promise (called once from init), dbWrite(D) → Promise, dbClear() → Promise, dbStatus().
var DB_NAME="bmpDB",DB_VER=3;   // v2: + extractions · v3: + flora (the user's plants)
var DB_TABLES=["hives","queens","inspections","honeyHarvests","treatments","inventory","pastorage","finances","varroa","tasks","feedings","hivesArchive","bloomObs","extractions","flora"];
var DB_META=["settings","userLoc","weather"];
var _db={h:null,ok:false,err:null,timer:null,pending:false,last:0};

function dbOpen(){
  if(_db.h)return Promise.resolve(_db.h);
  return new Promise(function(res,rej){
    if(!window.indexedDB){rej(new Error("no indexedDB"));return;}
    var q;try{q=indexedDB.open(DB_NAME,DB_VER);}catch(e){rej(e);return;}
    q.onupgradeneeded=function(e){
      var d=e.target.result;
      DB_TABLES.forEach(function(t){if(!d.objectStoreNames.contains(t))d.createObjectStore(t,{keyPath:"id"});});
      if(!d.objectStoreNames.contains("meta"))d.createObjectStore("meta",{keyPath:"k"});
    };
    q.onsuccess=function(){_db.h=q.result;_db.ok=true;_db.h.onversionchange=function(){_db.h.close();_db.h=null;};res(_db.h);};
    q.onerror=function(){rej(q.error);};q.onblocked=function(){rej(new Error("blocked"));};
  });
}
// read everything → {hives:[…],…,settings:{…},savedAt}
function dbReadAll(){
  return dbOpen().then(function(d){return new Promise(function(res,rej){
    var out={},tx=d.transaction(DB_TABLES.concat(["meta"]),"readonly");
    DB_TABLES.forEach(function(t){var r=tx.objectStore(t).getAll();r.onsuccess=function(){out[t]=r.result||[];};});
    var m=tx.objectStore("meta").getAll();m.onsuccess=function(){(m.result||[]).forEach(function(x){out[x.k]=x.v;});};
    tx.oncomplete=function(){
      // IndexedDB returns rows sorted by id; the app's own order (as added / sorted by the user) is kept in meta.order
      var ord=out.order||{};DB_TABLES.forEach(function(t){var o=ord[t];if(!o||!out[t])return;var pos={};o.forEach(function(id,i){pos[id]=i;});
        out[t].sort(function(a,b){var x=pos[a.id],y=pos[b.id];if(x==null&&y==null)return 0;if(x==null)return 1;if(y==null)return -1;return x-y;});});
      delete out.order;res(out);};tx.onerror=function(){rej(tx.error);};tx.onabort=function(){rej(tx.error);};
  });});
}
// write the whole model in one transaction (clear + put) — a few hundred records, a few ms
function dbWrite(data){
  return dbOpen().then(function(d){return new Promise(function(res,rej){
    var tx=d.transaction(DB_TABLES.concat(["meta"]),"readwrite"),now=Date.now();
    DB_TABLES.forEach(function(t){
      var st=tx.objectStore(t);st.clear();
      (data[t]||[]).forEach(function(r){if(!r||typeof r!=="object")return;if(r.id==null||r.id==="")r.id=uid();try{st.put(r);}catch(e){}});
    });
    var ms=tx.objectStore("meta"),order={};ms.clear();
    DB_TABLES.forEach(function(t){order[t]=(data[t]||[]).map(function(r){return r&&r.id;});});
    ms.put({k:"order",v:order});
    DB_META.forEach(function(k){if(data[k]!==undefined)ms.put({k:k,v:data[k]});});
    ms.put({k:"savedAt",v:now});
    tx.oncomplete=function(){_db.last=now;res(now);};tx.onerror=function(){rej(tx.error);};tx.onabort=function(){rej(tx.error);};
  });});
}
function dbClear(){
  return dbOpen().then(function(d){return new Promise(function(res){
    var tx=d.transaction(DB_TABLES.concat(["meta"]),"readwrite");
    DB_TABLES.concat(["meta"]).forEach(function(t){tx.objectStore(t).clear();});
    tx.oncomplete=function(){res();};tx.onerror=function(){res();};
  });}).catch(function(){});
}
// debounced write used by save(): many saves in a row → one transaction; flushed when the page is hidden
function dbSaveSoon(){
  if(!_db.ok)return;_db.pending=true;
  clearTimeout(_db.timer);_db.timer=setTimeout(dbFlush,250);
}
function dbFlush(){
  if(!_db.ok||!_db.pending)return Promise.resolve();
  _db.pending=false;clearTimeout(_db.timer);
  return dbWrite(D).catch(function(e){_db.err=e;});
}
document.addEventListener("visibilitychange",function(){if(document.hidden)dbFlush();});
window.addEventListener("pagehide",function(){dbFlush();});

// start: pick the newest copy (database vs localStorage mirror), migrate the old one if needed.
// Resolves with the data to use (or null = use what load() read from localStorage).
function dbInit(lsData){
  var lsAt=lsData&&lsData.settings&&lsData.settings.savedAt||0,hasLs=!!(lsData&&(lsData.hives||[]).length+(lsData.inspections||[]).length);
  return dbReadAll().then(function(db){
    var dbAt=db.savedAt||0,hasDb=DB_TABLES.some(function(t){return(db[t]||[]).length;})||!!db.settings;
    if(!hasDb){_db.pending=true;return null;}                     // first run with the database: localStorage → db (written by the first flush)
    if(hasLs&&lsAt>dbAt+1000){_db.pending=true;return null;}      // localStorage copy is newer (written by an older app version) → it wins, db is refreshed
    var out={};DB_TABLES.forEach(function(t){out[t]=db[t]||[];});DB_META.forEach(function(k){if(db[k]!==undefined)out[k]=db[k];});
    return out;
  }).catch(function(e){_db.err=e;_db.ok=false;return null;});
}
function dbStatus(){return{ok:_db.ok,error:_db.err?String(_db.err):"",lastWrite:_db.last,tables:DB_TABLES.length};}
