import { mkdtemp, mkdir, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import { getDatabase } from '@netlify/database'
// @ts-expect-error スクリプトは型定義のない .mjs のため
import {
  connectDatabase,
  resolveConnectionString,
  updateCardDates,
} from '../../scripts/lib/cardDb.mjs'

/** `.netlify/state.json` を持つ一時的なプロジェクトルートを作る */
async function makeProjectRoot(state?: Record<string, unknown>) {
  const root = await mkdtemp(path.join(tmpdir(), 'bingo-seed-'))
  if (state) {
    await mkdir(path.join(root, '.netlify'), { recursive: true })
    await writeFile(path.join(root, '.netlify', 'state.json'), JSON.stringify(state))
  }
  return root
}

describe('resolveConnectionString', () => {
  it('環境変数 NETLIFY_DB_URL を最優先で使う', async () => {
    const root = await makeProjectRoot({ dbConnectionString: 'postgres://from-state' })

    const resolved = await resolveConnectionString({ NETLIFY_DB_URL: 'postgres://from-env' }, root)

    expect(resolved).toBe('postgres://from-env')
  })

  it('環境変数が無ければ netlify dev が保存した接続文字列を読む', async () => {
    const root = await makeProjectRoot({ dbConnectionString: 'postgres://from-state' })

    expect(await resolveConnectionString({}, root)).toBe('postgres://from-state')
  })

  it('state.json が無ければnullを返す', async () => {
    expect(await resolveConnectionString({}, await makeProjectRoot())).toBeNull()
  })

  it('state.json に接続文字列が無ければnullを返す', async () => {
    const root = await makeProjectRoot({ siteId: 'abc' })

    expect(await resolveConnectionString({}, root)).toBeNull()
  })
})

describe('connectDatabase', () => {
  it('接続文字列を渡してDBに接続し、closeでプールを閉じる', () => {
    const end = vi.fn()
    vi.mocked(getDatabase).mockReturnValue({ sql: 'sql-tag', pool: { end } } as never)

    const db = connectDatabase('postgres://local')
    db.close()

    expect(vi.mocked(getDatabase)).toHaveBeenCalledWith({ connectionString: 'postgres://local' })
    expect(db.sql).toBe('sql-tag')
    expect(end).toHaveBeenCalled()
  })
})

describe('updateCardDates', () => {
  it('日時と出目履歴のみを更新する', async () => {
    const values: unknown[][] = []
    const sql = vi.fn(async (strings: TemplateStringsArray, ...args: unknown[]) => {
      values.push([strings.join('?'), ...args])
    })
    const rolls = [{ id: 'r1', value: 7, rolledAt: 100 }]

    await updateCardDates(sql, {
      id: 'card-1',
      createdAt: 10,
      updatedAt: 100,
      bingoAchievedAt: null,
      rolls,
    })

    const [query, createdAt, updatedAt, bingoAchievedAt, rollsJson, id] = values[0]!
    expect(query).toContain('UPDATE cards')
    // 番号（numbers）やビンゴ判定結果は書き換えない
    expect(query).not.toContain('numbers')
    expect(query).not.toContain('bingo_achieved =')
    expect(createdAt).toBe(10)
    expect(updatedAt).toBe(100)
    expect(bingoAchievedAt).toBeNull()
    expect(JSON.parse(rollsJson as string)).toEqual(rolls)
    expect(id).toBe('card-1')
  })
})
