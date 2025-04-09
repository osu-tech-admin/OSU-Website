from django.template.defaultfilters import slugify


def slugify_max(text: str, max_length: int = 50) -> str:
    slug = slugify(text)
    if len(slug) <= max_length:
        return str(slug)
    trimmed_slug = slug[:max_length].rsplit("-", 1)[0]
    if len(trimmed_slug) <= max_length:
        return trimmed_slug
    # First word is > max_length chars, so we have to break it
    return slug[:max_length]
