import { useQuery } from '@tanstack/react-query';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area, Legend,
} from 'recharts';
import { useAuthStore } from '../../stores/authStore';
import { analyticsApi } from '../../api/analytics';
import { formatCurrency } from '../../utils';

const COLORS = ['#6366f1','#f97316','#ec4899','#10b981','#3b82f6','#8b5cf6','#eab308','#ef4444'];

const ChartCard = ({ title, subtitle, children, loading }: {
  title: string; subtitle?: string; children: React.ReactNode; loading?: boolean;
}) => (
  <div className="card p-4 sm:p-5">
    <div className="mb-4">
      <h2 className="font-semibold text-sm sm:text-base text-surface-900 dark:text-white">{title}</h2>
      {subtitle && <p className="text-xs text-surface-400 mt-0.5">{subtitle}</p>}
    </div>
    {loading ? <div className="skeleton rounded-xl h-56" /> : children}
  </div>
);

const ChartTooltip = ({ active, payload, label, symbol }: {
  active?: boolean; payload?: Array<{ color: string; name: string; value: number }>;
  label?: string; symbol?: string;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface-900 border border-surface-700 rounded-xl p-3 shadow-modal text-sm">
      <p className="text-surface-400 text-xs mb-1.5">{label}</p>
      {payload.map(p => (
        <div key={p.name} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-surface-300">{p.name}:</span>
          <span className="text-white font-semibold">{formatCurrency(p.value, symbol || '$')}</span>
        </div>
      ))}
    </div>
  );
};

export default function AnalyticsPage() {
  const user = useAuthStore(s => s.user);
  const symbol = user?.profile?.currency_symbol || '$';

  const { data: trend, isLoading: trendLoading } = useQuery({
    queryKey: ['monthlyTrend'],
    queryFn: analyticsApi.monthlyTrend,
    select: d => d.data,
  });

  const { data: cashFlow, isLoading: cfLoading } = useQuery({
    queryKey: ['cashFlow'],
    queryFn: analyticsApi.cashFlow,
    select: d => d.data,
  });

  const { data: breakdown, isLoading: bkLoading } = useQuery({
    queryKey: ['expenseBreakdown'],
    queryFn: () => analyticsApi.expenseBreakdown(),
    select: d => d.data,
  });

  const { data: daily, isLoading: dailyLoading } = useQuery({
    queryKey: ['dailySpending'],
    queryFn: () => analyticsApi.dailySpending(),
  });

  // Summary stats from trend
  const allIncome = trend?.reduce((s: number, m: { income: number }) => s + m.income, 0) || 0;
  const allExpenses = trend?.reduce((s: number, m: { expenses: number }) => s + m.expenses, 0) || 0;
  const avgMonthlyExpense = trend?.length ? allExpenses / trend.length : 0;
  const largestExpense = breakdown?.[0];

  return (
    <div className="p-4 sm:p-6 max-w-screen-xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold dark:text-white">Analytics</h1>
        <p className="text-sm text-surface-500 dark:text-surface-400 mt-0.5">Your financial picture at a glance</p>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-1 min-[480px]:grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total Income (12m)', value: allIncome, color: 'text-income' },
          { label: 'Total Expenses (12m)', value: allExpenses, color: 'text-expense' },
          { label: 'Avg Monthly Expense', value: avgMonthlyExpense, color: 'text-brand-600' },
          { label: 'Top Category', value: largestExpense?.total || 0, color: 'text-surface-700 dark:text-surface-200', label2: largestExpense?.name },
        ].map(s => (
          <div key={s.label} className="card p-3 sm:p-4">
            <p className={`text-lg sm:text-xl font-bold ${s.color} font-mono`}>{formatCurrency(s.value, symbol)}</p>
            <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">{s.label}</p>
            {s.label2 && <p className="text-xs font-semibold text-surface-700 dark:text-surface-300 mt-1">{s.label2}</p>}
          </div>
        ))}
      </div>

      {/* Income vs Expenses */}
      <ChartCard title="Income vs Expenses" subtitle="Monthly comparison" loading={trendLoading}>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={trend} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month_name" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${symbol}${v}`} width={45} />
            <Tooltip content={<ChartTooltip symbol={symbol} />} />
            <Legend />
            <Bar dataKey="income" name="Income" fill="#10b981" radius={[4,4,0,0]} />
            <Bar dataKey="expenses" name="Expenses" fill="#ef4444" radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Cash Flow (Area) */}
        <ChartCard title="Cash Flow" subtitle="Last 30 days" loading={cfLoading}>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={cashFlow} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tickFormatter={d => d.slice(8)} tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} width={45} tickFormatter={v => `${symbol}${v}`} />
              <Tooltip content={<ChartTooltip symbol={symbol} />} />
              <Area type="monotone" dataKey="income" name="Income" stroke="#10b981" fill="url(#incomeGrad)" strokeWidth={2} />
              <Area type="monotone" dataKey="expense" name="Expense" stroke="#ef4444" fill="url(#expenseGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Expense breakdown donut */}
        <ChartCard title="Expense Breakdown" subtitle="Current month" loading={bkLoading}>
          {breakdown && breakdown.length > 0 ? (
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
              <div className="w-full sm:w-[50%] h-[200px] flex items-center justify-center flex-shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={breakdown} cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                      dataKey="total" nameKey="name">
                      {breakdown.map((entry: { color?: string }, idx: number) => (
                        <Cell key={idx} fill={entry.color || COLORS[idx % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: unknown) => formatCurrency(v as number, symbol)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-full sm:flex-1 space-y-2">
                {breakdown.slice(0, 6).map((cat: { name: string; color?: string; percentage: number; total: number }, i: number) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: cat.color || COLORS[i] }} />
                    <span className="flex-1 text-surface-600 dark:text-surface-300 truncate">{cat.name}</span>
                    <span className="text-surface-400 font-semibold">{cat.percentage}%</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-48 text-surface-400 text-sm">No expense data</div>
          )}
        </ChartCard>
      </div>

      {/* Savings trend */}
      <ChartCard title="Savings Trend" subtitle="Monthly savings over time" loading={trendLoading}>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={trend} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="savingsGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month_name" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} width={55} tickFormatter={v => `${symbol}${v}`} />
            <Tooltip content={<ChartTooltip symbol={symbol} />} />
            <Area type="monotone" dataKey="savings" name="Savings" stroke="#6366f1" fill="url(#savingsGrad)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Daily spending */}
      <ChartCard title="Daily Spending" subtitle="Expense by day this month" loading={dailyLoading}>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={daily?.data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} width={50} tickFormatter={v => `${symbol}${v}`} />
            <Tooltip content={<ChartTooltip symbol={symbol} />} />
            <Bar dataKey="total" name="Spent" fill="#6366f1" radius={[3,3,0,0]} />
          </BarChart>
        </ResponsiveContainer>
        {daily && (
          <p className="text-xs text-surface-400 mt-2">
            Daily average: <span className="font-semibold text-surface-700 dark:text-surface-300">{formatCurrency(daily.average, symbol)}</span>
          </p>
        )}
      </ChartCard>
    </div>
  );
}
