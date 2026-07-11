import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ToastData, Theme } from '../types';

let toastId = 0;

interface UIState {
  theme: Theme;
  sidebarCollapsed: boolean;
  quickAddOpen: boolean;
  toasts: ToastData[];

  setTheme: (theme: Theme) => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (v: boolean) => void;
  openQuickAdd: () => void;
  closeQuickAdd: () => void;

  addToast: (type: ToastData['type'], message: string) => void;
  removeToast: (id: string) => void;
  toast: {
    success: (msg: string) => void;
    error: (msg: string) => void;
    info: (msg: string) => void;
    warning: (msg: string) => void;
  };
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      theme: 'system',
      sidebarCollapsed: false,
      quickAddOpen: false,
      toasts: [],

      setTheme: (theme) => {
        set({ theme });
        applyTheme(theme);
      },

      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),

      openQuickAdd: () => set({ quickAddOpen: true }),
      closeQuickAdd: () => set({ quickAddOpen: false }),

      addToast: (type, message) => {
        const id = String(++toastId);
        set((s) => ({ toasts: [...s.toasts, { id, type, message }] }));
        setTimeout(() => get().removeToast(id), 4000);
      },

      removeToast: (id) =>
        set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

      toast: {
        success: (msg) => get().addToast('success', msg),
        error: (msg) => get().addToast('error', msg),
        info: (msg) => get().addToast('info', msg),
        warning: (msg) => get().addToast('warning', msg),
      },
    }),
    {
      name: 'finance-ui',
      partialize: (state) => ({ theme: state.theme, sidebarCollapsed: state.sidebarCollapsed }),
    }
  )
);

export function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
  } else if (theme === 'light') {
    root.classList.remove('dark');
  } else {
    // system
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }
}
