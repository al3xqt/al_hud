/* ===========================================================
   AL HUD FRAMEWORK — components/weapon.js (v2)
   Mounts the currently-selected weapon HUD theme (see
   html/js/weapon/*.js) and feeds it live ammo data from
   client/main.lua's weapon:update NUI message (real natives:
   GetSelectedPedWeapon / GetAmmoInPedWeapon / GetAmmoInClip).
   =========================================================== */
(function (AL) {
    "use strict";

    let root = null;
    let current = null, currentName = null;
    let lastData = { armed: false };

    function setTheme(name) {
        if (name === currentName) return;
        if (current) current.destroy();
        root.innerHTML = "";
        current = AL.weaponThemes.get(name);
        currentName = name;
        current.mount(root);
        if (lastData.armed) current.update(lastData);
    }

    function render() {
        const enabled = AL.settingsStore.get().showWeaponHud !== false;
        const show = enabled && !!lastData.armed;
        root.classList.toggle("visible", show);
        if (show && current) current.update(lastData);
    }

    function init() {
        root = document.getElementById("weaponHud");
        if (!root) return;

        setTheme(AL.settingsStore.get().weaponTheme || "weaponTheme1");

        AL.bus.on("weapon:update", (msg) => {
            lastData = msg.data || { armed: false };
            render();
        });
        AL.settingsStore.subscribe((s) => {
            setTheme(s.weaponTheme || "weaponTheme1");
            render();
        });
    }

    AL.components = AL.components || {};
    AL.components.weapon = { init, setTheme };
})(window.AL = window.AL || {});
