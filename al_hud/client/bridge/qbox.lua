--[[
    AL HUD FRAMEWORK — client/bridge/qbox.lua
    Framework adapter for Qbox (qbx_core). Qbox intentionally keeps
    QBCore's PlayerData shape and 'QBCore:Client:*' events for
    compatibility, so this bridge mirrors qbcore.lua but reads the
    object from the 'qbx_core' export instead of 'qb-core'. Kept as
    its own file (not a re-export of qbcore.lua) so a server running
    Qbox never depends on qb-core existing at all.
]]

local M = {}
M.Name = 'qbox'

local Core = nil
local playerData = {}
local lastHunger, lastThirst = 100, 100

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
    while not Core do
        local ok, core = pcall(function() return exports['qbx_core']:GetCoreObject() end)
        if ok and core then Core = core break end
        Wait(500)
    end
    while not Core.Functions.GetPlayerData or not next(Core.Functions.GetPlayerData()) do
        Wait(250)
    end
    playerData = Core.Functions.GetPlayerData()
end

function M.GetPlayerData()
    playerData = Core.Functions.GetPlayerData() or {}
    local money = playerData.money or {}

    return {
        job = buildJobLabel(playerData.job),
        job2 = buildGangLabel(playerData.gang),
        cash = tonumber(money.cash) or 0,
        isBoss = playerData.job and (playerData.job.isboss or playerData.job.grade and playerData.job.grade.level == 4) or false,
        bank = tonumber(money.bank) or 0,
        blackMoney = tonumber(money.crypto) or 0,
        donateCoins = 0,
        jobName = playerData.job and playerData.job.name or nil
    }
end

function M.TriggerServerCallback(name, cb, ...)
    if Core and Core.Functions and Core.Functions.TriggerCallback then
        Core.Functions.TriggerCallback(name, cb, ...)
    end
end

function M.GetStatus(cb)
    local metadata = playerData and playerData.metadata
    if metadata and metadata.hunger ~= nil then
        cb(math.floor(metadata.hunger + 0.5), math.floor((metadata.thirst or 100) + 0.5))
    else
        cb(lastHunger, lastThirst)
    end
end

function M.RefreshJobs(_hudState) end

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
        playerData = Core.Functions.GetPlayerData()
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

    RegisterNetEvent('hud:client:UpdateNeeds', function(newHunger, newThirst)
        lastHunger = tonumber(newHunger) or lastHunger
        lastThirst = tonumber(newThirst) or lastThirst
    end)
end

AlHudBridgeQbox = M
