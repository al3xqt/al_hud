/* ===========================================================
   SPEEDOMETER: Digital Arc — Tesla-inspired minimal single ring.
   One clean 270° speed arc, a slim fuel arc beneath the readout,
   and a status-icon strip. Built for the "minimal / premium"
   crowd — this is the framework's default speedometer.
   =========================================================== */
(function (AL) {
    "use strict";
    const { svgEl, ringGeometry, applyRingValue } = AL.speedo;
    const { clamp, createSmoother } = AL.utils;

    function build(root) {
        root.innerHTML = "";
        const svg = svgEl("svg", { viewBox: "0 0 240 240" });

        const R = 100, CX = 120, CY = 120;
        const geo = ringGeometry(R, 270, 135);

        const track = svgEl("circle", {
            cx: CX, cy: CY, r: R, class: "speedo-track",
            "stroke-width": 10,
            transform: `rotate(${geo.rotate} ${CX} ${CY})`,
            "stroke-dasharray": `${geo.sweepLen} ${geo.circumference}`
        });
        const fill = svgEl("circle", {
            cx: CX, cy: CY, r: R, class: "speedo-fill",
            stroke: "url(#alGradSpeed)",
            "stroke-width": 10,
            transform: `rotate(${geo.rotate} ${CX} ${CY})`
        });

        const fuelR = 84;
        const fuelGeo = ringGeometry(fuelR, 60, 150);
        const fuelTrack = svgEl("circle", {
            cx: CX, cy: CY, r: fuelR, class: "speedo-track",
            "stroke-width": 4,
            transform: `rotate(${fuelGeo.rotate} ${CX} ${CY})`,
            "stroke-dasharray": `${fuelGeo.sweepLen} ${fuelGeo.circumference}`
        });
        const fuelFill = svgEl("circle", {
            cx: CX, cy: CY, r: fuelR, class: "speedo-fill",
            stroke: "var(--warn)",
            "stroke-width": 4,
            transform: `rotate(${fuelGeo.rotate} ${CX} ${CY})`
        });

        const defs = svgEl("defs", {});
        const grad = svgEl("linearGradient", { id: "alGradSpeed", x1: "0%", y1: "0%", x2: "100%", y2: "0%" });
        grad.appendChild(svgEl("stop", { offset: "0%", "stop-color": "var(--accent)" }));
        grad.appendChild(svgEl("stop", { offset: "100%", "stop-color": "var(--accent-2)" }));
        defs.appendChild(grad);

        const valueText = svgEl("text", { x: CX, y: CY - 10, "text-anchor": "middle", class: "speedo-value", "font-size": 40 });
        const unitText = svgEl("text", { x: CX, y: CY + 12, "text-anchor": "middle", class: "speedo-unit", "font-size": 11 });
        const gearText = svgEl("text", { x: CX, y: CY + 30, "text-anchor": "middle", class: "speedo-gear", "font-size": 15 });
        const damageText = svgEl("text", { x: CX, y: CY + 46, "text-anchor": "middle", class: "speedo-unit", "font-size": 9 });

        svg.append(defs, track, fill, fuelTrack, fuelFill, valueText, unitText, gearText, damageText);
        root.appendChild(svg);

        const iconRow = document.createElement("div");
        iconRow.className = "speedo-icon-row";
        iconRow.style.cssText = "position:absolute;bottom:0.4rem;left:50%;transform:translateX(-50%);";
        ["engine", "seatbelt", "turbo", "cruise"].forEach((k) => {
            const icon = document.createElement("div");
            icon.className = "speedo-status-icon";
            icon.dataset.icon = k;
            icon.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">${AL.speedo.ICONS[k]}</svg>`;
            iconRow.appendChild(icon);
        });
        root.appendChild(iconRow);

        const nitroGeo = ringGeometry(fuelR, 60, 240);
        const nitroTrack = svgEl("circle", { cx: CX, cy: CY, r: fuelR, class: "speedo-track", "stroke-width": 4, transform: `rotate(${nitroGeo.rotate} ${CX} ${CY})`, "stroke-dasharray": `${nitroGeo.sweepLen} ${nitroGeo.circumference}` });
        const nitroFill = svgEl("circle", { cx: CX, cy: CY, r: fuelR, class: "speedo-fill", stroke: "#8b5cf6", "stroke-width": 4, transform: `rotate(${nitroGeo.rotate} ${CX} ${CY})` });
        svg.append(nitroTrack, nitroFill);

        return {
            svg, fill, fuelFill, nitroFill, nitroTrack, valueText, unitText, gearText, damageText, iconRow,
            speedGeo: geo, fuelGeo, nitroGeo,
            smoothSpeed: createSmoother(0, 0.2)
        };
    }

    let refs = null;

    const mod = {
        mount(root) { refs = build(root); },
        update(state) {
            if (!refs) return;
            refs.smoothSpeed.set(state.speed, (v) => {
                applyRingValue(refs.fill, refs.speedGeo, v / 260);
                refs.valueText.textContent = Math.round(v);
            });
            applyRingValue(refs.fuelFill, refs.fuelGeo, state.fuel / 100);
            refs.unitText.textContent = state.speedUnit;
            refs.gearText.textContent = state.gear;

            const damage = clamp(state.bodyHealth != null ? state.bodyHealth : 100, 0, 100);
            refs.damageText.textContent = "DMG " + Math.round(damage) + "%";
            refs.damageText.classList.toggle("speedo-fuel-low", damage < 35);

            const hasNitro = state.turboEquipped || state.nitroActive || state.nitroLevel > 0;
            refs.nitroTrack.style.display = hasNitro ? "" : "none";
            refs.nitroFill.style.display = hasNitro ? "" : "none";
            applyRingValue(refs.nitroFill, refs.nitroGeo, (state.nitroLevel || 0) / 100);

            const engineIcon = refs.iconRow.querySelector('[data-icon="engine"]');
            const beltIcon = refs.iconRow.querySelector('[data-icon="seatbelt"]');
            const turboIcon = refs.iconRow.querySelector('[data-icon="turbo"]');
            const cruiseIcon = refs.iconRow.querySelector('[data-icon="cruise"]');
            engineIcon.classList.toggle("on", state.engine);
            // Belt icon lights up (in its "warn" red) when NOT buckled.
            beltIcon.classList.toggle("warn", !state.seatbelt);
            beltIcon.classList.toggle("on", !state.seatbelt);
            turboIcon.classList.toggle("on", !!state.turboEquipped);
            cruiseIcon.classList.toggle("on", !!state.cruiseActive);
        },
        destroy() { refs = null; }
    };

    AL.speedo.register("digitalArc", mod);
})(window.AL = window.AL || {});
