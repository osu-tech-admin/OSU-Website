import json
from pathlib import Path

from django import template
from django.conf import settings
from django.utils.safestring import mark_safe

register = template.Library()


@register.simple_tag
@mark_safe
def static_include(filename: str) -> str:
    file_path = settings.STATIC_ROOT.joinpath(filename + "")
    if file_path.exists():
        with open(file_path) as f:
            return f.read()

    manifest_path = settings.STATIC_ROOT.joinpath("manifest.json")
    if manifest_path.exists():
        with manifest_path.open() as f:
            data = json.load(f)
        hashed_name = data.get(filename)["src"]
        if hashed_name:
            hashed_name = Path(hashed_name).name
            hashed_path = settings.STATIC_ROOT / hashed_name
            if hashed_path.exists():
                with open(hashed_path) as f:
                    return f.read()
    return f"Couldn't find static file content for '{filename}'"
