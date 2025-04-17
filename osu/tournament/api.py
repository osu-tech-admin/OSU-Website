from typing import Any

from django.db import transaction
from django.http import HttpRequest
from django.shortcuts import get_object_or_404
from ninja import Router
from ninja.pagination import PageNumberPagination, paginate

from osu.match.models import Match
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
from osu.tournament.schema import (
    BracketCreateSchema,
    BracketSchema,
    BracketUpdateSchema,
    CrossPoolCreateSchema,
    CrossPoolSchema,
    CrossPoolUpdateSchema,
    ErrorSchema,
    PoolCreateSchema,
    PoolSchema,
    PoolUpdateSchema,
    PositionPoolCreateSchema,
    PositionPoolSchema,
    PositionPoolUpdateSchema,
    RegistrationCreateSchema,
    RegistrationSchema,
    RegistrationUpdateSchema,
    SuccessSchema,
    TournamentCreateSchema,
    TournamentDetailSchema,
    TournamentFieldSchema,
    TournamentSimpleSchema,
    TournamentUpdateSchema,
    UserAccessSchema,
)
from osu.tournament.utils import (
    create_bracket_matches,
    create_pool_matches,
    create_position_pool_matches,
    populate_fixtures,
    validate_new_pool,
)
from osu.user.models import User


# Define a type for authenticated requests
class AuthenticatedHttpRequest(HttpRequest):
    user: User


# Type alias for message responses
message_response = dict[str, Any]

router = Router()


# Tournament endpoints
@router.get("", response=list[TournamentSimpleSchema], tags=["tournaments"], auth=None)
@paginate(PageNumberPagination)
def list_tournaments(
    request: HttpRequest,
    status: str | None = None,
    type: str | None = None,
    search: str | None = None,
) -> list[Tournament]:
    """
    List all tournaments with optional filtering
    """
    qs = Tournament.objects.all().order_by("-start_date")

    if status:
        qs = qs.filter(status=status)

    if type:
        qs = qs.filter(type=type)

    if search:
        qs = qs.filter(name__icontains=search)

    return list(qs)


@router.get(
    "/{slug}",
    response={200: TournamentDetailSchema, 404: ErrorSchema},
    tags=["tournaments"],
    auth=None,
)
def get_tournament(
    request: HttpRequest, slug: str
) -> tuple[int, Tournament] | tuple[int, dict[str, Any]]:
    """
    Get a specific tournament by slug
    """
    try:
        tournament = Tournament.objects.get(slug=slug)
        return 200, tournament
    except Tournament.DoesNotExist:
        try:
            tournament = Tournament.objects.get(id=slug)
            return 200, tournament
        except Tournament.DoesNotExist:
            return 404, {"success": False, "message": f"Tournament with id/slug {slug} not found"}


@router.get(
    "/{slug}/me/access", response={200: UserAccessSchema, 404: ErrorSchema}, tags=["tournaments"]
)
def get_user_access_for_tournament(
    request: AuthenticatedHttpRequest, slug: str
) -> tuple[int, dict[str, Any]]:
    try:
        tournament = Tournament.objects.get(slug=slug)
    except Tournament.DoesNotExist:
        try:
            Tournament.objects.get(id=slug)
        except Tournament.DoesNotExist:
            return 404, {"success": False, "message": f"Tournament with id/slug {slug} not found"}

    admin_team_ids: set[int] = set()

    try:
        player = request.user.player_profile
    except Player.DoesNotExist:
        return 200, {"admin_team_ids": admin_team_ids}

    registrations = Registration.objects.filter(tournament=tournament, player=player)

    for reg in registrations:
        authorized_roles = [
            Registration.Role.CAPTAIN,
            Registration.Role.SPIRIT_CAPTAIN,
            Registration.Role.COACH,
            Registration.Role.OWNER,
        ]
        if reg.role in authorized_roles:
            admin_team_ids.add(reg.team.id)

    return 200, {"admin_team_ids": admin_team_ids}


@router.post(
    "",
    response={201: TournamentDetailSchema, 400: ErrorSchema, 401: ErrorSchema},
    tags=["tournaments"],
)
@transaction.atomic
def create_tournament(
    request: AuthenticatedHttpRequest, payload: TournamentCreateSchema
) -> tuple[int, Tournament] | tuple[int, dict[str, Any]]:
    """
    Create a new tournament
    """
    if not request.user.is_staff:
        return 401, {"success": False, "message": "Only staff members can create tournaments"}

    try:
        tournament = Tournament.objects.create(
            name=payload.name,
            description=payload.description,
            location=payload.location,
            start_date=payload.start_date,
            end_date=payload.end_date,
            status=payload.status,
            type=payload.type,
        )
        return 201, tournament
    except Exception as e:
        return 400, {"success": False, "message": "Failed to create tournament", "details": str(e)}


@router.put(
    "/{tournament_id}",
    response={200: TournamentDetailSchema, 404: ErrorSchema, 400: ErrorSchema, 401: ErrorSchema},
    tags=["tournaments"],
)
@transaction.atomic
def update_tournament(
    request: AuthenticatedHttpRequest, tournament_id: int, payload: TournamentUpdateSchema
) -> tuple[int, Tournament] | tuple[int, dict[str, Any]]:
    """
    Update an existing tournament
    """
    if not request.user.is_staff:
        return 401, {"success": False, "message": "Only staff members can update tournaments"}

    try:
        tournament = get_object_or_404(Tournament, id=tournament_id)

        # Update fields if provided
        for attr, value in payload.dict(exclude_unset=True).items():
            if value is not None:  # Skip None values
                setattr(tournament, attr, value)

        tournament.save()
        return 200, tournament
    except Tournament.DoesNotExist:
        return 404, {"success": False, "message": f"Tournament with id {tournament_id} not found"}
    except Exception as e:
        return 400, {"success": False, "message": "Failed to update tournament", "details": str(e)}


@router.delete(
    "/{tournament_id}",
    response={200: SuccessSchema, 404: ErrorSchema, 401: ErrorSchema},
    tags=["tournaments"],
)
@transaction.atomic
def delete_tournament(
    request: AuthenticatedHttpRequest, tournament_id: int
) -> tuple[int, dict[str, Any]]:
    """
    Delete a tournament
    """
    if not request.user.is_staff:
        return 401, {"success": False, "message": "Only staff members can delete tournaments"}

    try:
        tournament = get_object_or_404(Tournament, id=tournament_id)
        tournament.delete()
        return 200, {
            "success": True,
            "message": f"Tournament {tournament.name} deleted successfully",
        }
    except Tournament.DoesNotExist:
        return 404, {"success": False, "message": f"Tournament with id {tournament_id} not found"}


# Tournament Fields


@router.get(
    "/{tournament_id}/fields",
    auth=None,
    response={200: list[TournamentFieldSchema], 400: ErrorSchema},
    tags=["fields"],
)
def get_fields_by_tournament_id(
    request: AuthenticatedHttpRequest, tournament_id: int
) -> tuple[int, list[TournamentField] | message_response]:
    try:
        tournament = Tournament.objects.get(id=tournament_id)
    except Tournament.DoesNotExist:
        return 400, {"message": "Tournament does not exist"}

    return 200, list(TournamentField.objects.filter(tournament=tournament).order_by("name"))


# Tournament Team Management
@router.post(
    "/{tournament_id}/teams/{team_id}",
    response={200: SuccessSchema, 404: ErrorSchema, 401: ErrorSchema},
    tags=["tournaments"],
)
def add_team_to_tournament(
    request: AuthenticatedHttpRequest, tournament_id: int, team_id: int
) -> tuple[int, dict[str, Any]]:
    """
    Add a team to a tournament
    """
    if not request.user.is_staff:
        return 401, {"success": False, "message": "Only staff members can add teams to tournaments"}

    try:
        tournament = get_object_or_404(Tournament, id=tournament_id)
        team = get_object_or_404(Team, id=team_id)

        tournament.teams.add(team)
        return 200, {
            "success": True,
            "message": f"Team {team.name} added to tournament {tournament.name}",
        }
    except Tournament.DoesNotExist:
        return 404, {"success": False, "message": f"Tournament with id {tournament_id} not found"}
    except Team.DoesNotExist:
        return 404, {"success": False, "message": f"Team with id {team_id} not found"}


@router.delete(
    "/{tournament_id}/teams/{team_id}",
    response={200: SuccessSchema, 404: ErrorSchema, 401: ErrorSchema},
    tags=["tournaments"],
)
def remove_team_from_tournament(
    request: AuthenticatedHttpRequest, tournament_id: int, team_id: int
) -> tuple[int, dict[str, Any]]:
    """
    Remove a team from a tournament
    """
    if not request.user.is_staff:
        return 401, {
            "success": False,
            "message": "Only staff members can remove teams from tournaments",
        }

    try:
        tournament = get_object_or_404(Tournament, id=tournament_id)
        team = get_object_or_404(Team, id=team_id)

        tournament.teams.remove(team)
        return 200, {
            "success": True,
            "message": f"Team {team.name} removed from tournament {tournament.name}",
        }
    except Tournament.DoesNotExist:
        return 404, {"success": False, "message": f"Tournament with id {tournament_id} not found"}
    except Team.DoesNotExist:
        return 404, {"success": False, "message": f"Team with id {team_id} not found"}


# Tournament Volunteer Management
@router.post(
    "/{tournament_id}/volunteers/{user_id}",
    response={200: SuccessSchema, 404: ErrorSchema, 401: ErrorSchema},
    tags=["tournaments"],
)
def add_volunteer_to_tournament(
    request: AuthenticatedHttpRequest, tournament_id: int, user_id: int
) -> tuple[int, dict[str, Any]]:
    """
    Add a volunteer to a tournament
    """
    if not request.user.is_staff:
        return 401, {
            "success": False,
            "message": "Only staff members can add volunteers to tournaments",
        }

    try:
        tournament = get_object_or_404(Tournament, id=tournament_id)
        user = get_object_or_404(User, id=user_id)

        tournament.volunteers.add(user)
        return 200, {
            "success": True,
            "message": f"Volunteer {user.get_full_name()} added to tournament {tournament.name}",
        }
    except Tournament.DoesNotExist:
        return 404, {"success": False, "message": f"Tournament with id {tournament_id} not found"}
    except User.DoesNotExist:
        return 404, {"success": False, "message": f"User with id {user_id} not found"}


@router.delete(
    "/{tournament_id}/volunteers/{user_id}",
    response={200: SuccessSchema, 404: ErrorSchema, 401: ErrorSchema},
    tags=["tournaments"],
)
def remove_volunteer_from_tournament(
    request: AuthenticatedHttpRequest, tournament_id: int, user_id: int
) -> tuple[int, dict[str, Any]]:
    """
    Remove a volunteer from a tournament
    """
    if not request.user.is_staff:
        return 401, {
            "success": False,
            "message": "Only staff members can remove volunteers from tournaments",
        }

    try:
        tournament = get_object_or_404(Tournament, id=tournament_id)
        user = get_object_or_404(User, id=user_id)

        tournament.volunteers.remove(user)
        return 200, {
            "success": True,
            "message": f"Volunteer {user.get_full_name()} removed from tournament {tournament.name}",
        }
    except Tournament.DoesNotExist:
        return 404, {"success": False, "message": f"Tournament with id {tournament_id} not found"}
    except User.DoesNotExist:
        return 404, {"success": False, "message": f"User with id {user_id} not found"}


# Registration endpoints
@router.get("/registrations", response=list[RegistrationSchema], tags=["registrations"], auth=None)
@paginate(PageNumberPagination)
def list_registrations(
    request: HttpRequest,
    tournament_id: int | None = None,
    team_id: int | None = None,
    player_id: int | None = None,
    role: str | None = None,
) -> list[Registration]:
    """
    List all registrations with optional filtering
    """
    qs = Registration.objects.all().select_related("tournament", "team", "player")

    if tournament_id:
        qs = qs.filter(tournament_id=tournament_id)

    if team_id:
        qs = qs.filter(team_id=team_id)

    if player_id:
        qs = qs.filter(player_id=player_id)

    if role:
        qs = qs.filter(role=role)

    return list(qs)


@router.get(
    "/{tournament_slug}/team/{team_slug}/roster",
    response=list[RegistrationSchema],
    tags=["registrations"],
    auth=None,
)
def get_tournament_team_roster(
    request: HttpRequest, tournament_slug: str, team_slug: str
) -> list[Registration]:
    print(tournament_slug, team_slug)
    qs = Registration.objects.all().select_related("tournament", "team", "player")
    qs = qs.filter(tournament__slug=tournament_slug, team__slug=team_slug)
    print(list(qs))
    return list(qs)


@router.post(
    "/registrations",
    response={201: RegistrationSchema, 400: ErrorSchema, 401: ErrorSchema},
    tags=["registrations"],
)
@transaction.atomic
def create_registration(
    request: AuthenticatedHttpRequest, payload: RegistrationCreateSchema
) -> tuple[int, Registration] | tuple[int, dict[str, Any]]:
    """
    Create a new registration
    """
    if not request.user.is_staff:
        return 401, {"success": False, "message": "Only staff members can create registrations"}

    try:
        tournament = get_object_or_404(Tournament, id=payload.tournament_id)
        team = get_object_or_404(Team, id=payload.team_id)
        player = get_object_or_404(Player, id=payload.player_id)

        registration = Registration.objects.create(
            tournament=tournament, team=team, player=player, role=payload.role
        )

        return 201, registration
    except Tournament.DoesNotExist:
        return 400, {
            "success": False,
            "message": f"Tournament with id {payload.tournament_id} not found",
        }
    except Team.DoesNotExist:
        return 400, {"success": False, "message": f"Team with id {payload.team_id} not found"}
    except Player.DoesNotExist:
        return 400, {"success": False, "message": f"Player with id {payload.player_id} not found"}
    except Exception as e:
        return 400, {
            "success": False,
            "message": "Failed to create registration",
            "details": str(e),
        }


@router.put(
    "/registrations/{registration_id}",
    response={200: RegistrationSchema, 404: ErrorSchema, 400: ErrorSchema, 401: ErrorSchema},
    tags=["registrations"],
)
@transaction.atomic
def update_registration(
    request: AuthenticatedHttpRequest, registration_id: int, payload: RegistrationUpdateSchema
) -> tuple[int, Registration] | tuple[int, dict[str, Any]]:
    """
    Update an existing registration
    """
    if not request.user.is_staff:
        return 401, {"success": False, "message": "Only staff members can update registrations"}

    try:
        registration = get_object_or_404(Registration, id=registration_id)

        # Update fields if provided
        for attr, value in payload.dict(exclude_unset=True).items():
            if value is not None:  # Skip None values
                setattr(registration, attr, value)

        registration.save()
        return 200, registration
    except Registration.DoesNotExist:
        return 404, {
            "success": False,
            "message": f"Registration with id {registration_id} not found",
        }
    except Exception as e:
        return 400, {
            "success": False,
            "message": "Failed to update registration",
            "details": str(e),
        }


@router.delete(
    "/registrations/{registration_id}",
    response={200: SuccessSchema, 404: ErrorSchema, 401: ErrorSchema},
    tags=["registrations"],
)
@transaction.atomic
def delete_registration(
    request: AuthenticatedHttpRequest, registration_id: int
) -> tuple[int, dict[str, Any]]:
    """
    Delete a registration
    """
    if not request.user.is_staff:
        return 401, {"success": False, "message": "Only staff members can delete registrations"}

    try:
        registration = get_object_or_404(Registration, id=registration_id)
        registration.delete()
        return 200, {"success": True, "message": "Registration deleted successfully"}
    except Registration.DoesNotExist:
        return 404, {
            "success": False,
            "message": f"Registration with id {registration_id} not found",
        }


# Pool endpoints
@router.get("/pools", response=list[PoolSchema], tags=["pools"], auth=None)
@paginate(PageNumberPagination)
def list_pools(
    request: HttpRequest,
    tournament_id: int | None = None,
    name: str | None = None,
) -> list[Pool]:
    """
    List all pools with optional filtering
    """
    qs = Pool.objects.all().select_related("tournament")

    if tournament_id:
        qs = qs.filter(tournament_id=tournament_id)

    if name:
        qs = qs.filter(name=name)

    return list(qs)


@router.post(
    "/pools", response={201: PoolSchema, 400: ErrorSchema, 401: ErrorSchema}, tags=["pools"]
)
@transaction.atomic
def create_pool(
    request: AuthenticatedHttpRequest, payload: PoolCreateSchema
) -> tuple[int, Pool] | tuple[int, dict[str, Any]]:
    """
    Create a new pool
    """
    if not request.user.is_staff:
        return 401, {"success": False, "message": "Only staff members can create pools"}

    try:
        tournament = get_object_or_404(Tournament, id=payload.tournament_id)

        valid_pool, errors = validate_new_pool(tournament=tournament, new_pool=set(payload.seeding))
        if not valid_pool:
            message = "Cannot create pools, due to following errors: \n"
            message += "\n".join(f"{key}: {value}" for key, value in errors.items())
            return 400, {"message": message}

        # seed -> team_id. If the same seed present twice, we'll only get one object since its a map with seed as the key
        pool_seeding: dict[int, str] = {}
        pool_results: dict[str, Any] = {}
        for i, seed in enumerate(payload.seeding):
            team_id = tournament.initial_seeding[str(seed)]

            pool_seeding[seed] = team_id
            pool_results[team_id] = {
                "rank": i + 1,
                "wins": 0,
                "losses": 0,
                "draws": 0,
                "GF": 0,  # Goals For
                "GA": 0,  # Goals Against
            }

        pool = Pool.objects.create(
            tournament=tournament,
            sequence_number=payload.sequence_number,
            name=payload.name,
            initial_seeding=pool_seeding,
            results=pool_results,
        )

        create_pool_matches(tournament, pool)

        return 201, pool
    except Tournament.DoesNotExist:
        return 400, {
            "success": False,
            "message": f"Tournament with id {payload.tournament_id} not found",
        }
    except Exception as e:
        return 400, {"success": False, "message": "Failed to create pool", "details": str(e)}


@router.put(
    "/pools/{pool_id}",
    response={200: PoolSchema, 404: ErrorSchema, 400: ErrorSchema, 401: ErrorSchema},
    tags=["pools"],
)
@transaction.atomic
def update_pool(
    request: AuthenticatedHttpRequest, pool_id: int, payload: PoolUpdateSchema
) -> tuple[int, Pool] | tuple[int, dict[str, Any]]:
    """
    Update an existing pool
    """
    if not request.user.is_staff:
        return 401, {"success": False, "message": "Only staff members can update pools"}

    try:
        pool = get_object_or_404(Pool, id=pool_id)

        # Update fields if provided
        for attr, value in payload.dict(exclude_unset=True).items():
            if value is not None:  # Skip None values
                setattr(pool, attr, value)

        pool.save()
        return 200, pool
    except Pool.DoesNotExist:
        return 404, {"success": False, "message": f"Pool with id {pool_id} not found"}
    except Exception as e:
        return 400, {"success": False, "message": "Failed to update pool", "details": str(e)}


@router.delete(
    "/pools/{pool_id}",
    response={200: SuccessSchema, 404: ErrorSchema, 401: ErrorSchema},
    tags=["pools"],
)
@transaction.atomic
def delete_pool(request: AuthenticatedHttpRequest, pool_id: int) -> tuple[int, dict[str, Any]]:
    """
    Delete a pool
    """
    if not request.user.is_staff:
        return 401, {"success": False, "message": "Only staff members can delete pools"}

    try:
        pool = get_object_or_404(Pool, id=pool_id)
        pool.delete()
        return 200, {"success": True, "message": "Pool deleted successfully"}
    except Pool.DoesNotExist:
        return 404, {"success": False, "message": f"Pool with id {pool_id} not found"}


# CrossPool endpoints
@router.get("/cross-pools", response=list[CrossPoolSchema], tags=["cross-pools"], auth=None)
@paginate(PageNumberPagination)
def list_cross_pools(
    request: HttpRequest,
    tournament_id: int | None = None,
) -> list[CrossPool]:
    """
    List all cross pools with optional filtering
    """
    qs = CrossPool.objects.all().select_related("tournament")

    if tournament_id:
        qs = qs.filter(tournament_id=tournament_id)

    return list(qs)


@router.post(
    "/cross-pools",
    response={201: CrossPoolSchema, 400: ErrorSchema, 401: ErrorSchema},
    tags=["cross-pools"],
)
@transaction.atomic
def create_cross_pool(
    request: AuthenticatedHttpRequest, payload: CrossPoolCreateSchema
) -> tuple[int, CrossPool] | tuple[int, dict[str, Any]]:
    """
    Create a new cross pool
    """
    if not request.user.is_staff:
        return 401, {"success": False, "message": "Only staff members can create cross pools"}

    try:
        tournament = get_object_or_404(Tournament, id=payload.tournament_id)

        cross_pool = CrossPool.objects.create(
            tournament=tournament,
            initial_seeding=payload.initial_seeding,
            current_seeding=payload.current_seeding or payload.initial_seeding,
        )

        return 201, cross_pool
    except Tournament.DoesNotExist:
        return 400, {
            "success": False,
            "message": f"Tournament with id {payload.tournament_id} not found",
        }
    except Exception as e:
        return 400, {"success": False, "message": "Failed to create cross pool", "details": str(e)}


@router.put(
    "/cross-pools/{cross_pool_id}",
    response={200: CrossPoolSchema, 404: ErrorSchema, 400: ErrorSchema, 401: ErrorSchema},
    tags=["cross-pools"],
)
@transaction.atomic
def update_cross_pool(
    request: AuthenticatedHttpRequest, cross_pool_id: int, payload: CrossPoolUpdateSchema
) -> tuple[int, CrossPool] | tuple[int, dict[str, Any]]:
    """
    Update an existing cross pool
    """
    if not request.user.is_staff:
        return 401, {"success": False, "message": "Only staff members can update cross pools"}

    try:
        cross_pool = get_object_or_404(CrossPool, id=cross_pool_id)

        # Update fields if provided
        for attr, value in payload.dict(exclude_unset=True).items():
            if value is not None:  # Skip None values
                setattr(cross_pool, attr, value)

        cross_pool.save()
        return 200, cross_pool
    except CrossPool.DoesNotExist:
        return 404, {"success": False, "message": f"Cross pool with id {cross_pool_id} not found"}
    except Exception as e:
        return 400, {"success": False, "message": "Failed to update cross pool", "details": str(e)}


@router.delete(
    "/cross-pools/{cross_pool_id}",
    response={200: SuccessSchema, 404: ErrorSchema, 401: ErrorSchema},
    tags=["cross-pools"],
)
@transaction.atomic
def delete_cross_pool(
    request: AuthenticatedHttpRequest, cross_pool_id: int
) -> tuple[int, dict[str, Any]]:
    """
    Delete a cross pool
    """
    if not request.user.is_staff:
        return 401, {"success": False, "message": "Only staff members can delete cross pools"}

    try:
        cross_pool = get_object_or_404(CrossPool, id=cross_pool_id)
        cross_pool.delete()
        return 200, {"success": True, "message": "Cross pool deleted successfully"}
    except CrossPool.DoesNotExist:
        return 404, {"success": False, "message": f"Cross pool with id {cross_pool_id} not found"}


# Bracket endpoints
@router.get("/brackets", response=list[BracketSchema], tags=["brackets"], auth=None)
@paginate(PageNumberPagination)
def list_brackets(
    request: HttpRequest,
    tournament_id: int | None = None,
    name: str | None = None,
) -> list[Bracket]:
    """
    List all brackets with optional filtering
    """
    qs = Bracket.objects.all().select_related("tournament")

    if tournament_id:
        qs = qs.filter(tournament_id=tournament_id)

    if name:
        qs = qs.filter(name=name)

    return list(qs)


@router.post(
    "/brackets",
    response={201: BracketSchema, 400: ErrorSchema, 401: ErrorSchema},
    tags=["brackets"],
)
@transaction.atomic
def create_bracket(
    request: AuthenticatedHttpRequest, payload: BracketCreateSchema
) -> tuple[int, Bracket] | tuple[int, dict[str, Any]]:
    """
    Create a new bracket
    """
    if not request.user.is_staff:
        return 401, {"success": False, "message": "Only staff members can create brackets"}

    try:
        tournament = get_object_or_404(Tournament, id=payload.tournament_id)

        bracket_seeding = {}
        start, end = map(int, payload.name.split("-"))
        for i in range(start, end + 1):
            bracket_seeding[i] = 0

        bracket = Bracket.objects.create(
            tournament=tournament,
            sequence_number=payload.sequence_number,
            name=payload.name,
            initial_seeding=bracket_seeding,
            current_seeding=bracket_seeding,
        )

        create_bracket_matches(tournament, bracket)

        return 201, bracket
    except Tournament.DoesNotExist:
        return 400, {
            "success": False,
            "message": f"Tournament with id {payload.tournament_id} not found",
        }
    except Exception as e:
        return 400, {"success": False, "message": "Failed to create bracket", "details": str(e)}


@router.put(
    "/brackets/{bracket_id}",
    response={200: BracketSchema, 404: ErrorSchema, 400: ErrorSchema, 401: ErrorSchema},
    tags=["brackets"],
)
@transaction.atomic
def update_bracket(
    request: AuthenticatedHttpRequest, bracket_id: int, payload: BracketUpdateSchema
) -> tuple[int, Bracket] | tuple[int, dict[str, Any]]:
    """
    Update an existing bracket
    """
    if not request.user.is_staff:
        return 401, {"success": False, "message": "Only staff members can update brackets"}

    try:
        bracket = get_object_or_404(Bracket, id=bracket_id)

        # Update fields if provided
        for attr, value in payload.dict(exclude_unset=True).items():
            if value is not None:  # Skip None values
                setattr(bracket, attr, value)

        bracket.save()
        return 200, bracket
    except Bracket.DoesNotExist:
        return 404, {"success": False, "message": f"Bracket with id {bracket_id} not found"}
    except Exception as e:
        return 400, {"success": False, "message": "Failed to update bracket", "details": str(e)}


@router.delete(
    "/brackets/{bracket_id}",
    response={200: SuccessSchema, 404: ErrorSchema, 401: ErrorSchema},
    tags=["brackets"],
)
@transaction.atomic
def delete_bracket(
    request: AuthenticatedHttpRequest, bracket_id: int
) -> tuple[int, dict[str, Any]]:
    """
    Delete a bracket
    """
    if not request.user.is_staff:
        return 401, {"success": False, "message": "Only staff members can delete brackets"}

    try:
        bracket = get_object_or_404(Bracket, id=bracket_id)
        bracket.delete()
        return 200, {"success": True, "message": "Bracket deleted successfully"}
    except Bracket.DoesNotExist:
        return 404, {"success": False, "message": f"Bracket with id {bracket_id} not found"}


# PositionPool endpoints
@router.get(
    "/position-pools", response=list[PositionPoolSchema], tags=["position-pools"], auth=None
)
@paginate(PageNumberPagination)
def list_position_pools(
    request: HttpRequest,
    tournament_id: int | None = None,
    name: str | None = None,
) -> list[PositionPool]:
    """
    List all position pools with optional filtering
    """
    qs = PositionPool.objects.all().select_related("tournament")

    if tournament_id:
        qs = qs.filter(tournament_id=tournament_id)

    if name:
        qs = qs.filter(name=name)

    return list(qs)


@router.post(
    "/position-pools",
    response={201: PositionPoolSchema, 400: ErrorSchema, 401: ErrorSchema},
    tags=["position-pools"],
)
@transaction.atomic
def create_position_pool(
    request: AuthenticatedHttpRequest, payload: PositionPoolCreateSchema
) -> tuple[int, PositionPool] | tuple[int, dict[str, Any]]:
    """
    Create a new position pool
    """
    if not request.user.is_staff:
        return 401, {"success": False, "message": "Only staff members can create position pools"}

    try:
        tournament = get_object_or_404(Tournament, id=payload.tournament_id)

        pool_seeding = {}
        for seed in payload.seeding:
            pool_seeding[seed] = 0

        position_pool = PositionPool.objects.create(
            tournament=tournament,
            sequence_number=payload.sequence_number,
            name=payload.name,
            initial_seeding=pool_seeding,
        )

        create_position_pool_matches(tournament, position_pool)

        return 201, position_pool
    except Tournament.DoesNotExist:
        return 400, {
            "success": False,
            "message": f"Tournament with id {payload.tournament_id} not found",
        }
    except Exception as e:
        return 400, {
            "success": False,
            "message": "Failed to create position pool",
            "details": str(e),
        }


@router.put(
    "/position-pools/{position_pool_id}",
    response={200: PositionPoolSchema, 404: ErrorSchema, 400: ErrorSchema, 401: ErrorSchema},
    tags=["position-pools"],
)
@transaction.atomic
def update_position_pool(
    request: AuthenticatedHttpRequest, position_pool_id: int, payload: PositionPoolUpdateSchema
) -> tuple[int, PositionPool] | tuple[int, dict[str, Any]]:
    """
    Update an existing position pool
    """
    if not request.user.is_staff:
        return 401, {"success": False, "message": "Only staff members can update position pools"}

    try:
        position_pool = get_object_or_404(PositionPool, id=position_pool_id)

        # Update fields if provided
        for attr, value in payload.dict(exclude_unset=True).items():
            if value is not None:  # Skip None values
                setattr(position_pool, attr, value)

        position_pool.save()
        return 200, position_pool
    except PositionPool.DoesNotExist:
        return 404, {
            "success": False,
            "message": f"Position pool with id {position_pool_id} not found",
        }
    except Exception as e:
        return 400, {
            "success": False,
            "message": "Failed to update position pool",
            "details": str(e),
        }


@router.delete(
    "/position-pools/{position_pool_id}",
    response={200: SuccessSchema, 404: ErrorSchema, 401: ErrorSchema},
    tags=["position-pools"],
)
@transaction.atomic
def delete_position_pool(
    request: AuthenticatedHttpRequest, position_pool_id: int
) -> tuple[int, dict[str, Any]]:
    """
    Delete a position pool
    """
    if not request.user.is_staff:
        return 401, {"success": False, "message": "Only staff members can delete position pools"}

    try:
        position_pool = get_object_or_404(PositionPool, id=position_pool_id)
        position_pool.delete()
        return 200, {"success": True, "message": "Position pool deleted successfully"}
    except PositionPool.DoesNotExist:
        return 404, {
            "success": False,
            "message": f"Position pool with id {position_pool_id} not found",
        }


@router.post(
    "/start/{tournament_id}",
    response={200: SuccessSchema, 400: ErrorSchema, 401: ErrorSchema},
)
def start_tournament(
    request: AuthenticatedHttpRequest, tournament_id: int
) -> tuple[int, Tournament] | tuple[int, dict[str, Any]]:
    """
    Start a tournament by populating matches with teams based on seeding
    """
    if not request.user.is_staff:
        return 401, {"message": "Only staff members can start tournaments"}

    try:
        tournament = Tournament.objects.get(id=tournament_id)
    except Tournament.DoesNotExist:
        return 400, {"message": "Tournament does not exist"}

    pool_matches = Match.objects.filter(tournament=tournament).exclude(pool__isnull=True)

    for match in pool_matches:
        team_1_id = tournament.initial_seeding[str(match.placeholder_seed_1)]
        team_2_id = tournament.initial_seeding[str(match.placeholder_seed_2)]

        team_1 = Team.objects.get(id=team_1_id)
        team_2 = Team.objects.get(id=team_2_id)

        match.team_1 = team_1
        match.team_2 = team_2
        match.status = Match.StatusTypes.SCHEDULED

        match.save()

    tournament.status = Tournament.StatusTypes.LIVE
    tournament.save()

    return 200, tournament


@router.post(
    "/generate-fixtures/{tournament_id}",
    response={200: SuccessSchema, 400: ErrorSchema, 401: ErrorSchema},
)
def generate_tournament_fixtures(
    request: AuthenticatedHttpRequest, tournament_id: int
) -> tuple[int, dict[str, Any]]:
    """
    Generate fixtures for a tournament
    """
    if not request.user.is_staff:
        return 401, {"message": "Only staff members can generate tournament fixtures"}

    try:
        tournament = Tournament.objects.get(id=tournament_id)
    except Tournament.DoesNotExist:
        return 400, {"message": "Tournament does not exist"}

    populate_fixtures(tournament.id)

    return 200, {"message": "Tournament fixtures populated"}
