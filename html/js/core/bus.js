/* ===========================================================
   AL HUD FRAMEWORK — core/bus.js
   Single entry point for every `SendNUIMessage` coming from Lua,
   and a `post()` helper for the reverse direction (NUI -> Lua
   callbacks), used by the layout editor to persist positions
   server-side as a backup to localStorage.
   =========================================================== */
(function (AL) {
    "use strict";

    function getResourceName() {
        return (window.GetParentResourceName && window.GetParentResourceName()) || "al_hud";
    }

    function post(endpoint, data) {
        return fetch(`https://${getResourceName()}/${endpoint}`, {
            method: "POST",
            headers: { "Content-Type": "application/json; charset=UTF-8" },
            body: JSON.stringify(data || {})
        }).catch(() => { /* dev-browser fallback, no Lua host present */ });
    }

    const handlers = {};

    // Multiple modules can care about the same action (e.g. both hud.js
    // and main.js react to "hud:init"), so each action holds a list.
    function on(action, fn) {
        (handlers[action] = handlers[action] || []).push(fn);
    }

    window.addEventListener("message", (event) => {
        const msg = event.data;
        if (!msg || !msg.action) return;
        (handlers[msg.action] || []).forEach((fn) => fn(msg));
    });

    AL.bus = { on, post };
})(window.AL = window.AL || {});
