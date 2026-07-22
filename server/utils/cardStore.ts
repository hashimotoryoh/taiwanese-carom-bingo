import type { BingoCard, BingoCardSummary } from '#shared/types/bingo'

const INDEX_KEY = 'index'
const cardKey = (id: string) => `card:${id}`

const storage = () => useStorage('data')

const locks = new Map<string, Promise<unknown>>()

/**
 * 同一キーへの処理を直列化する簡易ミューテックス。
 * 同一プロセス内でのread-modify-writeの競合（例: 連続パンチによるlost update）を防ぐ。
 */
function withLock<T>(key: string, task: () => Promise<T>): Promise<T> {
  const prev = locks.get(key) ?? Promise.resolve()
  const run = prev.then(task, task)
  const marker = run.catch(() => undefined)
  locks.set(key, marker)
  marker.finally(() => {
    if (locks.get(key) === marker) locks.delete(key)
  })
  return run
}

/** カード単位の排他制御 */
export function withCardLock<T>(id: string, task: () => Promise<T>): Promise<T> {
  return withLock(cardKey(id), task)
}

/** カード一覧インデックス（共有キー）の排他制御 */
export function withIndexLock<T>(task: () => Promise<T>): Promise<T> {
  return withLock(INDEX_KEY, task)
}

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
  await withIndexLock(async () => {
    const idx = await loadCardIndex()
    const summary = toSummary(card)
    const pos = idx.findIndex((c) => c.id === card.id)
    if (pos >= 0) idx[pos] = summary
    else idx.push(summary)
    await saveCardIndex(idx)
  })
}
