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

    const target = card.rolls.find((r) => r.id === rollId)
    if (!target) {
      throw createError({ statusCode: 404, message: '指定された記録が見つかりませんでした。' })
    }

    card.rolls = card.rolls.filter((r) => r.id !== rollId)

    // 同じ出目が他の記録に残っていなければ、対応マスをアンパンチする
    const stillRolled = card.rolls.some((r) => r.value === target.value)
    if (!stillRolled) {
      const cell = findCell(card.numbers, target.value)
      if (cell) {
        card.punched[cell.col][cell.row] = false
        card.punchedAt[cell.col][cell.row] = null
      }
    }

    card.updatedAt = Date.now()
    await saveCard(card)
    return card
  })
})
