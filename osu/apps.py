from typing import Any

from django.apps import AppConfig
from django.conf import settings
from django.core.checks import Error, Tags, register


@register(Tags.security, deploy=True)
def enforce_otp_email_hash(app_configs: Any, **kwargs: Any) -> list[Error]:
    errors = []
    if not settings.OTP_EMAIL_HASH_KEY:
        errors.append(
            Error(
                "OTP_EMAIL_HASH_KEY needs to be set",
                hint="Set the environment variable to be non-empty.",
                obj=settings,
                id="server.E001",
            )
        )
    return errors


@register(Tags.security, deploy=True)
def enforce_passkey_secret_api_key(app_configs: Any, **kwargs: Any) -> list[Error]:
    errors = []
    if not settings.PASSKEY_SECRET_API_KEY:
        errors.append(
            Error(
                "PASSKEY_SECRET_API_KEY needs to be set",
                hint="Set the environment variable to be non-empty.",
                obj=settings,
                id="server.E002",
            )
        )
    return errors


@register(Tags.security, deploy=True)
def enforce_passkey_tenant_id(app_configs: Any, **kwargs: Any) -> list[Error]:
    errors = []
    if not settings.PASSKEY_TENANT_ID:
        errors.append(
            Error(
                "PASSKEY_TENANT_ID needs to be set",
                hint="Set the environment variable to be non-empty.",
                obj=settings,
                id="server.E003",
            )
        )
    return errors


@register(Tags.security, deploy=True)
def enforce_email_host_user(app_configs: Any, **kwargs: Any) -> list[Error]:
    errors = []
    if not settings.EMAIL_HOST_USER:
        errors.append(
            Error(
                "EMAIL_HOST_USER needs to be set",
                hint="Set the environment variable to be non-empty.",
                obj=settings,
                id="server.E004",
            )
        )
    return errors


@register(Tags.security, deploy=True)
def enforce_email_host_password(app_configs: Any, **kwargs: Any) -> list[Error]:
    errors = []
    if not settings.EMAIL_HOST_PASSWORD:
        errors.append(
            Error(
                "EMAIL_HOST_PASSWORD needs to be set",
                hint="Set the environment variable to be non-empty.",
                obj=settings,
                id="server.E005",
            )
        )
    return errors


class OsuConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "osu"
