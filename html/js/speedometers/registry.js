/* ===========================================================
   AL HUD FRAMEWORK — speedometers/registry.js
   Each speedometer is a fully independent module (own SVG, own
   layout, own animation, own icon set) that implements:
       mount(rootEl, state)   -> build DOM once
       update(state)          -> patch on data change only
       destroy()               -> cleanup
   This file only holds the registry map + a tiny shared math
   helper for circular-arc gauges (pure trig, not shared design).
   =========================================================== */
(function (AL) {
    "use strict";

    const SVG_NS = "http://www.w3.org/2000/svg";

    function svgEl(tag, attrs) {
        const node = document.createElementNS(SVG_NS, tag);
        for (const k in attrs || {}) node.setAttribute(k, attrs[k]);
        return node;
    }

    // Geometry for a ring gauge that sweeps `sweepDeg` degrees starting at
    // `startDeg` (0 = top, clockwise). Returns everything needed to drive
    // a <circle> via stroke-dasharray/offset as a progress arc.
    function ringGeometry(r, sweepDeg, startDeg) {
        const circumference = 2 * Math.PI * r;
        const sweepLen = (sweepDeg / 360) * circumference;
        return {
            circumference,
            sweepLen,
            rotate: startDeg - 90 // circles start at 3 o'clock by default (SVG), rotate to desired start
        };
    }

    function applyRingValue(circleEl, geometry, fraction) {
        const dash = geometry.sweepLen * AL.utils.clamp(fraction, 0, 1);
        circleEl.setAttribute("stroke-dasharray", `${dash} ${geometry.circumference}`);
    }

    const registry = {};
    function register(name, def) { registry[name] = def; }
    function get(name) { return registry[name] || registry.digitalArc; }
    function list() { return Object.keys(registry); }

    // Shared status-icon set. Every speedometer's icon row uses these
    // instead of single-letter glyphs — pure icon data, not layout, so
    // sharing it doesn't break the "independent module" rule the way
    // shared markup would (same reasoning as the STATS/TYPES data lists).
    const ICONS = {
        engine: '<path d="M12 2v6"/><path d="M18.4 6.6a9 9 0 1 1-12.8 0"/>',
        seatbelt: '<rect x="9" y="2" width="6" height="6" rx="1.5"/><path d="M12 8v13M8 21h8"/>',
        rpmWarn: '<path d="M12 12 16 8M4 12a8 8 0 1 1 16 0"/><circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none"/>',
        turbo: '<path d="M12 2v4M12 18v4M4.9 4.9l2.8 2.8M16.3 16.3l2.8 2.8M2 12h4M18 12h4M4.9 19.1l2.8-2.8M16.3 7.7l2.8-2.8"/><circle cx="12" cy="12" r="3"/>',
        nitro: '<path d="M12 2c2 3 2 5 0 7-2-2-2-4 0-7ZM7 13c1-2 3-3 5-3s4 1 5 3c-1 4-3 7-5 8-2-1-4-4-5-8Z"/>',
        cruise: '<circle cx="12" cy="12" r="9"/><path d="M8 12h8M12 8v8"/>',
        fuel: '<path d="M3 22V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v18M3 22h8M16 7h1.5L20 9.5V19a1 1 0 0 1-2 0v-4h-2"/><path d="M6 10h2"/>',
        damage: '<path d="M12 2 4 5v6c0 5 3.4 8.7 8 11 4.6-2.3 8-6 8-11V5l-8-3Z"/>'
    };

    AL.speedo = { svgEl, ringGeometry, applyRingValue, register, get, list, ICONS, SVG_NS };
})(window.AL = window.AL || {});
