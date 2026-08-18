/* ===========================================================
   SPEEDOMETER: MBUX — Mercedes-inspired dual ring. Outer ring
   tracks RPM (0–8000), inner ring tracks speed, big digital
   readout stacked in the middle like the MBUX widescreen binnacle.
   =========================================================== */
(function (AL) {
    "use strict";
    const { svgEl, ringGeometry, applyRingValue } = AL.speedo;
    const { createSmoother } = AL.utils;

    function build(root) {
        root.innerHTML = "";
        const svg = svgEl("svg", { viewBox: "0 0 240 240" });
        const CX = 120, CY = 120;

        const rpmGeo = ringGeometry(104, 250, 145);
        const rpmTrack = svgEl("circle", { cx: CX, cy: CY, r: 104, class: "speedo-track", "stroke-width": 6, transform: `rotate(${rpmGeo.rotate} ${CX} ${CY})`, "stroke-dasharray": `${rpmGeo.sweepLen} ${rpmGeo.circumference}` });
        const rpmFill = svgEl("circle", { cx: CX, cy: CY, r: 104, class: "speedo-fill", stroke: "var(--accent-2)", "stroke-width": 6, transform: `rotate(${rpmGeo.rotate} ${CX} ${CY})` });

        const spdGeo = ringGeometry(88, 250, 145);
        const spdTrack = svgEl("circle", { cx: CX, cy: CY, r: 88, class: "speedo-track", "stroke-width": 10, transform: `rotate(${spdGeo.rotate} ${CX} ${CY})`, "stroke-dasharray": `${spdGeo.sweepLen} ${spdGeo.circumference}` });
        const spdFill = svgEl("circle", { cx: CX, cy: CY, r: 88, class: "speedo-fill", stroke: "var(--accent)", "stroke-width": 10, transform: `rotate(${spdGeo.rotate} ${CX} ${CY})` });

        const valueText = svgEl("text", { x: CX, y: CY - 2, "text-anchor": "middle", class: "speedo-value", "font-size": 40 });
        const unitText = svgEl("text", { x: CX, y: CY + 18, "text-anchor": "middle", class: "speedo-unit", "font-size": 10 });
        const gearBadge = svgEl("text", { x: CX, y: CY + 42, "text-anchor": "middle", class: "speedo-gear", "font-size": 15 });
        const rpmLabel = svgEl("text", { x: CX, y: 28, "text-anchor": "middle", class: "speedo-unit", "font-size": 9, fill: "var(--accent-2)" });
        rpmLabel.textContent = "RPM x1000";

        svg.append(rpmTrack, rpmFill, spdTrack, spdFill, valueText, unitText, gearBadge, rpmLabel);
        root.appendChild(svg);

        const vitalsRow = document.createElement("div");
        vitalsRow.className = "speedo-vitals-row";
        vitalsRow.style.cssText = "position:absolute;bottom:0.3rem;left:50%;transform:translateX(-50%);";
        const fuelItem = document.createElement("div");
        fuelItem.className = "vitals-item fuel";
        fuelItem.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${AL.speedo.ICONS.fuel}</svg><span>100%</span>`;
        const damageItem = document.createElement("div");
        damageItem.className = "vitals-item damage";
        damageItem.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${AL.speedo.ICONS.damage}</svg><span>100%</span>`;
        vitalsRow.append(fuelItem, damageItem);
        root.appendChild(vitalsRow);

        return { rpmFill, spdFill, valueText, unitText, gearBadge, fuelItem, damageItem, rpmGeo, spdGeo, smoothSpeed: createSmoother(0, 0.2) };
    }

    let refs = null;
    AL.speedo.register("mbux", {
        mount(root) { refs = build(root); },
        update(state) {
            if (!refs) return;
            applyRingValue(refs.rpmFill, refs.rpmGeo, state.rpm / 100);
            refs.smoothSpeed.set(state.speed, (v) => {
                applyRingValue(refs.spdFill, refs.spdGeo, v / 260);
                refs.valueText.textContent = Math.round(v);
            });
            refs.unitText.textContent = state.speedUnit;
            refs.gearBadge.textContent = state.gear;

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
