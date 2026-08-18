--[[
    AL HUD FRAMEWORK — client/bridge/esx.lua
    Framework adapter for ESX Legacy / ESX 1.1 / ESX 1.2.
    This is a 1:1 port of the original al_hud logic, so every
    existing feature (job2, esx_mafia integration, society money,
    al_hud:* server callbacks) keeps working exactly as before.
]]

local M = {}
M.Name = 'esx'

local ESX = nil
local playerData = {}
local job2Source = 'job2'
local job2SocietyMoney = 0

local function buildJobLabel(job)
    if not job then return 'Unemployed' end
    local label = job.label or job.name or 'Unemployed'
    local grade = job.grade_label or job.grade_name
    if grade and grade ~= '' and grade ~= label then
        label = ('%s | %s'):format(label, grade)
    end
    return label
end

local function prettifyGrade(grade)
    if not grade then return nil end
    local text = tostring(grade):gsub('_', ' '):gsub('-', ' ')
    text = text:gsub('%s+', ' '):gsub('^%s+', ''):gsub('%s+$', '')
    if text == '' then return nil end
    return text:gsub('(%a)([%w]*)', function(first, rest) return first:upper() .. rest:lower() end)
end

local function buildMafiaLabel(mafiaName, mafiaGrade)
    if not mafiaName or mafiaName == '' then return nil end
    local gradeLabel = prettifyGrade(mafiaGrade)
    if gradeLabel and gradeLabel ~= '' and gradeLabel ~= mafiaName then
        return ('%s | %s'):format(mafiaName, gradeLabel)
    end
    return mafiaName
end

local function getSecondJobLabel()
    if playerData and playerData.job2 then
        return buildJobLabel(playerData.job2)
    end
    return 'No Second Job'
end

local function setLocalAccounts(accounts, out)
    if type(accounts) ~= 'table' then return end
    for _, account in pairs(accounts) do
        local name = account.name and string.lower(account.name) or ''
        local money = tonumber(account.money) or 0
        if name == 'bank' then out.bank = money
        elseif name == 'black_money' or name == 'blackmoney' then out.blackMoney = money
        elseif name == 'donate_coins' or name == 'donatecoins' then out.donateCoins = money end
    end
end

function M.WaitReady()
    while not ESX do
        local ok, sharedObject = pcall(function() return exports['es_extended']:getSharedObject() end)
        if ok and sharedObject then ESX = sharedObject break end
        TriggerEvent('esx:getSharedObject', function(obj) ESX = obj end)
        Wait(500)
    end
    while not ESX.GetPlayerData() or not ESX.GetPlayerData().job do
        Wait(250)
    end
    playerData = ESX.GetPlayerData()
end

function M.GetPlayerData()
    playerData = ESX.GetPlayerData() or {}
    local accounts = { bank = 0, blackMoney = 0, donateCoins = 0 }
    setLocalAccounts(playerData.accounts, accounts)

    return {
        job = buildJobLabel(playerData.job),
        job2 = (job2Source == 'mafia') and nil or getSecondJobLabel(), -- nil = "leave as is", mafia label pushed separately
        cash = tonumber(playerData.money) or 0,
        isBoss = playerData.job and playerData.job.grade_name == 'boss' or false,
        bank = accounts.bank,
        blackMoney = accounts.blackMoney,
        donateCoins = accounts.donateCoins,
        jobName = playerData.job and playerData.job.name or nil
    }
end

function M.TriggerServerCallback(name, cb, ...)
    if ESX and ESX.TriggerServerCallback then
        ESX.TriggerServerCallback(name, cb, ...)
    end
end

function M.GetStatus(cb)
    TriggerEvent('esx_status:getStatus', 'hunger', function(status)
        local hunger = math.floor(((status and status.val or 0) / 10000) + 0.5)
        TriggerEvent('esx_status:getStatus', 'thirst', function(status2)
            local thirst = math.floor(((status2 and status2.val or 0) / 10000) + 0.5)
            cb(hunger, thirst)
        end)
    end)
end

function M.RefreshJobs(hudState)
    M.TriggerServerCallback('al_hud:getPlayerJobs', function(payload)
        if type(payload) == 'table' then
            if payload.job and payload.job ~= '' then hudState.job = payload.job end
            hudState.job2 = (payload.job2 and payload.job2 ~= '') and payload.job2 or 'No Second Job'
            job2Source = payload.job2Source or 'job2'
            job2SocietyMoney = tonumber(payload.job2SocietyMoney) or 0
            return
        end

        M.TriggerServerCallback('al_hud:getSecondaryJob', function(job2Label)
            if job2Label and job2Label ~= '' then
                hudState.job2 = job2Label
            elseif not (playerData and playerData.job2) then
                hudState.job2 = 'No Second Job'
            end
            job2Source = 'job2'
            job2SocietyMoney = 0
        end)
    end)
end

function M.GetEconomy(cb)
    M.TriggerServerCallback('al_hud:getEconomy', cb)
    M.TriggerServerCallback('al_hud:getOnlineCount', function(count)
        cb(nil, count)
    end)
end

function M.GetSocietyMoney(hudState)
    if job2Source == 'mafia' then
        hudState.societyMoney = job2SocietyMoney
        return
    end
    if hudState.isBoss and playerData.job and playerData.job.name then
        M.TriggerServerCallback('al_hud:getSocietyMoney', function(money)
            hudState.societyMoney = tonumber(money) or 0
        end, playerData.job.name)
    else
        hudState.societyMoney = 0
    end
end

function M.RegisterEvents(onPlayerLoaded, onJobUpdate, onJob2Update)
    RegisterNetEvent('esx:playerLoaded', function(xPlayer)
        playerData = xPlayer or {}
        onPlayerLoaded()
    end)

    RegisterNetEvent('esx:setJob', function(job)
        playerData = playerData or {}
        playerData.job = job
        onJobUpdate(buildJobLabel(job), job and job.grade_name == 'boss' or false)
    end)

    RegisterNetEvent('esx:setJob2', function(job2)
        playerData = playerData or {}
        playerData.job2 = job2
        job2Source = 'job2'
        job2SocietyMoney = 0
        onJob2Update(getSecondJobLabel())
    end)

    RegisterNetEvent('hud:showplayerjobs', function(job1, job2)
        if job1 and job1 ~= '' then onJobUpdate(job1, nil) end
        job2Source = 'job2'
        job2SocietyMoney = 0
        onJob2Update((job2 and job2 ~= '') and job2 or 'No Second Job')
    end)

    RegisterNetEvent('esx_mafia:sendMafia', function(mafia, mafiaGrade)
        local label = buildMafiaLabel(mafia, mafiaGrade)
        if label then
            job2Source = 'mafia'
            onJob2Update(label)
        else
            job2Source = 'job2'
            job2SocietyMoney = 0
            onJob2Update(getSecondJobLabel())
        end
    end)

    RegisterNetEvent('esx:setAccountMoney', function(account)
        -- surfaced through the next GetPlayerData() poll; nothing to do live here,
        -- kept as a hook point for servers that want instant updates.
    end)

    TriggerServerEvent('esx_mafia:playerJoined')
end

-- FiveM shares one global Lua environment across all client_scripts of a
-- resource (there's no real `require`), so every bridge publishes itself
-- on a global table instead of returning a module. bridge/init.lua picks
-- the right one after framework auto-detection.
AlHudBridgeESX = M
