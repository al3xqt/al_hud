/* THEME 2: Hex Badges — hexagon-clipped icon badges with a colored
   fill level (bottom-up, like a fuel gauge) and the percentage as
   a small corner label. Distinct silhouette from the ring theme. */
(function (AL) {
    "use strict";
    const { STATS } = AL.vitalsThemes;

    const HEX_CLIP = "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)";

    function build(root) {
        root.style.cssText = "display:flex;gap:0.5rem;";
        root.innerHTML = STATS.map((s) => `
            <div class="vital ${s.key}" style="display:flex;flex-direction:column;align-items:center;gap:0.2rem;">
                <div data-hex="${s.key}" style="position:relative;width:2rem;height:2.1rem;clip-path:${HEX_CLIP};background:rgba(255,255,255,0.08);overflow:hidden;">
                    <div data-fill="${s.key}" style="position:absolute;left:0;right:0;bottom:0;height:50%;background:${s.color};transition:height 220ms ease;"></div>
                    <svg viewBox="0 0 24 24" fill="none" stroke="#0c0c0c" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="position:absolute;inset:0;margin:auto;width:1rem;height:1rem;color:#0c0c0c;filter:drop-shadow(0 0 2px rgba(255,255,255,.5));">${s.icon}</svg>
                </div>
                <small data-val="${s.key}" style="font-family:var(--font-mono);font-size:0.6rem;color:var(--text-secondary);">100%</small>
            </div>`).join("");
        return {
            fills: Object.fromEntries(STATS.map((s) => [s.key, root.querySelector(`[data-fill="${s.key}"]`)])),
            vals: Object.fromEntries(STATS.map((s) => [s.key, root.querySelector(`[data-val="${s.key}"]`)]))
        };
    }

    let refs = null;
    AL.vitalsThemes.register("vitalsTheme2", {
        mount(root) { refs = build(root); },
        update(state) {
            if (!refs) return;
            STATS.forEach((s) => {
                const v = Math.round(AL.utils.clamp(s.get(state), 0, 100));
                refs.vals[s.key].textContent = v + "%";
                refs.fills[s.key].style.height = v + "%";
            });
        },
        destroy() { refs = null; }
    });
})(window.AL = window.AL || {});
