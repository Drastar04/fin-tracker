import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Filter, ArrowUpDown, Trash2, Edit3, ChevronLeft, ChevronRight,
  ArrowUpCircle, ArrowDownCircle, ArrowLeftRight, X,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { transactionsApi, categoriesApi, accountsApi } from '../../api/finance';
import { useAuthStore } from '../../stores/authStore';
import { useUIStore } from '../../stores/uiStore';
import { formatCurrency, formatDate, getToday } from '../../utils';
import type { Transaction } from '../../types';

const txSchema = z.object({
  amount: z.number({ message: 'Required' }).positive(),
  transaction_type: z.enum(['income', 'expense', 'transfer'] as const),
  description: z.string().min(1).max(255),
  category: z.string().min(1),
  account: z.string().min(1),
  date: z.string(),
  note: z.string().optional(),
});
type TxForm = z.infer<typeof txSchema>;

const typeIcon = { income: ArrowUpCircle, expense: ArrowDownCircle, transfer: ArrowLeftRight };
const typeColor = { income: 'text-income', expense: 'text-expense', transfer: 'text-brand-500' };

function TransactionRow({
  tx, symbol, onEdit, onDelete,
}: {
  tx: Transaction; symbol: string;
  onEdit: (tx: Transaction) => void;
  onDelete: (id: string) => void;
}) {
  const Icon = typeIcon[tx.transaction_type] || ArrowDownCircle;
  return (
    <motion.tr
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="group hover:bg-surface-50 dark:hover:bg-surface-700/30 transition-colors"
    >
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
            style={{ background: (tx.category_color || '#6366f1') + '22', color: tx.category_color || '#6366f1' }}
          >
            {tx.category_name?.charAt(0) || '?'}
          </div>
          <div>
            <p className="text-sm font-medium text-surface-900 dark:text-white">{tx.description}</p>
            {tx.note && <p className="text-xs text-surface-400 truncate max-w-[200px]">{tx.note}</p>}
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-surface-500 dark:text-surface-400">{tx.category_name || '—'}</td>
      <td className="px-4 py-3 text-sm text-surface-500 dark:text-surface-400">{tx.account_name || '—'}</td>
      <td className="px-4 py-3 text-sm text-surface-500 dark:text-surface-400">{formatDate(tx.date, 'short')}</td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1.5">
          <Icon className={`w-3.5 h-3.5 ${typeColor[tx.transaction_type]}`} />
          <span className={`text-sm font-bold tabular-nums ${typeColor[tx.transaction_type]}`}>
            {tx.transaction_type === 'income' ? '+' : '-'}{formatCurrency(tx.amount, symbol)}
          </span>
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => onEdit(tx)} className="btn-icon !p-1.5" title="Edit">
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => onDelete(tx.id)} className="btn-icon !p-1.5 hover:!text-danger" title="Delete">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </td>
    </motion.tr>
  );
}

// Edit/Create modal
function TransactionModal({
  tx, onClose,
}: {
  tx: Transaction | null;
  onClose: () => void;
}) {
  const user = useAuthStore(s => s.user);
  const { toast } = useUIStore();
  const qc = useQueryClient();

  const { data: cats = [] } = useQuery({ queryKey: ['categories'], queryFn: () => categoriesApi.list(), select: (d: { results?: unknown[] } | unknown[]) => Array.isArray(d) ? d : (d as { results?: unknown[] }).results || d });
  const { data: accs = [] } = useQuery({ queryKey: ['accounts'], queryFn: () => accountsApi.list(), select: (d: { results?: unknown[] } | unknown[]) => Array.isArray(d) ? d : (d as { results?: unknown[] }).results || d });

  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<TxForm>({
    resolver: zodResolver(txSchema),
    defaultValues: tx ? {
      amount: tx.amount,
      transaction_type: tx.transaction_type,
      description: tx.description,
      category: tx.category || '',
      account: tx.account || '',
      date: tx.date,
      note: tx.note || '',
    } : { transaction_type: 'expense', date: getToday() },
  });

  const txType = watch('transaction_type');
  const filteredCats = (cats as Array<{ category_type: string; id: string; name: string }>).filter(c => c.category_type === txType || c.category_type === 'transfer');

  const mutation = useMutation({
    mutationFn: (data: TxForm) =>
      tx ? transactionsApi.update(tx.id, data) : transactionsApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transactions'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success(tx ? 'Transaction updated!' : 'Transaction added!');
      onClose();
    },
    onError: () => toast.error('Failed to save. Try again.'),
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
          <h2 className="text-lg font-bold dark:text-white">{tx ? 'Edit Transaction' : 'New Transaction'}</h2>
          <button onClick={onClose} className="btn-icon"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="space-y-4">
          <div className="flex gap-2 p-1 bg-surface-100 dark:bg-surface-800 rounded-xl">
            {(['expense','income','transfer'] as const).map(t => (
              <button key={t} type="button"
                onClick={() => { setValue('transaction_type', t); setValue('category', ''); }}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all capitalize ${txType === t ? 'bg-white dark:bg-surface-700 shadow-soft text-brand-600 dark:text-brand-400' : 'text-surface-400'}`}
              >{t}</button>
            ))}
          </div>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400 font-semibold">{user?.profile?.currency_symbol || '$'}</span>
            <input {...register('amount', { valueAsNumber: true })} type="number" step="0.01" placeholder="0.00" className={`input-base pl-8 text-lg font-bold ${errors.amount ? 'error' : ''}`} />
          </div>
          <input {...register('description')} placeholder="Description" className={`input-base ${errors.description ? 'error' : ''}`} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <select {...register('category')} className={`input-base ${errors.category ? 'error' : ''}`}>
              <option value="">Category</option>
              {filteredCats.map(c => <option key={(c as { id: string }).id} value={(c as { id: string }).id}>{(c as { name: string }).name}</option>)}
            </select>
            <select {...register('account')} className={`input-base ${errors.account ? 'error' : ''}`}>
              <option value="">Account</option>
              {(accs as Array<{ id: string; name: string }>).map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
          <input {...register('date')} type="date" className="input-base" />
          <input {...register('note')} placeholder="Note (optional)" className="input-base" />
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={mutation.isPending} className="btn-primary flex-1">
              {mutation.isPending ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

export default function TransactionsPage() {
  const user = useAuthStore(s => s.user);
  const { toast } = useUIStore();
  const symbol = user?.profile?.currency_symbol || '$';
  const qc = useQueryClient();

  const [search, setSearch] = useState('');
  const [txType, setTxType] = useState('');
  const [page, setPage] = useState(1);
  const [editTx, setEditTx] = useState<Transaction | null | 'new'>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['transactions', { search, txType, page }],
    queryFn: () => transactionsApi.list({
      search: search || undefined,
      transaction_type: txType || undefined,
      page,
      ordering: '-date',
    }),
    placeholderData: prev => prev,
  });

  const deleteMutation = useMutation({
    mutationFn: transactionsApi.delete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transactions'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Transaction deleted.');
    },
    onError: () => toast.error('Failed to delete.'),
  });

  const handleDelete = useCallback((id: string) => {
    if (window.confirm('Delete this transaction?')) deleteMutation.mutate(id);
  }, [deleteMutation]);

  const transactions = data?.results || [];
  const totalPages = data?.total_pages || 1;
  const count = data?.count || 0;

  return (
    <div className="p-4 sm:p-6 max-w-screen-xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold dark:text-white">Transactions</h1>
          <p className="text-sm text-surface-500 dark:text-surface-400 mt-0.5">{count} records</p>
        </div>
        <button onClick={() => setEditTx('new')} className="btn-primary">
          + Add Transaction
        </button>
      </div>

      {/* Filters */}
      <div className="card p-3 sm:p-4 mb-4 flex flex-col sm:flex-row gap-3">
        <div className="relative w-full sm:flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search transactions..."
            className="input-base pl-9"
          />
        </div>
        <select
          value={txType}
          onChange={e => { setTxType(e.target.value); setPage(1); }}
          className="input-base w-full sm:w-auto"
        >
          <option value="">All types</option>
          <option value="income">Income</option>
          <option value="expense">Expense</option>
          <option value="transfer">Transfer</option>
        </select>
        {(search || txType) && (
          <button onClick={() => { setSearch(''); setTxType(''); setPage(1); }} className="btn-ghost self-start sm:self-auto">
            <X className="w-4 h-4" /> Clear
          </button>
        )}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="skeleton h-12 rounded-xl" />
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <ArrowLeftRight className="w-10 h-10 text-surface-300 dark:text-surface-600 mb-3" />
            <p className="text-surface-600 dark:text-surface-300 font-medium">No transactions found</p>
            <p className="text-surface-400 text-sm mt-1">
              {search || txType ? 'Try adjusting your filters.' : 'Add your first transaction above!'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-surface-100 dark:border-surface-700">
                  {['Description', 'Category', 'Account', 'Date', 'Amount', ''].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-50 dark:divide-surface-700/50">
                <AnimatePresence>
                  {transactions.map(tx => (
                    <TransactionRow
                      key={tx.id}
                      tx={tx}
                      symbol={symbol}
                      onEdit={setEditTx}
                      onDelete={handleDelete}
                    />
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-surface-100 dark:border-surface-700">
            <p className="text-sm text-surface-500">Page {page} of {totalPages}</p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => p - 1)}
                disabled={page === 1}
                className="btn-secondary !px-3 !py-1.5 disabled:opacity-30"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={page === totalPages}
                className="btn-secondary !px-3 !py-1.5 disabled:opacity-30"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Edit/Create modal */}
      <AnimatePresence>
        {editTx !== null && (
          <TransactionModal
            tx={editTx === 'new' ? null : editTx}
            onClose={() => setEditTx(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
