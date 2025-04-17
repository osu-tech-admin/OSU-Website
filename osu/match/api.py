from typing import Any

from django.db import transaction
from django.db.models import Q
from django.http import HttpRequest
from django.shortcuts import get_object_or_404
from ninja import Router

from osu.match.models import Match, MatchScore, SpiritScore
from osu.match.schema import (
    ErrorResponseSchema,
    MatchBasicSchema,
    MatchCreateSchema,
    MatchDetailSchema,
    MatchScoreSubmitSchema,
    MatchUpdateSchema,
    SpiritScoreSubmitSchema,
    StaffMatchScoreSubmitSchema,
    SuccessResponseSchema,
)
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
from osu.tournament.utils import (
    populate_fixtures,
    update_match_score_and_results,
    update_tournament_spirit_rankings,
)
from osu.user.models import User


# Define a type for authenticated requests
class AuthenticatedHttpRequest(HttpRequest):
    user: User


router = Router(tags=["matches"])


def check_user_match_permissions(
    user: User, match_id: int
) -> tuple[bool, str | None, Player | None, Team | None]:
    """
    Check if a user is authorized to submit scores or spirit scores for a match.

    Args:
        user: The authenticated user
        match_id: The ID of the match

    Returns:
        Tuple containing:
        - is_authorized: Boolean indicating if the user is authorized
        - error_message: Error message if not authorized, None otherwise
        - player: The Player object associated with the user if found, None otherwise
        - team: The team object that the player belongs to, None otherwise
    """
    try:
        # Get the player associated with the user
        try:
            player = Player.objects.get(user=user)
        except Player.DoesNotExist:
            return False, "Authenticated user does not have an associated player", None, None

        # Get the match
        match = get_object_or_404(Match, id=match_id)
        tournament = match.tournament

        # Check if player has an authorized role in the team for this tournament
        try:
            registration = Registration.objects.get(player=player, tournament=tournament)

            # Check the role field for captain, spirit captain, coach, or owner
            authorized_roles = [
                Registration.Role.CAPTAIN,
                Registration.Role.SPIRIT_CAPTAIN,
                Registration.Role.COACH,
                Registration.Role.OWNER,
            ]

            if registration.role in authorized_roles:
                return True, None, player, registration.team
            else:
                return (
                    False,
                    "Player does not have permission to submit scores for this team",
                    player,
                    registration.team,
                )

        except Registration.DoesNotExist:
            return False, "Player is not registered for this team in this tournament", player, None

    except Exception as e:
        return False, f"Error checking permissions: {e!s}", None, None


@router.get("", response=list[MatchBasicSchema], auth=None)
def list_matches(
    request: HttpRequest,
    tournament_id: int | None = None,
    team_id: int | None = None,
    status: str | None = None,
    pool_id: int | None = None,
    cross_pool_id: int | None = None,
    bracket_id: int | None = None,
    position_pool_id: int | None = None,
) -> list[Match]:
    """
    List matches with optional filtering by tournament, team, status, or pool type
    """
    filters: dict[str, Any] = {}
    if tournament_id:
        filters["tournament_id"] = tournament_id
    if status:
        filters["status"] = status
    if pool_id:
        filters["pool_id"] = pool_id
    if cross_pool_id:
        filters["cross_pool_id"] = cross_pool_id
    if bracket_id:
        filters["bracket_id"] = bracket_id
    if position_pool_id:
        filters["position_pool_id"] = position_pool_id

    queryset = Match.objects.filter(**filters)

    if team_id:
        queryset = queryset.filter(Q(team_1_id=team_id) | Q(team_2_id=team_id))

    return list(queryset.order_by("time", "sequence_number"))


@router.get(
    "/tournament/{tournament_slug}/team/{team_slug}", response=list[MatchBasicSchema], auth=None
)
def list_tournament_team_matches(
    request: HttpRequest, tournament_slug: str, team_slug: str
) -> list[Match]:
    qs = (
        Match.objects.filter(tournament__slug=tournament_slug)
        .filter(Q(team_1__slug=team_slug) | Q(team_2__slug=team_slug))
        .select_related("team_1", "team_2", "pool")
    )
    return list(qs)


@router.get("/{match_id}", response=MatchDetailSchema, auth=None)
def get_match(request: HttpRequest, match_id: int) -> Match:
    """
    Get detailed information about a specific match
    """
    return get_object_or_404(Match, id=match_id)


@router.post("", response={201: MatchDetailSchema, 400: ErrorResponseSchema})
def create_match(
    request: AuthenticatedHttpRequest, payload: MatchCreateSchema
) -> tuple[int, Match] | tuple[int, dict[str, Any]]:
    """
    Create a new match
    """
    try:
        # Verify user has permissions (could be expanded based on your authorization system)
        if not request.user.is_staff:
            return 400, {"success": False, "message": "You don't have permission to create matches"}

        tournament = get_object_or_404(Tournament, id=payload.tournament_id)
        team_1 = get_object_or_404(Team, id=payload.team_1_id)
        team_2 = get_object_or_404(Team, id=payload.team_2_id)

        field = None
        if payload.field_id:
            field = get_object_or_404(TournamentField, id=payload.field_id)

        pool = None
        if payload.pool_id:
            pool = get_object_or_404(Pool, id=payload.pool_id)

        cross_pool = None
        if payload.cross_pool_id:
            cross_pool = get_object_or_404(CrossPool, id=payload.cross_pool_id)

        bracket = None
        if payload.bracket_id:
            bracket = get_object_or_404(Bracket, id=payload.bracket_id)

        position_pool = None
        if payload.position_pool_id:
            position_pool = get_object_or_404(PositionPool, id=payload.position_pool_id)

        # Convert placeholder seeds to integers if they exist
        placeholder_seed_1 = None
        if payload.placeholder_seed_1 is not None:
            placeholder_seed_1 = int(payload.placeholder_seed_1)

        placeholder_seed_2 = None
        if payload.placeholder_seed_2 is not None:
            placeholder_seed_2 = int(payload.placeholder_seed_2)

        match = Match.objects.create(
            name=payload.name,
            tournament=tournament,
            team_1=team_1,
            team_2=team_2,
            time=payload.time,
            duration_mins=payload.duration_mins,
            field=field,
            status=payload.status,
            sequence_number=payload.sequence_number,
            placeholder_seed_1=placeholder_seed_1,
            placeholder_seed_2=placeholder_seed_2,
            pool=pool,
            cross_pool=cross_pool,
            bracket=bracket,
            position_pool=position_pool,
            video_url=payload.video_url,
        )

        return 201, match
    except Exception as e:
        return 400, {"success": False, "message": "Failed to create match", "details": str(e)}


@router.put("/{match_id}", response={200: MatchDetailSchema, 400: ErrorResponseSchema})
def update_match(
    request: AuthenticatedHttpRequest, match_id: int, payload: MatchUpdateSchema
) -> tuple[int, Match] | tuple[int, dict[str, Any]]:
    """
    Update an existing match
    """
    try:
        # Verify user has permissions
        if not request.user.is_staff:
            return 400, {"success": False, "message": "You don't have permission to update matches"}

        match = get_object_or_404(Match, id=match_id)

        if payload.team_1_id:
            match.team_1 = get_object_or_404(Team, id=payload.team_1_id)

        if payload.team_2_id:
            match.team_2 = get_object_or_404(Team, id=payload.team_2_id)

        if payload.field_id:
            match.field = get_object_or_404(TournamentField, id=payload.field_id)

        if payload.pool_id:
            match.pool = get_object_or_404(Pool, id=payload.pool_id)

        if payload.cross_pool_id:
            match.cross_pool = get_object_or_404(CrossPool, id=payload.cross_pool_id)

        if payload.bracket_id:
            match.bracket = get_object_or_404(Bracket, id=payload.bracket_id)

        if payload.position_pool_id:
            match.position_pool = get_object_or_404(PositionPool, id=payload.position_pool_id)

        # Update other fields
        for field, value in payload.dict(exclude_unset=True).items():
            if field not in [
                "team_1_id",
                "team_2_id",
                "field_id",
                "pool_id",
                "cross_pool_id",
                "bracket_id",
                "position_pool_id",
            ]:
                setattr(match, field, value)

        match.save()
        return 200, match

    except Exception as e:
        return 400, {"success": False, "message": "Failed to update match", "details": str(e)}


@router.delete("/{match_id}", response={200: SuccessResponseSchema, 404: ErrorResponseSchema})
def delete_match(
    request: AuthenticatedHttpRequest, match_id: int
) -> dict[str, Any] | tuple[int, dict[str, Any]]:
    """
    Delete a match
    """
    # Verify user has permissions
    if not request.user.is_staff:
        return 400, {"success": False, "message": "You don't have permission to delete matches"}

    match = get_object_or_404(Match, id=match_id)
    match.delete()
    return {"success": True, "message": "Match deleted successfully"}


@router.post(
    "/{match_id}/submit-score", response={200: MatchDetailSchema, 400: ErrorResponseSchema}
)
def submit_match_score(
    request: AuthenticatedHttpRequest, match_id: int, payload: MatchScoreSubmitSchema
) -> Match | tuple[int, dict[str, Any]]:
    """
    Submit a score for a match

    Only team captains, spirit captains, coaches, or owners can submit scores.
    """
    try:
        with transaction.atomic():
            # Check if user has permission to submit scores
            is_authorized, error_message, player, team = check_user_match_permissions(
                user=request.user, match_id=match_id
            )

            if not is_authorized:
                return 400, {"success": False, "message": error_message}

            match = get_object_or_404(Match, id=match_id)

            # Ensure player is not None before creating MatchScore
            if player is None:
                return 400, {"success": False, "message": "No player associated with this user"}

            # Create match score entry
            match_score = MatchScore.objects.create(
                score_team_1=payload.score_team_1,
                score_team_2=payload.score_team_2,
                entered_by=player,
            )

            # Assign the score to the appropriate team
            if team == match.team_1:
                match.suggested_score_team_1 = match_score
            elif team == match.team_2:
                match.suggested_score_team_2 = match_score

            # Check if both teams have submitted scores and they match
            if match.suggested_score_team_1 and match.suggested_score_team_2:
                score1 = match.suggested_score_team_1
                score2 = match.suggested_score_team_2

                if (
                    score1.score_team_1 == score2.score_team_1
                    and score1.score_team_2 == score2.score_team_2
                ):
                    # Both scores match, update the match
                    update_match_score_and_results(match, score1.score_team_1, score1.score_team_2)
                    populate_fixtures(match.tournament.id)

            match.save()
            return match

    except Exception as e:
        return 400, {"success": False, "message": "Failed to submit score", "details": str(e)}


@router.post(
    "/{match_id}/submit-spirit-score", response={200: MatchDetailSchema, 400: ErrorResponseSchema}
)
def submit_spirit_score(
    request: AuthenticatedHttpRequest, match_id: int, payload: SpiritScoreSubmitSchema
) -> Match | tuple[int, dict[str, Any]]:
    """
    Submit spirit scores for a match.

    Only team captains, spirit captains, coaches, or owners can submit spirit scores.
    The system automatically determines which team is submitting based on the authenticated user.
    Both self-evaluation and opponent evaluation are submitted at once.
    """
    try:
        with transaction.atomic():
            # Check if user has permission to submit spirit scores
            is_authorized, error_message, player, team = check_user_match_permissions(
                user=request.user, match_id=match_id
            )

            if not is_authorized:
                return 400, {"success": False, "message": error_message}

            match = get_object_or_404(Match, id=match_id)

            # Process opponent spirit score
            opponent_mvp = None
            if payload.opponent.mvp_id:
                opponent_mvp = get_object_or_404(Player, id=payload.opponent.mvp_id)

            opponent_msp = None
            if payload.opponent.msp_id:
                opponent_msp = get_object_or_404(Player, id=payload.opponent.msp_id)

            # Calculate total for opponent score
            opponent_total = (
                payload.opponent.rules
                + payload.opponent.fouls
                + payload.opponent.fair
                + payload.opponent.positive
                + payload.opponent.communication
            )

            opponent_spirit_score = SpiritScore.objects.create(
                rules=payload.opponent.rules,
                fouls=payload.opponent.fouls,
                fair=payload.opponent.fair,
                positive=payload.opponent.positive,
                communication=payload.opponent.communication,
                total=opponent_total,
                mvp=opponent_mvp,
                msp=opponent_msp,
                comments=payload.opponent.comments,
            )

            # Process self spirit score
            self_mvp = None
            if payload.self.mvp_id:
                self_mvp = get_object_or_404(Player, id=payload.self.mvp_id)

            self_msp = None
            if payload.self.msp_id:
                self_msp = get_object_or_404(Player, id=payload.self.msp_id)

            # Calculate total for self score
            self_total = (
                payload.self.rules
                + payload.self.fouls
                + payload.self.fair
                + payload.self.positive
                + payload.self.communication
            )

            self_spirit_score = SpiritScore.objects.create(
                rules=payload.self.rules,
                fouls=payload.self.fouls,
                fair=payload.self.fair,
                positive=payload.self.positive,
                communication=payload.self.communication,
                total=self_total,
                mvp=self_mvp,
                msp=self_msp,
                comments=payload.self.comments,
            )

            # Assign spirit scores based on which team is submitting
            if team == match.team_1:
                match.spirit_score_team_2 = opponent_spirit_score  # Team 1 rates Team 2
                match.self_spirit_score_team_1 = self_spirit_score  # Team 1 rates itself
            elif team == match.team_2:
                match.spirit_score_team_1 = opponent_spirit_score  # Team 2 rates Team 1
                match.self_spirit_score_team_2 = self_spirit_score  # Team 2 rates itself

            match.save()
            update_tournament_spirit_rankings(match.tournament)
            return match

    except Exception as e:
        return 400, {
            "success": False,
            "message": "Failed to submit spirit score",
            "details": str(e),
        }


@router.post(
    "/{match_id}/staff-submit-score", response={200: MatchDetailSchema, 400: ErrorResponseSchema}
)
def staff_submit_match_score(
    request: AuthenticatedHttpRequest, match_id: int, payload: StaffMatchScoreSubmitSchema
) -> Match | tuple[int, dict[str, Any]]:
    """
    Submit a final official score for a match (staff only).

    This endpoint is restricted to staff members only and bypasses the team validation process.
    The submitted score is immediately set as the official score for the match.
    """
    try:
        # Verify user has staff permissions
        if not request.user.is_staff:
            return 400, {"success": False, "message": "Only staff members can use this endpoint"}

        with transaction.atomic():
            match = get_object_or_404(Match, id=match_id)

            update_match_score_and_results(match, payload.score_team_1, payload.score_team_2)
            populate_fixtures(match.tournament.id)

            match.save()
            return match

    except Exception as e:
        return 400, {"success": False, "message": "Failed to submit score", "details": str(e)}
