/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      colors: {
        // Brand — deep indigo/violet
        brand: {
          50:  '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b',
        },
        // Surface — slate
        surface: {
          50:  '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          850: '#172033',
          900: '#0f172a',
          950: '#080d1a',
        },
        // Semantic
        success: { DEFAULT: '#10b981', light: '#d1fae5', dark: '#065f46' },
        warning: { DEFAULT: '#f59e0b', light: '#fef3c7', dark: '#92400e' },
        danger:  { DEFAULT: '#ef4444', light: '#fee2e2', dark: '#991b1b' },
        income:  { DEFAULT: '#10b981', light: '#d1fae5' },
        expense: { DEFAULT: '#ef4444', light: '#fee2e2' },
      },
      boxShadow: {
        'soft':    '0 1px 3px 0 rgba(0,0,0,.06), 0 1px 2px -1px rgba(0,0,0,.06)',
        'card':    '0 4px 6px -1px rgba(0,0,0,.07), 0 2px 4px -2px rgba(0,0,0,.07)',
        'modal':   '0 20px 25px -5px rgba(0,0,0,.12), 0 8px 10px -6px rgba(0,0,0,.12)',
        'glow':    '0 0 20px rgba(99,102,241,.25)',
        'glow-sm': '0 0 10px rgba(99,102,241,.15)',
        'inner-soft': 'inset 0 1px 2px rgba(0,0,0,.05)',
      },
      borderRadius: {
        'xl':  '12px',
        '2xl': '16px',
        '3xl': '20px',
        '4xl': '28px',
      },
      animation: {
        'fade-in':    'fadeIn .2s ease-out',
        'slide-up':   'slideUp .25s ease-out',
        'slide-down': 'slideDown .25s ease-out',
        'scale-in':   'scaleIn .15s ease-out',
        'shimmer':    'shimmer 1.5s infinite',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
        'spin-slow':  'spin 3s linear infinite',
      },
      keyframes: {
        fadeIn:    { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp:   { from: { transform: 'translateY(8px)', opacity: 0 }, to: { transform: 'translateY(0)', opacity: 1 } },
        slideDown: { from: { transform: 'translateY(-8px)', opacity: 0 }, to: { transform: 'translateY(0)', opacity: 1 } },
        scaleIn:   { from: { transform: 'scale(.95)', opacity: 0 }, to: { transform: 'scale(1)', opacity: 1 } },
        shimmer:   { from: { backgroundPosition: '-200% 0' }, to: { backgroundPosition: '200% 0' } },
        pulseSoft: { '0%,100%': { opacity: 1 }, '50%': { opacity: .6 } },
      },
      backdropBlur: { xs: '2px' },
      transitionTimingFunction: {
        'spring': 'cubic-bezier(.34,1.56,.64,1)',
      },
    },
  },
  plugins: [],
}
