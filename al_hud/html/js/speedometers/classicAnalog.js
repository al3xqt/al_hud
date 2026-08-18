/* ===========================================================
   SPEEDOMETER: Classic Analog — traditional needle gauge with
   tick marks every 20 units, sweeping 240°, digital gear/fuel
   readouts underneath for a modern-retro hybrid.
   =========================================================== */
(function (AL) {
    "use strict";
    const { svgEl, ringGeometry, applyRingValue } = AL.speedo;
    const { createSmoother, clamp } = AL.utils;

    const MAX_SPEED = 260;
    const SWEEP = 240;
    const START = 150;

    function build(root) {
        root.innerHTML = "";
        const svg = svgEl("svg", { viewBox: "0 0 240 240" });
        const CX = 120, CY = 120, R = 100;

        const track = svgEl("circle", { cx: CX, cy: CY, r: R, class: "speedo-track", "stroke-width": 2 });
        svg.appendChild(track);

        const ticks = svgEl("g", {});
        for (let i = 0; i <= 12; i++) {
            const deg = START + (SWEEP / 12) * i;
            const rad = (deg - 90) * Math.PI / 180;
            const inner = R - 10, outer = R;
            const major = i % 2 === 0;
            const line = svgEl("line", {
                x1: CX + inner * Math.cos(rad), y1: CY + inner * Math.sin(rad),
                x2: CX + outer * Math.cos(rad), y2: CY + outer * Math.sin(rad),
                stroke: major ? "var(--text-primary)" : "var(--text-secondary)",
                "stroke-width": major ? 2 : 1
            });
            ticks.appendChild(line);
        }
        svg.appendChild(ticks);

        const needle = svgEl("line", {
            x1: CX, y1: CY, x2: CX, y2: CY - (R - 22),
            stroke: "var(--accent)", "stroke-width": 3, "stroke-linecap": "round",
            style: "filter:drop-shadow(0 0 4px var(--accent))"
        });
        const pivot = svgEl("circle", { cx: CX, cy: CY, r: 5, fill: "var(--accent)" });

        const valueText = svgEl("text", { x: CX, y: CY + 44, "text-anchor": "middle", class: "speedo-value", "font-size": 26 });
        const unitText = svgEl("text", { x: CX, y: CY + 62, "text-anchor": "middle", class: "speedo-unit", "font-size": 10 });
        const gearText = svgEl("text", { x: CX, y: CY - 30, "text-anchor": "middle", class: "speedo-gear", "font-size": 16 });

        const group = svgEl("g", {});
        group.append(needle, pivot);
        svg.append(group, valueText, unitText, gearText);
        root.appendChild(svg);

        const vitalsRow = document.createElement("div");
        vitalsRow.className = "speedo-vitals-row";
        vitalsRow.style.cssText = "position:absolute;bottom:0.6rem;left:50%;transform:translateX(-50%);";
        const fuelItem = document.createElement("div");
        fuelItem.className = "vitals-item fuel";
        fuelItem.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${AL.speedo.ICONS.fuel}</svg><span>100%</span>`;
        const damageItem = document.createElement("div");
        damageItem.className = "vitals-item damage";
        damageItem.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${AL.speedo.ICONS.damage}</svg><span>100%</span>`;
        vitalsRow.append(fuelItem, damageItem);
        root.appendChild(vitalsRow);

        return { needle, valueText, unitText, gearText, fuelItem, damageItem, smoothSpeed: createSmoother(0, 0.16) };
    }

    let refs = null;
    AL.speedo.register("classicAnalog", {
        mount(root) { refs = build(root); },
        update(state) {
            if (!refs) return;
            refs.smoothSpeed.set(state.speed, (v) => {
                const frac = clamp(v / MAX_SPEED, 0, 1);
                const deg = START + SWEEP * frac;
                refs.needle.setAttribute("transform", `rotate(${deg} 120 120)`);
                refs.valueText.textContent = Math.round(v);
            });
            refs.unitText.textContent = state.speedUnit;
            refs.gearText.textContent = state.gear;

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
