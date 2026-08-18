/* ===========================================================
   SPEEDOMETER: Neon Ring — thin glowing double ring, huge number,
   8 RPM "zone dots" that light up sequentially like a shift light.
   =========================================================== */
(function (AL) {
    "use strict";
    const { svgEl, ringGeometry, applyRingValue } = AL.speedo;
    const { createSmoother } = AL.utils;

    function build(root) {
        root.innerHTML = "";
        const svg = svgEl("svg", { viewBox: "0 0 240 240" });
        const CX = 120, CY = 120, R = 98;
        const geo = ringGeometry(R, 300, 120);

        const track = svgEl("circle", { cx: CX, cy: CY, r: R, class: "speedo-track", "stroke-width": 3, transform: `rotate(${geo.rotate} ${CX} ${CY})`, "stroke-dasharray": `${geo.sweepLen} ${geo.circumference}` });
        const fill = svgEl("circle", { cx: CX, cy: CY, r: R, class: "speedo-fill", stroke: "var(--accent)", "stroke-width": 3, style: "filter:drop-shadow(0 0 6px var(--accent))", transform: `rotate(${geo.rotate} ${CX} ${CY})` });

        const dotsGroup = svgEl("g", {});
        const dots = [];
        for (let i = 0; i < 8; i++) {
            const angle = 120 + (300 / 7) * i;
            const rad = (angle - 90) * Math.PI / 180;
            const dot = svgEl("circle", {
                cx: CX + (R + 14) * Math.cos(rad),
                cy: CY + (R + 14) * Math.sin(rad),
                r: 3, fill: "var(--chip-bg)"
            });
            dots.push(dot);
            dotsGroup.appendChild(dot);
        }

        const valueText = svgEl("text", { x: CX, y: CY, "text-anchor": "middle", class: "speedo-value", "font-size": 50 });
        const unitText = svgEl("text", { x: CX, y: CY + 24, "text-anchor": "middle", class: "speedo-unit", "font-size": 11 });
        const gearText = svgEl("text", { x: CX, y: CY - 60, "text-anchor": "middle", class: "speedo-gear", "font-size": 18 });

        svg.append(track, fill, dotsGroup, valueText, unitText, gearText);
        root.appendChild(svg);

        const vitalsRow = document.createElement("div");
        vitalsRow.className = "speedo-vitals-row";
        vitalsRow.style.cssText = "position:absolute;bottom:0.5rem;left:50%;transform:translateX(-50%);";
        const fuelItem = document.createElement("div");
        fuelItem.className = "vitals-item fuel";
        fuelItem.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${AL.speedo.ICONS.fuel}</svg><span>100%</span>`;
        const damageItem = document.createElement("div");
        damageItem.className = "vitals-item damage";
        damageItem.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${AL.speedo.ICONS.damage}</svg><span>100%</span>`;
        vitalsRow.append(fuelItem, damageItem);
        root.appendChild(vitalsRow);

        return { fill, dots, valueText, unitText, gearText, fuelItem, damageItem, geo, smoothSpeed: createSmoother(0, 0.22) };
    }

    let refs = null;
    AL.speedo.register("neonRing", {
        mount(root) { refs = build(root); },
        update(state) {
            if (!refs) return;
            refs.smoothSpeed.set(state.speed, (v) => {
                applyRingValue(refs.fill, refs.geo, v / 260);
                refs.valueText.textContent = Math.round(v);
            });
            refs.unitText.textContent = state.speedUnit;
            refs.gearText.textContent = state.gear;

            const lit = Math.round((state.rpm / 100) * refs.dots.length);
            refs.dots.forEach((dot, i) => {
                dot.setAttribute("fill", i < lit ? (i >= refs.dots.length - 2 ? "var(--danger)" : "var(--accent)") : "var(--chip-bg)");
            });

            const fuel = AL.utils.clamp(state.fuel, 0, 100);
            refs.fuelItem.querySelector("span").textContent = Math.round(fuel) + "%";
            refs.fuelItem.classList.toggle("low", fuel < 15);

            const damage = AL.utils.clamp(state.bodyHealth != null ? state.bodyHealth : 100, 0, 100);
            refs.damageItem.querySelector("span").textContent = Math.round(damage) + "%";
            refs.damageItem.classList.toggle("low", damage < 35);
        },
        destroy() { refs = null; }
    });
})(window.AL = window.AL || {});
