/* THEME 2: Stacked Card — weapon name on top as a small label, big
   centered icon, big ammo readout below. Vertical instead of
   horizontal, closer to a HUD "widget" than a pill. */
(function (AL) {
    "use strict";
    const { ICON } = AL.weaponThemes;

    function build(root) {
        root.innerHTML = `
            <div class="al-card" style="display:flex;flex-direction:column;align-items:center;gap:0.35rem;padding:0.6rem 0.9rem;">
                <span style="font-family:var(--font-display);font-size:0.68rem;font-weight:700;letter-spacing:0.05em;color:var(--text-secondary);text-transform:uppercase;" id="wpName2">—</span>
                <div style="width:2.2rem;height:2.2rem;border-radius:8px;background:var(--chip-bg);display:grid;place-items:center;color:var(--accent);">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1.3rem;height:1.3rem;">${ICON}</svg>
                </div>
                <span style="font-family:var(--font-mono);font-weight:700;font-size:1.1rem;color:var(--text-primary);" id="wpAmmo2">-- <small style="font-size:0.65rem;color:var(--text-secondary);font-weight:500;">/ --</small></span>
            </div>`;
        return { nameEl: root.querySelector("#wpName2"), ammoEl: root.querySelector("#wpAmmo2") };
    }

    let refs = null;
    AL.weaponThemes.register("weaponTheme2", {
        mount(root) { refs = build(root); },
        update(state) {
            if (!refs) return;
            refs.nameEl.textContent = state.label || AL.i18n.t("weapon_generic");
            refs.ammoEl.innerHTML = `${state.clip} <small>/ ${state.reserve}</small>`;
            refs.ammoEl.style.color = state.clip <= Math.max(1, Math.round(state.clipMax * 0.15)) ? "var(--danger)" : "var(--text-primary)";
        },
        destroy() { refs = null; }
    });
})(window.AL = window.AL || {});
