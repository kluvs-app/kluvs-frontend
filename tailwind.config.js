/** @type {import('tailwindcss').Config} */
export default {
    content: [
      "./index.html",
      "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
      extend: {
        fontFamily: {
          'sans': ['Inter', 'system-ui', 'sans-serif'],
        },
        colors: {
          primary: {
            DEFAULT: '#D16D30',
            hover: '#B85A22',
            light: '#E8944D',
          },
          secondary: {
            DEFAULT: '#48A480',
            hover: '#3A8A6A',
          },
          tertiary: {
            DEFAULT: '#006781',
            hover: '#005568',
          },
          discord: {
            DEFAULT: '#5865F2',
            hover: '#4752C4',
          },
          google: {
            bg: '#F2F2F2',
            'bg-hover': '#EEEEEE',
            text: '#1F1F1F',
            stroke: '#D1D1D1',
          },
          role: {
            owner: '#C9900A',
          },
          surface: {
            dark: '#0a0a0a',
            'dark-raised': '#141414',
            'dark-elevated': '#1a1a1a',
            light: '#fafafc',
            'light-raised': '#f5f5f5',
            'light-elevated': '#eeeeee',
          },
          divider: {
            dark: '#2a2a2a',
            light: '#e0e0e0',
          },
          content: {
            'dark-primary': '#ffffff',
            'dark-secondary': '#b0b0b0',
            'light-primary': '#1a1a1a',
            'light-secondary': '#666666',
          },
          danger: {
            DEFAULT: '#EF4444',
            hover: '#DC2626',
          },
          success: {
            DEFAULT: '#48A480',
          },
        },
        fontSize: {
          'page-heading': ['1.875rem', { lineHeight: '2.25rem', fontWeight: '700' }],
          'section-heading': ['1.25rem', { lineHeight: '1.75rem', fontWeight: '700' }],
          'card-heading': ['1.125rem', { lineHeight: '1.5rem', fontWeight: '700' }],
          'body-lg': ['1rem', { lineHeight: '1.5rem', fontWeight: '400' }],
          'body': ['0.875rem', { lineHeight: '1.25rem', fontWeight: '400' }],
          'helper': ['0.8125rem', { lineHeight: '1.125rem', fontWeight: '400' }],
          'helper-sm': ['0.75rem', { lineHeight: '1rem', fontWeight: '400' }],
        },
        borderRadius: {
          'input': '0.5rem',
          'btn': '0.75rem',
          'card': '0.75rem',
        },
        animation: {
          'spin-slow': 'spin 3s linear infinite',
        },
      },
    },
    plugins: [require('@tailwindcss/typography')],
    future: {
      hoverOnlyWhenSupported: true,
    },
  }
