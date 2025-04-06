import json
import re
from typing import Any
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.core import mail
from django.core.mail import EmailMessage
from django.utils.timezone import now

from osu.user.utils import get_email_hash

from .base import BaseAuthTestCase

User = get_user_model()


class OTPAuthTests(BaseAuthTestCase):
    """Tests for the OTP-based authentication endpoints."""

    def setUp(self) -> None:
        """Set up test data and client."""
        super().setUp()
        self.test_email = self.test_user_data["email"]
        # Clear the test outbox
        mail.outbox = []

    def tearDown(self) -> None:
        """Clean up after tests."""
        mail.outbox = []
        super().tearDown()

    def _get_latest_email(self) -> EmailMessage | None:
        """Get the latest email from the test outbox."""
        if not mail.outbox:
            return None
        return mail.outbox[-1]

    def _get_emails_to(self, email_address: str) -> list[EmailMessage]:
        """Get all emails sent to a specific address."""
        return [email for email in mail.outbox if email_address in email.to]

    def _get_email_content(self, email: EmailMessage) -> str | None:
        """Get the content of an email (try both html and plain text)."""
        if hasattr(email, "body") and email.body:
            return str(email.body)  # Explicitly cast to str
        if hasattr(email, "alternatives") and email.alternatives:
            for content, mime_type in email.alternatives:
                if mime_type == "text/html":
                    return str(content)  # Explicitly cast to str
        return None

    def _extract_otp_from_email(self, email_content: str) -> str | None:
        """Extract OTP code from email content using regex."""
        # This pattern looks for 6 consecutive digits which is likely the OTP
        otp_pattern = r"\b(\d{6})\b"
        match = re.search(otp_pattern, email_content)

        if match:
            return match.group(1)
        return None

    def test_otp_request_sends_email(self) -> None:
        """Test OTP request sends an email with the correct content."""
        credentials = {"email": self.test_email}
        response = self.client.post(
            self.otp_request_url, data=json.dumps(credentials), content_type="application/json"
        )

        self.assertEqual(response.status_code, 200)
        response_data = json.loads(response.content)
        self.assertTrue("otp_ts" in response_data)

        # Verify email was sent
        self.assertEqual(len(mail.outbox), 1, "Email was not sent")

        # Get email
        email = self._get_latest_email()
        self.assertIsNotNone(email, "Email could not be retrieved")

        # Verify email recipient
        self.assertIsNotNone(email, "Email should not be None")
        if email:
            self.assertIn(self.test_email, email.to, "Email was not sent to the correct recipient")

            # Verify email subject
            self.assertEqual(
                email.subject,
                "OTP to Sign in to Off Season Ultimate Website",
                "Email does not have the expected subject",
            )

            # Get and verify email content
            email_content = self._get_email_content(email)
            self.assertIsNotNone(email_content, "Email content could not be retrieved")

            # Verify OTP can be extracted
            self.assertIsNotNone(email_content, "Email content should not be None")
            if email_content:
                otp = self._extract_otp_from_email(email_content)
                self.assertIsNotNone(otp, "Could not extract OTP from email")
                self.assertIsNotNone(otp, "OTP should not be None")
                if otp:
                    self.assertEqual(len(otp), 6, "OTP should be 6 digits")

    def test_end_to_end_otp_auth_flow(self) -> None:
        """Test the entire OTP authentication flow with real emails."""
        # Step 1: Request OTP
        credentials = {"email": self.test_email}
        response = self.client.post(
            self.otp_request_url, data=json.dumps(credentials), content_type="application/json"
        )

        self.assertEqual(response.status_code, 200)
        response_data = json.loads(response.content)
        otp_ts = response_data["otp_ts"]

        # Step 2: Get email and extract OTP
        email = self._get_latest_email()
        self.assertIsNotNone(email, "Email could not be retrieved")
        self.assertIsNotNone(email, "Email should not be None")

        if email:
            email_content = self._get_email_content(email)
            self.assertIsNotNone(email_content, "Email content could not be retrieved")
            self.assertIsNotNone(email_content, "Email content should not be None")

            if email_content:
                otp = self._extract_otp_from_email(email_content)
                self.assertIsNotNone(otp, "Could not extract OTP from email")
                self.assertIsNotNone(otp, "OTP should not be None")

                if otp:
                    # Step 3: Use OTP to login
                    login_credentials = {"email": self.test_email, "otp": otp, "otp_ts": otp_ts}

                    response = self.client.post(
                        self.otp_login_url,
                        data=json.dumps(login_credentials),
                        content_type="application/json",
                    )

                    self.assertEqual(response.status_code, 200)
                    self.assert_authenticated()

                    # Verify user in database
                    user = User.objects.get(email=self.test_email)
                    self.assertEqual(user.username, self.test_email)

    @patch("django.utils.timezone.now")
    def test_otp_request(self, mock_now: Any) -> None:
        """Test OTP request functionality."""
        mock_timestamp = now()
        mock_now.return_value = mock_timestamp

        credentials = {"email": self.test_email}
        response = self.client.post(
            self.otp_request_url, data=json.dumps(credentials), content_type="application/json"
        )

        self.assertEqual(response.status_code, 200)
        response_data = json.loads(response.content)
        self.assertEqual(response_data["otp_ts"], int(mock_timestamp.timestamp()))

        # Verify email was sent
        self.assertEqual(len(mail.outbox), 1, "Email was not sent")

        # Verify email recipient
        email = self._get_latest_email()
        self.assertIsNotNone(email, "Email should not be None")
        if email:
            self.assertIn(self.test_email, email.to)

            # Verify email subject
            self.assertEqual(email.subject, "OTP to Sign in to Off Season Ultimate Website")

    @patch("pyotp.TOTP.generate_otp")
    def test_otp_login_success(self, mock_generate_otp: Any) -> None:
        """Test successful OTP login."""
        mock_otp = "123456"
        mock_generate_otp.return_value = mock_otp

        otp_ts = int(now().timestamp())
        credentials = {"email": self.test_email, "otp": mock_otp, "otp_ts": otp_ts}

        response = self.client.post(
            self.otp_login_url, data=json.dumps(credentials), content_type="application/json"
        )

        self.assertEqual(response.status_code, 200)
        response_data = json.loads(response.content)
        self.assertEqual(response_data["email"], self.test_email)

        # Verify user is created and logged in
        self.assert_authenticated()

        # Verify the user was created in the database
        user = User.objects.get(email=self.test_email)
        self.assertEqual(user.username, self.test_email)

    @patch("pyotp.TOTP.generate_otp")
    def test_otp_login_failure(self, mock_generate_otp: Any) -> None:
        """Test OTP login with invalid OTP."""
        mock_generate_otp.return_value = "123456"

        otp_ts = int(now().timestamp())
        credentials = {"email": self.test_email, "otp": "654321", "otp_ts": otp_ts}  # Wrong OTP

        response = self.client.post(
            self.otp_login_url, data=json.dumps(credentials), content_type="application/json"
        )

        self.assertEqual(response.status_code, 403)
        response_data = json.loads(response.content)
        self.assertEqual(response_data["message"], "Invalid OTP")
        self.assert_not_authenticated()

    def test_otp_login_normalizes_email(self) -> None:
        """Test OTP login normalizes email (strips and lowercases)."""
        with patch("pyotp.TOTP.generate_otp") as mock_generate_otp:
            mock_otp = "123456"
            mock_generate_otp.return_value = mock_otp

            otp_ts = int(now().timestamp())
            credentials = {
                "email": " TestUser@Example.com ",  # Note the spaces and uppercase
                "otp": mock_otp,
                "otp_ts": otp_ts,
            }

            # Verify the email hash is calculated with normalized email
            with patch("osu.user.utils.get_email_hash") as mock_get_email_hash:
                mock_get_email_hash.return_value = "some_hash"

                response = self.client.post(
                    self.otp_login_url,
                    data=json.dumps(credentials),
                    content_type="application/json",
                )

                self.assertEqual(response.status_code, 200)
                self.assert_authenticated()

                # Verify the user was created with the normalized email
                user = User.objects.get(email="testuser@example.com")
                self.assertEqual(user.username, "testuser@example.com")

    @patch("pyotp.TOTP.generate_otp")
    def test_otp_reuse_existing_user(self, mock_generate_otp: Any) -> None:
        """Test OTP login reuses existing user if one exists with that email."""
        # Create a user first
        existing_user = self.create_test_user()

        mock_otp = "123456"
        mock_generate_otp.return_value = mock_otp

        otp_ts = int(now().timestamp())
        credentials = {"email": self.test_email, "otp": mock_otp, "otp_ts": otp_ts}

        response = self.client.post(
            self.otp_login_url, data=json.dumps(credentials), content_type="application/json"
        )

        self.assertEqual(response.status_code, 200)

        # Verify no new user was created
        self.assertEqual(User.objects.filter(email=self.test_email).count(), 1)

        # Verify the response contains the existing user
        response_data = json.loads(response.content)
        self.assertEqual(response_data["id"], existing_user.id)
        self.assert_authenticated()

    def test_otp_email_normalization(self) -> None:
        """Test that email is normalized before sending OTP email."""
        # Use uppercase and spaces in email
        email_with_spaces = " TestUser@Example.com "
        credentials = {"email": email_with_spaces}

        response = self.client.post(
            self.otp_request_url, data=json.dumps(credentials), content_type="application/json"
        )

        self.assertEqual(response.status_code, 200)

        # Verify email was sent to the normalized address
        self.assertEqual(len(mail.outbox), 1, "Email was not sent")

        email = self._get_latest_email()
        self.assertIsNotNone(email, "Email should not be None")
        if email:
            normalized_email = "testuser@example.com"
            self.assertIn(
                normalized_email, email.to, "Email was not sent to the normalized address"
            )

    def test_otp_from_real_email_matches_generated(self) -> None:
        """Test that the OTP in the email matches what would be generated with the same parameters."""
        # Request OTP
        credentials = {"email": self.test_email}
        response = self.client.post(
            self.otp_request_url, data=json.dumps(credentials), content_type="application/json"
        )

        self.assertEqual(response.status_code, 200)
        response_data = json.loads(response.content)
        otp_ts = response_data["otp_ts"]

        # Get email and extract OTP
        email = self._get_latest_email()
        self.assertIsNotNone(email, "Email was not sent")
        self.assertIsNotNone(email, "Email should not be None")

        if email:
            email_content = self._get_email_content(email)
            self.assertIsNotNone(email_content, "Email content could not be retrieved")
            self.assertIsNotNone(email_content, "Email content should not be None")

            if email_content:
                otp_from_email = self._extract_otp_from_email(email_content)
                self.assertIsNotNone(otp_from_email, "Could not extract OTP from email")
                self.assertIsNotNone(otp_from_email, "OTP from email should not be None")

                if otp_from_email:
                    # Manually generate OTP with the same parameters
                    import pyotp

                    email_hash = get_email_hash(self.test_email)
                    totp = pyotp.TOTP(email_hash)
                    manually_generated_otp = totp.generate_otp(otp_ts)

                    # Verify that they match
                    self.assertEqual(
                        otp_from_email,
                        manually_generated_otp,
                        "OTP in email doesn't match the one that would be generated with same parameters",
                    )

                    # Verify the OTP works for authentication
                    login_credentials = {
                        "email": self.test_email,
                        "otp": otp_from_email,
                        "otp_ts": otp_ts,
                    }

                    response = self.client.post(
                        self.otp_login_url,
                        data=json.dumps(login_credentials),
                        content_type="application/json",
                    )

                    self.assertEqual(response.status_code, 200)
                    self.assert_authenticated()

    def test_multiple_otp_requests_create_multiple_emails(self) -> None:
        """Test that multiple OTP requests create multiple emails."""
        # First request
        credentials = {"email": self.test_email}
        response = self.client.post(
            self.otp_request_url, data=json.dumps(credentials), content_type="application/json"
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(mail.outbox), 1, "First email was not sent")

        # Second request
        response = self.client.post(
            self.otp_request_url, data=json.dumps(credentials), content_type="application/json"
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(mail.outbox), 2, "Second email was not sent")

        # Verify emails were sent to the correct recipient
        emails_to_user = self._get_emails_to(self.test_email)
        self.assertEqual(len(emails_to_user), 2, "Both emails should be sent to the user")
