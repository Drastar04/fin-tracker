"""
Default categories and accounts created during onboarding.
"""
from .models import Category

DEFAULT_CATEGORIES = [
    # Expense categories
    {'name': 'Food & Dining', 'category_type': 'expense', 'icon': 'utensils', 'color': '#F97316'},
    {'name': 'Transport', 'category_type': 'expense', 'icon': 'car', 'color': '#3B82F6'},
    {'name': 'Shopping', 'category_type': 'expense', 'icon': 'shopping-bag', 'color': '#EC4899'},
    {'name': 'Entertainment', 'category_type': 'expense', 'icon': 'tv', 'color': '#8B5CF6'},
    {'name': 'Health & Fitness', 'category_type': 'expense', 'icon': 'heart-pulse', 'color': '#EF4444'},
    {'name': 'Housing', 'category_type': 'expense', 'icon': 'home', 'color': '#06B6D4'},
    {'name': 'Utilities', 'category_type': 'expense', 'icon': 'zap', 'color': '#EAB308'},
    {'name': 'Education', 'category_type': 'expense', 'icon': 'graduation-cap', 'color': '#6366F1'},
    {'name': 'Personal Care', 'category_type': 'expense', 'icon': 'sparkles', 'color': '#F472B6'},
    {'name': 'Travel', 'category_type': 'expense', 'icon': 'plane', 'color': '#14B8A6'},
    {'name': 'Subscriptions', 'category_type': 'expense', 'icon': 'repeat', 'color': '#A78BFA'},
    {'name': 'Other Expense', 'category_type': 'expense', 'icon': 'more-horizontal', 'color': '#6B7280'},
    # Income categories
    {'name': 'Salary', 'category_type': 'income', 'icon': 'briefcase', 'color': '#10B981'},
    {'name': 'Freelance', 'category_type': 'income', 'icon': 'laptop', 'color': '#059669'},
    {'name': 'Business', 'category_type': 'income', 'icon': 'building', 'color': '#34D399'},
    {'name': 'Investment', 'category_type': 'income', 'icon': 'trending-up', 'color': '#6EE7B7'},
    {'name': 'Gift', 'category_type': 'income', 'icon': 'gift', 'color': '#A7F3D0'},
    {'name': 'Other Income', 'category_type': 'income', 'icon': 'plus-circle', 'color': '#4ADE80'},
    # Transfer
    {'name': 'Transfer', 'category_type': 'transfer', 'icon': 'arrow-right-left', 'color': '#94A3B8'},
]


def create_default_categories(user):
    """Create default categories for a new user."""
    for cat_data in DEFAULT_CATEGORIES:
        Category.objects.get_or_create(
            user=user,
            name=cat_data['name'],
            category_type=cat_data['category_type'],
            defaults={
                'icon': cat_data['icon'],
                'color': cat_data['color'],
                'is_system': False,
            }
        )
