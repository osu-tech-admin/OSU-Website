import json

from .base import BaseAuthTestCase


class PasswordAuthTests(BaseAuthTestCase):
    """Tests for the password-based authentication endpoints."""

    def setUp(self) -> None:
        """Set up test data and client."""
        super().setUp()
        self.test_user = self.create_test_user()

    def test_login_success(self) -> None:
        """Test successful login."""
        credentials = {
            "username": self.test_user_data["username"],
            "password": self.test_user_data["password"],
        }
        response = self.client.post(
            self.login_url, data=json.dumps(credentials), content_type="application/json"
        )

        self.assertEqual(response.status_code, 200)
        response_data = json.loads(response.content)
        self.assertEqual(response_data["username"], self.test_user_data["username"])
        self.assertEqual(response_data["email"], self.test_user_data["email"])
        self.assert_authenticated()

    def test_login_failure(self) -> None:
        """Test login with invalid credentials."""
        credentials = {
            "username": self.test_user_data["username"],
            "password": "wrongpassword",
        }
        response = self.client.post(
            self.login_url, data=json.dumps(credentials), content_type="application/json"
        )

        self.assertEqual(response.status_code, 403)
        response_data = json.loads(response.content)
        self.assertEqual(response_data["message"], "Invalid credentials")
        self.assert_not_authenticated()

    def test_login_with_spaces_and_uppercase(self) -> None:
        """Test login with username containing spaces and uppercase letters."""
        credentials = {
            "username": " TestUser@Example.com ",  # Note the spaces and uppercase
            "password": self.test_user_data["password"],
        }
        response = self.client.post(
            self.login_url, data=json.dumps(credentials), content_type="application/json"
        )

        self.assertEqual(response.status_code, 200)
        response_data = json.loads(response.content)
        self.assertEqual(response_data["username"], self.test_user_data["username"])
        self.assert_authenticated()

    def test_logout(self) -> None:
        """Test logout functionality."""
        # First login
        self.client.login(
            username=self.test_user_data["username"], password=self.test_user_data["password"]
        )
        self.assert_authenticated()

        # Then logout
        response = self.client.post(self.logout_url)

        self.assertEqual(response.status_code, 200)
        response_data = json.loads(response.content)
        self.assertEqual(response_data["message"], "Logged out")
        self.assert_not_authenticated()

        # Verify user is logged out by checking access to a protected endpoint
        response = self.client.post(self.logout_url)
        self.assertEqual(
            response.status_code, 401
        )  # Assuming 401 is returned for unauthenticated users
