"""
Finance app serializers.
"""
from decimal import Decimal
from rest_framework import serializers
from apps.core.utils import convert_currency
from .models import Account, Category, Month, Transaction, Budget


class AccountSerializer(serializers.ModelSerializer):
    class Meta:
        model = Account
        fields = [
            'id', 'name', 'account_type', 'balance', 'currency',
            'color', 'icon', 'is_active', 'is_default', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        request = self.context.get('request')
        if request and hasattr(request, 'user') and request.user.is_authenticated:
            profile = request.user.profile
            view_curr = profile.currency
            ret['balance'] = str(convert_currency(instance.balance, instance.currency, view_curr))
            ret['currency'] = view_curr
        return ret


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = [
            'id', 'name', 'category_type', 'icon', 'color',
            'is_system', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'is_system', 'created_at', 'updated_at']

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class MonthSerializer(serializers.ModelSerializer):
    month_name = serializers.SerializerMethodField()

    class Meta:
        model = Month
        fields = [
            'id', 'year', 'month', 'month_name', 'opening_balance',
            'closing_balance', 'total_income', 'total_expenses',
            'total_savings', 'is_current', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'total_income', 'total_expenses', 'closing_balance', 'total_savings']

    def get_month_name(self, obj):
        import calendar
        return f"{calendar.month_name[obj.month]} {obj.year}"

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        request = self.context.get('request')
        if request and hasattr(request, 'user') and request.user.is_authenticated:
            profile = request.user.profile
            view_curr = profile.currency
            base_curr = getattr(profile, 'base_currency', 'USD')
            ret['opening_balance'] = str(convert_currency(instance.opening_balance, base_curr, view_curr))
            ret['closing_balance'] = str(convert_currency(instance.closing_balance, base_curr, view_curr))
            ret['total_income'] = str(convert_currency(instance.total_income, base_curr, view_curr))
            ret['total_expenses'] = str(convert_currency(instance.total_expenses, base_curr, view_curr))
            ret['total_savings'] = str(convert_currency(instance.total_savings, base_curr, view_curr))
        return ret


class TransactionListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for list views."""
    category_name = serializers.CharField(source='category.name', read_only=True)
    category_color = serializers.CharField(source='category.color', read_only=True)
    category_icon = serializers.CharField(source='category.icon', read_only=True)
    account_name = serializers.CharField(source='account.name', read_only=True)

    class Meta:
        model = Transaction
        fields = [
            'id', 'amount', 'transaction_type', 'description', 'date',
            'category', 'category_name', 'category_color', 'category_icon',
            'account', 'account_name', 'note', 'created_at',
        ]
        read_only_fields = ['id', 'created_at']

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        request = self.context.get('request')
        if request and hasattr(request, 'user') and request.user.is_authenticated:
            profile = request.user.profile
            view_curr = profile.currency
            tx_curr = instance.account.currency if instance.account else getattr(profile, 'base_currency', 'USD')
            ret['amount'] = str(convert_currency(instance.amount, tx_curr, view_curr))
        return ret


class TransactionDetailSerializer(serializers.ModelSerializer):
    """Full serializer for create/detail views."""
    category_name = serializers.CharField(source='category.name', read_only=True)
    category_color = serializers.CharField(source='category.color', read_only=True)
    category_icon = serializers.CharField(source='category.icon', read_only=True)
    account_name = serializers.CharField(source='account.name', read_only=True)

    class Meta:
        model = Transaction
        fields = [
            'id', 'amount', 'transaction_type', 'description', 'date',
            'category', 'category_name', 'category_color', 'category_icon',
            'account', 'account_name', 'note', 'receipt_url',
            'transfer_to_account', 'month', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'month', 'created_at', 'updated_at']

    def validate_amount(self, value):
        if value <= Decimal('0'):
            raise serializers.ValidationError("Amount must be greater than zero.")
        return value

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)

    def update(self, instance, validated_data):
        # Clear month so it gets re-assigned based on new date
        instance.month = None
        return super().update(instance, validated_data)

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        request = self.context.get('request')
        if request and hasattr(request, 'user') and request.user.is_authenticated:
            profile = request.user.profile
            view_curr = profile.currency
            tx_curr = instance.account.currency if instance.account else getattr(profile, 'base_currency', 'USD')
            ret['amount'] = str(convert_currency(instance.amount, tx_curr, view_curr))
        return ret


class BudgetSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    category_color = serializers.CharField(source='category.color', read_only=True)
    category_icon = serializers.CharField(source='category.icon', read_only=True)
    remaining = serializers.ReadOnlyField()
    percentage_used = serializers.ReadOnlyField()

    class Meta:
        model = Budget
        fields = [
            'id', 'category', 'category_name', 'category_color', 'category_icon',
            'amount', 'spent', 'remaining', 'percentage_used',
            'year', 'month_number', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'spent', 'created_at', 'updated_at']

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        budget = super().create(validated_data)
        budget.recalculate_spent()
        return budget

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        request = self.context.get('request')
        if request and hasattr(request, 'user') and request.user.is_authenticated:
            profile = request.user.profile
            view_curr = profile.currency
            base_curr = getattr(profile, 'base_currency', 'USD')
            
            # Convert amount and spent
            conv_amount = convert_currency(instance.amount, base_curr, view_curr)
            conv_spent = convert_currency(instance.spent, base_curr, view_curr)
            
            ret['amount'] = str(conv_amount)
            ret['spent'] = str(conv_spent)
            ret['remaining'] = str(max(conv_amount - conv_spent, Decimal('0')))
            if conv_amount == Decimal('0.00'):
                ret['percentage_used'] = 0.0
            else:
                ret['percentage_used'] = min(round(float(conv_spent / conv_amount) * 100, 1), 100.0)
        return ret
