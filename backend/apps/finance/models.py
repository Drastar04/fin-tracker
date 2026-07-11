"""
Finance app models — Account, Category, Month, Transaction, Budget.
"""
import uuid
from decimal import Decimal
from django.db import models
from django.conf import settings
from django.utils import timezone


class Account(models.Model):
    """User's financial accounts (checking, savings, cash, etc.)."""
    ACCOUNT_TYPES = [
        ('checking', 'Checking'),
        ('savings', 'Savings'),
        ('cash', 'Cash'),
        ('credit', 'Credit Card'),
        ('investment', 'Investment'),
        ('other', 'Other'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='accounts')
    name = models.CharField(max_length=100)
    account_type = models.CharField(max_length=20, choices=ACCOUNT_TYPES, default='checking')
    balance = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    currency = models.CharField(max_length=3, default='USD')
    color = models.CharField(max_length=7, default='#6366F1')  # hex color
    icon = models.CharField(max_length=50, default='wallet')
    is_active = models.BooleanField(default=True)
    is_default = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-is_default', 'name']
        unique_together = ['user', 'name']

    def __str__(self):
        return f"{self.user.email} — {self.name}"


class Category(models.Model):
    """Transaction categories — can be user-created or system defaults."""
    CATEGORY_TYPES = [
        ('income', 'Income'),
        ('expense', 'Expense'),
        ('transfer', 'Transfer'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='categories',
        null=True, blank=True  # null = system category
    )
    name = models.CharField(max_length=100)
    category_type = models.CharField(max_length=10, choices=CATEGORY_TYPES, default='expense')
    icon = models.CharField(max_length=50, default='tag')
    color = models.CharField(max_length=7, default='#6366F1')
    is_system = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['category_type', 'name']
        verbose_name_plural = 'Categories'

    def __str__(self):
        return f"{self.name} ({self.category_type})"


class Month(models.Model):
    """Monthly financial period tracking."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='months')
    year = models.IntegerField()
    month = models.IntegerField()  # 1-12
    opening_balance = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    closing_balance = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    total_income = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    total_expenses = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    total_savings = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    is_current = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-year', '-month']
        unique_together = ['user', 'year', 'month']

    def __str__(self):
        return f"{self.user.email} — {self.year}/{self.month:02d}"

    def recalculate(self):
        """Recalculate month totals from transactions in the user's base currency."""
        from apps.core.utils import convert_currency
        
        # Get base currency
        profile = getattr(self.user, 'profile', None)
        base_curr = getattr(profile, 'base_currency', 'USD') if profile else 'USD'
        
        income = Decimal('0.00')
        expenses = Decimal('0.00')
        
        # Sum transactions, converting each to base_currency dynamically
        for tx in self.transactions.select_related('account').all():
            tx_curr = tx.account.currency if (tx.account and tx.account.currency) else base_curr
            converted_amount = convert_currency(tx.amount, tx_curr, base_curr)
            
            if tx.transaction_type == 'income':
                income += converted_amount
            elif tx.transaction_type == 'expense':
                expenses += converted_amount
                
        self.total_income = income
        self.total_expenses = expenses
        self.closing_balance = self.opening_balance + income - expenses
        self.total_savings = max(self.closing_balance - self.opening_balance, Decimal('0.00'))
        self.save(update_fields=['total_income', 'total_expenses', 'closing_balance', 'total_savings', 'updated_at'])


class Transaction(models.Model):
    """Core transaction record."""
    TRANSACTION_TYPES = [
        ('income', 'Income'),
        ('expense', 'Expense'),
        ('transfer', 'Transfer'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='transactions')
    month = models.ForeignKey(Month, on_delete=models.CASCADE, related_name='transactions', null=True, blank=True)
    account = models.ForeignKey(Account, on_delete=models.SET_NULL, null=True, blank=True, related_name='transactions')
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True, related_name='transactions')
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    transaction_type = models.CharField(max_length=10, choices=TRANSACTION_TYPES, default='expense')
    description = models.CharField(max_length=255)
    note = models.TextField(blank=True, default='')
    date = models.DateField(default=timezone.now)
    receipt_url = models.CharField(max_length=500, blank=True, default='')  # URL to receipt image
    # Transfer-specific
    transfer_to_account = models.ForeignKey(
        Account, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='incoming_transfers'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-date', '-created_at']

    def __str__(self):
        return f"{self.transaction_type.title()}: {self.amount} — {self.description}"

    def save(self, *args, **kwargs):
        # Auto-assign month
        if not self.month_id:
            month, _ = Month.objects.get_or_create(
                user=self.user,
                year=self.date.year,
                month=self.date.month,
                defaults={'opening_balance': Decimal('0')}
            )
            self.month = month
        super().save(*args, **kwargs)
        # Trigger month recalculation
        if self.month:
            self.month.recalculate()

    def delete(self, *args, **kwargs):
        month = self.month
        super().delete(*args, **kwargs)
        if month:
            month.recalculate()


class Budget(models.Model):
    """Monthly budget per category."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='budgets')
    month = models.ForeignKey(Month, on_delete=models.CASCADE, related_name='budgets', null=True, blank=True)
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='budgets')
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    spent = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    year = models.IntegerField()
    month_number = models.IntegerField()  # 1-12
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-year', '-month_number', 'category__name']
        unique_together = ['user', 'category', 'year', 'month_number']

    def __str__(self):
        return f"Budget: {self.category.name} {self.year}/{self.month_number:02d}"

    @property
    def remaining(self):
        return max(self.amount - self.spent, Decimal('0'))

    @property
    def percentage_used(self):
        if self.amount == 0:
            return 0
        return min(round(float(self.spent / self.amount) * 100, 1), 100)

    def recalculate_spent(self):
        from django.db.models import Sum
        spent = Transaction.objects.filter(
            user=self.user,
            category=self.category,
            transaction_type='expense',
            date__year=self.year,
            date__month=self.month_number,
        ).aggregate(total=Sum('amount'))['total'] or Decimal('0')
        self.spent = spent
        self.save(update_fields=['spent', 'updated_at'])
