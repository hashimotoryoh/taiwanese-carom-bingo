import type { BingoCard, BingoCardSummary } from '#shared/types/bingo'

const INDEX_KEY = 'index'
const cardKey = (id: string) => `card:${id}`

const storage = () => useStorage('data')

export async function loadCardIndex(): Promise<BingoCardSummary[]> {
  const idx = await storage().getItem<BingoCardSummary[]>(INDEX_KEY)
  return Array.isArray(idx) ? idx : []
}

export async function saveCardIndex(idx: BingoCardSummary[]): Promise<void> {
  await storage().setItem(INDEX_KEY, idx)
}

export async function loadCard(id: string): Promise<BingoCard | null> {
  return (await storage().getItem<BingoCard>(cardKey(id))) ?? null
}

export async function saveCard(card: BingoCard): Promise<void> {
  await storage().setItem(cardKey(card.id), card)
}

export async function removeCard(id: string): Promise<void> {
  await storage().removeItem(cardKey(id))
}

/** カードの現状をインデックスへ反映する（エントリが無ければ追加する） */
export async function syncCardToIndex(card: BingoCard): Promise<void> {
  const idx = await loadCardIndex()
  const summary = toSummary(card)
  const pos = idx.findIndex((c) => c.id === card.id)
  if (pos >= 0) idx[pos] = summary
  else idx.push(summary)
  await saveCardIndex(idx)
}
