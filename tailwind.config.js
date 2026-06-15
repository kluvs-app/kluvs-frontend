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
          'sans': ['IBM Plex Sans', 'system-ui', 'sans-serif'],
          'serif': ['EB Garamond', 'Georgia', 'serif'],
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
            admin: '#006781',
            'admin-on-dark': '#7BA8B8',
            'member-label': '#48A480',
          },
          surface: {
            dark: '#140F0D',
            'dark-raised': '#1A140F',
            'dark-elevated': '#241C17',
            light: '#F2EDE5',
            'light-bar': '#F6F0E7',
            'light-raised': '#FAF6EF',
            'light-elevated': '#E8DECC',
            'light-accent': 'rgba(209, 109, 48, 0.04)',
          },
          divider: {
            dark: '#332B24',
            light: '#E5DCCB',
          },
          content: {
            'dark-primary': '#ffffff',
            'dark-secondary': '#b0b0b0',
            'light-primary': '#1A1A1A',
            'light-secondary': '#666666',
            'light-tertiary': '#7A6C5E',
            'light-placeholder': '#9A8C7E',
            'light-disabled': '#C2B6A8',
          },
          danger: {
            DEFAULT: '#EF4444',
            hover: '#DC2626',
            subtle: 'rgba(239, 68, 68, 0.08)',
            'border-soft': 'rgba(239, 68, 68, 0.20)',
          },
          success: {
            DEFAULT: '#48A480',
            subtle: 'rgba(72, 164, 128, 0.15)',
          },
          status: {
            'primary-subtle': 'rgba(209, 109, 48, 0.08)',
            'primary-border-soft': 'rgba(209, 109, 48, 0.25)',
          },
          overlay: {
            light: 'rgba(0, 0, 0, 0.50)',
            dark: 'rgba(0, 0, 0, 0.70)',
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
