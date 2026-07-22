import type { ColumnKey, PunchResult } from '#shared/types/bingo'

const COLUMN_KEYS = COLUMNS.map((c) => c.key)

export default defineEventHandler(async (event): Promise<PunchResult> => {
  const id = getRouterParam(event, 'id')!
  const body = await readBody<{ col?: unknown; row?: unknown }>(event)
  const col = body?.col as ColumnKey
  const row = body?.row as number
  if (!COLUMN_KEYS.includes(col) || !Number.isInteger(row) || row < 0 || row >= GRID_SIZE) {
    throw createError({ statusCode: 400, message: '不正なマス指定です。' })
  }

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
  if (!card.punchedAt) card.punchedAt = emptyPunchedAt()

  const wasCompleted = countCompletedLines(card.punched)
  card.punched[col][row] = !card.punched[col][row]
  card.punchedAt[col][row] = card.punched[col][row] ? Date.now() : null
  const nowCompleted = countCompletedLines(card.punched)
  card.updatedAt = Date.now()

  // 1ラインでも成立したらそのカードは終了。自動アーカイブする
  let achievedNow = false
  if (wasCompleted === 0 && nowCompleted >= 1) {
    card.archived = true
    card.bingoAchieved = true
    card.bingoAchievedAt = card.updatedAt
    achievedNow = true
  }

  await saveCard(card)
  await syncCardToIndex(card)
  return { card, achievedNow }
})
