import { afterEach, describe, expect, it, vi } from 'vitest'
import { useBingoApi } from '../../app/composables/useBingoApi'
import type { DraftCard } from '../../shared/types/bingo'

afterEach(() => {
  vi.unstubAllGlobals()
})

function stubFetch(returnValue: unknown) {
  const fetchMock = vi.fn().mockResolvedValue(returnValue)
  vi.stubGlobal('$fetch', fetchMock)
  return fetchMock
}

describe('useBingoApi', () => {
  it('fetchSummaries は GET /api/cards を呼ぶ', async () => {
    const fetchMock = stubFetch([{ id: '1' }])
    const result = await useBingoApi().fetchSummaries()
    expect(fetchMock).toHaveBeenCalledWith('/api/cards')
    expect(result).toEqual([{ id: '1' }])
  })

  it('fetchCard は GET /api/cards/:id を呼ぶ', async () => {
    const fetchMock = stubFetch({ id: 'abc' })
    await useBingoApi().fetchCard('abc')
    expect(fetchMock).toHaveBeenCalledWith('/api/cards/abc')
  })

  it('fetchAllCards は GET /api/records を呼ぶ', async () => {
    const fetchMock = stubFetch([])
    await useBingoApi().fetchAllCards()
    expect(fetchMock).toHaveBeenCalledWith('/api/records')
  })

  it('createCard は POST /api/cards にドラフトを送る', async () => {
    const fetchMock = stubFetch({ id: 'new' })
    const draft: DraftCard = { name: '太郎', columns: { B: [], I: [], N: [], G: [], O: [] } }
    await useBingoApi().createCard(draft)
    expect(fetchMock).toHaveBeenCalledWith('/api/cards', { method: 'POST', body: draft })
  })

  it('recordRoll は POST /api/cards/:id/rolls に出目を送る', async () => {
    const fetchMock = stubFetch({ card: {}, achievedNow: false, punchedCell: null })
    await useBingoApi().recordRoll('abc', 42)
    expect(fetchMock).toHaveBeenCalledWith('/api/cards/abc/rolls', {
      method: 'POST',
      body: { value: 42 },
    })
  })

  it('deleteRoll は DELETE /api/cards/:id/rolls/:rollId を呼ぶ', async () => {
    const fetchMock = stubFetch({ id: 'abc' })
    await useBingoApi().deleteRoll('abc', 'r1')
    expect(fetchMock).toHaveBeenCalledWith('/api/cards/abc/rolls/r1', { method: 'DELETE' })
  })

  it('archive は POST /api/cards/:id/archive を呼ぶ', async () => {
    const fetchMock = stubFetch({ id: 'abc', archived: true })
    await useBingoApi().archive('abc')
    expect(fetchMock).toHaveBeenCalledWith('/api/cards/abc/archive', { method: 'POST' })
  })

  it('deleteCard は DELETE /api/cards/:id を呼ぶ', async () => {
    const fetchMock = stubFetch({ ok: true })
    await useBingoApi().deleteCard('abc')
    expect(fetchMock).toHaveBeenCalledWith('/api/cards/abc', { method: 'DELETE' })
  })
})
