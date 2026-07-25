// ローカルDBへ直接つないでカードの日時を書き換えるためのモジュール。
//
// テストデータの作成自体は API 経由で行うが、出目の記録日時（rolledAt）だけは
// API では指定できず、必ず記録時刻（＝シーダーの実行時刻）になってしまう。
// 日付ごとの履歴表示など日付をまたぐ見え方を確認するには日付を散らす必要があるため、
// 投入後に日時だけを DB へ書き戻す。

import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { getDatabase } from '@netlify/database'

/**
 * ローカルDBの接続文字列を解決する。
 * `netlify dev` は起動したローカルDBの接続文字列を `.netlify/state.json` に保存するため、
 * 環境変数が無ければそこから読む（netlify CLI 自身の解決順と同じ）。
 * @param projectRoot 既定はカレントディレクトリ（npmスクリプトはプロジェクトルートで実行される）
 */
export async function resolveConnectionString(env = process.env, projectRoot = process.cwd()) {
  if (env.NETLIFY_DB_URL) return env.NETLIFY_DB_URL
  try {
    const raw = await readFile(path.join(projectRoot, '.netlify', 'state.json'), 'utf8')
    return JSON.parse(raw).dbConnectionString ?? null
  } catch {
    return null
  }
}

/** ローカルDBへ接続する。使い終わったら close() を呼ぶこと */
export function connectDatabase(connectionString) {
  const { sql, pool } = getDatabase({ connectionString })
  return { sql, close: () => pool.end() }
}

/**
 * カード本体と出目履歴の日時をまとめて書き換える。
 * 出目の値やビンゴ判定結果には触れず、日時だけを更新する。
 */
export async function updateCardDates(sql, { id, createdAt, updatedAt, bingoAchievedAt, rolls }) {
  await sql`
    UPDATE cards SET
      created_at = ${createdAt},
      updated_at = ${updatedAt},
      bingo_achieved_at = ${bingoAchievedAt},
      rolls = ${JSON.stringify(rolls)}::jsonb
    WHERE id = ${id}
  `
}
