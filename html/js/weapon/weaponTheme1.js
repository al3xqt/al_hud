/* THEME 1: Pill — icon box + weapon name + ammo, horizontal card.
   The framework's original weapon HUD layout, kept as default. */
(function (AL) {
    "use strict";
    const { ICON } = AL.weaponThemes;

    function build(root) {
        root.innerHTML = `
            <div class="weapon-card al-card">
                <div class="weapon-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICON}</svg></div>
                <div class="weapon-copy">
                    <span class="weapon-name" id="wpName">—</span>
                    <span class="weapon-ammo" id="wpAmmo">-- <small>/ --</small></span>
                </div>
            </div>`;
        return { nameEl: root.querySelector("#wpName"), ammoEl: root.querySelector("#wpAmmo") };
    }

    let refs = null;
    AL.weaponThemes.register("weaponTheme1", {
        mount(root) { refs = build(root); },
        update(state) {
            if (!refs) return;
            refs.nameEl.textContent = state.label || AL.i18n.t("weapon_generic");
            refs.ammoEl.innerHTML = `${state.clip} <small>/ ${state.reserve}</small>`;
            refs.ammoEl.classList.toggle("low", state.clip <= Math.max(1, Math.round(state.clipMax * 0.15)));
        },
        destroy() { refs = null; }
    });
})(window.AL = window.AL || {});
