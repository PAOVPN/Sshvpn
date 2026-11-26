/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          bg: '#0B101B',
          card: '#131B2E',
          cardLight: '#1A2438',
          border: '#23304A',
        },
        cyan: {
          glow: '#00D2FF',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Roboto Mono"', 'monospace'],
      },
      boxShadow: {
        'glow-cyan': '0 0 24px rgba(0, 210, 255, 0.35), 0 0 60px rgba(0, 210, 255, 0.15)',
        'glow-cyan-sm': '0 0 12px rgba(0, 210, 255, 0.3)',
      },
    },
  },
  plugins: [],
};
