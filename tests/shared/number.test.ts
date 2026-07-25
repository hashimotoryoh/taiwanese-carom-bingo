import { describe, expect, it } from 'vitest'
import { fmtNum } from '../../shared/utils/number'

describe('fmtNum', () => {
  it('整数はそのまま文字列にする', () => {
    expect(fmtNum(0)).toBe('0')
    expect(fmtNum(12)).toBe('12')
    expect(fmtNum(-3)).toBe('-3')
  })

  it('小数は第1位までに丸める', () => {
    expect(fmtNum(60.44)).toBe('60.4')
    expect(fmtNum(60.456)).toBe('60.5')
    expect(fmtNum(2.34)).toBe('2.3')
  })
})
