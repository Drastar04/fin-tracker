import { Sun, Moon, Monitor } from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';
import type { Theme } from '../../types';

interface Props { collapsed?: boolean }

const themes: { value: Theme; icon: React.ElementType; label: string }[] = [
  { value: 'light',  icon: Sun,     label: 'Light' },
  { value: 'dark',   icon: Moon,    label: 'Dark' },
  { value: 'system', icon: Monitor, label: 'System' },
];

export default function ThemeToggle({ collapsed }: Props) {
  const { theme, setTheme } = useUIStore();

  if (collapsed) {
    const current = themes.find(t => t.value === theme)!;
    const Icon = current.icon;
    const nextTheme = themes[(themes.findIndex(t => t.value === theme) + 1) % 3].value;
    return (
      <button
        onClick={() => setTheme(nextTheme)}
        className="btn-icon w-full justify-center"
        title={`Theme: ${current.label}`}
      >
        <Icon className="w-4 h-4" />
      </button>
    );
  }

  return (
    <div className="flex items-center bg-surface-100 dark:bg-surface-800 rounded-xl p-1 gap-0.5">
      {themes.map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          onClick={() => setTheme(value)}
          title={label}
          className={`flex-1 flex items-center justify-center py-1.5 rounded-lg transition-all duration-150 ${
            theme === value
              ? 'bg-white dark:bg-surface-700 shadow-soft text-brand-600 dark:text-brand-400'
              : 'text-surface-400 hover:text-surface-600 dark:hover:text-surface-300'
          }`}
        >
          <Icon className="w-3.5 h-3.5" />
        </button>
      ))}
    </div>
  );
}
