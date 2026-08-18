/* ===========================================================
   AL HUD FRAMEWORK — core/utils.js
   Small dependency-free helpers shared by every module.
   Exposed under the global AL.utils namespace (no ES modules —
   FiveM's CEF can choke on type="module" + file:// imports, so
   the whole framework uses plain scripts + a single namespace).
   =========================================================== */
(function (AL) {
    "use strict";

    function clamp(v, min, max) {
        return Math.min(max, Math.max(min, v));
    }

    function lerp(a, b, t) {
        return a + (b - a) * t;
    }

    // Smoothly animates a numeric value toward a target on every rAF tick.
    // Returns a controller you can `.set(target)` repeatedly.
    function createSmoother(initial, speed) {
        let current = initial;
        let target = initial;
        speed = speed || 0.18;
        let raf = null;

        function tick(onUpdate) {
            current = lerp(current, target, speed);
            if (Math.abs(target - current) < 0.05) current = target;
            onUpdate(current);
            if (current !== target) {
                raf = requestAnimationFrame(function () { tick(onUpdate); });
            } else {
                raf = null;
            }
        }

        return {
            set(value, onUpdate) {
                target = value;
                if (!raf) tick(onUpdate);
            },
            stop() {
                if (raf) cancelAnimationFrame(raf);
                raf = null;
            }
        };
    }

    function formatMoney(n) {
        n = Math.round(Number(n) || 0);
        return "$" + n.toLocaleString("en-US");
    }

    // Builds an SVG arc "d" path for a ring segment.
    // cx/cy = center, r = radius, startDeg/endDeg = sweep in degrees (0 = up).
    function describeArc(cx, cy, r, startDeg, endDeg) {
        const toRad = (deg) => (deg - 90) * (Math.PI / 180);
        const start = { x: cx + r * Math.cos(toRad(startDeg)), y: cy + r * Math.sin(toRad(startDeg)) };
        const end = { x: cx + r * Math.cos(toRad(endDeg)), y: cy + r * Math.sin(toRad(endDeg)) };
        const largeArc = endDeg - startDeg <= 180 ? 0 : 1;
        return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`;
    }

    function debounce(fn, wait) {
        let t = null;
        return function (...args) {
            clearTimeout(t);
            t = setTimeout(() => fn.apply(this, args), wait);
        };
    }

    function el(tag, attrs, children) {
        const node = document.createElement(tag);
        if (attrs) {
            for (const k in attrs) {
                if (k === "class") node.className = attrs[k];
                else if (k === "html") node.innerHTML = attrs[k];
                else node.setAttribute(k, attrs[k]);
            }
        }
        (children || []).forEach((c) => node.appendChild(c));
        return node;
    }

    function hexToRgba(hex, alpha) {
        const clean = String(hex || "").replace("#", "");
        const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
        const num = parseInt(full, 16);
        if (isNaN(num)) return null;
        const r = (num >> 16) & 255, g = (num >> 8) & 255, b = num & 255;
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    AL.utils = { clamp, lerp, createSmoother, formatMoney, describeArc, debounce, el, hexToRgba };
})(window.AL = window.AL || {});
