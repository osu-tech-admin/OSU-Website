from pathlib import Path
from typing import Any

from django.db import models
from django.utils.crypto import get_random_string
from django.utils.translation import gettext_lazy as _

from osu.team.models import Team
from osu.user.models import User
from osu.utils import slugify_max


def upload_player_profile_picture(instance: "Player", filename: str) -> str:
    parent = Path("player_profile_pictures")
    path = Path(filename)
    new_name = f"{path.stem}-{get_random_string(12)}{path.suffix}"
    return str(parent / new_name)


class Player(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="player_profile")
    date_of_birth = models.DateField(null=True, blank=True)
    slug = models.SlugField(max_length=45, unique=True, null=True, blank=True, db_index=True)
    profile_picture = models.FileField(
        upload_to=upload_player_profile_picture, null=True, blank=True, max_length=256
    )

    class GenderTypes(models.TextChoices):
        MALE = "M", _("Male")
        FEMALE = "F", _("Female")
        OTHER = "O", _("Other")

    gender = models.CharField(max_length=5, choices=GenderTypes.choices)
    other_gender = models.CharField(max_length=30, null=True, blank=True)

    class MatchupTypes(models.TextChoices):
        MALE = "M", _("Male matching")
        FEMALE = "F", _("Female matching")

    match_up = models.CharField(max_length=20, choices=MatchupTypes.choices)
    city = models.CharField(max_length=100)
    teams = models.ManyToManyField(Team, related_name="players", blank=True)

    class ThrowingHandTypes(models.TextChoices):
        LEFT = "L", _("Left")
        RIGHT = "R", _("Right")

    class PrefferedRoleTypes(models.TextChoices):
        CUTTER = "C", _("Cutter")
        HANDLER = "H", _("Handler")

    throwing_hand = models.CharField(
        max_length=10, choices=ThrowingHandTypes.choices, null=True, blank=True
    )
    preffered_role = models.CharField(
        max_length=10, choices=PrefferedRoleTypes.choices, null=True, blank=True
    )

    def __str__(self) -> str:
        return self.user.get_full_name()

    def save(self, *args: Any, **kwargs: Any) -> None:
        if not self.slug:
            slug = self.get_slug()
            self.slug = slug
            self.ultimate_central_slug = slug
        return super().save(*args, **kwargs)

    def get_slug(self) -> str:
        slug = slugify_max(self.user.get_full_name(), 40)
        unique_slug = slug

        number = 1
        while Player.objects.filter(slug=unique_slug).exists():
            unique_slug = f"{unique_slug}-{number}"
            number += 1

        return unique_slug
