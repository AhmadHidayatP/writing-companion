/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Georgia', 'serif'],
      },
      colors: {
        ink: {
          50:  '#f7f6f3',
          100: '#eeece6',
          200: '#d9d5c9',
          300: '#b8b2a0',
          400: '#928a75',
          500: '#766d57',
          600: '#5e5644',
          700: '#4a4335',
          800: '#3a3429',
          900: '#2a261e',
          950: '#1a1710',
        },
        accent: {
          50:  '#fef4ee',
          100: '#fde6d3',
          200: '#fac9a5',
          300: '#f6a36d',
          400: '#f17132',
          500: '#ee5314',
          600: '#df3c0c',
          700: '#b92c0c',
          800: '#932512',
          900: '#772112',
        },
      },
    },
  },
  plugins: [],
}
