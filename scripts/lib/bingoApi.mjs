// シーダーから開発サーバーの `server/api` を叩くための最小クライアント。
// DBへ直接書き込まず通常のAPI経由にすることで、バリデーションやビンゴ自動判定を
// アプリ本体と同じ経路で通す（＝手動操作で作ったデータと同じ状態になる）。

/** `npm run dev:netlify` が待ち受けるURL */
export const DEFAULT_BASE_URL = 'http://localhost:8888'

/** 接続先URLを解決する（環境変数 BINGO_BASE_URL で上書き可能） */
export function resolveBaseUrl(env = process.env) {
  const raw = env.BINGO_BASE_URL || DEFAULT_BASE_URL
  return raw.replace(/\/+$/, '')
}

/**
 * サーバーエラー時の試行回数（初回を含む）。
 * ローカルDBの接続枯渇は接続がアイドルタイムアウトで解放されるまで続くため、
 * 待ち時間の合計（1+2+4+8=15秒）がその解放を待てる長さになるようにしている。
 */
export const MAX_ATTEMPTS = 5

/** 再試行までの待ち時間（ミリ秒）。指数バックオフ */
function retryDelay(attempt) {
  return 1_000 * 2 ** (attempt - 1)
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

/** 再試行の状況をログへ流すクライアントを作る（エントリポイント共通） */
export function createLoggingBingoApi(baseUrl, log) {
  return createBingoApi(baseUrl, {
    onRetry: ({ method, path, status, attempt, wait }) =>
      log(
        `  再試行 ${attempt}/${MAX_ATTEMPTS - 1}: ${method} ${path} が HTTP ${status}。` +
          `${wait / 1_000}秒待って再実行します`,
      ),
  })
}

export function createBingoApi(baseUrl = resolveBaseUrl(), { onRetry = () => {} } = {}) {
  async function send(path, method, body) {
    let res
    try {
      res = await fetch(`${baseUrl}${path}`, {
        method,
        headers: { 'content-type': 'application/json' },
        body: body === undefined ? undefined : JSON.stringify(body),
      })
    } catch (cause) {
      throw new Error(
        `開発サーバー（${baseUrl}）へ接続できませんでした。` +
          '`npm run dev:netlify` で起動しているか確認してください。',
        { cause },
      )
    }
    return { status: res.status, ok: res.ok, text: await res.text() }
  }

  /**
   * APIを呼び出す。
   * シーダーは短時間に大量のリクエストを投げるため、DB接続の一時的な枯渇などで
   * 5xxが返ることがある。サーバーエラーに限り指数バックオフで再試行する。
   */
  async function request(path, { method = 'GET', body } = {}) {
    for (let attempt = 1; ; attempt++) {
      const res = await send(path, method, body)
      if (res.ok) return res.text === '' ? null : JSON.parse(res.text)
      if (res.status >= 500 && attempt < MAX_ATTEMPTS) {
        const wait = retryDelay(attempt)
        onRetry({ path, method, status: res.status, attempt, wait })
        await sleep(wait)
        continue
      }
      throw new Error(`${method} ${path} が失敗しました（HTTP ${res.status}）: ${res.text}`)
    }
  }

  return {
    baseUrl,
    /** カード一覧（サマリー）を取得する */
    listCards: () => request('/api/cards'),
    /** ドラフトからカードを作成する */
    createCard: (draft) => request('/api/cards', { method: 'POST', body: draft }),
    /** 出目を1件記録する */
    recordRoll: (id, value) =>
      request(`/api/cards/${id}/rolls`, { method: 'POST', body: { value } }),
    /** カードをアーカイブする */
    archiveCard: (id) => request(`/api/cards/${id}/archive`, { method: 'POST' }),
    /** カードを削除する */
    deleteCard: (id) => request(`/api/cards/${id}`, { method: 'DELETE' }),
  }
}
