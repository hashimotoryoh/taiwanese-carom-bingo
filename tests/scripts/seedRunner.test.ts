import { describe, expect, it, vi } from 'vitest'
import type { ColumnKey } from '../../shared/types/bingo'
// @ts-expect-error スクリプトは型定義のない .mjs のため
import { removeTestCards, seedTestCards } from '../../scripts/lib/seedRunner.mjs'
// @ts-expect-error スクリプトは型定義のない .mjs のため
import { TEST_CARD_NAME_PREFIX, buildTestCards } from '../../scripts/lib/testData.mjs'

interface TestCardSpec {
  key: string
  name: string
  draft: { name: string; columns: Record<ColumnKey, number[]> }
  rolls: number[]
  archive: boolean
}

const specs = buildTestCards() as TestCardSpec[]

/** APIを模したスタブ。カード名とID、記録した出目・アーカイブ操作を保持する */
function makeFakeApi(existing: { id: string; name: string }[] = []) {
  const cards = new Map(existing.map((c) => [c.id, { ...c }]))
  const rolls = new Map<string, number[]>()
  const archived: string[] = []
  const deleted: string[] = []
  let seq = 0

  return {
    cards,
    rolls,
    archived,
    deleted,
    listCards: vi.fn(async () => [...cards.values()]),
    createCard: vi.fn(async (draft: { name: string }) => {
      const id = `seeded-${++seq}`
      cards.set(id, { id, name: draft.name })
      rolls.set(id, [])
      return { id, name: draft.name }
    }),
    recordRoll: vi.fn(async (id: string, value: number) => {
      rolls.get(id)!.push(value)
    }),
    archiveCard: vi.fn(async (id: string) => {
      archived.push(id)
    }),
    deleteCard: vi.fn(async (id: string) => {
      deleted.push(id)
      cards.delete(id)
    }),
  }
}

describe('removeTestCards', () => {
  it('テストデータのカードだけを削除し、手動で作ったカードは残す', async () => {
    const api = makeFakeApi([
      { id: 'a', name: `${TEST_CARD_NAME_PREFIX}進行中さん` },
      { id: 'b', name: '本番の田中さん' },
      { id: 'c', name: `${TEST_CARD_NAME_PREFIX}リーチさん` },
    ])

    const removed = await removeTestCards(api)

    expect(removed).toBe(2)
    expect(api.deleted).toEqual(['a', 'c'])
    expect([...api.cards.keys()]).toEqual(['b'])
  })

  it('テストデータが無ければ何も削除しない', async () => {
    const api = makeFakeApi([{ id: 'b', name: '本番の田中さん' }])

    expect(await removeTestCards(api)).toBe(0)
    expect(api.deleteCard).not.toHaveBeenCalled()
  })

  it('削除したカードをログに出力する', async () => {
    const api = makeFakeApi([{ id: 'a', name: `${TEST_CARD_NAME_PREFIX}進行中さん` }])
    const log = vi.fn()

    await removeTestCards(api, log)

    expect(log).toHaveBeenCalledTimes(1)
    expect(log.mock.calls[0]![0]).toContain(`${TEST_CARD_NAME_PREFIX}進行中さん`)
  })
})

describe('seedTestCards', () => {
  it('投入前に既存のテストデータを削除する（毎回クリーンな状態になる）', async () => {
    const api = makeFakeApi([
      { id: 'old', name: `${TEST_CARD_NAME_PREFIX}進行中さん` },
      { id: 'keep', name: '本番の田中さん' },
    ])

    await seedTestCards(api)

    expect(api.deleted).toEqual(['old'])
    expect(api.cards.get('keep')).toBeDefined()
  })

  it('定義どおりのカードと出目を作成する', async () => {
    const api = makeFakeApi()

    const created = await seedTestCards(api)

    expect(created).toBe(specs.length)
    expect(api.createCard.mock.calls.map((call) => call[0])).toEqual(specs.map((s) => s.draft))
    expect([...api.rolls.values()]).toEqual(specs.map((s) => s.rolls))
  })

  it('アーカイブ指定のカードだけをアーカイブする', async () => {
    const api = makeFakeApi()

    await seedTestCards(api)

    const expected = specs
      .map((spec, i) => ({ spec, id: `seeded-${i + 1}` }))
      .filter(({ spec }) => spec.archive)
      .map(({ id }) => id)
    expect(api.archived).toEqual(expected)
  })

  it('作成したカードをログに出力する', async () => {
    const api = makeFakeApi()
    const log = vi.fn()

    await seedTestCards(api, log)

    const output = log.mock.calls.map((call) => call[0]).join('\n')
    for (const spec of specs) {
      expect(output).toContain(spec.name)
    }
  })
})
