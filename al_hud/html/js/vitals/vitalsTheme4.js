/* THEME 4: Vertical Bars — icon on top, a vertical fill bar
   (fills bottom-up like a fuel/battery gauge) below it, % at the
   bottom. Six of these side by side reads like a cockpit strip. */
(function (AL) {
    "use strict";
    const { STATS } = AL.vitalsThemes;

    function build(root) {
        root.style.cssText = "display:flex;gap:0.45rem;align-items:flex-end;";
        root.innerHTML = STATS.map((s) => `
            <div class="vital ${s.key}" style="display:flex;flex-direction:column;align-items:center;gap:0.25rem;">
                <svg viewBox="0 0 24 24" fill="none" stroke="${s.color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:0.9rem;height:0.9rem;">${s.icon}</svg>
                <div style="width:0.4rem;height:3rem;border-radius:3px;background:rgba(255,255,255,0.08);display:flex;align-items:flex-end;overflow:hidden;">
                    <div data-fill="${s.key}" style="width:100%;height:50%;background:${s.color};transition:height 220ms ease;"></div>
                </div>
                <small data-val="${s.key}" style="font-family:var(--font-mono);font-size:0.58rem;color:var(--text-secondary);">100%</small>
            </div>`).join("");
        return {
            fills: Object.fromEntries(STATS.map((s) => [s.key, root.querySelector(`[data-fill="${s.key}"]`)])),
            vals: Object.fromEntries(STATS.map((s) => [s.key, root.querySelector(`[data-val="${s.key}"]`)]))
        };
    }

    let refs = null;
    AL.vitalsThemes.register("vitalsTheme4", {
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
