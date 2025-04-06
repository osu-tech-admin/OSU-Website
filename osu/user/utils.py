import hashlib
from base64 import b32encode

from django.conf import settings


def get_email_hash(email: str) -> str:
    email_hash = hashlib.sha256()
    email_hash.update(email.encode("utf-8"))
    email_hash.update(settings.OTP_EMAIL_HASH_KEY.encode("utf-8"))
    return b32encode(email_hash.hexdigest().encode("utf-8")).decode("utf-8")
