/* THEME 5: Minimal Text — just a colored icon next to a bold
   percentage, no ring or bar at all. The most compact/minimal
   option, for players who find rings/bars visually noisy. */
(function (AL) {
    "use strict";
    const { STATS } = AL.vitalsThemes;

    function build(root) {
        root.style.cssText = "display:flex;gap:0.7rem;";
        root.innerHTML = STATS.map((s) => `
            <div class="vital ${s.key}" style="display:flex;align-items:center;gap:0.3rem;">
                <svg viewBox="0 0 24 24" fill="none" stroke="${s.color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:0.95rem;height:0.95rem;">${s.icon}</svg>
                <b data-val="${s.key}" style="font-family:var(--font-mono);font-weight:700;font-size:0.78rem;color:var(--text-primary);text-shadow:0 1px 6px rgba(0,0,0,0.6);">100%</b>
            </div>`).join("");
        return { vals: Object.fromEntries(STATS.map((s) => [s.key, root.querySelector(`[data-val="${s.key}"]`)])) };
    }

    let refs = null;
    AL.vitalsThemes.register("vitalsTheme5", {
        mount(root) { refs = build(root); },
        update(state) {
            if (!refs) return;
            STATS.forEach((s) => {
                const v = Math.round(AL.utils.clamp(s.get(state), 0, 100));
                refs.vals[s.key].textContent = v + "%";
                refs.vals[s.key].style.color = (s.key !== "voice" && v < 25) ? "var(--danger)" : "var(--text-primary)";
            });
        },
        destroy() { refs = null; }
    });
})(window.AL = window.AL || {});
