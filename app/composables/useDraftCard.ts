import type { DraftCard } from '#shared/types/bingo'

/** 作成ページ〜確認ページ間で保持するドラフト（メモリのみ。リロードで消える） */
export function useDraftCard() {
  return useState<DraftCard | null>('draft-card', () => null)
}
