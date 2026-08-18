/* ===========================================================
   SPEEDOMETER: F1 Bar — Formula-1 steering-wheel style: a row of
   LED RPM segments across the top, a huge flat speed number, and
   a large gear indicator to the side. No circles at all — this
   is the layout outlier of the set, on purpose.
   =========================================================== */
(function (AL) {
    "use strict";
    const { createSmoother, clamp } = AL.utils;

    const SEGMENTS = 14;

    function build(root) {
        root.innerHTML = "";
        root.style.cssText = "display:flex;flex-direction:column;align-items:flex-end;gap:0.4rem;";

        const ledRow = document.createElement("div");
        ledRow.style.cssText = "display:flex;gap:3px;";
        const leds = [];
        for (let i = 0; i < SEGMENTS; i++) {
            const led = document.createElement("div");
            led.style.cssText = "width:8px;height:14px;border-radius:2px;background:var(--chip-bg);transition:background 60ms linear;";
            leds.push(led);
            ledRow.appendChild(led);
        }

        const readout = document.createElement("div");
        readout.style.cssText = "display:flex;align-items:baseline;gap:1.6rem;background:var(--surface-bg);border:1px solid var(--surface-border);border-radius:calc(var(--surface-radius)*var(--user-radius-mult));padding:0.6rem 1rem;backdrop-filter:blur(var(--surface-blur));";

        const speedBlock = document.createElement("div");
        speedBlock.style.cssText = "display:flex;flex-direction:column;align-items:flex-end;";
        const speedVal = document.createElement("div");
        speedVal.style.cssText = "font-family:var(--font-display);font-weight:800;font-size:2.4rem;line-height:1;color:var(--text-primary);";
        const speedUnit = document.createElement("div");
        speedUnit.style.cssText = "font-family:var(--font-mono);font-size:0.6rem;color:var(--text-secondary);";
        speedBlock.append(speedVal, speedUnit);

        const gearBlock = document.createElement("div");
        gearBlock.style.cssText = "font-family:var(--font-display);font-weight:800;font-size:2.6rem;color:var(--accent);text-shadow:0 0 12px var(--accent);";

        readout.append(speedBlock, gearBlock);
        root.append(ledRow, readout);

        const vitalsRow = document.createElement("div");
        vitalsRow.className = "speedo-vitals-row";
        const fuelItem = document.createElement("div");
        fuelItem.className = "vitals-item fuel";
        fuelItem.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${AL.speedo.ICONS.fuel}</svg><span>100%</span>`;
        const damageItem = document.createElement("div");
        damageItem.className = "vitals-item damage";
        damageItem.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${AL.speedo.ICONS.damage}</svg><span>100%</span>`;
        vitalsRow.append(fuelItem, damageItem);
        root.appendChild(vitalsRow);

        return { leds, speedVal, speedUnit, gearBlock, fuelItem, damageItem, smoothSpeed: createSmoother(0, 0.2) };
    }

    let refs = null;
    AL.speedo.register("f1Bar", {
        mount(root) { refs = build(root); },
        update(state) {
            if (!refs) return;
            refs.smoothSpeed.set(state.speed, (v) => { refs.speedVal.textContent = Math.round(v); });
            refs.speedUnit.textContent = state.speedUnit;
            refs.gearBlock.textContent = state.gear;

            const lit = Math.round(clamp(state.rpm / 100, 0, 1) * SEGMENTS);
            refs.leds.forEach((led, i) => {
                if (i >= lit) { led.style.background = "var(--chip-bg)"; return; }
                const frac = i / SEGMENTS;
                led.style.background = frac > 0.85 ? "var(--danger)" : frac > 0.6 ? "var(--warn)" : "var(--accent)";
            });

            const fuel = clamp(state.fuel, 0, 100);
            refs.fuelItem.querySelector("span").textContent = Math.round(fuel) + "%";
            refs.fuelItem.classList.toggle("low", fuel < 15);

            const damage = clamp(state.bodyHealth != null ? state.bodyHealth : 100, 0, 100);
            refs.damageItem.querySelector("span").textContent = Math.round(damage) + "%";
            refs.damageItem.classList.toggle("low", damage < 35);
        },
        destroy() { refs = null; }
    });
})(window.AL = window.AL || {});
