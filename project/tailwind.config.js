/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      maxWidth: {
        '8xl': '1920px',
        '9xl': '2000px',
      },
      colors: {
        primary: {
          50: '#ecf8f3',
          100: '#d1ede2',
          200: '#a3dcc4',
          300: '#75caa7',
          400: '#4fb98a',
          500: '#40916C',
          600: '#2D6A4F',
          700: '#225238',
          800: '#183a28',
          900: '#0f2318',
        },
        earth: {
          50: '#f8f4f0',
          100: '#f0e8de',
          200: '#e1d1bd',
          300: '#d3ba9c',
          400: '#c4a37b',
          500: '#A98467',
          600: '#8c6d55',
          700: '#6f5744',
          800: '#524132',
          900: '#352b21',
        },
        success: {
          50: '#e9f7ed',
          100: '#c7ebd3',
          200: '#a5deb9',
          300: '#83d29f',
          400: '#61c585',
          500: '#3fb96b',
          600: '#32a457',
          700: '#268045',
          800: '#195c32',
          900: '#0c381e',
        },
        warning: {
          50: '#fff9eb',
          100: '#feefc9',
          200: '#fde5a7',
          300: '#fcdb85',
          400: '#fbd063',
          500: '#fac641',
          600: '#dfa636',
          700: '#ab812a',
          800: '#805d1f',
          900: '#553e14',
        },
        error: {
          50: '#fdeeee',
          100: '#fbdddd',
          200: '#f7bbbb',
          300: '#f39999',
          400: '#ef7777',
          500: '#eb5555',
          600: '#d84d4d',
          700: '#a83c3c',
          800: '#782b2b',
          900: '#491a1a',
        },
      },
      animation: {
        'tree-grow': 'tree-grow 3s ease-in-out infinite',
        'fade-in-up': 'fade-in-up 1s ease-out forwards',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        'tree-grow': {
          '0%': { transform: 'scale(0.95)' },
          '50%': { transform: 'scale(1.05)' },
          '100%': { transform: 'scale(0.95)' },
        },
        'fade-in-up': {
          '0%': {
            opacity: '0',
            transform: 'translateY(20px)',
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
        'float': {
          '0%, 100%': {
            transform: 'translateY(0)',
          },
          '50%': {
            transform: 'translateY(-10px)',
          },
        },
      },
    },
  },
  plugins: [],
};