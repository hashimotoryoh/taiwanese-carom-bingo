import type { BingoCard, BingoCardSummary, DraftCard, RollResult } from '#shared/types/bingo'

/** サーバーAPI呼び出しの薄いラッパー */
export function useBingoApi() {
  return {
    fetchSummaries: () => $fetch<BingoCardSummary[]>('/api/cards'),
    fetchCard: (id: string) => $fetch<BingoCard>(`/api/cards/${id}`),
    fetchAllCards: () => $fetch<BingoCard[]>('/api/records'),
    createCard: (draft: DraftCard) =>
      $fetch<BingoCard>('/api/cards', { method: 'POST', body: draft }),
    recordRoll: (id: string, value: number) =>
      $fetch<RollResult>(`/api/cards/${id}/rolls`, { method: 'POST', body: { value } }),
    deleteRoll: (id: string, rollId: string) =>
      $fetch<BingoCard>(`/api/cards/${id}/rolls/${rollId}`, { method: 'DELETE' }),
    archive: (id: string) => $fetch<BingoCard>(`/api/cards/${id}/archive`, { method: 'POST' }),
    deleteCard: (id: string) => $fetch(`/api/cards/${id}`, { method: 'DELETE' }),
  }
}
