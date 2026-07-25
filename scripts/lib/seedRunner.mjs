// テストデータの投入・削除の手順。エントリポイント（scripts/seed.mjs・scripts/unseed.mjs）から呼ぶ。

import { buildTestCards, isTestCardName } from './testData.mjs'

/**
 * テストデータのカードをすべて削除する。
 * 削除対象は名前が接頭辞に一致するカードのみで、手動で作ったカードには触れない。
 * @returns 削除した件数
 */
export async function removeTestCards(api, log = () => {}) {
  const summaries = await api.listCards()
  const targets = summaries.filter((card) => isTestCardName(card.name))
  for (const card of targets) {
    await api.deleteCard(card.id)
    log(`  削除: ${card.name}（${card.id}）`)
  }
  return targets.length
}

/**
 * テストデータを投入する。既存のテストデータは事前に削除するため、常にクリーンな状態になる。
 * @returns 作成したカード件数
 */
export async function seedTestCards(api, log = () => {}) {
  log('既存のテストデータを削除しています...')
  const removed = await removeTestCards(api, log)
  log(`  ${removed} 件削除しました`)

  log('テストデータを投入しています...')
  const cards = buildTestCards()
  for (const spec of cards) {
    const created = await api.createCard(spec.draft)
    for (const value of spec.rolls) {
      await api.recordRoll(created.id, value)
    }
    if (spec.archive) await api.archiveCard(created.id)
    log(`  作成: ${spec.name}（出目 ${spec.rolls.length} 件） — ${spec.description}`)
  }
  return cards.length
}
