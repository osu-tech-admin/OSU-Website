from ninja import Schema
from pydantic import field_validator, model_validator


class TeamSchema(Schema):
    """Schema for team data"""

    id: int
    name: str
    slug: str
    instagram_url: str | None = None
    logo: str | None = None
    owners: list[int] = []


class TeamCreateSchema(Schema):
    """Schema for creating a team"""

    name: str
    instagram_url: str | None = None
    owners: list[int] = []

    @classmethod
    @field_validator("name")
    def name_must_not_be_empty(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Name must not be empty")
        return v.strip()


class TeamUpdateSchema(Schema):
    """Schema for updating a team"""

    name: str | None = None
    instagram_url: str | None = None
    owners: list[int] | None = None

    @model_validator(mode="after")
    def check_at_least_one_field(self) -> "TeamUpdateSchema":
        if all(v is None for v in [self.name, self.instagram_url, self.owners]):
            raise ValueError("At least one field must be provided for update")
        if self.name is not None and not self.name.strip():
            raise ValueError("Name must not be empty")
        return self


class TeamListSchema(Schema):
    """Schema for listing teams"""

    id: int
    name: str
    slug: str


class SuccessSchema(Schema):
    """Schema for success response"""

    success: bool
    message: str


class ErrorSchema(Schema):
    """Schema for error response"""

    success: bool = False
    message: str
    details: str | None = None
