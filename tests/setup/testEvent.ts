import type { TestEvent } from './nitroGlobals'

/** server/api ハンドラーのテスト用に最小限の H3Event 相当を組み立てる */
export function makeEvent(params: Record<string, string> = {}, body?: unknown): TestEvent {
  return { context: { params }, _body: body }
}
