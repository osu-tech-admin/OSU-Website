import json
from datetime import timedelta

from django.contrib.auth import get_user_model
from django.test import Client, TestCase
from django.utils import timezone

from osu.match.models import Match
from osu.player.models import Player
from osu.team.models import Team
from osu.tournament.models import Registration, Tournament, TournamentField

User = get_user_model()

# Define a constant for test passwords to avoid hardcoding
TEST_PASSWORD = "test_password_only"


class MatchAPITestCase(TestCase):
    """Test cases for Match API endpoints."""

    def setUp(self) -> None:
        """Set up test data for all test methods."""
        # Create users
        self.staff_user = User.objects.create_user(
            username="staff@example.com",
            email="staff@example.com",
            password=TEST_PASSWORD,
            is_staff=True,
            first_name="Staff",
            last_name="User",
        )
        self.team1_user = User.objects.create_user(
            username="team1@example.com",
            email="team1@example.com",
            password=TEST_PASSWORD,
            first_name="Team1",
            last_name="Captain",
        )
        self.team2_user = User.objects.create_user(
            username="team2@example.com",
            email="team2@example.com",
            password=TEST_PASSWORD,
            first_name="Team2",
            last_name="Captain",
        )

        # Create tournament
        self.tournament = Tournament.objects.create(
            name="Test Tournament",
            start_date=timezone.now().date(),
            end_date=(timezone.now() + timedelta(days=7)).date(),
            slug="test-tournament",
        )

        # Create tournament field
        self.field = TournamentField.objects.create(
            name="Test Field",
            tournament=self.tournament,
            address="123 Test St",
            location_url="https://maps.example.com",
        )

        # Create teams
        self.team1 = Team.objects.create(name="Team 1", slug="team-1")
        self.team2 = Team.objects.create(name="Team 2", slug="team-2")

        # Create players with correct field names
        self.player1 = Player.objects.create(
            user=self.team1_user,
            gender="M",
            date_of_birth=timezone.now().date() - timedelta(days=365 * 25),
            preffered_role="C",
            throwing_hand="R",
            match_up="M",
            city="Test City",
        )
        self.player2 = Player.objects.create(
            user=self.team2_user,
            gender="F",
            date_of_birth=timezone.now().date() - timedelta(days=365 * 25),
            preffered_role="H",
            throwing_hand="L",
            match_up="F",
            city="Test City",
        )

        # Add players to teams
        self.team1.players.add(self.player1)
        self.team2.players.add(self.player2)

        # Create registrations (team captains)
        self.registration1 = Registration.objects.create(
            player=self.player1,
            team=self.team1,
            tournament=self.tournament,
            role=Registration.Role.CAPTAIN,
        )
        self.registration2 = Registration.objects.create(
            player=self.player2,
            team=self.team2,
            tournament=self.tournament,
            role=Registration.Role.CAPTAIN,
        )

        # Create a match
        self.match = Match.objects.create(
            name="Test Match",
            tournament=self.tournament,
            team_1=self.team1,
            team_2=self.team2,
            time=timezone.now() + timedelta(hours=1),
            duration_mins=75,
            field=self.field,
            status=Match.StatusTypes.SCHEDULED,
            sequence_number=1,
            placeholder_seed_1=1,
            placeholder_seed_2=2,
        )

        # Create clients
        self.client = Client()
        self.staff_client = Client()
        self.team1_client = Client()
        self.team2_client = Client()

        # Log in clients
        self.staff_client.login(username="staff@example.com", password=TEST_PASSWORD)
        self.team1_client.login(username="team1@example.com", password=TEST_PASSWORD)
        self.team2_client.login(username="team2@example.com", password=TEST_PASSWORD)

        # API URLs
        self.base_url = "/api/matches"
        self.match_detail_url = f"{self.base_url}/{self.match.id}"

    def test_list_matches(self) -> None:
        """Test listing matches."""
        response = self.client.get(self.base_url)

        self.assertEqual(response.status_code, 200)
        data = json.loads(response.content)
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]["id"], self.match.id)
        self.assertEqual(data[0]["name"], "Test Match")

    def test_get_match_detail(self) -> None:
        """Test getting match details."""
        response = self.client.get(self.match_detail_url)

        self.assertEqual(response.status_code, 200)
        data = json.loads(response.content)
        self.assertEqual(data["id"], self.match.id)
        self.assertEqual(data["name"], "Test Match")
        self.assertEqual(data["team_1"]["id"], self.team1.id)
        self.assertEqual(data["team_2"]["id"], self.team2.id)

    def test_create_match(self) -> None:
        """Test creating a match (staff only)."""
        match_data = {
            "name": "New Test Match",
            "tournament_id": self.tournament.id,
            "team_1_id": self.team1.id,
            "team_2_id": self.team2.id,
            "time": (timezone.now() + timedelta(days=1)).isoformat(),
            "duration_mins": 75,
            "field_id": self.field.id,
            "status": Match.StatusTypes.SCHEDULED,
            "sequence_number": 2,
        }

        response = self.staff_client.post(
            self.base_url, data=json.dumps(match_data), content_type="application/json"
        )

        self.assertEqual(response.status_code, 201)
        data = json.loads(response.content)
        self.assertEqual(data["name"], "New Test Match")
        self.assertEqual(data["status"], Match.StatusTypes.SCHEDULED)

    def test_update_match(self) -> None:
        """Test updating a match (staff only)."""
        update_data = {"name": "Updated Test Match", "status": Match.StatusTypes.SCHEDULED}

        response = self.staff_client.put(
            self.match_detail_url, data=json.dumps(update_data), content_type="application/json"
        )

        self.assertEqual(response.status_code, 200)
        data = json.loads(response.content)
        self.assertEqual(data["name"], "Updated Test Match")
        self.assertEqual(data["status"], Match.StatusTypes.SCHEDULED)

    def test_delete_match(self) -> None:
        """Test deleting a match (staff only)."""
        response = self.staff_client.delete(self.match_detail_url)

        self.assertEqual(response.status_code, 200)
        data = json.loads(response.content)
        self.assertTrue(data["success"])

        # Verify match is deleted
        self.assertEqual(Match.objects.filter(id=self.match.id).count(), 0)

    def test_submit_match_score(self) -> None:
        """Test submitting a match score by team captain."""
        score_data = {"score_team_1": 15, "score_team_2": 13}

        url = f"{self.match_detail_url}/submit-score"
        response = self.team1_client.post(
            url, data=json.dumps(score_data), content_type="application/json"
        )

        self.assertEqual(response.status_code, 200)
        json.loads(response.content)

        # Verify suggested score is saved
        match = Match.objects.get(id=self.match.id)
        self.assertIsNotNone(match.suggested_score_team_1)
        if match.suggested_score_team_1:
            self.assertEqual(match.suggested_score_team_1.score_team_1, 15)
            self.assertEqual(match.suggested_score_team_1.score_team_2, 13)

    def test_submit_spirit_score(self) -> None:
        """Test submitting spirit scores by team captain."""
        spirit_data = {
            "opponent": {
                "rules": 4,
                "fouls": 3,
                "fair": 4,
                "positive": 4,
                "communication": 3,
                "mvp_id": self.player2.id,
                "comments": "Good game, fair play",
            },
            "self": {
                "rules": 3,
                "fouls": 4,
                "fair": 4,
                "positive": 3,
                "communication": 4,
                "mvp_id": self.player1.id,
                "comments": "We played our best",
            },
        }

        url = f"{self.match_detail_url}/submit-spirit-score"
        response = self.team1_client.post(
            url, data=json.dumps(spirit_data), content_type="application/json"
        )

        self.assertEqual(response.status_code, 200)
        json.loads(response.content)

        # Verify spirit scores are saved
        match = Match.objects.get(id=self.match.id)
        self.assertIsNotNone(match.spirit_score_team_2)  # Team 1 rates Team 2
        self.assertIsNotNone(match.self_spirit_score_team_1)  # Team 1 rates itself

        # Verify content of scores
        if match.spirit_score_team_2:
            self.assertEqual(match.spirit_score_team_2.rules, 4)
        if match.self_spirit_score_team_1:
            self.assertEqual(match.self_spirit_score_team_1.rules, 3)

    def test_staff_submit_score(self) -> None:
        """Test staff submitting final match score."""
        score_data = {
            "score_team_1": 15,
            "score_team_2": 12,
        }

        url = f"{self.match_detail_url}/staff-submit-score"
        response = self.staff_client.post(
            url, data=json.dumps(score_data), content_type="application/json"
        )

        self.assertEqual(response.status_code, 200)
        json.loads(response.content)

        # Verify official scores are set directly
        match = Match.objects.get(id=self.match.id)
        self.assertEqual(match.score_team_1, 15)
        self.assertEqual(match.score_team_2, 12)
        self.assertEqual(match.status, Match.StatusTypes.COMPLETED)

        # Verify suggested scores are set for both teams (same score)
        self.assertIsNotNone(match.suggested_score_team_1)
        self.assertIsNotNone(match.suggested_score_team_2)
        self.assertEqual(match.suggested_score_team_1, match.suggested_score_team_2)
