// BeeManager Pro — weather.js
// Weather: location, Open-Meteo, bee activity

// ═══════════════════════════════════════════
// WEATHER
// ═══════════════════════════════════════════
function initLoc(){
  if(!navigator.onLine){if(!D.weather)toast("📴 Offline — introduceți vreme manual","🌡️");return;}
  if(D.userLoc){var age=D.weather?(Date.now()-(D.weather.ts||0)):Infinity;if(age>15*60*1000)fetchW(D.userLoc.lat,D.userLoc.lon);}
  if(navigator.geolocation){
    navigator.geolocation.getCurrentPosition(
      function(p){D.userLoc={lat:p.coords.latitude,lon:p.coords.longitude};save(false);fetchW(p.coords.latitude,p.coords.longitude);},
      function(){if(!D.weather)toast("📍 "+(D.settings.lang==="en"?"Enable location for real weather":"Activați locația pentru vreme reală"));},
      {timeout:8000}
    );
  }
}

async function fetchW(lat,lon){
  if(!navigator.onLine){toast("📴 Offline — vreme din cache sau manuală","🌡️");return;}
  try{
    var r=await fetch("https://api.open-meteo.com/v1/forecast?latitude="+lat+"&longitude="+lon+"&current=temperature_2m,precipitation,weathercode,windspeed_10m,relativehumidity_2m&timezone=auto&forecast_days=1");
    if(!r.ok)throw 0;
    var d=await r.json(),c=d.current,wi=wmoI(c.weathercode);
    D.weather={temp:Math.round(c.temperature_2m*10)/10,prec:c.precipitation,wc:c.weathercode,wind:Math.round(c.windspeed_10m),hum:c.relativehumidity_2m,ic:wi.i,rain:wi.r||c.precipitation>0,ts:Date.now(),manual:false};
    save(false);
    if(curP==="dashboard")renderDashboard();
  }catch(e){console.warn("Weather failed",e);if(!D.weather)toast("⚠️ Vreme indisponibilă — introduceți manual","🌡️");}
}

function beeAct(w){
  if(!w)return{ic:"❓",ttl:t("bee_unknown_t"),det:t("bee_unknown_d"),bg:"rgba(255,255,255,.04)"};
  var temp=w.temp,rain=w.rain||(w.prec>0),wind=w.wind;
  if(rain)return{ic:"🌧️",ttl:t("bee_rain_t"),det:t("bee_rain_d"),bg:"rgba(74,158,255,.12)"};
  if(temp<=8)return{ic:"❄️",ttl:t("bee_freeze_t"),det:t("bee_freeze_d"),bg:"rgba(74,158,255,.1)"};
  if(temp<=12)return{ic:"🥶",ttl:t("bee_cold_t"),det:t("bee_cold_d"),bg:"rgba(74,158,255,.08)"};
  if(temp<=15)return{ic:"🐝",ttl:t("bee_clean_t"),det:t("bee_clean_d"),bg:"rgba(230,180,34,.08)"};
  if(wind>30)return{ic:"💨",ttl:t("bee_wind_t"),det:t("bee_wind_d"),bg:"rgba(224,124,76,.1)"};
  if(temp>38)return{ic:"🌡️",ttl:t("bee_heat_ext_t"),det:t("bee_heat_ext_d"),bg:"rgba(224,124,76,.2)"};
  if(temp>33)return{ic:"🌡️",ttl:t("bee_heat_t"),det:t("bee_heat_d"),bg:"rgba(224,124,76,.1)"};
  if(temp>=20)return{ic:"🐝🐝🐝",ttl:t("bee_active_t"),det:t("bee_active_d"),bg:"rgba(111,191,76,.1)"};
  return{ic:"🐝🐝",ttl:t("bee_good_t"),det:t("bee_good_d"),bg:"rgba(230,180,34,.06)"};
}
