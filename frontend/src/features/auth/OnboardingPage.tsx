import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, DollarSign, Clock, Palette, CheckCircle, ArrowRight, ArrowLeft } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { authApi } from '../../api/auth';
import { useUIStore, applyTheme } from '../../stores/uiStore';

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

const steps = [
  { id: 'currency', title: 'Currency', desc: 'What currency do you use?', icon: DollarSign },
  { id: 'balance', title: 'Opening Balance', desc: 'Your starting monthly balance', icon: DollarSign },
  { id: 'timezone', title: 'Location', desc: 'Your country and timezone', icon: Globe },
  { id: 'theme', title: 'Appearance', desc: 'How would you like FinanceOS to look?', icon: Palette },
];

export default function OnboardingPage() {
  const { user, setUser } = useAuthStore();
  const { setTheme } = useUIStore();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({
    currency: 'USD',
    default_monthly_opening_balance: 0,
    country: '',
    timezone: 'UTC',
    theme: 'system' as 'light' | 'dark' | 'system',
  });

  const next = () => setStep(s => Math.min(s + 1, steps.length - 1));
  const back = () => setStep(s => Math.max(s - 1, 0));

  const finish = async () => {
    setLoading(true);
    try {
      await authApi.completeOnboarding(data);
      setTheme(data.theme);
      applyTheme(data.theme);
      // Update user in store
      const me = await authApi.getMe();
      setUser(me);
      navigate('/');
    } catch {
      // Fall through to dashboard anyway
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const isLast = step === steps.length - 1;
  const currentStep = steps[step];

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-950 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg"
      >
        {/* Progress */}
        <div className="flex items-center gap-2 mb-8">
          {steps.map((s, i) => (
            <div key={s.id} className="flex items-center gap-2 flex-1">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                i < step ? 'bg-income text-white' :
                i === step ? 'bg-brand-600 text-white' :
                'bg-surface-200 dark:bg-surface-700 text-surface-400'
              }`}>
                {i < step ? <CheckCircle className="w-4 h-4" /> : i + 1}
              </div>
              {i < steps.length - 1 && (
                <div className={`flex-1 h-0.5 rounded-full transition-all ${i < step ? 'bg-income' : 'bg-surface-200 dark:bg-surface-700'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="card p-8">
          <div className="mb-6">
            <p className="text-xs font-semibold text-brand-600 dark:text-brand-400 uppercase tracking-wider mb-1">
              Step {step + 1} of {steps.length}
            </p>
            <h1 className="text-2xl font-bold text-surface-900 dark:text-white">{currentStep.title}</h1>
            <p className="text-surface-500 dark:text-surface-400 mt-1">{currentStep.desc}</p>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: .2 }}
            >
              {/* Step 0 — Currency */}
              {step === 0 && (
                <div className="grid grid-cols-2 gap-2 max-h-72 overflow-y-auto">
                  {CURRENCIES.map(c => (
                    <button
                      key={c.code}
                      type="button"
                      onClick={() => setData(d => ({ ...d, currency: c.code }))}
                      className={`flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                        data.currency === c.code
                          ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20'
                          : 'border-surface-200 dark:border-surface-700 hover:border-surface-300'
                      }`}
                    >
                      <span className="text-xl font-bold text-brand-600 dark:text-brand-400 w-6 text-center">{c.symbol}</span>
                      <div>
                        <p className="text-sm font-semibold text-surface-900 dark:text-white">{c.code}</p>
                        <p className="text-xs text-surface-400">{c.name}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Step 1 — Balance */}
              {step === 1 && (
                <div className="space-y-4">
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400 text-2xl font-bold">
                      {CURRENCIES.find(c => c.code === data.currency)?.symbol || '$'}
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      value={data.default_monthly_opening_balance || ''}
                      onChange={e => setData(d => ({ ...d, default_monthly_opening_balance: parseFloat(e.target.value) || 0 }))}
                      placeholder="0.00"
                      className="input-base pl-12 text-2xl font-bold h-16"
                    />
                  </div>
                  <p className="text-xs text-surface-400 dark:text-surface-500">
                    This is your starting balance for each new month. You can always edit this later.
                  </p>
                </div>
              )}

              {/* Step 2 — Timezone */}
              {step === 2 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Country</label>
                    <input
                      type="text"
                      value={data.country}
                      onChange={e => setData(d => ({ ...d, country: e.target.value }))}
                      placeholder="e.g. United States"
                      className="input-base"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Timezone</label>
                    <select
                      value={data.timezone}
                      onChange={e => setData(d => ({ ...d, timezone: e.target.value }))}
                      className="input-base"
                    >
                      {TIMEZONES.map(tz => <option key={tz} value={tz}>{tz}</option>)}
                    </select>
                  </div>
                </div>
              )}

              {/* Step 3 — Theme */}
              {step === 3 && (
                <div className="grid grid-cols-3 gap-3">
                  {([
                    { value: 'light', label: 'Light', emoji: '☀️' },
                    { value: 'dark',  label: 'Dark',  emoji: '🌙' },
                    { value: 'system',label: 'System',emoji: '🖥️' },
                  ] as const).map(t => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => { setData(d => ({ ...d, theme: t.value })); applyTheme(t.value); }}
                      className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                        data.theme === t.value
                          ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20'
                          : 'border-surface-200 dark:border-surface-700'
                      }`}
                    >
                      <span className="text-2xl">{t.emoji}</span>
                      <span className="text-sm font-semibold text-surface-800 dark:text-surface-200">{t.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex gap-3 mt-8">
            {step > 0 && (
              <button onClick={back} className="btn-secondary">
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
            )}
            <button
              onClick={isLast ? finish : next}
              disabled={loading}
              className="btn-primary flex-1"
            >
              {loading ? 'Setting up...' : isLast ? 'Get Started' : 'Continue'}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {!isLast && (
          <button
            onClick={finish}
            className="text-sm text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 mx-auto block mt-4"
          >
            Skip for now
          </button>
        )}
      </motion.div>
    </div>
  );
}
