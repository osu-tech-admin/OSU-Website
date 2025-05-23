from django.db import models
from django.utils.translation import gettext_lazy as _

from osu.player.models import Player
from osu.team.models import Team
from osu.tournament.models import (
    Bracket,
    CrossPool,
    Pool,
    PositionPool,
    Tournament,
    TournamentField,
)


class MatchScore(models.Model):
    score_team_1 = models.PositiveIntegerField(default=0)
    score_team_2 = models.PositiveIntegerField(default=0)

    entered_by = models.ForeignKey(Player, on_delete=models.CASCADE)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class SpiritScore(models.Model):
    rules = models.PositiveIntegerField()
    fouls = models.PositiveIntegerField()
    fair = models.PositiveIntegerField()
    positive = models.PositiveIntegerField()
    communication = models.PositiveIntegerField()
    total = models.PositiveIntegerField(default=0)

    mvp = models.ForeignKey(
        Player, on_delete=models.CASCADE, related_name="mvp", blank=True, null=True
    )
    msp = models.ForeignKey(
        Player, on_delete=models.CASCADE, related_name="msp", blank=True, null=True
    )

    comments = models.CharField(max_length=500, blank=True, null=True)


class Match(models.Model):
    """
    Represents a match between two teams
    """

    name = models.CharField(max_length=100)
    tournament = models.ForeignKey(Tournament, on_delete=models.CASCADE, related_name="matches")

    pool = models.ForeignKey(Pool, on_delete=models.CASCADE, blank=True, null=True)
    cross_pool = models.ForeignKey(CrossPool, on_delete=models.CASCADE, blank=True, null=True)
    bracket = models.ForeignKey(Bracket, on_delete=models.CASCADE, blank=True, null=True)
    position_pool = models.ForeignKey(PositionPool, on_delete=models.CASCADE, blank=True, null=True)
    sequence_number = (
        models.PositiveIntegerField()
    )  # For Cross Pool and Brackets to have round number

    placeholder_seed_1 = models.PositiveIntegerField()
    placeholder_seed_2 = models.PositiveIntegerField()
    team_1 = models.ForeignKey(
        Team, on_delete=models.CASCADE, related_name="team_1_matches", blank=True, null=True
    )
    team_2 = models.ForeignKey(
        Team, on_delete=models.CASCADE, related_name="team_2_matches", blank=True, null=True
    )
    score_team_1 = models.IntegerField(default=0)
    score_team_2 = models.IntegerField(default=0)
    time = models.DateTimeField(null=True, blank=True)
    duration_mins = models.IntegerField(default=75)
    field = models.ForeignKey(
        TournamentField, on_delete=models.SET_NULL, related_name="matches", null=True, blank=True
    )
    video_url = models.URLField(max_length=255, null=True, blank=True)

    class StatusTypes(models.TextChoices):
        DRAFT = "draft", _("Draft")
        SCHEDULED = "scheduled", _("Scheduled")
        COMPLETED = "completed", _("Completed")

    status = models.CharField(max_length=20, choices=StatusTypes.choices, default=StatusTypes.DRAFT)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    suggested_score_team_1 = models.OneToOneField(
        MatchScore,
        on_delete=models.CASCADE,
        related_name="suggested_score_team_1",
        blank=True,
        null=True,
    )
    suggested_score_team_2 = models.OneToOneField(
        MatchScore,
        on_delete=models.CASCADE,
        related_name="suggested_score_team_2",
        blank=True,
        null=True,
    )

    spirit_score_team_1 = models.OneToOneField(
        SpiritScore,
        on_delete=models.CASCADE,
        related_name="spirit_score_team_1",
        blank=True,
        null=True,
    )
    spirit_score_team_2 = models.OneToOneField(
        SpiritScore,
        on_delete=models.CASCADE,
        related_name="spirit_score_team_2",
        blank=True,
        null=True,
    )

    self_spirit_score_team_1 = models.OneToOneField(
        SpiritScore,
        on_delete=models.CASCADE,
        related_name="self_spirit_score_team_1",
        blank=True,
        null=True,
    )
    self_spirit_score_team_2 = models.OneToOneField(
        SpiritScore,
        on_delete=models.CASCADE,
        related_name="self_spirit_score_team_2",
        blank=True,
        null=True,
    )

    class Meta:
        unique_together = ["tournament", "time", "field"]

    def __str__(self) -> str:
        return self.name


class MatchStats(models.Model):
    class Status(models.TextChoices):
        FIRST_HALF = "FH", _("First Half")
        SECOND_HALF = "SH", _("Second Half")
        COMPLETED = "COM", _("Completed")

    match = models.OneToOneField(Match, on_delete=models.CASCADE, related_name="stats")
    tournament = models.ForeignKey(Tournament, on_delete=models.CASCADE, related_name="match_stats")
    status = models.CharField(max_length=3, choices=Status.choices, default=Status.FIRST_HALF)
    score_team_1 = models.PositiveIntegerField(default=0)
    score_team_2 = models.PositiveIntegerField(default=0)
    initial_possession = models.ForeignKey(
        Team, on_delete=models.CASCADE, related_name="initial_possession"
    )
    current_possession = models.ForeignKey(
        Team, on_delete=models.CASCADE, related_name="current_possession"
    )


class MatchEvent(models.Model):
    class EventType(models.TextChoices):
        SCORE = "SC", _("Score")
        DROP = "DR", _("Drop")
        THROWAWAY = "TA", _("Throwaway")
        BLOCK = "BL", _("Block")

    class Mode(models.TextChoices):
        OFFENSE = "OF", _("Offense")
        DEFENSE = "DE", _("Defense")

    stats = models.ForeignKey(MatchStats, on_delete=models.CASCADE, related_name="events")
    team = models.ForeignKey(Team, on_delete=models.CASCADE, related_name="match_events")
    started_on = models.CharField(max_length=3, choices=Mode.choices)
    time = models.DateTimeField(auto_now_add=True)
    type = models.CharField(max_length=3, choices=EventType.choices)

    scored_by = models.ForeignKey(
        Player, on_delete=models.CASCADE, related_name="match_events_scored", blank=True, null=True
    )
    assisted_by = models.ForeignKey(
        Player,
        on_delete=models.CASCADE,
        related_name="match_events_assisted",
        blank=True,
        null=True,
    )
    drop_by = models.ForeignKey(
        Player, on_delete=models.CASCADE, related_name="match_events_drops", blank=True, null=True
    )
    throwaway_by = models.ForeignKey(
        Player,
        on_delete=models.CASCADE,
        related_name="match_events_throwaways",
        blank=True,
        null=True,
    )
    block_by = models.ForeignKey(
        Player, on_delete=models.CASCADE, related_name="match_events_blocks", blank=True, null=True
    )

    current_score_team_1 = models.PositiveIntegerField()
    current_score_team_2 = models.PositiveIntegerField()
