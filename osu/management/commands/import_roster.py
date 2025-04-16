import csv
import logging
import os
from typing import Any

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from osu.player.models import Player
from osu.team.models import Team
from osu.tournament.models import Registration, Tournament

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = "Import MUL Season 5 roster from CSV and create tournament registrations"

    def handle(self, *args: Any, **options: Any) -> None:
        # Get the path to the CSV file in the data directory
        current_dir = os.path.dirname(os.path.abspath(__file__))
        data_dir = os.path.join(os.path.dirname(current_dir), "data")
        csv_file_path = os.path.join(data_dir, "mul_s5_roster.csv")

        self.stdout.write(f"Using roster file: {csv_file_path}")

        # Team name mapping from short forms to full names
        team_mapping: dict[str, str] = {
            "AB": "Afterburners",
            "BR": "Bombay Rhinos",
            "DD": "Dancing Dragons",
            "RF": "Reborn Fire",
            "DH": "Desi Hawks",
            "BB": "Bombai Bantais",
            # Add more team mappings as needed
        }

        # First, ensure the tournament exists
        tournament_name = "Mumbai Ultimate League S5"
        try:
            tournament = Tournament.objects.get(name=tournament_name)
            self.stdout.write(self.style.SUCCESS(f"Found tournament: {tournament_name}"))
        except Tournament.DoesNotExist as err:
            error_msg = (
                f"Tournament '{tournament_name}' not found. Please create the tournament first."
            )
            self.stdout.write(self.style.ERROR(error_msg))
            raise CommandError(error_msg) from err

        # Now process the CSV file
        try:
            with open(csv_file_path) as file:
                reader = csv.DictReader(file)

                # Counter for stats
                registrations_created = 0
                players_not_found = 0
                teams_not_found = 0

                with transaction.atomic():
                    for row in reader:
                        # Extract data from CSV row based on the actual CSV structure
                        player_email = (
                            row.get("Email", "").strip().lower()
                        )  # Field name in the CSV is 'Email'
                        team_code = row.get("Team", "").strip()  # Field name in the CSV is 'Team'

                        # Use base price and sold price data if needed
                        base_price = row.get("Base Price", "")
                        sold_price = row.get("Sold Price", "")

                        # Skip if essential data is missing
                        if not team_code or not player_email:
                            self.stdout.write(
                                self.style.WARNING(f"Skipping row with missing data: {row}")
                            )
                            continue

                        # Get full team name from mapping
                        team_name = team_mapping.get(team_code)
                        if not team_name:
                            self.stdout.write(self.style.WARNING(f"Unknown team code: {team_code}"))
                            teams_not_found += 1
                            continue

                        # Find team
                        try:
                            team = Team.objects.get(name__iexact=team_name)
                        except Team.DoesNotExist:
                            self.stdout.write(self.style.WARNING(f"Team not found: {team_name}"))
                            teams_not_found += 1
                            continue

                        # Find player by email
                        player: Player | None = None
                        player_qs = Player.objects.filter(user__email__iexact=player_email)

                        if player_qs.exists():
                            player = player_qs.first()
                            # Fix potential None value - only access user if player is not None
                            if player is not None:
                                player_name = player.user.get_full_name()
                            else:
                                # This shouldn't happen given the exists check, but adding for type safety
                                self.stdout.write(
                                    self.style.WARNING(
                                        f"Player query exists but returned None for email: {player_email}"
                                    )
                                )
                                players_not_found += 1
                                continue
                        else:
                            self.stdout.write(
                                self.style.WARNING(f"Player not found with email: {player_email}")
                            )
                            players_not_found += 1
                            continue

                        # Create or update registration - only proceed if player is not None
                        if player is not None:
                            registration, created = Registration.objects.update_or_create(
                                tournament=tournament,
                                player=player,
                                defaults={
                                    "team": team,
                                    "role": Registration.Role.DEFAULT,
                                    "base_price": base_price,
                                    "sold_price": sold_price,
                                },
                            )

                            if created:
                                registrations_created += 1
                                self.stdout.write(
                                    f"Created registration for {player_name} with {team.name}"
                                )
                            else:
                                self.stdout.write(
                                    f"Updated registration for {player_name} with {team.name}"
                                )

                # Print summary
                self.stdout.write(self.style.SUCCESS("Import completed:"))
                self.stdout.write(f"- Registrations created: {registrations_created}")
                self.stdout.write(f"- Players not found: {players_not_found}")
                self.stdout.write(f"- Teams not found: {teams_not_found}")

        except FileNotFoundError as err:
            raise CommandError(f"CSV file not found: {csv_file_path}") from err
        except Exception as err:
            logger.exception("Error importing MUL S5 roster")
            raise CommandError(f"Error importing roster: {err!s}") from err
