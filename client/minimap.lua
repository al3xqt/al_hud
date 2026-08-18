--[[
    AL HUD FRAMEWORK — client/minimap.lua
    Real minimap repositioning using SetMinimapComponentPosition —
    this actually moves the native GTA minimap, not a cosmetic NUI
    element. x/y are offsets in the native's normalized coordinate
    space (roughly -0.3..0.3), scale multiplies the base size.
    Driven by the settings panel's "Adjust Minimap Position" tab
    via the `updateMinimap` NUI callback.
]]

-- Base position/size GTA uses for the default bottom-left minimap.
local BASE = { x = 0.0, y = 0.0, w = 0.1638, h = 0.1834 }

local function applyMinimapPosition(offsetX, offsetY, scale)
    offsetX = tonumber(offsetX) or 0.0
    offsetY = tonumber(offsetY) or 0.0
    scale = tonumber(scale) or 1.0

    local width = BASE.w * scale
    local height = BASE.h * scale
    local x = BASE.x + offsetX
    local y = BASE.y + offsetY

    SetMinimapClipType(0)
    SetMinimapComponentPosition('minimap', 'L', 'B', x - 0.0055, y - 0.037, width, height)
    SetMinimapComponentPosition('minimap_mask', 'L', 'B', x + 0.020, y + 0.020, width * 0.62, height * 1.0)
    SetMinimapComponentPosition('minimap_blur', 'L', 'B', x - 0.032, y - 0.011, width * 1.964, height * 1.19)
end

RegisterNUICallback('updateMinimap', function(data, cb)
    applyMinimapPosition(data.x, data.y, data.scale)
    cb('ok')
end)

-- Reapply on resource start / respawn so a saved offset survives a
-- reconnect even before the settings panel sends its first update
-- (the NUI side re-sends its saved value once the page loads anyway,
-- but this avoids a one-frame flash of the default position).
CreateThread(function()
    Wait(500)
    applyMinimapPosition(0.0, 0.0, 1.0)
end)
