/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{html,js,ts,jsx,tsx,css}',
    './**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#3D6F5D',
          light: '#4C8C6E',
          dark: '#2E5445',
        },
        secondary: {
          DEFAULT: '#E5A93D',
          light: '#F2BF5E',
          dark: '#C88A23',
        },
        background: {
          DEFAULT: '#FFFDF9',
          subtle: '#F9F9F6',
          strong: '#F0EFEA',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          hover: '#FAFAFA',
        },
        text: {
          primary: '#1A1A1A',
          secondary: '#5C5C5C',
          inverse: '#FFFFFF',
          muted: '#9C9C9C',
        },
        success: '#4CAF50',
        error: '#E53935',
        border: '#E0E0E0',
        chat: '#E8F5E9',
      },
      boxShadow: {
        card: '0 2px 8px rgba(0,0,0,0.08)',
        float: '0 4px 16px rgba(0,0,0,0.12)',
      },
      borderRadius: {
        'md': '8px',
        'lg': '12px',
        'xl': '16px',
        '2xl': '18px',
      },
      fontFamily: {
        sans: ['Inter', 'Poppins', 'ui-sans-serif', 'system-ui', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
