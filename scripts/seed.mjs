// 開発環境（`npm run dev:netlify`）へテストデータを投入する。
// 実行: npm run db:seed
// 接続先は環境変数 BINGO_BASE_URL で変更できる（既定: http://localhost:8888）。

import { createLoggingBingoApi, resolveBaseUrl } from './lib/bingoApi.mjs'
import { seedTestCards } from './lib/seedRunner.mjs'

const log = (message) => process.stdout.write(`${message}\n`)

async function main() {
  const baseUrl = resolveBaseUrl()
  log(`テストデータを投入します（接続先: ${baseUrl}）`)
  const created = await seedTestCards(createLoggingBingoApi(baseUrl, log), log)
  log(`完了: ${created} 件のテストデータを投入しました`)
}

main().catch((error) => {
  process.exitCode = 1
  process.stderr.write(`テストデータの投入に失敗しました: ${error.message}\n`)
})
