
config = {
	versionCheck = true, -- enables version checking (if this is enabled and there is no new version it won't display a message anyways)
	text = {
		format = '~b~GPS~w~: %s   ~b~AFM :  ~r~%s ~w~\n%s',
        posX = 0.07,
        posY = 0.72
	},
	blip = {
		blipText = 'Postal Route %s',
		sprite = 8,
		color = 3, -- default 3 (light blue)
		distToDelete = 100.0, -- in meters
		deleteText = 'Route deleted',
		drawRouteText = 'Drawing a route to %s',
		notExistText = "That postal doesn't exist"
	}
}
