from pathlib import Path
from typing import Any

from django.db import models
from django.utils.crypto import get_random_string

from osu.user.models import User
from osu.utils import slugify_max


def upload_team_logos(instance: "Team", filename: str) -> str:
    parent = Path("team_logos")
    path = Path(filename)
    new_name = f"{path.stem}-{get_random_string(12)}{path.suffix}"
    return str(parent / new_name)


class Team(models.Model):
    instagram_url = models.URLField(null=True, blank=True)
    name = models.CharField(max_length=100)
    logo = models.FileField(upload_to=upload_team_logos, blank=True, max_length=256)
    slug = models.SlugField(null=True, blank=True, db_index=True, unique=True)
    owners = models.ManyToManyField(User, related_name="owned_teams", blank=True)

    def __str__(self) -> str:
        return self.name

    def save(self, *args: Any, **kwargs: Any) -> None:
        if not self.slug:
            slug = self.get_slug()
            self.slug = slug
        return super().save(*args, **kwargs)

    def get_slug(self) -> str:
        slug = slugify_max(self.name, 45)
        unique_slug = slug

        number = 1
        while Team.objects.filter(slug=unique_slug).exists():
            unique_slug = f"{unique_slug}-{number}"
            number += 1

        return unique_slug
