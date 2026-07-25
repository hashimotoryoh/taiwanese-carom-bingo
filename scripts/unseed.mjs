// 開発環境（`npm run dev:netlify`）からテストデータを削除する。
// 実行: npm run db:seed:clean
// 削除するのはテストデータ用の接頭辞が付いたカードのみで、手動で作ったカードは残る。

import { createLoggingBingoApi, resolveBaseUrl } from './lib/bingoApi.mjs'
import { removeTestCards } from './lib/seedRunner.mjs'
import { TEST_CARD_NAME_PREFIX } from './lib/testData.mjs'

const log = (message) => process.stdout.write(`${message}\n`)

async function main() {
  const baseUrl = resolveBaseUrl()
  log(`テストデータを削除します（接続先: ${baseUrl}）`)
  log(`対象: 名前が「${TEST_CARD_NAME_PREFIX}」で始まるカード`)
  const removed = await removeTestCards(createLoggingBingoApi(baseUrl, log), log)
  log(`完了: ${removed} 件のテストデータを削除しました`)
}

main().catch((error) => {
  process.exitCode = 1
  process.stderr.write(`テストデータの削除に失敗しました: ${error.message}\n`)
})
