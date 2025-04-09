from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin
from django.db.models import CharField, Q, QuerySet, Value
from django.db.models.functions import Concat
from django.http import HttpRequest

from osu.player.models import Player
from osu.team.models import Team
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
