"""
Accounts app — Custom User model, UserProfile, authentication.
"""
import uuid
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils.translation import gettext_lazy as _


class User(AbstractUser):
    """Custom User model with UUID primary key."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(_('email address'), unique=True)
    full_name = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username', 'full_name']

    class Meta:
        verbose_name = _('user')
        verbose_name_plural = _('users')
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.full_name} <{self.email}>"

    def save(self, *args, **kwargs):
        if not self.username:
            self.username = self.email
        super().save(*args, **kwargs)


class UserProfile(models.Model):
    """Extended user profile with financial preferences."""
    CURRENCY_CHOICES = [
        ('USD', 'US Dollar'),
        ('EUR', 'Euro'),
        ('GBP', 'British Pound'),
        ('NGN', 'Nigerian Naira'),
        ('CAD', 'Canadian Dollar'),
        ('AUD', 'Australian Dollar'),
        ('JPY', 'Japanese Yen'),
        ('INR', 'Indian Rupee'),
        ('GHS', 'Ghanaian Cedi'),
        ('ZAR', 'South African Rand'),
        ('KES', 'Kenyan Shilling'),
        ('EGP', 'Egyptian Pound'),
        ('MAD', 'Moroccan Dirham'),
        ('AED', 'UAE Dirham'),
        ('CHF', 'Swiss Franc'),
        ('CNY', 'Chinese Yuan'),
        ('SGD', 'Singapore Dollar'),
        ('BRL', 'Brazilian Real'),
        ('MXN', 'Mexican Peso'),
    ]

    THEME_CHOICES = [
        ('light', 'Light'),
        ('dark', 'Dark'),
        ('system', 'System'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    currency = models.CharField(max_length=3, choices=CURRENCY_CHOICES, default='USD')
    base_currency = models.CharField(max_length=3, choices=CURRENCY_CHOICES, default='USD')
    currency_symbol = models.CharField(max_length=5, default='$')
    country = models.CharField(max_length=100, default='')
    timezone = models.CharField(max_length=100, default='UTC')
    default_monthly_opening_balance = models.DecimalField(
        max_digits=12, decimal_places=2, default=0.00
    )
    theme = models.CharField(max_length=10, choices=THEME_CHOICES, default='system')
    onboarding_completed = models.BooleanField(default=False)
    avatar_url = models.CharField(max_length=500, blank=True, default='')  # URL or path to avatar
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'User Profile'
        verbose_name_plural = 'User Profiles'

    def __str__(self):
        return f"Profile: {self.user.full_name}"

    CURRENCY_SYMBOLS = {
        'USD': '$', 'EUR': '€', 'GBP': '£', 'NGN': '₦', 'CAD': 'CA$',
        'AUD': 'A$', 'JPY': '¥', 'INR': '₹', 'GHS': 'GH₵', 'ZAR': 'R',
        'KES': 'KSh', 'EGP': 'E£', 'MAD': 'MAD', 'AED': 'د.إ', 'CHF': 'CHF',
        'CNY': '¥', 'SGD': 'S$', 'BRL': 'R$', 'MXN': 'MX$',
    }

    def save(self, *args, **kwargs):
        # Update symbol based on current viewing currency
        self.currency_symbol = self.CURRENCY_SYMBOLS.get(self.currency, self.currency)
        
        # Ensure base_currency defaults to the chosen currency if not set
        if not self.base_currency:
            self.base_currency = self.currency
            
        super().save(*args, **kwargs)

