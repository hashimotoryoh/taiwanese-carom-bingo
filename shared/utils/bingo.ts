import type { BingoCard, ColumnDef, ColumnKey, DraftCard, Roll } from '../types/bingo'
import { startOfDay } from './date'

export const COLUMNS: ColumnDef[] = [
  { key: 'B', label: 'B', min: 1, max: 24 },
  { key: 'I', label: 'I', min: 25, max: 48 },
  { key: 'N', label: 'N', min: 49, max: 72 },
  { key: 'G', label: 'G', min: 73, max: 96 },
  { key: 'O', label: 'O', min: 97, max: 120 },
]

/** センターマスの行インデックス（N列の中央） */
export const FREE_ROW = 2
/** センターマス固定値 */
export const FREE_VALUE = 101

export const GRID_SIZE = 5

/** 出目の最小値・最大値（各列レンジの下限〜上限） */
export const MIN_ROLL = 1
export const MAX_ROLL = 120

/** 出目として妥当な値か（1〜120の整数） */
export function isValidRoll(value: unknown): value is number {
  return Number.isInteger(value) && (value as number) >= MIN_ROLL && (value as number) <= MAX_ROLL
}

/** 出目に対応するカード上のマスを探す（値は一意なので最大1つ。無ければnull） */
export function findCell(
  numbers: Record<ColumnKey, number[]>,
  value: number,
): { col: ColumnKey; row: number } | null {
  for (const col of COLUMNS) {
    const row = numbers[col.key].indexOf(value)
    if (row !== -1) return { col: col.key, row }
  }
  return null
}

/** マスの表示ラベル（列アルファベット + 1始まりの行番号。例: N2） */
export function cellLabel(col: ColumnKey, row: number): string {
  return `${col}${row + 1}`
}

/** ゾロ目判定：十進表記が2桁以上かつ全桁が同一の数字（例: 11, 77, 111）。1桁は含めない */
export function isZorome(value: number): boolean {
  return /^(\d)\1+$/.test(String(value))
}

function emptyColumns<T>(fill: T): Record<ColumnKey, T[]> {
  return Object.fromEntries(
    COLUMNS.map((c) => [c.key, Array.from({ length: GRID_SIZE }, () => fill)]),
  ) as Record<ColumnKey, T[]>
}

export function emptyPunched(): Record<ColumnKey, boolean[]> {
  return emptyColumns(false)
}

/** 出目履歴からカードの各マスのパンチ状態を導出する（そのマスの番号が記録済みならパンチ済み） */
export function buildPunched(card: BingoCard): Record<ColumnKey, boolean[]> {
  const values = new Set(card.rolls.map((r) => r.value))
  const punched = emptyPunched()
  for (const col of COLUMNS) {
    for (let r = 0; r < GRID_SIZE; r++) {
      punched[col.key][r] = values.has(card.numbers[col.key][r]!)
    }
  }
  return punched
}

/** 出目履歴から各マスのパンチ日時（同一番号の最先記録時刻。未パンチはnull）を導出する */
export function buildPunchedAt(card: BingoCard): Record<ColumnKey, (number | null)[]> {
  const earliest = new Map<number, number>()
  for (const roll of card.rolls) {
    const prev = earliest.get(roll.value)
    if (prev === undefined || roll.rolledAt < prev) earliest.set(roll.value, roll.rolledAt)
  }
  const at = emptyColumns<number | null>(null)
  for (const col of COLUMNS) {
    for (let r = 0; r < GRID_SIZE; r++) {
      at[col.key][r] = earliest.get(card.numbers[col.key][r]!) ?? null
    }
  }
  return at
}

export function blankDraft(): DraftCard {
  const columns = emptyColumns<number | null>(null)
  columns.N[FREE_ROW] = FREE_VALUE
  return { name: '', columns }
}

/** [列インデックス, 行] の組で構成される全12ライン（横5・縦5・斜め2） */
export function lineList(): [number, number][][] {
  const lines: [number, number][][] = []
  for (let r = 0; r < GRID_SIZE; r++) {
    lines.push([0, 1, 2, 3, 4].map((ci) => [ci, r]))
  }
  for (let ci = 0; ci < GRID_SIZE; ci++) {
    lines.push([0, 1, 2, 3, 4].map((r) => [ci, r]))
  }
  lines.push([0, 1, 2, 3, 4].map((i) => [i, i]))
  lines.push([0, 1, 2, 3, 4].map((i) => [i, GRID_SIZE - 1 - i]))
  return lines
}

export function countPunched(punched: Record<ColumnKey, boolean[]>): number {
  return COLUMNS.reduce((n, c) => n + punched[c.key].filter(Boolean).length, 0)
}

export function countCompletedLines(punched: Record<ColumnKey, boolean[]>): number {
  return lineList().filter((line) => line.every(([ci, r]) => punched[COLUMNS[ci]!.key][r])).length
}

export function countReachLines(punched: Record<ColumnKey, boolean[]>): number {
  return lineList().filter(
    (line) => line.filter(([ci, r]) => punched[COLUMNS[ci]!.key][r]).length === GRID_SIZE - 1,
  ).length
}

export interface ReachCells {
  /** リーチライン上の穴あき済みマス（`列キー:行` 形式） */
  part: Set<string>
  /** あと1つでビンゴになる未開マス（`列キー:行` 形式） */
  target: Set<string>
}

export function reachCells(punched: Record<ColumnKey, boolean[]>): ReachCells {
  const part = new Set<string>()
  const target = new Set<string>()
  lineList().forEach((line) => {
    const punchedInLine = line.filter(([ci, r]) => punched[COLUMNS[ci]!.key][r]).length
    if (punchedInLine !== GRID_SIZE - 1) return
    line.forEach(([ci, r]) => {
      const key = `${COLUMNS[ci]!.key}:${r}`
      if (punched[COLUMNS[ci]!.key][r]) part.add(key)
      else target.add(key)
    })
  })
  return { part, target }
}

function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j]!, arr[i]!]
  }
  return arr
}

export function randomUnique(
  min: number,
  max: number,
  count: number,
  exclude?: number[],
): number[] {
  const pool: number[] = []
  for (let v = min; v <= max; v++) {
    if (exclude?.includes(v)) continue
    pool.push(v)
  }
  return shuffle(pool).slice(0, count)
}

/**
 * ドラフトのバリデーション。エラー文言の配列を返す（正常時は空配列）。
 * @param activeNames 進行中（未アーカイブ）カードの名前一覧。重複チェックに使う
 */
export function validateDraft(draft: DraftCard, activeNames: string[]): string[] {
  const errs: string[] = []
  if (!draft.name) {
    errs.push('あなたのお名前を入力してください。')
  } else if (activeNames.includes(draft.name)) {
    errs.push('その名前のビンゴカードは既に使用中です。別の名前を入力してください。')
  }
  const allValues: number[] = []
  COLUMNS.forEach((col) => {
    for (let r = 0; r < GRID_SIZE; r++) {
      if (col.key === 'N' && r === FREE_ROW) continue
      const v = draft.columns[col.key][r]
      if (v === null || v === undefined || Number.isNaN(v)) {
        errs.push(`${col.label}列に未入力のマスがあります。`)
        continue
      }
      if (col.key === 'O' && v === FREE_VALUE) {
        errs.push(`O列に ${FREE_VALUE} は指定できません（センターマス専用の数字です）。`)
        continue
      }
      if (v < col.min || v > col.max) {
        errs.push(
          `${col.label}列は ${col.min} ~ ${col.max} の範囲で入力してください（入力値: ${v}）。`,
        )
        continue
      }
      allValues.push(v)
    }
  })
  const dup = allValues.filter((v, i) => allValues.indexOf(v) !== i)
  if (dup.length > 0) {
    errs.push(
      `同じ数字を複数のマスに指定することはできません（${[...new Set(dup)].sort((a, b) => a - b).join(', ')}）。`,
    )
  }
  return [...new Set(errs)]
}

/** ドラフトからカードの numbers を組み立てる（センターマスは固定値で上書き） */
export function draftToNumbers(draft: DraftCard): Record<ColumnKey, number[]> {
  const numbers = Object.fromEntries(
    COLUMNS.map((c) => [c.key, draft.columns[c.key].map((v) => v ?? 0)]),
  ) as Record<ColumnKey, number[]>
  numbers.N[FREE_ROW] = FREE_VALUE
  return numbers
}

/** カードから一覧表示用サマリーを組み立てる */
export function toSummary(card: BingoCard) {
  const punched = buildPunched(card)
  return {
    id: card.id,
    name: card.name,
    createdAt: card.createdAt,
    updatedAt: card.updatedAt,
    archived: card.archived,
    bingoAchieved: card.bingoAchieved,
    bingoAchievedAt: card.bingoAchievedAt,
    punchedCount: countPunched(punched),
    reachCount: countReachLines(punched),
    rollCount: card.rolls.length,
  }
}

/** 履歴テーブル1行分の表示データ */
export interface RollHistoryRow {
  roll: Roll
  /** この記録で穴が開いたマスのラベル（重複・カード外はnull） */
  label: string | null
}

/**
 * 出目履歴を表示用に整形する（新しい順）。
 * 各出目について、カード上にあり、かつ同一出目の中で最先に記録されたレコードにのみマスラベルを付ける。
 * （2回目以降の同一出目は「記録のみ」なのでラベルなし）
 */
export function rollHistory(card: BingoCard): RollHistoryRow[] {
  // 記録順（rolledAt昇順・同時刻は配列順）で各出目の最先レコードidを求める
  const ordered = card.rolls
    .map((roll, index) => ({ roll, index }))
    .sort((a, b) => a.roll.rolledAt - b.roll.rolledAt || a.index - b.index)
  const firstIdByValue = new Map<number, string>()
  for (const { roll } of ordered) {
    if (!firstIdByValue.has(roll.value)) firstIdByValue.set(roll.value, roll.id)
  }

  return card.rolls
    .map((roll) => {
      const cell = findCell(card.numbers, roll.value)
      const isFirst = firstIdByValue.get(roll.value) === roll.id
      return {
        roll,
        label: cell && isFirst ? cellLabel(cell.col, cell.row) : null,
      }
    })
    .sort((a, b) => b.roll.rolledAt - a.roll.rolledAt)
}

/** サマリー表示用の集計結果 */
export interface RollStats {
  /** 総カイルン回数（記録した出目の総数） */
  totalRolls: number
  /** 出目の平均値（ゾロ目はマイナスとして計算、100は200として計算） */
  averageValue: number
  /** 総ゾロ目回数 */
  totalZorome: number
  /** ゾロ目割合の百分率（ゾロ目回数 / 記録数 × 100） */
  zoromeRatioPercent: number
  /** パンチ率の百分率（パンチ数 / 記録数 × 100） */
  punchRatePercent: number
}

/** パンチ率の百分率（パンチ数 / 記録数 × 100）。記録が無ければ0 */
export function punchRatePercent(punchedCount: number, rollCount: number): number {
  return rollCount === 0 ? 0 : (punchedCount / rollCount) * 100
}

/**
 * 出目1回あたりの得点の期待値（6148 / 119 ≒ 51.7）。
 * 導出は `app/content/docs/d120-expected-value.md` を参照。
 */
export const ROLL_EXPECTED_VALUE = 6148 / 119

/**
 * 出目1回がゾロ目になる確率の百分率（10 / 120 ≒ 8.3%）。
 * 導出は `app/content/docs/zorome-probability.md` を参照。
 */
export const ZOROME_PROBABILITY_PERCENT = (10 / 120) * 100

/**
 * 平均値の計算に使う出目の値。
 * ゾロ目はマイナス、100（センターマス相当の大当たり）は200として扱うローカルルール。
 */
export function signedRollValue(value: number): number {
  if (isZorome(value)) return -value
  return value === 100 ? 200 : value
}

/** 出目履歴とパンチ数からサマリー統計を計算する（1人・複数カード分の集計いずれにも使う） */
function computeRollStatsFromRolls(rolls: Roll[], punchedCount: number): RollStats {
  const totalRolls = rolls.length
  if (totalRolls === 0) {
    return {
      totalRolls: 0,
      averageValue: 0,
      totalZorome: 0,
      zoromeRatioPercent: 0,
      punchRatePercent: 0,
    }
  }

  const signedSum = rolls.reduce((sum, r) => sum + signedRollValue(r.value), 0)
  const totalZorome = rolls.filter((r) => isZorome(r.value)).length

  return {
    totalRolls,
    averageValue: signedSum / totalRolls,
    totalZorome,
    zoromeRatioPercent: (totalZorome / totalRolls) * 100,
    punchRatePercent: punchRatePercent(punchedCount, totalRolls),
  }
}

/** 出目履歴からサマリー統計を計算する */
export function computeRollStats(card: BingoCard): RollStats {
  return computeRollStatsFromRolls(card.rolls, countPunched(buildPunched(card)))
}

/**
 * 複数カード分の出目履歴をまとめてサマリー統計を計算する。
 * 同じ人物が持つ複数のビンゴカード（進行中・アーカイブ済み問わず）や、
 * 全員分のカードを横断集計する用途。
 */
export function aggregateRollStats(cards: BingoCard[]): RollStats {
  const rolls = cards.flatMap((c) => c.rolls)
  const punchedCount = cards.reduce((sum, c) => sum + countPunched(buildPunched(c)), 0)
  return computeRollStatsFromRolls(rolls, punchedCount)
}

/** 出目の平均値の遷移グラフ1点分（1日分の集計） */
export interface RollAveragePoint {
  /** 対象日の0時（epoch ミリ秒） */
  date: number
  /** その日の記録数 */
  count: number
  /** その日の平均値 */
  average: number
  /** その日までの通算平均値 */
  cumulativeAverage: number
}

/**
 * 複数カード分の出目を記録日ごとにまとめ、平均値の推移を古い順に返す。
 * 平均値は `signedRollValue`（ゾロ目はマイナス・100は200）に従う。記録の無い日は点を作らない。
 */
export function dailyRollAverages(cards: BingoCard[]): RollAveragePoint[] {
  const byDate = new Map<number, { count: number; sum: number }>()
  for (const roll of cards.flatMap((c) => c.rolls)) {
    const date = startOfDay(roll.rolledAt)
    const bucket = byDate.get(date) ?? { count: 0, sum: 0 }
    bucket.count += 1
    bucket.sum += signedRollValue(roll.value)
    byDate.set(date, bucket)
  }

  let cumulativeCount = 0
  let cumulativeSum = 0
  return [...byDate.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([date, { count, sum }]) => {
      cumulativeCount += count
      cumulativeSum += sum
      return {
        date,
        count,
        average: sum / count,
        cumulativeAverage: cumulativeSum / cumulativeCount,
      }
    })
}

/** 複数カード分の出目をまとめて新しい順に返す */
export function crossCardRolls(cards: BingoCard[]): Roll[] {
  return cards.flatMap((card) => card.rolls).sort((a, b) => b.rolledAt - a.rolledAt)
}
