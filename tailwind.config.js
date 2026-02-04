/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Walt-tab Brand Colors
        'walt-black': '#000000',
        'walt-white': '#FFFFFF',

        // Accent Colors
        'tab-red': '#FF0000',
        'memory-blue': '#0055FF',

        // Neutrals
        'concrete': '#F5F5F5',
        'steel': '#E0E0E0',
        'charcoal': '#333333',
        'slate': '#666666',

        // System Colors
        success: '#00CC66',
        warning: '#FFAA00',
        danger: '#FF3333',
        info: '#0055FF',

        // Legacy support (mapped to new system)
        primary: {
          DEFAULT: '#000000',
          dark: '#000000',
        },
        secondary: '#666666',
      },
      fontFamily: {
        sans: ['Futura', 'Century Gothic', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        display: ['Futura', 'Century Gothic', 'sans-serif'],
      },
      fontSize: {
        'hero': ['48px', { lineHeight: '56px', fontWeight: '700' }],
        'h1': ['36px', { lineHeight: '44px', fontWeight: '700' }],
        'h2': ['28px', { lineHeight: '36px', fontWeight: '600' }],
        'h3': ['20px', { lineHeight: '28px', fontWeight: '600' }],
        'body': ['16px', { lineHeight: '24px', fontWeight: '400' }],
        'small': ['14px', { lineHeight: '20px', fontWeight: '400' }],
        'tiny': ['12px', { lineHeight: '16px', fontWeight: '400' }],
      },
      spacing: {
        // 8px grid system
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
        'subtle': '0 1px 3px rgba(0,0,0,0.05)',
        'sm': '0 2px 8px rgba(0,0,0,0.08)',
        'md': '0 4px 12px rgba(0,0,0,0.1)',
        'lg': '0 10px 30px rgba(0,0,0,0.15)',
      },
      borderRadius: {
        'none': '0',
        'sm': '2px',
        'DEFAULT': '4px',
        'md': '4px',
        'lg': '8px',
        'xl': '12px',
        '2xl': '16px',
      },
      transitionDuration: {
        DEFAULT: '200ms',
        fast: '150ms',
        normal: '200ms',
        slow: '300ms',
      },
      transitionTimingFunction: {
        DEFAULT: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
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
