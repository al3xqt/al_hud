--[[
    AL HUD FRAMEWORK — client/bridge/init.lua
    Framework auto-detection. Runs after esx.lua / qbcore.lua /
    qbox.lua / standalone.lua have all defined their globals
    (fxmanifest.lua load order guarantees that), and picks one as
    `Bridge` for the rest of client/main.lua to use.

    Config.Framework can force a choice ('esx' | 'qbcore' | 'qbox' |
    'standalone'); 'auto' (default) detects by checking which
    core resource is actually running.
]]

local function resourceRunning(name)
    return GetResourceState(name) == 'started' or GetResourceState(name) == 'starting'
end

local function detectFramework()
    local forced = Config.Framework
    if forced and forced ~= 'auto' then
        return forced
    end

    if resourceRunning('qbx_core') then return 'qbox' end
    if resourceRunning('qb-core') then return 'qbcore' end
    if resourceRunning('es_extended') then return 'esx' end
    return 'standalone'
end

local chosen = detectFramework()

local map = {
    esx = function() return AlHudBridgeESX end,
    qbcore = function() return AlHudBridgeQBCore end,
    qbox = function() return AlHudBridgeQbox end,
    standalone = function() return AlHudBridgeStandalone end
}

Bridge = (map[chosen] or map.standalone)()

if not Bridge then
    -- the chosen framework's bridge file failed to load for some reason;
    -- standalone always exists, so fall back to it rather than erroring
    -- every subsequent frame.
    Bridge = AlHudBridgeStandalone
    chosen = 'standalone'
end

print(('[al_hud] framework detected: %s'):format(chosen))
