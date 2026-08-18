/* ===========================================================
   AL HUD FRAMEWORK — components/offer.js
   Donate-shop promo panel. Behaviour identical to the original
   script.js (showOffer / hideOffer), just event-bus driven now.
   =========================================================== */
(function (AL) {
    "use strict";

    function init() {
        const wrap = document.getElementById("offerWrap");
        if (!wrap) return;

        AL.bus.on("showOffer", () => {
            wrap.classList.add("visible");
            wrap.setAttribute("aria-hidden", "false");
        });
        AL.bus.on("hideOffer", () => {
            wrap.classList.remove("visible");
            wrap.setAttribute("aria-hidden", "true");
        });
    }

    AL.components = AL.components || {};
    AL.components.offer = { init };
})(window.AL = window.AL || {});
