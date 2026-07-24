import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { BingoCard, BingoCardSummary } from '../../../shared/types/bingo'
import { FREE_VALUE } from '../../../shared/utils/bingo'
import getHandlerImport from '../../../server/api/cards/index.get'
import postHandlerImport from '../../../server/api/cards/index.post'
import { makeEvent } from '../../setup/testEvent'
import type { HttpError } from '../../setup/nitroGlobals'

const getHandler = getHandlerImport as () => Promise<BingoCardSummary[]>
const postHandler = postHandlerImport as (event: ReturnType<typeof makeEvent>) => Promise<BingoCard>

function validBody(name = '新規太郎') {
  return {
    name,
    columns: {
      B: [1, 2, 3, 4, 5],
      I: [25, 26, 27, 28, 29],
      N: [49, 50, FREE_VALUE, 52, 53],
      G: [73, 74, 75, 76, 77],
      O: [97, 98, 99, 100, 103],
    },
  }
}

describe('GET /api/cards', () => {
  it('loadCardIndexの結果をそのまま返す', async () => {
    const summaries = [{ id: '1', name: 'A' } as BingoCardSummary]
    vi.spyOn(globalThis, 'loadCardIndex').mockResolvedValue(summaries)
    const result = await getHandler()
    expect(result).toBe(summaries)
  })
})

describe('POST /api/cards', () => {
  beforeEach(() => {
    vi.spyOn(globalThis, 'loadCardIndex').mockResolvedValue([])
    vi.spyOn(globalThis, 'saveCard').mockResolvedValue(undefined)
  })

  it('正しいドラフトからカードを作成して保存する', async () => {
    const card = await postHandler(makeEvent({}, validBody()))
    expect(card.name).toBe('新規太郎')
    expect(card.numbers.N[2]).toBe(FREE_VALUE)
    expect(card.numbers.B).toEqual([1, 2, 3, 4, 5])
    expect(card.archived).toBe(false)
    expect(card.bingoAchieved).toBe(false)
    expect(card.rolls).toEqual([])
    expect(globalThis.saveCard).toHaveBeenCalledWith(card)
  })

  it('名前未入力ならバリデーションエラー(400)を投げ、保存しない', async () => {
    const err: HttpError = await postHandler(makeEvent({}, validBody(''))).catch((e) => e)
    expect(err.statusCode).toBe(400)
    expect((err.data as { errors: string[] }).errors.length).toBeGreaterThan(0)
    expect(globalThis.saveCard).not.toHaveBeenCalled()
  })

  it('進行中カードと同名なら400を投げる', async () => {
    vi.spyOn(globalThis, 'loadCardIndex').mockResolvedValue([
      { id: 'x', name: '新規太郎', archived: false } as BingoCardSummary,
    ])
    const err: HttpError = await postHandler(makeEvent({}, validBody())).catch((e) => e)
    expect(err.statusCode).toBe(400)
  })

  it('アーカイブ済みカードとの同名は許容する', async () => {
    vi.spyOn(globalThis, 'loadCardIndex').mockResolvedValue([
      { id: 'x', name: '新規太郎', archived: true } as BingoCardSummary,
    ])
    const card = await postHandler(makeEvent({}, validBody()))
    expect(card.name).toBe('新規太郎')
  })
})
