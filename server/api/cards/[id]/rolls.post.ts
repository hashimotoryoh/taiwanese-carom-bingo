import type { ColumnKey, RollResult } from '#shared/types/bingo'

export default defineEventHandler(async (event): Promise<RollResult> => {
  const id = getRouterParam(event, 'id')!
  const body = await readBody<{ value?: unknown }>(event)
  const value = body?.value
  if (!isValidRoll(value)) {
    throw createError({
      statusCode: 400,
      message: `出目は ${MIN_ROLL} ~ ${MAX_ROLL} の整数で入力してください。`,
    })
  }

  return withCardLock(id, async () => {
    const card = await loadCard(id)
    if (!card) {
      throw createError({
        statusCode: 404,
        message: '指定されたビンゴカードが見つかりませんでした。',
      })
    }
    if (card.archived) {
      throw createError({ statusCode: 409, message: 'アーカイブ済みのカードは変更できません。' })
    }

    const now = Date.now()
    const wasCompleted = countCompletedLines(buildPunched(card))

    // 対応マスが今回初めて開くか（同じ出目がまだ記録されておらず、カード上に存在する）を先に判定する
    const cell = findCell(card.numbers, value)
    const alreadyRolled = card.rolls.some((r) => r.value === value)
    const punchedCell: { col: ColumnKey; row: number } | null = cell && !alreadyRolled ? cell : null

    // すべての出目を履歴に記録する
    card.rolls.push({ id: crypto.randomUUID(), value, rolledAt: now })
    card.updatedAt = now

    // 1ラインでも成立したらそのカードは終了。自動アーカイブする
    let achievedNow = false
    const nowCompleted = countCompletedLines(buildPunched(card))
    if (wasCompleted === 0 && nowCompleted >= 1) {
      card.archived = true
      card.bingoAchieved = true
      card.bingoAchievedAt = now
      achievedNow = true
    }

    await saveCard(card)
    return { card, achievedNow, punchedCell }
  })
})
