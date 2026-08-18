/* ===========================================================
   AL HUD FRAMEWORK — settings/panel.js (v4)
   Full-page settings menu. Same structure as before (sidebar
   categories, grid cards with Select + Make Default), now with
   EN/EL translation: every translatable node carries a
   data-i18n="key" attribute, and applyI18n() re-reads AL.i18n.t()
   into all of them whenever settingsStore.language changes — no
   DOM rebuild, so no risk of duplicate event listeners.
   =========================================================== */
(function (AL) {
    "use strict";
    const { el } = AL.utils;
    const t = (key) => AL.i18n.t(key);

    const PALETTES = [
        { id: "glass", label: "Glass", swatch: "linear-gradient(135deg,#35e6c4,#3ba7ff)" },
        { id: "cyberpunk", label: "Cyberpunk", swatch: "linear-gradient(135deg,#ff2fd6,#17f2ff)" },
        { id: "blackgold", label: "Black & Gold", swatch: "linear-gradient(135deg,#d9b26a,#f4dda0)" },
        { id: "neon-blue", label: "Neon Blue", swatch: "linear-gradient(135deg,#2f9bff,#7fd8ff)" },
        { id: "carbon", label: "Carbon Fiber", swatch: "linear-gradient(135deg,#ff3b3b,#7a7a7a)" }
    ];

    // Speedometer/palette names are treated like product names (kept
    // in English in both languages), same way "iPhone" doesn't get
    // translated — only the surrounding UI chrome does.
    const SPEEDOMETERS = [
        { id: "cashoutStyle", label: "Cashout Style", preview: "digits" },
        { id: "digitalArc", label: "Digital Arc", preview: "arc" },
        { id: "mbux", label: "MBUX Dual Ring", preview: "dualring" },
        { id: "neonRing", label: "Neon Ring", preview: "neon" },
        { id: "classicAnalog", label: "Classic Analog", preview: "needle" },
        { id: "f1Bar", label: "F1 Bar", preview: "leds" },
        { id: "carbonCompact", label: "Carbon Compact", preview: "compact" }
    ];

    const VITALS_LAYOUTS = [
        { id: "vitalsTheme1", i18nKey: "vitals_1", preview: "rings" },
        { id: "vitalsTheme2", i18nKey: "vitals_2", preview: "hex" },
        { id: "vitalsTheme3", i18nKey: "vitals_3", preview: "hbars" },
        { id: "vitalsTheme4", i18nKey: "vitals_4", preview: "vbars" },
        { id: "vitalsTheme5", i18nKey: "vitals_5", preview: "text" },
        { id: "vitalsTheme6", i18nKey: "vitals_6", preview: "dots" }
    ];

    const MONEY_LAYOUTS = [
        { id: "moneyTheme1", i18nKey: "money_1", preview: "badges" },
        { id: "moneyTheme2", i18nKey: "money_2", preview: "cards" },
        { id: "moneyTheme3", i18nKey: "money_3", preview: "horizontal" },
        { id: "moneyTheme4", i18nKey: "money_4", preview: "list" }
    ];

    const WEAPON_LAYOUTS = [
        { id: "weaponTheme1", i18nKey: "weapon_1", preview: "pill" },
        { id: "weaponTheme2", i18nKey: "weapon_2", preview: "stack" },
        { id: "weaponTheme3", i18nKey: "weapon_3", preview: "minimal" }
    ];

    const MONEY_BADGES = [
        { key: "black", i18nKey: "badge_black" },
        { key: "society", i18nKey: "badge_society" },
        { key: "donate", i18nKey: "badge_donate" }
    ];

    // Small illustrative SVG/CSS previews so grid cards actually look
    // like the layout they represent, instead of a flat swatch or
    // two-letter abbreviation.
    const ICONS = {
        gauge: '<path d="M12 12 16 8M4 12a8 8 0 1 1 16 0"/><circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none"/>',
        wallet: '<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="3"/>'
    };
    const iconSvg = (path, color, size) => `<svg viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" style="width:${size || "0.9rem"};height:${size || "0.9rem"};">${path}</svg>`;

    const VITALS_PREVIEW = {
        rings: () => `<div style="display:flex;gap:0.35rem;">${["#f87171", "#a78bfa", "#38bdf8"].map((c) => `<div style="width:1.5rem;height:1.5rem;border-radius:50%;background:conic-gradient(${c} 65%, rgba(255,255,255,.12) 0);display:grid;place-items:center;"><div style="width:1.1rem;height:1.1rem;border-radius:50%;background:#14181a;"></div></div>`).join("")}</div>`,
        hex: () => `<div style="display:flex;gap:0.35rem;">${["#f87171", "#a78bfa", "#38bdf8"].map((c) => `<div style="width:1.4rem;height:1.5rem;clip-path:polygon(25% 0,75% 0,100% 50%,75% 100%,25% 100%,0 50%);background:${c};"></div>`).join("")}</div>`,
        hbars: () => `<div style="display:flex;flex-direction:column;gap:0.28rem;width:4.5rem;">${["#f87171", "#a78bfa", "#38bdf8"].map((c) => `<div style="height:4px;border-radius:2px;background:rgba(255,255,255,.12);"><div style="width:70%;height:100%;border-radius:2px;background:${c};"></div></div>`).join("")}</div>`,
        vbars: () => `<div style="display:flex;gap:0.3rem;align-items:flex-end;">${["#f87171", "#a78bfa", "#38bdf8"].map((c) => `<div style="width:0.35rem;height:2.2rem;border-radius:2px;background:rgba(255,255,255,.12);display:flex;align-items:flex-end;"><div style="width:100%;height:65%;border-radius:2px;background:${c};"></div></div>`).join("")}</div>`,
        text: () => `<div style="display:flex;gap:0.5rem;">${["#f87171", "#a78bfa", "#38bdf8"].map((c) => `<b style="font-family:var(--font-mono);font-size:0.72rem;color:${c};">82%</b>`).join("")}</div>`,
        dots: () => `<div style="display:flex;gap:0.5rem;">${["#f87171", "#a78bfa", "#38bdf8"].map((c) => `<div style="display:flex;flex-direction:column;gap:2px;">${[1, 1, 1, 0, 0].map((on) => `<span style="display:block;width:0.5rem;height:0.16rem;border-radius:1px;background:${on ? c : "rgba(255,255,255,.12)"};"></span>`).join("")}</div>`).join("")}</div>`
    };

    const MONEY_PREVIEW = {
        badges: () => `<div style="display:flex;gap:0.3rem;">${["#34d399", "#60a5fa"].map((c) => `<div style="display:flex;align-items:center;gap:0.25rem;background:rgba(255,255,255,.06);border-radius:6px;padding:0.2rem 0.4rem;"><span style="width:0.9rem;height:0.9rem;border-radius:5px;background:${c};"></span><b style="font-family:var(--font-mono);font-size:0.6rem;">$0</b></div>`).join("")}</div>`,
        cards: () => `<div style="display:flex;gap:0.3rem;">${["#34d399", "#60a5fa"].map((c) => `<div style="display:flex;flex-direction:column;align-items:center;padding:0.2rem 0.5rem;border-radius:6px;background:rgba(255,255,255,.06);border-top:2px solid ${c};"><span style="font-size:0.5rem;color:var(--text-secondary);">CASH</span><b style="font-family:var(--font-mono);font-size:0.62rem;">$0</b></div>`).join("")}</div>`,
        horizontal: () => `<div style="display:flex;align-items:center;background:rgba(255,255,255,.06);border-radius:6px;padding:0.25rem 0.5rem;">${["#34d399", "#60a5fa"].map((c, i) => `<div style="display:flex;align-items:center;gap:0.25rem;padding:0 0.35rem;${i > 0 ? "border-left:1px solid rgba(255,255,255,.12);" : ""}"><span style="width:0.4rem;height:0.4rem;border-radius:50%;background:${c};"></span><b style="font-family:var(--font-mono);font-size:0.58rem;">$0</b></div>`).join("")}</div>`,
        list: () => `<div style="display:flex;flex-direction:column;gap:0.2rem;width:4.5rem;">${["#34d399", "#60a5fa"].map((c) => `<div style="display:flex;justify-content:space-between;padding:0.15rem 0.35rem;border-left:2px solid ${c};background:rgba(255,255,255,.06);border-radius:3px;"><span style="font-size:0.5rem;color:var(--text-secondary);">CASH</span><b style="font-family:var(--font-mono);font-size:0.56rem;">$0</b></div>`).join("")}</div>`
    };

    const WEAPON_PREVIEW = {
        pill: () => `<div style="display:flex;align-items:center;gap:0.35rem;background:rgba(255,255,255,.06);border-radius:999px;padding:0.25rem 0.6rem;"><span style="width:1.1rem;height:1.1rem;border-radius:50%;background:var(--chip-bg);display:grid;place-items:center;color:var(--accent);">›</span><b style="font-family:var(--font-mono);font-size:0.6rem;">40/300</b></div>`,
        stack: () => `<div style="display:flex;flex-direction:column;align-items:center;gap:0.15rem;"><span style="width:1.2rem;height:1.2rem;border-radius:6px;background:rgba(255,255,255,.08);"></span><b style="font-family:var(--font-mono);font-size:0.65rem;">40/300</b></div>`,
        minimal: () => `<b style="font-family:var(--font-mono);font-size:0.68rem;color:var(--accent);">PISTOL 40/300</b>`
    };

    function buildWeaponCard(w) { return buildCard("weapon", w.id, w.i18nKey, WEAPON_PREVIEW[w.preview](), true); }

    const TAB_ICONS = {
        vitals: '<circle cx="12" cy="12" r="9"/><path d="M8 12h1l1.5-3 2 6L14 12h2"/>',
        palette: '<circle cx="12" cy="12" r="9"/><circle cx="9" cy="9" r="1.3" fill="currentColor" stroke="none"/><circle cx="15" cy="9" r="1.3" fill="currentColor" stroke="none"/><circle cx="9" cy="15" r="1.3" fill="currentColor" stroke="none"/>',
        vehicle: ICONS.gauge,
        compass: '<circle cx="12" cy="12" r="10"/><path d="m16.24 7.76-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12Z"/>',
        logo: '<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5-9 9"/>',
        jobs: '<rect x="3" y="7" width="18" height="14" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
        money: ICONS.wallet,
        weapon: '<path d="M2 12h13l3-3v6l-3-3"/><path d="M15 9v6M6 9v6"/>',
        minimap: '<path d="M9 4 4 6v14l5-2 6 2 5-2V4l-5 2-6-2Z"/><path d="M9 4v14M15 6v14"/>',
        appearance: '<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M2 14h4M10 8h4M18 16h4"/>',
        colors: '<circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 21a9 9 0 1 1 0-18c4 0 8 2.5 8 6.5 0 2-2 3.5-4 3.5h-1.5a1.5 1.5 0 0 0-.7 2.8c.4.3.7.8.7 1.3 0 1-1 1.9-2.5 1.9Z"/>',
        data: '<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z"/><path d="M17 21v-8H7v8M7 3v5h8"/>',
        editorEntry: '<path d="M5 9 2 12l3 3M9 5l3-3 3 3M15 19l-3 3-3-3M19 9l3 3-3 3M2 12h20M12 2v20"/>'
    };

    const pushMinimap = AL.utils.debounce((minimap) => {
        AL.bus.post("updateMinimap", minimap);
    }, 150);

    // Re-reads AL.i18n.t() into every [data-i18n] node under the
    // settings panel. Safe to call anytime — cheap DOM walk, no
    // rebuild, so no listener duplication risk.
    function applyI18n() {
        document.querySelectorAll("#alSettings [data-i18n]").forEach((node) => {
            node.textContent = t(node.dataset.i18n);
        });
    }

    function applySettings(s) {
        document.documentElement.setAttribute("data-theme", s.theme);
        const root = document.documentElement.style;
        root.setProperty("--user-scale", s.scale);
        root.setProperty("--user-opacity", s.opacity);
        root.setProperty("--user-blur-mult", s.blurMult);
        root.setProperty("--user-radius-mult", s.radiusMult);
        root.setProperty("--user-glow-mult", s.glowMult);
        root.setProperty("--vehicle-scale", s.vehicleScale != null ? s.vehicleScale : 1);
        root.setProperty("--weapon-scale", s.weaponScale != null ? s.weaponScale : 1);
        root.setProperty("--money-scale", s.moneyScale != null ? s.moneyScale : 1);
        root.setProperty("--vitals-scale", s.vitalsScale != null ? s.vitalsScale : 1);
        if (s.accentOverride) root.setProperty("--accent", s.accentOverride);

        root.setProperty("--logo-size", s.logoSize);
        root.setProperty("--logo-radius", s.logoShape === "circle" ? "50%" : "8px");
        root.setProperty("--logo-display", s.hideLogo ? "none" : "grid");

        const brandLine = document.querySelector(".brand-copy p");
        if (brandLine) {
            brandLine.classList.toggle("hide-job-title", !s.showJobTitle);
            brandLine.classList.toggle("hide-job2", !s.showJob2);
        }

        // Icon color: one override retints every vitals/money icon at
        // once, since they all read these same CSS variables.
        const ICON_VARS = ["--vital-mic", "--vital-health", "--vital-armor", "--vital-hunger", "--vital-thirst", "--vital-stamina", "--money-cash", "--money-black", "--money-bank", "--money-society", "--money-donate"];
        if (s.iconColorOverride) {
            ICON_VARS.forEach((v) => root.setProperty(v, s.iconColorOverride));
        } else {
            ICON_VARS.forEach((v) => root.removeProperty(v));
        }

        if (s.textColorOverride) root.setProperty("--text-primary", s.textColorOverride);
        else root.removeProperty("--text-primary");

        if (s.backgroundColorOverride) {
            const rgba = AL.utils.hexToRgba(s.backgroundColorOverride, s.backgroundOpacity != null ? s.backgroundOpacity : 0.55);
            if (rgba) root.setProperty("--surface-bg", rgba);
        } else {
            root.removeProperty("--surface-bg");
        }

        const FONT_STACKS = {
            rajdhani: "'Rajdhani', sans-serif",
            oswald: "'Oswald', sans-serif",
            jetbrainsmono: "'JetBrains Mono', monospace"
        };
        if (s.fontOverride && FONT_STACKS[s.fontOverride]) root.setProperty("--font-display", FONT_STACKS[s.fontOverride]);
        else root.removeProperty("--font-display");

        const weaponHud = document.getElementById("weaponHud");
        if (weaponHud) weaponHud.dataset.enabled = s.showWeaponHud !== false ? "1" : "0";

        if (s.minimap) pushMinimap(s.minimap);

        if (s.language && s.language !== AL.i18n.lang) {
            AL.i18n.setLang(s.language);
            applyI18n();
        }

        if (AL.main) {
            if (AL.main.setSpeedometer) AL.main.setSpeedometer(s.speedometer);
            if (AL.main.setVitalsTheme) AL.main.setVitalsTheme(s.vitalsTheme);
            if (AL.main.setMoneyTheme) AL.main.setMoneyTheme(s.moneyTheme);
            // money theme needs to re-render when hiddenBadges changes even
            // though the theme id itself didn't — cheapest way is to just
            // push a fresh update using current hud state.
            if (AL.main.updateMoney) AL.main.updateMoney(AL.hudStore.get());
        }
    }

    function toast(key) {
        let node = document.getElementById("alToast");
        if (!node) {
            node = el("div", { id: "alToast", class: "al-toast" });
            document.body.appendChild(node);
        }
        node.textContent = t(key);
        node.classList.add("show");
        clearTimeout(node._timer);
        node._timer = setTimeout(() => node.classList.remove("show"), 2200);
    }

    function buildCard(attrKey, id, i18nKeyOrLabel, previewHtml, translated) {
        const card = el("div", { class: "settings-card", [`data-${attrKey}-id`]: id });
        card.appendChild(el("div", { class: "preview", html: previewHtml }));
        const labelAttrs = translated ? { class: "preview-label", "data-i18n": i18nKeyOrLabel, html: t(i18nKeyOrLabel) } : { class: "preview-label", html: i18nKeyOrLabel };
        card.appendChild(el("div", labelAttrs));
        const actions = el("div", { class: "card-actions" });
        actions.append(
            el("button", { class: "select", "data-i18n": "btn_select", html: t("btn_select") }),
            el("button", { class: "default", "data-i18n": "btn_makeDefault", html: t("btn_makeDefault") })
        );
        card.appendChild(actions);
        return card;
    }

    function buildPaletteCard(p) { return buildCard("palette", p.id, p.label, `<div style="width:100%;height:100%;background:${p.swatch}"></div>`, false); }
    const SPEEDO_PREVIEW = {
        digits: () => `<div style="display:flex;flex-direction:column;align-items:flex-end;gap:0.15rem;"><span style="font-family:var(--font-mono);font-size:0.55rem;color:var(--text-secondary);">KM/H</span><b style="font-family:var(--font-display);font-weight:800;font-size:1.4rem;color:var(--text-primary);">027</b></div>`,
        arc: () => `<svg viewBox="0 0 40 40" style="width:2.2rem;height:2.2rem;"><circle cx="20" cy="20" r="15" fill="none" stroke="rgba(255,255,255,.12)" stroke-width="4"/><path d="M6 26A15 15 0 0 1 30 12" fill="none" stroke="var(--accent)" stroke-width="4" stroke-linecap="round"/></svg>`,
        dualring: () => `<svg viewBox="0 0 40 40" style="width:2.2rem;height:2.2rem;"><circle cx="20" cy="20" r="16" fill="none" stroke="rgba(255,255,255,.1)" stroke-width="2.5"/><path d="M6 25a16 16 0 0 1 22-20" fill="none" stroke="var(--accent-2)" stroke-width="2.5" stroke-linecap="round"/><circle cx="20" cy="20" r="10" fill="none" stroke="rgba(255,255,255,.1)" stroke-width="3.5"/><path d="M11 26a10 10 0 0 1 14-13" fill="none" stroke="var(--accent)" stroke-width="3.5" stroke-linecap="round"/></svg>`,
        neon: () => `<svg viewBox="0 0 40 40" style="width:2.2rem;height:2.2rem;"><circle cx="20" cy="20" r="16" fill="none" stroke="rgba(255,255,255,.08)" stroke-width="1.5"/><path d="M5 27A16 16 0 0 1 33 15" fill="none" stroke="var(--accent)" stroke-width="1.5" stroke-linecap="round" style="filter:drop-shadow(0 0 3px var(--accent));"/><circle cx="33" cy="15" r="1.6" fill="var(--accent)"/></svg>`,
        needle: () => `<svg viewBox="0 0 40 40" style="width:2.2rem;height:2.2rem;"><circle cx="20" cy="20" r="15" fill="none" stroke="rgba(255,255,255,.15)" stroke-width="1.2"/><line x1="20" y1="20" x2="12" y2="10" stroke="var(--accent)" stroke-width="2" stroke-linecap="round"/><circle cx="20" cy="20" r="2" fill="var(--accent)"/></svg>`,
        leds: () => `<div style="display:flex;gap:2px;align-items:flex-end;">${[0.4, 0.6, 0.8, 1, 0.8, 0.6, 0.4].map((h, i) => `<span style="width:3px;height:${h * 14}px;border-radius:1px;background:${i === 3 ? "var(--danger)" : "var(--accent)"};"></span>`).join("")}</div>`,
        compact: () => `<div style="display:flex;flex-direction:column;gap:0.2rem;width:2.4rem;"><b style="font-family:var(--font-mono);font-size:0.85rem;color:var(--text-primary);">27</b><div style="height:3px;border-radius:2px;background:rgba(255,255,255,.12);"><div style="width:60%;height:100%;background:var(--gradient-primary);border-radius:2px;"></div></div></div>`
    };

    function buildSpeedoCard(sp) { return buildCard("speedo", sp.id, sp.label, SPEEDO_PREVIEW[sp.preview](), false); }
    function buildVitalsCard(v) { return buildCard("vitals", v.id, v.i18nKey, VITALS_PREVIEW[v.preview](), true); }
    function buildMoneyCard(m) { return buildCard("money", m.id, m.i18nKey, MONEY_PREVIEW[m.preview](), true); }

    function row(labelKey, controlNode) {
        const r = el("div", { class: "settings-row" });
        r.appendChild(el("label", { "data-i18n": labelKey, html: t(labelKey) }));
        r.appendChild(controlNode);
        return r;
    }

    function scaleRow(storeKey, labelKey) {
        const controlWrap = el("div", { class: "row-control" });
        controlWrap.append(
            el("input", { type: "range", min: "0.6", max: "1.6", step: "0.05", "data-slider": storeKey }),
            el("span", { class: "row-value", "data-slider-value": storeKey })
        );
        return row(labelKey, controlWrap);
    }

    function buildPanel() {
        const overlay = el("div", { id: "alSettings" });
        const panel = el("div", { class: "settings-panel" });

        const sidebar = el("div", { class: "settings-sidebar" });
        sidebar.appendChild(el("h2", { "data-i18n": "appName", html: t("appName") }));
        sidebar.appendChild(el("p", { class: "settings-sidebar-sub", "data-i18n": "appSubtitle", html: t("appSubtitle") }));
        const tabs = [
            { id: "vitals", key: "tab_vitals" },
            { id: "palette", key: "tab_palette" },
            { id: "vehicle", key: "tab_vehicle" },
            { id: "compass", key: "tab_compass" },
            { id: "logo", key: "tab_logo" },
            { id: "jobs", key: "tab_jobs" },
            { id: "money", key: "tab_money" },
            { id: "weapon", key: "tab_weapon" },
            { id: "minimap", key: "tab_minimap" },
            { id: "appearance", key: "tab_appearance" },
            { id: "colors", key: "tab_colors" },
            { id: "data", key: "tab_data" },
            { id: "editorEntry", key: "tab_editor" }
        ];
        tabs.forEach((tab, i) => {
            const iconHtml = `<svg class="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${TAB_ICONS[tab.id] || ""}</svg>`;
            const node = el("div", { class: "settings-tab" + (i === 0 ? " active" : ""), "data-tab": tab.id });
            node.innerHTML = iconHtml + `<span data-i18n="${tab.key}">${t(tab.key)}</span>`;
            sidebar.appendChild(node);
        });

        const main = el("div", { class: "settings-main" });
        const topbar = el("div", { class: "settings-topbar" });
        const makeServerDefaultBtn = el("div", { class: "settings-topbtn accent", "data-i18n": "btn_makeServerDefault", html: t("btn_makeServerDefault") });
        const spacer = el("div", { class: "spacer" });
        const close = el("div", { class: "settings-close", html: "&times;" });
        topbar.append(makeServerDefaultBtn, spacer, close);

        const bodies = {};
        tabs.forEach((tab, i) => {
            if (tab.id === "editorEntry") return; // no body — clicking it just opens the editor
            bodies[tab.id] = el("div", { class: "settings-body" + (i === 0 ? " active" : ""), "data-body": tab.id });
            main.appendChild(bodies[tab.id]);
        });

        // -- HUD Themes tab (vitals row layout)
        bodies.vitals.appendChild(el("h3", { "data-i18n": "heading_vitals", html: t("heading_vitals") }));
        bodies.vitals.appendChild(el("p", { class: "hint", "data-i18n": "hint_vitals", html: t("hint_vitals") }));
        const vitalsGrid = el("div", { class: "settings-grid" });
        VITALS_LAYOUTS.forEach((v) => vitalsGrid.appendChild(buildVitalsCard(v)));
        bodies.vitals.appendChild(vitalsGrid);
        bodies.vitals.appendChild(scaleRow("vitalsScale", "label_vitalsScale"));

        // -- Color Palette tab
        bodies.palette.appendChild(el("h3", { "data-i18n": "heading_palette", html: t("heading_palette") }));
        bodies.palette.appendChild(el("p", { class: "hint", "data-i18n": "hint_palette", html: t("hint_palette") }));
        const paletteGrid = el("div", { class: "settings-grid" });
        PALETTES.forEach((p) => paletteGrid.appendChild(buildPaletteCard(p)));
        bodies.palette.appendChild(paletteGrid);

        // -- Vehicle tab
        bodies.vehicle.appendChild(el("h3", { "data-i18n": "heading_vehicle", html: t("heading_vehicle") }));
        bodies.vehicle.appendChild(el("p", { class: "hint", "data-i18n": "hint_vehicle", html: t("hint_vehicle") }));
        const speedoGrid = el("div", { class: "settings-grid" });
        SPEEDOMETERS.forEach((sp) => speedoGrid.appendChild(buildSpeedoCard(sp)));
        bodies.vehicle.appendChild(speedoGrid);
        bodies.vehicle.appendChild(scaleRow("vehicleScale", "label_vehicleScale"));
        const unitControl = el("div", { class: "row-control" });
        unitControl.append(
            el("button", { class: "settings-topbtn", "data-unit": "", "data-i18n": "unit_server", html: t("unit_server") }),
            el("button", { class: "settings-topbtn", "data-unit": "KM/H", html: "KM/H" }),
            el("button", { class: "settings-topbtn", "data-unit": "MPH", html: "MPH" })
        );
        bodies.vehicle.appendChild(row("label_speedUnit", unitControl));

        // -- Compass tab
        bodies.compass.appendChild(el("h3", { "data-i18n": "heading_compass", html: t("heading_compass") }));
        bodies.compass.appendChild(el("p", { class: "hint", "data-i18n": "hint_compass", html: t("hint_compass") }));
        bodies.compass.appendChild(row("label_showCompassHud", el("div", { class: "settings-toggle", id: "compassToggle" })));
        bodies.compass.appendChild(row("label_showCompassStreet", el("div", { class: "settings-toggle", id: "compassStreetToggle" })));

        // -- Logo tab
        bodies.logo.appendChild(el("h3", { "data-i18n": "heading_logo", html: t("heading_logo") }));
        bodies.logo.appendChild(el("p", { class: "hint", "data-i18n": "hint_logo", html: t("hint_logo") }));
        bodies.logo.appendChild(row("label_hideLogo", el("div", { class: "settings-toggle", id: "logoHideToggle" })));

        const logoSizeControl = el("div", { class: "row-control" });
        logoSizeControl.append(
            el("input", { type: "range", min: "0.6", max: "1.8", step: "0.05", "data-slider": "logoSize" }),
            el("span", { class: "row-value", "data-slider-value": "logoSize" })
        );
        bodies.logo.appendChild(row("label_logoSize", logoSizeControl));

        const shapeControl = el("div", { class: "row-control" });
        shapeControl.append(
            el("button", { class: "settings-topbtn", "data-shape": "rounded", "data-i18n": "shape_rounded", html: t("shape_rounded") }),
            el("button", { class: "settings-topbtn", "data-shape": "circle", "data-i18n": "shape_circle", html: t("shape_circle") })
        );
        bodies.logo.appendChild(row("label_logoShape", shapeControl));

        // -- Jobs tab
        bodies.jobs.appendChild(el("h3", { "data-i18n": "heading_jobs", html: t("heading_jobs") }));
        bodies.jobs.appendChild(el("p", { class: "hint", "data-i18n": "hint_jobs", html: t("hint_jobs") }));
        bodies.jobs.appendChild(row("label_showJobTitle", el("div", { class: "settings-toggle", id: "jobTitleToggle" })));
        bodies.jobs.appendChild(row("label_showJob2", el("div", { class: "settings-toggle", id: "job2Toggle" })));

        // -- Money tab (layout grid + per-badge visibility)
        bodies.money.appendChild(el("h3", { "data-i18n": "heading_money", html: t("heading_money") }));
        bodies.money.appendChild(el("p", { class: "hint", "data-i18n": "hint_money", html: t("hint_money") }));
        const moneyGrid = el("div", { class: "settings-grid" });
        MONEY_LAYOUTS.forEach((m) => moneyGrid.appendChild(buildMoneyCard(m)));
        bodies.money.appendChild(moneyGrid);
        MONEY_BADGES.forEach((b) => {
            bodies.money.appendChild(row(b.i18nKey, el("div", { class: "settings-toggle", "data-badge-toggle": b.key })));
        });
        bodies.money.appendChild(scaleRow("moneyScale", "label_moneyScale"));

        // -- Weapon tab
        bodies.weapon.appendChild(el("h3", { "data-i18n": "heading_weapon", html: t("heading_weapon") }));
        bodies.weapon.appendChild(el("p", { class: "hint", "data-i18n": "hint_weapon", html: t("hint_weapon") }));
        bodies.weapon.appendChild(row("label_showWeaponHud", el("div", { class: "settings-toggle", id: "weaponToggle" })));
        const weaponGrid = el("div", { class: "settings-grid" });
        WEAPON_LAYOUTS.forEach((w) => weaponGrid.appendChild(buildWeaponCard(w)));
        bodies.weapon.appendChild(weaponGrid);
        bodies.weapon.appendChild(scaleRow("weaponScale", "label_weaponScale"));

        // -- Minimap tab
        bodies.minimap.appendChild(el("h3", { "data-i18n": "heading_minimap", html: t("heading_minimap") }));
        bodies.minimap.appendChild(el("p", { class: "hint", "data-i18n": "hint_minimap", html: t("hint_minimap") }));
        const minimapSliders = [
            { key: "x", labelKey: "label_minimapX", min: -0.3, max: 0.3, step: 0.005 },
            { key: "y", labelKey: "label_minimapY", min: -0.3, max: 0.3, step: 0.005 },
            { key: "scale", labelKey: "label_minimapScale", min: 0.6, max: 1.6, step: 0.02 }
        ];
        minimapSliders.forEach((s) => {
            const controlWrap = el("div", { class: "row-control" });
            controlWrap.append(
                el("input", { type: "range", min: s.min, max: s.max, step: s.step, "data-minimap-slider": s.key }),
                el("span", { class: "row-value", "data-minimap-value": s.key })
            );
            bodies.minimap.appendChild(row(s.labelKey, controlWrap));
        });
        bodies.minimap.appendChild(el("div", { class: "settings-btn", "data-i18n": "btn_minimapReset", html: t("btn_minimapReset"), id: "btnMinimapReset" }));

        // -- Appearance tab (sliders + language)
        bodies.appearance.appendChild(el("h3", { "data-i18n": "heading_appearance", html: t("heading_appearance") }));
        const sliders = [
            { key: "scale", labelKey: "label_scale", min: 0.7, max: 1.3, step: 0.01 },
            { key: "opacity", labelKey: "label_opacity", min: 0.3, max: 1, step: 0.01 },
            { key: "blurMult", labelKey: "label_blur", min: 0, max: 2, step: 0.05 },
            { key: "radiusMult", labelKey: "label_radius", min: 0, max: 2, step: 0.05 },
            { key: "glowMult", labelKey: "label_glow", min: 0, max: 2, step: 0.05 }
        ];
        sliders.forEach((s) => {
            const controlWrap = el("div", { class: "row-control" });
            controlWrap.append(
                el("input", { type: "range", min: s.min, max: s.max, step: s.step, "data-slider": s.key }),
                el("span", { class: "row-value", "data-slider-value": s.key })
            );
            bodies.appearance.appendChild(row(s.labelKey, controlWrap));
        });
        bodies.appearance.appendChild(row("label_accent", el("input", { type: "color", "data-accent": "1" })));

        const langControl = el("div", { class: "row-control" });
        langControl.append(
            el("button", { class: "settings-topbtn", "data-lang": "en", html: "EN" }),
            el("button", { class: "settings-topbtn", "data-lang": "el", html: "EL" })
        );
        bodies.appearance.appendChild(row("label_language", langControl));

        // -- Colors & Text tab
        bodies.colors.appendChild(el("h3", { "data-i18n": "heading_colors", html: t("heading_colors") }));
        bodies.colors.appendChild(el("p", { class: "hint", "data-i18n": "hint_colors", html: t("hint_colors") }));

        const iconColorControl = el("div", { class: "row-control" });
        iconColorControl.append(
            el("input", { type: "color", "data-color-override": "iconColorOverride", value: "#35e6c4" }),
            el("button", { class: "settings-topbtn", "data-color-reset": "iconColorOverride", "data-i18n": "btn_reset", html: t("btn_reset") })
        );
        bodies.colors.appendChild(row("label_iconColor", iconColorControl));

        const textColorControl = el("div", { class: "row-control" });
        textColorControl.append(
            el("input", { type: "color", "data-color-override": "textColorOverride", value: "#f3f8f7" }),
            el("button", { class: "settings-topbtn", "data-color-reset": "textColorOverride", "data-i18n": "btn_reset", html: t("btn_reset") })
        );
        bodies.colors.appendChild(row("label_textColor", textColorControl));

        const bgColorControl = el("div", { class: "row-control" });
        bgColorControl.append(
            el("input", { type: "color", "data-color-override": "backgroundColorOverride", value: "#0e1618" }),
            el("button", { class: "settings-topbtn", "data-color-reset": "backgroundColorOverride", "data-i18n": "btn_reset", html: t("btn_reset") })
        );
        bodies.colors.appendChild(row("label_bgColor", bgColorControl));

        const bgOpacityControl = el("div", { class: "row-control" });
        bgOpacityControl.append(
            el("input", { type: "range", min: "0.1", max: "1", step: "0.05", "data-slider": "backgroundOpacity" }),
            el("span", { class: "row-value", "data-slider-value": "backgroundOpacity" })
        );
        bodies.colors.appendChild(row("label_bgOpacity", bgOpacityControl));

        const fontControl = el("div", { class: "row-control" });
        [["", "Default"], ["rajdhani", "Rajdhani"], ["oswald", "Oswald"], ["jetbrainsmono", "Mono"]].forEach(([val, label]) => {
            fontControl.appendChild(el("button", { class: "settings-topbtn", "data-font": val, html: label }));
        });
        bodies.colors.appendChild(row("label_font", fontControl));

        // -- Data tab
        bodies.data.appendChild(el("h3", { "data-i18n": "heading_data", html: t("heading_data") }));
        const exportBtn = el("div", { class: "settings-btn primary", "data-i18n": "btn_export", html: t("btn_export"), id: "btnExport" });
        const importBtn = el("div", { class: "settings-btn", "data-i18n": "btn_import", html: t("btn_import"), id: "btnImport" });
        const resetBtn = el("div", { class: "settings-btn", "data-i18n": "btn_reset", html: t("btn_reset"), id: "btnReset" });
        [exportBtn, importBtn, resetBtn].forEach((b) => { b.style.marginBottom = "0.5rem"; bodies.data.appendChild(b); });
        const importArea = el("textarea", {
            id: "importArea",
            style: "width:100%;height:8rem;margin-top:0.5rem;background:var(--chip-bg);border:1px solid var(--chip-border);border-radius:8px;color:var(--text-primary);font-family:var(--font-mono);font-size:0.65rem;padding:0.5rem;display:none;"
        });
        bodies.data.appendChild(importArea);

        main.append(topbar, ...Object.values(bodies));
        panel.append(sidebar, main);
        overlay.appendChild(panel);
        document.body.appendChild(overlay);

        return { overlay, sidebar, close, vitalsGrid, paletteGrid, speedoGrid, moneyGrid, weaponGrid, bodies, sliders, importArea, makeServerDefaultBtn };
    }

    function init() {
        const ui = buildPanel();
        const store = AL.settingsStore;
        const PER_WIDGET_SCALES = ["vehicleScale", "weaponScale", "moneyScale", "vitalsScale"];

        let serverDefaults = {};
        let pendingDefaults = {};
        const kindToGrid = { theme: [ui.paletteGrid, "palette"], speedometer: [ui.speedoGrid, "speedo"], vitalsTheme: [ui.vitalsGrid, "vitals"], moneyTheme: [ui.moneyGrid, "money"], weaponTheme: [ui.weaponGrid, "weapon"] };

        function markServerDefaults() {
            Object.entries(kindToGrid).forEach(([kind, [grid, attrKey]]) => {
                const defaultId = serverDefaults[kind];
                grid.querySelectorAll(".settings-card").forEach((card) => {
                    const isDefault = !!defaultId && card.dataset[attrKey + "Id"] === defaultId;
                    card.querySelector(".default").classList.toggle("is-default", isDefault);
                });
            });
        }

        function syncGrid(grid, attrKey, currentId) {
            grid.querySelectorAll(".settings-card").forEach((n) => n.classList.toggle("selected", n.dataset[attrKey + "Id"] === currentId));
        }

        function syncUI(s) {
            syncGrid(ui.paletteGrid, "palette", s.theme);
            syncGrid(ui.speedoGrid, "speedo", s.speedometer);
            syncGrid(ui.vitalsGrid, "vitals", s.vitalsTheme);
            syncGrid(ui.moneyGrid, "money", s.moneyTheme);
            syncGrid(ui.weaponGrid, "weapon", s.weaponTheme);

            ui.sliders.forEach((sl) => {
                const input = ui.overlay.querySelector(`[data-slider="${sl.key}"]`);
                const valueEl = ui.overlay.querySelector(`[data-slider-value="${sl.key}"]`);
                if (input) input.value = s[sl.key];
                if (valueEl) valueEl.textContent = Number(s[sl.key]).toFixed(2);
            });
            ui.overlay.querySelectorAll("[data-badge-toggle]").forEach((tog) => {
                tog.classList.toggle("on", !(s.hiddenBadges || []).includes(tog.dataset.badgeToggle));
            });

            const weaponToggle = document.getElementById("weaponToggle");
            if (weaponToggle) weaponToggle.classList.toggle("on", s.showWeaponHud !== false);
            const compassToggle = document.getElementById("compassToggle");
            if (compassToggle) compassToggle.classList.toggle("on", s.showCompassHud !== false);
            const compassStreetToggle = document.getElementById("compassStreetToggle");
            if (compassStreetToggle) compassStreetToggle.classList.toggle("on", s.showCompassStreet !== false);
            const logoHideToggle = document.getElementById("logoHideToggle");
            if (logoHideToggle) logoHideToggle.classList.toggle("on", !!s.hideLogo);
            const jobTitleToggle = document.getElementById("jobTitleToggle");
            if (jobTitleToggle) jobTitleToggle.classList.toggle("on", s.showJobTitle !== false);
            const job2Toggle = document.getElementById("job2Toggle");
            if (job2Toggle) job2Toggle.classList.toggle("on", s.showJob2 !== false);
            ui.overlay.querySelectorAll("[data-shape]").forEach((btn) => {
                btn.classList.toggle("accent", btn.dataset.shape === (s.logoShape || "rounded"));
            });
            ui.overlay.querySelectorAll("[data-lang]").forEach((btn) => {
                btn.classList.toggle("accent", btn.dataset.lang === (s.language || "en"));
            });
            const logoSizeInput = ui.overlay.querySelector('[data-slider="logoSize"]');
            const logoSizeValue = ui.overlay.querySelector('[data-slider-value="logoSize"]');
            if (logoSizeInput) logoSizeInput.value = s.logoSize;
            if (logoSizeValue) logoSizeValue.textContent = Number(s.logoSize).toFixed(2);

            const bgOpacityInput = ui.overlay.querySelector('[data-slider="backgroundOpacity"]');
            const bgOpacityValue = ui.overlay.querySelector('[data-slider-value="backgroundOpacity"]');
            if (bgOpacityInput) bgOpacityInput.value = s.backgroundOpacity;
            if (bgOpacityValue) bgOpacityValue.textContent = Number(s.backgroundOpacity).toFixed(2);

            PER_WIDGET_SCALES.forEach((key) => {
                const input = ui.overlay.querySelector(`[data-slider="${key}"]`);
                const val = ui.overlay.querySelector(`[data-slider-value="${key}"]`);
                if (input) input.value = s[key];
                if (val) val.textContent = Number(s[key]).toFixed(2);
            });

            ui.overlay.querySelectorAll("[data-color-override]").forEach((input) => {
                if (s[input.dataset.colorOverride]) input.value = s[input.dataset.colorOverride];
            });
            ui.overlay.querySelectorAll("[data-font]").forEach((btn) => {
                btn.classList.toggle("accent", btn.dataset.font === (s.fontOverride || ""));
            });
            ui.overlay.querySelectorAll("[data-unit]").forEach((btn) => {
                btn.classList.toggle("accent", btn.dataset.unit === (s.speedUnitOverride || ""));
            });

            const minimap = s.minimap || { x: 0, y: 0, scale: 1 };
            ["x", "y", "scale"].forEach((k) => {
                const input = ui.overlay.querySelector(`[data-minimap-slider="${k}"]`);
                const valueEl = ui.overlay.querySelector(`[data-minimap-value="${k}"]`);
                if (input) input.value = minimap[k];
                if (valueEl) valueEl.textContent = Number(minimap[k]).toFixed(3);
            });
        }

        store.subscribe((s) => { applySettings(s); syncUI(s); AL.storage.save(s); });
        applySettings(store.get());
        syncUI(store.get());

        // tab switching
        ui.sidebar.querySelectorAll(".settings-tab").forEach((tab) => {
            tab.addEventListener("click", () => {
                if (tab.dataset.tab === "editorEntry") {
                    ui.overlay.classList.remove("open"); // hide only, keep NUI focus
                    AL.editor.toggle(true);
                    return;
                }
                ui.sidebar.querySelectorAll(".settings-tab").forEach((tb) => tb.classList.remove("active"));
                tab.classList.add("active");
                Object.values(ui.bodies).forEach((b) => b.classList.remove("active"));
                ui.bodies[tab.dataset.tab].classList.add("active");
            });
        });

        function wireGrid(grid, attrKey, kind, storeKey) {
            grid.addEventListener("click", (e) => {
                const card = e.target.closest(".settings-card");
                if (!card) return;
                const id = card.dataset[attrKey + "Id"];
                if (e.target.classList.contains("default")) {
                    pendingDefaults[kind] = id;
                    AL.bus.post("makeDefault", { kind, value: id });
                    toast("toast_requestingDefault");
                } else {
                    store.set({ [storeKey]: id });
                }
            });
        }
        wireGrid(ui.paletteGrid, "palette", "theme", "theme");
        wireGrid(ui.speedoGrid, "speedo", "speedometer", "speedometer");
        wireGrid(ui.vitalsGrid, "vitals", "vitalsTheme", "vitalsTheme");
        wireGrid(ui.moneyGrid, "money", "moneyTheme", "moneyTheme");
        wireGrid(ui.weaponGrid, "weapon", "weaponTheme", "weaponTheme");

        ui.overlay.querySelectorAll("[data-badge-toggle]").forEach((tog) => {
            tog.addEventListener("click", () => {
                const key = tog.dataset.badgeToggle;
                const s = store.get();
                const hidden = new Set(s.hiddenBadges || []);
                hidden.has(key) ? hidden.delete(key) : hidden.add(key);
                store.set({ hiddenBadges: Array.from(hidden) });
            });
        });
        document.getElementById("weaponToggle").addEventListener("click", () => store.set({ showWeaponHud: !(store.get().showWeaponHud !== false) }));
        document.getElementById("compassToggle").addEventListener("click", () => store.set({ showCompassHud: !(store.get().showCompassHud !== false) }));
        document.getElementById("compassStreetToggle").addEventListener("click", () => store.set({ showCompassStreet: !(store.get().showCompassStreet !== false) }));

        const logoSizeInput = ui.overlay.querySelector('[data-slider="logoSize"]');
        logoSizeInput.addEventListener("input", () => store.set({ logoSize: parseFloat(logoSizeInput.value) }));

        const bgOpacityInput = ui.overlay.querySelector('[data-slider="backgroundOpacity"]');
        bgOpacityInput.addEventListener("input", () => store.set({ backgroundOpacity: parseFloat(bgOpacityInput.value) }));

        PER_WIDGET_SCALES.forEach((key) => {
            const input = ui.overlay.querySelector(`[data-slider="${key}"]`);
            if (input) input.addEventListener("input", () => store.set({ [key]: parseFloat(input.value) }));
        });

        ui.overlay.querySelectorAll("[data-color-override]").forEach((input) => {
            input.addEventListener("input", () => store.set({ [input.dataset.colorOverride]: input.value }));
        });
        ui.overlay.querySelectorAll("[data-color-reset]").forEach((btn) => {
            btn.addEventListener("click", () => store.set({ [btn.dataset.colorReset]: null }));
        });
        ui.overlay.querySelectorAll("[data-font]").forEach((btn) => {
            btn.addEventListener("click", () => store.set({ fontOverride: btn.dataset.font || null }));
        });
        ui.overlay.querySelectorAll("[data-unit]").forEach((btn) => {
            btn.addEventListener("click", () => store.set({ speedUnitOverride: btn.dataset.unit || null }));
        });
        document.getElementById("logoHideToggle").addEventListener("click", () => store.set({ hideLogo: !store.get().hideLogo }));
        document.getElementById("jobTitleToggle").addEventListener("click", () => store.set({ showJobTitle: !(store.get().showJobTitle !== false) }));
        document.getElementById("job2Toggle").addEventListener("click", () => store.set({ showJob2: !(store.get().showJob2 !== false) }));
        ui.overlay.querySelectorAll("[data-shape]").forEach((btn) => {
            btn.addEventListener("click", () => store.set({ logoShape: btn.dataset.shape }));
        });
        ui.overlay.querySelectorAll("[data-lang]").forEach((btn) => {
            btn.addEventListener("click", () => store.set({ language: btn.dataset.lang }));
        });

        ["x", "y", "scale"].forEach((k) => {
            const input = ui.overlay.querySelector(`[data-minimap-slider="${k}"]`);
            input.addEventListener("input", () => {
                const minimap = Object.assign({}, store.get().minimap, { [k]: parseFloat(input.value) });
                store.set({ minimap });
            });
        });
        document.getElementById("btnMinimapReset").addEventListener("click", () => {
            store.set({ minimap: { x: 0, y: 0, scale: 1 } });
            toast("toast_minimapReset");
        });

        ui.sliders.forEach((sl) => {
            const input = ui.overlay.querySelector(`[data-slider="${sl.key}"]`);
            input.addEventListener("input", () => store.set({ [sl.key]: parseFloat(input.value) }));
        });
        ui.overlay.querySelector("[data-accent]").addEventListener("input", (e) => store.set({ accentOverride: e.target.value }));

        ui.overlay.querySelector("#btnExport").addEventListener("click", () => {
            ui.importArea.style.display = "block";
            ui.importArea.value = AL.storage.exportJSON(store.get());
            ui.importArea.select();
            toast("toast_exportReady");
        });
        ui.overlay.querySelector("#btnImport").addEventListener("click", () => {
            ui.importArea.style.display = "block";
            ui.importArea.value = "";
            ui.importArea.focus();
            ui.importArea.placeholder = t("placeholder_import");
        });
        ui.importArea.addEventListener("keydown", (e) => {
            if (e.key === "Enter" && e.ctrlKey) {
                try {
                    const parsed = AL.storage.importJSON(ui.importArea.value);
                    store.set(parsed);
                    toast("toast_imported");
                } catch (err) {
                    toast("toast_invalidJson");
                }
            }
        });
        ui.overlay.querySelector("#btnReset").addEventListener("click", () => {
            store.set(AL.storage.reset());
            toast("toast_resetDone");
        });

        ui.makeServerDefaultBtn.addEventListener("click", () => {
            const s = store.get();
            pendingDefaults = { theme: s.theme, speedometer: s.speedometer, vitalsTheme: s.vitalsTheme, moneyTheme: s.moneyTheme, weaponTheme: s.weaponTheme };
            AL.bus.post("makeDefault", { kind: "theme", value: s.theme });
            AL.bus.post("makeDefault", { kind: "speedometer", value: s.speedometer });
            AL.bus.post("makeDefault", { kind: "vitalsTheme", value: s.vitalsTheme });
            AL.bus.post("makeDefault", { kind: "moneyTheme", value: s.moneyTheme });
            AL.bus.post("makeDefault", { kind: "weaponTheme", value: s.weaponTheme });
            toast("toast_requestingDefault");
        });

        AL.bus.on("settings:serverDefaults", (msg) => {
            serverDefaults = msg.data || {};
            markServerDefaults();
        });
        markServerDefaults();

        AL.bus.on("settings:makeDefaultResult", (msg) => {
            toast(msg.success ? "toast_defaultSet" : "toast_defaultDenied");
            if (msg.success && msg.info && pendingDefaults[msg.info] !== undefined) {
                serverDefaults[msg.info] = pendingDefaults[msg.info];
                markServerDefaults();
            }
        });

        // NUI only receives keyboard/mouse input while SetNuiFocus(true) is
        // active on the Lua side, so opening/closing always round-trips
        // through Lua — see client/main.lua's F6 keybind and the
        // "closeUI" NUI callback.
        function open() { ui.overlay.classList.add("open"); }
        function close() { ui.overlay.classList.remove("open"); AL.bus.post("closeUI", {}); }
        function toggle() { ui.overlay.classList.contains("open") ? close() : open(); }

        ui.close.addEventListener("click", close);
        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape" && ui.overlay.classList.contains("open")) close();
        });
        AL.bus.on("settings:open", open);

        AL.settings = { open, close, toggle };
    }

    AL.settingsPanel = { init };
})(window.AL = window.AL || {});
