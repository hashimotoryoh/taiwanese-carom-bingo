// テストデータの投入・削除の手順。エントリポイント（scripts/seed.mjs・scripts/unseed.mjs）から呼ぶ。

import { buildTestCards } from './testData.mjs'
import { updateCardDates } from './cardDb.mjs'

/**
 * 開発環境のカードをすべて削除する。
 * クリーンな状態からテストデータを投入できるようにするため、テストデータ以外も消す。
 * @returns 削除した件数
 */
export async function removeAllCards(api, log = () => {}) {
  const summaries = await api.listCards()
  for (const card of summaries) {
    await api.deleteCard(card.id)
    log(`  削除: ${card.name}（${card.id}）`)
  }
  return summaries.length
}

/**
 * 投入済みのカードの日時をテストデータの定義どおりに書き換える。
 * 出目の記録日時は API では指定できず記録時刻になってしまうため、DB へ直接書き戻す。
 */
async function applyCardDates(api, sql, spec, cardId) {
  const card = await api.getCard(cardId)
  const rolls = card.rolls.map((roll, i) => {
    const planned = spec.rolls[i]
    if (!planned || planned.value !== roll.value) {
      throw new Error(`出目の並びが定義と一致しません（カード: ${spec.name}、${i + 1}件目）`)
    }
    return { ...roll, rolledAt: planned.rolledAt }
  })
  const lastRolledAt = rolls.at(-1)?.rolledAt ?? spec.createdAt
  await updateCardDates(sql, {
    id: card.id,
    createdAt: spec.createdAt,
    updatedAt: lastRolledAt,
    // ビンゴ成立は最後の出目の時点なので、達成日時もそこに合わせる
    bingoAchievedAt: card.bingoAchieved ? lastRolledAt : null,
    rolls,
  })
}

/**
 * テストデータを投入する。
 * 投入前に開発環境のカードをすべて削除するため、常にクリーンな状態になる。
 * @returns 作成したカード件数
 */
export async function seedTestCards({ api, sql, log = () => {}, now = Date.now() }) {
  log('既存のカードを削除しています...')
  const removed = await removeAllCards(api, log)
  log(`  ${removed} 件削除しました`)

  log('テストデータを投入しています...')
  const cards = buildTestCards(now)
  for (const spec of cards) {
    const created = await api.createCard(spec.draft)
    for (const roll of spec.rolls) {
      await api.recordRoll(created.id, roll.value)
    }
    if (spec.archive) await api.archiveCard(created.id)
    await applyCardDates(api, sql, spec, created.id)
    log(`  作成: ${spec.name}（出目 ${spec.rolls.length} 件） — ${spec.description}`)
  }
  return cards.length
}
