import { describe, expect, it } from 'vitest'
import type { BingoCard, ColumnKey } from '../../shared/types/bingo'
import {
  COLUMNS,
  FREE_ROW,
  FREE_VALUE,
  GRID_SIZE,
  buildPunched,
  countCompletedLines,
  countPunched,
  countReachLines,
  isValidRoll,
  isZorome,
  validateDraft,
} from '../../shared/utils/bingo'
// @ts-expect-error スクリプトは型定義のない .mjs のため
import {
  TEST_CARD_NAME_PREFIX,
  buildTestCards,
  isTestCardName,
} from '../../scripts/lib/testData.mjs'
import { makeCard, makeRoll } from '../setup/fixtures'

interface TestCardSpec {
  key: string
  name: string
  description: string
  draft: { name: string; columns: Record<ColumnKey, number[]> }
  rolls: number[]
  plan: (string | number)[]
  archive: boolean
}

const cards = buildTestCards() as TestCardSpec[]

function byKey(key: string): TestCardSpec {
  const spec = cards.find((c) => c.key === key)
  if (!spec) throw new Error(`テストデータ定義に ${key} がありません`)
  return spec
}

/** 指定した件数の出目まで記録したときのカード状態を導出する */
function stateAfter(spec: TestCardSpec, count = spec.rolls.length) {
  const card: BingoCard = makeCard({
    numbers: spec.draft.columns,
    rolls: spec.rolls.slice(0, count).map((value, i) => makeRoll(value, 1_000 + i, `roll-${i}`)),
  })
  const punched = buildPunched(card)
  return {
    lines: countCompletedLines(punched),
    reach: countReachLines(punched),
    punched: countPunched(punched),
  }
}

describe('isTestCardName', () => {
  it('接頭辞付きの名前だけをテストデータと判定する', () => {
    expect(isTestCardName(`${TEST_CARD_NAME_PREFIX}進行中さん`)).toBe(true)
    expect(isTestCardName('進行中さん')).toBe(false)
    expect(isTestCardName(`本番${TEST_CARD_NAME_PREFIX}さん`)).toBe(false)
    expect(isTestCardName(undefined)).toBe(false)
  })
})

describe('buildTestCards', () => {
  it('毎回同じ内容を返す（決定的に生成される）', () => {
    expect(buildTestCards()).toEqual(cards)
  })

  it('すべてのカード名がテストデータの接頭辞で始まる', () => {
    expect(cards.length).toBeGreaterThan(0)
    for (const spec of cards) {
      expect(isTestCardName(spec.name)).toBe(true)
      expect(spec.draft.name).toBe(spec.name)
    }
  })

  it('各列の番号がshared側の列レンジに収まり、センターマスが固定値になっている', () => {
    for (const spec of cards) {
      for (const col of COLUMNS) {
        const values = spec.draft.columns[col.key]
        expect(values).toHaveLength(GRID_SIZE)
        values.forEach((value, row) => {
          if (col.key === 'N' && row === FREE_ROW) {
            expect(value).toBe(FREE_VALUE)
            return
          }
          expect(value).toBeGreaterThanOrEqual(col.min)
          expect(value).toBeLessThanOrEqual(col.max)
          // O列にセンターマス固定値は置けない
          expect(value).not.toBe(FREE_VALUE)
        })
      }
    }
  })

  it('カード内に重複した番号がない', () => {
    for (const spec of cards) {
      const values = COLUMNS.flatMap((col) => spec.draft.columns[col.key])
      expect(new Set(values).size).toBe(values.length)
    }
  })

  it('作成順にAPIへ投入してもバリデーションと名前の重複チェックを通る', () => {
    const activeNames: string[] = []
    for (const spec of cards) {
      expect(validateDraft(spec.draft, activeNames)).toEqual([])
      // ビンゴ成立か手動アーカイブでアーカイブされたカードは進行中の名前に含めない
      const archived = spec.archive || stateAfter(spec).lines >= 1
      if (!archived) activeNames.push(spec.name)
    }
  })

  it('出目がすべて記録可能な値になっている', () => {
    for (const spec of cards) {
      for (const value of spec.rolls) {
        expect(isValidRoll(value)).toBe(true)
      }
    }
  })

  it('ビンゴ成立は最後の出目のみ（成立後の出目記録は409になるため）', () => {
    for (const spec of cards) {
      for (let count = 0; count < spec.rolls.length; count++) {
        expect(stateAfter(spec, count).lines).toBe(0)
      }
    }
  })

  it('アーカイブ指定のカードはビンゴ未達成のまま', () => {
    for (const spec of cards.filter((c) => c.archive)) {
      expect(stateAfter(spec).lines).toBe(0)
    }
  })

  it('ゾロ目・空振り・重複記録・出目100を含み、統計と履歴表示の確認に使える', () => {
    const inProgress = byKey('inProgress')
    const cardValues = new Set(COLUMNS.flatMap((col) => inProgress.draft.columns[col.key]))
    expect(inProgress.rolls.some((v) => isZorome(v))).toBe(true)
    // 空振り（カード外の出目）
    expect(inProgress.rolls.some((v) => !cardValues.has(v))).toBe(true)
    // 同じ出目の重複記録（履歴のマス目欄が「—」になる行）
    expect(new Set(inProgress.rolls).size).toBeLessThan(inProgress.rolls.length)
    // センターマス（固定値）と、統計上200として扱われる出目100
    expect(inProgress.rolls).toContain(FREE_VALUE)
    expect(inProgress.rolls).toContain(100)
  })

  it('空振り指定の出目はカード外かつゾロ目・出目100と重ならない', () => {
    for (const spec of cards) {
      const cardValues = new Set(COLUMNS.flatMap((col) => spec.draft.columns[col.key]))
      spec.plan.forEach((entry, i) => {
        if (entry !== 'miss') return
        const value = spec.rolls[i]!
        expect(cardValues.has(value)).toBe(false)
        expect(isZorome(value)).toBe(false)
        expect(value).not.toBe(100)
      })
    }
  })

  it('出目100はどのカードにも配置されておらず、空振りとして記録される', () => {
    for (const spec of cards) {
      if (!spec.rolls.includes(100)) continue
      const cardValues = new Set(COLUMNS.flatMap((col) => spec.draft.columns[col.key]))
      expect(cardValues.has(100)).toBe(false)
    }
  })

  it('未記録・進行中・リーチ・ビンゴ達成・アーカイブの各状態を網羅している', () => {
    expect(byKey('fresh').rolls).toEqual([])

    const inProgress = stateAfter(byKey('inProgress'))
    expect(inProgress.punched).toBeGreaterThan(0)
    expect(inProgress.lines).toBe(0)
    expect(inProgress.reach).toBe(0)

    const reach = stateAfter(byKey('reach'))
    expect(reach.reach).toBe(1)
    expect(reach.lines).toBe(0)

    const doubleReach = stateAfter(byKey('doubleReach'))
    expect(doubleReach.reach).toBe(2)
    expect(doubleReach.lines).toBe(0)

    expect(stateAfter(byKey('bingo')).lines).toBe(1)

    const archived = byKey('archived')
    expect(archived.archive).toBe(true)
    expect(stateAfter(archived).punched).toBeGreaterThan(0)
  })

  it('同名で「アーカイブ済み1枚＋進行中1枚」を持つカードがある（記録集計ページ用）', () => {
    const first = byKey('veteranArchived')
    const second = byKey('veteranActive')
    expect(first.name).toBe(second.name)
    // 1枚目はビンゴ成立で自動アーカイブされるため、2枚目を同名で作成できる
    expect(stateAfter(first).lines).toBe(1)
    expect(stateAfter(second).lines).toBe(0)
    expect(cards.indexOf(first)).toBeLessThan(cards.indexOf(second))
  })
})
