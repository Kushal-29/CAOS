/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Enterprise palette: deep ink navy + a single restrained accent (teal-blue),
        // not the generic terracotta/cream default.
        ink: {
          950: '#0B1220',
          900: '#101a2c',
          800: '#182338',
          700: '#212f49',
          600: '#2c3d5c',
        },
        surface: {
          light: '#F7F8FA',
          dark: '#0B1220',
        },
        accent: {
          DEFAULT: '#2F6FED',
          soft: '#E7EEFE',
          dark: '#1F4FBF',
        },
        success: '#1E9E6B',
        warning: '#C77D12',
        danger: '#D9432E',
      },
      fontFamily: {
        sans: ['"Inter"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 2px 0 rgba(16, 26, 44, 0.06), 0 1px 3px 0 rgba(16, 26, 44, 0.08)',
      },
      borderRadius: {
        xl: '0.875rem',
      },
    },
  },
  plugins: [],
};
