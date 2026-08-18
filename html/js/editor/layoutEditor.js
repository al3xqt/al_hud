/* ===========================================================
   AL HUD FRAMEWORK — editor/layoutEditor.js
   Drag & drop repositioning for every .al-widget. Positions snap
   to a grid, can be locked, and persist through core/storage.js
   (same settings object as the rest of the panel, key "widgets").
   Toggle with F7 or Settings -> Data -> "Open layout editor".
   =========================================================== */
(function (AL) {
    "use strict";
    const { el, clamp } = AL.utils;
    const GRID = 24;

    let dragging = null; // { id, node, startX, startY, origLeft, origTop }
    let editing = false;

    function snap(v) { return Math.round(v / GRID) * GRID; }

    function widgetIds() { return ["playerHud", "speedHud", "weaponHud", "offerWrap"]; }

    function decorateWidget(node, id) {
        node.classList.add("al-widget");
        node.dataset.widgetId = id;

        const badge = el("div", { class: "widget-badge", html: id });
        const toolbar = el("div", { class: "widget-toolbar" });
        const lockBtn = el("button", { html: "🔒", title: "Lock / unlock" });
        const resetBtn = el("button", { html: "↺", title: "Reset position" });
        toolbar.append(lockBtn, resetBtn);
        node.append(badge, toolbar);

        lockBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            const s = AL.settingsStore.get();
            const w = Object.assign({}, s.widgets);
            w[id] = Object.assign({}, w[id], { locked: !(w[id] && w[id].locked) });
            AL.settingsStore.set({ widgets: w });
            node.classList.toggle("locked", w[id].locked);
        });
        resetBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            const s = AL.settingsStore.get();
            const w = Object.assign({}, s.widgets);
            delete w[id].left;
            delete w[id].top;
            AL.settingsStore.set({ widgets: w });
            node.style.left = "";
            node.style.top = "";
            node.style.right = "";
            node.style.bottom = "";
        });

        node.addEventListener("pointerdown", (e) => {
            if (!editing) return;
            const s = AL.settingsStore.get();
            if (s.widgets[id] && s.widgets[id].locked) return;
            const rect = node.getBoundingClientRect();
            dragging = { id, node, startX: e.clientX, startY: e.clientY, origLeft: rect.left, origTop: rect.top };
            node.classList.add("dragging");
            node.setPointerCapture(e.pointerId);
        });
        node.addEventListener("pointermove", (e) => {
            if (!dragging || dragging.node !== node) return;
            const dx = e.clientX - dragging.startX;
            const dy = e.clientY - dragging.startY;
            const left = clamp(dragging.origLeft + dx, 0, window.innerWidth - 40);
            const top = clamp(dragging.origTop + dy, 0, window.innerHeight - 40);
            node.style.left = snap(left) + "px";
            node.style.top = snap(top) + "px";
            node.style.right = "auto";
            node.style.bottom = "auto";
        });
        node.addEventListener("pointerup", (e) => {
            if (!dragging || dragging.node !== node) return;
            node.classList.remove("dragging");
            const s = AL.settingsStore.get();
            const w = Object.assign({}, s.widgets);
            w[id] = Object.assign({}, w[id], {
                left: parseInt(node.style.left, 10),
                top: parseInt(node.style.top, 10)
            });
            AL.settingsStore.set({ widgets: w });
            dragging = null;
        });
    }

    function applySavedPositions() {
        const s = AL.settingsStore.get();
        widgetIds().forEach((id) => {
            const node = document.getElementById(id);
            const w = s.widgets[id];
            if (!node || !w) return;
            if (typeof w.left === "number") { node.style.left = w.left + "px"; node.style.right = "auto"; }
            if (typeof w.top === "number") { node.style.top = w.top + "px"; node.style.bottom = "auto"; }
            node.classList.toggle("locked", !!w.locked);
        });
    }

    function buildBar() {
        const bar = el("div", { id: "editorBar" });
        bar.appendChild(el("button", { html: "Grid: 24px" }));
        const doneBtn = el("button", { class: "primary", html: "Done" });
        bar.appendChild(doneBtn);
        document.body.appendChild(bar);
        doneBtn.addEventListener("click", () => toggle(false));
        return bar;
    }

    let bar = null;

    function toggle(force) {
        editing = typeof force === "boolean" ? force : !editing;
        document.getElementById("alHud").classList.toggle("editing", editing);
        if (bar) bar.classList.toggle("open", editing);
        if (!editing) AL.bus.post("closeUI", {}); // release NUI focus back to the game
    }

    function init() {
        widgetIds().forEach((id) => {
            const node = document.getElementById(id);
            if (node) decorateWidget(node, id);
        });
        applySavedPositions();
        AL.settingsStore.subscribe(applySavedPositions);
        bar = buildBar();

        AL.bus.on("editor:open", () => toggle(true));
        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape" && editing) toggle(false);
        });
    }

    AL.editor = { init, toggle };
})(window.AL = window.AL || {});
