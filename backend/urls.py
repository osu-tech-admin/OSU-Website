"""
URL configuration for backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.http import HttpRequest, JsonResponse
from django.urls import include, path
from django.views.decorators.csrf import ensure_csrf_cookie


# Simple view to provide the CSRF token
@ensure_csrf_cookie
def csrf_token_view(request: HttpRequest) -> JsonResponse:
    return JsonResponse({"detail": "CSRF cookie set"})


urlpatterns = [
    path("", include("osu.urls")),
    path("admin/", admin.site.urls),
    path("api/csrf/", csrf_token_view, name="csrf_token"),
    *static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT),
]
