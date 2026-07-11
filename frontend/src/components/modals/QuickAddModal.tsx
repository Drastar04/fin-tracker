import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { X, DollarSign, ArrowDownCircle, ArrowUpCircle, ArrowLeftRight } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useUIStore } from '../../stores/uiStore';
import { useAuthStore } from '../../stores/authStore';
import { transactionsApi, categoriesApi, accountsApi } from '../../api/finance';
import { getToday } from '../../utils';
import type { TransactionType } from '../../types';

const schema = z.object({
  amount: z.number({ message: 'Enter an amount' }).positive('Must be positive'),
  transaction_type: z.enum(['income', 'expense', 'transfer'] as const),
  description: z.string().min(1, 'Description required').max(255),
  category: z.string().min(1, 'Select a category'),
  account: z.string().min(1, 'Select an account'),
  date: z.string(),
  note: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const typeConfig: Record<TransactionType, { icon: React.ElementType; color: string; label: string }> = {
  expense:  { icon: ArrowDownCircle, color: 'text-red-500',     label: 'Expense' },
  income:   { icon: ArrowUpCircle,   color: 'text-emerald-500', label: 'Income' },
  transfer: { icon: ArrowLeftRight,  color: 'text-brand-500',   label: 'Transfer' },
};

export default function QuickAddModal() {
  const { closeQuickAdd, toast } = useUIStore();
  const user = useAuthStore((s) => s.user);
  const qc = useQueryClient();
  const symbol = user?.profile?.currency_symbol || '$';

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.list(),
    select: (d: { results: unknown[] } | unknown[]) => Array.isArray(d) ? d : (d as { results: unknown[] }).results || d,
  });

  const { data: accounts = [] } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => accountsApi.list(),
    select: (d: { results: unknown[] } | unknown[]) => Array.isArray(d) ? d : (d as { results: unknown[] }).results || d,
  });

  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      transaction_type: 'expense',
      date: getToday(),
    },
  });

  const txType = watch('transaction_type');
  const filteredCategories = (categories as Array<{ category_type: string; id: string; name: string; color: string }>)
    .filter(c => c.category_type === txType || c.category_type === 'transfer');

  const mutation = useMutation({
    mutationFn: (data: FormData) => transactionsApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transactions'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      qc.invalidateQueries({ queryKey: ['budgets'] });
      toast.success('Transaction added!');
      closeQuickAdd();
    },
    onError: () => toast.error('Failed to add transaction. Try again.'),
  });

  const onSubmit = (data: FormData) => mutation.mutate(data);

  return (
    <div className="modal-overlay" onClick={closeQuickAdd}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="modal-content p-4 sm:p-6 max-w-md w-full"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-surface-900 dark:text-white">Quick Add</h2>
          <button onClick={closeQuickAdd} className="btn-icon">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Type selector */}
        <div className="flex gap-2 mb-5 p-1 bg-surface-100 dark:bg-surface-800 rounded-xl">
          {(['expense', 'income', 'transfer'] as TransactionType[]).map(type => {
            const { icon: Icon, color, label } = typeConfig[type];
            return (
              <button
                key={type}
                type="button"
                onClick={() => { setValue('transaction_type', type); setValue('category', ''); }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                  txType === type
                    ? 'bg-white dark:bg-surface-700 shadow-soft ' + color
                    : 'text-surface-400 hover:text-surface-600 dark:hover:text-surface-300'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            );
          })}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Amount */}
          <div>
            <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 mb-1.5">Amount</label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400 font-semibold text-sm">
                {symbol}
              </span>
              <input
                {...register('amount', { valueAsNumber: true })}
                type="number"
                step="0.01"
                placeholder="0.00"
                className={`input-base pl-8 text-lg font-bold ${errors.amount ? 'error' : ''}`}
                autoFocus
              />
            </div>
            {errors.amount && <p className="text-xs text-danger mt-1">{errors.amount.message}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 mb-1.5">Description</label>
            <input
              {...register('description')}
              type="text"
              placeholder="What was this for?"
              className={`input-base ${errors.description ? 'error' : ''}`}
            />
            {errors.description && <p className="text-xs text-danger mt-1">{errors.description.message}</p>}
          </div>

          {/* Category & Account row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 mb-1.5">Category</label>
              <select {...register('category')} className={`input-base ${errors.category ? 'error' : ''}`}>
                <option value="">Category</option>
                {filteredCategories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
              {errors.category && <p className="text-xs text-danger mt-1">{errors.category.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 mb-1.5">Account</label>
              <select {...register('account')} className={`input-base ${errors.account ? 'error' : ''}`}>
                <option value="">Account</option>
                {(accounts as Array<{ id: string; name: string }>).map(acc => (
                  <option key={acc.id} value={acc.id}>{acc.name}</option>
                ))}
              </select>
              {errors.account && <p className="text-xs text-danger mt-1">{errors.account.message}</p>}
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 mb-1.5">Date</label>
            <input {...register('date')} type="date" className="input-base" />
          </div>

          {/* Note */}
          <div>
            <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 mb-1.5">Note <span className="text-surface-300">(optional)</span></label>
            <input {...register('note')} type="text" placeholder="Add a note..." className="input-base" />
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={closeQuickAdd} className="btn-secondary flex-1">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || mutation.isPending}
              className="btn-primary flex-1"
            >
              {mutation.isPending ? 'Saving...' : 'Save Transaction'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
