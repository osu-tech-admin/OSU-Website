from django.http import HttpRequest
from ninja.schema import Schema

from osu.user.models import User


class AuthenticatedHttpRequest(HttpRequest):
    user: User


class Response(Schema):
    message: str
    description: str | None = None
    action_name: str | None = None
    action_href: str | None = None


message_response = dict[str, str]
validation_error_dict = dict[str, list[int]]
