from typing import Any

from django.db import transaction
from django.http import HttpRequest
from django.shortcuts import get_object_or_404
from ninja import Router
from ninja.pagination import PageNumberPagination, paginate

from osu.team.models import Team
from osu.team.schema import (
    ErrorSchema,
    SuccessSchema,
    TeamCreateSchema,
    TeamListSchema,
    TeamSchema,
    TeamUpdateSchema,
)
from osu.user.models import User

# Create router instance
router = Router(tags=["teams"])


# Custom type for authenticated requests
class AuthenticatedHttpRequest(HttpRequest):
    user: User


@router.get("", response=list[TeamListSchema], auth=None)
@paginate(PageNumberPagination)
def list_teams(
    request: HttpRequest,
    search: str | None = None,
) -> list[Team]:
    """
    List all teams with optional filtering.

    Args:
        request: HTTP request
        search: Optional search term to filter teams by name

    Returns:
        List of teams
    """
    query = Team.objects.all().order_by("name")

    if search:
        query = query.filter(name__icontains=search)

    return list(query)


@router.get("/{team_id}", response={200: TeamSchema, 404: ErrorSchema}, auth=None)
def get_team(request: HttpRequest, team_id: int) -> tuple[int, Team] | tuple[int, dict[str, Any]]:
    """
    Get detailed information about a specific team.

    Args:
        request: HTTP request
        team_id: ID of the team

    Returns:
        Team details or error
    """
    try:
        team = Team.objects.get(id=team_id)
        return 200, team
    except Team.DoesNotExist:
        return 404, {"message": f"Team with ID {team_id} not found"}


@router.get("/by-slug/{slug}", response={200: TeamSchema, 404: ErrorSchema}, auth=None)
def get_team_by_slug(
    request: HttpRequest, slug: str
) -> tuple[int, Team] | tuple[int, dict[str, Any]]:
    """
    Get detailed information about a specific team by its slug.

    Args:
        request: HTTP request
        slug: Slug of the team

    Returns:
        Team details or error
    """
    try:
        team = Team.objects.get(slug=slug)
        return 200, team
    except Team.DoesNotExist:
        return 404, {"message": f"Team with slug '{slug}' not found"}


@router.post("", response={201: TeamSchema, 400: ErrorSchema, 401: ErrorSchema})
@transaction.atomic
def create_team(
    request: AuthenticatedHttpRequest, payload: TeamCreateSchema
) -> tuple[int, Team] | tuple[int, dict[str, Any]]:
    """
    Create a new team.

    Args:
        request: HTTP request from authenticated user
        payload: Team creation data

    Returns:
        Created team or error
    """
    if not (request.user.is_staff or request.user.is_superuser):
        return 401, {"message": "Only staff members can create teams"}

    try:
        team = Team.objects.create(
            name=payload.name,
            instagram_url=payload.instagram_url,
        )

        # Add owners if provided
        if payload.owners:
            for owner_id in payload.owners:
                try:
                    owner = User.objects.get(id=owner_id)
                    team.owners.add(owner)
                except User.DoesNotExist:
                    return 400, {"message": f"User with ID {owner_id} not found"}

        return 201, team
    except Exception as e:
        return 400, {"message": "Failed to create team", "details": str(e)}


@router.put(
    "/{team_id}", response={200: TeamSchema, 404: ErrorSchema, 400: ErrorSchema, 401: ErrorSchema}
)
@transaction.atomic
def update_team(
    request: AuthenticatedHttpRequest, team_id: int, payload: TeamUpdateSchema
) -> tuple[int, Team] | tuple[int, dict[str, Any]]:
    """
    Update an existing team.

    Args:
        request: HTTP request from authenticated user
        team_id: ID of the team to update
        payload: Team update data

    Returns:
        Updated team or error
    """
    try:
        team = get_object_or_404(Team, id=team_id)

        # Check permissions - either staff or team owner
        if not (
            request.user.is_staff or request.user.is_superuser or request.user in team.owners.all()
        ):
            return 401, {"message": "You don't have permission to update this team"}

        # Update fields if provided
        if payload.name is not None:
            team.name = payload.name
            # Regenerate slug when name changes
            team.slug = team.get_slug()

        if payload.instagram_url is not None:
            team.instagram_url = payload.instagram_url

        # Update owners if provided
        if payload.owners is not None:
            team.owners.clear()
            for owner_id in payload.owners:
                try:
                    owner = User.objects.get(id=owner_id)
                    team.owners.add(owner)
                except User.DoesNotExist:
                    return 400, {"message": f"User with ID {owner_id} not found"}

        team.save()
        return 200, team
    except Team.DoesNotExist:
        return 404, {"message": f"Team with ID {team_id} not found"}
    except Exception as e:
        return 400, {"message": "Failed to update team", "details": str(e)}


@router.delete("/{team_id}", response={200: SuccessSchema, 404: ErrorSchema, 401: ErrorSchema})
@transaction.atomic
def delete_team(request: AuthenticatedHttpRequest, team_id: int) -> tuple[int, dict[str, Any]]:
    """
    Delete a team.

    Args:
        request: HTTP request from authenticated user
        team_id: ID of the team to delete

    Returns:
        Success message or error
    """
    try:
        team = get_object_or_404(Team, id=team_id)

        # Check permissions - only staff can delete teams
        if not (request.user.is_staff or request.user.is_superuser):
            return 401, {"message": "Only staff members can delete teams"}

        team_name = team.name
        team.delete()
        return 200, {"success": True, "message": f"Team '{team_name}' deleted successfully"}
    except Team.DoesNotExist:
        return 404, {"message": f"Team with ID {team_id} not found"}
    except Exception as e:
        return 400, {"message": "Failed to delete team", "details": str(e)}


@router.post(
    "/{team_id}/add-owner/{user_id}",
    response={200: SuccessSchema, 404: ErrorSchema, 401: ErrorSchema},
)
@transaction.atomic
def add_owner_to_team(
    request: AuthenticatedHttpRequest, team_id: int, user_id: int
) -> tuple[int, dict[str, Any]]:
    """
    Add an owner to a team.

    Args:
        request: HTTP request from authenticated user
        team_id: ID of the team
        user_id: ID of the user to add as owner

    Returns:
        Success message or error
    """
    try:
        team = get_object_or_404(Team, id=team_id)

        # Check permissions - either staff or team owner
        if not (
            request.user.is_staff or request.user.is_superuser or request.user in team.owners.all()
        ):
            return 401, {"message": "You don't have permission to modify this team's owners"}

        user = get_object_or_404(User, id=user_id)

        if user in team.owners.all():
            return 400, {"message": f"User '{user.username}' is already an owner of this team"}

        team.owners.add(user)
        return 200, {
            "success": True,
            "message": f"User '{user.username}' added as an owner of team '{team.name}'",
        }
    except Team.DoesNotExist:
        return 404, {"message": f"Team with ID {team_id} not found"}
    except User.DoesNotExist:
        return 404, {"message": f"User with ID {user_id} not found"}


@router.delete(
    "/{team_id}/remove-owner/{user_id}",
    response={200: SuccessSchema, 404: ErrorSchema, 401: ErrorSchema},
)
@transaction.atomic
def remove_owner_from_team(
    request: AuthenticatedHttpRequest, team_id: int, user_id: int
) -> tuple[int, dict[str, Any]]:
    """
    Remove an owner from a team.

    Args:
        request: HTTP request from authenticated user
        team_id: ID of the team
        user_id: ID of the user to remove as owner

    Returns:
        Success message or error
    """
    try:
        team = get_object_or_404(Team, id=team_id)

        # Check permissions - either staff or team owner
        if not (
            request.user.is_staff or request.user.is_superuser or request.user in team.owners.all()
        ):
            return 401, {"message": "You don't have permission to modify this team's owners"}

        user = get_object_or_404(User, id=user_id)

        if user not in team.owners.all():
            return 400, {"message": f"User '{user.username}' is not an owner of this team"}

        # Don't allow removing the last owner
        if team.owners.count() <= 1 and user in team.owners.all():
            return 400, {"message": "Cannot remove the last owner from a team"}

        team.owners.remove(user)
        return 200, {
            "success": True,
            "message": f"User '{user.username}' removed as an owner of team '{team.name}'",
        }
    except Team.DoesNotExist:
        return 404, {"message": f"Team with ID {team_id} not found"}
    except User.DoesNotExist:
        return 404, {"message": f"User with ID {user_id} not found"}
