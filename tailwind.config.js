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
            'member-label': '#F2EDE5',
            'member-label-light': '#140F0D',
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
        typography: {
          DEFAULT: {
            css: {
              // DS families (design-system/docs/typography.md): body = Body L, headings = Headline/Title (serif, medium), code = Mono
              fontSize: '16px',
              lineHeight: '24px',
              letterSpacing: '0.5px',
              p: { fontSize: '16px', lineHeight: '24px', letterSpacing: '0.5px' },
              li: { fontSize: '16px', lineHeight: '24px', letterSpacing: '0.5px' },
              strong: { fontWeight: '500' },
              h1: { fontFamily: "'EB Garamond', Georgia, serif", fontWeight: '500', fontSize: '30px', lineHeight: '36px', letterSpacing: '0' },
              h2: { fontFamily: "'EB Garamond', Georgia, serif", fontWeight: '500', fontSize: '24px', lineHeight: '30px', letterSpacing: '0' },
              h3: { fontFamily: "'EB Garamond', Georgia, serif", fontWeight: '500', fontSize: '19px', lineHeight: '24px', letterSpacing: '0' },
              h4: { fontFamily: "'EB Garamond', Georgia, serif", fontWeight: '500', fontSize: '15px', lineHeight: '20px', letterSpacing: '0' },
              code: { fontFamily: "ui-monospace, 'SF Mono', monospace", fontWeight: '400', fontSize: '13px', lineHeight: '18px', letterSpacing: '0' },
            },
          },
        },
        borderRadius: {
          'sm': '0.25rem',
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
