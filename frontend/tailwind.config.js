/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Libro Brand Colors - Warm & Cozy
        libro: {
          // Primary coral/salmon - from the app's action buttons
          coral: {
            50: '#fef5f3',
            100: '#fee9e5',
            200: '#fdd7cf',
            300: '#fabcae',
            400: '#f59384',
            500: '#ec6b5b', // Main coral - action buttons
            600: '#d94d3d',
            700: '#b63d2f',
            800: '#97352b',
            900: '#7d3129',
          },
          // Warm beige/cream backgrounds
          cream: {
            50: '#fefdfb',
            100: '#fdfaf5',
            200: '#faf4ea',
            300: '#f5ebda',
            400: '#eddfc5',
            500: '#e4d0ab',
          },
          // Warm gray for text and borders
          warmgray: {
            50: '#fafaf9',
            100: '#f5f5f4',
            200: '#e7e5e4',
            300: '#d6d3d1',
            400: '#a8a29e',
            500: '#78716c',
            600: '#57534e',
            700: '#44403c',
            800: '#292524',
            900: '#1c1917',
          },
          // Accent blue for navigation/tabs
          blue: {
            50: '#eff6ff',
            100: '#dbeafe',
            200: '#bfdbfe',
            300: '#93c5fd',
            400: '#60a5fa',
            500: '#3b82f6',
            600: '#2563eb',
            700: '#1d4ed8',
          },
          // Success green
          green: {
            50: '#f0fdf4',
            100: '#dcfce7',
            200: '#bbf7d0',
            300: '#86efac',
            400: '#4ade80',
            500: '#22c55e',
            600: '#16a34a',
          },
          // Warning amber
          amber: {
            50: '#fffbeb',
            100: '#fef3c7',
            200: '#fde68a',
            300: '#fcd34d',
            400: '#fbbf24',
            500: '#f59e0b',
          },
        },
      },
      fontFamily: {
        sans: ['Inter', 'Segoe UI', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'warm': '0 4px 20px -2px rgba(236, 107, 91, 0.15)',
      },
    },
  },
  plugins: [],
}
