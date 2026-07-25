// 開発環境（`npm run dev:netlify`）のカードをすべて削除する。
// 実行: npm run db:seed:clean
// テストデータかどうかに関わらず、接続先のカードをすべて消す点に注意すること。
// 接続先は環境変数 BINGO_BASE_URL で変更できる（既定: http://localhost:8888）。

import { assertLocalBaseUrl, createLoggingBingoApi, resolveBaseUrl } from './lib/bingoApi.mjs'
import { removeAllCards } from './lib/seedRunner.mjs'

const log = (message) => process.stdout.write(`${message}\n`)

async function main() {
  const baseUrl = resolveBaseUrl()
  assertLocalBaseUrl(baseUrl)
  log(`開発環境のカードをすべて削除します（接続先: ${baseUrl}）`)
  const removed = await removeAllCards(createLoggingBingoApi(baseUrl, log), log)
  log(`完了: ${removed} 件のカードを削除しました`)
}

main().catch((error) => {
  process.exitCode = 1
  process.stderr.write(`カードの削除に失敗しました: ${error.message}\n`)
})
