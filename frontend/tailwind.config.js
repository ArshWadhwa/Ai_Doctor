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
      },
      colors: {
        primary: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        medical: {
          green: '#059669',
          'green-light': '#10b981',
          'green-dark': '#047857',
          'green-accent': '#d1fae5',
          'green-hover': '#065f46',
          'text-primary': '#1f2937',
          'text-secondary': '#6b7280',
          'bg-primary': '#ffffff',
          'bg-secondary': '#f9fafb',
        }
      },
      backgroundImage: {
        'gradient-medical': 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
        'gradient-medical-green': 'linear-gradient(135deg, #059669 0%, #047857 100%)',
        'gradient-medical-light': 'linear-gradient(135deg, rgba(5, 150, 105, 0.1) 0%, rgba(4, 120, 87, 0.1) 100%)',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 2s ease-in-out infinite',
        'spin-slow': 'spin 3s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        }
      },
      backdropBlur: {
        'medical': '10px',
      },
      fontFamily: {
        'medical': ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
