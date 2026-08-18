/* THEME 6: Segmented Dots — a discrete 5-dot meter per stat (each
   dot = 20%) instead of a continuous bar/ring. Reads like a
   signal-strength indicator; the most "gamified" of the six. */
(function (AL) {
    "use strict";
    const { STATS } = AL.vitalsThemes;
    const SEGMENTS = 5;

    function build(root) {
        root.style.cssText = "display:flex;gap:0.55rem;";
        root.innerHTML = STATS.map((s) => `
            <div class="vital ${s.key}" style="display:flex;flex-direction:column;align-items:center;gap:0.25rem;">
                <svg viewBox="0 0 24 24" fill="none" stroke="${s.color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:0.85rem;height:0.85rem;">${s.icon}</svg>
                <div data-dots="${s.key}" style="display:flex;flex-direction:column-reverse;gap:2px;">
                    ${Array.from({ length: SEGMENTS }).map((_, i) => `<span data-dot="${i}" style="width:0.5rem;height:0.22rem;border-radius:1px;background:rgba(255,255,255,0.1);"></span>`).join("")}
                </div>
            </div>`).join("");
        return { dots: Object.fromEntries(STATS.map((s) => [s.key, [...root.querySelectorAll(`[data-dots="${s.key}"] span`)]])) };
    }

    let refs = null;
    AL.vitalsThemes.register("vitalsTheme6", {
        mount(root) { refs = build(root); },
        update(state) {
            if (!refs) return;
            STATS.forEach((s) => {
                const v = AL.utils.clamp(s.get(state), 0, 100);
                const lit = Math.round((v / 100) * SEGMENTS);
                refs.dots[s.key].forEach((dot, i) => {
                    dot.style.background = i < lit ? s.color : "rgba(255,255,255,0.1)";
                });
            });
        },
        destroy() { refs = null; }
    });
})(window.AL = window.AL || {});
