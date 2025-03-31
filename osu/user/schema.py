from ninja import ModelSchema, Schema

from .models import User


class UserSchema(ModelSchema):
    class Config:
        model = User
        model_fields = "__all__"


class Credentials(Schema):
    username: str
    password: str
