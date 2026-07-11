import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { TrendingUp, Mail, Lock, User, Eye, EyeOff, ArrowRight, CheckCircle } from 'lucide-react';
import { useState } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { useUIStore } from '../../stores/uiStore';

const schema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Enter a valid email'),
  password: z.string()
    .min(8, 'At least 8 characters')
    .regex(/[A-Z]/, 'Must contain an uppercase letter')
    .regex(/[0-9]/, 'Must contain a number'),
  password_confirm: z.string(),
}).refine(d => d.password === d.password_confirm, {
  message: "Passwords don't match",
  path: ['password_confirm'],
});

type FormData = z.infer<typeof schema>;

export default function SignupPage() {
  const { register: authRegister, isLoading } = useAuthStore();
  const { toast } = useUIStore();
  const [showPw, setShowPw] = useState(false);
  const navigate = useNavigate();

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const password = watch('password', '');
  const strength = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^a-zA-Z0-9]/.test(password),
  ];
  const strengthCount = strength.filter(Boolean).length;
  const strengthColors = ['bg-danger', 'bg-warning', 'bg-brand-400', 'bg-income'];
  const strengthLabels = ['Weak', 'Fair', 'Good', 'Strong'];

  const onSubmit = async (data: FormData) => {
    try {
      const user = await authRegister(data);
      if (!user.profile?.onboarding_completed) navigate('/onboarding');
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: Record<string, string[]> } };
      const errData = apiErr?.response?.data;
      const msg = errData?.email?.[0] || errData?.password?.[0] || 'Registration failed. Please try again.';
      toast.error(msg);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-[45%] bg-gradient-to-br from-brand-900 via-brand-800 to-brand-950 p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: 'radial-gradient(circle at 30% 20%, #818cf8 0%, transparent 50%), radial-gradient(circle at 80% 80%, #6366f1 0%, transparent 50%)',
        }} />
        <div className="relative flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <span className="text-white font-bold text-xl">FinanceOS</span>
        </div>
        <div className="relative space-y-4">
          <h2 className="text-3xl font-light text-white/90 leading-snug">
            Start your journey to <span className="font-bold text-white">financial clarity.</span>
          </h2>
          <ul className="space-y-3">
            {['Track every dollar, instantly.', 'Smart budget insights.', 'Beautiful analytics.'].map(item => (
              <li key={item} className="flex items-center gap-2 text-white/80 text-sm">
                <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-white/40 text-sm">© 2025 FinanceOS. All rights reserved.</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6 bg-surface-50 dark:bg-surface-950">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-xl bg-brand-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg dark:text-white">FinanceOS</span>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-surface-900 dark:text-white">Create account</h1>
            <p className="text-surface-500 dark:text-surface-400 mt-1 text-sm">Get started for free, no credit card needed.</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Full name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                <input {...register('full_name')} placeholder="John Doe" className={`input-base pl-10 ${errors.full_name ? 'error' : ''}`} />
              </div>
              {errors.full_name && <p className="text-xs text-danger mt-1">{errors.full_name.message}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Email address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                <input {...register('email')} type="email" placeholder="you@example.com" className={`input-base pl-10 ${errors.email ? 'error' : ''}`} />
              </div>
              {errors.email && <p className="text-xs text-danger mt-1">{errors.email.message}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                <input {...register('password')} type={showPw ? 'text' : 'password'} placeholder="Min. 8 characters" className={`input-base pl-10 pr-10 ${errors.password ? 'error' : ''}`} />
                <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {/* Strength bar */}
              {password && (
                <div className="mt-2 space-y-1">
                  <div className="flex gap-1">
                    {[0,1,2,3].map(i => (
                      <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i < strengthCount ? strengthColors[strengthCount - 1] : 'bg-surface-200 dark:bg-surface-700'}`} />
                    ))}
                  </div>
                  <p className="text-xs text-surface-400">{strengthLabels[strengthCount - 1] || 'Enter a password'}</p>
                </div>
              )}
              {errors.password && <p className="text-xs text-danger mt-1">{errors.password.message}</p>}
            </div>

            {/* Confirm */}
            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Confirm password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                <input {...register('password_confirm')} type="password" placeholder="••••••••" className={`input-base pl-10 ${errors.password_confirm ? 'error' : ''}`} />
              </div>
              {errors.password_confirm && <p className="text-xs text-danger mt-1">{errors.password_confirm.message}</p>}
            </div>

            <button type="submit" disabled={isLoading} className="btn-primary w-full mt-2">
              {isLoading ? 'Creating account...' : 'Create account'}
              {!isLoading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          <p className="text-center text-sm text-surface-500 dark:text-surface-400 mt-6">
            Already have an account?{' '}
            <Link to="/auth/login" className="text-brand-600 dark:text-brand-400 font-semibold hover:underline">Sign in</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
