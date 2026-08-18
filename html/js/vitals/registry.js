/* ===========================================================
   AL HUD FRAMEWORK — vitals/registry.js
   Mirrors speedometers/registry.js on purpose: the reference HUDs
   the client benchmarked against treat "HUD Theme" as a swappable
   LAYOUT for the vitals row (different icon shapes, bars vs rings,
   etc.), not a color palette. Each theme module implements
   mount(root) / update(state) / destroy(), same contract as a
   speedometer.
   =========================================================== */
(function (AL) {
    "use strict";

    const registry = {};
    function register(name, def) { registry[name] = def; }
    function get(name) { return registry[name] || registry.vitalsTheme1; }
    function list() { return Object.keys(registry); }

    // Shared helper: every vitals theme needs the same 6 stat
    // definitions (icon svg + accent color + accessor). This is
    // just data, not layout, so sharing it doesn't break the
    // "independent module" rule the way shared markup would.
    const STATS = [
        { key: "voice", label: "MIC", color: "var(--vital-mic)", icon: '<path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4"/>', get: (s) => Math.min(100, s.voiceMode * 25) },
        { key: "health", label: "HP", color: "var(--vital-health)", icon: '<path fill="currentColor" stroke="none" d="M12 21s-7.2-4.6-9.7-9.1C.6 8.8 2 5.3 5.4 4.6c1.9-.4 3.8.4 5 1.9l1.6 2 1.6-2c1.2-1.5 3.1-2.3 5-1.9 3.4.7 4.8 4.2 3.1 7.3C19.2 16.4 12 21 12 21Z"/>', get: (s) => s.health },
        { key: "armor", label: "AP", color: "var(--vital-armor)", icon: '<path d="M12 2 4 5v6c0 5 3.4 8.7 8 11 4.6-2.3 8-6 8-11V5l-8-3Z"/>', get: (s) => s.armor },
        { key: "hunger", label: "FOOD", color: "var(--vital-hunger)", icon: '<path d="M11 2v7M8 2v4a1 1 0 0 0 1 1h0a1 1 0 0 0 1-1V2M6 2v4a1 1 0 0 0 1 1h0M8 9v13M16 2c-2 2-2 5-2 8a2 2 0 0 0 2 2v9"/>', get: (s) => s.hunger },
        { key: "thirst", label: "WATER", color: "var(--vital-thirst)", icon: '<path fill="currentColor" stroke="none" d="M12 2s6 7.2 6 11.5a6 6 0 0 1-12 0C6 9.2 12 2 12 2Z"/>', get: (s) => s.thirst },
        { key: "stamina", label: "STAM", color: "var(--vital-stamina)", icon: '<circle cx="13" cy="4" r="2"/><path d="m6 21 3-6 2-2-2-4 4 1 2 3 3 1M9 15l-3 2"/>', get: (s) => 100 - s.stamina }
    ];

    AL.vitalsThemes = { register, get, list, STATS };
})(window.AL = window.AL || {});
