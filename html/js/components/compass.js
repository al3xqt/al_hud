/* ===========================================================
   AL HUD FRAMEWORK — components/compass.js (v2)
   Renders the full-width scrolling compass tape + street name.
   Driven by client/main.lua's compass:update NUI message (real
   natives: GetEntityHeading / GetGameplayCamRelativeHeading /
   GetStreetNameAtCoord).

   Fix vs v1: tick width used to be a hardcoded 44px constant that
   only matched a 16px root font-size. base.css scales the root
   font-size per resolution (720p vs 4K vs ultrawide), so a fixed
   px value drifted out of sync with the actual rendered tape at
   every resolution except one. Now it's measured live from the
   DOM after each mount/resize, so the heading math is always
   exactly right regardless of screen size or the player's HUD
   scale slider.
   =========================================================== */
(function (AL) {
    "use strict";

    const POINTS = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
    const CARDINALS = ["N", "E", "S", "W"];

    let tape = null, streetEl = null, root = null;
    let tickWidth = 44; // measured on mount/resize; this is just a safe initial guess
    let continuousHeading = null; // unwrapped — can exceed 0..360, so the transition
                                   // never has to animate backwards across a full lap
    let lastStreetLabel = null;

    function buildTape() {
        // Three loops of the 16 points back to back so the tape can
        // scroll continuously without ever showing a seam.
        const loops = 3;
        let html = "";
        for (let loop = 0; loop < loops; loop++) {
            POINTS.forEach((p) => {
                const cls = CARDINALS.includes(p) ? "cardinal" : (p.length <= 2 ? "major" : "");
                html += `<span class="compass-tick ${cls}">${p}</span>`;
            });
        }
        tape.innerHTML = html;
    }

    function measureTickWidth() {
        const firstTick = tape.querySelector(".compass-tick");
        if (firstTick) {
            const w = firstTick.getBoundingClientRect().width;
            if (w > 0) tickWidth = w;
        }
    }

    function renderTransform() {
        if (continuousHeading === null) return;
        const pointsPerLoop = POINTS.length;
        const middleLoopOffset = pointsPerLoop * tickWidth;
        const px = (continuousHeading / 22.5) * tickWidth;
        tape.style.transform = `translateX(${-(middleLoopOffset + px)}px)`;
    }

    // heading arrives wrapped (0..360). Move continuousHeading toward it
    // by the SHORTEST signed path (e.g. 359 -> 0 is +1, not -359), so the
    // CSS transition glides one tick instead of spinning across the tape.
    function applyHeading(heading) {
        if (continuousHeading === null) {
            continuousHeading = heading;
        } else {
            const current = ((continuousHeading % 360) + 360) % 360;
            let delta = ((heading - current + 540) % 360) - 180;
            continuousHeading += delta;
        }
        renderTransform();
    }

    function updateVisibility() {
        if (!root) return;
        const s = AL.settingsStore.get();
        root.classList.toggle("enabled", s.showCompassHud !== false);
        if (streetEl) streetEl.style.display = s.showCompassStreet === false ? "none" : "block";
    }

    function init() {
        root = document.getElementById("compassHud");
        if (!root) return;
        root.innerHTML = `
            <div class="compass-marker"></div>
            <div class="compass-viewport"><div class="compass-tape" id="compassTape"></div></div>
            <div class="compass-street" id="compassStreet">—</div>`;
        tape = document.getElementById("compassTape");
        streetEl = document.getElementById("compassStreet");
        buildTape();
        measureTickWidth();
        updateVisibility();

        // Re-measure on resize/scale changes so the tape stays accurate
        // if the game window or HUD scale changes at runtime.
        window.addEventListener("resize", () => { measureTickWidth(); renderTransform(); });
        AL.settingsStore.subscribe(() => { updateVisibility(); measureTickWidth(); renderTransform(); });

        AL.bus.on("compass:update", (msg) => {
            root.classList.add("visible");
            applyHeading(((msg.data.heading % 360) + 360) % 360);

            if (msg.data.street) {
                let label = msg.data.street;
                if (msg.data.crossStreet) label += ` / ${msg.data.crossStreet}`;
                if (label !== lastStreetLabel) {
                    lastStreetLabel = label;
                    streetEl.classList.add("fading");
                    setTimeout(() => {
                        streetEl.textContent = label;
                        streetEl.classList.remove("fading");
                    }, 260);
                }
            }
        });
    }

    AL.components = AL.components || {};
    AL.components.compass = { init };
})(window.AL = window.AL || {});
