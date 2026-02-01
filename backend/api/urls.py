"""
URL configuration for the API.
"""
from django.urls import path, include
from django.views.decorators.csrf import ensure_csrf_cookie
from django.http import JsonResponse
from rest_framework.routers import DefaultRouter
from . import views


@ensure_csrf_cookie
def get_csrf_token(request):
    """Endpoint to get CSRF token set in cookie."""
    return JsonResponse({'detail': 'CSRF cookie set'})


router = DefaultRouter()
router.register(r'posts', views.PostViewSet, basename='post')
router.register(r'comments', views.CommentViewSet, basename='comment')

urlpatterns = [
    path('', include(router.urls)),
    
    # CSRF token endpoint
    path('csrf/', get_csrf_token, name='csrf'),
    
    # Auth endpoints
    path('auth/register/', views.RegisterView.as_view(), name='register'),
    path('auth/login/', views.LoginView.as_view(), name='login'),
    path('auth/logout/', views.LogoutView.as_view(), name='logout'),
    path('auth/me/', views.CurrentUserView.as_view(), name='current-user'),
    
    # Leaderboard
    path('leaderboard/', views.leaderboard, name='leaderboard'),
]
