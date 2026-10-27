// BeeManager Pro — app.js
// App startup (init)

// ═══════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════
function init(){
  load();
  if(typeof demoMaybe==="function")demoMaybe();   // demo data — only in the Claude preview (see demo.js)
  applyMenuOrder();   // menu order saved in Settings
  curP=HOME;
  updateOfflineBar();
  // Sidebar only on desktop
  if(window.innerWidth>650){
    try{var stored=localStorage.getItem("sbColl");sbColl=SIDEBAR_COLLAPSIBLE&&stored==="1";}catch(e){sbColl=false;}
    applySBState();
  }
  // Menu always open: hide the collapse buttons
  if(!SIDEBAR_COLLAPSIBLE){
    var tg=document.getElementById("sbTogBtn");if(tg)tg.style.display="none";
    var bg0=document.getElementById("bgr");if(bg0)bg0.style.display="none";
  }
  buildNav();
  go(pageFromHash());
  // Desktop: hamburger button toggles sidebar
  var bgr=document.getElementById("bgr");
  if(bgr)bgr.addEventListener("click",function(){if(window.innerWidth>650)toggleSB();});
  document.getElementById("ov").addEventListener("click",closeSB);
  // Swipe down on more drawer handle to close
  var _ty0=0;
  var drw=document.getElementById("moreDrw");
  if(drw){
    drw.addEventListener("touchstart",function(e){_ty0=e.touches[0].clientY;},{passive:true});
    drw.addEventListener("touchend",function(e){
      if(e.changedTouches[0].clientY-_ty0>50)closeMoreDrw();
    },{passive:true});
  }
}

init();
