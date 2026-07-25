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
import { TEST_CARD_NAME_PREFIX, buildTestCards } from '../../scripts/lib/testData.mjs'
import { fmtDate } from '../../shared/utils/date'
import { makeCard, makeRoll } from '../setup/fixtures'

interface TestCardSpec {
  key: string
  name: string
  description: string
  draft: { name: string; columns: Record<ColumnKey, number[]> }
  rolls: { value: number; rolledAt: number }[]
  plan: (string | number)[]
  createdAt: number
  archive: boolean
}

/** 生成の基準時刻（2026/07/25 12:00 ローカル） */
const NOW = new Date(2026, 6, 25, 12, 0, 0).getTime()

const cards = buildTestCards(NOW) as TestCardSpec[]

function byKey(key: string): TestCardSpec {
  const spec = cards.find((c) => c.key === key)
  if (!spec) throw new Error(`テストデータ定義に ${key} がありません`)
  return spec
}

/** 指定した件数の出目まで記録したときのカード状態を導出する */
function stateAfter(spec: TestCardSpec, count = spec.rolls.length) {
  const card: BingoCard = makeCard({
    numbers: spec.draft.columns,
    rolls: spec.rolls
      .slice(0, count)
      .map(({ value, rolledAt }, i) => makeRoll(value, rolledAt, `roll-${i}`)),
  })
  const punched = buildPunched(card)
  return {
    lines: countCompletedLines(punched),
    reach: countReachLines(punched),
    punched: countPunched(punched),
  }
}

describe('buildTestCards', () => {
  it('同じ基準時刻なら毎回同じ内容を返す（決定的に生成される）', () => {
    expect(buildTestCards(NOW)).toEqual(cards)
  })

  it('すべてのカード名がテストデータの接頭辞で始まる', () => {
    expect(cards.length).toBeGreaterThan(0)
    for (const spec of cards) {
      expect(spec.name.startsWith(TEST_CARD_NAME_PREFIX)).toBe(true)
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
      for (const { value } of spec.rolls) {
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
    const values = inProgress.rolls.map((r) => r.value)
    expect(values.some((v) => isZorome(v))).toBe(true)
    // 空振り（カード外の出目）
    expect(values.some((v) => !cardValues.has(v))).toBe(true)
    // 同じ出目の重複記録（履歴のマス目欄が「—」になる行）
    expect(new Set(values).size).toBeLessThan(values.length)
    // センターマス（固定値）と、統計上200として扱われる出目100
    expect(values).toContain(FREE_VALUE)
    expect(values).toContain(100)
  })

  it('空振り指定の出目はカード外かつゾロ目・出目100と重ならない', () => {
    for (const spec of cards) {
      const cardValues = new Set(COLUMNS.flatMap((col) => spec.draft.columns[col.key]))
      spec.plan.forEach((entry, i) => {
        if (entry !== 'miss') return
        const { value } = spec.rolls[i]!
        expect(cardValues.has(value)).toBe(false)
        expect(isZorome(value)).toBe(false)
        expect(value).not.toBe(100)
      })
    }
  })

  it('出目100はどのカードにも配置されておらず、空振りとして記録される', () => {
    for (const spec of cards) {
      if (!spec.rolls.some((r) => r.value === 100)) continue
      const cardValues = new Set(COLUMNS.flatMap((col) => spec.draft.columns[col.key]))
      expect(cardValues.has(100)).toBe(false)
    }
  })

  it('出目の記録日時が記録順に並び、基準時刻より未来にならない', () => {
    for (const spec of cards) {
      const timestamps = spec.rolls.map((r) => r.rolledAt)
      expect(timestamps).toEqual([...timestamps].sort((a, b) => a - b))
      for (const ts of timestamps) expect(ts).toBeLessThanOrEqual(NOW)
      // カードは最初の出目より前に作られている
      expect(spec.createdAt).toBeLessThan(timestamps[0] ?? NOW)
    }
  })

  it('出目の記録日時が複数日に分散する（同日平均カイルン回数の確認用）', () => {
    const spreadDays = cards.map((spec) => new Set(spec.rolls.map((r) => fmtDate(r.rolledAt))).size)
    // 出目のあるカードはすべて2日以上にまたがる
    expect(spreadDays.filter((days) => days > 0).every((days) => days >= 2)).toBe(true)
    // カードごとに日数が異なる（同日平均カイルン回数がカードごとに変わる）
    expect(new Set(spreadDays).size).toBeGreaterThan(2)
  })

  it('カードごとに記録期間がずれており、全体では複数日にまたがる', () => {
    const allDays = new Set(cards.flatMap((spec) => spec.rolls.map((r) => fmtDate(r.rolledAt))))
    expect(allDays.size).toBeGreaterThanOrEqual(10)
    // アーカイブ済みのカードは進行中のカードより古い時期に記録が終わっている
    const lastRolledAt = (key: string) => byKey(key).rolls.at(-1)!.rolledAt
    expect(lastRolledAt('veteranArchived')).toBeLessThan(lastRolledAt('bingo'))
    expect(lastRolledAt('bingo')).toBeLessThan(lastRolledAt('inProgress'))
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
