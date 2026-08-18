--[[
    AL HUD FRAMEWORK — client/weapons.lua
    FiveM has no native that turns a weapon hash back into a display
    name, so this builds one at runtime with GetHashKey() against the
    base game's weapon names — accurate on every build, and needs no
    hardcoded/copied hash numbers. Covers the vanilla weapon set;
    servers with custom weapons should extend WeaponLabels via
    exports.al_hud:SetJob-style pattern... actually just add entries
    to this table directly, or push a custom label at runtime with
    `AL_RegisterWeaponLabel(name, label)` (exported below).
]]

local nameToLabel = {
    WEAPON_UNARMED = 'Unarmed',
    WEAPON_PISTOL = 'Pistol', WEAPON_PISTOL_MK2 = 'Pistol Mk II', WEAPON_COMBATPISTOL = 'Combat Pistol',
    WEAPON_APPISTOL = 'AP Pistol', WEAPON_PISTOL50 = 'Pistol .50', WEAPON_SNSPISTOL = 'SNS Pistol',
    WEAPON_SNSPISTOL_MK2 = 'SNS Pistol Mk II', WEAPON_HEAVYPISTOL = 'Heavy Pistol', WEAPON_VINTAGEPISTOL = 'Vintage Pistol',
    WEAPON_FLAREGUN = 'Flare Gun', WEAPON_MARKSMANPISTOL = 'Marksman Pistol', WEAPON_REVOLVER = 'Revolver',
    WEAPON_REVOLVER_MK2 = 'Revolver Mk II', WEAPON_DOUBLEACTION = 'Double Action Revolver', WEAPON_CERAMICPISTOL = 'Ceramic Pistol',
    WEAPON_NAVYREVOLVER = 'Navy Revolver', WEAPON_GADGETPISTOL = 'Perico Pistol', WEAPON_PISTOLXM3 = 'Pistol XM3',

    WEAPON_MICROSMG = 'Micro SMG', WEAPON_SMG = 'SMG', WEAPON_SMG_MK2 = 'SMG Mk II', WEAPON_ASSAULTSMG = 'Assault SMG',
    WEAPON_COMBATPDW = 'Combat PDW', WEAPON_MACHINEPISTOL = 'Machine Pistol', WEAPON_MINISMG = 'Mini SMG',

    WEAPON_ASSAULTRIFLE = 'Assault Rifle', WEAPON_ASSAULTRIFLE_MK2 = 'Assault Rifle Mk II', WEAPON_CARBINERIFLE = 'Carbine Rifle',
    WEAPON_CARBINERIFLE_MK2 = 'Carbine Rifle Mk II', WEAPON_ADVANCEDRIFLE = 'Advanced Rifle', WEAPON_SPECIALCARBINE = 'Special Carbine',
    WEAPON_SPECIALCARBINE_MK2 = 'Special Carbine Mk II', WEAPON_BULLPUPRIFLE = 'Bullpup Rifle', WEAPON_BULLPUPRIFLE_MK2 = 'Bullpup Rifle Mk II',
    WEAPON_COMPACTRIFLE = 'Compact Rifle', WEAPON_MILITARYRIFLE = 'Military Rifle', WEAPON_HEAVYRIFLE = 'Heavy Rifle',
    WEAPON_TACTICALRIFLE = 'Tactical Rifle',

    WEAPON_PUMPSHOTGUN = 'Pump Shotgun', WEAPON_PUMPSHOTGUN_MK2 = 'Pump Shotgun Mk II', WEAPON_SAWNOFFSHOTGUN = 'Sawn-Off Shotgun',
    WEAPON_ASSAULTSHOTGUN = 'Assault Shotgun', WEAPON_BULLPUPSHOTGUN = 'Bullpup Shotgun', WEAPON_MUSKET = 'Musket',
    WEAPON_HEAVYSHOTGUN = 'Heavy Shotgun', WEAPON_DBSHOTGUN = 'Double-Barrel Shotgun', WEAPON_AUTOSHOTGUN = 'Sweeper Shotgun',

    WEAPON_MG = 'MG', WEAPON_COMBATMG = 'Combat MG', WEAPON_COMBATMG_MK2 = 'Combat MG Mk II', WEAPON_GATLING = 'Minigun',

    WEAPON_SNIPERRIFLE = 'Sniper Rifle', WEAPON_HEAVYSNIPER = 'Heavy Sniper', WEAPON_HEAVYSNIPER_MK2 = 'Heavy Sniper Mk II',
    WEAPON_MARKSMANRIFLE = 'Marksman Rifle', WEAPON_MARKSMANRIFLE_MK2 = 'Marksman Rifle Mk II', WEAPON_PRECISIONRIFLE = 'Precision Rifle',

    WEAPON_RPG = 'RPG', WEAPON_GRENADELAUNCHER = 'Grenade Launcher', WEAPON_GRENADELAUNCHER_SMOKE = 'Smoke Grenade Launcher',
    WEAPON_MINIGUN = 'Minigun', WEAPON_FIREWORK = 'Firework Launcher', WEAPON_RAILGUN = 'Railgun',
    WEAPON_HOMINGLAUNCHER = 'Homing Launcher', WEAPON_COMPACTLAUNCHER = 'Compact Grenade Launcher', WEAPON_RAYPISTOL = 'Unholy Hellbringer',
    WEAPON_RAYCARBINE = 'Widowmaker', WEAPON_RAYMINIGUN = 'Sentinel Laser Minigun',

    WEAPON_GRENADE = 'Grenade', WEAPON_STICKYBOMB = 'Sticky Bomb', WEAPON_PROXMINE = 'Proximity Mine',
    WEAPON_BZGAS = 'BZ Gas', WEAPON_MOLOTOV = 'Molotov Cocktail', WEAPON_FLARE = 'Flare', WEAPON_SMOKEGRENADE = 'Smoke Grenade',
    WEAPON_PIPEBOMB = 'Pipe Bomb', WEAPON_BALL = 'Ball',

    WEAPON_KNIFE = 'Knife', WEAPON_NIGHTSTICK = 'Nightstick', WEAPON_HAMMER = 'Hammer', WEAPON_BAT = 'Bat',
    WEAPON_GOLFCLUB = 'Golf Club', WEAPON_CROWBAR = 'Crowbar', WEAPON_BOTTLE = 'Bottle', WEAPON_DAGGER = 'Dagger',
    WEAPON_HATCHET = 'Hatchet', WEAPON_KNUCKLE = 'Knuckle Duster', WEAPON_MACHETE = 'Machete', WEAPON_FLASHLIGHT = 'Flashlight',
    WEAPON_SWITCHBLADE = 'Switchblade', WEAPON_POOLCUE = 'Pool Cue', WEAPON_WRENCH = 'Wrench', WEAPON_BATTLEAXE = 'Battle Axe',
    WEAPON_STONE_HATCHET = 'Stone Hatchet',

    WEAPON_PETROLCAN = 'Jerry Can', WEAPON_FIREEXTINGUISHER = 'Fire Extinguisher', WEAPON_STUNGUN = 'Stun Gun'
}

WeaponLabels = {}
for name, label in pairs(nameToLabel) do
    WeaponLabels[GetHashKey(name)] = label
end

exports('RegisterWeaponLabel', function(weaponName, label)
    WeaponLabels[GetHashKey(weaponName)] = label
end)
