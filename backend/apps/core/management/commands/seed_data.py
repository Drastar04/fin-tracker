"""
Management command to seed sample development data.
"""
import random
from decimal import Decimal
from datetime import date, timedelta
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from apps.accounts.models import UserProfile
from apps.finance.models import Account, Category, Month, Transaction, Budget
from apps.finance.defaults import create_default_categories

User = get_user_model()

DESCRIPTIONS = {
    'Food & Dining': ['Lunch at Subway', 'Grocery run', 'Coffee at Starbucks', 'Pizza night', 'Dinner with friends'],
    'Transport': ['Uber ride', 'Gas station', 'Monthly bus pass', 'Parking fee', 'Lyft to airport'],
    'Shopping': ['Amazon order', 'New shoes', 'H&M clothes', 'Books from library', 'Electronics'],
    'Entertainment': ['Netflix subscription', 'Movie tickets', 'Spotify', 'Concert tickets', 'Gaming'],
    'Housing': ['Monthly rent', 'Electricity bill', 'Internet bill', 'Home repairs'],
    'Health & Fitness': ['Gym membership', 'Doctor visit', 'Pharmacy', 'Vitamins'],
    'Salary': ['Monthly salary', 'Bi-weekly paycheck', 'Direct deposit'],
    'Freelance': ['Client payment', 'Design project', 'Consulting fee'],
}


class Command(BaseCommand):
    help = 'Seed development data'

    def handle(self, *args, **options):
        self.stdout.write('Seeding data...')

        # Create demo user
        user, created = User.objects.get_or_create(
            email='demo@financeos.app',
            defaults={
                'full_name': 'Demo User',
                'username': 'demo@financeos.app',
            }
        )
        if created:
            user.set_password('Demo1234!')
            user.save()
            self.stdout.write(f'  Created user: demo@financeos.app / Demo1234!')

        # Profile
        profile, _ = UserProfile.objects.get_or_create(user=user)
        profile.currency = 'USD'
        profile.country = 'United States'
        profile.timezone = 'America/New_York'
        profile.default_monthly_opening_balance = Decimal('5000')
        profile.onboarding_completed = True
        profile.save()

        # Account
        account, _ = Account.objects.get_or_create(
            user=user, name='Main Account',
            defaults={
                'account_type': 'checking',
                'is_default': True,
                'balance': Decimal('5000'),
                'currency': 'USD',
                'color': '#6366F1',
            }
        )

        # Categories
        create_default_categories(user)
        categories = {c.name: c for c in Category.objects.filter(user=user)}

        # Generate 3 months of transactions
        today = date.today()
        for months_back in range(3):
            year = today.year
            month = today.month - months_back
            if month <= 0:
                month += 12
                year -= 1

            opening = Decimal('5000') if months_back == 2 else None

            month_obj, _ = Month.objects.get_or_create(
                user=user, year=year, month=month,
                defaults={'opening_balance': opening or Decimal('5000')}
            )

            # Add salary
            salary_cat = categories.get('Salary')
            if salary_cat:
                Transaction.objects.get_or_create(
                    user=user, month=month_obj,
                    description='Monthly salary',
                    date=date(year, month, 1),
                    defaults={
                        'amount': Decimal('6500'),
                        'transaction_type': 'income',
                        'category': salary_cat,
                        'account': account,
                    }
                )

            # Add expenses
            expense_cats = [
                ('Food & Dining', 150, 600),
                ('Transport', 50, 200),
                ('Shopping', 80, 400),
                ('Entertainment', 40, 150),
                ('Housing', 1500, 1800),
                ('Health & Fitness', 30, 120),
            ]

            for cat_name, min_amt, max_amt in expense_cats:
                cat = categories.get(cat_name)
                if not cat:
                    continue
                # 3-8 transactions per category per month
                for _ in range(random.randint(3, 8)):
                    day = random.randint(1, 28)
                    tx_date = date(year, month, day)
                    desc = random.choice(DESCRIPTIONS.get(cat_name, ['Expense']))
                    amt = Decimal(str(round(random.uniform(min_amt / 6, max_amt / 3), 2)))
                    Transaction.objects.create(
                        user=user, month=month_obj,
                        amount=amt,
                        transaction_type='expense',
                        category=cat,
                        account=account,
                        description=desc,
                        date=tx_date,
                    )

            month_obj.recalculate()

            # Carry over
            if months_back > 0:
                prev_month = month + 1 if month < 12 else 1
                prev_year = year if month < 12 else year + 1
                next_month = Month.objects.filter(user=user, year=prev_year, month=prev_month).first()
                if next_month:
                    next_month.opening_balance = month_obj.closing_balance
                    next_month.recalculate()

        # Budgets for current month
        budget_cats = [
            ('Food & Dining', 500),
            ('Transport', 200),
            ('Shopping', 300),
            ('Entertainment', 150),
            ('Housing', 1800),
            ('Health & Fitness', 100),
        ]
        for cat_name, budget_amt in budget_cats:
            cat = categories.get(cat_name)
            if cat:
                b, _ = Budget.objects.get_or_create(
                    user=user, category=cat,
                    year=today.year, month_number=today.month,
                    defaults={'amount': Decimal(str(budget_amt))}
                )
                b.recalculate_spent()

        self.stdout.write(self.style.SUCCESS('Seed data created successfully!'))
        self.stdout.write('  Login: demo@financeos.app / Demo1234!')
