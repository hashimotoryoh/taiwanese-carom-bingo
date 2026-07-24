import { execSync } from 'node:child_process'

// ビルド時のコミットハッシュを解決する。
// Netlify などの CI では COMMIT_REF が渡されるためそれを優先し、
// ローカルなど未設定の場合は git から短縮ハッシュを取得する。
function resolveCommitHash(): string {
  const fromEnv = process.env.COMMIT_REF
  if (fromEnv) return fromEnv.slice(0, 7)
  try {
    return execSync('git rev-parse --short HEAD').toString().trim()
  } catch {
    return 'unknown'
  }
}

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxt/eslint'],
  // フロントはSPA。データはサーバーAPI（Nitro）経由で永続化する
  ssr: false,
  typescript: {
    strict: true,
  },
  css: ['~/assets/css/main.css'],
  runtimeConfig: {
    public: {
      // フッター等で表示するビルド時のコミットハッシュ
      commitHash: resolveCommitHash(),
    },
  },
  app: {
    head: {
      htmlAttrs: { lang: 'ja' },
      title: 'カイルンBINGO',
      meta: [{ name: 'robots', content: 'noindex, nofollow, noarchive, nosnippet' }],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Zen+Kaku+Gothic+New:wght@400;500;700;900&family=JetBrains+Mono:wght@400;600;700&display=swap',
        },
      ],
    },
  },
})
