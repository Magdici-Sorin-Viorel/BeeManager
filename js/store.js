// BeeManager Pro — store.js
// 🗄️ THE DATA STORE — the one gate to the app's records.
// The data lives in tables (hives, inspections, treatments… — the same tables db.js keeps in IndexedDB). No page
// touches those tables directly: it asks the store (through the BM API, js/api.js), so every read comes from one
// place and every add / delete goes through one place — where the indexes and caches are told about the change.
//
//   STORE.tabel("treatments") →
//     randuri()        the rows (the live list — read only; change it only with the methods below)
//     rand(id)         one row by id (or null)
//     numar()          how many rows
//     adauga(o)        add a row (gets an id if it has none) → the row
//     modifica(r, c)   change fields of a row (r = the row or its id) → the row
//     pune(o)          add, or replace the fields of the row with the same id → the row
//     sterge(id)       delete one row by id → true if it existed
//     pastreaza(fn)    keep only the rows for which fn(row) is true (deletes the rest) → how many were deleted
//     inlocuieste(l)   replace the whole table (restore, reorder)
//   STORE.laSchimbare(tabel | "*", fn)   run fn(tabel) after each structural change
//
// Records are live objects: a page may change fields of a row it got (hive.fB = 5) and then call save() — that is
// the „commit”; save() also announces the change. Adding / removing rows is always done through the table.
// Writing to disk stays where it was: save() (core.js) → IndexedDB (db.js) + the localStorage mirror.
var STORE=(function(){
  var NAMES=["hives","queens","inspections","treatments","pastorage","varroa","feedings","hivesArchive","bloomObs","extractions","flora"];
  var hooks={},cache={};
  var rows=function(t){return D[t]||(D[t]=[]);};
  var changed=function(t){(hooks[t]||[]).concat(hooks["*"]||[]).forEach(function(f){try{f(t);}catch(e){}});};
  var tabel=function(t){
    if(cache[t])return cache[t];
    if(NAMES.indexOf(t)<0)throw new Error("STORE: no table "+t);
    var T={
      nume:t,
      randuri:function(){return rows(t);},
      rand:function(id){if(id==null||id==="")return null;var a=rows(t);for(var i=0;i<a.length;i++)if(a[i]&&a[i].id===id)return a[i];return null;},
      numar:function(){return rows(t).length;},
      adauga:function(o){if(!o||typeof o!=="object")return null;if(o.id==null||o.id==="")o.id=uid();rows(t).push(o);changed(t);return o;},
      modifica:function(r,c){var x=r&&typeof r==="object"?r:T.rand(r);if(!x)return null;if(c)Object.assign(x,c);changed(t);return x;},
      pune:function(o){if(!o||typeof o!=="object")return null;var x=o.id!=null&&o.id!==""?T.rand(o.id):null;if(x){if(x!==o)Object.assign(x,o);changed(t);return x;}return T.adauga(o);},
      sterge:function(id){var a=rows(t),n=a.length;D[t]=a.filter(function(r){return !r||r.id!==id;});if(D[t].length!==n){changed(t);return true;}return false;},
      pastreaza:function(fn){var a=rows(t),n=a.length;D[t]=a.filter(fn);var d=n-D[t].length;if(d)changed(t);return d;},
      inlocuieste:function(l){D[t]=Array.isArray(l)?l:[];changed(t);return D[t];}
    };
    return cache[t]=T;
  };
  return{
    tabel:tabel,
    tabele:function(){return NAMES.slice();},
    laSchimbare:function(t,fn){(hooks[t]||(hooks[t]=[])).push(fn);},
    anunta:function(){var done=[];Object.keys(hooks).forEach(function(k){hooks[k].forEach(function(f){if(done.indexOf(f)<0){done.push(f);try{f(k);}catch(e){}}});});}   // called by save(): fields of live rows may have changed
  };
})();
