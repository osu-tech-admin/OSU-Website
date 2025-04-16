from pathlib import Path
from typing import Any

from django.db import models
from django.db.models.signals import m2m_changed
from django.dispatch import receiver
from django.utils.crypto import get_random_string
from django.utils.translation import gettext_lazy as _

from osu.player.models import Player
from osu.team.models import Team
from osu.user.models import User
from osu.utils import slugify_max


def upload_tournament_banners(instance: "Tournament", filename: str) -> str:
    parent = Path("tournament_banners")
    path = Path(filename)
    new_name = f"{path.stem}-{get_random_string(12)}{path.suffix}"
    return str(parent / new_name)


class Tournament(models.Model):
    """
    Represents a tournament
    """

    name = models.CharField(max_length=100)
    slug = models.SlugField(max_length=100, unique=True, null=True, blank=True, db_index=True)
    description = models.TextField(blank=True, null=True)
    location = models.CharField(max_length=100)
    start_date = models.DateField()
    end_date = models.DateField()
    teams = models.ManyToManyField(Team, related_name="tournaments", blank=True)

    banner = models.FileField(upload_to=upload_tournament_banners, blank=True, null=True)

    class StatusTypes(models.TextChoices):
        REGISTRATION_OPEN = "registration_open", _("Registration Open")
        REGISTRATION_CLOSED = "registration_closed", _("Registration Closed")
        LIVE = "live", _("Live")
        COMPLETED = "completed", _("Completed")

    status = models.CharField(
        max_length=20, choices=StatusTypes.choices, default=StatusTypes.REGISTRATION_OPEN
    )

    class Type(models.TextChoices):
        MIXED = "MXD", _("Mixed")
        OPENS = "OPN", _("Opens")
        WOMENS = "WMN", _("Womens")

    type = models.CharField(max_length=3, choices=Type.choices, default=Type.MIXED)

    initial_seeding = models.JSONField(default=dict, blank=True)
    current_seeding = models.JSONField(default=dict, blank=True)
    spirit_ranking = models.JSONField(default=list, blank=True)

    volunteers = models.ManyToManyField(User, related_name="tournament_volunteer", blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self) -> str:
        return self.name

    def save(self, *args: Any, **kwargs: Any) -> None:
        if not self.slug:
            slug = slugify_max(self.name, 95)
            unique_slug = slug

            number = 1
            while Tournament.objects.filter(slug=unique_slug).exists():
                unique_slug = f"{unique_slug}-{number}"
                number += 1

            self.slug = unique_slug

        return super().save(*args, **kwargs)


@receiver(m2m_changed, sender=Tournament.teams.through)
def update_seeding_on_teams_change(
    sender: Any, instance: Tournament, action: str, **kwargs: Any
) -> None:
    if action in ("post_add", "post_remove"):
        seeding = {}

        for i, team in enumerate(instance.teams.all(), start=1):
            seeding[i] = team.id

        instance.initial_seeding = seeding
        instance.current_seeding = seeding
        instance.save()


class TournamentField(models.Model):
    name = models.CharField(max_length=25)
    address = models.CharField(max_length=25, blank=True, null=True)
    is_broadcasted = models.BooleanField(default=False)
    tournament = models.ForeignKey(Tournament, on_delete=models.CASCADE)
    location_url = models.URLField(max_length=255, null=True, blank=True)

    class Meta:
        unique_together = ["tournament", "name"]


class Registration(models.Model):
    class Role(models.TextChoices):
        DEFAULT = "DFLT", _("Default")
        CAPTAIN = "CAP", _("Captain")
        SPIRIT_CAPTAIN = "SCAP", _("Spirit Captain")
        COACH = "COACH", _("Coach")
        OWNER = "OWNER", _("Owner")

    tournament = models.ForeignKey(Tournament, on_delete=models.CASCADE)
    team = models.ForeignKey(Team, on_delete=models.CASCADE)
    player = models.ForeignKey(Player, on_delete=models.CASCADE)
    role = models.CharField(max_length=6, choices=Role.choices, default=Role.DEFAULT)
    base_price = models.PositiveIntegerField(null=True, blank=True)
    sold_price = models.PositiveIntegerField(null=True, blank=True)

    class Meta:
        unique_together = ("tournament", "player")


class Pool(models.Model):
    sequence_number = models.PositiveIntegerField()
    name = models.CharField(max_length=2, default="NA")
    tournament = models.ForeignKey(Tournament, on_delete=models.CASCADE)

    initial_seeding = models.JSONField()
    results = models.JSONField()

    class Meta:
        unique_together = ["name", "tournament"]


class CrossPool(models.Model):
    tournament = models.ForeignKey(Tournament, on_delete=models.CASCADE)

    initial_seeding = models.JSONField(default=dict)
    current_seeding = models.JSONField(default=dict)


class Bracket(models.Model):
    sequence_number = models.PositiveIntegerField()
    name = models.CharField(max_length=5, default="1-8")
    tournament = models.ForeignKey(Tournament, on_delete=models.CASCADE)

    initial_seeding = models.JSONField()
    current_seeding = models.JSONField()

    class Meta:
        unique_together = ["name", "tournament"]


class PositionPool(models.Model):
    sequence_number = models.PositiveIntegerField()
    name = models.CharField(max_length=2, default="NA")
    tournament = models.ForeignKey(Tournament, on_delete=models.CASCADE)

    initial_seeding = models.JSONField()
    results = models.JSONField()

    class Meta:
        unique_together = ["name", "tournament"]
