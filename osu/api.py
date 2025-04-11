from ninja import NinjaAPI
from ninja.security import django_auth

from osu.match.api import router as match_router
from osu.player.api import router as player_router
from osu.team.api import router as team_router
from osu.tournament.api import router as tournament_router
from osu.user.api import router as user_router

api = NinjaAPI(auth=django_auth, csrf=True)

# Routers
api.add_router("/user", user_router)
api.add_router("/players", player_router)
api.add_router("/teams", team_router)
api.add_router("/tournaments", tournament_router)
api.add_router("/matches", match_router)
