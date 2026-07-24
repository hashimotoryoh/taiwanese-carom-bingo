import { FREE_VALUE } from '../../shared/utils/bingo'
import type { BingoCard, BingoCardSummary, ColumnKey, Roll } from '../../shared/types/bingo'

/** テスト用の固定ナンバーグリッド（列レンジに収まる重複なしの値） */
export const NUMBERS: Record<ColumnKey, number[]> = {
  B: [1, 2, 3, 4, 5],
  I: [25, 26, 27, 28, 29],
  N: [49, 50, FREE_VALUE, 52, 53],
  G: [73, 74, 75, 76, 77],
  O: [97, 98, 99, 100, 103],
}

export function makeRoll(value: number, rolledAt: number, id = `roll-${value}-${rolledAt}`): Roll {
  return { id, value, rolledAt }
}

export function makeCard(overrides: Partial<BingoCard> = {}): BingoCard {
  return {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'テスト太郎',
    createdAt: 1_000,
    updatedAt: 2_000,
    numbers: NUMBERS,
    rolls: [],
    archived: false,
    bingoAchieved: false,
    bingoAchievedAt: null,
    ...overrides,
  }
}

export function makeSummary(overrides: Partial<BingoCardSummary> = {}): BingoCardSummary {
  return {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'テスト太郎',
    createdAt: 1_000,
    updatedAt: 2_000,
    archived: false,
    bingoAchieved: false,
    bingoAchievedAt: null,
    punchedCount: 0,
    reachCount: 0,
    rollCount: 0,
    ...overrides,
  }
}
