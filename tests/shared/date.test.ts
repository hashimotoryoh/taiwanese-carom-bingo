import { describe, expect, it } from 'vitest'
import { daysBetween, fmtDate, fmtDateTime } from '../../shared/utils/date'

describe('fmtDate', () => {
  it('YYYY/MM/DD 形式にフォーマットする', () => {
    expect(fmtDate(new Date(2026, 0, 5).getTime())).toBe('2026/01/05')
  })

  it('月・日を2桁にゼロ埋めする', () => {
    expect(fmtDate(new Date(2026, 11, 31).getTime())).toBe('2026/12/31')
  })
})

describe('fmtDateTime', () => {
  it('YYYY/MM/DD HH:mm 形式にフォーマットする', () => {
    const ts = new Date(2026, 6, 24, 9, 5).getTime()
    expect(fmtDateTime(ts)).toBe('2026/07/24 09:05')
  })

  it('時・分を2桁にゼロ埋めする', () => {
    const ts = new Date(2026, 6, 24, 23, 59).getTime()
    expect(fmtDateTime(ts)).toBe('2026/07/24 23:59')
  })
})

describe('daysBetween', () => {
  it('日数差を四捨五入して返す', () => {
    const start = new Date(2026, 0, 1).getTime()
    const end = new Date(2026, 0, 4).getTime()
    expect(daysBetween(start, end)).toBe(3)
  })

  it('同一日時の場合でも最小1日を返す', () => {
    const ts = new Date(2026, 0, 1).getTime()
    expect(daysBetween(ts, ts)).toBe(1)
  })

  it('終了が開始より前でも最小1日を返す（負値にならない）', () => {
    const start = new Date(2026, 0, 4).getTime()
    const end = new Date(2026, 0, 1).getTime()
    expect(daysBetween(start, end)).toBe(1)
  })

  it('端数は四捨五入される', () => {
    const start = 0
    const end = 86400000 * 1.6
    expect(daysBetween(start, end)).toBe(2)
  })
})
