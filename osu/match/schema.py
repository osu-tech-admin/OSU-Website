from datetime import datetime

from ninja import ModelSchema, Schema

from osu.match.models import Match, MatchScore, SpiritScore
from osu.player.models import Player
from osu.team.models import Team
from osu.tournament.models import Tournament, TournamentField


class PlayerBasicSchema(ModelSchema):
    class Config:
        model = Player
        model_fields = ["id", "slug"]

    user_first_name: str
    user_last_name: str

    @staticmethod
    def resolve_user_first_name(obj: Player) -> str:
        return obj.user.first_name

    @staticmethod
    def resolve_user_last_name(obj: Player) -> str:
        return obj.user.last_name


class TeamBasicSchema(ModelSchema):
    class Config:
        model = Team
        model_fields = ["id", "name", "slug", "logo"]


class TournamentBasicSchema(ModelSchema):
    class Config:
        model = Tournament
        model_fields = ["id", "name", "slug"]


class TournamentFieldSchema(ModelSchema):
    class Config:
        model = TournamentField
        model_fields = ["id", "name", "address", "is_broadcasted", "location_url"]


class SpiritScoreSchema(ModelSchema):
    class Config:
        model = SpiritScore
        model_fields = [
            "id",
            "rules",
            "fouls",
            "fair",
            "positive",
            "communication",
            "total",
            "comments",
        ]

    mvp: PlayerBasicSchema | None = None
    msp: PlayerBasicSchema | None = None


class MatchScoreSchema(ModelSchema):
    class Config:
        model = MatchScore
        model_fields = ["id", "score_team_1", "score_team_2", "created_at", "updated_at"]

    entered_by: PlayerBasicSchema


class MatchBasicSchema(ModelSchema):
    class Config:
        model = Match
        model_fields = [
            "id",
            "name",
            "time",
            "duration_mins",
            "score_team_1",
            "score_team_2",
            "status",
            "video_url",
            "sequence_number",
        ]

    team_1: TeamBasicSchema
    team_2: TeamBasicSchema
    tournament: TournamentBasicSchema
    field: TournamentFieldSchema | None = None


class MatchDetailSchema(MatchBasicSchema):
    placeholder_seed_1: int
    placeholder_seed_2: int
    created_at: datetime
    updated_at: datetime
    suggested_score_team_1: MatchScoreSchema | None = None
    suggested_score_team_2: MatchScoreSchema | None = None
    spirit_score_team_1: SpiritScoreSchema | None = None
    spirit_score_team_2: SpiritScoreSchema | None = None
    self_spirit_score_team_1: SpiritScoreSchema | None = None
    self_spirit_score_team_2: SpiritScoreSchema | None = None


# Input schemas
class MatchCreateSchema(Schema):
    name: str
    tournament_id: int
    team_1_id: int
    team_2_id: int
    time: datetime | None = None
    duration_mins: int = 75
    field_id: int | None = None
    status: str = "draft"
    sequence_number: int = 1
    placeholder_seed_1: int = 1
    placeholder_seed_2: int = 2
    pool_id: int | None = None
    cross_pool_id: int | None = None
    bracket_id: int | None = None
    position_pool_id: int | None = None
    video_url: str | None = None


class MatchUpdateSchema(Schema):
    name: str | None = None
    team_1_id: int | None = None
    team_2_id: int | None = None
    time: datetime | None = None
    duration_mins: int | None = None
    field_id: int | None = None
    score_team_1: int | None = None
    score_team_2: int | None = None
    status: str | None = None
    video_url: str | None = None
    pool_id: int | None = None
    cross_pool_id: int | None = None
    bracket_id: int | None = None
    position_pool_id: int | None = None
    sequence_number: int | None = None
    placeholder_seed_1: int | None = None
    placeholder_seed_2: int | None = None


class SpiritScoreCreateSchema(Schema):
    rules: int
    fouls: int
    fair: int
    positive: int
    communication: int
    total: int = 0
    mvp_id: int | None = None
    msp_id: int | None = None
    comments: str | None = None


class SpiritScoreUpdateSchema(Schema):
    rules: int
    fouls: int
    fair: int
    positive: int
    communication: int
    mvp_id: int | None = None
    msp_id: int | None = None
    comments: str | None = None


class SpiritScoreSubmitSchema(Schema):
    opponent: SpiritScoreUpdateSchema
    self: SpiritScoreUpdateSchema


class MatchScoreSubmitSchema(Schema):
    score_team_1: int
    score_team_2: int


class SuccessResponseSchema(Schema):
    success: bool = True
    message: str


class ErrorResponseSchema(Schema):
    success: bool = False
    message: str
    details: str | None = None


class StaffMatchScoreSubmitSchema(Schema):
    """Schema for staff submitting final match scores"""

    score_team_1: int
    score_team_2: int
