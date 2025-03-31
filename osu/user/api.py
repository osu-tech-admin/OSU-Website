from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import AbstractBaseUser
from django.http import HttpRequest
from django.views.decorators.csrf import csrf_exempt
from ninja import Router

from osu.commons import AuthenticatedHttpRequest, Response, message_response

from .schema import Credentials, UserSchema

router = Router()

# Login #########


@router.post("/login", auth=None, response={200: UserSchema, 403: Response})
def api_login(
    request: HttpRequest, credentials: Credentials
) -> tuple[int, AbstractBaseUser | message_response]:
    user = authenticate(
        request, username=credentials.username.strip().lower(), password=credentials.password
    )
    if user is not None:
        login(request, user)
        return 200, user
    else:
        return 403, {"message": "Invalid credentials"}


@router.post("/logout", response={200: Response})
@csrf_exempt
def api_logout(request: AuthenticatedHttpRequest) -> tuple[int, message_response]:
    logout(request)
    return 200, {"message": "Logged out"}
