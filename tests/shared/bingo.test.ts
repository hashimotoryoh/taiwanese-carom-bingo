import { describe, expect, it } from 'vitest'
import type { BingoCard, ColumnKey, DraftCard, Roll } from '../../shared/types/bingo'
import {
  COLUMNS,
  FREE_ROW,
  FREE_VALUE,
  GRID_SIZE,
  MAX_ROLL,
  ROLL_EXPECTED_VALUE,
  ZOROME_PROBABILITY_PERCENT,
  aggregateRollStats,
  blankDraft,
  buildPunched,
  buildPunchedAt,
  cellLabel,
  computeRollStats,
  countCompletedLines,
  countPunched,
  countReachLines,
  crossCardRolls,
  dailyRollAverages,
  draftToNumbers,
  emptyPunched,
  expectedZoromeCount,
  findCell,
  isValidRoll,
  isZorome,
  lineList,
  punchRatePercent,
  randomUnique,
  reachCells,
  rollHistory,
  signedRollValue,
  toSummary,
  validateDraft,
} from '../../shared/utils/bingo'

/** テスト用の固定ナンバーグリッド（列レンジに収まる重複なしの値） */
const NUMBERS: Record<ColumnKey, number[]> = {
  B: [1, 2, 3, 4, 5],
  I: [25, 26, 27, 28, 29],
  N: [49, 50, FREE_VALUE, 52, 53],
  G: [73, 74, 75, 76, 77],
  O: [97, 98, 99, 100, 103],
}

function makeRoll(value: number, rolledAt: number, id = `roll-${value}-${rolledAt}`): Roll {
  return { id, value, rolledAt }
}

function makeCard(overrides: Partial<BingoCard> = {}): BingoCard {
  return {
    id: 'card-1',
    name: 'テスト太郎',
    createdAt: 0,
    updatedAt: 0,
    numbers: NUMBERS,
    rolls: [],
    archived: false,
    bingoAchieved: false,
    bingoAchievedAt: null,
    ...overrides,
  }
}

describe('isValidRoll', () => {
  it('1〜120の整数を妥当とする', () => {
    expect(isValidRoll(1)).toBe(true)
    expect(isValidRoll(120)).toBe(true)
    expect(isValidRoll(60)).toBe(true)
  })

  it('範囲外の整数は無効とする', () => {
    expect(isValidRoll(0)).toBe(false)
    expect(isValidRoll(121)).toBe(false)
    expect(isValidRoll(-1)).toBe(false)
  })

  it('整数以外は無効とする', () => {
    expect(isValidRoll(1.5)).toBe(false)
    expect(isValidRoll('60')).toBe(false)
    expect(isValidRoll(null)).toBe(false)
    expect(isValidRoll(undefined)).toBe(false)
    expect(isValidRoll(Number.NaN)).toBe(false)
  })
})

describe('findCell', () => {
  it('存在する値のマスを返す', () => {
    expect(findCell(NUMBERS, 26)).toEqual({ col: 'I', row: 1 })
  })

  it('センターマスの値も見つけられる', () => {
    expect(findCell(NUMBERS, FREE_VALUE)).toEqual({ col: 'N', row: FREE_ROW })
  })

  it('存在しない値はnullを返す', () => {
    expect(findCell(NUMBERS, 999)).toBeNull()
  })
})

describe('cellLabel', () => {
  it('列 + 1始まりの行番号を返す', () => {
    expect(cellLabel('B', 0)).toBe('B1')
    expect(cellLabel('N', 4)).toBe('N5')
  })
})

describe('isZorome', () => {
  it('2桁以上で全桁が同一なら true', () => {
    expect(isZorome(11)).toBe(true)
    expect(isZorome(77)).toBe(true)
    expect(isZorome(111)).toBe(true)
  })

  it('1桁は false', () => {
    expect(isZorome(1)).toBe(false)
    expect(isZorome(9)).toBe(false)
  })

  it('桁が異なる場合は false', () => {
    expect(isZorome(12)).toBe(false)
    expect(isZorome(101)).toBe(false)
    expect(isZorome(120)).toBe(false)
  })
})

describe('emptyPunched', () => {
  it('全列・全マスが false の構造を返す', () => {
    const punched = emptyPunched()
    COLUMNS.forEach((col) => {
      expect(punched[col.key]).toHaveLength(GRID_SIZE)
      expect(punched[col.key].every((v) => v === false)).toBe(true)
    })
  })
})

describe('buildPunched', () => {
  it('出目履歴にある値のマスをパンチ済みにする', () => {
    const card = makeCard({ rolls: [makeRoll(1, 100), makeRoll(27, 200), makeRoll(999, 300)] })
    const punched = buildPunched(card)
    expect(punched.B[0]).toBe(true)
    expect(punched.I[2]).toBe(true)
    expect(countPunched(punched)).toBe(2)
  })

  it('センターマスは常にFREE_VALUEが記録されない限りパンチされない', () => {
    const card = makeCard({ rolls: [] })
    const punched = buildPunched(card)
    expect(punched.N[FREE_ROW]).toBe(false)
  })
})

describe('buildPunchedAt', () => {
  it('同一値の最も早い記録時刻を採用する', () => {
    const card = makeCard({
      rolls: [makeRoll(1, 500, 'later'), makeRoll(1, 100, 'earlier')],
    })
    const at = buildPunchedAt(card)
    expect(at.B[0]).toBe(100)
  })

  it('未パンチのマスはnull', () => {
    const card = makeCard({ rolls: [] })
    const at = buildPunchedAt(card)
    expect(at.B[0]).toBeNull()
  })

  it('後から来た記録が既存の記録より遅い場合は上書きしない', () => {
    const card = makeCard({
      rolls: [makeRoll(1, 100, 'earlier'), makeRoll(1, 500, 'later')],
    })
    const at = buildPunchedAt(card)
    expect(at.B[0]).toBe(100)
  })
})

describe('blankDraft', () => {
  it('名前は空文字、センターマスのみ固定値、他はnull', () => {
    const draft = blankDraft()
    expect(draft.name).toBe('')
    expect(draft.columns.N[FREE_ROW]).toBe(FREE_VALUE)
    expect(draft.columns.B.every((v) => v === null)).toBe(true)
    expect(draft.columns.N[0]).toBeNull()
  })
})

describe('lineList', () => {
  it('横5・縦5・斜め2の合計12ライン返す', () => {
    expect(lineList()).toHaveLength(12)
  })

  it('横ラインは同一行・全列で構成される', () => {
    const rowLine = lineList()[0]!
    expect(rowLine).toEqual([
      [0, 0],
      [1, 0],
      [2, 0],
      [3, 0],
      [4, 0],
    ])
  })

  it('斜めラインが正しい', () => {
    const lines = lineList()
    const diag1 = lines[10]!
    const diag2 = lines[11]!
    expect(diag1).toEqual([
      [0, 0],
      [1, 1],
      [2, 2],
      [3, 3],
      [4, 4],
    ])
    expect(diag2).toEqual([
      [0, 4],
      [1, 3],
      [2, 2],
      [3, 1],
      [4, 0],
    ])
  })
})

describe('countCompletedLines / countReachLines / reachCells', () => {
  it('1行すべてパンチ済みなら1ライン成立', () => {
    const punched = emptyPunched()
    COLUMNS.forEach((col) => {
      punched[col.key][0] = true
    })
    expect(countCompletedLines(punched)).toBe(1)
    expect(countReachLines(punched)).toBe(0)
  })

  it('あと1マスのラインはリーチとして数える', () => {
    const punched = emptyPunched()
    punched.B[0] = true
    punched.I[0] = true
    punched.N[0] = true
    punched.G[0] = true
    // O[0] は未パンチ -> 横1行目がリーチ
    expect(countReachLines(punched)).toBe(1)
    const { part, target } = reachCells(punched)
    expect(target.has('O:0')).toBe(true)
    expect(part.has('B:0')).toBe(true)
    expect(part.has('O:0')).toBe(false)
  })

  it('パンチが何もなければリーチもビンゴも0', () => {
    const punched = emptyPunched()
    expect(countCompletedLines(punched)).toBe(0)
    expect(countReachLines(punched)).toBe(0)
  })
})

describe('randomUnique', () => {
  it('指定件数・範囲内・重複なしの値を返す', () => {
    const result = randomUnique(1, 24, 5)
    expect(result).toHaveLength(5)
    expect(new Set(result).size).toBe(5)
    result.forEach((v) => {
      expect(v).toBeGreaterThanOrEqual(1)
      expect(v).toBeLessThanOrEqual(24)
    })
  })

  it('excludeで指定した値は含まない', () => {
    const result = randomUnique(1, 5, 4, [3])
    expect(result).not.toContain(3)
    expect(result).toHaveLength(4)
  })

  it('プール全体を要求すると全値を返す', () => {
    const result = randomUnique(1, 5, 5)
    expect([...result].sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5])
  })
})

describe('validateDraft', () => {
  function validDraft(): DraftCard {
    const draft = blankDraft()
    draft.name = '新規太郎'
    draft.columns.B = [1, 2, 3, 4, 5]
    draft.columns.I = [25, 26, 27, 28, 29]
    draft.columns.N = [49, 50, FREE_VALUE, 52, 53]
    draft.columns.G = [73, 74, 75, 76, 77]
    draft.columns.O = [97, 98, 99, 100, 103]
    return draft
  }

  it('正しいドラフトはエラーなし', () => {
    expect(validateDraft(validDraft(), [])).toEqual([])
  })

  it('名前未入力はエラー', () => {
    const draft = validDraft()
    draft.name = ''
    expect(validateDraft(draft, [])).toContain('あなたのお名前を入力してください。')
  })

  it('進行中カードと同名はエラー', () => {
    const draft = validDraft()
    expect(validateDraft(draft, ['新規太郎'])).toContain(
      'その名前のビンゴカードは既に使用中です。別の名前を入力してください。',
    )
  })

  it('未入力マスがあるとエラー', () => {
    const draft = validDraft()
    draft.columns.B[0] = null
    const errs = validateDraft(draft, [])
    expect(errs.some((e) => e.includes('B列に未入力のマスがあります'))).toBe(true)
  })

  it('O列にFREE_VALUEは指定不可', () => {
    const draft = validDraft()
    draft.columns.O[0] = FREE_VALUE
    const errs = validateDraft(draft, [])
    expect(errs.some((e) => e.includes('センターマス専用の数字'))).toBe(true)
  })

  it('列レンジ外の値はエラー', () => {
    const draft = validDraft()
    draft.columns.B[0] = 99
    const errs = validateDraft(draft, [])
    expect(errs.some((e) => e.includes('1 ~ 24 の範囲'))).toBe(true)
  })

  it('マス間の重複はエラー', () => {
    const draft = validDraft()
    draft.columns.B[1] = draft.columns.B[0]
    const errs = validateDraft(draft, [])
    expect(errs.some((e) => e.includes('同じ数字を複数のマスに指定することはできません'))).toBe(
      true,
    )
  })
})

describe('draftToNumbers', () => {
  it('未入力(null)は0として扱い、センターマスは固定値で上書きする', () => {
    const draft = blankDraft()
    draft.columns.B[0] = 10
    const numbers = draftToNumbers(draft)
    expect(numbers.B[0]).toBe(10)
    expect(numbers.B[1]).toBe(0)
    expect(numbers.N[FREE_ROW]).toBe(FREE_VALUE)
  })
})

describe('toSummary', () => {
  it('カードからサマリー情報を組み立てる', () => {
    const card = makeCard({
      rolls: [makeRoll(1, 100), makeRoll(2, 200)],
      archived: true,
      bingoAchieved: true,
      bingoAchievedAt: 200,
    })
    const summary = toSummary(card)
    expect(summary).toMatchObject({
      id: 'card-1',
      name: 'テスト太郎',
      archived: true,
      bingoAchieved: true,
      bingoAchievedAt: 200,
      punchedCount: 2,
      rollCount: 2,
    })
  })
})

describe('rollHistory', () => {
  it('新しい順に並べ、初回記録のマスにのみラベルを付与する', () => {
    const card = makeCard({
      rolls: [makeRoll(1, 100, 'r1'), makeRoll(1, 200, 'r2'), makeRoll(999, 300, 'r3')],
    })
    const history = rollHistory(card)
    expect(history.map((h) => h.roll.id)).toEqual(['r3', 'r2', 'r1'])
    expect(history.find((h) => h.roll.id === 'r1')!.label).toBe('B1')
    expect(history.find((h) => h.roll.id === 'r2')!.label).toBeNull()
    expect(history.find((h) => h.roll.id === 'r3')!.label).toBeNull()
  })
})

describe('punchRatePercent', () => {
  it('パンチ数 / 記録数 の百分率を返す', () => {
    expect(punchRatePercent(1, 2)).toBe(50)
    expect(punchRatePercent(2, 3)).toBeCloseTo((2 / 3) * 100)
  })

  it('記録数が0なら0を返す（0除算しない）', () => {
    expect(punchRatePercent(0, 0)).toBe(0)
  })
})

describe('computeRollStats / aggregateRollStats', () => {
  it('記録がない場合はすべて0', () => {
    const stats = computeRollStats(makeCard())
    expect(stats).toEqual({
      totalRolls: 0,
      averageValue: 0,
      totalZorome: 0,
      zoromeRatioPercent: 0,
      punchRatePercent: 0,
    })
  })

  it('ゾロ目はマイナスとして平均値に計上される', () => {
    const day = new Date(2026, 0, 1).getTime()
    const card = makeCard({ rolls: [makeRoll(11, day), makeRoll(1, day)] })
    const stats = computeRollStats(card)
    expect(stats.totalRolls).toBe(2)
    expect(stats.totalZorome).toBe(1)
    expect(stats.averageValue).toBe((-11 + 1) / 2)
    expect(stats.zoromeRatioPercent).toBe(50)
  })

  it('100は平均値の計算で200として計上される', () => {
    const day = new Date(2026, 0, 1).getTime()
    const card = makeCard({ rolls: [makeRoll(100, day), makeRoll(1, day)] })
    const stats = computeRollStats(card)
    expect(stats.totalRolls).toBe(2)
    expect(stats.averageValue).toBe((200 + 1) / 2)
  })

  it('パンチ率は パンチ数/記録数 * 100', () => {
    const card = makeCard({ rolls: [makeRoll(1, 0), makeRoll(999, 0)] })
    const stats = computeRollStats(card)
    expect(stats.punchRatePercent).toBe(50)
  })

  it('aggregateRollStatsは複数カードを横断集計する', () => {
    const cardA = makeCard({ id: 'a', rolls: [makeRoll(1, 0)] })
    const cardB = makeCard({ id: 'b', rolls: [makeRoll(2, 0), makeRoll(999, 0)] })
    const stats = aggregateRollStats([cardA, cardB])
    expect(stats.totalRolls).toBe(3)
    expect(stats.punchRatePercent).toBeCloseTo((2 / 3) * 100)
  })
})

describe('ROLL_EXPECTED_VALUE', () => {
  it('出目1回あたりの得点の期待値 6148/119（≒51.7）', () => {
    expect(ROLL_EXPECTED_VALUE).toBe(6148 / 119)
    expect(ROLL_EXPECTED_VALUE.toFixed(1)).toBe('51.7')
  })
})

describe('ZOROME_PROBABILITY_PERCENT', () => {
  it('出目1回がゾロ目になる確率 10/120（≒8.3%）', () => {
    expect(ZOROME_PROBABILITY_PERCENT).toBe((10 / 120) * 100)
    expect(ZOROME_PROBABILITY_PERCENT.toFixed(1)).toBe('8.3')
  })

  it('1〜120のゾロ目の個数（10個）と整合している', () => {
    const zoromeCount = Array.from({ length: MAX_ROLL }, (_, i) => i + 1).filter((v) =>
      isZorome(v),
    ).length
    expect(zoromeCount).toBe(10)
    expect(ZOROME_PROBABILITY_PERCENT).toBe((zoromeCount / MAX_ROLL) * 100)
  })
})

describe('expectedZoromeCount', () => {
  it('カイルン回数にゾロ目確率を掛けた回数を返す', () => {
    expect(expectedZoromeCount(120)).toBe(10)
    expect(expectedZoromeCount(12)).toBe(1)
    expect(expectedZoromeCount(10)).toBeCloseTo(10 / 12)
  })

  it('記録が無ければ0', () => {
    expect(expectedZoromeCount(0)).toBe(0)
  })
})

describe('signedRollValue', () => {
  it('通常の出目はそのままの値を返す', () => {
    expect(signedRollValue(37)).toBe(37)
  })

  it('ゾロ目はマイナスにする', () => {
    expect(signedRollValue(11)).toBe(-11)
    expect(signedRollValue(111)).toBe(-111)
  })

  it('100は200として扱う', () => {
    expect(signedRollValue(100)).toBe(200)
  })
})

describe('dailyRollAverages', () => {
  const day1 = new Date(2026, 0, 1, 10).getTime()
  const day1Night = new Date(2026, 0, 1, 22).getTime()
  const day2 = new Date(2026, 0, 3, 9).getTime()

  it('記録が無ければ空配列を返す', () => {
    expect(dailyRollAverages([makeCard()])).toEqual([])
  })

  it('同じ日の記録をまとめ、日ごとの平均と通算平均を古い順に返す', () => {
    const card = makeCard({
      rolls: [makeRoll(60, day1Night), makeRoll(20, day1), makeRoll(10, day2)],
    })
    const points = dailyRollAverages([card])
    expect(points).toHaveLength(2)
    expect(points[0]).toMatchObject({ count: 2, average: 40, cumulativeAverage: 40 })
    expect(points[1]).toMatchObject({ count: 1, average: 10, cumulativeAverage: 30 })
    expect(points[0]!.date).toBe(new Date(2026, 0, 1).getTime())
    expect(points[1]!.date).toBe(new Date(2026, 0, 3).getTime())
  })

  it('複数カードの記録を横断して集計する', () => {
    const cardA = makeCard({ id: 'a', rolls: [makeRoll(20, day1)] })
    const cardB = makeCard({ id: 'b', rolls: [makeRoll(60, day1Night)] })
    const points = dailyRollAverages([cardA, cardB])
    expect(points).toHaveLength(1)
    expect(points[0]!.average).toBe(40)
  })

  it('平均値はゾロ目をマイナス・100を200として計算する', () => {
    const card = makeCard({ rolls: [makeRoll(11, day1), makeRoll(100, day1)] })
    expect(dailyRollAverages([card])[0]!.average).toBe((-11 + 200) / 2)
  })
})

describe('crossCardRolls', () => {
  it('複数カードの出目を新しい順にまとめる', () => {
    const cardA = makeCard({ id: 'a', rolls: [makeRoll(1, 10, 'r1'), makeRoll(3, 50, 'r3')] })
    const cardB = makeCard({ id: 'b', rolls: [makeRoll(2, 30, 'r2')] })
    expect(crossCardRolls([cardA, cardB]).map((r) => r.id)).toEqual(['r3', 'r2', 'r1'])
  })

  it('記録が無ければ空配列を返す', () => {
    expect(crossCardRolls([makeCard()])).toEqual([])
  })
})
