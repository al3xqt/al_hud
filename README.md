[README.md](https://github.com/user-attachments/files/31167470/README.md)
# AL HUD Framework — v2.5.1 (critical bugfix)

## What broke and what I fixed

Screenshots showed the fuel/damage icons on several speedometers
rendering **enormous** (filling most of the screen) instead of small
status icons.

**Root cause**: `#speedoRoot svg { width: 100%; height: 100%; }` used
an ID selector, which beats a class selector in CSS specificity —
*regardless of source order*. That rule was meant only for each
speedometer's own top-level gauge SVG, but because it matched *any*
`<svg>` anywhere inside `#speedoRoot`, it was overriding the smaller,
more specific `.speedo-vitals-row svg` and `.speedo-status-icon svg`
sizing rules for the fuel/damage/status icons nested one level deeper.
When their immediate parent div had no fixed width for the `100%` to
resolve against, the SVGs fell back to a huge browser-default size.

**Fix**: changed the selector to `#speedoRoot > svg` (direct-child
only), so it sizes just the main gauge graphic and no longer touches
nested icons at all.

Also fixed the Digital Arc speedometer's damage-percentage text
overlapping the fuel ring's arc (visible in the same screenshots) by
tightening and raising the text stack so it sits clear of the arc.

**Defensive hardening**: added plain-pixel fallbacks before every
`clamp()`/`min()`/`color-mix()` in the stylesheets. These are modern
CSS functions; if a server's FiveM/CEF build is old enough not to
support one, the whole declaration using it is invalid and skipped —
previously that meant silently losing sizing (e.g. the compass's
scrolling tape had no width to fall back to, so it never rendered).
Now each of those properties sets a plain fixed value first, so an
unsupported modern function degrades to "fixed, not fluid" instead of
"missing entirely."

## What's new in this pass

- **Every speedometer now always shows fuel AND vehicle damage** —
  previously only 3 of the 7 had fuel and none showed damage. All 7
  (Cashout Style, Digital Arc, MBUX, Neon Ring, Classic Analog, F1 Bar,
  Carbon Compact) now include both, using real icons.
- **Removed the single-letter status icons** (E/S/R/T/C) everywhere —
  replaced with actual SVG icons (engine/seatbelt/RPM-warning/turbo/
  nitro/cruise) from a shared icon set in `speedometers/registry.js`.
- **Vehicle damage overlay removed entirely** per feedback — no more
  floating car-silhouette widget. Damage is now a compact `%` readout
  built into each speedometer instead.
- **Weapon HUD themes** — 3 layouts (Pill / Stacked Card / Minimal
  Text), same registry pattern as speedometers/vitals/money, each with
  Select + Make Default.
- **Distinct preview icons** for every speedometer and weapon theme
  card in the settings panel — no more all-identical generic gauge icon.
- **Compass smoothing** — the tape now eases between headings instead
  of snapping (with a wrap-around fix so crossing 359°→0° glides
  instead of spinning across the whole tape), and street-name changes
  crossfade instead of popping.
- **Per-widget scale** — Vehicle HUD, Weapon HUD, Money, and HUD Themes
  (vitals) tabs each now have their own dedicated scale slider, instead
  of only a single global one in Other Settings. The global "Overall
  HUD Scale" slider still exists and multiplies on top of all of them,
  same way a monitor's zoom and a per-app zoom stack.

## Honest scope note

"Job Settings" richness (matching the reference scripts' font/style/
design options) and full per-widget position controls beyond the
existing drag-mode editor weren't done this pass — flagging that
directly rather than shipping something half-built.

## What's new in this pass

- **True resolution-aware scaling** — replaced the old 4-breakpoint
  font-size steps with a continuous `clamp()`/`vw` formula
  (`html/styles/base.css`). Since every size in the framework is
  rem-based, this means the *entire* HUD — not just text — now scales
  smoothly for any resolution (1280x720 through 8K, plus a separate
  vh-based formula for ultrawide), not just the handful of exact
  breakpoints picked before. Each player's browser computes its own
  scale from its own `window.innerWidth`, so a 4K player and a 720p
  player each get a correctly-sized HUD automatically with zero
  configuration needed — this was already true in spirit before, just
  coarser; now it's continuous.
- **Colors & Text tab** (new) — icon color override (retints every
  vitals/money icon at once via shared CSS variables), text color
  override, background color + opacity override, and a font/text-style
  picker (Rajdhani / Oswald / JetBrains Mono / theme default). Every
  override has its own Reset button back to the theme's own color.
- **Speed unit picker** (Vehicle HUD tab) — each player can pick
  KM/H or MPH for their own display, independent of the server's
  `Config.SpeedUnit`. Implemented correctly: Lua now sends the raw
  m/s value alongside the pre-converted one, and the client re-converts
  when the player's choice differs from the server default — so the
  number and the unit label never mismatch.

## What's new in this pass

- **Compass / street name bar** (top-center) — real camera-heading-driven
  scrolling tape + live street/cross-street name
  (`GetEntityHeading`, `GetGameplayCamRelativeHeading`, `GetStreetNameAtCoord`).
- **Nitro / Turbo / Cruise indicators** — added to the 3 speedometers that
  already had an icon row (**Cashout Style**, **Digital Arc**, **Carbon
  Compact**). Turbo detection is a real native check
  (`IsToggleModOn(vehicle, 18)`); nitro/cruise have no vanilla GTA
  equivalent, so they're fed through `exports.al_hud:SetVehicleExtras({...})`
  for whatever nitro/cruise-control resource your server runs. The other 4
  speedometers (MBUX, Neon Ring, Classic Analog, F1 Bar) weren't touched —
  their layouts don't have room for a 3rd icon row without a redesign,
  flagging that honestly rather than cramming icons in badly.
- **General notification system** — `exports.al_hud:Notify(title, msg, type, ms)`
  client-side, or `TriggerClientEvent('al_hud:notify', src, {...})`
  server-side. success/error/warning/info, auto-dismiss progress bar,
  stacks up to 4 at once. Separate from the settings panel's own small
  confirmation toast.
- **EN/EL language toggle** — full translation of the settings panel UI
  (tabs, headings, hints, toggles, buttons, toasts) via a `data-i18n`
  attribute system with no DOM rebuild on switch — see
  `html/js/core/i18n.js`. Speedometer/theme *names* (e.g. "Digital Arc",
  "Cashout Style") stay in English in both languages, same way a product
  name doesn't get translated.
- **Vehicle damage overlay** — small top-down car silhouette (bottom, next
  to the speedometer) with body-health color shift, engine-smoke icon
  below ~35% engine health, and per-wheel burst indicators
  (`IsVehicleTyreBurst`). Toggle target for a future settings tab if
  wanted — currently always shows while driving.
- **Performance pass**: I can't run `resmon` myself (no live FiveM
  server), so I did a code-level review instead and found one real
  inefficiency — the seatbelt key-check thread was calling
  `PlayerPedId()` + `GetVehiclePedIsIn()` **every single frame**
  (`Wait(0)`) regardless of whether the player was even in a car. Fixed
  by sharing a flag the vehicle telemetry thread already computes, so
  those natives now only run every frame while actually driving, and the
  thread idles at `Wait(200)` otherwise. Everything else already used
  signature-diffing before sending NUI messages (`buildHudSignature` /
  `buildSpeedSignature` / weapon / compass all skip `SendNUIMessage` when
  nothing changed), so that pattern was already correct — please still
  verify actual `resmon` numbers on your server, since I can't produce
  real ms figures without a live client to test in.

A ground-up rebuild of the original `al_hud`, redesigned a second time to
match a specific reference HUD (Cashout Roleplay / "Do It Digital" style)
the client provided screenshots of: individual colored icon-badges
instead of grouped translucent cards, a big padded-digit speedometer,
a real weapon/ammo HUD, and a full-page categorized settings menu with
per-item "Make Default" that's backed by an actual server-side default
(KVP + ACE permission), not a fake button.

## What's in this build

- **Badge-style player HUD**: identity row (players/postal/id), money
  row (cash/black/bank/society/donate), vitals row (mic/health/armor/
  hunger/thirst/stamina as ringed percentage badges) — each its own
  colored badge, matching the reference pixel-for-pixel in structure.
- **5 themes** (Glass, Cyberpunk, Black & Gold, Neon Blue, Carbon Fiber)
  and **7 speedometers**, including a new **Cashout Style** (the new
  default) that matches the reference's "AUTOMATIC" + big digit +
  fuel-bar layout exactly.
- **Weapon HUD** (bottom-left ammo badge) — did not exist in the
  original `al_hud` at all; added for real using
  `GetSelectedPedWeapon` / `GetAmmoInClip` / `GetAmmoInPedWeapon`, with
  a runtime-built weapon-hash → display-name table
  (`client/weapons.lua`).
- **Full-page settings menu**: sidebar categories (HUD Themes, Vehicle
  HUD, Money Settings, Weapon HUD, Other Settings, Save/Load/Reset,
  Drag Mode), grid preview cards with **Select** + **Make Default** per
  card. "Make Default" is a real round trip: NUI → `client/main.lua`'s
  `makeDefault` callback → `TriggerServerEvent` → server checks
  `IsPlayerAceAllowed(src, 'al_hud.admin')` → `SetResourceKvp` → every
  new player who hasn't customized their own HUD gets it.
- Money-badge visibility toggles (hide Black/Society/Donate per-server
  economy needs) and a Weapon HUD show/hide toggle.
- Everything from v2.0 still holds: multi-framework bridge (ESX/QBCore/
  Qbox/Standalone), layout editor, vehicle telemetry, seatbelt, etc.

## Honest gaps vs. the reference screenshots

Everything from the reference sidebar is now implemented for real,
including Logo Settings, Job Settings, and Adjust Minimap Position —
the minimap tab genuinely repositions the native GTA minimap via
`SetMinimapComponentPosition` (`client/minimap.lua`), it's not a
cosmetic slider that moves nothing.

What's still a deliberate scope cut from the 15-theme/20-speedometer/
duplicate-widget original ask (see the phase list below) stands as-is.

## Installation

Same as before — see `client/bridge/*.lua` for framework mapping notes.
One addition: if you want the "Make Default" buttons in the settings
panel to actually work for your admins, grant the ACE permission in
`server.cfg`:
```
add_ace group.admin al_hud.admin allow
add_principal identifier.license:YOUR_LICENSE group.admin
```
Without it, "Make Default" still round-trips safely and just replies
"No permission" via a toast — it doesn't silently fail.


## Why this isn't literally "15 themes / 20 speedometers / drag-clone
## widgets" yet

The brief asked for 15 fully bespoke themes, 20 independent
speedometers, and a duplicate-widget layout editor. Building those at
genuine premium quality — not palette-swapped reskins — is realistically
weeks of design + engineering work, not something to fake by shipping
seven near-identical arcs and calling them different themes. What you
have now is the **architecture that makes the rest cheap**:

- A new theme is one CSS file that overrides ~20 variables (see
  `html/styles/themes/glass.css` as the template) — no component CSS
  ever needs touching.
- A new speedometer is one JS file implementing `mount / update /
  destroy` and calling `AL.speedo.register(name, module)` — see
  `html/js/speedometers/digitalArc.js` as the template.
- Both auto-appear in the Settings Panel once added to the `THEMES` /
  `SPEEDOMETERS` arrays in `html/js/settings/panel.js`.

Widget **duplication** (cloning a HUD element as an independent, freely
positioned copy) needs a multi-instance widget model — each widget id
becoming an array of instances instead of a singleton — which is a
real data-model change, not a CSS/JS content change. It's a clean
follow-up phase on top of this architecture, not started here, rather
than a fake button that doesn't do anything.

**Suggested next phases**, each independently shippable:
1. 5–8 more themes (Luxury, Minimal, White Modern, Titanium, Green
   Matrix, Orange Performance, Purple Neon, Red Racing) using the
   existing template.
2. 4–6 more speedometers (Porsche/Ferrari/Lamborghini-styled, GT
   Racing, Compact HUD, Futuristic Dashboard) using the existing
   registry.
3. Multi-instance widgets + duplicate/lock-per-instance in the editor.
4. Resolution-aware editor grid presets (720p/1440p/4K/ultrawide
   snapping profiles) on top of the existing responsive `rem` scaling.

## Installation

1. Drop the `al_hud` folder into your server's resources.
2. `ensure al_hud` in your `server.cfg` (after your framework and
   `mysql-async`/`oxmysql`, if you're on ESX).
3. Open `config.lua` and set `Config.Framework` (or leave `'auto'`).
4. If you're on QBCore/Qbox and want society money to reflect your
   banking resource, edit the `al_hud:getSocietyMoney` callback in
   `server/main.lua` — there's no single standard export across
   qb-banking / qb-management / Renewed-Banking, so it needs one line
   pointed at whichever one you run (documented inline).
5. If you're Standalone, call the exports from wherever you track
   jobs/money:
   ```lua
   exports.al_hud:SetJob('Off Duty')
   exports.al_hud:SetJob2('Taxi Driver')
   exports.al_hud:SetMoney(1250, 8400)
   ```

## Architecture

```
al_hud/
  config.lua                  -- Config.Framework, branding, defaults
  fxmanifest.lua
  client/
    main.lua                  -- framework-agnostic core loop, vehicle telemetry, keybinds
    bridge/
      init.lua                -- auto-detects framework, sets global `Bridge`
      esx.lua                 -- full-fidelity ESX adapter (job2/mafia/society)
      qbcore.lua               -- QBCore adapter (gang-as-job2, money, needs)
      qbox.lua                 -- Qbox adapter (qbx_core, QBCore-compatible)
      standalone.lua            -- no-framework adapter + SetJob/SetMoney exports
  server/
    main.lua                  -- framework-aware callbacks (economy, society money, ESX mafia lookup)
  postal/                     -- unchanged
  html/
    index.html
    styles/
      base.css                -- CSS variable contract + layout skeleton
      components.css          -- chips/orbs/brand/offer, all variable-driven
      speedometer.css         -- shared speedometer shell
      settings.css / editor.css
      themes/*.css            -- one file per theme, variables only
    js/
      core/                   -- utils, storage (localStorage), state (pub/sub), bus (NUI)
      components/             -- hud.js, offer.js
      speedometers/           -- registry.js + one file per speedometer
      settings/panel.js
      editor/layoutEditor.js
      main.js                 -- boot sequence
```

### Why plain `<script>` tags instead of ES modules

FiveM's CEF can be inconsistent with `type="module"` imports over
`file://`, so every JS file attaches to a single `window.AL` namespace
instead. Load order in `index.html` is the dependency graph — core
before components before speedometers before settings/editor before
`main.js`.

### Why settings live in `localStorage`, not a save file

FiveM's NUI is a real Chromium context, so `localStorage` persists
normally per-client — same approach most Tebex HUDs use for client-side
appearance preferences. It's intentionally separate from
framework/server data (money, job, etc.), which always comes from
`Bridge`.
