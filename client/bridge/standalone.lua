--[[
    AL HUD FRAMEWORK — client/bridge/standalone.lua
    No-framework adapter. Job/money/hunger/thirst have no external
    source of truth here, so they're driven by Config.Standalone
    and by two exports (SetJob / SetMoney) other resources can call.
    This keeps the HUD fully usable on a bare FXServer with zero
    dependencies, at the cost of those fields being static until a
    script wires the exports below.
]]

local M = {}
M.Name = 'standalone'

local state = {
    job = Config.Standalone and Config.Standalone.DefaultJob or 'Civilian',
    job2 = 'No Second Job',
    cash = 0,
    bank = 0
}

exports('SetJob', function(label) state.job = label end)
exports('SetJob2', function(label) state.job2 = label or 'No Second Job' end)
exports('SetMoney', function(cash, bank) state.cash = tonumber(cash) or state.cash; state.bank = tonumber(bank) or state.bank end)

function M.WaitReady()
    -- nothing to wait for; ready on resource start
end

function M.GetPlayerData()
    return {
        job = state.job,
        job2 = state.job2,
        cash = state.cash,
        isBoss = false,
        bank = state.bank,
        blackMoney = 0,
        donateCoins = 0,
        jobName = nil
    }
end

function M.TriggerServerCallback(name, cb, ...)
    -- standalone still exposes the al_hud:* server callbacks (see
    -- server/main.lua) so a buyer can wire economy/online-count without
    -- adopting a full framework.
    local args = { ... }
    TriggerServerEvent('al_hud:standaloneCallback', name, args)
    RegisterNetEvent('al_hud:standaloneCallback:reply:' .. name, function(...)
        cb(...)
    end)
end

function M.GetStatus(cb)
    cb(100, 100) -- no hunger/thirst source without a framework; always full
end

function M.RefreshJobs(_hudState) end

function M.GetEconomy(cb)
    M.TriggerServerCallback('al_hud:getEconomy', cb)
    M.TriggerServerCallback('al_hud:getOnlineCount', function(count) cb(nil, count) end)
end

function M.GetSocietyMoney(hudState)
    hudState.societyMoney = 0
end

function M.RegisterEvents(_onPlayerLoaded, _onJobUpdate, _onJob2Update)
    -- no framework login event to hook; hud:init fires as soon as the
    -- resource starts (see client/main.lua boot thread).
end

AlHudBridgeStandalone = M
