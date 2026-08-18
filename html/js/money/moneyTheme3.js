/* THEME 3: Horizontal Icons — the most compact layout: a colored
   circular icon glued directly to its amount, tightly packed in
   one row with thin dividers instead of separate badge boxes. */
(function (AL) {
    "use strict";
    const { TYPES } = AL.moneyThemes;
    const { formatMoney } = AL.utils;

    function build(root) {
        root.style.cssText = "display:flex;align-items:center;gap:0;background:var(--surface-bg);border-radius:8px;padding:0.3rem 0.6rem;backdrop-filter:blur(calc(var(--surface-blur)*0.6));";
        root.innerHTML = TYPES.map((t, i) => `
            <div data-money="${t.key}" style="display:flex;align-items:center;gap:0.3rem;padding:0 0.5rem;${i > 0 ? "border-left:1px solid var(--chip-border);" : ""}">
                <span style="width:0.55rem;height:0.55rem;border-radius:50%;background:${t.color};flex-shrink:0;"></span>
                <b data-val="${t.key}" style="font-family:var(--font-mono);font-size:0.76rem;color:var(--text-primary);">$0</b>
            </div>`).join("");
        return {
            wraps: Object.fromEntries(TYPES.map((t) => [t.key, root.querySelector(`[data-money="${t.key}"]`)])),
            vals: Object.fromEntries(TYPES.map((t) => [t.key, root.querySelector(`[data-val="${t.key}"]`)]))
        };
    }

    let refs = null;
    AL.moneyThemes.register("moneyTheme3", {
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
