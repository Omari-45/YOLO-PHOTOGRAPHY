import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#111827',
        accent: '#c9aa6e',
        surface: '#f8f7f4'
      },
      boxShadow: {
        soft: '0 24px 80px rgba(15, 23, 42, 0.08)'
      }
    }
  },
  plugins: []
};

export default config;
