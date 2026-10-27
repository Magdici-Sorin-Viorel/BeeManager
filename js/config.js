// BeeManager Pro — config.js
// Module configuration: which menus are active
//
// ┌─────────────────────────────────────────────────────────────────┐
// │ MODULES DISABLED                                                │
// │ Modules in this list appear nowhere in the app (menu,           │
// │ Dashboard, Settings, Excel export, Hrănire → Inventar link).    │
// │ Their code and already-saved data stay untouched.               │
// │                                                                 │
// │ To bring a module back: remove it from the list.                │
// │   "financiar"  → Financiar (income, expenses, honey sales)      │
// │   "analytics"  → Analize                                        │
// │   "inventory"  → Inventar                                       │
// │   "honey"      → Honey harvest                                  │
// │   "dashboard"  → Dashboard                                      │
// │   "inspections"→ Inspecții — merged into Stupi (🔍 Inspecție     │
// │                  button + 📋 Inspecții field on the card)        │
// │   "varroa"     → Varroa — merged with „Tratamente”              │
// │                  (🕷️ Numărători tab)                            │
// │   "calculator" → Calcule Apicole — merged into inspection       │
// │                  (queen cells: keep/remove; emergence calc)     │
// │   "queens"     → Regine — NOTE: queen features are now          │
// │                  part of Stupi (the hive form). The separate    │
// │                  menu isn't needed; if you bring it back you'll │
// │                  see the same queens in both places.            │
// │ (disabled on 23.10.2026, at your request)                       │
// │                                                                 │
// │ The app opens on the first active menu in the list (now Stupi). │
// └─────────────────────────────────────────────────────────────────┘
// │   "sarcini"    → Sarcini — removed on 26.10.2026 (tracking is done from inspections)
var MODULES_OFF=["financiar","analytics","inventory","honey","dashboard","queens","inspections","varroa","calculator","sarcini"];

// Menu order is set in the app: Setări → ☰ Ordinea meniului.
// On phones, the first 4 menus in the order appear in the bottom bar.

// Left menu (desktop/tablet): false = always stays open,
// no collapse button and it doesn't collapse when forms open
var SIDEBAR_COLLAPSIBLE=false;

// Stupi → „Sub hrănire: Da/Nu”: a hive is under feeding if it has a feeding
// (on it or on „toți stupii”) within this many days, from the Hrănire module
var FEED_ACTIVE_DAYS=7;

// 🌳 Genealogie — queen score (1–100) per year: weight of each part (percent)
//   honey = honey (capped frames in supers) · gentle = gentleness · swarm = low swarming · winter = wintering (frames of bees)
var SCORE_W={honey:40,gentle:20,swarm:20,winter:20};

function modOn(id){return MODULES_OFF.indexOf(id)<0;}
