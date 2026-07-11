"""Analytics app URLs."""
from django.urls import path
from . import views

urlpatterns = [
    path('dashboard/', views.DashboardView.as_view(), name='analytics-dashboard'),
    path('cash-flow/', views.CashFlowChartView.as_view(), name='analytics-cash-flow'),
    path('expense-breakdown/', views.ExpenseBreakdownView.as_view(), name='analytics-expense-breakdown'),
    path('monthly-trend/', views.MonthlyTrendView.as_view(), name='analytics-monthly-trend'),
    path('daily-spending/', views.DailySpendingView.as_view(), name='analytics-daily-spending'),
]
