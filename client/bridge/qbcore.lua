--[[
    AL HUD FRAMEWORK — client/bridge/qbcore.lua
    Framework adapter for QBCore. Mapping notes (documented since
    QBCore has no 1:1 equivalent of every ESX-Legacy custom feature
    this HUD was originally built around):
      - ESX "job2" (esx_multijob / esx_mafia)  -> QBCore gang
      - ESX society money (per-job shared fund) -> al_hud:getSocietyMoney
        server callback, which you wire to whatever banking resource
        your server uses (qb-banking, qb-management, Renewed-Banking...)
      - "black money" / "donate coins" have no core QBCore concept —
        exposed as 0 unless your server's al_hud:getEconomy callback
        (server/main.lua) returns them from your own economy resource.
]]

local M = {}
M.Name = 'qbcore'

local QBCore = nil
local playerData = {}

local function buildJobLabel(job)
    if not job then return 'Unemployed' end
    local grade = job.grade and (job.grade.name or job.grade.level) or nil
    if grade and tostring(grade) ~= '' and tostring(grade) ~= job.label then
        return ('%s | %s'):format(job.label or job.name, tostring(grade))
    end
    return job.label or job.name or 'Unemployed'
end

local function buildGangLabel(gang)
    if not gang or gang.name == 'none' then return 'No Second Job' end
    return gang.label or gang.name
end

function M.WaitReady()
    while not QBCore do
        local ok, core = pcall(function() return exports['qb-core']:GetCoreObject() end)
        if ok and core then QBCore = core break end
        Wait(500)
    end
    while not QBCore.Functions.GetPlayerData or not next(QBCore.Functions.GetPlayerData()) do
        Wait(250)
    end
    playerData = QBCore.Functions.GetPlayerData()
end

function M.GetPlayerData()
    playerData = QBCore.Functions.GetPlayerData() or {}
    local money = playerData.money or {}

    return {
        job = buildJobLabel(playerData.job),
        job2 = buildGangLabel(playerData.gang),
        cash = tonumber(money.cash) or 0,
        isBoss = playerData.job and (playerData.job.isboss or playerData.job.grade and playerData.job.grade.level == 4) or false,
        bank = tonumber(money.bank) or 0,
        blackMoney = tonumber(money.crypto) or 0, -- closest built-in analogue; see header note
        donateCoins = 0,
        jobName = playerData.job and playerData.job.name or nil
    }
end

function M.TriggerServerCallback(name, cb, ...)
    if QBCore and QBCore.Functions and QBCore.Functions.TriggerCallback then
        QBCore.Functions.TriggerCallback(name, cb, ...)
    end
end

local lastHunger, lastThirst = 100, 100

function M.GetStatus(cb)
    local metadata = playerData and playerData.metadata
    if metadata and metadata.hunger ~= nil then
        cb(math.floor(metadata.hunger + 0.5), math.floor((metadata.thirst or 100) + 0.5))
    else
        -- older qb-hud releases push needs via 'hud:client:UpdateNeeds' instead
        -- of metadata; RegisterEvents() below keeps lastHunger/lastThirst fresh.
        cb(lastHunger, lastThirst)
    end
end

function M.RefreshJobs(_hudState)
    -- QBCore's job/gang are already live on playerData; nothing to poll server-side.
end

function M.GetEconomy(cb)
    M.TriggerServerCallback('al_hud:getEconomy', cb)
    M.TriggerServerCallback('al_hud:getOnlineCount', function(count) cb(nil, count) end)
end

function M.GetSocietyMoney(hudState)
    if hudState.isBoss and playerData.job and playerData.job.name then
        M.TriggerServerCallback('al_hud:getSocietyMoney', function(money)
            hudState.societyMoney = tonumber(money) or 0
        end, playerData.job.name)
    else
        hudState.societyMoney = 0
    end
end

function M.RegisterEvents(onPlayerLoaded, onJobUpdate, onJob2Update)
    RegisterNetEvent('QBCore:Client:OnPlayerLoaded', function()
        playerData = QBCore.Functions.GetPlayerData()
        onPlayerLoaded()
    end)

    RegisterNetEvent('QBCore:Client:OnJobUpdate', function(job)
        playerData.job = job
        onJobUpdate(buildJobLabel(job), job and (job.isboss or (job.grade and job.grade.level == 4)) or false)
    end)

    RegisterNetEvent('QBCore:Client:OnGangUpdate', function(gang)
        playerData.gang = gang
        onJob2Update(buildGangLabel(gang))
    end)

    -- Older qb-hud releases push needs via this event instead of metadata polling.
    RegisterNetEvent('hud:client:UpdateNeeds', function(newHunger, newThirst)
        lastHunger = tonumber(newHunger) or lastHunger
        lastThirst = tonumber(newThirst) or lastThirst
    end)
end

AlHudBridgeQBCore = M
