import { describe, expect, it, vi } from 'vitest'
import type { BingoCard } from '../../../shared/types/bingo'
import getHandlerImport from '../../../server/api/cards/[id].get'
import deleteHandlerImport from '../../../server/api/cards/[id].delete'
import archiveHandlerImport from '../../../server/api/cards/[id]/archive.post'
import { makeEvent } from '../../setup/testEvent'
import type { HttpError } from '../../setup/nitroGlobals'

const getHandler = getHandlerImport as (event: ReturnType<typeof makeEvent>) => Promise<BingoCard>
const deleteHandler = deleteHandlerImport as (
  event: ReturnType<typeof makeEvent>,
) => Promise<{ ok: boolean }>
const archiveHandler = archiveHandlerImport as (
  event: ReturnType<typeof makeEvent>,
) => Promise<BingoCard>

function makeCard(overrides: Partial<BingoCard> = {}): BingoCard {
  return {
    id: 'card-1',
    name: 'テスト太郎',
    createdAt: 1000,
    updatedAt: 1000,
    numbers: {
      B: [1, 2, 3, 4, 5],
      I: [25, 26, 27, 28, 29],
      N: [49, 50, 101, 52, 53],
      G: [73, 74, 75, 76, 77],
      O: [97, 98, 99, 100, 103],
    },
    rolls: [],
    archived: false,
    bingoAchieved: false,
    bingoAchievedAt: null,
    ...overrides,
  }
}

describe('GET /api/cards/:id', () => {
  it('カードが存在すれば返す', async () => {
    const card = makeCard()
    vi.spyOn(globalThis, 'loadCard').mockResolvedValue(card)
    const result = await getHandler(makeEvent({ id: 'card-1' }))
    expect(result).toBe(card)
  })

  it('カードが存在しなければ404を投げる', async () => {
    vi.spyOn(globalThis, 'loadCard').mockResolvedValue(null)
    const err: HttpError = await getHandler(makeEvent({ id: 'missing' })).catch((e) => e)
    expect(err.statusCode).toBe(404)
  })
})

describe('DELETE /api/cards/:id', () => {
  it('removeCardを呼んで { ok: true } を返す', async () => {
    const removeCard = vi.spyOn(globalThis, 'removeCard').mockResolvedValue(undefined)
    const result = await deleteHandler(makeEvent({ id: 'card-1' }))
    expect(result).toEqual({ ok: true })
    expect(removeCard).toHaveBeenCalledWith('card-1')
  })
})

describe('POST /api/cards/:id/archive', () => {
  it('カードが存在しなければ404を投げる', async () => {
    vi.spyOn(globalThis, 'loadCard').mockResolvedValue(null)
    const err: HttpError = await archiveHandler(makeEvent({ id: 'missing' })).catch((e) => e)
    expect(err.statusCode).toBe(404)
  })

  it('未アーカイブのカードをアーカイブして保存する', async () => {
    const card = makeCard({ archived: false })
    vi.spyOn(globalThis, 'loadCard').mockResolvedValue(card)
    const saveCard = vi.spyOn(globalThis, 'saveCard').mockResolvedValue(undefined)
    const result = await archiveHandler(makeEvent({ id: 'card-1' }))
    expect(result.archived).toBe(true)
    expect(saveCard).toHaveBeenCalledWith(card)
  })

  it('既にアーカイブ済みなら保存せず冪等に返す', async () => {
    const card = makeCard({ archived: true, updatedAt: 5000 })
    vi.spyOn(globalThis, 'loadCard').mockResolvedValue(card)
    const saveCard = vi.spyOn(globalThis, 'saveCard').mockResolvedValue(undefined)
    const result = await archiveHandler(makeEvent({ id: 'card-1' }))
    expect(result.updatedAt).toBe(5000)
    expect(saveCard).not.toHaveBeenCalled()
  })
})
