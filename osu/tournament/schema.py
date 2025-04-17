from datetime import date
from typing import Any

from ninja import ModelSchema, Schema

from osu.player.models import Player
from osu.team.models import Team
from osu.tournament.models import (
    Bracket,
    CrossPool,
    Pool,
    PositionPool,
    Registration,
    Tournament,
    TournamentField,
)
from osu.user.models import User


class PlayerSimpleSchema(ModelSchema):
    class Config:
        model = Player
        model_fields = ["id", "slug", "gender"]

    user_first_name: str
    user_last_name: str

    @staticmethod
    def resolve_user_first_name(obj: Player) -> str:
        return obj.user.first_name

    @staticmethod
    def resolve_user_last_name(obj: Player) -> str:
        return obj.user.last_name


class TeamSimpleSchema(ModelSchema):
    class Config:
        model = Team
        model_fields = ["id", "name", "slug", "logo"]


class UserSimpleSchema(ModelSchema):
    class Config:
        model = User
        model_fields = ["id", "first_name", "last_name", "email"]


class UserAccessSchema(Schema):
    # is_staff: bool
    # is_tournament_admin: bool
    admin_team_ids: list[int]
    # is_tournament_volunteer: bool


class TournamentSimpleSchema(ModelSchema):
    class Config:
        model = Tournament
        model_fields = [
            "id",
            "name",
            "slug",
            "start_date",
            "end_date",
            "location",
            "status",
            "type",
            "banner",
        ]


class TournamentFieldSchema(ModelSchema):
    class Config:
        model = TournamentField
        model_exclude = ["tournament"]


class RegistrationSchema(ModelSchema):
    class Config:
        model = Registration
        model_fields = ["id", "role"]

    tournament: TournamentSimpleSchema
    team: TeamSimpleSchema
    player: PlayerSimpleSchema


class PoolSchema(ModelSchema):
    class Config:
        model = Pool
        model_fields = ["id", "sequence_number", "name", "initial_seeding", "results"]

    tournament: TournamentSimpleSchema


class CrossPoolSchema(ModelSchema):
    class Config:
        model = CrossPool
        model_fields = ["id", "initial_seeding", "current_seeding"]

    tournament: TournamentSimpleSchema


class BracketSchema(ModelSchema):
    class Config:
        model = Bracket
        model_fields = ["id", "sequence_number", "name", "initial_seeding", "current_seeding"]

    tournament: TournamentSimpleSchema


class PositionPoolSchema(ModelSchema):
    class Config:
        model = PositionPool
        model_fields = ["id", "sequence_number", "name", "initial_seeding", "results"]

    tournament: TournamentSimpleSchema


class TournamentCreateSchema(Schema):
    name: str
    description: str = ""
    location: str
    start_date: date
    end_date: date
    type: str = "MXD"
    status: str = "registration_open"


class TournamentUpdateSchema(Schema):
    name: str | None = None
    description: str | None = None
    location: str | None = None
    start_date: date | None = None
    end_date: date | None = None
    status: str | None = None
    type: str | None = None


class RegistrationCreateSchema(Schema):
    tournament_id: int
    team_id: int
    player_id: int
    role: str = "DFLT"


class RegistrationUpdateSchema(Schema):
    role: str | None = None


class PoolCreateSchema(Schema):
    tournament_id: int
    sequence_number: int
    name: str
    seeding: list[int]


class PoolUpdateSchema(Schema):
    sequence_number: int | None = None
    name: str | None = None
    results: dict[str, Any] | None = None


class CrossPoolCreateSchema(Schema):
    tournament_id: int
    initial_seeding: dict[str, Any]
    current_seeding: dict[str, Any] | None = None


class CrossPoolUpdateSchema(Schema):
    initial_seeding: dict[str, Any] | None = None
    current_seeding: dict[str, Any] | None = None


class BracketCreateSchema(Schema):
    tournament_id: int
    sequence_number: int
    name: str


class BracketUpdateSchema(Schema):
    sequence_number: int | None = None
    name: str | None = None
    current_seeding: dict[str, Any] | None = None


class PositionPoolCreateSchema(Schema):
    tournament_id: int
    sequence_number: int
    name: str
    seeding: list[int]


class PositionPoolUpdateSchema(Schema):
    sequence_number: int | None = None
    name: str | None = None
    results: dict[str, Any] | None = None


class TournamentDetailSchema(TournamentSimpleSchema):
    teams: list[TeamSimpleSchema] = []
    volunteers: list[UserSimpleSchema] = []
    initial_seeding: dict[str, Any] = {}
    current_seeding: dict[str, Any] = {}
    spirit_ranking: list[Any] = []


class SuccessSchema(Schema):
    success: bool = True
    message: str = "Operation successful"


class ErrorSchema(Schema):
    success: bool = False
    message: str
    details: dict[str, Any] | None = None
