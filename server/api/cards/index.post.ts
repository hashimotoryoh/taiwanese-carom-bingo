import type { BingoCard, DraftCard } from '#shared/types/bingo'

/** リクエストボディを安全にドラフト形式へ正規化する */
function parseDraft(body: unknown): DraftCard {
  const raw = (body ?? {}) as { name?: unknown; columns?: unknown }
  const draft = blankDraft()
  draft.name = typeof raw.name === 'string' ? raw.name.trim() : ''
  const rawColumns = (raw.columns ?? {}) as Record<string, unknown>
  COLUMNS.forEach((col) => {
    const arr = rawColumns[col.key]
    if (!Array.isArray(arr)) return
    for (let r = 0; r < GRID_SIZE; r++) {
      if (col.key === 'N' && r === FREE_ROW) continue
      const v = arr[r]
      draft.columns[col.key][r] = typeof v === 'number' && Number.isFinite(v) ? v : null
    }
  })
  return draft
}

export default defineEventHandler(async (event): Promise<BingoCard> => {
  const draft = parseDraft(await readBody(event))

  const idx = await loadCardIndex()
  const activeNames = idx.filter((c) => !c.archived).map((c) => c.name)
  const errors = validateDraft(draft, activeNames)
  if (errors.length > 0) {
    throw createError({
      statusCode: 400,
      message: '入力内容に誤りがあります。',
      data: { errors },
    })
  }

  const now = Date.now()
  const card: BingoCard = {
    id: crypto.randomUUID(),
    name: draft.name,
    createdAt: now,
    updatedAt: now,
    numbers: draftToNumbers(draft),
    punched: emptyPunched(),
    punchedAt: emptyPunchedAt(),
    archived: false,
    bingoAchieved: false,
    bingoAchievedAt: null,
  }
  await saveCard(card)
  return card
})
