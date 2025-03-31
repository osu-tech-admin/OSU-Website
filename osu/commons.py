from django.http import HttpRequest
from ninja.schema import Schema

from osu.user.models import User


class AuthenticatedHttpRequest(HttpRequest):
    user: User


class Response(Schema):
    message: str
    description: str | None
    action_name: str | None
    action_href: str | None


message_response = dict[str, str]
