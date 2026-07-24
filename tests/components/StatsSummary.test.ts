import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import StatsSummary from '../../app/components/StatsSummary.vue'
import type { RollStats } from '../../shared/utils/bingo'

function makeStats(overrides: Partial<RollStats> = {}): RollStats {
  return {
    averageValue: 60,
    totalRolls: 10,
    avgRollsPerDay: 2,
    totalZorome: 1,
    zoromeRatioPercent: 10,
    punchRatePercent: 50,
    ...overrides,
  }
}

describe('StatsSummary', () => {
  it('整数値はそのまま、小数値は小数第1位までを表示する', () => {
    const wrapper = mount(StatsSummary, {
      props: { stats: makeStats({ averageValue: 60.456, totalRolls: 10, zoromeRatioPercent: 10 }) },
    })
    const values = wrapper.findAll('.summary-value').map((v) => v.text())
    expect(values[0]).toBe('60.5')
    expect(values[1]).toBe('10')
    expect(values[4]).toBe('10%')
  })
})
