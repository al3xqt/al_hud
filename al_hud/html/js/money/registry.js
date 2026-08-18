/* ===========================================================
   AL HUD FRAMEWORK — money/registry.js
   Same pattern as vitals/registry.js: "Money Theme" swaps the
   whole layout (badge vs card vs list), driven by a shared data
   list of money types so each theme module only handles layout.
   =========================================================== */
(function (AL) {
    "use strict";

    const registry = {};
    function register(name, def) { registry[name] = def; }
    function get(name) { return registry[name] || registry.moneyTheme1; }
    function list() { return Object.keys(registry); }

    // Shared data: which money fields exist, their color/label/icon.
    // Visibility (hiddenBadges) is applied by each theme's update()
    // by skipping keys present in state.hiddenBadges.
    const TYPES = [
        { key: "cash", stateKey: "cash", label: "CASH", color: "var(--money-cash)", icon: '<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="3"/>' },
        { key: "black", stateKey: "blackMoney", label: "BLACK", color: "var(--money-black)", icon: '<rect x="2" y="7" width="20" height="10" rx="2"/><circle cx="12" cy="12" r="2.5"/>' },
        { key: "bank", stateKey: "bank", label: "BANK", color: "var(--money-bank)", icon: '<path d="M3 21h18M3 10h18M5 6l7-4 7 4M4 10v11M20 10v11M8 14v3M12 14v3M16 14v3"/>' },
        { key: "society", stateKey: "societyMoney", label: "SOCIETY", color: "var(--money-society)", icon: '<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>' },
        { key: "donate", stateKey: "donateCoins", label: "DONATE", color: "var(--money-donate)", icon: '<circle cx="12" cy="12" r="9"/><path d="M14.8 9.2a2.5 2.5 0 0 0-2.3-1.7c-1.5 0-2.5 1-2.5 2s1 1.6 2.5 2 2.5 1 2.5 2-1 2-2.5 2a2.5 2.5 0 0 1-2.3-1.7M12 6v1.5M12 16.5V18"/>' }
    ];

    AL.moneyThemes = { register, get, list, TYPES };
})(window.AL = window.AL || {});
