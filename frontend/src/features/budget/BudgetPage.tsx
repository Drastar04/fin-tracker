import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, Plus, Edit3, Trash2, AlertTriangle, X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { budgetsApi, categoriesApi } from '../../api/finance';
import { useAuthStore } from '../../stores/authStore';
import { useUIStore } from '../../stores/uiStore';
import { formatCurrency, percentageColor } from '../../utils';
import type { Budget } from '../../types';

const budgetSchema = z.object({
  category: z.string().min(1, 'Required'),
  amount: z.number({ message: 'Required' }).positive('Must be positive'),
});
type BudgetForm = z.infer<typeof budgetSchema>;

function BudgetModal({ budget, onClose }: { budget: Budget | null; onClose: () => void }) {
  const { toast } = useUIStore();
  const qc = useQueryClient();
  const now = new Date();

  const { data: cats = [] } = useQuery({
    queryKey: ['categories', 'expense'],
    queryFn: () => categoriesApi.list('expense'),
    select: (d: { results?: unknown[] } | unknown[]) => Array.isArray(d) ? d : (d as { results?: unknown[] }).results || d,
  });

  const { register, handleSubmit, formState: { errors } } = useForm<BudgetForm>({
    resolver: zodResolver(budgetSchema),
    defaultValues: budget ? { category: budget.category, amount: budget.amount } : {},
  });

  const mutation = useMutation({
    mutationFn: (data: BudgetForm) =>
      budget
        ? budgetsApi.update(budget.id, { amount: data.amount })
        : budgetsApi.create({ ...data, year: now.getFullYear(), month_number: now.getMonth() + 1 }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['budgets'] });
      toast.success(budget ? 'Budget updated!' : 'Budget created!');
      onClose();
    },
    onError: () => toast.error('Failed to save budget.'),
  });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: .95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: .95 }}
        className="modal-content p-4 sm:p-6"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold dark:text-white">{budget ? 'Edit Budget' : 'New Budget'}</h2>
          <button onClick={onClose} className="btn-icon"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-surface-500 mb-1.5">Category</label>
            <select {...register('category')} disabled={!!budget} className={`input-base ${errors.category ? 'error' : ''}`}>
              <option value="">Select category</option>
              {(cats as Array<{ id: string; name: string }>).map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-surface-500 mb-1.5">Monthly Budget Amount</label>
            <input {...register('amount', { valueAsNumber: true })} type="number" step="0.01" placeholder="0.00" className={`input-base text-lg font-bold ${errors.amount ? 'error' : ''}`} />
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={mutation.isPending} className="btn-primary flex-1">
              {mutation.isPending ? 'Saving...' : 'Save Budget'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

function BudgetCard({ budget, symbol, onEdit, onDelete }: {
  budget: Budget; symbol: string;
  onEdit: (b: Budget) => void;
  onDelete: (id: string) => void;
}) {
  const pct = budget.percentage_used;
  const isOver = pct >= 100;
  const isNear = pct >= 85 && !isOver;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="card p-4 sm:p-5 group"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold"
            style={{ background: (budget.category_color || '#6366f1') + '22', color: budget.category_color || '#6366f1' }}
          >
            {budget.category_name?.charAt(0)}
          </div>
          <div>
            <p className="font-semibold text-surface-900 dark:text-white text-sm">{budget.category_name}</p>
            <p className="text-xs text-surface-400">{pct.toFixed(0)}% used</p>
          </div>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => onEdit(budget)} className="btn-icon !p-1.5"><Edit3 className="w-3.5 h-3.5" /></button>
          <button onClick={() => onDelete(budget.id)} className="btn-icon !p-1.5 hover:!text-danger"><Trash2 className="w-3.5 h-3.5" /></button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="progress-bar mb-2">
        <motion.div
          className={`progress-fill ${percentageColor(pct)}`}
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(pct, 100)}%` }}
          transition={{ duration: .6, ease: 'easeOut' }}
        />
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="text-surface-500 dark:text-surface-400">
          Spent: <span className="font-semibold text-surface-900 dark:text-white">{formatCurrency(budget.spent, symbol)}</span>
        </span>
        <span className={`font-semibold ${isOver ? 'text-danger' : isNear ? 'text-warning' : 'text-surface-600 dark:text-surface-300'}`}>
          {isOver ? 'Over budget!' : `${formatCurrency(budget.remaining, symbol)} left`}
        </span>
      </div>

      {isNear && !isOver && (
        <div className="mt-2 flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
          <AlertTriangle className="w-3.5 h-3.5" />
          Approaching limit
        </div>
      )}
    </motion.div>
  );
}

export default function BudgetPage() {
  const user = useAuthStore(s => s.user);
  const { toast } = useUIStore();
  const symbol = user?.profile?.currency_symbol || '$';
  const qc = useQueryClient();
  const [modal, setModal] = useState<Budget | null | 'new'>(null);

  const { data: budgets = [], isLoading } = useQuery({
    queryKey: ['budgets'],
    queryFn: budgetsApi.currentMonth,
  });

  const deleteMutation = useMutation({
    mutationFn: budgetsApi.delete,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['budgets'] }); toast.success('Budget removed.'); },
    onError: () => toast.error('Failed to delete.'),
  });

  const totalBudget = (budgets as Budget[]).reduce((s, b) => s + b.amount, 0);
  const totalSpent = (budgets as Budget[]).reduce((s, b) => s + b.spent, 0);
  const totalRemaining = Math.max(totalBudget - totalSpent, 0);

  const now = new Date();

  return (
    <div className="p-4 sm:p-6 max-w-screen-xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold dark:text-white">Budget</h1>
          <p className="text-sm text-surface-500 dark:text-surface-400 mt-0.5">
            {now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </p>
        </div>
        <button onClick={() => setModal('new')} className="btn-primary">
          <Plus className="w-4 h-4" /> New Budget
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Total Budget', value: totalBudget, color: 'text-brand-600' },
          { label: 'Total Spent', value: totalSpent, color: 'text-expense' },
          { label: 'Remaining', value: totalRemaining, color: 'text-income' },
        ].map(s => (
          <div key={s.label} className="card p-3 sm:p-4 text-center">
            <p className="text-xl sm:text-2xl font-bold text-surface-900 dark:text-white font-mono">
              {formatCurrency(s.value, symbol)}
            </p>
            <p className="text-xs text-surface-500 dark:text-surface-400 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Budget cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="skeleton h-32 rounded-2xl" />)}
        </div>
      ) : (budgets as Budget[]).length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center card">
          <Target className="w-12 h-12 text-surface-300 dark:text-surface-600 mb-3" />
          <p className="text-surface-600 dark:text-surface-300 font-medium text-lg">No budgets yet</p>
          <p className="text-surface-400 text-sm mt-1 mb-4">Set monthly spending limits by category</p>
          <button onClick={() => setModal('new')} className="btn-primary">Create first budget</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {(budgets as Budget[]).map(b => (
              <BudgetCard
                key={b.id}
                budget={b}
                symbol={symbol}
                onEdit={setModal}
                onDelete={(id) => window.confirm('Remove this budget?') && deleteMutation.mutate(id)}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      <AnimatePresence>
        {modal !== null && (
          <BudgetModal budget={modal === 'new' ? null : modal} onClose={() => setModal(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
