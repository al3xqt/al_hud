/* THEME 1: Badges — colored icon-square + bold amount, no shared
   background per badge. The framework's original money layout. */
(function (AL) {
    "use strict";
    const { TYPES } = AL.moneyThemes;
    const { formatMoney } = AL.utils;

    function build(root) {
        root.className = "badge-row";
        root.innerHTML = TYPES.map((t) => `
            <div class="badge" data-money="${t.key}" style="--money-color:${t.color}">
                <div class="badge-icon" style="background:${t.color}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">${t.icon}</svg></div>
                <b data-val="${t.key}" style="color:${t.color}">$0</b>
            </div>`).join("");
        return {
            wraps: Object.fromEntries(TYPES.map((t) => [t.key, root.querySelector(`[data-money="${t.key}"]`)])),
            vals: Object.fromEntries(TYPES.map((t) => [t.key, root.querySelector(`[data-val="${t.key}"]`)]))
        };
    }

    let refs = null;
    AL.moneyThemes.register("moneyTheme1", {
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
