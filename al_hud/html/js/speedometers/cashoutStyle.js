/* ===========================================================
   SPEEDOMETER: Cashout Style — the framework's new default.
   Matches the reference HUD exactly: a small "AUTOMATIC" +
   gearbox row up top, a gear-letter box next to a big padded
   3-digit speed readout with the unit label above it, and a
   thin accent bar underneath that fills with fuel level.
   No SVG at all — plain HTML/CSS, like the reference.
   =========================================================== */
(function (AL) {
    "use strict";
    const { createSmoother, clamp, el } = AL.utils;

    const GEARBOX_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16v6H4zM8 10v10M16 10v10M4 20h16"/></svg>';
    const GEAR_COG_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"/></svg>';

    const TURBO_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v4M12 18v4M4.9 4.9l2.8 2.8M16.3 16.3l2.8 2.8M2 12h4M18 12h4M4.9 19.1l2.8-2.8M16.3 7.7l2.8-2.8"/><circle cx="12" cy="12" r="3"/></svg>';
    const NITRO_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2c2 3 2 5 0 7-2-2-2-4 0-7ZM7 13c1-2 3-3 5-3s4 1 5 3c-1 4-3 7-5 8-2-1-4-4-5-8Z"/></svg>';
    const CRUISE_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M8 12h8M12 8v8"/></svg>';

    function build(root) {
        root.innerHTML = "";
        root.style.cssText = "position:relative;display:flex;flex-direction:column;align-items:flex-end;gap:0.35rem;";

        const topRow = el("div", { style: "display:flex;align-items:center;gap:0.35rem;color:var(--text-secondary);font-family:var(--font-display);font-weight:700;font-size:0.75rem;letter-spacing:0.04em;" });
        const gearboxIcon = el("span", { html: GEARBOX_ICON, style: "width:1rem;height:1rem;display:inline-flex;" });
        const modeLabel = el("span", { html: "AUTOMATIC" });
        topRow.append(gearboxIcon, modeLabel);

        const card = el("div", { class: "al-card", style: "display:flex;align-items:flex-end;gap:0.7rem;padding:0.7rem 1rem;" });

        const gearBox = el("div", { style: "display:flex;flex-direction:column;align-items:center;gap:0.2rem;" });
        const gearLetter = el("div", { id: "cashoutGear", style: "font-family:var(--font-display);font-weight:800;font-size:1.4rem;color:var(--text-primary);line-height:1;" , html: "N" });
        const cogIcon = el("span", { html: GEAR_COG_ICON, style: "width:0.85rem;height:0.85rem;color:var(--text-secondary);" });
        gearBox.append(gearLetter, cogIcon);

        const readout = el("div", { style: "display:flex;flex-direction:column;align-items:flex-end;" });
        const unitLabel = el("div", { id: "cashoutUnit", style: "font-family:var(--font-mono);font-size:0.65rem;color:var(--text-secondary);align-self:flex-end;" });
        const digits = el("div", { id: "cashoutDigits", style: "font-family:var(--font-display);font-weight:800;font-size:2.6rem;line-height:1;color:var(--text-primary);letter-spacing:0.02em;font-variant-numeric:tabular-nums;" });
        readout.append(unitLabel, digits);

        card.append(gearBox, readout);

        // Fuel + damage — always shown, never optional.
        const vitalsRow = el("div", { class: "speedo-vitals-row" });
        const fuelItem = el("div", { class: "vitals-item fuel" });
        fuelItem.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${AL.speedo.ICONS.fuel}</svg><span id="cashoutFuelVal">100%</span>`;
        const damageItem = el("div", { class: "vitals-item damage" });
        damageItem.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${AL.speedo.ICONS.damage}</svg><span id="cashoutDamageVal">100%</span>`;
        vitalsRow.append(fuelItem, damageItem);

        const barTrack = el("div", { style: "width:100%;height:4px;border-radius:2px;background:rgba(255,255,255,0.08);overflow:hidden;" });
        const barFill = el("div", { id: "cashoutFuelBar", style: "height:100%;width:0%;background:var(--gradient-primary);transition:width 200ms linear;" });
        barTrack.appendChild(barFill);

        const nitroTrack = el("div", { style: "width:100%;height:3px;border-radius:2px;background:rgba(255,255,255,0.06);overflow:hidden;" });
        const nitroFill = el("div", { id: "cashoutNitroBar", style: "height:100%;width:0%;background:linear-gradient(90deg,#8b5cf6,#38bdf8);transition:width 150ms linear;" });
        nitroTrack.appendChild(nitroFill);

        const extrasRow = el("div", { style: "display:flex;gap:0.35rem;" });
        const engineIcon = el("span", { class: "speedo-status-icon", html: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">${AL.speedo.ICONS.engine}</svg>` });
        const beltIcon = el("span", { class: "speedo-status-icon", html: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">${AL.speedo.ICONS.seatbelt}</svg>` });
        const turboIcon = el("span", { class: "speedo-status-icon", html: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">${AL.speedo.ICONS.turbo}</svg>` });
        const cruiseIcon = el("span", { class: "speedo-status-icon", html: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">${AL.speedo.ICONS.cruise}</svg>` });
        extrasRow.append(engineIcon, beltIcon, turboIcon, cruiseIcon);

        root.append(topRow, card, vitalsRow, barTrack, nitroTrack, extrasRow);

        return {
            gearLetter, unitLabel, digits, barFill, nitroFill, nitroTrack, turboIcon, cruiseIcon, engineIcon, beltIcon,
            fuelVal: fuelItem.querySelector("#cashoutFuelVal"), fuelItem,
            damageVal: damageItem.querySelector("#cashoutDamageVal"), damageItem,
            smoothSpeed: createSmoother(0, 0.22)
        };
    }

    let refs = null;
    AL.speedo.register("cashoutStyle", {
        mount(root) { refs = build(root); },
        update(state) {
            if (!refs) return;
            refs.smoothSpeed.set(state.speed, (v) => {
                refs.digits.textContent = String(Math.round(clamp(v, 0, 999))).padStart(3, "0");
            });
            refs.unitLabel.textContent = state.speedUnit;
            refs.gearLetter.textContent = state.gear;

            const fuel = clamp(state.fuel, 0, 100);
            refs.barFill.style.width = fuel + "%";
            refs.fuelVal.textContent = Math.round(fuel) + "%";
            refs.fuelItem.classList.toggle("low", fuel < 15);

            const damage = clamp(state.bodyHealth != null ? state.bodyHealth : 100, 0, 100);
            refs.damageVal.textContent = Math.round(damage) + "%";
            refs.damageItem.classList.toggle("low", damage < 35);

            refs.nitroTrack.style.display = state.turboEquipped || state.nitroActive || state.nitroLevel > 0 ? "block" : "none";
            refs.nitroFill.style.width = clamp(state.nitroLevel || 0, 0, 100) + "%";
            refs.nitroFill.style.filter = state.nitroActive ? "drop-shadow(0 0 4px #8b5cf6)" : "none";
            refs.engineIcon.classList.toggle("on", !!state.engine);
            refs.beltIcon.classList.toggle("warn", !state.seatbelt);
            refs.beltIcon.classList.toggle("on", !state.seatbelt);
            refs.turboIcon.classList.toggle("on", !!state.turboEquipped);
            refs.cruiseIcon.classList.toggle("on", !!state.cruiseActive);
        },
        destroy() { refs = null; }
    });
})(window.AL = window.AL || {});
