from datetime import date

from ninja import Schema

from osu.player.models import Player
from osu.user.schema import UserSchema


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

    @staticmethod
    def resolve_profile_picture(player: Player) -> str | None:
        """Resolve profile picture URL."""
        if player.profile_picture:
            return player.profile_picture.url
        return None


class PlayerListSchema(Schema):
    """Schema for a list of players."""

    id: int
    user_id: int
    name: str
    slug: str | None = None
    profile_picture: str | None = None
    gender: str
    city: str

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


class PlayersResponse(Schema):
    """Response schema for a list of players."""

    players: list[PlayerListSchema]
    total: int
