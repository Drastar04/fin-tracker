"""
Analytics app views — dashboard summary, charts, insights.
"""
from decimal import Decimal
from datetime import date, timedelta
from django.utils import timezone
from django.db.models import Sum, Count, Avg, Q
from django.db.models.functions import TruncDay, TruncMonth
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions

from apps.finance.models import Transaction, Month, Budget, Category


class DashboardView(APIView):
    """Aggregated dashboard stats for the current month."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        now = timezone.now()
        today = now.date()
        month_start = today.replace(day=1)

        # Current month
        month_qs = Month.objects.filter(user=user, year=now.year, month=now.month).first()
        opening_balance = month_qs.opening_balance if month_qs else Decimal('0')

        # Monthly transactions
        monthly_tx = Transaction.objects.filter(
            user=user,
            date__year=now.year,
            date__month=now.month,
        )

        income = monthly_tx.filter(transaction_type='income').aggregate(t=Sum('amount'))['t'] or Decimal('0')
        expenses = monthly_tx.filter(transaction_type='expense').aggregate(t=Sum('amount'))['t'] or Decimal('0')
        current_balance = opening_balance + income - expenses

        # Budgets
        budgets = Budget.objects.filter(user=user, year=now.year, month_number=now.month)
        total_budget = budgets.aggregate(t=Sum('amount'))['t'] or Decimal('0')
        total_spent_budgeted = budgets.aggregate(t=Sum('spent'))['t'] or Decimal('0')
        budget_remaining = max(total_budget - total_spent_budgeted, Decimal('0'))

        # Last week comparison
        last_week_start = today - timedelta(days=14)
        last_week_end = today - timedelta(days=7)
        this_week_start = today - timedelta(days=7)

        last_week_expenses = Transaction.objects.filter(
            user=user, transaction_type='expense',
            date__range=[last_week_start, last_week_end],
        ).aggregate(t=Sum('amount'))['t'] or Decimal('0')

        this_week_expenses = Transaction.objects.filter(
            user=user, transaction_type='expense',
            date__range=[this_week_start, today],
        ).aggregate(t=Sum('amount'))['t'] or Decimal('0')

        # Week change %
        if last_week_expenses > 0:
            week_change_pct = round(
                float((this_week_expenses - last_week_expenses) / last_week_expenses) * 100, 1
            )
        else:
            week_change_pct = 0

        # Recent transactions
        recent_tx = Transaction.objects.filter(user=user).select_related(
            'category', 'account'
        ).order_by('-date', '-created_at')[:5]

        from apps.finance.serializers import TransactionListSerializer
        recent_data = TransactionListSerializer(recent_tx, many=True).data

        # Top categories
        top_categories = monthly_tx.filter(
            transaction_type='expense'
        ).values(
            'category__name', 'category__color', 'category__icon'
        ).annotate(
            total=Sum('amount'), count=Count('id')
        ).order_by('-total')[:5]

        # Insights
        insights = self._build_insights(
            user, week_change_pct, income, expenses, top_categories, budgets
        )

        return Response({
            'current_balance': current_balance,
            'opening_balance': opening_balance,
            'total_income': income,
            'total_expenses': expenses,
            'total_savings': max(income - expenses, Decimal('0')),
            'total_budget': total_budget,
            'budget_remaining': budget_remaining,
            'week_change_pct': week_change_pct,
            'recent_transactions': recent_data,
            'top_categories': list(top_categories),
            'insights': insights,
            'month': {
                'year': now.year,
                'month': now.month,
                'label': now.strftime('%B %Y'),
            }
        })

    def _build_insights(self, user, week_change, income, expenses, top_cats, budgets):
        insights = []
        if week_change < -5:
            insights.append({
                'type': 'positive',
                'icon': 'trending-down',
                'text': f"You spent {abs(week_change):.0f}% less this week than last week."
            })
        elif week_change > 10:
            insights.append({
                'type': 'warning',
                'icon': 'trending-up',
                'text': f"You spent {week_change:.0f}% more this week than last week."
            })

        if top_cats:
            top = top_cats[0]
            if income > 0:
                pct = round(float(top['total'] / income) * 100)
                insights.append({
                    'type': 'info',
                    'icon': 'pie-chart',
                    'text': f"{top['category__name']} accounts for {pct}% of your spending."
                })

        on_budget = sum(1 for b in budgets if b.percentage_used <= 100)
        if on_budget == len(list(budgets)) and budgets.exists():
            insights.append({
                'type': 'positive',
                'icon': 'check-circle',
                'text': f"You're within budget on all {on_budget} categories this month."
            })

        return insights


class CashFlowChartView(APIView):
    """Daily income/expense for the last 30 days."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        today = timezone.now().date()
        start = today - timedelta(days=29)

        transactions = Transaction.objects.filter(
            user=user,
            date__range=[start, today],
            transaction_type__in=['income', 'expense'],
        ).annotate(day=TruncDay('date')).values('day', 'transaction_type').annotate(
            total=Sum('amount')
        ).order_by('day')

        # Build a map
        data_map = {}
        for tx in transactions:
            day_str = tx['day'].strftime('%Y-%m-%d')
            if day_str not in data_map:
                data_map[day_str] = {'date': day_str, 'income': 0, 'expense': 0}
            data_map[day_str][tx['transaction_type']] = float(tx['total'])

        # Fill every day
        result = []
        for i in range(30):
            day = (start + timedelta(days=i)).strftime('%Y-%m-%d')
            result.append(data_map.get(day, {'date': day, 'income': 0, 'expense': 0}))

        return Response({'data': result})


class ExpenseBreakdownView(APIView):
    """Expense breakdown by category for current month."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        now = timezone.now()
        year = int(request.query_params.get('year', now.year))
        month = int(request.query_params.get('month', now.month))

        categories = Transaction.objects.filter(
            user=user,
            transaction_type='expense',
            date__year=year,
            date__month=month,
        ).values(
            'category__id', 'category__name', 'category__color', 'category__icon'
        ).annotate(
            total=Sum('amount'), count=Count('id')
        ).order_by('-total')

        total = sum(c['total'] for c in categories) or Decimal('1')
        result = [
            {
                'category_id': str(c['category__id']) if c['category__id'] else None,
                'name': c['category__name'] or 'Uncategorized',
                'color': c['category__color'] or '#6B7280',
                'icon': c['category__icon'] or 'tag',
                'total': float(c['total']),
                'percentage': round(float(c['total'] / total) * 100, 1),
                'count': c['count'],
            }
            for c in categories
        ]
        return Response({'data': result, 'total': float(total)})


class MonthlyTrendView(APIView):
    """Income vs expense by month for the last 12 months."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        now = timezone.now()

        months = Month.objects.filter(
            user=user
        ).order_by('-year', '-month')[:12]

        data = [
            {
                'label': f"{m.year}/{m.month:02d}",
                'month_name': date(m.year, m.month, 1).strftime('%b %Y'),
                'income': float(m.total_income),
                'expenses': float(m.total_expenses),
                'savings': float(m.total_savings),
            }
            for m in reversed(list(months))
        ]
        return Response({'data': data})


class DailySpendingView(APIView):
    """Daily spending for current month."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        now = timezone.now()
        year = int(request.query_params.get('year', now.year))
        month = int(request.query_params.get('month', now.month))

        daily = Transaction.objects.filter(
            user=user,
            transaction_type='expense',
            date__year=year,
            date__month=month,
        ).annotate(day=TruncDay('date')).values('day').annotate(
            total=Sum('amount')
        ).order_by('day')

        total = sum(d['total'] for d in daily) or Decimal('1')
        avg = float(total) / max(len(list(daily)), 1)

        result = [
            {
                'date': d['day'].strftime('%Y-%m-%d'),
                'day': d['day'].day,
                'total': float(d['total']),
            }
            for d in daily
        ]
        return Response({'data': result, 'average': avg, 'total': float(total)})
