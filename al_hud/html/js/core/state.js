/* ===========================================================
   AL HUD FRAMEWORK — core/state.js
   Tiny pub/sub store. Every component subscribes to the slice
   it cares about instead of the DOM being poked from ten places.
   Keeps the "update UI only when values actually change" rule
   from the spec — updates are only published when data differs.
   =========================================================== */
(function (AL) {
    "use strict";

    function createStore(initial) {
        let state = initial;
        const listeners = new Set();

        function get() { return state; }

        function set(patch) {
            const next = Object.assign({}, state, patch);
            // shallow diff check — skip publish if nothing changed
            let changed = false;
            for (const k in patch) {
                if (patch[k] !== state[k]) { changed = true; break; }
            }
            state = next;
            if (changed) listeners.forEach((fn) => fn(state));
            return changed;
        }

        function subscribe(fn) {
            listeners.add(fn);
            return () => listeners.delete(fn);
        }

        return { get, set, subscribe };
    }

    AL.hudStore = createStore({
        id: 0, online: 0, time: "00:00", postal: "----",
        job: "Unemployed", job2: "No Second Job",
        health: 100, armor: 0, hunger: 100, thirst: 100, stamina: 0, oxygen: 100,
        cash: 0, bank: 0, blackMoney: 0, donateCoins: 0, societyMoney: 0,
        voiceMode: 1, talking: false, isBoss: false,
        serverName: "", logoText: "AL", logoImage: "", useLogoImage: true,
        visible: true
    });

    AL.speedStore = createStore({
        show: false, mode: "car",
        speed: 0, fuel: 0, rpm: 0, gear: "N",
        health: 100, altitude: 0, odometer: 0,
        engine: false, seatbelt: false,
        speedUnit: "KM/H"
    });

    const loaded = AL.storage.load();
    AL.settingsIsFresh = loaded.isFresh;
    AL.settingsStore = createStore(loaded.settings);
})(window.AL = window.AL || {});
