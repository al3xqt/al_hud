fx_version 'cerulean'
game 'gta5'
lua54 'yes'

name 'al_hud'
author 'al_hud by Codex'
description 'Custom ESX HUD with integrated AL style speedometer'
version '1.0.0'

shared_scripts {
    'config.lua',
    'postal/config.lua'
}

client_scripts {
    'postal/cl.lua',
    'client/main.lua'
}

server_scripts {
    '@mysql-async/lib/MySQL.lua',
    'server/main.lua'
}

ui_page 'html/index.html'

files {
    'html/index.html',
    'html/style.css',
    'html/script.js',
    'html/assets/logo.png',
    'html/assets/others/*.png',
    'html/assets/server-logo.svg',
    'postal/new-postals.json'
}

postal_file 'postal/new-postals.json'

exports {
    'getPostal',
    'getPostalForCoords'
}
