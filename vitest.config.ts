import { fileURLToPath } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vitest/config'
import AutoImport from 'unplugin-auto-import/vite'

// shared/utils・app/composablesのnamed exportをまとめて自動インポート対象にする
// （Nuxtの自動インポートを模してVue SFCのtemplateでも解決できるようにするため）
const BINGO_UTILS = [
  'COLUMNS',
  'FREE_ROW',
  'FREE_VALUE',
  'GRID_SIZE',
  'MIN_ROLL',
  'MAX_ROLL',
  'isValidRoll',
  'findCell',
  'cellLabel',
  'isZorome',
  'emptyPunched',
  'buildPunched',
  'buildPunchedAt',
  'blankDraft',
  'lineList',
  'countPunched',
  'countCompletedLines',
  'countReachLines',
  'reachCells',
  'randomUnique',
  'validateDraft',
  'draftToNumbers',
  'toSummary',
  'rollHistory',
  'punchRatePercent',
  'ROLL_EXPECTED_VALUE',
  'ZOROME_PROBABILITY_PERCENT',
  'expectedZoromeCount',
  'signedRollValue',
  'computeRollStats',
  'aggregateRollStats',
  'dailyRollAverages',
  'crossCardRolls',
]

export default defineConfig({
  plugins: [
    AutoImport({
      // app/**/*.vue のみが対象（server/shared/composablesの単体テストはglobalThisスタブ方式のまま）
      include: [/\.vue$/, /\.vue\?vue/],
      // <template>内で直接参照している識別子（fmtDate・navigateToなど）も解決対象にする
      vueTemplate: true,
      dts: false,
      imports: [
        'vue',
        { from: '#shared/utils/bingo', imports: BINGO_UTILS },
        {
          from: '#shared/utils/date',
          imports: ['fmtDate', 'fmtDateTime', 'fmtShortDate', 'startOfDay', 'daysBetween'],
        },
        { from: '#shared/utils/number', imports: ['fmtNum', 'fmtStat'] },
        {
          from: '#test-stubs/nuxtStubs',
          imports: [
            'navigateTo',
            'useRoute',
            'useHead',
            'useFetch',
            'useAsyncData',
            'useRuntimeConfig',
            'clearError',
          ],
        },
        { from: '#composables/useBingoApi', imports: ['useBingoApi'] },
        {
          from: '#composables/useBreadcrumbs',
          imports: ['useBreadcrumbs', 'useBreadcrumbsState'],
        },
        { from: '#composables/useConfetti', imports: ['useConfetti'] },
        { from: '#composables/useDraftCard', imports: ['useDraftCard'] },
        { from: '#composables/useRulesModal', imports: ['useRulesModal'] },
        { from: '#composables/useElementWidth', imports: ['useElementWidth'] },
        { from: '#utils/chart', imports: ['paddedDomain', 'sampledIndexes'] },
        { from: '#utils/markdown', imports: ['renderMarkdown', 'extractTitle'] },
        {
          from: '#utils/docs',
          imports: ['docList', 'getDoc', 'EXPECTED_VALUE_DOC_PATH', 'ZOROME_PROBABILITY_DOC_PATH'],
        },
      ],
    }),
    vue(),
  ],
  resolve: {
    alias: {
      '#shared': fileURLToPath(new URL('./shared', import.meta.url)),
      '#composables': fileURLToPath(new URL('./app/composables', import.meta.url)),
      '#utils': fileURLToPath(new URL('./app/utils', import.meta.url)),
      '#test-stubs': fileURLToPath(new URL('./tests/setup', import.meta.url)),
    },
  },
  test: {
    // コンポーネント／ページ／レイアウトのテストがDOM操作を必要とするためhappy-domを使う
    // （サーバー・共有ロジックのテストにも影響はない）
    environment: 'happy-dom',
    include: ['tests/**/*.test.ts'],
    setupFiles: ['./tests/setup/nitroGlobals.ts', './tests/setup/nuxtGlobals.ts'],
    restoreMocks: true,
    // restoreMocksはvi.spyOnの復元が主目的で、素のvi.fn()（tests/setup/nuxtStubs.tsなど）の
    // 呼び出し履歴はクリアされないため、clearMocksも併用してテスト間の汚染を防ぐ
    clearMocks: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary', 'html'],
      // テストから一度も読み込まれないファイルも計測対象に含め、
      // 「テストが無いファイル」がカバレッジ集計から漏れないようにする
      all: true,
      include: ['app/**/*.{ts,vue}', 'server/**/*.ts', 'shared/**/*.ts'],
      thresholds: {
        statements: 90,
        branches: 80,
        functions: 85,
        lines: 90,
      },
    },
  },
})
