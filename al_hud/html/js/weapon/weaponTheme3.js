/* THEME 3: Minimal Text — no icon box, no card border, just the
   weapon name and ammo as plain colored text with a text-shadow.
   The most minimal of the three, for players who want almost
   nothing on screen. */
(function (AL) {
    "use strict";

    function build(root) {
        root.innerHTML = `
            <div style="display:flex;align-items:baseline;gap:0.5rem;text-shadow:0 1px 6px rgba(0,0,0,0.7);">
                <span style="font-family:var(--font-display);font-weight:700;font-size:0.75rem;color:var(--text-secondary);text-transform:uppercase;letter-spacing:0.04em;" id="wpName3">—</span>
                <span style="font-family:var(--font-mono);font-weight:700;font-size:1rem;color:var(--accent);" id="wpAmmo3">-- / --</span>
            </div>`;
        return { nameEl: root.querySelector("#wpName3"), ammoEl: root.querySelector("#wpAmmo3") };
    }

    let refs = null;
    AL.weaponThemes.register("weaponTheme3", {
        mount(root) { refs = build(root); },
        update(state) {
            if (!refs) return;
            refs.nameEl.textContent = state.label || AL.i18n.t("weapon_generic");
            refs.ammoEl.textContent = `${state.clip} / ${state.reserve}`;
            refs.ammoEl.style.color = state.clip <= Math.max(1, Math.round(state.clipMax * 0.15)) ? "var(--danger)" : "var(--accent)";
        },
        destroy() { refs = null; }
    });
})(window.AL = window.AL || {});
