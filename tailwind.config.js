/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/ui/**/*.{ts,tsx,html}'],
  darkMode: 'media',
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: 'var(--figma-color-bg)',
          panel: 'var(--figma-color-bg)',
          subtle: 'var(--figma-color-bg-secondary)',
          input: 'var(--figma-color-bg-secondary)',
          tertiary: 'var(--figma-color-bg-tertiary)',
          hover: 'var(--figma-color-bg-hover)',
          pressed: 'var(--figma-color-bg-pressed)',
          'brand-subtle': 'var(--figma-color-bg-brand-tertiary)',
        },
        border: {
          DEFAULT: 'var(--figma-color-border)',
          subtle: 'var(--figma-color-border)',
          strong: 'var(--figma-color-border-strong)',
          brand: 'var(--figma-color-border-brand)',
        },
        text: {
          DEFAULT: 'var(--figma-color-text)',
          muted: 'var(--figma-color-text-secondary)',
          faint: 'var(--figma-color-text-tertiary)',
          brand: 'var(--figma-color-text-brand)',
          warning: 'var(--figma-color-text-warning)',
          danger: 'var(--figma-color-text-danger)',
          onbrand: 'var(--figma-color-text-onbrand)',
        },
        accent: {
          // Static so opacity modifiers work; matches Figma blue.
          DEFAULT: '#0d99ff',
          hover: '#007be5',
          pressed: '#006bc8',
        },
        brand: {
          DEFAULT: 'var(--figma-color-bg-brand)',
          hover: 'var(--figma-color-bg-brand-hover)',
          pressed: 'var(--figma-color-bg-brand-pressed)',
        },
      },
      borderRadius: {
        none: '0',
        xs: '2px',
        sm: '3px',
        DEFAULT: '5px',
        md: '5px',
        lg: '6px',
        xl: '6px',
        xl2: '6px',
        '2xl': '8px',
        full: '9999px',
      },
      fontFamily: {
        sans: [
          'Inter',
          'Inter Variable',
          '-apple-system',
          'BlinkMacSystemFont',
          'SF Pro Text',
          'system-ui',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
      },
      fontSize: {
        // Compact, Figma-style scale.
        '2xs': ['10px', '14px'],
        xs: ['11px', '16px'],
        sm: ['12px', '16px'],
        base: ['13px', '18px'],
        lg: ['14px', '20px'],
      },
      boxShadow: {
        soft: '0 1px 2px rgba(0, 0, 0, 0.08)',
      },
    },
  },
  plugins: [],
};
