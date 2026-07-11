"""
Finance app ViewSets.
"""
from django.utils import timezone
from django_filters import rest_framework as filters
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.core.pagination import StandardResultsPagination
from .models import Account, Category, Month, Transaction, Budget
from .serializers import (
    AccountSerializer, CategorySerializer, MonthSerializer,
    TransactionListSerializer, TransactionDetailSerializer, BudgetSerializer
)


class AccountViewSet(viewsets.ModelViewSet):
    """CRUD for user's financial accounts."""
    serializer_class = AccountSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Account.objects.filter(user=self.request.user, is_active=True)

    @action(detail=True, methods=['post'])
    def set_default(self, request, pk=None):
        account = self.get_object()
        Account.objects.filter(user=request.user).update(is_default=False)
        account.is_default = True
        account.save()
        return Response(AccountSerializer(account).data)


class CategoryViewSet(viewsets.ModelViewSet):
    """CRUD for user's transaction categories."""
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['category_type']
    search_fields = ['name']

    def get_queryset(self):
        return Category.objects.filter(user=self.request.user)

    def destroy(self, request, *args, **kwargs):
        category = self.get_object()
        if category.transactions.exists():
            return Response(
                {'detail': 'Cannot delete a category that has transactions.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        return super().destroy(request, *args, **kwargs)


class TransactionFilter(filters.FilterSet):
    date_from = filters.DateFilter(field_name='date', lookup_expr='gte')
    date_to = filters.DateFilter(field_name='date', lookup_expr='lte')
    amount_min = filters.NumberFilter(field_name='amount', lookup_expr='gte')
    amount_max = filters.NumberFilter(field_name='amount', lookup_expr='lte')

    class Meta:
        model = Transaction
        fields = ['transaction_type', 'category', 'account', 'date_from', 'date_to', 'amount_min', 'amount_max']


class TransactionViewSet(viewsets.ModelViewSet):
    """Full CRUD for transactions with search, filter, sort."""
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = StandardResultsPagination
    filterset_class = TransactionFilter
    search_fields = ['description', 'note', 'category__name', 'account__name']
    ordering_fields = ['date', 'amount', 'created_at']
    ordering = ['-date', '-created_at']

    def get_queryset(self):
        return Transaction.objects.filter(
            user=self.request.user
        ).select_related('category', 'account', 'month')

    def get_serializer_class(self):
        if self.action == 'list':
            return TransactionListSerializer
        return TransactionDetailSerializer

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        self.perform_destroy(instance)
        return Response({'detail': 'Transaction deleted.'}, status=status.HTTP_200_OK)


class MonthViewSet(viewsets.ReadOnlyModelViewSet):
    """Read-only access to monthly summaries."""
    serializer_class = MonthSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Month.objects.filter(user=self.request.user)

    @action(detail=False, methods=['get'])
    def current(self, request):
        now = timezone.now()
        month, created = Month.objects.get_or_create(
            user=request.user,
            year=now.year,
            month=now.month,
            defaults={
                'is_current': True,
                'opening_balance': request.user.profile.default_monthly_opening_balance,
            }
        )
        if created:
            # Carry over previous month's closing balance
            prev = Month.objects.filter(
                user=request.user,
                year=now.year if now.month > 1 else now.year - 1,
                month=now.month - 1 if now.month > 1 else 12,
            ).first()
            if prev:
                month.opening_balance = prev.closing_balance
                month.save()

        return Response(MonthSerializer(month).data)


class BudgetViewSet(viewsets.ModelViewSet):
    """CRUD for monthly budgets per category."""
    serializer_class = BudgetSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['year', 'month_number', 'category']

    def get_queryset(self):
        return Budget.objects.filter(
            user=self.request.user
        ).select_related('category')

    @action(detail=False, methods=['get'])
    def current(self, request):
        """Get current month's budgets."""
        now = timezone.now()
        budgets = Budget.objects.filter(
            user=request.user,
            year=now.year,
            month_number=now.month,
        ).select_related('category')

        # Recalculate all
        for budget in budgets:
            budget.recalculate_spent()

        serializer = BudgetSerializer(budgets, many=True, context={'request': request})
        return Response(serializer.data)
