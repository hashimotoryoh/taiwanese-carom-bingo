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
  it('決められた順番のラベルで表示する', () => {
    const wrapper = mount(StatsSummary, { props: { stats: makeStats() } })
    expect(wrapper.findAll('.summary-label').map((l) => l.text())).toEqual([
      '総カイルン回数',
      '同日平均カイルン回数',
      '出目の平均値',
      'ゾロ目回数',
      'ゾロ目割合',
      'ビンゴカードパンチ率',
    ])
  })

  it('totalRollsLabelでカイルン総数のラベルを差し替えられる', () => {
    const wrapper = mount(StatsSummary, {
      props: { stats: makeStats(), totalRollsLabel: 'カイルン回数' },
    })
    expect(wrapper.findAll('.summary-label')[0]!.text()).toBe('カイルン回数')
  })

  it('整数値はそのまま、小数値は小数第1位までを表示する', () => {
    const wrapper = mount(StatsSummary, {
      props: {
        stats: makeStats({ totalRolls: 10, avgRollsPerDay: 2.34, averageValue: 60.456 }),
      },
    })
    const values = wrapper.findAll('.summary-value').map((v) => v.text())
    expect(values[0]).toBe('10')
    expect(values[1]).toBe('2.3')
    expect(values[2]).toBe('60.5')
    expect(values[4]).toBe('10%')
  })
})
