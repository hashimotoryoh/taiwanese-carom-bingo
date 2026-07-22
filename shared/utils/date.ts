/** epoch ミリ秒を YYYY/MM/DD 形式にフォーマットする */
export function fmtDate(ts: number): string {
  const d = new Date(ts)
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`
}

/** 2つの日時の間の日数（最小1日） */
export function daysBetween(tsStart: number, tsEnd: number): number {
  return Math.max(1, Math.round((tsEnd - tsStart) / 86400000))
}
