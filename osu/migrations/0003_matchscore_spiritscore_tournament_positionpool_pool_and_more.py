# Generated by Django 5.2 on 2025-04-10 22:31

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models

import osu.tournament.models


class Migration(migrations.Migration):
    dependencies = [
        ("osu", "0002_team_player"),
    ]

    operations = [
        migrations.CreateModel(
            name="MatchScore",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True, primary_key=True, serialize=False, verbose_name="ID"
                    ),
                ),
                ("score_team_1", models.PositiveIntegerField(default=0)),
                ("score_team_2", models.PositiveIntegerField(default=0)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "entered_by",
                    models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to="osu.player"),
                ),
            ],
        ),
        migrations.CreateModel(
            name="SpiritScore",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True, primary_key=True, serialize=False, verbose_name="ID"
                    ),
                ),
                ("rules", models.PositiveIntegerField()),
                ("fouls", models.PositiveIntegerField()),
                ("fair", models.PositiveIntegerField()),
                ("positive", models.PositiveIntegerField()),
                ("communication", models.PositiveIntegerField()),
                ("total", models.PositiveIntegerField(default=0)),
                ("comments", models.CharField(blank=True, max_length=500, null=True)),
                (
                    "msp",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="msp",
                        to="osu.player",
                    ),
                ),
                (
                    "mvp",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="mvp",
                        to="osu.player",
                    ),
                ),
            ],
        ),
        migrations.CreateModel(
            name="Tournament",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True, primary_key=True, serialize=False, verbose_name="ID"
                    ),
                ),
                ("name", models.CharField(max_length=100)),
                ("slug", models.SlugField(blank=True, max_length=100, null=True, unique=True)),
                ("description", models.TextField(blank=True, null=True)),
                ("location", models.CharField(max_length=100)),
                ("start_date", models.DateField()),
                ("end_date", models.DateField()),
                (
                    "banner",
                    models.FileField(
                        blank=True,
                        null=True,
                        upload_to=osu.tournament.models.upload_tournament_banners,
                    ),
                ),
                (
                    "status",
                    models.CharField(
                        choices=[
                            ("registration_open", "Registration Open"),
                            ("registration_closed", "Registration Closed"),
                            ("live", "Live"),
                            ("completed", "Completed"),
                        ],
                        default="registration_open",
                        max_length=20,
                    ),
                ),
                (
                    "type",
                    models.CharField(
                        choices=[("MXD", "Mixed"), ("OPN", "Opens"), ("WMN", "Womens")],
                        default="MXD",
                        max_length=3,
                    ),
                ),
                ("initial_seeding", models.JSONField(blank=True, default=dict)),
                ("current_seeding", models.JSONField(blank=True, default=dict)),
                ("spirit_ranking", models.JSONField(blank=True, default=list)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "teams",
                    models.ManyToManyField(blank=True, related_name="tournaments", to="osu.team"),
                ),
                (
                    "volunteers",
                    models.ManyToManyField(
                        blank=True, related_name="tournament_volunteer", to=settings.AUTH_USER_MODEL
                    ),
                ),
            ],
        ),
        migrations.CreateModel(
            name="PositionPool",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True, primary_key=True, serialize=False, verbose_name="ID"
                    ),
                ),
                ("sequence_number", models.PositiveIntegerField()),
                ("name", models.CharField(default="NA", max_length=2)),
                ("initial_seeding", models.JSONField()),
                ("results", models.JSONField()),
                (
                    "tournament",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE, to="osu.tournament"
                    ),
                ),
            ],
            options={
                "unique_together": {("name", "tournament")},
            },
        ),
        migrations.CreateModel(
            name="Pool",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True, primary_key=True, serialize=False, verbose_name="ID"
                    ),
                ),
                ("sequence_number", models.PositiveIntegerField()),
                ("name", models.CharField(default="NA", max_length=2)),
                ("initial_seeding", models.JSONField()),
                ("results", models.JSONField()),
                (
                    "tournament",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE, to="osu.tournament"
                    ),
                ),
            ],
            options={
                "unique_together": {("name", "tournament")},
            },
        ),
        migrations.CreateModel(
            name="CrossPool",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True, primary_key=True, serialize=False, verbose_name="ID"
                    ),
                ),
                ("initial_seeding", models.JSONField(default=dict)),
                ("current_seeding", models.JSONField(default=dict)),
                (
                    "tournament",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE, to="osu.tournament"
                    ),
                ),
            ],
        ),
        migrations.CreateModel(
            name="Bracket",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True, primary_key=True, serialize=False, verbose_name="ID"
                    ),
                ),
                ("sequence_number", models.PositiveIntegerField()),
                ("name", models.CharField(default="1-8", max_length=5)),
                ("initial_seeding", models.JSONField()),
                ("current_seeding", models.JSONField()),
                (
                    "tournament",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE, to="osu.tournament"
                    ),
                ),
            ],
            options={
                "unique_together": {("name", "tournament")},
            },
        ),
        migrations.CreateModel(
            name="TournamentField",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True, primary_key=True, serialize=False, verbose_name="ID"
                    ),
                ),
                ("name", models.CharField(max_length=25)),
                ("address", models.CharField(blank=True, max_length=25, null=True)),
                ("is_broadcasted", models.BooleanField(default=False)),
                ("location_url", models.URLField(blank=True, max_length=255, null=True)),
                (
                    "tournament",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE, to="osu.tournament"
                    ),
                ),
            ],
            options={
                "unique_together": {("tournament", "name")},
            },
        ),
        migrations.CreateModel(
            name="Registration",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True, primary_key=True, serialize=False, verbose_name="ID"
                    ),
                ),
                (
                    "role",
                    models.CharField(
                        choices=[
                            ("DFLT", "Default"),
                            ("CAP", "Captain"),
                            ("SCAP", "Spirit Captain"),
                            ("COACH", "Coach"),
                            ("OWNER", "Owner"),
                        ],
                        default="DFLT",
                        max_length=6,
                    ),
                ),
                (
                    "player",
                    models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to="osu.player"),
                ),
                (
                    "team",
                    models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to="osu.team"),
                ),
                (
                    "tournament",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE, to="osu.tournament"
                    ),
                ),
            ],
            options={
                "unique_together": {("tournament", "player")},
            },
        ),
        migrations.CreateModel(
            name="Match",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True, primary_key=True, serialize=False, verbose_name="ID"
                    ),
                ),
                ("name", models.CharField(max_length=100)),
                ("sequence_number", models.PositiveIntegerField()),
                ("placeholder_seed_1", models.PositiveIntegerField()),
                ("placeholder_seed_2", models.PositiveIntegerField()),
                ("score_team_1", models.IntegerField(default=0)),
                ("score_team_2", models.IntegerField(default=0)),
                ("time", models.DateTimeField(blank=True, null=True)),
                ("duration_mins", models.IntegerField(default=75)),
                ("video_url", models.URLField(blank=True, max_length=255, null=True)),
                (
                    "status",
                    models.CharField(
                        choices=[
                            ("draft", "Draft"),
                            ("scheduled", "Scheduled"),
                            ("completed", "Completed"),
                        ],
                        default="draft",
                        max_length=20,
                    ),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "bracket",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.CASCADE,
                        to="osu.bracket",
                    ),
                ),
                (
                    "cross_pool",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.CASCADE,
                        to="osu.crosspool",
                    ),
                ),
                (
                    "team_1",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="team_1_matches",
                        to="osu.team",
                    ),
                ),
                (
                    "team_2",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="team_2_matches",
                        to="osu.team",
                    ),
                ),
                (
                    "suggested_score_team_1",
                    models.OneToOneField(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="suggested_score_team_1",
                        to="osu.matchscore",
                    ),
                ),
                (
                    "suggested_score_team_2",
                    models.OneToOneField(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="suggested_score_team_2",
                        to="osu.matchscore",
                    ),
                ),
                (
                    "pool",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.CASCADE,
                        to="osu.pool",
                    ),
                ),
                (
                    "position_pool",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.CASCADE,
                        to="osu.positionpool",
                    ),
                ),
                (
                    "self_spirit_score_team_1",
                    models.OneToOneField(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="self_spirit_score_team_1",
                        to="osu.spiritscore",
                    ),
                ),
                (
                    "self_spirit_score_team_2",
                    models.OneToOneField(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="self_spirit_score_team_2",
                        to="osu.spiritscore",
                    ),
                ),
                (
                    "spirit_score_team_1",
                    models.OneToOneField(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="spirit_score_team_1",
                        to="osu.spiritscore",
                    ),
                ),
                (
                    "spirit_score_team_2",
                    models.OneToOneField(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="spirit_score_team_2",
                        to="osu.spiritscore",
                    ),
                ),
                (
                    "tournament",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="matches",
                        to="osu.tournament",
                    ),
                ),
                (
                    "field",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="matches",
                        to="osu.tournamentfield",
                    ),
                ),
            ],
            options={
                "unique_together": {("tournament", "time", "field")},
            },
        ),
    ]
