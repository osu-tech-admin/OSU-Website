from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin
from django.db.models import CharField, Q, QuerySet, Value
from django.db.models.functions import Concat
from django.http import HttpRequest

from osu.match.models import Match
from osu.player.models import Player
from osu.team.models import Team
from osu.tournament.models import (
    Bracket,
    CrossPool,
    Pool,
    PositionPool,
    Registration,
    Registration,
    Tournament,
    TournamentField,
)
from osu.user.models import User


@admin.register(Player)
class PlayerAdmin(admin.ModelAdmin[Player]):
    search_fields = ["user__first_name", "user__last_name", "user__username", "user__email"]
    list_display = ["get_name", "get_email", "gender"]
    list_filter = ["gender"]

    @admin.display(description="Name", ordering="user__first_name")
    def get_name(self, obj: Player) -> str:
        return obj.user.get_full_name()

    @admin.display(description="Email", ordering="user__username")
    def get_email(self, obj: Player) -> str:
        return obj.user.username

    def get_search_results(
        self,
        request: HttpRequest,
        queryset: QuerySet[Player],
        search_term: str,
    ) -> tuple[QuerySet[Player], bool]:
        # Add annotation for full name search
        queryset = queryset.annotate(
            full_name=Concat(
                "user__first_name", Value(" "), "user__last_name", output_field=CharField()
            )
        )
        # Add full name to search
        if search_term:
            queryset = queryset.filter(
                Q(full_name__icontains=search_term) | Q(user__email__icontains=search_term)
            )
        return (
            queryset.annotate(
                display_label=Concat(
                    "user__first_name",
                    Value(" "),
                    "user__last_name",
                    Value(" ("),
                    "user__email",
                    Value(")"),
                    output_field=CharField(),
                )
            ),
            False,
        )

    def get_admin_display_value(self, obj: Player) -> str:
        return f"{obj.user.get_full_name()} ({obj.user.email})"


@admin.register(User)
class UserAdmin(DjangoUserAdmin[User]):
    search_fields = ["first_name", "last_name", "username"]
    list_display = [
        "first_name",
        "last_name",
        "username",
        "is_staff",
        "is_superuser",
    ]
    list_filter = ["is_staff", "is_superuser"]
    fieldsets = (
        (None, {"fields": ("username", "password")}),
        (("Personal info"), {"fields": ("first_name", "last_name", "email", "phone")}),
        (
            ("Permissions"),
            {
                "fields": (
                    "is_active",
                    "is_staff",
                    "is_superuser",
                    "groups",
                    "user_permissions",
                ),
            },
        ),
        (("Important dates"), {"fields": ("last_login", "date_joined")}),
    )


@admin.register(Team)
class TeamAdmin(admin.ModelAdmin[Team]):
    search_fields = ["name", "slug"]
    list_display = ["name", "slug"]

    def get_search_results(
        self,
        request: HttpRequest,
        queryset: QuerySet[Team],
        search_term: str,
    ) -> tuple[QuerySet[Team], bool]:
        if search_term:
            queryset = queryset.filter(
                Q(name__icontains=search_term) | Q(slug__icontains=search_term)
            )
        return (
            queryset.annotate(
                display_label=Concat(
                    "name", Value(" ("), "slug", Value(")"), output_field=CharField()
                )
            ),
            False,
        )

    def get_admin_display_value(self, obj: Team) -> str:
        return str(obj)


@admin.register(Tournament)
class TournamentAdmin(admin.ModelAdmin[Tournament]):
    search_fields = ["name"]
    list_display = ["name"]
    filter_horizontal = ("volunteers", "teams")


@admin.register(TournamentField)
class TournamentFieldAdmin(admin.ModelAdmin[TournamentField]):
    search_fields = ["tournament__name"]
    list_display = ["get_name", "name"]

    @admin.display(description="Tournament Name", ordering="tournament__name")
    def get_name(self, obj: TournamentField) -> str:
        return obj.tournament.name


@admin.register(Pool)
class PoolAdmin(admin.ModelAdmin[Pool]):
    search_fields = ["tournament__name"]
    list_display = ["get_name", "name"]

    @admin.display(description="Tournament Name", ordering="tournament__name")
    def get_name(self, obj: Pool) -> str:
        return obj.tournament.name


@admin.register(Bracket)
class BracketAdmin(admin.ModelAdmin[Bracket]):
    search_fields = ["tournament__name"]
    list_display = ["get_name", "name"]

    @admin.display(description="Tournament Name", ordering="tournament__name")
    def get_name(self, obj: Pool) -> str:
        return obj.tournament.name


@admin.register(CrossPool)
class CrossPoolAdmin(admin.ModelAdmin[CrossPool]):
    search_fields = ["tournament__name"]
    list_display = ["get_name"]

    @admin.display(description="Tournament Name", ordering="tournament__name")
    def get_name(self, obj: Pool) -> str:
        return obj.tournament.name


@admin.register(PositionPool)
class PositionPoolAdmin(admin.ModelAdmin[PositionPool]):
    search_fields = ["tournament__name"]
    list_display = ["get_name", "name"]

    @admin.display(description="Tournament Name", ordering="tournament__name")
    def get_name(self, obj: Pool) -> str:
        return obj.tournament.name


@admin.register(Match)
class MatchAdmin(admin.ModelAdmin[Match]):
    search_fields = ["tournament__name"]
    list_display = ["get_name", "name"]

    @admin.display(description="Tournament Name", ordering="tournament__name")
    def get_name(self, obj: Match) -> str:
        return obj.tournament.name


@admin.register(Registration)
class RegistrationAdmin(admin.ModelAdmin[Registration]):
<<<<<<< HEAD
    search_fields = [
        "tournament__name",
        "player__user__first_name",
        "player__user__last_name",
        "player__user__username",
        "team__name",
    ]
=======
    search_fields = ["tournament__name"]
>>>>>>> admin: Add registrations
    list_display = ["get_player_name", "get_team_name", "get_tournament_name"]

    @admin.display(description="Tournament Name", ordering="tournament__name")
    def get_tournament_name(self, obj: Registration) -> str:
        return obj.tournament.name

    @admin.display(description="Player Name", ordering="player__user__first_name")
    def get_player_name(self, obj: Registration) -> str:
        return obj.player.user.get_full_name()

    @admin.display(description="Team Name", ordering="team__name")
    def get_team_name(self, obj: Registration) -> str:
        return obj.team.name

    @admin.display(description="Player Name", ordering="player__name")
    def get_player_name(self, obj: Registration) -> str:
        return obj.player.user.get_full_name()
