/* THEME 1: Ringed Icons — conic-gradient progress ring behind each
   stat icon, percentage underneath. This was the framework's
   original (and only) vitals layout — now Theme #1 of several. */
(function (AL) {
    "use strict";
    const { STATS } = AL.vitalsThemes;

    function build(root) {
        root.className = "vitals-row";
        root.innerHTML = STATS.map((s) => `
            <div class="vital ${s.key}" style="--vital-color:${s.color}">
                <div class="vital-ring" data-ring="${s.key}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">${s.icon}</svg></div>
                <small data-val="${s.key}">100%</small>
            </div>`).join("");
        return {
            rings: Object.fromEntries(STATS.map((s) => [s.key, root.querySelector(`[data-ring="${s.key}"]`)])),
            vals: Object.fromEntries(STATS.map((s) => [s.key, root.querySelector(`[data-val="${s.key}"]`)]))
        };
    }

    let refs = null;
    AL.vitalsThemes.register("vitalsTheme1", {
        mount(root) { refs = build(root); },
        update(state) {
            if (!refs) return;
            STATS.forEach((s) => {
                const v = Math.round(AL.utils.clamp(s.get(state), 0, 100));
                refs.vals[s.key].textContent = v + "%";
                refs.rings[s.key].style.setProperty("--pct", v);
                refs.rings[s.key].closest(".vital").classList.toggle("low", s.key !== "voice" && v < 25);
            });
        },
        destroy() { refs = null; }
    });
})(window.AL = window.AL || {});
