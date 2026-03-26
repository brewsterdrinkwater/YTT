/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Brand Colors - Warm & Vibrant
        'brand-coral': '#FF6B6B',
        'brand-peach': '#FFEAA7',
        'brand-mint': '#00B894',
        'brand-sky': '#74B9FF',
        'brand-lavender': '#A29BFE',
        'brand-rose': '#FD79A8',
        'brand-sunset': '#E17055',
        'brand-ocean': '#0984E3',

        // Warm Neutrals
        'warm': {
          50: '#FFFBF5',
          100: '#FFF5EB',
          200: '#FFE8D6',
          300: '#DDBEA9',
          400: '#B7A99A',
          500: '#8A817C',
          600: '#6B6057',
          700: '#4A4238',
          800: '#2D2520',
          900: '#1A1512',
        },

        // Legacy compatibility mappings
        'walt-black': '#2D2520',
        'walt-white': '#FFFBF5',
        'tab-red': '#FF6B6B',
        'tab-orange': '#E17055',
        'tab-blue': '#0984E3',
        'memory-blue': '#74B9FF',
        'concrete': '#FFF5EB',
        'steel': '#FFE8D6',
        'charcoal': '#4A4238',
        'slate': '#8A817C',

        // System Colors
        success: '#00B894',
        warning: '#FDCB6E',
        danger: '#FF6B6B',
        info: '#74B9FF',

        // Legacy primary/secondary
        primary: {
          DEFAULT: '#FF6B6B',
          dark: '#E17055',
        },
        secondary: '#8A817C',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        display: ['Inter', '-apple-system', 'sans-serif'],
      },
      fontSize: {
        'hero': ['40px', { lineHeight: '48px', fontWeight: '700' }],
        'h1': ['32px', { lineHeight: '40px', fontWeight: '700' }],
        'h2': ['24px', { lineHeight: '32px', fontWeight: '600' }],
        'h3': ['18px', { lineHeight: '26px', fontWeight: '600' }],
        'body': ['16px', { lineHeight: '24px', fontWeight: '400' }],
        'small': ['14px', { lineHeight: '20px', fontWeight: '400' }],
        'tiny': ['12px', { lineHeight: '16px', fontWeight: '400' }],
      },
      spacing: {
        'xs': '4px',
        'sm': '8px',
        'md': '16px',
        'lg': '24px',
        'xl': '32px',
        '2xl': '48px',
        '3xl': '64px',
        '4xl': '96px',
      },
      boxShadow: {
        'none': 'none',
        'subtle': '0 1px 3px rgba(45,37,32,0.04)',
        'sm': '0 2px 8px rgba(45,37,32,0.06)',
        'md': '0 4px 16px rgba(45,37,32,0.08)',
        'lg': '0 8px 32px rgba(45,37,32,0.12)',
        'glow-coral': '0 4px 20px rgba(255,107,107,0.25)',
        'glow-ocean': '0 4px 20px rgba(9,132,227,0.25)',
        'glow-mint': '0 4px 20px rgba(0,184,148,0.25)',
      },
      borderRadius: {
        'none': '0',
        'sm': '8px',
        'DEFAULT': '12px',
        'md': '12px',
        'lg': '16px',
        'xl': '20px',
        '2xl': '24px',
        '3xl': '32px',
      },
      transitionDuration: {
        DEFAULT: '250ms',
        fast: '150ms',
        normal: '250ms',
        slow: '350ms',
      },
      transitionTimingFunction: {
        DEFAULT: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
        bounce: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      maxWidth: {
        'content': '1200px',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
