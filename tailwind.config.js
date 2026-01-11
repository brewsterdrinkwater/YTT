/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#667eea',
          dark: '#5568d3',
        },
        secondary: '#764ba2',
        success: '#4caf50',
        warning: '#ff9800',
        danger: '#f44336',
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'sans-serif'],
      },
      boxShadow: {
        'sm': '0 2px 8px rgba(0,0,0,0.1)',
        'md': '0 4px 12px rgba(0,0,0,0.15)',
        'lg': '0 10px 30px rgba(0,0,0,0.2)',
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '20px',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
