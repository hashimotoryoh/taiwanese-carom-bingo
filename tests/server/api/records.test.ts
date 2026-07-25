import { describe, expect, it, vi } from 'vitest'
import type { BingoCard } from '../../../shared/types/bingo'
import handlerImport from '../../../server/api/records/index.get'

const handler = handlerImport as () => Promise<BingoCard[]>

describe('GET /api/records', () => {
  it('loadAllCardsの結果をそのまま返す', async () => {
    const cards = [{ id: '1' } as BingoCard]
    vi.spyOn(globalThis, 'loadAllCards').mockResolvedValue(cards)
    const result = await handler()
    expect(result).toBe(cards)
  })
})
