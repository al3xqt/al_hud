/* THEME 4: List — vertical stack, one row per money type, label
   on the left / amount on the right, colored left accent bar.
   Reads like a receipt/ledger rather than a HUD strip. */
(function (AL) {
    "use strict";
    const { TYPES } = AL.moneyThemes;
    const { formatMoney } = AL.utils;

    function build(root) {
        root.style.cssText = "display:flex;flex-direction:column;gap:0.25rem;width:10rem;";
        root.innerHTML = TYPES.map((t) => `
            <div data-money="${t.key}" style="display:flex;align-items:center;justify-content:space-between;gap:0.5rem;padding:0.3rem 0.5rem;border-left:3px solid ${t.color};background:var(--chip-bg);border-radius:4px;">
                <span style="font-size:0.62rem;font-weight:600;color:var(--text-secondary);letter-spacing:0.03em;">${t.label}</span>
                <b data-val="${t.key}" style="font-family:var(--font-mono);font-size:0.74rem;color:var(--text-primary);">$0</b>
            </div>`).join("");
        return {
            wraps: Object.fromEntries(TYPES.map((t) => [t.key, root.querySelector(`[data-money="${t.key}"]`)])),
            vals: Object.fromEntries(TYPES.map((t) => [t.key, root.querySelector(`[data-val="${t.key}"]`)]))
        };
    }

    let refs = null;
    AL.moneyThemes.register("moneyTheme4", {
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
