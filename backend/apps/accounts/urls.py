"""Accounts app URLs."""
from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

urlpatterns = [
    path('register/', views.RegisterView.as_view(), name='auth-register'),
    path('login/', views.LoginView.as_view(), name='auth-login'),
    path('logout/', views.LogoutView.as_view(), name='auth-logout'),
    path('refresh/', TokenRefreshView.as_view(), name='auth-refresh'),
    path('me/', views.ProfileView.as_view(), name='auth-me'),
    path('profile/', views.UserProfileDetailView.as_view(), name='auth-profile'),
    path('onboarding/', views.OnboardingView.as_view(), name='auth-onboarding'),
    path('change-password/', views.ChangePasswordView.as_view(), name='auth-change-password'),
    path('delete-account/', views.DeleteAccountView.as_view(), name='auth-delete-account'),
]
