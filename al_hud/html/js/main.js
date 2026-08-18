/* ===========================================================
   AL HUD FRAMEWORK — main.js
   Boot sequence. Load order in index.html guarantees every
   AL.* namespace below already exists by the time this runs.
   =========================================================== */
(function (AL) {
    "use strict";

    let currentSpeedo = null, currentSpeedoName = null;
    let currentVitals = null, currentVitalsName = null;
    let currentMoney = null, currentMoneyName = null;

    function setSpeedometer(name) {
        if (name === currentSpeedoName) return;
        const root = document.getElementById("speedoRoot");
        if (currentSpeedo) currentSpeedo.destroy();
        currentSpeedo = AL.speedo.get(name);
        currentSpeedoName = name;
        currentSpeedo.mount(root);
        currentSpeedo.update(AL.speedStore.get());
    }

    function setVitalsTheme(name) {
        if (name === currentVitalsName) return;
        const root = document.getElementById("vitalsRoot");
        if (currentVitals) currentVitals.destroy();
        root.className = "";
        root.style.cssText = ""; // previous theme may have set either/both; start fully clean
        currentVitals = AL.vitalsThemes.get(name);
        currentVitalsName = name;
        currentVitals.mount(root);
        currentVitals.update(AL.hudStore.get());
    }

    function setMoneyTheme(name) {
        if (name === currentMoneyName) return;
        const root = document.getElementById("moneyRoot");
        if (currentMoney) currentMoney.destroy();
        root.className = "";
        root.style.cssText = "";
        currentMoney = AL.moneyThemes.get(name);
        currentMoneyName = name;
        currentMoney.mount(root);
        currentMoney.update(withHidden(AL.hudStore.get()));
    }

    // Money themes need to know which badges the player hid — that
    // lives in settingsStore, not hudStore, so merge it in here
    // rather than making every money theme reach into two stores.
    function withHidden(state) {
        return Object.assign({}, state, { hiddenBadges: AL.settingsStore.get().hiddenBadges || [] });
    }

    function updateVitals(state) { if (currentVitals) currentVitals.update(state); }
    function updateMoney(state) { if (currentMoney) currentMoney.update(withHidden(state)); }

    function renderSpeedHud(state) {
        const wrap = document.getElementById("speedHud");
        wrap.classList.toggle("visible", state.show);
        if (currentSpeedo) currentSpeedo.update(state);
    }

    function init() {
        AL.components.hud.init();
        AL.components.weapon.init();
        AL.components.compass.init();
        AL.components.notifications.init();
        AL.components.offer.init();

        const settings = AL.settingsStore.get();
        setSpeedometer(settings.speedometer);
        setVitalsTheme(settings.vitalsTheme);
        setMoneyTheme(settings.moneyTheme);
        if (AL.i18n) AL.i18n.setLang(settings.language);

        AL.speedStore.subscribe(renderSpeedHud);
        renderSpeedHud(AL.speedStore.get());

        let lastSpeedoData = null;
        function applySpeedoUpdate(data) {
            const merged = Object.assign({}, data);
            const override = AL.settingsStore.get().speedUnitOverride;
            const serverUnit = AL.hudStore.get().speedUnit || "KM/H";
            const unit = override || serverUnit;

            if (override && override !== serverUnit && typeof merged.speedMs === "number") {
                const multiplier = override.indexOf("MPH") !== -1 ? 2.236936 : 3.6;
                merged.speed = Math.round(AL.utils.clamp(merged.speedMs * multiplier, 0, 999));
            }

            AL.speedStore.set(Object.assign({ speedUnit: unit }, merged));
        }

        AL.bus.on("speedo:update", (msg) => {
            lastSpeedoData = msg.data;
            applySpeedoUpdate(lastSpeedoData);
        });
        AL.settingsStore.subscribe(() => { if (lastSpeedoData) applySpeedoUpdate(lastSpeedoData); });

        // Apply Lua's Config.DefaultTheme / DefaultSpeedometer only the very
        // first time this browser ever loads the HUD — a returning player's
        // saved localStorage choices always win.
        AL.bus.on("hud:init", (msg) => {
            if (!AL.settingsIsFresh) return;
            const patch = {};
            if (msg.data.defaultTheme) patch.theme = msg.data.defaultTheme;
            if (msg.data.defaultSpeedometer) patch.speedometer = msg.data.defaultSpeedometer;
            if (msg.data.defaultVitalsTheme) patch.vitalsTheme = msg.data.defaultVitalsTheme;
            if (msg.data.defaultMoneyTheme) patch.moneyTheme = msg.data.defaultMoneyTheme;
            if (msg.data.defaultWeaponTheme) patch.weaponTheme = msg.data.defaultWeaponTheme;
            if (msg.data.defaultLanguage) patch.language = msg.data.defaultLanguage;
            if (Object.keys(patch).length) AL.settingsStore.set(patch);
        });

        AL.settingsPanel.init();
        AL.editor.init();

        document.getElementById("alHud").classList.add("al-enter");
    }

    AL.main = { setSpeedometer, setVitalsTheme, setMoneyTheme, updateVitals, updateMoney };
    document.addEventListener("DOMContentLoaded", init);
})(window.AL = window.AL || {});
