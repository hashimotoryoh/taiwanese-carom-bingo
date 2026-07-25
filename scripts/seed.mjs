// 開発環境（`npm run dev:netlify`）へテストデータを投入する。
// 実行: npm run db:seed
// 投入前に開発環境のカードをすべて削除するため、常にクリーンな状態になる。
// 接続先は環境変数 BINGO_BASE_URL で変更できる（既定: http://localhost:8888）。

import { assertLocalBaseUrl, createLoggingBingoApi, resolveBaseUrl } from './lib/bingoApi.mjs'
import { connectDatabase, resolveConnectionString } from './lib/cardDb.mjs'
import { seedTestCards } from './lib/seedRunner.mjs'

const log = (message) => process.stdout.write(`${message}\n`)

async function main() {
  const baseUrl = resolveBaseUrl()
  assertLocalBaseUrl(baseUrl)

  // 出目の記録日時は API では指定できないため、投入後に日時だけDBへ書き戻す
  const connectionString = await resolveConnectionString()
  if (!connectionString) {
    throw new Error(
      'ローカルDBの接続先が見つかりませんでした。`npm run dev:netlify` を起動した状態で実行してください' +
        '（接続先を明示する場合は環境変数 NETLIFY_DB_URL を指定します）。',
    )
  }

  log(`テストデータを投入します（接続先: ${baseUrl}）`)
  const db = connectDatabase(connectionString)
  try {
    const api = createLoggingBingoApi(baseUrl, log)
    const created = await seedTestCards({ api, sql: db.sql, log })
    log(`完了: ${created} 件のテストデータを投入しました`)
  } finally {
    await db.close()
  }
}

main().catch((error) => {
  process.exitCode = 1
  process.stderr.write(`テストデータの投入に失敗しました: ${error.message}\n`)
})
