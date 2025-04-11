import json

from django.contrib.auth import get_user_model
from django.test import Client, TestCase

from osu.team.models import Team

User = get_user_model()

# Use a constant for test passwords to avoid hardcoded password warnings
TEST_PASSWORD = "test_password_only"


class TeamAPITestCase(TestCase):
    """Test cases for Team API endpoints."""

    def setUp(self) -> None:
        """Set up test data for all test methods."""
        # Create users
        self.admin_user = User.objects.create_user(
            username="admin@example.com",
            email="admin@example.com",
            password=TEST_PASSWORD,
            is_staff=True,
            first_name="Admin",
            last_name="User",
        )

        self.regular_user = User.objects.create_user(
            username="user@example.com",
            email="user@example.com",
            password=TEST_PASSWORD,
            first_name="Regular",
            last_name="User",
        )

        self.team_owner = User.objects.create_user(
            username="owner@example.com",
            email="owner@example.com",
            password=TEST_PASSWORD,
            first_name="Team",
            last_name="Owner",
        )

        # Create a team
        self.team = Team.objects.create(
            name="Test Team",
            instagram_url="https://instagram.com/testteam",
        )
        self.team.owners.add(self.team_owner)

        # Create a second team
        self.team2 = Team.objects.create(
            name="Another Team",
        )

        # Create API clients
        self.client = Client()
        self.admin_client = Client()
        self.admin_client.login(username="admin@example.com", password=TEST_PASSWORD)

        self.regular_client = Client()
        self.regular_client.login(username="user@example.com", password=TEST_PASSWORD)

        self.owner_client = Client()
        self.owner_client.login(username="owner@example.com", password=TEST_PASSWORD)

        # API URLs
        self.teams_url = "/api/teams"
        self.team_detail_url = f"{self.teams_url}/{self.team.id}"
        self.team2_detail_url = f"{self.teams_url}/{self.team2.id}"
        self.team_by_slug_url = f"{self.teams_url}/by-slug/{self.team.slug}"

    def test_list_teams(self) -> None:
        """Test listing teams."""
        response = self.client.get(self.teams_url)

        self.assertEqual(response.status_code, 200)
        data = json.loads(response.content)
        self.assertEqual(len(data["items"]), 2)
        self.assertTrue(any(item["name"] == "Test Team" for item in data["items"]))
        self.assertTrue(any(item["name"] == "Another Team" for item in data["items"]))

    def test_search_teams(self) -> None:
        """Test searching teams by name."""
        response = self.client.get(f"{self.teams_url}?search=Another")

        self.assertEqual(response.status_code, 200)
        data = json.loads(response.content)
        self.assertEqual(len(data["items"]), 1)
        self.assertEqual(data["items"][0]["name"], "Another Team")

    def test_get_team_by_id(self) -> None:
        """Test getting team details by ID."""
        response = self.client.get(self.team_detail_url)

        self.assertEqual(response.status_code, 200)
        data = json.loads(response.content)
        self.assertEqual(data["name"], "Test Team")
        self.assertEqual(data["instagram_url"], "https://instagram.com/testteam")
        self.assertEqual(data["slug"], self.team.slug)

    def test_get_team_by_slug(self) -> None:
        """Test getting team details by slug."""
        response = self.client.get(self.team_by_slug_url)

        self.assertEqual(response.status_code, 200)
        data = json.loads(response.content)
        self.assertEqual(data["name"], "Test Team")
        self.assertEqual(data["id"], self.team.id)
        self.assertEqual(data["instagram_url"], "https://instagram.com/testteam")

    def test_get_nonexistent_team(self) -> None:
        """Test getting a team that doesn't exist."""
        response = self.client.get(f"{self.teams_url}/99999")

        self.assertEqual(response.status_code, 404)
        data = json.loads(response.content)
        self.assertFalse(data["success"])
        self.assertIn("not found", data["message"])

    def test_create_team_as_admin(self) -> None:
        """Test creating a team as an admin."""
        team_data = {
            "name": "New Team",
            "instagram_url": "https://instagram.com/newteam",
            "owners": [self.regular_user.id],
        }

        response = self.admin_client.post(
            self.teams_url, data=json.dumps(team_data), content_type="application/json"
        )

        self.assertEqual(response.status_code, 201)
        data = json.loads(response.content)
        self.assertEqual(data["name"], "New Team")
        self.assertEqual(data["instagram_url"], "https://instagram.com/newteam")

        # Verify the team was created in the database
        self.assertTrue(Team.objects.filter(name="New Team").exists())

        # Verify the owner was added
        created_team = Team.objects.get(name="New Team")
        self.assertTrue(self.regular_user in created_team.owners.all())

    def test_create_team_as_regular_user(self) -> None:
        """Test creating a team as a regular user (should fail)."""
        team_data = {
            "name": "Unauthorized Team",
            "instagram_url": "https://instagram.com/unauthorized",
        }

        response = self.regular_client.post(
            self.teams_url, data=json.dumps(team_data), content_type="application/json"
        )

        self.assertEqual(response.status_code, 401)
        json.loads(response.content)
        self.assertFalse(Team.objects.filter(name="Unauthorized Team").exists())

    def test_update_team_as_admin(self) -> None:
        """Test updating a team as an admin."""
        update_data = {
            "name": "Updated Team Name",
            "instagram_url": "https://instagram.com/updated",
        }

        response = self.admin_client.put(
            self.team_detail_url, data=json.dumps(update_data), content_type="application/json"
        )

        self.assertEqual(response.status_code, 200)
        data = json.loads(response.content)
        self.assertEqual(data["name"], "Updated Team Name")
        self.assertEqual(data["instagram_url"], "https://instagram.com/updated")

        # Verify the team was updated in the database
        updated_team = Team.objects.get(id=self.team.id)
        self.assertEqual(updated_team.name, "Updated Team Name")
        self.assertEqual(updated_team.instagram_url, "https://instagram.com/updated")

    def test_update_team_as_owner(self) -> None:
        """Test updating a team as a team owner."""
        update_data = {
            "name": "Owner Updated Team",
            "instagram_url": "https://instagram.com/owner-updated",
        }

        response = self.owner_client.put(
            self.team_detail_url, data=json.dumps(update_data), content_type="application/json"
        )

        self.assertEqual(response.status_code, 200)
        data = json.loads(response.content)
        self.assertEqual(data["name"], "Owner Updated Team")

        # Verify the team was updated in the database
        updated_team = Team.objects.get(id=self.team.id)
        self.assertEqual(updated_team.name, "Owner Updated Team")

    def test_update_team_as_non_owner(self) -> None:
        """Test updating a team as a non-owner (should fail)."""
        update_data = {
            "name": "Unauthorized Update",
        }

        response = self.regular_client.put(
            self.team_detail_url, data=json.dumps(update_data), content_type="application/json"
        )

        self.assertEqual(response.status_code, 401)

        # Verify the team was not updated
        team = Team.objects.get(id=self.team.id)
        self.assertNotEqual(team.name, "Unauthorized Update")

    def test_delete_team_as_admin(self) -> None:
        """Test deleting a team as an admin."""
        response = self.admin_client.delete(self.team2_detail_url)

        self.assertEqual(response.status_code, 200)
        data = json.loads(response.content)
        self.assertTrue(data["success"])

        # Verify the team was deleted from the database
        self.assertFalse(Team.objects.filter(id=self.team2.id).exists())

    def test_delete_team_as_regular_user(self) -> None:
        """Test deleting a team as a regular user (should fail)."""
        response = self.regular_client.delete(self.team2_detail_url)

        self.assertEqual(response.status_code, 401)

        # Verify the team was not deleted
        self.assertTrue(Team.objects.filter(id=self.team2.id).exists())

    def test_add_owner_to_team(self) -> None:
        """Test adding an owner to a team."""
        response = self.admin_client.post(
            f"{self.team2_detail_url}/add-owner/{self.regular_user.id}"
        )

        self.assertEqual(response.status_code, 200)
        data = json.loads(response.content)
        self.assertTrue(data["success"])

        # Verify the owner was added
        self.assertTrue(self.regular_user in Team.objects.get(id=self.team2.id).owners.all())

    def test_remove_owner_from_team(self) -> None:
        """Test removing an owner from a team."""
        # First add another owner to test removing one
        self.team.owners.add(self.regular_user)

        response = self.admin_client.delete(
            f"{self.team_detail_url}/remove-owner/{self.regular_user.id}"
        )

        self.assertEqual(response.status_code, 200)
        data = json.loads(response.content)
        self.assertTrue(data["success"])

        # Verify the owner was removed
        self.assertFalse(self.regular_user in Team.objects.get(id=self.team.id).owners.all())

    def test_remove_last_owner_from_team(self) -> None:
        """Test removing the last owner from a team (should fail)."""
        response = self.admin_client.delete(
            f"{self.team_detail_url}/remove-owner/{self.team_owner.id}"
        )

        self.assertEqual(response.status_code, 400)
        data = json.loads(response.content)
        self.assertFalse(data.get("success", False))
        self.assertIn("last owner", data["message"])
