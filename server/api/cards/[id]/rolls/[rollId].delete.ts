import type { BingoCard } from '#shared/types/bingo'

export default defineEventHandler(async (event): Promise<BingoCard> => {
  const id = getRouterParam(event, 'id')!
  const rollId = getRouterParam(event, 'rollId')!

  return withCardLock(id, async () => {
    const card = await loadCard(id)
    if (!card) {
      throw createError({
        statusCode: 404,
        message: '指定されたビンゴカードが見つかりませんでした。',
      })
    }
    // ビンゴ達成などでアーカイブ済みのカードは履歴を閲覧のみとする
    if (card.archived) {
      throw createError({ statusCode: 409, message: 'アーカイブ済みのカードは変更できません。' })
    }

    const exists = card.rolls.some((r) => r.id === rollId)
    if (!exists) {
      throw createError({ statusCode: 404, message: '指定された記録が見つかりませんでした。' })
    }

    // パンチ状態は rolls から導出するため、記録を除去するだけでよい。
    // （同じ出目が他の記録に残っていれば、そのマスは引き続きパンチ済みとして導出される）
    card.rolls = card.rolls.filter((r) => r.id !== rollId)
    card.updatedAt = Date.now()
    await saveCard(card)
    return card
  })
})
