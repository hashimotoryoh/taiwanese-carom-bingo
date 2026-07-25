import { afterEach, describe, expect, it, vi } from 'vitest'
// @ts-expect-error スクリプトは型定義のない .mjs のため
import {
  DEFAULT_BASE_URL,
  MAX_ATTEMPTS,
  createBingoApi,
  createLoggingBingoApi,
  resolveBaseUrl,
} from '../../scripts/lib/bingoApi.mjs'

const BASE = 'http://localhost:8888'

function jsonResponse(body: unknown, status = 200) {
  return { ok: status >= 200 && status < 300, status, text: async () => JSON.stringify(body) }
}

function errorResponse(status: number, text = 'boom') {
  return { ok: false, status, text: async () => text }
}

function stubFetch(...responses: unknown[]) {
  const fetchMock = vi.fn()
  for (const res of responses) fetchMock.mockResolvedValueOnce(res)
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

describe('resolveBaseUrl', () => {
  it('既定では開発サーバーのURLを返す', () => {
    expect(resolveBaseUrl({})).toBe(DEFAULT_BASE_URL)
  })

  it('環境変数で上書きでき、末尾のスラッシュを取り除く', () => {
    expect(resolveBaseUrl({ BINGO_BASE_URL: 'http://127.0.0.1:3000//' })).toBe(
      'http://127.0.0.1:3000',
    )
  })
})

describe('createBingoApi', () => {
  it('各操作を対応するエンドポイントへ送る', async () => {
    const fetchMock = stubFetch(
      jsonResponse([{ id: 'a' }]),
      jsonResponse({ id: 'a' }),
      jsonResponse({ card: {} }),
      jsonResponse({ id: 'a' }),
      jsonResponse({ ok: true }),
    )
    const api = createBingoApi(BASE)

    await api.listCards()
    await api.createCard({ name: 'テスト' })
    await api.recordRoll('a', 42)
    await api.archiveCard('a')
    await api.deleteCard('a')

    expect(fetchMock.mock.calls.map(([url, init]) => [url, init.method])).toEqual([
      [`${BASE}/api/cards`, 'GET'],
      [`${BASE}/api/cards`, 'POST'],
      [`${BASE}/api/cards/a/rolls`, 'POST'],
      [`${BASE}/api/cards/a/archive`, 'POST'],
      [`${BASE}/api/cards/a`, 'DELETE'],
    ])
    expect(fetchMock.mock.calls[1]![1].body).toBe(JSON.stringify({ name: 'テスト' }))
    expect(fetchMock.mock.calls[2]![1].body).toBe(JSON.stringify({ value: 42 }))
  })

  it('空のレスポンスボディはnullを返す', async () => {
    stubFetch({ ok: true, status: 204, text: async () => '' })
    await expect(createBingoApi(BASE).deleteCard('a')).resolves.toBeNull()
  })

  it('接続できないときは開発サーバーの起動を促すエラーになる', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error('ECONNREFUSED'))
    vi.stubGlobal('fetch', fetchMock)

    await expect(createBingoApi(BASE).listCards()).rejects.toThrow('npm run dev:netlify')
    // 接続エラーは再試行しない（起動していないだけなので待っても無駄）
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('4xxは再試行せずにエラーにする', async () => {
    const fetchMock = stubFetch(errorResponse(400, '入力内容に誤りがあります。'))

    await expect(createBingoApi(BASE).createCard({ name: '' })).rejects.toThrow('HTTP 400')
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('5xxは指数バックオフで再試行し、成功すれば結果を返す', async () => {
    vi.useFakeTimers()
    const fetchMock = stubFetch(errorResponse(500), errorResponse(500), jsonResponse([{ id: 'a' }]))
    const onRetry = vi.fn()

    const promise = createBingoApi(BASE, { onRetry }).listCards()
    await vi.advanceTimersByTimeAsync(3_000)

    await expect(promise).resolves.toEqual([{ id: 'a' }])
    expect(fetchMock).toHaveBeenCalledTimes(3)
    expect(onRetry.mock.calls.map(([info]) => info.wait)).toEqual([1_000, 2_000])
  })

  it('5xxが続く場合は試行回数の上限で諦める', async () => {
    vi.useFakeTimers()
    const fetchMock = stubFetch(
      ...Array.from({ length: MAX_ATTEMPTS }, () => errorResponse(500, 'サーバーエラー')),
    )

    const promise = createBingoApi(BASE).listCards()
    const assertion = expect(promise).rejects.toThrow('HTTP 500')
    await vi.advanceTimersByTimeAsync(20_000)

    await assertion
    expect(fetchMock).toHaveBeenCalledTimes(MAX_ATTEMPTS)
  })
})

describe('createLoggingBingoApi', () => {
  it('再試行の状況をログに出力する', async () => {
    vi.useFakeTimers()
    stubFetch(errorResponse(500), jsonResponse([]))
    const log = vi.fn()

    const promise = createLoggingBingoApi(BASE, log).listCards()
    await vi.advanceTimersByTimeAsync(1_000)
    await promise

    expect(log).toHaveBeenCalledTimes(1)
    expect(log.mock.calls[0]![0]).toContain('再試行')
    expect(log.mock.calls[0]![0]).toContain('HTTP 500')
  })
})
