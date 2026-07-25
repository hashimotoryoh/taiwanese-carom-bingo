import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import StatsSummary from '../../app/components/StatsSummary.vue'
import { NuxtLinkStub } from '../setup/NuxtLinkStub'
import type { RollStats } from '../../shared/utils/bingo'

const global = { components: { NuxtLink: NuxtLinkStub } }

function makeStats(overrides: Partial<RollStats> = {}): RollStats {
  return {
    averageValue: 60,
    totalRolls: 10,
    totalZorome: 1,
    zoromeRatioPercent: 10,
    punchRatePercent: 50,
    ...overrides,
  }
}

describe('StatsSummary', () => {
  it('決められた順番のラベルで表示する', () => {
    const wrapper = mount(StatsSummary, { props: { stats: makeStats() }, global })
    expect(wrapper.findAll('.summary-label').map((l) => l.text())).toEqual([
      '通算カイルン回数',
      '出目の平均値',
      '通算ゾロ目回数',
      '通算ゾロ目割合',
      '通算ビンゴカードパンチ率',
    ])
  })

  it('labelPrefixを空にすると「通算」の付かないラベルになる', () => {
    const wrapper = mount(StatsSummary, {
      props: { stats: makeStats(), labelPrefix: '' },
      global,
    })
    expect(wrapper.findAll('.summary-label').map((l) => l.text())).toEqual([
      'カイルン回数',
      '出目の平均値',
      'ゾロ目回数',
      'ゾロ目割合',
      'ビンゴカードパンチ率',
    ])
  })

  it('出目の平均値の枠内に期待値を添える', () => {
    const wrapper = mount(StatsSummary, { props: { stats: makeStats() }, global })
    const notes = wrapper.findAll('.summary-note')
    expect(notes).toHaveLength(1)
    expect(notes[0]!.text()).toBe('期待値 51.7')
    // 計算の解説ページへのリンクになっている
    expect(notes[0]!.attributes('href')).toBe('/doc/d120-expected-value')
    // 「出目の平均値」の枠内にあること
    expect(wrapper.findAll('.summary-item')[1]!.find('.summary-note').exists()).toBe(true)
  })

  it('compactを指定したときだけグリッドにcompactクラスを付ける', () => {
    const normal = mount(StatsSummary, { props: { stats: makeStats() }, global })
    expect(normal.find('.roll-summary').classes()).not.toContain('compact')

    const compact = mount(StatsSummary, { props: { stats: makeStats(), compact: true }, global })
    expect(compact.find('.roll-summary').classes()).toContain('compact')
  })

  it('整数値はそのまま、小数値は小数第1位までを表示する', () => {
    const wrapper = mount(StatsSummary, {
      props: {
        stats: makeStats({ totalRolls: 10, averageValue: 60.456 }),
      },
      global,
    })
    const values = wrapper.findAll('.summary-value').map((v) => v.text())
    expect(values[0]).toBe('10')
    expect(values[1]).toBe('60.5')
    expect(values[3]).toBe('10%')
  })
})
