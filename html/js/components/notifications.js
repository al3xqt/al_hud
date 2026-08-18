/* ===========================================================
   AL HUD FRAMEWORK — components/notifications.js
   General-purpose toast queue for any server resource to use —
   not just this HUD's own settings panel. Triggered via:
     - client export: exports.al_hud:Notify(title, msg, type, ms)
     - server event:  TriggerClientEvent('al_hud:notify', src, {...})
   Types: success | error | warning | info (colors + icon per type).
   =========================================================== */
(function (AL) {
    "use strict";
    const { el } = AL.utils;

    const ICONS = {
        success: '<path d="M20 6 9 17l-5-5"/>',
        error: '<path d="M18 6 6 18M6 6l12 12"/>',
        warning: '<path d="M12 9v4M12 17h.01"/><path d="m10.3 3.5-8 14A1.7 1.7 0 0 0 3.7 20h16.6a1.7 1.7 0 0 0 1.4-2.5l-8-14a1.7 1.7 0 0 0-3 0Z"/>',
        info: '<circle cx="12" cy="12" r="9"/><path d="M12 16v-4M12 8h.01"/>'
    };

    const MAX_VISIBLE = 4;
    let queue = [];
    let active = 0;
    let stackEl = null;

    function ensureStack() {
        if (stackEl) return stackEl;
        stackEl = document.getElementById("notifyStack");
        if (!stackEl) {
            stackEl = el("div", { id: "notifyStack" });
            document.body.appendChild(stackEl);
        }
        return stackEl;
    }

    function renderNext() {
        if (active >= MAX_VISIBLE || queue.length === 0) return;
        const item = queue.shift();
        active++;

        const type = ICONS[item.type] ? item.type : "info";
        const duration = item.duration || 4500;

        const node = el("div", { class: `al-notify ${type}` });
        node.appendChild(el("div", { class: "notify-icon", html: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">${ICONS[type]}</svg>` }));
        const body = el("div", { class: "notify-body" });
        if (item.title) body.appendChild(el("div", { class: "notify-title", html: escapeHtml(item.title) }));
        if (item.message) body.appendChild(el("div", { class: "notify-msg", html: escapeHtml(item.message) }));
        node.appendChild(body);
        node.appendChild(el("div", { class: "notify-bar", style: `animation-duration:${duration}ms;` }));

        ensureStack().appendChild(node);
        requestAnimationFrame(() => node.classList.add("show"));

        const remove = () => {
            node.classList.add("leaving");
            node.classList.remove("show");
            setTimeout(() => {
                node.remove();
                active--;
                renderNext();
            }, 220);
        };
        node._timer = setTimeout(remove, duration);
        node.addEventListener("click", () => { clearTimeout(node._timer); remove(); });
    }

    function escapeHtml(str) {
        const div = document.createElement("div");
        div.textContent = String(str);
        return div.innerHTML;
    }

    function push(data) {
        queue.push(data);
        renderNext();
    }

    function init() {
        ensureStack();
        AL.bus.on("notify", (msg) => {
            push({
                title: msg.title,
                message: msg.message || msg.text,
                type: msg.notifyType || msg.type,
                duration: msg.duration
            });
        });
    }

    AL.components = AL.components || {};
    AL.components.notifications = { init, push };
})(window.AL = window.AL || {});
