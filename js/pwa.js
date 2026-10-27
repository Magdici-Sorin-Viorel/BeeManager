// BeeManager Pro — pwa.js
// Registers the service worker (offline use + install on phone)

(function(){
  // Works only when the app is served from a site (https or localhost),
  // not when opened directly as a file (file://)
  if(!("serviceWorker" in navigator)||location.protocol==="file:")return;

  window.addEventListener("load",function(){
    navigator.serviceWorker.register("service-worker.js").catch(function(e){
      console.warn("Service worker neînregistrat:",e);
    });
  });

  // Ask the browser not to delete local data when the phone runs low on storage
  if(navigator.storage&&navigator.storage.persist){
    navigator.storage.persisted().then(function(p){if(!p)navigator.storage.persist();}).catch(function(){});
  }
})();
