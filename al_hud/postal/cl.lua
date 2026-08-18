local raw = LoadResourceFile(GetCurrentResourceName(), 'postal/new-postals.json')
local postals = raw and json.decode(raw) or {}
local nearest = nil
local activeRouteBlip = nil

local function notify(message)
    if ESX and ESX.ShowNotification then
        ESX.ShowNotification(message)
    else
        BeginTextCommandThefeedPost('STRING')
        AddTextComponentSubstringPlayerName(message)
        EndTextCommandThefeedPostTicker(false, false)
    end
end

local function findNearestIndex(coords)
    local nearestIndex = -1
    local nearestDistance = -1.0

    for i = 1, #postals do
        local postal = postals[i]
        local dx = coords.x - postal.x
        local dy = coords.y - postal.y
        local distance = (dx * dx) + (dy * dy)

        if nearestDistance < 0 or distance < nearestDistance then
            nearestDistance = distance
            nearestIndex = i
        end
    end

    return nearestIndex
end

CreateThread(function()
    while true do
        local ped = PlayerPedId()
        local coords = GetEntityCoords(ped)
        local nearestIndex = findNearestIndex(coords)

        if nearestIndex ~= -1 then
            local p = postals[nearestIndex]
            local dx = coords.x - p.x
            local dy = coords.y - p.y
            nearest = {
                index = nearestIndex,
                distance = math.sqrt((dx * dx) + (dy * dy))
            }
        end

        if activeRouteBlip then
            local blipCoords = vector2(activeRouteBlip.x, activeRouteBlip.y)
            local distance = #(vector2(coords.x, coords.y) - blipCoords)
            if distance <= (PostalConfig.deleteDistance or 100.0) then
                RemoveBlip(activeRouteBlip.handle)
                activeRouteBlip = nil
                notify('GPS route cleared.')
            end
        end

        Wait(1250)
    end
end)

function getPostal()
    while nearest == nil do
        Wait(10)
    end
    return postals[nearest.index].code
end

function getPostalForCoords(coords)
    local nearestIndex = findNearestIndex(coords)
    if nearestIndex == -1 then
        return '----'
    end
    return postals[nearestIndex].code
end

RegisterCommand('gps', function(_, args)
    if #args < 1 then
        if activeRouteBlip then
            RemoveBlip(activeRouteBlip.handle)
            activeRouteBlip = nil
            notify('GPS route removed.')
        else
            notify('Usage: /gps [postal]')
        end
        return
    end

    local targetCode = string.upper(args[1])
    local found = nil

    for i = 1, #postals do
        if string.upper(postals[i].code) == targetCode then
            found = postals[i]
            break
        end
    end

    if not found then
        notify('Postal not found.')
        return
    end

    if activeRouteBlip then
        RemoveBlip(activeRouteBlip.handle)
    end

    local handle = AddBlipForCoord(found.x, found.y, 0.0)
    SetBlipSprite(handle, PostalConfig.blipSprite or 8)
    SetBlipColour(handle, PostalConfig.blipColor or 3)
    SetBlipRoute(handle, true)
    SetBlipRouteColour(handle, PostalConfig.blipColor or 3)
    BeginTextCommandSetBlipName('STRING')
    AddTextComponentSubstringPlayerName(('Postal %s'):format(found.code))
    EndTextCommandSetBlipName(handle)
    SetNewWaypoint(found.x, found.y)

    activeRouteBlip = {
        handle = handle,
        x = found.x,
        y = found.y,
        code = found.code
    }

    notify(('Route set to postal %s.'):format(found.code))
end, false)
