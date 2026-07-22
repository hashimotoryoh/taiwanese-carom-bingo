import type { BingoCard, BingoCardSummary, DraftCard, PunchResult } from '#shared/types/bingo'

/** サーバーAPI呼び出しの薄いラッパー */
export function useBingoApi() {
  return {
    fetchSummaries: () => $fetch<BingoCardSummary[]>('/api/cards'),
    fetchCard: (id: string) => $fetch<BingoCard>(`/api/cards/${id}`),
    createCard: (draft: DraftCard) =>
      $fetch<BingoCard>('/api/cards', { method: 'POST', body: draft }),
    punch: (id: string, col: string, row: number) =>
      $fetch<PunchResult>(`/api/cards/${id}/punch`, { method: 'POST', body: { col, row } }),
    archive: (id: string) => $fetch<BingoCard>(`/api/cards/${id}/archive`, { method: 'POST' }),
    deleteCard: (id: string) => $fetch(`/api/cards/${id}`, { method: 'DELETE' }),
  }
}
