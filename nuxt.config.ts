export default defineNuxtConfig({
  compatibilityDate: '2024-04-03',
  devtools: { enabled: false },
  modules: ['@pinia/nuxt'],
  css: ['~/assets/css/main.css'],
  
  runtimeConfig: {
    telegramBotToken: process.env.TELEGRAM_BOT_TOKEN || process.env.NUXT_TELEGRAM_BOT_TOKEN || '',
    telegramAdminChatId: '',
    supabaseServiceRoleKey: '',
    replicateApiToken: '',
    geminiApiKey: '',
    siteUrl: process.env.NUXT_PUBLIC_SITE_URL || 'https://fabrika.chat',
    public: {
      appName: 'Fabrika',
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL || 'https://fabrika.chat',
      // API manzilni yangi domenimizga moslashtirdik
      apiBase: process.env.NUXT_PUBLIC_API_BASE || 'https://orders.fabrika.chat',
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

  // Xavfsizlik sarlavhalarini Telegram uchun moslash
  routeRules: {
    '/**': {
      headers: {
        'X-Frame-Options': 'ALLOWALL',
        'Content-Security-Policy': "frame-ancestors 'self' https://web.telegram.org https://*.telegram.org;"
      }
    }
  },

  app: {
    head: {
      htmlAttrs: { lang: 'ru' },
      title: 'Fabrika — AI-Powered Custom Clothing',
      titleTemplate: '%s | Fabrika',
      meta: [
        { name: 'theme-color', content: '#145DFF' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
        { name: 'author', content: 'Fabrika' },
        { name: 'robots', content: 'index, follow' },
        { name: 'format-detection', content: 'telephone=no' }
      ],
      link: [
        { rel: 'icon', type: 'image/png', href: '/favicon-32.png' },
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
        { rel: 'manifest', href: '/site.webmanifest' }
      ],
      script: [
        // defer: true olib tashlandi, SDK tezroq yuklanishi uchun
        { src: 'https://telegram.org/js/telegram-web-app.js' }
      ]
    }
  }
})