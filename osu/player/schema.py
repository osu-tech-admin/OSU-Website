from datetime import date
from typing import Any

from ninja import Schema

from osu.player.models import Player
from osu.user.schema import UserSchema


class TeamSimpleSchema(Schema):
    """Simple schema for team data in registration."""

    id: int
    name: str
    slug: str
    logo: str | None = None


class TournamentSimpleSchema(Schema):
    """Simple schema for tournament data in registration."""

    id: int
    name: str
    slug: str
    banner: str | None = None


class PlayerRegistrationSchema(Schema):
    """Schema for player registration data."""

    id: int
    tournament: TournamentSimpleSchema
    team: TeamSimpleSchema
    role: str
    base_price: int | None = None
    sold_price: int | None = None


class PlayerSchema(Schema):
    """Schema for Player model."""

    id: int
    user: UserSchema
    date_of_birth: date | None = None
    slug: str | None = None
    profile_picture: str | None = None
    gender: str
    other_gender: str | None = None
    match_up: str
    city: str
    throwing_hand: str | None = None
    preffered_role: str | None = None
    registrations: list[PlayerRegistrationSchema] = []

    @staticmethod
    def resolve_profile_picture(player: Player) -> str | None:
        """Resolve profile picture URL."""
        if player.profile_picture:
            return player.profile_picture.url
        return None

    @staticmethod
    def resolve_registrations(player: Player) -> list[dict[str, Any]]:
        """Resolve player registrations with tournament and team data."""
        from osu.tournament.models import Registration

        registrations = Registration.objects.filter(player=player).select_related(
            "tournament", "team"
        )

        result = []
        for reg in registrations:
            tournament_data = {
                "id": reg.tournament.id,
                "name": reg.tournament.name,
                "slug": reg.tournament.slug,
                "banner": reg.tournament.banner.url if reg.tournament.banner else None,
            }

            team_data = {
                "id": reg.team.id,
                "name": reg.team.name,
                "slug": reg.team.slug,
                "logo": reg.team.logo.url if reg.team.logo else None,
            }

            result.append(
                {
                    "id": reg.id,
                    "tournament": tournament_data,
                    "team": team_data,
                    "role": reg.role,
                    "base_price": reg.base_price,
                    "sold_price": reg.sold_price,
                }
            )

        return result


class PlayerListSchema(Schema):
    """Schema for a list of players."""

    id: int
    user_id: int
    name: str
    slug: str | None = None
    profile_picture: str | None = None
    gender: str
    preffered_role: str
    registrations: list[PlayerRegistrationSchema] = []

    @staticmethod
    def resolve_name(player: Player) -> str:
        """Resolve player name."""
        return player.user.get_full_name()

    @staticmethod
    def resolve_profile_picture(player: Player) -> str | None:
        """Resolve profile picture URL."""
        if player.profile_picture:
            return player.profile_picture.url
        return None

    @staticmethod
    def resolve_registrations(player: Player) -> list[dict[str, Any]]:
        """Resolve player registrations with tournament and team data."""
        from osu.tournament.models import Registration

        registrations = Registration.objects.filter(player=player).select_related(
            "tournament", "team"
        )

        result = []
        for reg in registrations:
            tournament_data = {
                "id": reg.tournament.id,
                "name": reg.tournament.name,
                "slug": reg.tournament.slug,
                "banner": reg.tournament.banner.url if reg.tournament.banner else None,
            }

            team_data = {
                "id": reg.team.id,
                "name": reg.team.name,
                "slug": reg.team.slug,
                "logo": reg.team.logo.url if reg.team.logo else None,
            }

            result.append(
                {
                    "id": reg.id,
                    "tournament": tournament_data,
                    "team": team_data,
                    "role": reg.role,
                    "base_price": reg.base_price,
                    "sold_price": reg.sold_price,
                }
            )

        return result


class PlayersResponse(Schema):
    """Response schema for a list of players."""

    players: list[PlayerListSchema]
    total: int
