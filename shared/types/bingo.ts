/** ビンゴカードの列キー */
export type ColumnKey = 'B' | 'I' | 'N' | 'G' | 'O'

/** 列ごとの設定可能な番号レンジ定義 */
export interface ColumnDef {
  key: ColumnKey
  label: ColumnKey
  min: number
  max: number
}

/** 保存されるビンゴカード本体 */
export interface BingoCard {
  id: string
  name: string
  /** epoch ミリ秒 */
  createdAt: number
  updatedAt: number
  /** 各列5マスの番号。N列の中央はセンター固定値 */
  numbers: Record<ColumnKey, number[]>
  punched: Record<ColumnKey, boolean[]>
  /** 穴を開けた日時（未開はnull） */
  punchedAt: Record<ColumnKey, (number | null)[]>
  archived: boolean
  bingoAchieved: boolean
  bingoAchievedAt: number | null
}

/** 一覧表示用のインデックスエントリ */
export interface BingoCardSummary {
  id: string
  name: string
  createdAt: number
  updatedAt: number
  archived: boolean
  bingoAchieved: boolean
  bingoAchievedAt: number | null
  punchedCount: number
  reachCount: number
}

/** 作成ページ〜確認ページ間で受け渡すドラフト（未入力マスはnull） */
export interface DraftCard {
  name: string
  columns: Record<ColumnKey, (number | null)[]>
}

/** 穴あけトグルAPIのレスポンス */
export interface PunchResult {
  card: BingoCard
  /** このトグルで初めてビンゴが成立したか */
  achievedNow: boolean
}
