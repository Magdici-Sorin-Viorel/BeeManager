// BeeManager Pro — weather.js
// Weather: location, Open-Meteo — now + the 7-day forecast (D.weather.days) + the altitude of the place (D.userLoc.alt)

// ═══════════════════════════════════════════
// WEATHER
// ═══════════════════════════════════════════
function initLoc(){
  if(!navigator.onLine){if(!D.weather)toast("📴 Offline — introduceți vreme manual","🌡️");return;}
  if(D.userLoc){var age=D.weather?(Date.now()-(D.weather.ts||0)):Infinity;if(age>15*60*1000)fetchW(D.userLoc.lat,D.userLoc.lon);}
  if(navigator.geolocation){
    navigator.geolocation.getCurrentPosition(
      function(p){
        // the altitude (from Open-Meteo) is kept while the phone stays in the same place
        var old=D.userLoc,same=old&&Math.abs(old.lat-p.coords.latitude)<0.02&&Math.abs(old.lon-p.coords.longitude)<0.02;
        D.userLoc={lat:p.coords.latitude,lon:p.coords.longitude};if(same&&old.alt!=null)D.userLoc.alt=old.alt;
        if(typeof flHomeAuto==="function")flHomeAuto();
        save(false);fetchW(p.coords.latitude,p.coords.longitude);},
      function(){if(!D.weather)toast("📍 "+(D.settings.lang==="en"?"Enable location for real weather":"Activați locația pentru vreme reală"));},
      {timeout:8000}
    );
  }
}

async function fetchW(lat,lon){
  if(!navigator.onLine){toast("📴 Offline — vreme din cache sau manuală","🌡️");return;}
  try{
    var r=await fetch("https://api.open-meteo.com/v1/forecast?latitude="+lat+"&longitude="+lon+"&current=temperature_2m,precipitation,weathercode,windspeed_10m,relativehumidity_2m&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,windspeed_10m_max,weathercode&timezone=auto&forecast_days=7");
    if(!r.ok)throw 0;
    var d=await r.json(),c=d.current,wi=wmoI(c.weathercode);
    D.weather={temp:Math.round(c.temperature_2m*10)/10,prec:c.precipitation,wc:c.weathercode,wind:Math.round(c.windspeed_10m),hum:c.relativehumidity_2m,ic:wi.i,rain:wi.r||c.precipitation>0,ts:Date.now(),manual:false};
    // 7-day forecast: [{d, tmax, tmin, prec (mm), wind (km/h), wc}] — used for „zile bune de lucru” (advisor.js)
    var dl=d.daily;if(dl&&dl.time)D.weather.days=dl.time.map(function(day,i){return{d:day,tmax:Math.round(dl.temperature_2m_max[i]),tmin:Math.round(dl.temperature_2m_min[i]),prec:Math.round((dl.precipitation_sum[i]||0)*10)/10,wind:Math.round(dl.windspeed_10m_max[i]||0),wc:dl.weathercode[i]};});
    if(D.userLoc&&typeof d.elevation==="number"&&Math.abs(D.userLoc.lat-lat)<0.02){D.userLoc.alt=Math.round(d.elevation);if(typeof flHomeAuto==="function")flHomeAuto();}
    save(false);
    if(typeof curP!=="undefined"&&(curP==="hives"||curP==="calendar")&&!document.getElementById("MB")&&typeof render==="function"){try{render();}catch(e){}}
  }catch(e){console.warn("Weather failed",e);if(!D.weather)toast("⚠️ Vreme indisponibilă — introduceți manual","🌡️");}
}

