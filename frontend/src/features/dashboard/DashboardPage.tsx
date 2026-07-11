import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Wallet, TrendingUp, TrendingDown, Target, PiggyBank,
  ArrowUpRight, ArrowDownRight, Lightbulb, CheckCircle, AlertTriangle, Info,
} from 'lucide-react';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { analyticsApi } from '../../api/analytics';
import { useAuthStore } from '../../stores/authStore';
import { formatCurrency, formatRelativeDate, percentageColor } from '../../utils';
import type { Transaction, TopCategory, Insight, CashFlowPoint } from '../../types';

// ── Skeleton components ────────────────────────────────────────────────────────
const StatSkeleton = () => (
  <div className="stat-card">
    <div className="skeleton h-4 w-24 rounded" />
    <div className="skeleton h-8 w-36 rounded" />
    <div className="skeleton h-3 w-20 rounded" />
  </div>
);

const ChartSkeleton = ({ h = '240px' }: { h?: string }) => (
  <div className="card p-5">
    <div className="skeleton h-5 w-32 rounded mb-4" />
    <div className="skeleton rounded-xl" style={{ height: h }} />
  </div>
);

// ── Stat Card ─────────────────────────────────────────────────────────────────
interface StatCardProps {
  title: string;
  value: number;
  symbol: string;
  icon: React.ElementType;
  iconColor: string;
  change?: number;
  changeLabel?: string;
  positive?: boolean;
}

function StatCard({ title, value, symbol, icon: Icon, iconColor, change, changeLabel, positive }: StatCardProps) {
  const isPositive = positive ?? (change !== undefined ? change >= 0 : true);
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="stat-card"
    >
      <div className="flex items-start justify-between">
        <div className={`w-9 h-9 rounded-xl ${iconColor} flex items-center justify-center`}>
          <Icon className="w-4.5 h-4.5" />
        </div>
        {change !== undefined && (
          <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${
            isPositive ? 'bg-income-light text-emerald-700 dark:text-emerald-400' : 'bg-expense-light text-red-700 dark:text-red-400'
          }`}>
            {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {Math.abs(change)}%
          </div>
        )}
      </div>
      <div>
        <p className="text-2xl font-bold text-surface-900 dark:text-white font-mono">
          {formatCurrency(value, symbol)}
        </p>
        <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">{title}</p>
      </div>
      {changeLabel && (
        <p className="text-xs text-surface-400">{changeLabel}</p>
      )}
    </motion.div>
  );
}

// ── Custom Tooltip ─────────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label, symbol }: {
  active?: boolean; payload?: Array<{ color: string; name: string; value: number }>;
  label?: string; symbol?: string;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface-900 dark:bg-surface-800 border border-surface-700 rounded-xl p-3 shadow-modal">
      <p className="text-surface-400 text-xs mb-2">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2 text-sm">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-surface-300">{p.name}:</span>
          <span className="text-white font-semibold">{formatCurrency(p.value, symbol || '$')}</span>
        </div>
      ))}
    </div>
  );
};

// ── Insight card ──────────────────────────────────────────────────────────────
const insightIcons: Record<string, React.ElementType> = {
  positive: CheckCircle,
  warning:  AlertTriangle,
  info:     Info,
};
const insightColors: Record<string, string> = {
  positive: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20',
  warning:  'text-amber-500 bg-amber-50 dark:bg-amber-900/20',
  info:     'text-brand-500 bg-brand-50 dark:bg-brand-900/20',
  negative: 'text-red-500 bg-red-50 dark:bg-red-900/20',
};

function InsightCard({ insight }: { insight: Insight }) {
  const Icon = insightIcons[insight.type] || Info;
  return (
    <div className={`flex items-start gap-3 p-3 rounded-xl ${insightColors[insight.type] || insightColors.info}`}>
      <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" />
      <p className="text-sm font-medium">{insight.text}</p>
    </div>
  );
}

// ── DONUT COLORS ──────────────────────────────────────────────────────────────
const CHART_COLORS = ['#6366f1','#f97316','#ec4899','#10b981','#3b82f6','#8b5cf6','#eab308','#ef4444'];

// ── Main Dashboard ─────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const user = useAuthStore(s => s.user);
  const symbol = user?.profile?.currency_symbol || '$';

  const { data: dashboard, isLoading: dashLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: analyticsApi.dashboard,
    refetchInterval: 60_000, // refresh every minute
  });

  const { data: cashFlowData, isLoading: cfLoading } = useQuery({
    queryKey: ['cashFlow'],
    queryFn: analyticsApi.cashFlow,
    select: d => d.data,
  });

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const firstName = user?.full_name?.split(' ')[0] || 'there';

  if (dashLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="skeleton h-8 w-64 rounded" />
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => <StatSkeleton key={i} />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2"><ChartSkeleton h="280px" /></div>
          <ChartSkeleton h="280px" />
        </div>
      </div>
    );
  }

  if (!dashboard) return null;

  const {
    current_balance, total_income, total_expenses, total_savings,
    budget_remaining, week_change_pct, recent_transactions, top_categories,
    insights, month, total_budget,
  } = dashboard;

  const budgetPct = total_budget > 0
    ? Math.round((total_budget - budget_remaining) / total_budget * 100)
    : 0;

  return (
    <div className="p-4 sm:p-6 max-w-screen-xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-surface-900 dark:text-white">
            {greeting}, {firstName}! 👋
          </h1>
          <p className="text-xs sm:text-sm text-surface-500 dark:text-surface-400 mt-0.5">{month.label}</p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 min-[380px]:grid-cols-2 lg:grid-cols-5 gap-3">
        <StatCard
          title="Current Balance"
          value={current_balance}
          symbol={symbol}
          icon={Wallet}
          iconColor="bg-brand-100 dark:bg-brand-900/40 text-brand-600 dark:text-brand-400"
        />
        <StatCard
          title="Money In"
          value={total_income}
          symbol={symbol}
          icon={TrendingUp}
          iconColor="bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400"
        />
        <StatCard
          title="Money Out"
          value={total_expenses}
          symbol={symbol}
          icon={TrendingDown}
          iconColor="bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400"
          change={week_change_pct}
          changeLabel="vs last week"
          positive={week_change_pct <= 0}
        />
        <StatCard
          title="Budget Left"
          value={budget_remaining}
          symbol={symbol}
          icon={Target}
          iconColor="bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400"
          changeLabel={`${budgetPct}% used`}
        />
        <StatCard
          title="Savings"
          value={total_savings}
          symbol={symbol}
          icon={PiggyBank}
          iconColor="bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Cash Flow */}
        <div className="lg:col-span-2 card p-4 sm:p-5">
          <h2 className="font-semibold text-sm sm:text-base text-surface-900 dark:text-white mb-4">Cash Flow — Last 30 Days</h2>
          {cfLoading ? (
            <div className="skeleton rounded-xl h-64" />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={cashFlowData as CashFlowPoint[]} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tickFormatter={d => d.slice(5)} tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${symbol}${v}`} width={45} />
                <Tooltip content={<CustomTooltip symbol={symbol} />} />
                <Line type="monotone" dataKey="income" stroke="#10b981" strokeWidth={2} dot={false} name="Income" />
                <Line type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={2} dot={false} name="Expense" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Expense donut */}
        <div className="card p-4 sm:p-5">
          <h2 className="font-semibold text-sm sm:text-base text-surface-900 dark:text-white mb-4">Top Categories</h2>
          {top_categories.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-center">
              <p className="text-surface-400 text-sm">No expenses yet this month.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={top_categories}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  dataKey="total"
                  nameKey="category__name"
                >
                  {top_categories.map((_, idx) => (
                    <Cell key={idx} fill={(top_categories[idx] as TopCategory & { category__color?: string }).category__color || CHART_COLORS[idx % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: unknown) => formatCurrency(v as number, symbol)} />
              </PieChart>
            </ResponsiveContainer>
          )}
          <div className="space-y-2 mt-2">
            {top_categories.slice(0, 4).map((cat, i) => {
              const c = cat as TopCategory & { category__color?: string };
              return (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: c.category__color || CHART_COLORS[i] }} />
                  <span className="flex-1 text-surface-600 dark:text-surface-300 truncate">{c.category__name}</span>
                  <span className="font-semibold text-surface-900 dark:text-white">{formatCurrency(c.total, symbol)}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent transactions */}
        <div className="lg:col-span-2 card p-4 sm:p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-sm sm:text-base text-surface-900 dark:text-white">Recent Transactions</h2>
            <a href="/transactions" className="text-xs text-brand-600 dark:text-brand-400 font-semibold hover:underline">View all →</a>
          </div>
          {recent_transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Wallet className="w-8 h-8 text-surface-300 dark:text-surface-600 mb-2" />
              <p className="text-surface-400 text-sm">No transactions yet. Add your first one!</p>
            </div>
          ) : (
            <div className="space-y-1">
              {recent_transactions.map((tx: Transaction) => (
                <div key={tx.id} className="flex items-center gap-3 px-2 py-2.5 rounded-xl hover:bg-surface-50 dark:hover:bg-surface-700/40 transition-colors">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm"
                    style={{ background: tx.category_color ? tx.category_color + '22' : '#6366f122' }}
                  >
                    <span style={{ color: tx.category_color || '#6366f1' }}>
                      {tx.category_name?.charAt(0) || '?'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-surface-900 dark:text-white truncate">{tx.description}</p>
                    <p className="text-xs text-surface-400">{tx.category_name} · {formatRelativeDate(tx.date)}</p>
                  </div>
                  <p className={`text-sm font-bold tabular-nums ${tx.transaction_type === 'income' ? 'text-income' : 'text-expense'}`}>
                    {tx.transaction_type === 'income' ? '+' : '-'}{formatCurrency(tx.amount, symbol)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Insights */}
        <div className="card p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="w-4 h-4 text-amber-500" />
            <h2 className="font-semibold text-sm sm:text-base text-surface-900 dark:text-white">Insights</h2>
          </div>
          {insights.length === 0 ? (
            <p className="text-surface-400 text-sm">Add more transactions to see insights.</p>
          ) : (
            <div className="space-y-2">
              {insights.map((insight, i) => (
                <InsightCard key={i} insight={insight} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
