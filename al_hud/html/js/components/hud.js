/* ===========================================================
   AL HUD FRAMEWORK — components/hud.js (v3)
   Renders brand row + identity badges directly (these don't have
   swappable layouts). Vitals and money delegate to whichever
   theme module main.js has mounted — see vitals/registry.js and
   money/registry.js. Registers hud:init / hud:update / hud:visibility.
   =========================================================== */
(function (AL) {
    "use strict";

    const dom = {};

    function cacheDom() {
        dom.playerHud = document.getElementById("playerHud");
        dom.serverName = document.getElementById("serverName");
        dom.playerJob = document.getElementById("playerJob");
        dom.playerJob2 = document.getElementById("playerJob2");
        dom.serverLogo = document.getElementById("serverLogo");
        dom.logoFallback = document.getElementById("logoFallback");
        dom.playerId = document.getElementById("playerId");
        dom.playerOnline = document.getElementById("playerOnline");
        dom.postalCode = document.getElementById("postalCode");
    }

    function render(state) {
        if (!dom.playerHud) return;

        dom.serverName.textContent = state.serverName || "SERVER";
        dom.playerJob.textContent = state.job;
        dom.playerJob2.textContent = state.job2;

        if (state.useLogoImage && state.logoImage) {
            dom.serverLogo.src = state.logoImage;
            dom.serverLogo.style.display = "block";
            dom.logoFallback.style.display = "none";
        } else {
            dom.serverLogo.style.display = "none";
            dom.logoFallback.style.display = "flex";
            dom.logoFallback.textContent = state.logoText || "AL";
        }

        dom.playerId.textContent = state.id;
        dom.playerOnline.textContent = state.online;
        dom.postalCode.textContent = state.postal;

        dom.playerHud.style.display = state.visible ? "flex" : "none";

        if (AL.main) {
            if (AL.main.updateVitals) AL.main.updateVitals(state);
            if (AL.main.updateMoney) AL.main.updateMoney(state);
        }
    }

    function init() {
        cacheDom();
        AL.hudStore.subscribe(render);
        render(AL.hudStore.get());

        AL.bus.on("hud:init", (msg) => {
            AL.hudStore.set(Object.assign({}, msg.data));
        });
        AL.bus.on("hud:update", (msg) => {
            AL.hudStore.set(msg.data);
        });
        AL.bus.on("hud:visibility", (msg) => {
            AL.hudStore.set({ visible: msg.state });
        });
    }

    AL.components = AL.components || {};
    AL.components.hud = { init };
})(window.AL = window.AL || {});
