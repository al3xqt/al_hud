--[[
    AL HUD FRAMEWORK — client/main.lua
    Core orchestrator. All framework-specific logic now lives in
    client/bridge/*.lua behind the `Bridge` interface set up by
    bridge/init.lua; this file only does framework-agnostic work:
    native polling, vehicle telemetry, seatbelt, HUD visibility,
    and wiring the settings/editor keybinds through NUI focus.
]]

local ready = false
local seatbeltOn = false
local isDriverInCar = false -- kept in sync by the vehicle telemetry thread; lets the
                             -- per-frame seatbelt key-check skip native calls entirely
                             -- while the player isn't even driving a car
local voiceMode = 1
local uiVisible = false
local lastHudSignature = nil
local lastSpeedSignature = nil
local nextJobsSyncAt = 0
local nuiFocused = false

local VEHICLE_MODE = { car = 'car', bike = 'bike', air = 'air', boat = 'boat' }

local hudState = {
    id = 0, online = 0, time = '00:00', postal = '----',
    job = 'Unemployed', job2 = 'No Second Job',
    health = 100, armor = 0, hunger = 100, thirst = 100, stamina = 0, oxygen = 100,
    cash = 0, bank = 0, blackMoney = 0, donateCoins = 0, societyMoney = 0,
    voiceMode = 1, talking = false, isBoss = false
}

local speedState = {
    show = false, mode = VEHICLE_MODE.car,
    speed = 0, speedMs = 0, fuel = 0, rpm = 0, gear = 'N',
    health = 100, altitude = 0, odometer = 0,
    engine = false, seatbelt = false,
    bodyHealth = 100, engineHealth = 100, wheels = {},
    turboEquipped = false, nitroActive = false, nitroLevel = 0, cruiseActive = false
}

local speedUnitLabel = string.upper(tostring(Config.SpeedUnit or 'KM/H'))
local useMph = string.find(speedUnitLabel, 'MPH', 1, true) ~= nil
local speedMultiplier = useMph and 2.236936 or 3.6
local odometerMeters = 0.0
local lastOdoVehicle = 0
local lastOdoPos = nil

local function clamp(value, minValue, maxValue)
    if value < minValue then return minValue end
    if value > maxValue then return maxValue end
    return value
end

local function round(value) return math.floor((value or 0) + 0.5) end

local function getVehicleMode(vehicle)
    local class = GetVehicleClass(vehicle)
    if class == 8 then return VEHICLE_MODE.bike end
    if class == 15 or class == 16 then return VEHICLE_MODE.air end
    if class == 14 then return VEHICLE_MODE.boat end
    return VEHICLE_MODE.car
end

local function buildHudSignature()
    return table.concat({
        hudState.id, hudState.online, hudState.time, hudState.postal, hudState.job, hudState.job2,
        hudState.health, hudState.armor, hudState.hunger, hudState.thirst, hudState.stamina, hudState.oxygen,
        hudState.cash, hudState.bank, hudState.blackMoney, hudState.donateCoins, hudState.societyMoney,
        hudState.voiceMode, hudState.talking and 1 or 0, hudState.isBoss and 1 or 0
    }, '|')
end

local function buildSpeedSignature()
    local w = speedState.wheels or {}
    return table.concat({
        speedState.show and 1 or 0, speedState.mode, speedState.speed, speedState.fuel, speedState.rpm,
        speedState.gear, speedState.health, speedState.odometer, speedState.engine and 1 or 0, speedState.seatbelt and 1 or 0,
        speedState.bodyHealth, speedState.engineHealth, speedState.turboEquipped and 1 or 0,
        speedState.nitroActive and 1 or 0, speedState.nitroLevel, speedState.cruiseActive and 1 or 0,
        w.fl and 1 or 0, w.fr and 1 or 0, w.rl and 1 or 0, w.rr and 1 or 0
    }, '|')
end

local function pushHud(force)
    local signature = buildHudSignature()
    if not force and signature == lastHudSignature then return end
    lastHudSignature = signature
    SendNUIMessage({ action = 'hud:update', data = hudState })
end

local function pushSpeed(force)
    local signature = buildSpeedSignature()
    if not force and signature == lastSpeedSignature then return end
    lastSpeedSignature = signature
    SendNUIMessage({ action = 'speedo:update', data = speedState })
end

local function getCurrentPostal()
    local ok, postal = pcall(function() return exports[GetCurrentResourceName()]:getPostal() end)
    if ok and postal then return tostring(postal) end
    return '----'
end

local function applySeatbeltState()
    local ped = PlayerPedId()
    SetPedConfigFlag(ped, 32, seatbeltOn)
    if seatbeltOn then
        SetFlyThroughWindscreenParams(10000.0, 10000.0, 17.0, 500.0)
    else
        SetFlyThroughWindscreenParams(10.0, 15.0, 17.0, 200.0)
    end
end

local function pullPlayerData()
    local data = Bridge.GetPlayerData()
    hudState.id = GetPlayerServerId(PlayerId())
    hudState.job = data.job
    if data.job2 ~= nil then hudState.job2 = data.job2 end
    hudState.cash = data.cash
    hudState.isBoss = data.isBoss
    hudState.bank = data.bank
    hudState.blackMoney = data.blackMoney
    hudState.donateCoins = data.donateCoins
end

-- ---------------------------------------------------------------
-- Boot
-- ---------------------------------------------------------------
CreateThread(function()
    Bridge.WaitReady()
    pullPlayerData()

    -- Server-stored defaults (set via the settings panel's "Make
    -- Default" buttons) win over Config.lua's static defaults, but
    -- only for players who've never customized their own HUD —
    -- see main.js's isFresh check on the NUI side.
    local serverDefaults = { theme = nil, speedometer = nil }
    local gotServerDefaults = false

    RegisterNetEvent('al_hud:serverDefaults', function(defaults)
        serverDefaults = defaults or {}
        gotServerDefaults = true
    end)

    TriggerServerEvent('al_hud:getServerDefaults')
    local waited = 0
    while not gotServerDefaults and waited < 2000 do
        Wait(50)
        waited = waited + 50
    end

    SendNUIMessage({
        action = 'hud:init',
        data = {
            serverName = Config.ServerName,
            logoText = Config.LogoText,
            logoImage = Config.LogoImage,
            useLogoImage = Config.UseLogoImage,
            speedUnit = Config.SpeedUnit,
            defaultTheme = (serverDefaults.theme and serverDefaults.theme ~= '') and serverDefaults.theme or Config.DefaultTheme,
            defaultSpeedometer = (serverDefaults.speedometer and serverDefaults.speedometer ~= '') and serverDefaults.speedometer or Config.DefaultSpeedometer,
            defaultVitalsTheme = (serverDefaults.vitalsTheme and serverDefaults.vitalsTheme ~= '') and serverDefaults.vitalsTheme or Config.DefaultVitalsTheme,
            defaultMoneyTheme = (serverDefaults.moneyTheme and serverDefaults.moneyTheme ~= '') and serverDefaults.moneyTheme or Config.DefaultMoneyTheme,
            defaultWeaponTheme = (serverDefaults.weaponTheme and serverDefaults.weaponTheme ~= '') and serverDefaults.weaponTheme or Config.DefaultWeaponTheme,
            defaultLanguage = Config.DefaultLanguage
        }
    })

    SendNUIMessage({ action = 'settings:serverDefaults', data = serverDefaults })

    ready = true
    Bridge.RefreshJobs(hudState)
    pushHud(true)
end)

RegisterNetEvent('al_hud:setServerDefaultResult', function(success, info)
    SendNUIMessage({ action = 'settings:makeDefaultResult', success = success, info = info })
end)

RegisterNUICallback('makeDefault', function(data, cb)
    TriggerServerEvent('al_hud:setServerDefault', data.kind, data.value)
    cb('ok')
end)

Bridge.RegisterEvents(
    function() -- onPlayerLoaded
        pullPlayerData()
        Bridge.RefreshJobs(hudState)
        pushHud(true)
    end,
    function(jobLabel, isBoss) -- onJobUpdate
        hudState.job = jobLabel
        if isBoss ~= nil then hudState.isBoss = isBoss end
        Bridge.RefreshJobs(hudState)
    end,
    function(job2Label) -- onJob2Update
        hudState.job2 = job2Label
        pushHud(true)
    end
)

AddEventHandler('pma-voice:setTalkingMode', function(mode) voiceMode = tonumber(mode) or voiceMode end)
AddEventHandler('mumble-voip:setTalkingMode', function(mode) voiceMode = tonumber(mode) or voiceMode end)

AddEventHandler('onResourceStop', function(resourceName)
    if resourceName == GetCurrentResourceName() then
        SendNUIMessage({ action = 'hud:visibility', state = false })
    end
end)

-- ---------------------------------------------------------------
-- HUD hide / minimap / visibility loops (framework-agnostic natives)
-- ---------------------------------------------------------------
CreateThread(function()
    while true do
        if Config.HideDefaultHud then
            Wait(0)
            HideHudComponentThisFrame(1); HideHudComponentThisFrame(2); HideHudComponentThisFrame(3)
            HideHudComponentThisFrame(4); HideHudComponentThisFrame(6); HideHudComponentThisFrame(7)
            HideHudComponentThisFrame(8); HideHudComponentThisFrame(9); HideHudComponentThisFrame(13)
            HideHudComponentThisFrame(17); HideHudComponentThisFrame(20)
        else
            Wait(1000)
        end
    end
end)

CreateThread(function()
    while true do
        DisplayRadar(Config.ShowMinimap)
        Wait(500)
    end
end)

CreateThread(function()
    while true do
        local pause = IsPauseMenuActive()
        local nextVisibility = not pause
        if uiVisible ~= nextVisibility then
            uiVisible = nextVisibility
            SendNUIMessage({ action = 'hud:visibility', state = uiVisible })
        end
        Wait(200)
    end
end)

-- ---------------------------------------------------------------
-- Player status
-- ---------------------------------------------------------------
CreateThread(function()
    while true do
        if ready then
            local playerId = PlayerId()
            local ped = PlayerPedId()
            local maxHealth = GetEntityMaxHealth(ped) - 100
            local health = 100
            if maxHealth > 0 then health = ((GetEntityHealth(ped) - 100) / maxHealth) * 100.0 end

            hudState.health = clamp(round(health), 0, 100)
            hudState.armor = clamp(round(GetPedArmour(ped)), 0, 100)
            hudState.stamina = clamp(round(100.0 - GetPlayerSprintStaminaRemaining(playerId)), 0, 100)
            hudState.talking = MumbleIsPlayerTalking(playerId)
            hudState.voiceMode = voiceMode
            hudState.time = ('%02d:%02d'):format(GetClockHours(), GetClockMinutes())
            hudState.postal = getCurrentPostal()

            if IsPedSwimmingUnderWater(ped) then
                local underwater = GetPlayerUnderwaterTimeRemaining(playerId)
                hudState.oxygen = clamp(round((underwater / 10.0) * 100.0), 0, 100)
            else
                hudState.oxygen = 100
            end

            pushHud()
            Wait(Config.UpdateIntervals.status)
        else
            Wait(750)
        end
    end
end)

CreateThread(function()
    while true do
        if ready then
            Bridge.GetStatus(function(hunger, thirst)
                hudState.hunger = clamp(round(hunger), 0, 100)
                hudState.thirst = clamp(round(thirst), 0, 100)
            end)
        end
        Wait(Config.UpdateIntervals.hungerThirst)
    end
end)

CreateThread(function()
    while true do
        if ready then
            pullPlayerData()
            Bridge.RefreshJobs(hudState)

            Bridge.GetEconomy(function(data, onlineCount)
                if data then
                    hudState.cash = tonumber(data.cash) or hudState.cash
                    hudState.bank = tonumber(data.bank) or hudState.bank
                    hudState.blackMoney = tonumber(data.blackMoney) or hudState.blackMoney
                    hudState.donateCoins = tonumber(data.donateCoins) or hudState.donateCoins
                end
                if onlineCount then hudState.online = tonumber(onlineCount) or hudState.online end
            end)

            Bridge.GetSocietyMoney(hudState)
        end
        Wait(Config.UpdateIntervals.economy)
    end
end)

-- ---------------------------------------------------------------
-- Weapon HUD (new — not present in the original al_hud). Pure
-- natives: GetSelectedPedWeapon / GetAmmoInPedWeapon / GetAmmoInClip.
-- Weapon display names come from client/weapons.lua's WeaponLabels.
-- ---------------------------------------------------------------
local lastWeaponSignature = nil

CreateThread(function()
    while true do
        if ready then
            local ped = PlayerPedId()
            local weaponHash = GetSelectedPedWeapon(ped)
            local unarmedHash = GetHashKey('WEAPON_UNARMED')

            if weaponHash and weaponHash ~= 0 and weaponHash ~= unarmedHash then
                local totalAmmo = GetAmmoInPedWeapon(ped, weaponHash) or 0
                local pcallOk, clipNativeOk, ammoInClip = pcall(GetAmmoInClip, ped, weaponHash)
                local clip = (pcallOk and clipNativeOk and ammoInClip) or 0
                local reserve = math.max(totalAmmo - clip, 0)
                local maxOk, clipMax = pcall(GetMaxAmmoInClip, ped, weaponHash, true)

                local signature = ('%s|%s|%s'):format(weaponHash, clip, reserve)
                if signature ~= lastWeaponSignature then
                    lastWeaponSignature = signature
                    SendNUIMessage({
                        action = 'weapon:update',
                        data = {
                            armed = true,
                            label = WeaponLabels[weaponHash] or 'Weapon',
                            clip = clip,
                            clipMax = (maxOk and clipMax) or math.max(clip, 1),
                            reserve = reserve
                        }
                    })
                end
            elseif lastWeaponSignature ~= 'unarmed' then
                lastWeaponSignature = 'unarmed'
                SendNUIMessage({ action = 'weapon:update', data = { armed = false } })
            end
        end
        Wait(300)
    end
end)

-- ---------------------------------------------------------------
-- Compass / street name (new — not present in the original al_hud).
-- Heading updates often for a smooth scroll; the street-name lookup
-- is throttled separately since GetStreetNameAtCoord is heavier and
-- doesn't need to run every tick.
-- ---------------------------------------------------------------
local lastHeadingSent = nil
local lastStreet, lastCrossStreet = nil, nil
local streetCheckCounter = 0

CreateThread(function()
    while true do
        if ready then
            local ped = PlayerPedId()
            local heading = (GetEntityHeading(ped) - GetGameplayCamRelativeHeading()) % 360.0

            streetCheckCounter = streetCheckCounter + 1
            if streetCheckCounter >= 8 then -- ~every 8th tick, see Wait() below
                streetCheckCounter = 0
                local coords = GetEntityCoords(ped)
                local streetHash, crossHash = GetStreetNameAtCoord(coords.x, coords.y, coords.z)
                lastStreet = GetStreetNameFromHashKey(streetHash)
                lastCrossStreet = crossHash ~= 0 and GetStreetNameFromHashKey(crossHash) or nil
            end

            local headingBucket = math.floor(heading / 2) -- ~2 degree resolution is plenty smooth, cuts NUI spam
            if headingBucket ~= lastHeadingSent then
                lastHeadingSent = headingBucket
                SendNUIMessage({
                    action = 'compass:update',
                    data = { heading = heading, street = lastStreet, crossStreet = lastCrossStreet }
                })
            end
        end
        Wait(200)
    end
end)

-- ---------------------------------------------------------------
-- General notifications — any resource can push one, either from
-- the client (exports.al_hud:Notify) or the server
-- (TriggerClientEvent('al_hud:notify', src, {...})).
-- ---------------------------------------------------------------
local function pushNotification(data)
    SendNUIMessage({
        action = 'notify',
        title = data.title,
        message = data.message or data.text,
        notifyType = data.type,
        duration = data.duration
    })
end

exports('Notify', function(titleOrData, message, notifyType, duration)
    if type(titleOrData) == 'table' then
        pushNotification(titleOrData)
    else
        pushNotification({ title = titleOrData, message = message, type = notifyType, duration = duration })
    end
end)

RegisterNetEvent('al_hud:notify', function(data)
    pushNotification(type(data) == 'table' and data or { message = tostring(data) })
end)

local vehicleExtras = { nitroActive = false, nitroLevel = 0, cruiseActive = false }

-- Other resources (nitro scripts, cruise-control scripts) call this to
-- feed real data into the speedometer's icon row. Nothing here fakes
-- values — until something calls this, nitro/cruise just stay off.
exports('SetVehicleExtras', function(data)
    if type(data) ~= 'table' then return end
    if data.nitroActive ~= nil then vehicleExtras.nitroActive = data.nitroActive end
    if data.nitroLevel ~= nil then vehicleExtras.nitroLevel = tonumber(data.nitroLevel) or 0 end
    if data.cruiseActive ~= nil then vehicleExtras.cruiseActive = data.cruiseActive end
end)

local WHEEL_INDEX = { fl = 0, fr = 1, rl = 4, rr = 5 }

-- ---------------------------------------------------------------
-- Vehicle telemetry (unchanged core from the original — framework-agnostic —
-- extended with body/engine health split, wheel burst state, turbo
-- detection, and the nitro/cruise extras channel above)
-- ---------------------------------------------------------------
CreateThread(function()
    while true do
        if ready then
            local ped = PlayerPedId()
            local vehicle = GetVehiclePedIsIn(ped, false)

            if vehicle ~= 0 and GetPedInVehicleSeat(vehicle, -1) == ped then
                local mode = getVehicleMode(vehicle)
                isDriverInCar = mode == VEHICLE_MODE.car
                if mode ~= VEHICLE_MODE.car and seatbeltOn then
                    seatbeltOn = false
                    applySeatbeltState()
                end
                if seatbeltOn and mode == VEHICLE_MODE.car then
                    DisableControlAction(0, 75, true)
                end

                local vehiclePos = GetEntityCoords(vehicle)
                if lastOdoVehicle == vehicle and lastOdoPos then
                    odometerMeters = odometerMeters + #(vehiclePos - lastOdoPos)
                end
                lastOdoVehicle = vehicle
                lastOdoPos = vehiclePos

                local speedMs = GetEntitySpeed(vehicle)
                local speed = round(speedMs * speedMultiplier)
                local fuel = round(GetVehicleFuelLevel(vehicle))
                local rpm = round(GetVehicleCurrentRpm(vehicle) * 100)
                local gear = GetVehicleCurrentGear(vehicle)
                local maxHealth = GetEntityMaxHealth(vehicle)
                local engineHealthRaw = GetVehicleEngineHealth(vehicle)
                local bodyHealthRaw = GetVehicleBodyHealth(vehicle)
                local healthPercent = round(((engineHealthRaw + bodyHealthRaw) / (maxHealth + 1000.0)) * 100.0)
                local odometerDistance = useMph and (odometerMeters * 0.000621371) or (odometerMeters / 1000.0)

                if mode == VEHICLE_MODE.car and gear == 0 then gear = 'R'
                elseif gear == 0 then gear = 'N' end

                local wheels = {}
                if mode == VEHICLE_MODE.car or mode == VEHICLE_MODE.bike then
                    for key, idx in pairs(WHEEL_INDEX) do
                        local ok, burst = pcall(IsVehicleTyreBurst, vehicle, idx, false)
                        wheels[key] = ok and burst or false
                    end
                end

                speedState.show = true
                speedState.mode = mode
                speedState.speed = clamp(speed, 0, 999)
                speedState.speedMs = speedMs
                speedState.fuel = clamp(fuel, 0, 100)
                speedState.rpm = clamp(rpm, 0, 100)
                speedState.gear = gear
                speedState.health = clamp(healthPercent, 0, 100)
                speedState.bodyHealth = clamp(round((bodyHealthRaw / 1000.0) * 100.0), 0, 100)
                speedState.engineHealth = clamp(round((math.max(engineHealthRaw, 0) / 1000.0) * 100.0), 0, 100)
                speedState.wheels = wheels
                speedState.altitude = round(GetEntityCoords(vehicle).z * 3.28084)
                speedState.odometer = math.floor(odometerDistance + 0.5)
                speedState.engine = IsVehicleEngineOn(vehicle)
                speedState.seatbelt = seatbeltOn
                speedState.turboEquipped = IsToggleModOn(vehicle, 18)
                speedState.nitroActive = vehicleExtras.nitroActive
                speedState.nitroLevel = clamp(vehicleExtras.nitroLevel, 0, 100)
                speedState.cruiseActive = vehicleExtras.cruiseActive

                pushSpeed()
            elseif speedState.show then
                speedState.show = false
                seatbeltOn = false
                isDriverInCar = false
                applySeatbeltState()
                lastOdoVehicle = 0
                lastOdoPos = nil
                pushSpeed()
            end

            Wait(Config.UpdateIntervals.speedometer)
        else
            Wait(750)
        end
    end
end)

CreateThread(function()
    while true do
        if ready and isDriverInCar then
            if IsControlJustReleased(0, Config.SeatbeltKey) then
                seatbeltOn = not seatbeltOn
                applySeatbeltState()
                PlaySoundFrontend(-1, seatbeltOn and 'NAV_UP_DOWN' or 'NAV_LEFT_RIGHT', 'HUD_FRONTEND_DEFAULT_SOUNDSET', true)
            end
            Wait(0) -- must be per-frame while driving, or a quick tap of the key can be missed
        else
            Wait(200) -- not driving: no need to poll the key at all
        end
    end
end)

-- ---------------------------------------------------------------
-- Settings / layout editor — NUI focus handling
-- FiveM only forwards keyboard/mouse to the NUI browser while
-- SetNuiFocus(true, ...) is active, so opening the panel is a
-- Lua-side keybind, and closing releases focus via a NUI callback.
-- ---------------------------------------------------------------
local function openNui(action)
    if nuiFocused then return end
    nuiFocused = true
    SetNuiFocus(true, true)
    SendNUIMessage({ action = action })
end

RegisterNUICallback('closeUI', function(_, cb)
    nuiFocused = false
    SetNuiFocus(false, false)
    cb('ok')
end)

-- Primary entry point — no keybind needed, just type it. The settings
-- panel itself has a "Drag Mode" tab that opens the layout editor, so
-- this one command reaches everything.
RegisterCommand('hud', function() openNui('settings:open') end, false)

-- ---------------------------------------------------------------
-- Promo offer ticker (unchanged)
-- ---------------------------------------------------------------
CreateThread(function()
    Wait(30000)
    while true do
        SendNUIMessage({ action = 'showOffer' })
        Wait(20000)
        SendNUIMessage({ action = 'hideOffer' })
        Wait(60000 * 120)
    end
end)
