/**
 * server/api・server/utils・shared/utils は Nuxt/Nitro の自動インポートを前提に
 * 識別子をそのまま参照している（明示的な import 文がない）。
 * テスト実行時はその自動インポートが存在しないため、ここで globalThis に同名の
 * スタブ／実装を用意し、本番と同じ呼び出し方でハンドラーをテストできるようにする。
 */
import { ref, type Ref } from 'vue'
import { vi } from 'vitest'
import * as bingoUtils from '../../shared/utils/bingo'
import * as cardStore from '../../server/utils/cardStore'

// server/utils/cardStore.ts が依存する実DBアクセスをテスト全体でモックする。
// 各テストは `import { getDatabase } from '@netlify/database'` して
// `vi.mocked(getDatabase).mockReturnValue(...)` で戻り値を差し替える。
vi.mock('@netlify/database', () => ({
  getDatabase: vi.fn(() => {
    throw new Error(
      'getDatabase() はテスト内で vi.mocked(getDatabase).mockReturnValue(...) してください。',
    )
  }),
}))

export interface TestEvent {
  context: { params?: Record<string, string> }
  _body?: unknown
}

export interface HttpError extends Error {
  statusCode: number
  data?: unknown
}

interface CreateErrorInput {
  statusCode: number
  message?: string
  data?: unknown
}

type NitroGlobals = typeof globalThis & {
  defineEventHandler: <THandler>(handler: THandler) => THandler
  getRouterParam: (event: TestEvent, name: string) => string | undefined
  readBody: <T = unknown>(event: TestEvent) => Promise<T>
  createError: (input: CreateErrorInput) => HttpError
  useState: <T>(key: string, init: () => T) => Ref<T>
}

const g = globalThis as NitroGlobals

g.defineEventHandler = (handler) => handler

g.getRouterParam = (event, name) => event.context.params?.[name]

g.readBody = async (event) => event._body as Awaited<ReturnType<typeof g.readBody>>

g.createError = (input) => {
  const error = new Error(input.message ?? 'Error') as HttpError
  error.statusCode = input.statusCode
  error.data = input.data
  return error
}

// server/utils・shared/utils の自動インポート関数を実体としてグローバルに公開する。
// 個々のテストでは vi.spyOn(globalThis, '関数名') でモック化する。
Object.assign(globalThis, bingoUtils, cardStore)

const stateStore = new Map<string, Ref<unknown>>()

g.useState = <T>(key: string, init: () => T): Ref<T> => {
  if (!stateStore.has(key)) stateStore.set(key, ref(init()))
  return stateStore.get(key) as Ref<T>
}

/** Nuxt の useState は同一キーで状態を共有するため、テスト間の汚染を避けるためリセットする */
export function resetTestState(): void {
  stateStore.clear()
}
