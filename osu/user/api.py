import pyotp
from django.conf import settings
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import AbstractBaseUser
from django.core.mail import send_mail
from django.http import HttpRequest
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.utils.timezone import now
from django.views.decorators.csrf import csrf_exempt
from ninja import Router

from osu.commons import AuthenticatedHttpRequest, Response, message_response

from .models import User
from .schema import (
    Credentials,
    OTPLoginCredentials,
    OTPRequestCredentials,
    OTPRequestResponse,
    UserSchema,
)
from .utils import get_email_hash

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


@router.post("/login/otp/request", auth=None, response={200: OTPRequestResponse})
def get_otp(
    request: HttpRequest, credentials: OTPRequestCredentials
) -> tuple[int, dict[str, int | str]]:
    credentials.email = credentials.email.strip().lower()
    email_hash = get_email_hash(credentials.email)
    totp = pyotp.TOTP(email_hash)
    current_ts = int(now().timestamp())
    otp = totp.generate_otp(current_ts)

    subject = "OTP to Sign in to Off Season Ultimate Website"
    html_message = render_to_string("mail/otp.html", {"otp": otp})
    plain_message = strip_tags(html_message)
    from_email = settings.EMAIL_HOST_USER
    to = credentials.email

    send_mail(subject, plain_message, from_email, [to], html_message=html_message)

    return 200, {"otp_ts": current_ts}


@router.post("/login/otp", auth=None, response={200: UserSchema, 403: Response, 404: Response})
def otp_login(
    request: HttpRequest, credentials: OTPLoginCredentials
) -> tuple[int, User | message_response]:
    credentials.email = credentials.email.strip().lower()
    email_hash = get_email_hash(credentials.email)
    totp = pyotp.TOTP(email_hash)
    actual_otp = totp.generate_otp(credentials.otp_ts)

    if actual_otp == credentials.otp:
        user, created = User.objects.get_or_create(
            email=credentials.email, username=credentials.email
        )
        request.user = user
        login(request, user)
        return 200, user

    return 403, {"message": "Invalid OTP"}
