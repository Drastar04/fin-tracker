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
        self.currency_symbol = self.CURRENCY_SYMBOLS.get(self.currency, self.currency)
        
        # Check if currency has changed to convert existing data
        if self.pk:
            try:
                old_profile = UserProfile.objects.get(pk=self.pk)
                if old_profile.currency != self.currency:
                    from decimal import Decimal
                    import urllib.request
                    import json
                    
                    RATES = {
                        'USD': 1.0,
                        'EUR': 0.92,
                        'GBP': 0.78,
                        'NGN': 1500.0,
                        'CAD': 1.37,
                        'AUD': 1.50,
                        'JPY': 158.0,
                        'INR': 83.5,
                        'GHS': 15.0,
                        'ZAR': 18.0,
                        'KES': 129.0,
                        'EGP': 47.8,
                        'MAD': 10.0,
                        'AED': 3.67,
                        'CHF': 0.90,
                        'CNY': 7.25,
                        'SGD': 1.35,
                        'BRL': 5.40,
                        'MXN': 18.40,
                    }
                    
                    try:
                        with urllib.request.urlopen("https://open.er-api.com/v6/latest/USD", timeout=3) as response:
                            api_data = json.loads(response.read().decode())
                            api_rates = api_data.get("rates", {})
                            for code in RATES.keys():
                                if code in api_rates:
                                    RATES[code] = float(api_rates[code])
                    except Exception:
                        pass
                        
                    old_rate = RATES.get(old_profile.currency, 1.0)
                    new_rate = RATES.get(self.currency, 1.0)
                    factor = new_rate / old_rate
                    
                    def convert_val(val):
                        if val is None:
                            return Decimal('0.00')
                        max_val = Decimal('9999999999.99')
                        new_val = Decimal(str(round(float(val) * factor, 2)))
                        if new_val > max_val:
                            return max_val
                        if new_val < -max_val:
                            return -max_val
                        return new_val
                    
                    # Update profile opening balance
                    self.default_monthly_opening_balance = convert_val(self.default_monthly_opening_balance)
                    
                    # Update dependent models
                    from apps.finance.models import Account, Transaction, Budget, Month
                    
                    # 1. Update Accounts
                    for acc in Account.objects.filter(user=self.user):
                        acc.balance = convert_val(acc.balance)
                        acc.currency = self.currency
                        acc.save()
                        
                    # 2. Update Transactions
                    for tx in Transaction.objects.filter(user=self.user):
                        tx.amount = convert_val(tx.amount)
                        tx.save()
                        
                    # 3. Update Budgets
                    for b in Budget.objects.filter(user=self.user):
                        b.amount = convert_val(b.amount)
                        b.spent = convert_val(b.spent)
                        b.save()
                        
                    # 4. Update Months
                    for m in Month.objects.filter(user=self.user):
                        m.opening_balance = convert_val(m.opening_balance)
                        m.closing_balance = convert_val(m.closing_balance)
                        m.total_income = convert_val(m.total_income)
                        m.total_expenses = convert_val(m.total_expenses)
                        m.total_savings = convert_val(m.total_savings)
                        m.save()
            except UserProfile.DoesNotExist:
                pass
                
        super().save(*args, **kwargs)
