import { getDatabase } from '@netlify/database'
import type { BingoCard, BingoCardSummary } from '#shared/types/bingo'

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
  void marker.finally(() => {
    if (locks.get(key) === marker) locks.delete(key)
  })
  return run
}

/** カード単位の排他制御 */
export function withCardLock<T>(id: string, task: () => Promise<T>): Promise<T> {
  return withLock(`card:${id}`, task)
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** cardsテーブルの1行。BIGINT列はnode-postgresが文字列で返す */
interface CardRow {
  id: string
  name: string
  created_at: string
  updated_at: string
  numbers: BingoCard['numbers']
  rolls: BingoCard['rolls']
  archived: boolean
  bingo_achieved: boolean
  bingo_achieved_at: string | null
}

/** DB行をアプリの型へ変換する（BIGINT文字列の数値化を一元化。行アクセスは必ずここを通す） */
function rowToCard(row: CardRow): BingoCard {
  return {
    id: row.id,
    name: row.name,
    createdAt: Number(row.created_at),
    updatedAt: Number(row.updated_at),
    numbers: row.numbers,
    rolls: row.rolls ?? [],
    archived: row.archived,
    bingoAchieved: row.bingo_achieved,
    bingoAchievedAt: row.bingo_achieved_at === null ? null : Number(row.bingo_achieved_at),
  }
}

export async function loadCardIndex(): Promise<BingoCardSummary[]> {
  const { sql } = getDatabase()
  const rows = await sql<CardRow>`SELECT * FROM cards ORDER BY created_at DESC`
  return rows.map((row) => toSummary(rowToCard(row)))
}

export async function loadCard(id: string): Promise<BingoCard | null> {
  // 非UUID文字列をUUID列に渡すとpgがエラーを投げるため、事前に弾いて404挙動を維持する
  if (!UUID_RE.test(id)) return null
  const { sql } = getDatabase()
  const rows = await sql<CardRow>`SELECT * FROM cards WHERE id = ${id}`
  return rows[0] ? rowToCard(rows[0]) : null
}

export async function saveCard(card: BingoCard): Promise<void> {
  const { sql } = getDatabase()
  await sql`
    INSERT INTO cards (
      id, name, created_at, updated_at,
      numbers, rolls,
      archived, bingo_achieved, bingo_achieved_at
    ) VALUES (
      ${card.id}, ${card.name}, ${card.createdAt}, ${card.updatedAt},
      ${JSON.stringify(card.numbers)}::jsonb,
      ${JSON.stringify(card.rolls)}::jsonb,
      ${card.archived}, ${card.bingoAchieved}, ${card.bingoAchievedAt}
    )
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      updated_at = EXCLUDED.updated_at,
      numbers = EXCLUDED.numbers,
      rolls = EXCLUDED.rolls,
      archived = EXCLUDED.archived,
      bingo_achieved = EXCLUDED.bingo_achieved,
      bingo_achieved_at = EXCLUDED.bingo_achieved_at
  `
}

export async function removeCard(id: string): Promise<void> {
  if (!UUID_RE.test(id)) return
  const { sql } = getDatabase()
  await sql`DELETE FROM cards WHERE id = ${id}`
}
