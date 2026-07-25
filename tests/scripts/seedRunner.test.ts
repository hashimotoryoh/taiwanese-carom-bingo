import { describe, expect, it, vi } from 'vitest'
import type { ColumnKey } from '../../shared/types/bingo'
// @ts-expect-error スクリプトは型定義のない .mjs のため
import { removeTestCards, seedTestCards } from '../../scripts/lib/seedRunner.mjs'
// @ts-expect-error スクリプトは型定義のない .mjs のため
import { buildTestCards } from '../../scripts/lib/testData.mjs'

interface TestCardSpec {
  key: string
  name: string
  draft: { name: string; columns: Record<ColumnKey, number[]> }
  rolls: { value: number; rolledAt: number }[]
  createdAt: number
  archive: boolean
}

/** 生成の基準時刻（2026/07/25 12:00 ローカル） */
const NOW = new Date(2026, 6, 25, 12, 0, 0).getTime()
/** APIが出目を記録した時刻（＝シーダー実行時刻）の代用値 */
const RECORDED_AT = 9_999_999

const specs = buildTestCards(NOW) as TestCardSpec[]

/** APIを模したスタブ。作成したカードと記録した出目を保持する */
function makeFakeApi(
  existing: { id: string; name: string }[] = [],
  { bingoAchieved = false } = {},
) {
  const cards = new Map<string, { id: string; name: string; archived: boolean }>(
    existing.map((c) => [c.id, { ...c, archived: false }]),
  )
  const rolls = new Map<string, { id: string; value: number; rolledAt: number }[]>()
  const archived: string[] = []
  const deleted: string[] = []
  let seq = 0
  let rollSeq = 0

  return {
    cards,
    rolls,
    archived,
    deleted,
    listCards: vi.fn(async () => [...cards.values()]),
    createCard: vi.fn(async (draft: { name: string }) => {
      const id = `seeded-${++seq}`
      cards.set(id, { id, name: draft.name, archived: false })
      rolls.set(id, [])
      return { id, name: draft.name }
    }),
    recordRoll: vi.fn(async (id: string, value: number) => {
      rolls.get(id)!.push({ id: `roll-${++rollSeq}`, value, rolledAt: RECORDED_AT })
    }),
    archiveCard: vi.fn(async (id: string) => {
      archived.push(id)
      cards.get(id)!.archived = true
    }),
    getCard: vi.fn(async (id: string) => ({
      ...cards.get(id)!,
      rolls: rolls.get(id)!.map((r) => ({ ...r })),
      bingoAchieved,
    })),
    deleteCard: vi.fn(async (id: string) => {
      deleted.push(id)
      cards.delete(id)
    }),
  }
}

/** DBのsqlテンプレートタグを模したスタブ。埋め込まれた値だけを記録する */
function makeFakeSql() {
  const calls: unknown[][] = []
  const sql = vi.fn(async (_strings: TemplateStringsArray, ...values: unknown[]) => {
    calls.push(values)
  })
  return Object.assign(sql, { calls })
}

/** updateCardDates が渡した値（順序は cardDb.mjs のUPDATE文に対応） */
function dateUpdates(sql: ReturnType<typeof makeFakeSql>) {
  return sql.calls.map(([createdAt, updatedAt, bingoAchievedAt, rollsJson, id]) => ({
    createdAt,
    updatedAt,
    bingoAchievedAt,
    rolls: JSON.parse(rollsJson as string),
    id,
  }))
}

describe('removeTestCards', () => {
  it('テストデータのカードだけを削除し、手動で作ったカードは残す', async () => {
    const api = makeFakeApi([
      { id: 'a', name: '【テストデータ】進行中さん' },
      { id: 'b', name: '手動で作ったカード' },
    ])

    const removed = await removeTestCards(api)

    expect(removed).toBe(1)
    expect(api.deleted).toEqual(['a'])
    expect([...api.cards.keys()]).toEqual(['b'])
  })

  it('テストデータが無ければ何も削除しない', async () => {
    const api = makeFakeApi()

    expect(await removeTestCards(api)).toBe(0)
    expect(api.deleteCard).not.toHaveBeenCalled()
  })

  it('削除したカードをログに出力する', async () => {
    const api = makeFakeApi([{ id: 'a', name: '【テストデータ】進行中さん' }])
    const log = vi.fn()

    await removeTestCards(api, log)

    expect(log).toHaveBeenCalledTimes(1)
    expect(log.mock.calls[0]![0]).toContain('【テストデータ】進行中さん')
  })
})

describe('seedTestCards', () => {
  it('投入前に既存のテストデータを削除する（毎回クリーンな状態になる）', async () => {
    const api = makeFakeApi([
      { id: 'old', name: '【テストデータ】進行中さん' },
      { id: 'manual', name: '手動で作ったカード' },
    ])

    await seedTestCards({ api, sql: makeFakeSql(), now: NOW })

    expect(api.deleted).toEqual(['old'])
    expect(api.cards.get('manual')).toBeDefined()
  })

  it('定義どおりのカードと出目を作成する', async () => {
    const api = makeFakeApi()

    const created = await seedTestCards({ api, sql: makeFakeSql(), now: NOW })

    expect(created).toBe(specs.length)
    expect(api.createCard.mock.calls.map((call) => call[0])).toEqual(specs.map((s) => s.draft))
    expect([...api.rolls.values()].map((rolls) => rolls.map((r) => r.value))).toEqual(
      specs.map((s) => s.rolls.map((r) => r.value)),
    )
  })

  it('アーカイブ指定のカードだけをアーカイブする', async () => {
    const api = makeFakeApi()

    await seedTestCards({ api, sql: makeFakeSql(), now: NOW })

    const expected = specs
      .map((spec, i) => ({ spec, id: `seeded-${i + 1}` }))
      .filter(({ spec }) => spec.archive)
      .map(({ id }) => id)
    expect(api.archived).toEqual(expected)
  })

  it('出目の記録日時を定義どおりの日付へ書き換える', async () => {
    const api = makeFakeApi()
    const sql = makeFakeSql()

    await seedTestCards({ api, sql, now: NOW })

    const updates = dateUpdates(sql)
    expect(updates).toHaveLength(specs.length)
    updates.forEach((update, i) => {
      const spec = specs[i]!
      expect(update.id).toBe(`seeded-${i + 1}`)
      expect(update.createdAt).toBe(spec.createdAt)
      // APIが付けた記録時刻ではなく、定義した日時に置き換わっている
      expect(update.rolls.map((r: { rolledAt: number }) => r.rolledAt)).toEqual(
        spec.rolls.map((r) => r.rolledAt),
      )
      expect(update.rolls.every((r: { rolledAt: number }) => r.rolledAt !== RECORDED_AT)).toBe(true)
      // 出目のidと値はAPIが作ったものを保持する
      expect(update.rolls.map((r: { value: number }) => r.value)).toEqual(
        spec.rolls.map((r) => r.value),
      )
      expect(update.rolls.every((r: { id: string }) => r.id.startsWith('roll-'))).toBe(true)
      // 最終更新日時は最後の出目の日時（出目が無ければ作成日時）
      expect(update.updatedAt).toBe(spec.rolls.at(-1)?.rolledAt ?? spec.createdAt)
    })
  })

  it('ビンゴ未達成のカードは達成日時をnullにする', async () => {
    const sql = makeFakeSql()

    await seedTestCards({ api: makeFakeApi(), sql, now: NOW })

    expect(dateUpdates(sql).every((update) => update.bingoAchievedAt === null)).toBe(true)
  })

  it('ビンゴ達成済みのカードは最後の出目の日時を達成日時にする', async () => {
    const sql = makeFakeSql()

    await seedTestCards({ api: makeFakeApi([], { bingoAchieved: true }), sql, now: NOW })

    dateUpdates(sql).forEach((update, i) => {
      const spec = specs[i]!
      expect(update.bingoAchievedAt).toBe(spec.rolls.at(-1)?.rolledAt ?? spec.createdAt)
    })
  })

  it('APIから返る出目の並びが定義と違えばエラーにする', async () => {
    const api = makeFakeApi()
    api.getCard = vi.fn(async (id: string) => ({
      id,
      rolls: [{ id: 'roll-x', value: 7, rolledAt: RECORDED_AT }],
      bingoAchieved: false,
    })) as typeof api.getCard

    await expect(seedTestCards({ api, sql: makeFakeSql(), now: NOW })).rejects.toThrow(
      '出目の並びが定義と一致しません',
    )
  })

  it('作成したカードをログに出力する', async () => {
    const api = makeFakeApi()
    const log = vi.fn()

    await seedTestCards({ api, sql: makeFakeSql(), log, now: NOW })

    const output = log.mock.calls.map((call) => call[0]).join('\n')
    for (const spec of specs) {
      expect(output).toContain(spec.name)
    }
  })
})
