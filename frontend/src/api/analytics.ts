import api from './client';
import type {
  DashboardData, CashFlowPoint, ExpenseBreakdownItem, MonthlyTrendPoint, DailySpendingPoint,
} from '../types';

export const analyticsApi = {
  dashboard: async () => {
    const res = await api.get<DashboardData>('/analytics/dashboard/');
    return res.data;
  },

  cashFlow: async () => {
    const res = await api.get<{ data: CashFlowPoint[] }>('/analytics/cash-flow/');
    return res.data;
  },

  expenseBreakdown: async (year?: number, month?: number) => {
    const params: Record<string, number> = {};
    if (year) params.year = year;
    if (month) params.month = month;
    const res = await api.get<{ data: ExpenseBreakdownItem[]; total: number }>(
      '/analytics/expense-breakdown/', { params }
    );
    return res.data;
  },

  monthlyTrend: async () => {
    const res = await api.get<{ data: MonthlyTrendPoint[] }>('/analytics/monthly-trend/');
    return res.data;
  },

  dailySpending: async (year?: number, month?: number) => {
    const params: Record<string, number> = {};
    if (year) params.year = year;
    if (month) params.month = month;
    const res = await api.get<{ data: DailySpendingPoint[]; average: number; total: number }>(
      '/analytics/daily-spending/', { params }
    );
    return res.data;
  },
};
