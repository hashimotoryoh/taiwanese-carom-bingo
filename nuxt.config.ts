// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxt/eslint'],
  typescript: {
    strict: true,
  },
  app: {
    head: {
      meta: [{ name: 'x-app-version', content: process.env.APP_VERSION }],
    },
  },
})
