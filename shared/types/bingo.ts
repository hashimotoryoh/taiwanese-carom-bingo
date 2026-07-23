/** ビンゴカードの列キー */
export type ColumnKey = 'B' | 'I' | 'N' | 'G' | 'O'

/** 列ごとの設定可能な番号レンジ定義 */
export interface ColumnDef {
  key: ColumnKey
  label: ColumnKey
  min: number
  max: number
}

/** サイコロの出目を1回分記録したレコード */
export interface Roll {
  id: string
  /** 出目（1〜120） */
  value: number
  /** 出目を記録した日時（epoch ミリ秒） */
  rolledAt: number
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
  /** 記録した出目の履歴（記録順） */
  rolls: Roll[]
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
  /** 記録した出目の総数（＝カイルン回数） */
  rollCount: number
}

/** 作成ページ〜確認ページ間で受け渡すドラフト（未入力マスはnull） */
export interface DraftCard {
  name: string
  columns: Record<ColumnKey, (number | null)[]>
}

/** 出目記録APIのレスポンス */
export interface RollResult {
  card: BingoCard
  /** この記録で初めてビンゴが成立したか */
  achievedNow: boolean
  /** この記録で新たに穴が開いたマス（既開・カード外はnull）。演出対象 */
  punchedCell: { col: ColumnKey; row: number } | null
}
