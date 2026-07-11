import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from './stores/authStore';
import { useUIStore, applyTheme } from './stores/uiStore';

// Lazy-loaded pages
import { lazy, Suspense } from 'react';
import AppLayout from './components/layout/AppLayout';
import PageLoader from './components/ui/PageLoader';

const LoginPage    = lazy(() => import('./features/auth/LoginPage'));
const SignupPage   = lazy(() => import('./features/auth/SignupPage'));
const Onboarding   = lazy(() => import('./features/auth/OnboardingPage'));
const Dashboard    = lazy(() => import('./features/dashboard/DashboardPage'));
const Transactions = lazy(() => import('./features/transactions/TransactionsPage'));
const BudgetPage   = lazy(() => import('./features/budget/BudgetPage'));
const AnalyticsPage= lazy(() => import('./features/analytics/AnalyticsPage'));
const SettingsPage = lazy(() => import('./features/settings/SettingsPage'));

// ── TanStack Query client ──────────────────────────────────────────────────────
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // 2 minutes
      gcTime: 1000 * 60 * 10,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// ── Protected route wrapper ────────────────────────────────────────────────────
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/auth/login" replace />;
  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  if (isAuthenticated && user?.profile?.onboarding_completed) return <Navigate to="/" replace />;
  if (isAuthenticated && !user?.profile?.onboarding_completed) return <Navigate to="/onboarding" replace />;
  return <>{children}</>;
}

// ── App ────────────────────────────────────────────────────────────────────────
export default function App() {
  const { initialize } = useAuthStore();
  const { theme } = useUIStore();

  useEffect(() => {
    // Apply saved theme
    applyTheme(theme);

    // Listen for system theme changes
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => { if (theme === 'system') applyTheme('system'); };
    mq.addEventListener('change', handler);

    // Initialize auth
    initialize();

    return () => mq.removeEventListener('change', handler);
  }, [theme, initialize]);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Public routes */}
            <Route path="/auth/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
            <Route path="/auth/signup" element={<PublicRoute><SignupPage /></PublicRoute>} />

            {/* Onboarding */}
            <Route path="/onboarding" element={
              <ProtectedRoute><Onboarding /></ProtectedRoute>
            } />

            {/* App routes — inside layout */}
            <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
              <Route index element={<Dashboard />} />
              <Route path="transactions" element={<Transactions />} />
              <Route path="budget" element={<BudgetPage />} />
              <Route path="analytics" element={<AnalyticsPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
