export default {
  content: ['./src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: '#11121e',
          container: {
            low: '#1a1b27',
            DEFAULT: '#1e1f2b',
            high: '#252633',
            highest: '#333441'
          }
        },
        'on-surface': '#e3e2e7',
        'on-surface-variant': '#9ca3af',
        primary: { DEFAULT: '#adc6ff', container: '#4d8eff' },
        success: '#4edea3',
        warning: '#ffb95f',
        error: '#ffb4ab',
        outline: 'rgba(73, 69, 79, 0.15)'
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