import api from './client';
import type {
  Transaction, PaginatedResponse,
} from '../types';

export interface TransactionFilters {
  page?: number;
  page_size?: number;
  search?: string;
  transaction_type?: string;
  category?: string;
  account?: string;
  date_from?: string;
  date_to?: string;
  amount_min?: number;
  amount_max?: number;
  ordering?: string;
}

export const transactionsApi = {
  list: async (filters: TransactionFilters = {}) => {
    const params = Object.fromEntries(
      Object.entries(filters).filter(([, v]) => v !== undefined && v !== '' && v !== null)
    );
    const res = await api.get<PaginatedResponse<Transaction>>('/transactions/', { params });
    return res.data;
  },

  get: async (id: string) => {
    const res = await api.get<Transaction>(`/transactions/${id}/`);
    return res.data;
  },

  create: async (data: Partial<Transaction>) => {
    const res = await api.post<Transaction>('/transactions/', data);
    return res.data;
  },

  update: async (id: string, data: Partial<Transaction>) => {
    const res = await api.patch<Transaction>(`/transactions/${id}/`, data);
    return res.data;
  },

  delete: async (id: string) => {
    await api.delete(`/transactions/${id}/`);
  },
};

export const categoriesApi = {
  list: async (type?: string) => {
    const res = await api.get('/categories/', { params: type ? { category_type: type } : {} });
    return res.data;
  },

  create: async (data: { name: string; category_type: string; icon: string; color: string }) => {
    const res = await api.post('/categories/', data);
    return res.data;
  },

  update: async (id: string, data: { name?: string; icon?: string; color?: string }) => {
    const res = await api.patch(`/categories/${id}/`, data);
    return res.data;
  },

  delete: async (id: string) => {
    await api.delete(`/categories/${id}/`);
  },
};

export const accountsApi = {
  list: async () => {
    const res = await api.get('/accounts/');
    return res.data;
  },

  create: async (data: { name: string; account_type: string; balance?: number; color?: string }) => {
    const res = await api.post('/accounts/', data);
    return res.data;
  },

  update: async (id: string, data: object) => {
    const res = await api.patch(`/accounts/${id}/`, data);
    return res.data;
  },

  delete: async (id: string) => {
    await api.delete(`/accounts/${id}/`);
  },
};

export const budgetsApi = {
  list: async (year?: number, month?: number) => {
    const params: Record<string, unknown> = {};
    if (year) params.year = year;
    if (month) params.month_number = month;
    const res = await api.get('/budgets/', { params });
    return res.data;
  },

  currentMonth: async () => {
    const res = await api.get('/budgets/current/');
    return res.data;
  },

  create: async (data: { category: string; amount: number; year: number; month_number: number }) => {
    const res = await api.post('/budgets/', data);
    return res.data;
  },

  update: async (id: string, data: { amount?: number }) => {
    const res = await api.patch(`/budgets/${id}/`, data);
    return res.data;
  },

  delete: async (id: string) => {
    await api.delete(`/budgets/${id}/`);
  },
};

export const monthsApi = {
  list: async () => {
    const res = await api.get('/months/');
    return res.data;
  },

  current: async () => {
    const res = await api.get('/months/current/');
    return res.data;
  },
};
