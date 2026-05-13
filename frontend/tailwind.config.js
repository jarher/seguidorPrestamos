export default {
  content: ['./src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: 'var(--surface)',
          container: {
            low: 'var(--surface-container-low)',
            DEFAULT: 'var(--surface-container)',
            high: 'var(--surface-container-high)',
            highest: 'var(--surface-container-highest)'
          }
        },
        'on-surface': 'var(--on-surface)',
        'on-surface-variant': 'var(--on-surface-variant)',
        primary: { 
          DEFAULT: 'var(--primary)', 
          container: 'var(--primary-container)' 
        },
        success: 'var(--success)',
        warning: 'var(--warning)',
        error: 'var(--error)',
        outline: 'var(--outline)'
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif']
      },
      screens: {
        'xs': '320px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px'
      }
    }
  },
  plugins: []
}