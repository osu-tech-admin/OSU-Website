from ninja import NinjaAPI
from ninja.security import django_auth

from osu.player.api import router as player_router
from osu.user.api import router as user_router

api = NinjaAPI(auth=django_auth, csrf=True)

# Routers
api.add_router("/user", user_router)
api.add_router("/players", player_router)
