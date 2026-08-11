import type { Config } from 'tailwindcss'

export default <Partial<Config>>{
  content: ['./components/**/*.{vue,js,ts}', './pages/**/*.vue', './app.vue'],
  theme: {
    extend: {
      colors: {
        ink: '#111317',
        sage: '#145DFF',
        mint: '#F4F7FF',
        cream: '#FFFFFF',
        line: '#DDE2EA',
        terracotta: '#E5484D'
      },
      boxShadow: { soft: '0 12px 35px rgba(31, 51, 40, 0.08)' }
    }
  }
}
