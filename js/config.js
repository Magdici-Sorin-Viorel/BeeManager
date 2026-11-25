// BeeManager Pro — config.js
// App configuration (constants that are not user settings).
// The menu and its order are set in the app: Setări → ☰ Ordinea meniului (the pages are listed in js/nav.js).
// On phones, the first 4 menus in the order appear in the bottom bar.

// Left menu (desktop/tablet): false = always stays open,
// no collapse button and it doesn't collapse when forms open
var SIDEBAR_COLLAPSIBLE=false;

// Stupi → „Sub hrănire: Da/Nu”: a hive is under feeding if it has a feeding
// (on it or on „toți stupii”) within this many days, from the Hrănire module
var FEED_ACTIVE_DAYS=7;
