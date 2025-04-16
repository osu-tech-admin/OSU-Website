"""
Base test utilities for user authentication testing.
"""
from typing import Any

from django.contrib.auth import get_user_model
from django.test import Client, TestCase

User = get_user_model()


class BaseAuthTestCase(TestCase):
    """Base test case for authentication tests."""

    def setUp(self) -> None:
        """Set up test data and client."""
        super().setUp()
        self.client = Client()
        self.test_user_data: dict[str, str] = {
            "username": "testuser@example.com",
            "email": "testuser@example.com",
            "password": "securepassword123",
        }

        # API endpoints
        self.login_url = "/api/user/login"
        self.logout_url = "/api/user/logout"
        self.otp_request_url = "/api/user/login/otp/request"
        self.otp_login_url = "/api/user/login/otp"

    def create_test_user(self) -> Any:
        """Create a test user."""
        return User.objects.create_user(**self.test_user_data)

    def assert_authenticated(self) -> None:
        """Assert that the client is authenticated."""
        self.assertTrue(self.client.session.get("_auth_user_id"))

    def assert_not_authenticated(self) -> None:
        """Assert that the client is not authenticated."""
        self.assertFalse(self.client.session.get("_auth_user_id"))
