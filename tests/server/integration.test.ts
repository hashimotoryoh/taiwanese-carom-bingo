/**
 * 個々のAPIハンドラーは単体では正しくモックされたDBに対して動作を検証済みだが、
 * 「カード作成 → 出目記録 → ビンゴ達成による自動アーカイブ → 一覧/詳細取得 → 削除」という
 * 実際のユーザーフローを、ハンドラーを連結して1つの疑似DB（インメモリ）に対して検証することで、
 * 個別モックでは見えない結合部分の不具合を検知する（本番同様のブラウザE2Eはこの環境では
 * NetlifyのPostgres接続が無く実行できないため、その代替として用意する）。
 */
import { getDatabase } from '@netlify/database'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { BingoCard, BingoCardSummary } from '../../shared/types/bingo'
import type { HttpError } from '../setup/nitroGlobals'
import { makeEvent } from '../setup/testEvent'
import postCard from '../../server/api/cards/index.post'
import getCards from '../../server/api/cards/index.get'
import getCard from '../../server/api/cards/[id].get'
import deleteCard from '../../server/api/cards/[id].delete'
import postRoll from '../../server/api/cards/[id]/rolls.post'
import deleteRoll from '../../server/api/cards/[id]/rolls/[rollId].delete'
import postArchive from '../../server/api/cards/[id]/archive.post'
import getRecords from '../../server/api/records/index.get'

interface FakeRow {
  id: string
  name: string
  created_at: string
  updated_at: string
  numbers: unknown
  rolls: unknown
  archived: boolean
  bingo_achieved: boolean
  bingo_achieved_at: string | null
}

/** cardStore.ts のSQLタグ関数を、実DBの代わりにインメモリのMapで再現する */
function createFakeSql() {
  const table = new Map<string, FakeRow>()

  function sql(strings: TemplateStringsArray, ...values: unknown[]) {
    const text = strings.join(' ')
    if (text.includes('INSERT INTO cards')) {
      const [
        id,
        name,
        createdAt,
        updatedAt,
        numbers,
        rolls,
        archived,
        bingoAchieved,
        bingoAchievedAt,
      ] = values as [
        string,
        string,
        number,
        number,
        string,
        string,
        boolean,
        boolean,
        number | null,
      ]
      table.set(id, {
        id,
        name,
        created_at: String(createdAt),
        updated_at: String(updatedAt),
        numbers: JSON.parse(numbers),
        rolls: JSON.parse(rolls),
        archived,
        bingo_achieved: bingoAchieved,
        bingo_achieved_at: bingoAchievedAt === null ? null : String(bingoAchievedAt),
      })
      return Promise.resolve(undefined)
    }
    if (text.includes('DELETE FROM cards')) {
      table.delete(values[0] as string)
      return Promise.resolve(undefined)
    }
    if (text.includes('WHERE id')) {
      const row = table.get(values[0] as string)
      return Promise.resolve(row ? [row] : [])
    }
    return Promise.resolve(
      [...table.values()].sort((a, b) => Number(b.created_at) - Number(a.created_at)),
    )
  }

  return sql
}

function draftBody(name: string) {
  return {
    name,
    columns: {
      B: [1, 2, 3, 4, 5],
      I: [25, 26, 27, 28, 29],
      N: [49, 50, 101, 52, 53],
      G: [73, 74, 75, 76, 77],
      O: [97, 98, 99, 100, 103],
    },
  }
}

beforeEach(() => {
  vi.mocked(getDatabase).mockReturnValue({ sql: createFakeSql() } as unknown as ReturnType<
    typeof getDatabase
  >)
})

describe('カード作成〜ビンゴ達成〜削除の結合フロー', () => {
  it('B列を1〜5まで出目記録すると1ラインでビンゴが成立し自動アーカイブされる', async () => {
    const card = (await postCard(makeEvent({}, draftBody('結合太郎')))) as BingoCard

    let summaries = (await getCards()) as BingoCardSummary[]
    expect(summaries.map((s) => s.id)).toContain(card.id)
    expect(summaries.find((s) => s.id === card.id)!.archived).toBe(false)

    for (const value of [1, 2, 3, 4]) {
      const res = await postRoll(makeEvent({ id: card.id }, { value }))
      expect(res.achievedNow).toBe(false)
    }
    const finalRoll = await postRoll(makeEvent({ id: card.id }, { value: 5 }))
    expect(finalRoll.achievedNow).toBe(true)
    expect(finalRoll.card.archived).toBe(true)
    expect(finalRoll.card.bingoAchieved).toBe(true)

    const fetched = (await getCard(makeEvent({ id: card.id }))) as BingoCard
    expect(fetched.archived).toBe(true)
    expect(fetched.rolls).toHaveLength(5)

    summaries = (await getCards()) as BingoCardSummary[]
    expect(summaries.find((s) => s.id === card.id)!.archived).toBe(true)
  })

  it('ビンゴ達成でアーカイブ済みになったカードへの追加出目・記録削除は409で拒否される', async () => {
    const card = (await postCard(makeEvent({}, draftBody('拒否花子')))) as BingoCard
    for (const value of [1, 2, 3, 4, 5]) {
      await postRoll(makeEvent({ id: card.id }, { value }))
    }

    const rollErr: HttpError = await postRoll(makeEvent({ id: card.id }, { value: 25 })).catch(
      (e) => e,
    )
    expect(rollErr.statusCode).toBe(409)

    const fetched = (await getCard(makeEvent({ id: card.id }))) as BingoCard
    const rollId = fetched.rolls[0]!.id
    const deleteErr: HttpError = await deleteRoll(makeEvent({ id: card.id, rollId })).catch(
      (e) => e,
    )
    expect(deleteErr.statusCode).toBe(409)
  })

  it('手動アーカイブしたカードは出目記録できないが、記録削除・完全削除は独立して機能する', async () => {
    const card = (await postCard(makeEvent({}, draftBody('手動次郎')))) as BingoCard
    const afterRoll = await postRoll(makeEvent({ id: card.id }, { value: 1 }))
    expect(afterRoll.achievedNow).toBe(false)

    const archived = (await postArchive(makeEvent({ id: card.id }))) as BingoCard
    expect(archived.archived).toBe(true)
    expect(archived.bingoAchieved).toBe(false)

    const rollErr: HttpError = await postRoll(makeEvent({ id: card.id }, { value: 2 })).catch(
      (e) => e,
    )
    expect(rollErr.statusCode).toBe(409)

    await deleteCard(makeEvent({ id: card.id }))
    const notFoundErr: HttpError = await getCard(makeEvent({ id: card.id })).catch((e) => e)
    expect(notFoundErr.statusCode).toBe(404)

    const records = (await getRecords()) as BingoCard[]
    expect(records.find((c) => c.id === card.id)).toBeUndefined()
  })

  it('存在しないカードIDへの出目記録・アーカイブは404を返す', async () => {
    const missingId = '99999999-9999-9999-9999-999999999999'
    const rollErr: HttpError = await postRoll(makeEvent({ id: missingId }, { value: 1 })).catch(
      (e) => e,
    )
    expect(rollErr.statusCode).toBe(404)

    const archiveErr: HttpError = await postArchive(makeEvent({ id: missingId })).catch((e) => e)
    expect(archiveErr.statusCode).toBe(404)
  })
})
