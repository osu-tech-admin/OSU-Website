from ninja import NinjaAPI
from ninja.security import django_auth

from osu.user.api import router as user_router

api = NinjaAPI(auth=django_auth, csrf=True)

# Routers
api.add_router("/user", user_router)
