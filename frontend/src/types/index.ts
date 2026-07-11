// ─── Core Types ────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  full_name: string;
  username: string;
  profile: UserProfile;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  currency: string;
  currency_symbol: string;
  country: string;
  timezone: string;
  default_monthly_opening_balance: number;
  theme: 'light' | 'dark' | 'system';
  onboarding_completed: boolean;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Account {
  id: string;
  name: string;
  account_type: 'checking' | 'savings' | 'cash' | 'credit' | 'investment' | 'other';
  balance: number;
  currency: string;
  color: string;
  icon: string;
  is_active: boolean;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  category_type: 'income' | 'expense' | 'transfer';
  icon: string;
  color: string;
  is_system: boolean;
  created_at: string;
  updated_at: string;
}

export type TransactionType = 'income' | 'expense' | 'transfer';

export interface Transaction {
  id: string;
  amount: number;
  transaction_type: TransactionType;
  description: string;
  date: string;
  category: string | null;
  category_name: string | null;
  category_color: string | null;
  category_icon: string | null;
  account: string | null;
  account_name: string | null;
  note?: string;
  receipt_url?: string;
  transfer_to_account?: string | null;
  month?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface Month {
  id: string;
  year: number;
  month: number;
  month_name: string;
  opening_balance: number;
  closing_balance: number;
  total_income: number;
  total_expenses: number;
  total_savings: number;
  is_current: boolean;
  created_at: string;
  updated_at: string;
}

export interface Budget {
  id: string;
  category: string;
  category_name: string;
  category_color: string;
  category_icon: string;
  amount: number;
  spent: number;
  remaining: number;
  percentage_used: number;
  year: number;
  month_number: number;
  created_at: string;
  updated_at: string;
}

// ─── API Response Types ────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  count: number;
  total_pages: number;
  next: string | null;
  previous: string | null;
  page: number;
  results: T[];
}

export interface AuthResponse {
  user: User;
  access: string;
  refresh: string;
}

// ─── Analytics Types ───────────────────────────────────────────────────────────

export interface DashboardData {
  current_balance: number;
  opening_balance: number;
  total_income: number;
  total_expenses: number;
  total_savings: number;
  total_budget: number;
  budget_remaining: number;
  week_change_pct: number;
  recent_transactions: Transaction[];
  top_categories: TopCategory[];
  insights: Insight[];
  month: { year: number; month: number; label: string };
}

export interface TopCategory {
  category__name: string;
  category__color: string;
  category__icon: string;
  total: number;
  count: number;
}

export interface Insight {
  type: 'positive' | 'negative' | 'info' | 'warning';
  icon: string;
  text: string;
}

export interface CashFlowPoint {
  date: string;
  income: number;
  expense: number;
}

export interface ExpenseBreakdownItem {
  category_id: string | null;
  name: string;
  color: string;
  icon: string;
  total: number;
  percentage: number;
  count: number;
}

export interface MonthlyTrendPoint {
  label: string;
  month_name: string;
  income: number;
  expenses: number;
  savings: number;
}

export interface DailySpendingPoint {
  date: string;
  day: number;
  total: number;
}

// ─── Form Types ───────────────────────────────────────────────────────────────

export interface TransactionFormData {
  amount: number;
  transaction_type: TransactionType;
  description: string;
  date: string;
  category: string;
  account: string;
  note?: string;
}

export interface BudgetFormData {
  category: string;
  amount: number;
  year: number;
  month_number: number;
}

// ─── UI Types ─────────────────────────────────────────────────────────────────

export interface ToastData {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
}

export type Theme = 'light' | 'dark' | 'system';
