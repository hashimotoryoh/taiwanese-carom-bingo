import { afterEach, describe, expect, it, vi } from 'vitest'
import type { BingoCard, RollResult } from '../../../shared/types/bingo'
import postRollHandlerImport from '../../../server/api/cards/[id]/rolls.post'
import deleteRollHandlerImport from '../../../server/api/cards/[id]/rolls/[rollId].delete'
import { makeEvent } from '../../setup/testEvent'
import type { HttpError } from '../../setup/nitroGlobals'

const postRollHandler = postRollHandlerImport as (
  event: ReturnType<typeof makeEvent>,
) => Promise<RollResult>
const deleteRollHandler = deleteRollHandlerImport as (
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

afterEach(() => {
  vi.useRealTimers()
})

describe('POST /api/cards/:id/rolls', () => {
  it('出目が範囲外なら400を投げ、カードを読み込まない', async () => {
    const loadCard = vi.spyOn(globalThis, 'loadCard')
    const err: HttpError = await postRollHandler(makeEvent({ id: 'card-1' }, { value: 999 })).catch(
      (e) => e,
    )
    expect(err.statusCode).toBe(400)
    expect(loadCard).not.toHaveBeenCalled()
  })

  it('カードが存在しなければ404を投げる', async () => {
    vi.spyOn(globalThis, 'loadCard').mockResolvedValue(null)
    const err: HttpError = await postRollHandler(makeEvent({ id: 'missing' }, { value: 1 })).catch(
      (e) => e,
    )
    expect(err.statusCode).toBe(404)
  })

  it('アーカイブ済みカードには409を投げる', async () => {
    vi.spyOn(globalThis, 'loadCard').mockResolvedValue(makeCard({ archived: true }))
    const err: HttpError = await postRollHandler(makeEvent({ id: 'card-1' }, { value: 1 })).catch(
      (e) => e,
    )
    expect(err.statusCode).toBe(409)
  })

  it('カード上の値なら該当マスをパンチし、履歴に記録する', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(9999)
    const card = makeCard()
    vi.spyOn(globalThis, 'loadCard').mockResolvedValue(card)
    const saveCard = vi.spyOn(globalThis, 'saveCard').mockResolvedValue(undefined)

    const result = await postRollHandler(makeEvent({ id: 'card-1' }, { value: 1 }))

    expect(result.punchedCell).toEqual({ col: 'B', row: 0 })
    expect(result.achievedNow).toBe(false)
    expect(result.card.rolls).toHaveLength(1)
    expect(result.card.rolls[0]).toMatchObject({ value: 1, rolledAt: 9999 })
    expect(result.card.updatedAt).toBe(9999)
    expect(saveCard).toHaveBeenCalledWith(result.card)
  })

  it('カード上にない値でも履歴には記録し、punchedCellはnull', async () => {
    const card = makeCard()
    vi.spyOn(globalThis, 'loadCard').mockResolvedValue(card)
    vi.spyOn(globalThis, 'saveCard').mockResolvedValue(undefined)

    const result = await postRollHandler(makeEvent({ id: 'card-1' }, { value: 120 }))

    expect(result.punchedCell).toBeNull()
    expect(result.card.rolls).toHaveLength(1)
  })

  it('同じ値を2回記録すると2回目はpunchedCellがnullになる', async () => {
    const card = makeCard({ rolls: [{ id: 'r0', value: 1, rolledAt: 500 }] })
    vi.spyOn(globalThis, 'loadCard').mockResolvedValue(card)
    vi.spyOn(globalThis, 'saveCard').mockResolvedValue(undefined)

    const result = await postRollHandler(makeEvent({ id: 'card-1' }, { value: 1 }))

    expect(result.punchedCell).toBeNull()
    expect(result.card.rolls).toHaveLength(2)
  })

  it('ラインが完成すると自動的にビンゴ達成・アーカイブされる', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(12345)
    // 行1(B1,I1,N1,G1,O1)のうちO1(値98)以外は既に記録済み
    const card = makeCard({
      rolls: [
        { id: 'r1', value: 2, rolledAt: 1 },
        { id: 'r2', value: 26, rolledAt: 2 },
        { id: 'r3', value: 50, rolledAt: 3 },
        { id: 'r4', value: 74, rolledAt: 4 },
      ],
    })
    vi.spyOn(globalThis, 'loadCard').mockResolvedValue(card)
    const saveCard = vi.spyOn(globalThis, 'saveCard').mockResolvedValue(undefined)

    const result = await postRollHandler(makeEvent({ id: 'card-1' }, { value: 98 }))

    expect(result.achievedNow).toBe(true)
    expect(result.punchedCell).toEqual({ col: 'O', row: 1 })
    expect(result.card.archived).toBe(true)
    expect(result.card.bingoAchieved).toBe(true)
    expect(result.card.bingoAchievedAt).toBe(12345)
    expect(saveCard).toHaveBeenCalledWith(result.card)
  })
})

describe('DELETE /api/cards/:id/rolls/:rollId', () => {
  it('カードが存在しなければ404を投げる', async () => {
    vi.spyOn(globalThis, 'loadCard').mockResolvedValue(null)
    const err: HttpError = await deleteRollHandler(
      makeEvent({ id: 'missing', rollId: 'r1' }),
    ).catch((e) => e)
    expect(err.statusCode).toBe(404)
  })

  it('アーカイブ済みカードには409を投げる', async () => {
    vi.spyOn(globalThis, 'loadCard').mockResolvedValue(makeCard({ archived: true }))
    const err: HttpError = await deleteRollHandler(makeEvent({ id: 'card-1', rollId: 'r1' })).catch(
      (e) => e,
    )
    expect(err.statusCode).toBe(409)
  })

  it('存在しない記録IDには404を投げる', async () => {
    vi.spyOn(globalThis, 'loadCard').mockResolvedValue(makeCard({ rolls: [] }))
    const err: HttpError = await deleteRollHandler(
      makeEvent({ id: 'card-1', rollId: 'missing' }),
    ).catch((e) => e)
    expect(err.statusCode).toBe(404)
  })

  it('該当する記録のみを削除する', async () => {
    const card = makeCard({
      rolls: [
        { id: 'r1', value: 1, rolledAt: 100 },
        { id: 'r2', value: 2, rolledAt: 200 },
      ],
    })
    vi.spyOn(globalThis, 'loadCard').mockResolvedValue(card)
    const saveCard = vi.spyOn(globalThis, 'saveCard').mockResolvedValue(undefined)

    const result = await deleteRollHandler(makeEvent({ id: 'card-1', rollId: 'r1' }))

    expect(result.rolls).toEqual([{ id: 'r2', value: 2, rolledAt: 200 }])
    expect(saveCard).toHaveBeenCalledWith(result)
  })
})
