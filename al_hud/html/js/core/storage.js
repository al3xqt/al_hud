/* ===========================================================
   AL HUD FRAMEWORK — core/storage.js
   Persists user customization (theme, speedometer, widget
   positions, sliders) in the CEF browser's localStorage, which
   FiveM's NUI fully supports. This is intentionally separate
   from server-side data — it is purely a *visual preference*,
   the same way a Tebex HUD's client.json works.
   =========================================================== */
(function (AL) {
    "use strict";

    const KEY = "al_hud_settings_v1";

    const DEFAULTS = {
        theme: "glass",
        speedometer: "cashoutStyle",
        vitalsTheme: "vitalsTheme1",
        moneyTheme: "moneyTheme1",
        weaponTheme: "weaponTheme1",
        scale: 1,
        opacity: 1,
        blurMult: 1,
        radiusMult: 1,
        glowMult: 1,
        accentOverride: null,
        hiddenBadges: [],
        badgeColors: {}, // e.g. { cash: "#34d399" } — overrides the active theme's default for that one badge
        showWeaponHud: true,
        logoSize: 1,
        logoShape: "rounded", // rounded | circle
        hideLogo: false,
        showJobTitle: true,
        showJob2: true,
        minimap: { x: 0, y: 0, scale: 1 },
        language: "en",
        showCompassHud: true,
        showCompassStreet: true,
        iconColorOverride: null,
        textColorOverride: null,
        backgroundColorOverride: null,
        backgroundOpacity: 0.55,
        fontOverride: null, // null = theme default; else 'spacegrotesk' | 'rajdhani' | 'oswald' | 'jetbrainsmono'
        speedUnitOverride: null, // null = use server Config.SpeedUnit; else 'KM/H' | 'MPH'
        vehicleScale: 1,
        weaponScale: 1,
        moneyScale: 1,
        vitalsScale: 1,
        widgets: {
            // id -> { x, y, locked }  (x/y are viewport %, so it survives resolution changes)
            playerHud: { x: 1.2, y: 1.2, unit: "rem", locked: false },
            speedHud: { x: null, y: null, unit: "rem", locked: false, anchor: "bottom-right" },
            weaponHud: { x: null, y: null, unit: "rem", locked: false, anchor: "bottom-left" },
            offerWrap: { x: null, y: null, unit: "rem", locked: false, anchor: "top-right" }
        }
    };

    // `isFresh` tells main.js whether this browser has ever saved settings
    // before — used to decide if Config.DefaultTheme / DefaultSpeedometer
    // from Lua should be applied on first load without overwriting a
    // returning player's own choices.
    function load() {
        try {
            const raw = localStorage.getItem(KEY);
            if (!raw) return { settings: JSON.parse(JSON.stringify(DEFAULTS)), isFresh: true };
            const parsed = JSON.parse(raw);
            return {
                settings: Object.assign({}, DEFAULTS, parsed, {
                    widgets: Object.assign({}, DEFAULTS.widgets, parsed.widgets || {})
                }),
                isFresh: false
            };
        } catch (e) {
            console.warn("[AL HUD] settings load failed, using defaults", e);
            return { settings: JSON.parse(JSON.stringify(DEFAULTS)), isFresh: true };
        }
    }

    function save(settings) {
        try {
            localStorage.setItem(KEY, JSON.stringify(settings));
            return true;
        } catch (e) {
            console.warn("[AL HUD] settings save failed", e);
            return false;
        }
    }

    function reset() {
        localStorage.removeItem(KEY);
        return JSON.parse(JSON.stringify(DEFAULTS));
    }

    function exportJSON(settings) {
        return JSON.stringify(settings, null, 2);
    }

    function importJSON(text) {
        const parsed = JSON.parse(text); // caller should try/catch
        return Object.assign({}, DEFAULTS, parsed, {
            widgets: Object.assign({}, DEFAULTS.widgets, parsed.widgets || {})
        });
    }

    AL.storage = { DEFAULTS, load, save, reset, exportJSON, importJSON };
})(window.AL = window.AL || {});
