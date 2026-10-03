/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'jakarta': ['Plus Jakarta Sans', 'sans-serif'],
        'space': ['Space Grotesk', 'sans-serif'],
        'montserrat': ['Montserrat', 'sans-serif'],
        'sixtyfour': ['Sixtyfour', 'sans-serif'],
        'sans': ['Plus Jakarta Sans', 'Space Grotesk', 'Montserrat', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        'medical': ['Plus Jakarta Sans', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#0062ff',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        ice: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
        },
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#0062ff',
          600: '#0053d6',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        medical: {
          green: '#0062ff',
          'green-light': '#38bdf8',
          'green-dark': '#1d4ed8',
          'green-accent': '#e0f2fe',
          'green-hover': '#0053d6',
          'text-primary': '#0f172a',
          'text-secondary': '#64748b',
          'bg-primary': '#ffffff',
          'bg-secondary': '#f8fafc',
        }
      },
      borderRadius: {
        '3xl': '1.5rem',
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      boxShadow: {
        'subtle': '0 2px 8px -2px rgba(15, 23, 42, 0.05), 0 4px 16px -4px rgba(15, 23, 42, 0.05)',
        'elevated': '0 20px 40px -15px rgba(0, 98, 255, 0.08), 0 8px 16px -6px rgba(15, 23, 42, 0.04)',
        'glow-blue': '0 0 35px -5px rgba(0, 98, 255, 0.3)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-brand': 'linear-gradient(135deg, #0062ff 0%, #0ea5e9 100%)',
        'gradient-glass': 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.6) 100%)',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 12s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-12px)' },
        }
      },
      backdropBlur: {
        'medical': '12px',
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
