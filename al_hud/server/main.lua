--[[
    AL HUD FRAMEWORK — server/main.lua
    Framework-aware server callbacks. Kept as a single file on
    purpose: the amount of server-side logic that actually differs
    per framework is small, and splitting it into a server/bridge/*
    mirror of the client would add indirection without saving code.

    RegisterServerCallback() below normalizes ESX / QBCore / Qbox's
    callback APIs (which already share the same (source, cb, ...)
    signature) and adds a lightweight event-based RPC fallback for
    Standalone, so al_hud:* callback names work identically no
    matter which client bridge is talking to them.
]]

local FRAMEWORK = 'standalone'
local ESX, QBCore = nil, nil

local function resourceRunning(name)
    return GetResourceState(name) == 'started' or GetResourceState(name) == 'starting'
end

CreateThread(function()
    local forced = Config.Framework
    if forced and forced ~= 'auto' then
        FRAMEWORK = forced
    elseif resourceRunning('qbx_core') then
        FRAMEWORK = 'qbox'
    elseif resourceRunning('qb-core') then
        FRAMEWORK = 'qbcore'
    elseif resourceRunning('es_extended') then
        FRAMEWORK = 'esx'
    else
        FRAMEWORK = 'standalone'
    end

    if FRAMEWORK == 'esx' then
        ESX = exports['es_extended']:getSharedObject()
    elseif FRAMEWORK == 'qbcore' then
        QBCore = exports['qb-core']:GetCoreObject()
    elseif FRAMEWORK == 'qbox' then
        QBCore = exports['qbx_core']:GetCoreObject()
    end

    print(('[al_hud] server framework: %s'):format(FRAMEWORK))
end)

-- ---------------------------------------------------------------
-- Server-wide theme/speedometer defaults ("Make Default" in the
-- settings panel). Framework-independent — just KVP + ACE, no
-- dependency on ESX/QBCore's callback systems, so it works even
-- while the framework-detection thread above is still running.
-- ---------------------------------------------------------------
local KVP_KEYS = {
    theme = 'al_hud_default_theme',
    speedometer = 'al_hud_default_speedometer',
    vitalsTheme = 'al_hud_default_vitals_theme',
    moneyTheme = 'al_hud_default_money_theme',
    weaponTheme = 'al_hud_default_weapon_theme'
}

RegisterNetEvent('al_hud:getServerDefaults', function()
    local src = source
    TriggerClientEvent('al_hud:serverDefaults', src, {
        theme = GetResourceKvpString(KVP_KEYS.theme),
        speedometer = GetResourceKvpString(KVP_KEYS.speedometer),
        vitalsTheme = GetResourceKvpString(KVP_KEYS.vitalsTheme),
        moneyTheme = GetResourceKvpString(KVP_KEYS.moneyTheme),
        weaponTheme = GetResourceKvpString(KVP_KEYS.weaponTheme)
    })
end)

RegisterNetEvent('al_hud:setServerDefault', function(kind, value)
    local src = source
    if not IsPlayerAceAllowed(src, 'al_hud.admin') then
        TriggerClientEvent('al_hud:setServerDefaultResult', src, false, 'no_permission')
        return
    end
    local kvpKey = KVP_KEYS[kind]
    if not kvpKey then
        TriggerClientEvent('al_hud:setServerDefaultResult', src, false, 'bad_kind')
        return
    end
    SetResourceKvp(kvpKey, tostring(value))
    TriggerClientEvent('al_hud:setServerDefaultResult', src, true, kind)
end)

-- ---------------------------------------------------------------
-- Callback normalization
-- ---------------------------------------------------------------
local standaloneCallbacks = {}

local function registerServerCallback(name, fn)
    if FRAMEWORK == 'esx' then
        ESX.RegisterServerCallback(name, fn)
    elseif FRAMEWORK == 'qbcore' or FRAMEWORK == 'qbox' then
        QBCore.Functions.CreateCallback(name, fn)
    else
        standaloneCallbacks[name] = fn
    end
end

RegisterNetEvent('al_hud:standaloneCallback', function(name, args)
    local src = source
    local fn = standaloneCallbacks[name]
    if not fn then return end
    fn(src, function(...)
        TriggerClientEvent('al_hud:standaloneCallback:reply:' .. name, src, ...)
    end, table.unpack(args or {}))
end)

-- ---------------------------------------------------------------
-- Shared callbacks (all frameworks)
-- ---------------------------------------------------------------
CreateThread(function()
    Wait(0) -- let the framework-detection thread above run first

    registerServerCallback('al_hud:getOnlineCount', function(_, cb)
        cb(#GetPlayers())
    end)

    if FRAMEWORK == 'esx' then
        registerServerCallback('al_hud:getEconomy', function(src, cb)
            local xPlayer = ESX.GetPlayerFromId(src)
            if not xPlayer then cb(nil) return end

            local function accountMoney(names)
                for _, accountName in ipairs(names) do
                    local account = xPlayer.getAccount(accountName)
                    if account and type(account.money) == 'number' then return account.money end
                end
                return 0
            end

            cb({
                cash = xPlayer.getMoney and xPlayer.getMoney() or 0,
                bank = accountMoney({ 'bank' }),
                blackMoney = accountMoney({ 'black_money', 'blackmoney' }),
                donateCoins = accountMoney({ 'donate_coins', 'donatecoins' })
            })
        end)

        registerServerCallback('al_hud:getSocietyMoney', function(_, cb, jobName)
            if not jobName or jobName == '' or GetResourceState('esx_addonaccount') ~= 'started' then
                cb(0)
                return
            end
            TriggerEvent('esx_addonaccount:getSharedAccount', ('society_%s'):format(jobName), function(account)
                cb(account and account.money or 0)
            end)
        end)

    elseif FRAMEWORK == 'qbcore' or FRAMEWORK == 'qbox' then
        registerServerCallback('al_hud:getEconomy', function(src, cb)
            local Player = QBCore.Functions.GetPlayer(src)
            if not Player then cb(nil) return end
            local money = Player.PlayerData.money or {}
            cb({ cash = money.cash or 0, bank = money.bank or 0, blackMoney = money.crypto or 0, donateCoins = 0 })
        end)

        -- No single standard "society money" export across QBCore banking
        -- resources (qb-banking / qb-management / Renewed-Banking all
        -- differ). Wire your server's resource here — this best-effort
        -- version tries qb-management's GetAccount if it's running, and
        -- otherwise reports 0 rather than guessing at an export that
        -- might not exist.
        registerServerCallback('al_hud:getSocietyMoney', function(_, cb, jobName)
            if not jobName or jobName == '' or not resourceRunning('qb-management') then
                cb(0)
                return
            end
            local ok, result = pcall(function()
                return exports['qb-management']:GetAccount(jobName)
            end)
            cb(ok and tonumber(result) or 0)
        end)

    else -- standalone
        registerServerCallback('al_hud:getEconomy', function(_, cb)
            cb(nil) -- client already has cash/bank from its own SetMoney export; nothing to add
        end)
        registerServerCallback('al_hud:getSocietyMoney', function(_, cb)
            cb(0)
        end)
    end
end)

-- ---------------------------------------------------------------
-- ESX-only: job2 / esx_mafia resolution (this HUD's original
-- custom feature — no equivalent needed for QBCore/Qbox, whose
-- client bridge already reads job + gang straight off PlayerData)
-- ---------------------------------------------------------------
CreateThread(function()
    Wait(0)
    if FRAMEWORK ~= 'esx' then return end

    local playerExtraJobs = {}

    local function hasMysqlAvailable()
        return (MySQL and MySQL.query) or (MySQL and MySQL.Async and MySQL.Async.fetchAll)
    end

    local function dbFetchAll(query, params, cb)
        params = params or {}
        if MySQL and MySQL.query then
            MySQL.query(query, params, function(result) cb(result or {}) end)
            return
        end
        if MySQL and MySQL.Async and MySQL.Async.fetchAll then
            MySQL.Async.fetchAll(query, params, function(result) cb(result or {}) end)
            return
        end
        cb({})
    end

    local function formatJobLabel(jobLabel, gradeLabel)
        local label = jobLabel or 'Unemployed'
        if gradeLabel and gradeLabel ~= '' and gradeLabel ~= label then
            return ('%s | %s'):format(label, gradeLabel)
        end
        return label
    end

    local function prettifyGradeLabel(value)
        if not value then return nil end
        local text = tostring(value):gsub('_', ' '):gsub('-', ' ')
        text = text:gsub('%s+', ' '):gsub('^%s+', ''):gsub('%s+$', '')
        if text == '' then return nil end
        return text:gsub('(%a)([%w]*)', function(first, rest) return first:upper() .. rest:lower() end)
    end

    local function resolveCriminalJobData(identifier, cb)
        if not hasMysqlAvailable() or not identifier then cb(nil) return end
        dbFetchAll([[
            SELECT u.mafia AS mafia_name, u.mafia_grade AS mafia_grade, ms.money AS mafia_money
            FROM users u
            LEFT JOIN mafia_status ms ON ms.mafia = u.mafia
            WHERE u.identifier = @identifier
            LIMIT 1
        ]], { ['@identifier'] = identifier }, function(result)
            local row = result and result[1]
            if not row or not row.mafia_name or row.mafia_name == '' then cb(nil) return end
            cb({ label = formatJobLabel(row.mafia_name, prettifyGradeLabel(row.mafia_grade)), money = tonumber(row.mafia_money) or 0 })
        end)
    end

    local function cachePlayerSecondJob(identifier, cb)
        if not hasMysqlAvailable() or not identifier then if cb then cb(nil) end return end
        dbFetchAll('SELECT job2, job2_grade FROM users WHERE identifier = @identifier LIMIT 1',
            { ['@identifier'] = identifier }, function(result)
                local row = result and result[1]
                if row and row.job2 and row.job2 ~= '' then
                    playerExtraJobs[identifier] = { job2 = row.job2, job2_grade = row.job2_grade }
                else
                    playerExtraJobs[identifier] = nil
                end
                if cb then cb(playerExtraJobs[identifier]) end
            end)
    end

    local function resolveSecondJobLabel(identifier, secondJob, cb)
        if type(secondJob) == 'table' and (secondJob.label or secondJob.name) then
            cb(formatJobLabel(secondJob.label or secondJob.name, secondJob.grade_label or secondJob.grade_name))
            return
        end

        local function resolveFromExtraJob(extraJob)
            if not extraJob or not extraJob.job2 or extraJob.job2 == '' then cb('No Second Job') return end
            if not hasMysqlAvailable() then cb(formatJobLabel(extraJob.job2, extraJob.job2_grade)) return end
            dbFetchAll([[
                SELECT j.label AS job_label, g.label AS grade_label
                FROM jobs j
                LEFT JOIN job_grades g ON g.job_name = j.name AND g.grade = @grade
                WHERE j.name = @job
                LIMIT 1
            ]], { ['@job'] = extraJob.job2, ['@grade'] = tonumber(extraJob.job2_grade) or extraJob.job2_grade or 0 }, function(result)
                local row = result and result[1]
                if row and row.job_label then
                    cb(formatJobLabel(row.job_label, row.grade_label))
                else
                    cb(formatJobLabel(extraJob.job2, extraJob.job2_grade))
                end
            end)
        end

        local cached = playerExtraJobs[identifier]
        if hasMysqlAvailable() and identifier then
            cachePlayerSecondJob(identifier, resolveFromExtraJob)
        elseif cached then
            resolveFromExtraJob(cached)
        else
            resolveFromExtraJob(nil)
        end
    end

    AddEventHandler('esx:playerLoaded', function(playerId, xPlayer)
        local sourcePlayer = xPlayer or ESX.GetPlayerFromId(playerId)
        if sourcePlayer and sourcePlayer.identifier then cachePlayerSecondJob(sourcePlayer.identifier) end
    end)

    AddEventHandler('playerDropped', function()
        local xPlayer = ESX.GetPlayerFromId(source)
        if xPlayer and xPlayer.identifier then playerExtraJobs[xPlayer.identifier] = nil end
    end)

    registerServerCallback('al_hud:getSecondaryJob', function(src, cb)
        local xPlayer = ESX.GetPlayerFromId(src)
        if not xPlayer then cb(nil) return end
        local secondJob = xPlayer.job2 or (xPlayer.get and xPlayer.get('job2'))
        resolveCriminalJobData(xPlayer.identifier, function(criminalData)
            if criminalData and criminalData.label then cb(criminalData.label) return end
            resolveSecondJobLabel(xPlayer.identifier, secondJob, cb)
        end)
    end)

    registerServerCallback('al_hud:getPlayerJobs', function(src, cb)
        local xPlayer = ESX.GetPlayerFromId(src)
        if not xPlayer then cb(nil) return end

        local primary = formatJobLabel(
            xPlayer.job and (xPlayer.job.label or xPlayer.job.name) or 'Unemployed',
            xPlayer.job and (xPlayer.job.grade_label or xPlayer.job.grade_name) or nil
        )
        local secondJob = xPlayer.job2 or (xPlayer.get and xPlayer.get('job2'))

        resolveCriminalJobData(xPlayer.identifier, function(criminalData)
            if criminalData and criminalData.label then
                cb({ job = primary, job2 = criminalData.label, job2Source = 'mafia', job2SocietyMoney = criminalData.money })
                return
            end
            resolveSecondJobLabel(xPlayer.identifier, secondJob, function(secondary)
                cb({ job = primary, job2 = secondary or 'No Second Job', job2Source = 'job2', job2SocietyMoney = 0 })
            end)
        end)
    end)

    RegisterNetEvent('hud:getPlayerEvents', function()
        local src = source
        local xPlayer = ESX.GetPlayerFromId(src)
        if not xPlayer then return end

        local primary = formatJobLabel(
            xPlayer.job and (xPlayer.job.label or xPlayer.job.name) or 'Unemployed',
            xPlayer.job and (xPlayer.job.grade_label or xPlayer.job.grade_name) or nil
        )
        local secondJob = xPlayer.job2 or (xPlayer.get and xPlayer.get('job2'))

        resolveCriminalJobData(xPlayer.identifier, function(criminalData)
            if criminalData and criminalData.label then
                TriggerClientEvent('hud:showplayerjobs', src, primary, criminalData.label)
                return
            end
            resolveSecondJobLabel(xPlayer.identifier, secondJob, function(secondary)
                TriggerClientEvent('hud:showplayerjobs', src, primary, secondary or 'No Second Job')
            end)
        end)
    end)
end)
