/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Dark theme colors - Negro con plateado
        dark: {
          bg: '#000000',
          bgSecondary: '#0f0f0f',
          bgTertiary: '#1a1a1a',
          border: '#2d2d2d',
          borderLight: '#404040',
          text: '#ffffff',
          textSecondary: '#b0b0b0',
          textMuted: '#808080',
        },
        // Silver gradient colors
        silver: {
          100: '#f8f9fa',
          200: '#e9ecef',
          300: '#dee2e6',
          400: '#ced4da',
          500: '#adb5bd',
          600: '#6c757d',
          700: '#495057',
          800: '#343a40',
          900: '#212529',
        },
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
        success: {
          50: '#f0fdf4',
          500: '#22c55e',
          600: '#16a34a',
        },
        warning: {
          50: '#fffbeb',
          500: '#f59e0b',
          600: '#d97706',
        },
        danger: {
          50: '#fef2f2',
          500: '#ef4444',
          600: '#dc2626',
        }
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'bounce-gentle': 'bounceGentle 2s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        bounceGentle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
      },
      backgroundImage: {
        'gradient-silver': 'linear-gradient(135deg, #C0C0C0 0%, #808080 100%)',
        'gradient-silver-light': 'linear-gradient(135deg, #e8e8e8 0%, #b8b8b8 100%)',
        'gradient-dark': 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
        'gradient-silver-shine': 'linear-gradient(135deg, #E8E8E8 0%, #A8A8A8 50%, #C8C8C8 100%)',
        'gradient-green': 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
        'gradient-green-shine': 'linear-gradient(135deg, #4ade80 0%, #22c55e 50%, #16a34a 100%)',
      }
    },
  },
  plugins: [],
}