import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Trash2 } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useUIStore } from '../../stores/uiStore';
import { authApi } from '../../api/auth';
import ThemeToggle from '../../components/ui/ThemeToggle';

const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'NGN', symbol: '₦', name: 'Nigerian Naira' },
  { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar' },
  { code: 'GHS', symbol: 'GH₵', name: 'Ghanaian Cedi' },
  { code: 'ZAR', symbol: 'R', name: 'South African Rand' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
];

const TIMEZONES = [
  'UTC', 'America/New_York', 'America/Chicago', 'America/Denver',
  'America/Los_Angeles', 'Europe/London', 'Europe/Paris', 'Europe/Berlin',
  'Africa/Lagos', 'Africa/Accra', 'Africa/Nairobi', 'Africa/Johannesburg',
  'Asia/Dubai', 'Asia/Kolkata', 'Asia/Singapore', 'Asia/Tokyo',
  'Australia/Sydney',
];

const profileSchema = z.object({
  full_name: z.string().min(2, 'At least 2 characters'),
});

const pwSchema = z.object({
  old_password: z.string().min(1, 'Required'),
  new_password: z.string().min(8, 'Min 8 characters'),
  new_password_confirm: z.string(),
}).refine(d => d.new_password === d.new_password_confirm, {
  message: "Passwords don't match", path: ['new_password_confirm'],
});

const prefSchema = z.object({
  currency: z.string().min(1, 'Required'),
  timezone: z.string().min(1, 'Required'),
  country: z.string().min(1, 'Required'),
  default_monthly_opening_balance: z.number().nonnegative('Must be non-negative'),
});

type ProfileForm = z.infer<typeof profileSchema>;
type PwForm = z.infer<typeof pwSchema>;
type PrefForm = z.infer<typeof prefSchema>;

interface SettingsSectionProps { title: string; description?: string; children: React.ReactNode; }
function SettingsSection({ title, description, children }: SettingsSectionProps) {
  return (
    <div className="card p-6 space-y-4">
      <div>
        <h2 className="font-semibold text-surface-900 dark:text-white">{title}</h2>
        {description && <p className="text-sm text-surface-500 dark:text-surface-400 mt-0.5">{description}</p>}
      </div>
      {children}
    </div>
  );
}

export default function SettingsPage() {
  const { user, setUser, logout } = useAuthStore();
  const { toast } = useUIStore();
  const qc = useQueryClient();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isEditingPref, setIsEditingPref] = useState(false);

  const { register: regProfile, handleSubmit: hProfile, formState: { errors: pErrors, isDirty: pDirty } } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: { full_name: user?.full_name || '' },
  });

  const { register: regPw, handleSubmit: hPw, reset: resetPw, formState: { errors: pwErrors } } = useForm<PwForm>({
    resolver: zodResolver(pwSchema),
  });

  const { register: regPref, handleSubmit: hPref, reset: resetPref, formState: { errors: prefErrors } } = useForm<PrefForm>({
    resolver: zodResolver(prefSchema),
    defaultValues: {
      currency: user?.profile?.currency || 'USD',
      timezone: user?.profile?.timezone || 'UTC',
      country: user?.profile?.country || '',
      default_monthly_opening_balance: user?.profile?.default_monthly_opening_balance ? Number(user.profile.default_monthly_opening_balance) : 0,
    },
  });

  const profileMutation = useMutation({
    mutationFn: (data: ProfileForm) => authApi.updateProfile(data),
    onSuccess: (updated) => { setUser(updated); toast.success('Profile updated!'); },
    onError: () => toast.error('Failed to update profile.'),
  });

  const pwMutation = useMutation({
    mutationFn: (data: PwForm) => authApi.changePassword(data),
    onSuccess: () => { toast.success('Password changed!'); resetPw(); },
    onError: () => toast.error('Incorrect current password.'),
  });

  const prefMutation = useMutation({
    mutationFn: (data: PrefForm) => authApi.updateProfileSettings(data),
    onSuccess: (updatedProfile) => {
      if (user) {
        setUser({ ...user, profile: updatedProfile });
      }
      toast.success('Preferences updated!');
      setIsEditingPref(false);
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      qc.invalidateQueries({ queryKey: ['budgets'] });
    },
    onError: () => toast.error('Failed to update preferences.'),
  });

  const deleteMutation = useMutation({
    mutationFn: () => authApi.deleteAccount(),
    onSuccess: () => { toast.info('Account deleted.'); logout(); },
    onError: () => toast.error('Failed to delete account.'),
  });

  const initials = user?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto space-y-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold dark:text-white">Settings</h1>
        <p className="text-sm text-surface-500 dark:text-surface-400 mt-0.5">Manage your account and preferences</p>
      </div>

      {/* Profile */}
      <SettingsSection title="Profile" description="Update your personal information">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center">
            <span className="text-white text-2xl font-bold">{initials}</span>
          </div>
          <div>
            <p className="font-semibold text-surface-900 dark:text-white">{user?.full_name}</p>
            <p className="text-sm text-surface-500">{user?.email}</p>
          </div>
        </div>
        <form onSubmit={hProfile(d => profileMutation.mutate(d))} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-surface-500 mb-1.5">Full Name</label>
            <input {...regProfile('full_name')} className={`input-base ${pErrors.full_name ? 'error' : ''}`} />
            {pErrors.full_name && <p className="text-xs text-danger mt-1">{pErrors.full_name.message}</p>}
          </div>
          <div>
            <label className="block text-xs font-semibold text-surface-500 mb-1.5">Email</label>
            <input value={user?.email || ''} disabled className="input-base opacity-60 cursor-not-allowed" />
          </div>
          <button type="submit" disabled={!pDirty || profileMutation.isPending} className="btn-primary">
            {profileMutation.isPending ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </SettingsSection>

      {/* Currency & Preferences */}
      <SettingsSection title="Preferences" description="Your financial and display settings">
        {isEditingPref ? (
          <form onSubmit={hPref(d => prefMutation.mutate(d))} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-surface-500 mb-1.5">Currency</label>
                <select {...regPref('currency')} className={`input-base ${prefErrors.currency ? 'error' : ''}`}>
                  {CURRENCIES.map(c => (
                    <option key={c.code} value={c.code}>
                      {c.code} ({c.symbol}) - {c.name}
                    </option>
                  ))}
                </select>
                {prefErrors.currency && <p className="text-xs text-danger mt-1">{prefErrors.currency.message}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-surface-500 mb-1.5">Timezone</label>
                <select {...regPref('timezone')} className={`input-base ${prefErrors.timezone ? 'error' : ''}`}>
                  {TIMEZONES.map(tz => (
                    <option key={tz} value={tz}>
                      {tz}
                    </option>
                  ))}
                </select>
                {prefErrors.timezone && <p className="text-xs text-danger mt-1">{prefErrors.timezone.message}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-surface-500 mb-1.5">Country</label>
                <input {...regPref('country')} placeholder="e.g. United States" className={`input-base ${prefErrors.country ? 'error' : ''}`} />
                {prefErrors.country && <p className="text-xs text-danger mt-1">{prefErrors.country.message}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-surface-500 mb-1.5">Default Opening Balance</label>
                <input
                  {...regPref('default_monthly_opening_balance', { valueAsNumber: true })}
                  type="number"
                  step="0.01"
                  className={`input-base font-mono ${prefErrors.default_monthly_opening_balance ? 'error' : ''}`}
                />
                {prefErrors.default_monthly_opening_balance && (
                  <p className="text-xs text-danger mt-1">{prefErrors.default_monthly_opening_balance.message}</p>
                )}
              </div>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsEditingPref(false);
                  resetPref();
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button type="submit" disabled={prefMutation.isPending} className="btn-primary">
                {prefMutation.isPending ? 'Saving...' : 'Save Preferences'}
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-surface-500 dark:text-surface-400 text-xs mb-1">Currency</p>
                <p className="font-semibold dark:text-white">{user?.profile?.currency} ({user?.profile?.currency_symbol})</p>
              </div>
              <div>
                <p className="text-surface-500 dark:text-surface-400 text-xs mb-1">Timezone</p>
                <p className="font-semibold dark:text-white">{user?.profile?.timezone || 'UTC'}</p>
              </div>
              <div>
                <p className="text-surface-500 dark:text-surface-400 text-xs mb-1">Country</p>
                <p className="font-semibold dark:text-white">{user?.profile?.country || '—'}</p>
              </div>
              <div>
                <p className="text-surface-500 dark:text-surface-400 text-xs mb-1">Default Opening Balance</p>
                <p className="font-semibold dark:text-white font-mono">
                  {user?.profile?.currency_symbol || '$'}
                  {user?.profile?.default_monthly_opening_balance || '0.00'}
                </p>
              </div>
            </div>
            <button onClick={() => setIsEditingPref(true)} className="btn-secondary">
              Edit Preferences
            </button>
          </div>
        )}
      </SettingsSection>

      {/* Appearance */}
      <SettingsSection title="Appearance" description="Customize how FinanceOS looks">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium dark:text-white">Theme</p>
            <p className="text-xs text-surface-400">Choose your preferred color scheme</p>
          </div>
          <ThemeToggle />
        </div>
      </SettingsSection>

      {/* Password */}
      <SettingsSection title="Security" description="Change your password">
        <form onSubmit={hPw(d => pwMutation.mutate(d))} className="space-y-3">
          {[
            { name: 'old_password' as const, label: 'Current Password', err: pwErrors.old_password },
            { name: 'new_password' as const, label: 'New Password', err: pwErrors.new_password },
            { name: 'new_password_confirm' as const, label: 'Confirm New Password', err: pwErrors.new_password_confirm },
          ].map(f => (
            <div key={f.name}>
              <label className="block text-xs font-semibold text-surface-500 mb-1.5">{f.label}</label>
              <input {...regPw(f.name)} type="password" placeholder="••••••••" className={`input-base ${f.err ? 'error' : ''}`} />
              {f.err && <p className="text-xs text-danger mt-1">{f.err.message}</p>}
            </div>
          ))}
          <button type="submit" disabled={pwMutation.isPending} className="btn-primary">
            {pwMutation.isPending ? 'Changing...' : 'Change Password'}
          </button>
        </form>
      </SettingsSection>

      {/* Danger zone */}
      <SettingsSection title="Danger Zone" description="Irreversible actions">
        {!confirmDelete ? (
          <button onClick={() => setConfirmDelete(true)} className="btn-danger">
            <Trash2 className="w-4 h-4" />
            Delete Account
          </button>
        ) : (
          <div className="space-y-3 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
            <p className="text-sm text-red-700 dark:text-red-400 font-medium">
              ⚠️ This will permanently delete all your data. Are you sure?
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(false)} className="btn-secondary text-sm">Cancel</button>
              <button onClick={() => deleteMutation.mutate()} disabled={deleteMutation.isPending} className="btn-danger text-sm">
                {deleteMutation.isPending ? 'Deleting...' : 'Yes, delete my account'}
              </button>
            </div>
          </div>
        )}
      </SettingsSection>
    </div>
  );
}
