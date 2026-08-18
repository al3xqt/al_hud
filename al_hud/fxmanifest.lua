fx_version 'cerulean'
game 'gta5'
lua54 'yes'

name 'al_hud'
author 'al_hud by Codex — AL HUD Framework'
description 'Premium multi-framework FiveM HUD: 5 themes, 6 speedometers, live settings panel, drag & drop layout editor'
version '2.5.1'

shared_scripts {
    'config.lua',
    'postal/config.lua'
}

-- Load order matters: config.lua must exist first (bridge/standalone.lua
-- reads Config.Standalone at file scope), each bridge/*.lua must publish
-- its global before bridge/init.lua picks one, and main.lua needs Bridge
-- to already exist.
client_scripts {
    'postal/cl.lua',
    'client/weapons.lua',
    'client/minimap.lua',
    'client/bridge/esx.lua',
    'client/bridge/qbcore.lua',
    'client/bridge/qbox.lua',
    'client/bridge/standalone.lua',
    'client/bridge/init.lua',
    'client/main.lua'
}

server_scripts {
    '@mysql-async/lib/MySQL.lua', -- only used by the ESX job2/mafia lookup; harmless if not present on other frameworks
    'server/main.lua'
}

ui_page 'html/index.html'

files {
    'html/index.html',
    'html/styles/*.css',
    'html/styles/themes/*.css',
    'html/js/core/*.js',
    'html/js/components/*.js',
    'html/js/speedometers/*.js',
    'html/js/vitals/*.js',
    'html/js/money/*.js',
    'html/js/weapon/*.js',
    'html/js/settings/*.js',
    'html/js/editor/*.js',
    'html/js/main.js',
    'html/assets/logo.png',
    'html/assets/others/*.png',
    'html/assets/others/*.gif',
    'postal/new-postals.json'
}

postal_file 'postal/new-postals.json'

-- Legacy-style exports (global functions) still need declaring here.
-- The Standalone bridge's SetJob/SetJob2/SetMoney use the modern
-- `exports('name', fn)` runtime call instead, which needs no manifest
-- entry — they're just listed in client/bridge/standalone.lua.
exports {
    'getPostal',
    'getPostalForCoords'
}
