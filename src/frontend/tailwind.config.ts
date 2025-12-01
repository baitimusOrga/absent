import type { Config } from 'tailwindcss';

export default {
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f7ff',
          100: '#dceeff',
          200: '#badbff',
          300: '#91c4ff',
          400: '#62a5ff',
          500: '#3d83ff',
          600: '#2a61db',
          700: '#1f49af',
          800: '#1b3b8a',
          900: '#193571',
        },
      },
    },
  },
  plugins: [],
} satisfies Config;

