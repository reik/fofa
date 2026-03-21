/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#3d7a4f',
          dark:    '#2c5c3a',
          light:   '#e8f5ec',
        },
        accent: {
          DEFAULT: '#e9a23b',
          dark:    '#c8861e',
        },
        surface: '#ffffff',
        bg:      '#f7f5f0',
        border:  '#e2ddd6',
        muted:   '#6b7280',
        light:   '#9ca3af',
      },
      fontFamily: {
        body:    ['Nunito', 'sans-serif'],
        display: ['Lora', 'serif'],
      },
      borderRadius: {
        sm: '6px',
        md: '12px',
        lg: '20px',
        xl: '28px',
        full: '9999px',
      },
      boxShadow: {
        sm: '0 1px 3px rgba(0,0,0,.08)',
        md: '0 4px 16px rgba(0,0,0,.10)',
        lg: '0 8px 32px rgba(0,0,0,.12)',
      },
    },
  },
  plugins: [],
}
