Config = {}

-- ---------------------------------------------------------------
-- Framework
-- 'auto' detects es_extended / qb-core / qbx_core at resource
-- start and falls back to 'standalone' if none are running.
-- Force one explicitly if you ever run two frameworks side by side.
-- ---------------------------------------------------------------
Config.Framework = 'auto' -- 'auto' | 'esx' | 'qbcore' | 'qbox' | 'standalone'

Config.Standalone = {
    DefaultJob = 'Civilian' -- shown until another resource calls exports.al_hud:SetJob(...)
}

-- ---------------------------------------------------------------
-- Branding
-- ---------------------------------------------------------------
Config.ServerName = 'Legion NYC'
Config.LogoText = 'AL'
Config.LogoImage = 'assets/logo.png'
Config.UseLogoImage = true

-- ---------------------------------------------------------------
-- Behaviour
-- ---------------------------------------------------------------
Config.HideDefaultHud = true
Config.ShowMinimap = true
Config.SpeedUnit = 'MPH' -- 'MPH' | 'KM/H'
Config.SeatbeltKey = 29  -- B

Config.UpdateIntervals = {
    status = 450,
    hungerThirst = 3000,
    economy = 10000,
    speedometer = 120
}

-- ---------------------------------------------------------------
-- Defaults for the Settings Panel (players can override per-client;
-- these only apply the first time the HUD ever loads for them).
-- ---------------------------------------------------------------
Config.DefaultTheme = 'glass'          -- glass | cyberpunk | blackgold | neon-blue | carbon
Config.DefaultSpeedometer = 'cashoutStyle' -- cashoutStyle | digitalArc | mbux | neonRing | classicAnalog | f1Bar | carbonCompact
Config.DefaultVitalsTheme = 'vitalsTheme1' -- vitalsTheme1 (rings) | 2 (hex) | 3 (h-bars) | 4 (v-bars) | 5 (minimal) | 6 (dots)
Config.DefaultMoneyTheme = 'moneyTheme1'   -- moneyTheme1 (badges) | 2 (cards) | 3 (horizontal icons) | 4 (list)
Config.DefaultWeaponTheme = 'weaponTheme1' -- weaponTheme1 (pill) | 2 (stacked card) | 3 (minimal text)
Config.DefaultLanguage = 'en'              -- 'en' | 'el'
