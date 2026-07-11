import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, ArrowLeftRight, PieChart, BarChart3,
  Settings, Plus, Menu, X, TrendingUp, LogOut,
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useUIStore } from '../../stores/uiStore';
import QuickAddModal from '../modals/QuickAddModal';
import ToastContainer from '../ui/ToastContainer';
import ThemeToggle from '../ui/ThemeToggle';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard',    end: true },
  { to: '/transactions', icon: ArrowLeftRight, label: 'Transactions' },
  { to: '/budget', icon: PieChart, label: 'Budget' },
  { to: '/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

const pageVariants = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0, transition: { duration: .2, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] } },
  exit:    { opacity: 0, y: -6, transition: { duration: .15 } },
};

export default function AppLayout() {
  const { user, logout } = useAuthStore();
  const { sidebarCollapsed, toggleSidebar, setSidebarCollapsed, openQuickAdd, quickAddOpen } = useUIStore();
  const location = useLocation();

  const initials = user?.full_name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'U';

  return (
    <div className="flex h-screen overflow-hidden bg-surface-50 dark:bg-surface-950">
      {/* Sidebar Backdrop for mobile */}
      {!sidebarCollapsed && (
        <div 
          className="fixed inset-0 bg-black/45 backdrop-blur-sm z-40 md:hidden animate-fade-in"
          onClick={() => setSidebarCollapsed(true)}
        />
      )}

      {/* ── Sidebar ────────────────────────────────────────────────────────── */}
      <aside className={`
        fixed md:relative inset-y-0 left-0 z-50
        flex-shrink-0 flex flex-col h-full
        bg-white dark:bg-surface-900
        border-r border-surface-100 dark:border-surface-800
        transition-transform md:transition-all duration-300 ease-spring
        ${sidebarCollapsed ? '-translate-x-full md:translate-x-0 md:w-[68px]' : 'translate-x-0 md:w-[240px]'}
        shadow-modal md:shadow-none
      `}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-surface-100 dark:border-surface-800">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center flex-shrink-0 shadow-glow-sm">
            <TrendingUp className="w-4 h-4 text-white" strokeWidth={2.5} />
          </div>
          {!sidebarCollapsed && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="font-bold text-lg text-surface-900 dark:text-white tracking-tight"
            >
              FinanceOS
            </motion.span>
          )}
          <button
            onClick={toggleSidebar}
            className="btn-icon ml-auto"
            aria-label="Toggle sidebar"
          >
            {sidebarCollapsed ? <Menu className="w-4 h-4" /> : <X className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-0.5">
          {navItems.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => {
                if (window.innerWidth < 768) {
                  setSidebarCollapsed(true);
                }
              }}
              className={({ isActive }) =>
                `nav-item ${isActive ? 'active' : ''} ${sidebarCollapsed ? 'justify-center px-0' : ''}`
              }
              title={sidebarCollapsed ? label : undefined}
            >
              <Icon className="w-[18px] h-[18px] flex-shrink-0" />
              {!sidebarCollapsed && (
                <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  {label}
                </motion.span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Bottom section */}
        <div className="px-2 py-4 border-t border-surface-100 dark:border-surface-800 space-y-2">
          <ThemeToggle collapsed={sidebarCollapsed} />
          {/* User avatar */}
          <div className={`flex items-center gap-2.5 px-2 py-2 rounded-xl ${sidebarCollapsed ? 'justify-center' : ''}`}>
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-bold">{initials}</span>
            </div>
            {!sidebarCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-surface-900 dark:text-white truncate">
                  {user?.full_name}
                </p>
                <p className="text-xs text-surface-400 truncate">{user?.email}</p>
              </div>
            )}
            {!sidebarCollapsed && (
              <button
                onClick={() => logout()}
                className="btn-icon !p-1.5"
                title="Sign out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* ── Main content ───────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Top Bar */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 bg-white dark:bg-surface-900 border-b border-surface-100 dark:border-surface-800 z-30 flex-shrink-0">
          <button
            onClick={() => setSidebarCollapsed(false)}
            className="btn-icon"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-bold text-base text-surface-900 dark:text-white tracking-tight">FinanceOS</span>
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center">
            <span className="text-white text-xs font-bold">{initials}</span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="min-h-full"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* ── FAB — Quick Add ────────────────────────────────────────────────── */}
      <motion.button
        onClick={openQuickAdd}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-2xl bg-brand-600 text-white shadow-glow flex items-center justify-center"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Quick add transaction"
      >
        <Plus className="w-6 h-6" strokeWidth={2.5} />
      </motion.button>

      {/* ── Modals & Toasts ────────────────────────────────────────────────── */}
      <AnimatePresence>
        {quickAddOpen && <QuickAddModal />}
      </AnimatePresence>
      <ToastContainer />
    </div>
  );
}
