/* THEME 3: Horizontal Bars — stacked list, each row is icon + label
   + a horizontal fill bar + percentage. Reads more like a stats
   panel than a HUD strip; good for players who want labels. */
(function (AL) {
    "use strict";
    const { STATS } = AL.vitalsThemes;

    function build(root) {
        root.style.cssText = "display:flex;flex-direction:column;gap:0.3rem;width:11rem;";
        root.innerHTML = STATS.map((s) => `
            <div class="vital ${s.key}" style="display:flex;align-items:center;gap:0.4rem;">
                <svg viewBox="0 0 24 24" fill="none" stroke="${s.color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:0.85rem;height:0.85rem;flex-shrink:0;">${s.icon}</svg>
                <div style="flex:1;height:5px;border-radius:3px;background:rgba(255,255,255,0.08);overflow:hidden;">
                    <div data-fill="${s.key}" style="height:100%;width:50%;background:${s.color};transition:width 220ms ease;"></div>
                </div>
                <small data-val="${s.key}" style="font-family:var(--font-mono);font-size:0.62rem;color:var(--text-secondary);width:2.2rem;text-align:right;">100%</small>
            </div>`).join("");
        return {
            fills: Object.fromEntries(STATS.map((s) => [s.key, root.querySelector(`[data-fill="${s.key}"]`)])),
            vals: Object.fromEntries(STATS.map((s) => [s.key, root.querySelector(`[data-val="${s.key}"]`)]))
        };
    }

    let refs = null;
    AL.vitalsThemes.register("vitalsTheme3", {
        mount(root) { refs = build(root); },
        update(state) {
            if (!refs) return;
            STATS.forEach((s) => {
                const v = Math.round(AL.utils.clamp(s.get(state), 0, 100));
                refs.vals[s.key].textContent = v + "%";
                refs.fills[s.key].style.width = v + "%";
            });
        },
        destroy() { refs = null; }
    });
})(window.AL = window.AL || {});
