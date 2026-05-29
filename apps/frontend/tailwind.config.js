/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
    './lib/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans:   ['var(--font-inter)', 'Inter', 'system-ui', 'sans-serif'],
        kanit:  ['var(--font-kanit)', 'Kanit', 'sans-serif'],
        fredoka: ['var(--font-fredoka)', 'Fredoka', 'sans-serif'],
      },
      colors: {
        stadium: {
          950: '#03070f',
          900: '#050c1a',
          800: '#0a1428',
          700: '#0f1e3c',
          600: '#162850',
        },
      },
      animation: {
        'pulse-glow': 'pulseGlow 2.5s ease-in-out infinite',
        'fade-in':    'fadeIn 0.4s ease-out both',
        'slide-up':   'slideUp 0.35s ease-out both',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { opacity: '1',   filter: 'brightness(1)' },
          '50%':      { opacity: '0.8', filter: 'brightness(1.25)' },
        },
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%':   { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
