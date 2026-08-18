/* ===========================================================
   SPEEDOMETER: Carbon Compact — small rectangular telemetry
   strip (not a ring at all): speed, gear, fuel bar and 4 status
   icons in one flat card. Built for players who want minimal
   screen real-estate used.
   =========================================================== */
(function (AL) {
    "use strict";
    const { createSmoother, clamp } = AL.utils;

    function build(root) {
        root.innerHTML = "";
        root.style.cssText = "position:relative;";

        const card = document.createElement("div");
        card.className = "al-card";
        card.style.cssText = "width:15rem;padding:0.7rem 0.9rem;display:flex;flex-direction:column;gap:0.5rem;";

        const top = document.createElement("div");
        top.style.cssText = "display:flex;align-items:baseline;justify-content:space-between;";
        const speedVal = document.createElement("div");
        speedVal.style.cssText = "font-family:var(--font-mono);font-weight:700;font-size:1.9rem;color:var(--text-primary);";
        const unitGear = document.createElement("div");
        unitGear.style.cssText = "text-align:right;";
        const speedUnit = document.createElement("div");
        speedUnit.style.cssText = "font-family:var(--font-mono);font-size:0.6rem;color:var(--text-secondary);";
        const gearVal = document.createElement("div");
        gearVal.style.cssText = "font-family:var(--font-display);font-weight:700;font-size:1.1rem;color:var(--accent);";
        unitGear.append(speedUnit, gearVal);
        top.append(speedVal, unitGear);

        const fuelTrack = document.createElement("div");
        fuelTrack.style.cssText = "height:5px;border-radius:3px;background:var(--ring-track);overflow:hidden;";
        const fuelFill = document.createElement("div");
        fuelFill.style.cssText = "height:100%;background:var(--gradient-primary);width:0%;transition:width 200ms linear;";
        fuelTrack.appendChild(fuelFill);

        const vitalsRow = document.createElement("div");
        vitalsRow.className = "speedo-vitals-row";
        vitalsRow.style.justifyContent = "flex-end";
        const fuelItem = document.createElement("div");
        fuelItem.className = "vitals-item fuel";
        fuelItem.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${AL.speedo.ICONS.fuel}</svg><span>100%</span>`;
        const damageItem = document.createElement("div");
        damageItem.className = "vitals-item damage";
        damageItem.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${AL.speedo.ICONS.damage}</svg><span>100%</span>`;
        vitalsRow.append(fuelItem, damageItem);

        const nitroTrack = document.createElement("div");
        nitroTrack.style.cssText = "height:3px;border-radius:2px;background:rgba(255,255,255,0.06);overflow:hidden;";
        const nitroFill = document.createElement("div");
        nitroFill.style.cssText = "height:100%;background:linear-gradient(90deg,#8b5cf6,#38bdf8);width:0%;transition:width 150ms linear;";
        nitroTrack.appendChild(nitroFill);

        const iconRow = document.createElement("div");
        iconRow.style.cssText = "display:flex;gap:0.4rem;justify-content:flex-end;";
        const icons = {};
        ["engine", "seatbelt", "rpmWarn", "turbo", "cruise"].forEach((key) => {
            const icon = document.createElement("div");
            icon.className = "speedo-status-icon";
            icon.style.cssText += "width:1.1rem;height:1.1rem;";
            icon.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">${AL.speedo.ICONS[key]}</svg>`;
            icons[key] = icon;
            iconRow.appendChild(icon);
        });

        card.append(top, vitalsRow, fuelTrack, nitroTrack, iconRow);
        root.appendChild(card);

        return { speedVal, speedUnit, gearVal, fuelFill, fuelItem, damageItem, nitroFill, nitroTrack, icons, smoothSpeed: createSmoother(0, 0.2) };
    }

    let refs = null;
    AL.speedo.register("carbonCompact", {
        mount(root) { refs = build(root); },
        update(state) {
            if (!refs) return;
            refs.smoothSpeed.set(state.speed, (v) => { refs.speedVal.textContent = Math.round(v); });
            refs.speedUnit.textContent = state.speedUnit;
            refs.gearVal.textContent = state.gear;

            const fuel = clamp(state.fuel, 0, 100);
            refs.fuelFill.style.width = fuel + "%";
            refs.fuelItem.querySelector("span").textContent = Math.round(fuel) + "%";
            refs.fuelItem.classList.toggle("low", fuel < 15);

            const damage = clamp(state.bodyHealth != null ? state.bodyHealth : 100, 0, 100);
            refs.damageItem.querySelector("span").textContent = Math.round(damage) + "%";
            refs.damageItem.classList.toggle("low", damage < 35);

            const hasNitro = state.turboEquipped || state.nitroActive || state.nitroLevel > 0;
            refs.nitroTrack.style.display = hasNitro ? "block" : "none";
            refs.nitroFill.style.width = clamp(state.nitroLevel || 0, 0, 100) + "%";

            refs.icons.engine.classList.toggle("on", state.engine);
            refs.icons.seatbelt.classList.toggle("on", !state.seatbelt);
            refs.icons.seatbelt.classList.toggle("warn", !state.seatbelt);
            refs.icons.rpmWarn.classList.toggle("on", state.rpm > 85);
            refs.icons.rpmWarn.classList.toggle("warn", state.rpm > 85);
            refs.icons.turbo.classList.toggle("on", !!state.turboEquipped);
            refs.icons.cruise.classList.toggle("on", !!state.cruiseActive);
        },
        destroy() { refs = null; }
    });
})(window.AL = window.AL || {});
