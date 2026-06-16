/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        bg: {
          primary: '#0f172a',
          secondary: '#1e293b',
          tertiary: '#334155'
        },
        accent: {
          blue: '#3b82f6',
          violet: '#8b5cf6',
          emerald: '#10b981',
          red: '#ef4444',
          amber: '#f59e0b'
        },
        text: {
          primary: '#f8fafc',
          secondary: '#94a3b8'
        },
        "tertiary-container": "#cc4204",
        "tertiary": "#a33200",
        "on-secondary-container": "#004b65",
        "on-primary": "#ffffff",
        "primary-fixed": "#dae1ff",
        "error-container": "#ffdad6",
        "inverse-on-surface": "#eff0fd",
        "surface": "#faf8ff",
        "on-surface-variant": "#424656",
        "surface-dim": "#d8d9e6",
        "on-secondary-fixed-variant": "#004d67",
        "on-secondary-fixed": "#001e2b",
        "on-error-container": "#93000a",
        "primary-container": "#0066ff",
        "primary-fixed-dim": "#b3c5ff",
        "surface-container-high": "#e6e7f4",
        "tertiary-fixed": "#ffdbd0",
        "secondary-fixed": "#c2e8ff",
        "on-error": "#ffffff",
        "on-primary-fixed": "#001849",
        "secondary": "#006688",
        "on-primary-container": "#f8f7ff",
        "surface-variant": "#e1e2ee",
        "tertiary-fixed-dim": "#ffb59d",
        "inverse-surface": "#2e303a",
        "secondary-container": "#00c1fd",
        "on-secondary": "#ffffff",
        "outline": "#727687",
        "outline-variant": "#c2c6d8",
        "on-tertiary": "#ffffff",
        "on-tertiary-fixed-variant": "#832600",
        "surface-container": "#ecedfa",
        "background": "#faf8ff",
        "surface-tint": "#0054d6",
        "surface-container-low": "#f2f3ff",
        "on-background": "#191b24",
        "on-tertiary-fixed": "#390c00",
        "on-primary-fixed-variant": "#003fa4",
        "on-tertiary-container": "#fff6f4",
        "inverse-primary": "#b3c5ff",
        "error": "#ba1a1a",
        "surface-container-lowest": "#ffffff",
        "on-surface": "#191b24",
        "secondary-fixed-dim": "#75d1ff",
        "surface-bright": "#faf8ff",
        "surface-container-highest": "#e1e2ee",
        "primary": "#0050cb"
      },
      spacing: {
        "margin-desktop": "40px",
        "section-gap": "80px",
        "gutter": "24px",
        "margin-mobile": "16px",
        "container-max": "1280px"
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        "label-md": ["Inter"],
        "headline-lg": ["Inter"],
        "headline-lg-mobile": ["Inter"],
        "body-md": ["Inter"],
        "body-lg": ["Inter"],
        "label-sm": ["Inter"],
        "headline-md": ["Inter"],
        "display-lg": ["Inter"]
      },
      fontSize: {
        "label-md": ["14px", {"lineHeight": "20px", "letterSpacing": "0.01em", "fontWeight": "500"}],
        "headline-lg": ["32px", {"lineHeight": "40px", "letterSpacing": "-0.01em", "fontWeight": "600"}],
        "headline-lg-mobile": ["28px", {"lineHeight": "36px", "fontWeight": "600"}],
        "body-md": ["16px", {"lineHeight": "24px", "fontWeight": "400"}],
        "body-lg": ["18px", {"lineHeight": "28px", "fontWeight": "400"}],
        "label-sm": ["12px", {"lineHeight": "16px", "fontWeight": "600"}],
        "headline-md": ["24px", {"lineHeight": "32px", "fontWeight": "600"}],
        "display-lg": ["48px", {"lineHeight": "56px", "letterSpacing": "-0.02em", "fontWeight": "700"}]
      },
      keyframes: {
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-down': {
          '0%': { opacity: '0', transform: 'translateY(-20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'scale-in': 'scale-in 0.2s ease-out',
        'fade-in': 'fade-in 0.2s ease-out',
        'slide-down': 'slide-down 0.3s ease-out',
      }
    },
  },
  plugins: [],
}
