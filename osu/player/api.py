from collections.abc import Sequence
from typing import Any, TypedDict

from django.db.models import CharField, Q, Value
from django.db.models.functions import Concat
from django.http import HttpRequest
from ninja import Router

from osu.commons import Response
from osu.player.models import Player
from osu.player.schema import PlayerSchema, PlayersResponse


class PlayerResponse(TypedDict):
    players: Sequence[Any]  # Using Any to handle annotated Player objects
    total: int


router = Router()


@router.get("", auth=None, response=PlayersResponse)
def list_players(
    request: HttpRequest,
    search: str | None = None,
    gender: str | None = None,
    role: str | None = None,
    team_id: int | None = None,
    sort: str = "name",
    order: str = "asc",
    limit: int = 50,
    offset: int = 0,
) -> PlayerResponse:
    """
    List all players with optional filtering and sorting.

    Arguments:
        search: Search term to filter by name
        gender: Filter by gender (M, F, O)
        role: Filter by preferred role (C, H)
        team_id: Filter by team ID
        sort: Field to sort by (name, gender, city, role)
        order: Sort order (asc, desc)
        limit: Number of results to return (default: 50)
        offset: Offset for pagination (default: 0)
    """
    # Start query with user data for sorting
    queryset = Player.objects.select_related("user").annotate(
        full_name=Concat(
            "user__first_name", Value(" "), "user__last_name", output_field=CharField()
        )
    )

    # Apply filters
    if search:
        # Search in first name, last name, and full name
        queryset = queryset.filter(
            Q(user__first_name__icontains=search)
            | Q(user__last_name__icontains=search)
            | Q(full_name__icontains=search)
        )

    if gender:
        queryset = queryset.filter(gender=gender)

    if role:
        queryset = queryset.filter(preffered_role=role)

    if team_id:
        queryset = queryset.filter(teams__id=team_id)

    # Determine sort field
    sort_field_map = {
        "name": "full_name",
        "gender": "gender",
        "city": "city",
        "role": "preffered_role",
    }

    sort_field = sort_field_map.get(sort.lower(), "full_name")

    # Apply sort order
    if order.lower() == "desc":
        sort_field = f"-{sort_field}"

    # Sort queryset
    queryset = queryset.order_by(sort_field)

    # Get total count before slicing
    total = queryset.count()

    # Apply pagination
    players = list(queryset[offset : offset + limit])

    return {"players": players, "total": total}


@router.get("/{slug}", auth=None, response={200: PlayerSchema, 404: Response})
def get_player_by_slug(request: HttpRequest, slug: str) -> tuple[int, Player | dict[str, str]]:
    """
    Get a player by slug.

    Arguments:
        slug: The slug of the player to retrieve
    """
    try:
        player = Player.objects.select_related("user").get(slug=slug)
        return 200, player
    except Player.DoesNotExist:
        return 404, {"message": f"Player with slug '{slug}' not found"}
