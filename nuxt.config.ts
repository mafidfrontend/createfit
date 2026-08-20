export default defineNuxtConfig({
  compatibilityDate: '2024-04-03',
  devtools: { enabled: false },
  modules: ['@pinia/nuxt'],
  css: ['~/assets/css/main.css'],
  runtimeConfig: {
    telegramBotToken: '',
    telegramAdminChatId: '',
    supabaseServiceRoleKey: '',
    replicateApiToken: '',
    geminiApiKey: '',
    public: {
      appName: 'CreateFit',
      supabaseUrl: '',
      supabaseAnonKey: ''
    }
  },
  postcss: {
    plugins: {
      tailwindcss: {},
      autoprefixer: {}
    }
  },
  app: {
    head: {
      title: 'CreateFit — одежда по вашему дизайну',
      meta: [
        { name: 'theme-color', content: '#f7f8f4' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' }
      ]
    }
  }
})
