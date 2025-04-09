import csv
import os
import re
import tempfile
import time
from argparse import ArgumentParser
from pathlib import Path
from typing import Any, cast
from urllib.parse import parse_qs, urlparse

import requests
from django.core.files import File
from django.core.management.base import BaseCommand
from django.utils.text import slugify

from osu.player.models import Player
from osu.user.models import User

# Constants
HTTP_OK = 200


class Command(BaseCommand):
    help = "Create users and players from the mul_s5_players.csv file"

    def add_arguments(self, parser: ArgumentParser) -> None:
        parser.add_argument(
            "--skip-existing",
            action="store_true",
            help="Skip existing users instead of showing warnings",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Don't actually create users/players, just show what would be done",
        )
        parser.add_argument(
            "--max-retries",
            type=int,
            default=3,
            help="Maximum number of retries for downloading profile pictures",
        )

    def handle(self, *args: Any, **options: Any) -> None:
        # Path to the CSV file
        csv_file_path = Path(__file__).parent.parent / "data" / "mul_s5_players.csv"

        if not os.path.exists(csv_file_path):
            self.stdout.write(self.style.ERROR(f"CSV file not found at {csv_file_path}"))
            return

        # Get options
        skip_existing = options.get("skip_existing", False)
        dry_run = options.get("dry_run", False)
        max_retries = options.get("max_retries", 3)

        if dry_run:
            self.stdout.write(self.style.WARNING("DRY RUN MODE - no changes will be made"))

        # Count for reporting
        created_count = 0
        skipped_count = 0
        profile_picture_success = 0
        profile_picture_failed = 0

        with open(csv_file_path, encoding="utf-8") as csv_file:
            # Read the CSV file and get the column names
            csv_reader = csv.reader(csv_file)
            header = next(csv_reader)

            # Normalize column names
            normalized_header = [col.strip().lower() for col in header]

            # Find column indexes
            email_idx = self._find_column_index(normalized_header, "email")
            name_idx = self._find_column_index(normalized_header, "name")
            phone_idx = self._find_column_index(normalized_header, "phone")
            profile_pic_idx = self._find_column_index(normalized_header, "profile picture")
            gender_idx = self._find_column_index(normalized_header, ["gender", "gender "])
            role_idx = self._find_column_index(
                normalized_header, ["preffered role", "preferred role"]
            )
            hand_idx = self._find_column_index(normalized_header, ["main hand", "throwing hand"])

            # Validate required columns exist
            missing_columns: list[str] = []
            if email_idx is None:
                missing_columns.append("email")
            if name_idx is None:
                missing_columns.append("name")

            if missing_columns:
                self.stdout.write(
                    self.style.ERROR(
                        f"Required columns missing from CSV: {', '.join(missing_columns)}"
                    )
                )
                return

            # Cast to non-None values - we've already checked they're not None
            email_idx = cast(int, email_idx)
            name_idx = cast(int, name_idx)

            # Reset file pointer and skip header
            csv_file.seek(0)
            next(csv_file)

            for row in csv.reader(csv_file):
                email = row[email_idx].strip()
                name_parts = row[name_idx].strip().split(" ", 1)
                first_name = name_parts[0]
                last_name = name_parts[1] if len(name_parts) > 1 else ""
                phone = row[phone_idx].strip() if phone_idx is not None else ""
                profile_picture_url = (
                    row[profile_pic_idx].strip() if profile_pic_idx is not None else ""
                )
                gender_str = row[gender_idx].strip() if gender_idx is not None else "Other"
                preferred_role_str = row[role_idx].strip() if role_idx is not None else ""
                main_hand_str = row[hand_idx].strip() if hand_idx is not None else ""

                # Check if user already exists
                if User.objects.filter(username=email).exists():
                    if not skip_existing:
                        self.stdout.write(
                            self.style.WARNING(f"User with email {email} already exists. Skipping.")
                        )
                    skipped_count += 1
                    continue

                # If dry run, just show what would be done
                if dry_run:
                    self.stdout.write(
                        f"Would create user: {first_name} {last_name} ({email}) with role: {preferred_role_str}"
                    )
                    continue

                # Create user
                user = User.objects.create(
                    username=email,
                    email=email,
                    first_name=first_name,
                    last_name=last_name,
                    phone=phone,
                    # Setting an unusable password, users will need to reset password
                    is_active=True,
                )
                user.set_unusable_password()
                user.save()

                # Map gender to model choices
                gender_mapping = {
                    "male": Player.GenderTypes.MALE,
                    "female": Player.GenderTypes.FEMALE,
                    # Add more mappings if needed
                }
                gender = gender_mapping.get(gender_str.lower(), Player.GenderTypes.OTHER)

                # Map match up (assume same as gender for now)
                match_up = (
                    Player.MatchupTypes.MALE
                    if gender == Player.GenderTypes.MALE
                    else Player.MatchupTypes.FEMALE
                )

                # Map preferred role
                role_mapping = {
                    "cutter": Player.PrefferedRoleTypes.CUTTER,
                    "handler": Player.PrefferedRoleTypes.HANDLER,
                }
                preferred_role = role_mapping.get(preferred_role_str.lower())

                # Map throwing hand
                hand_mapping = {
                    "right": Player.ThrowingHandTypes.RIGHT,
                    "left": Player.ThrowingHandTypes.LEFT,
                }
                throwing_hand = hand_mapping.get(main_hand_str.lower())

                # Create player profile
                player = Player.objects.create(
                    user=user,
                    gender=gender,
                    match_up=match_up,
                    city="Unknown",  # Default city as it's not in the CSV
                    throwing_hand=throwing_hand,
                    preffered_role=preferred_role,
                )

                # Handle profile picture from Google Drive
                if profile_picture_url and "drive.google.com" in profile_picture_url:
                    try:
                        # Download and save the profile picture with retries
                        picture_saved = False
                        retries = 0
                        while not picture_saved and retries < max_retries:
                            try:
                                picture_saved = self.download_and_save_profile_picture(
                                    player, profile_picture_url
                                )
                                if picture_saved:
                                    profile_picture_success += 1
                                    self.stdout.write(
                                        self.style.SUCCESS(f"  - Profile picture saved for {email}")
                                    )
                                else:
                                    retries += 1
                                    if retries < max_retries:
                                        self.stdout.write(
                                            f"  - Retrying download for {email} (attempt {retries+1}/{max_retries})"
                                        )
                                        time.sleep(1)  # Short pause between retries
                            except requests.RequestException as e:
                                retries += 1
                                if retries < max_retries:
                                    self.stdout.write(
                                        self.style.WARNING(
                                            f"  - Error downloading profile picture for {email}: {e!s}. "
                                            f"Retrying ({retries}/{max_retries})..."
                                        )
                                    )
                                    time.sleep(2)  # Longer pause for network errors
                                else:
                                    raise

                        if not picture_saved:
                            profile_picture_failed += 1
                            self.stdout.write(
                                self.style.WARNING(
                                    f"  - Could not save profile picture for {email} after {max_retries} attempts"
                                )
                            )
                    except Exception as e:
                        profile_picture_failed += 1
                        self.stdout.write(
                            self.style.ERROR(f"  - Error saving profile picture for {email}: {e!s}")
                        )

                created_count += 1
                self.stdout.write(
                    self.style.SUCCESS(f"Created player: {player} with email {email}")
                )

        self.stdout.write(self.style.SUCCESS(f"Successfully created {created_count} players"))
        self.stdout.write(
            self.style.SUCCESS(
                f"Profile pictures: {profile_picture_success} saved, {profile_picture_failed} failed"
            )
        )
        if skipped_count > 0:
            self.stdout.write(
                self.style.WARNING(f"Skipped {skipped_count} players (already exist)")
            )

    def _find_column_index(self, header: list[str], column_names: str | list[str]) -> int | None:
        """Find column index in header by name(s)."""
        if isinstance(column_names, str):
            column_names = [column_names]

        for name in column_names:
            if name.lower() in header:
                return header.index(name.lower())
        return None

    def download_and_save_profile_picture(self, player: Player, drive_url: str) -> bool:
        """Download profile picture from Google Drive and save it to the player model."""
        # Extract file ID from Google Drive URL
        file_id = self.extract_google_drive_file_id(drive_url)
        if not file_id:
            return False

        # Create direct download URL
        direct_url = f"https://drive.google.com/uc?export=download&id={file_id}"

        try:
            # Download the image with increased timeout
            response = requests.get(direct_url, stream=True, timeout=30)
            if response.status_code != HTTP_OK:
                return False

            # Save to a temporary file
            with tempfile.NamedTemporaryFile(delete=False, suffix=".jpg") as temp_file:
                for chunk in response.iter_content(chunk_size=8192):  # Larger chunk size
                    if chunk:
                        temp_file.write(chunk)
                temp_file_path = temp_file.name

            # Open the temporary file and save it to the player model
            with open(temp_file_path, "rb") as img_file:
                file_name = f"{slugify(player.user.get_full_name())}_profile.jpg"
                player.profile_picture.save(file_name, File(img_file), save=True)

            # Clean up temporary file
            os.unlink(temp_file_path)
            return True

        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Error downloading profile picture: {e!s}"))
            return False

    def extract_google_drive_file_id(self, url: str) -> str | None:
        """Extract the file ID from a Google Drive URL."""
        # Pattern 1: https://drive.google.com/open?id=FILE_ID
        if "open?id=" in url:
            parsed_url = urlparse(url)
            query_params = parse_qs(parsed_url.query)
            if "id" in query_params:
                return query_params["id"][0]

        # Pattern 2: https://drive.google.com/file/d/FILE_ID/view
        file_id_match = re.search(r"/file/d/([^/]+)", url)
        if file_id_match:
            return file_id_match.group(1)

        # Pattern 3: https://drive.google.com/uc?export=view&id=FILE_ID
        if "uc?export=" in url:
            parsed_url = urlparse(url)
            query_params = parse_qs(parsed_url.query)
            if "id" in query_params:
                return query_params["id"][0]

        return None
