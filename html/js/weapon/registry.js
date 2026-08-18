/* ===========================================================
   AL HUD FRAMEWORK — weapon/registry.js
   Same swappable-layout pattern as speedometers/vitals/money:
   each weapon HUD theme implements mount(root) / update(state) /
   destroy(). state = { armed, label, clip, clipMax, reserve }.
   =========================================================== */
(function (AL) {
    "use strict";

    const registry = {};
    function register(name, def) { registry[name] = def; }
    function get(name) { return registry[name] || registry.weaponTheme1; }
    function list() { return Object.keys(registry); }

    const ICON = '<path d="M2 12h13l3-3v6l-3-3"/><path d="M15 9v6"/><path d="M6 9v6"/>';

    AL.weaponThemes = { register, get, list, ICON };
})(window.AL = window.AL || {});
