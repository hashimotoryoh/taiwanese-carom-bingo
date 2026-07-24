import { getDatabase } from '@netlify/database'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { BingoCard } from '../../shared/types/bingo'
import {
  loadAllCards,
  loadCard,
  loadCardIndex,
  removeCard,
  saveCard,
  withCardLock,
} from '../../server/utils/cardStore'

const VALID_UUID = '11111111-1111-1111-1111-111111111111'

function makeCard(overrides: Partial<BingoCard> = {}): BingoCard {
  return {
    id: VALID_UUID,
    name: 'テスト太郎',
    createdAt: 1000,
    updatedAt: 2000,
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

function makeRow(overrides: Record<string, unknown> = {}) {
  return {
    id: VALID_UUID,
    name: 'テスト太郎',
    created_at: '1000',
    updated_at: '2000',
    numbers: makeCard().numbers,
    rolls: null,
    archived: false,
    bingo_achieved: false,
    bingo_achieved_at: null,
    ...overrides,
  }
}

const mockSql = vi.fn()

beforeEach(() => {
  mockSql.mockReset()
  vi.mocked(getDatabase).mockReturnValue({
    sql: mockSql,
  } as unknown as ReturnType<typeof getDatabase>)
})

describe('loadCardIndex', () => {
  it('DB行を BingoCardSummary の配列へ変換する', async () => {
    mockSql.mockResolvedValueOnce([makeRow()])
    const result = await loadCardIndex()
    expect(result).toEqual([
      {
        id: VALID_UUID,
        name: 'テスト太郎',
        createdAt: 1000,
        updatedAt: 2000,
        archived: false,
        bingoAchieved: false,
        bingoAchievedAt: null,
        punchedCount: 0,
        reachCount: 0,
        rollCount: 0,
      },
    ])
  })
})

describe('loadAllCards', () => {
  it('DB行を BingoCard の配列へ変換する（rollsがnullなら空配列）', async () => {
    mockSql.mockResolvedValueOnce([makeRow({ rolls: null })])
    const result = await loadAllCards()
    expect(result[0]!.rolls).toEqual([])
    expect(result[0]!.createdAt).toBe(1000)
    expect(result[0]!.updatedAt).toBe(2000)
  })
})

describe('loadCard', () => {
  it('UUID形式でない場合はDBを呼ばずnullを返す', async () => {
    const result = await loadCard('not-a-uuid')
    expect(result).toBeNull()
    expect(mockSql).not.toHaveBeenCalled()
  })

  it('該当行がない場合はnullを返す', async () => {
    mockSql.mockResolvedValueOnce([])
    const result = await loadCard(VALID_UUID)
    expect(result).toBeNull()
  })

  it('BIGINT文字列を数値に変換して返す', async () => {
    mockSql.mockResolvedValueOnce([makeRow({ bingo_achieved_at: '5000' })])
    const result = await loadCard(VALID_UUID)
    expect(result).toMatchObject({
      id: VALID_UUID,
      createdAt: 1000,
      updatedAt: 2000,
      bingoAchievedAt: 5000,
    })
  })
})

describe('saveCard', () => {
  it('カードの内容をJSONB文字列化してINSERTする', async () => {
    mockSql.mockResolvedValueOnce(undefined)
    const card = makeCard({ rolls: [{ id: 'r1', value: 1, rolledAt: 100 }] })
    await saveCard(card)
    expect(mockSql).toHaveBeenCalledTimes(1)
    const [, ...values] = mockSql.mock.calls[0]!
    expect(values).toEqual([
      card.id,
      card.name,
      card.createdAt,
      card.updatedAt,
      JSON.stringify(card.numbers),
      JSON.stringify(card.rolls),
      card.archived,
      card.bingoAchieved,
      card.bingoAchievedAt,
    ])
  })
})

describe('removeCard', () => {
  it('UUID形式でない場合はDBを呼ばない', async () => {
    await removeCard('not-a-uuid')
    expect(mockSql).not.toHaveBeenCalled()
  })

  it('有効なIDならDELETEを実行する', async () => {
    mockSql.mockResolvedValueOnce(undefined)
    await removeCard(VALID_UUID)
    expect(mockSql).toHaveBeenCalledTimes(1)
    const [, ...values] = mockSql.mock.calls[0]!
    expect(values).toEqual([VALID_UUID])
  })
})

describe('withCardLock', () => {
  it('同一キーへの処理を投入順に直列化する', async () => {
    const order: number[] = []
    const run = (n: number) =>
      withCardLock('card-x', async () => {
        order.push(n)
        await new Promise((resolve) => setTimeout(resolve, 0))
        order.push(-n)
      })
    await Promise.all([run(1), run(2), run(3)])
    expect(order).toEqual([1, -1, 2, -2, 3, -3])
  })

  it('あるタスクが失敗しても同一キーの後続タスクは実行される', async () => {
    const order: string[] = []
    await expect(
      withCardLock('card-y', async () => {
        order.push('task1')
        throw new Error('boom')
      }),
    ).rejects.toThrow('boom')

    await withCardLock('card-y', async () => {
      order.push('task2')
    })

    expect(order).toEqual(['task1', 'task2'])
  })

  it('タスクの戻り値をそのまま返す', async () => {
    const result = await withCardLock('card-z', async () => 42)
    expect(result).toBe(42)
  })
})
