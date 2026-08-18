/* THEME 2: Cards — a small bordered card per money type: label
   small on top, big amount below, colored top border as the accent
   instead of an icon square. Reads more like a dashboard widget. */
(function (AL) {
    "use strict";
    const { TYPES } = AL.moneyThemes;
    const { formatMoney } = AL.utils;

    function build(root) {
        root.style.cssText = "display:flex;gap:0.4rem;flex-wrap:wrap;justify-content:flex-end;";
        root.innerHTML = TYPES.map((t) => `
            <div data-money="${t.key}" style="display:flex;flex-direction:column;align-items:center;gap:0.1rem;padding:0.35rem 0.6rem;border-radius:8px;background:var(--surface-bg);border-top:2px solid ${t.color};min-width:4.2rem;">
                <span style="font-size:0.58rem;font-weight:700;letter-spacing:0.05em;color:var(--text-secondary);">${t.label}</span>
                <b data-val="${t.key}" style="font-family:var(--font-mono);font-size:0.82rem;color:var(--text-primary);">$0</b>
            </div>`).join("");
        return {
            wraps: Object.fromEntries(TYPES.map((t) => [t.key, root.querySelector(`[data-money="${t.key}"]`)])),
            vals: Object.fromEntries(TYPES.map((t) => [t.key, root.querySelector(`[data-val="${t.key}"]`)]))
        };
    }

    let refs = null;
    AL.moneyThemes.register("moneyTheme2", {
        mount(root) { refs = build(root); },
        update(state) {
            if (!refs) return;
            const hidden = state.hiddenBadges || [];
            TYPES.forEach((t) => {
                refs.vals[t.key].textContent = formatMoney(state[t.stateKey]);
                refs.wraps[t.key].style.display = hidden.includes(t.key) ? "none" : "flex";
            });
        },
        destroy() { refs = null; }
    });
})(window.AL = window.AL || {});
