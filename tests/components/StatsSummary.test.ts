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
    // 「出目の平均値」の枠内で、統計値と同じ行（.summary-figure）に置く
    const note = wrapper.findAll('.summary-item')[1]!.find('.summary-figure .summary-note')
    expect(note.text()).toBe('期待値 51.7')
    // 計算の解説ページへのリンクになっている
    expect(note.attributes('href')).toBe('/doc/d120-expected-value')
  })

  it('ゾロ目回数の枠内に理論値（カイルン回数 × ゾロ目確率）を添える', () => {
    const wrapper = mount(StatsSummary, {
      props: { stats: makeStats({ totalRolls: 120 }) },
      global,
    })
    // 「ゾロ目回数」の枠内で、統計値と同じ行（.summary-figure）に置く
    const note = wrapper.findAll('.summary-item')[2]!.find('.summary-figure .summary-note')
    expect(note.text()).toBe('理論値 10回')
    // 計算の解説ページへのリンクになっている
    expect(note.attributes('href')).toBe('/doc/zorome-probability')
  })

  it('ゾロ目回数の理論値は小数第1位まで表示する', () => {
    const wrapper = mount(StatsSummary, {
      props: { stats: makeStats({ totalRolls: 10 }) },
      global,
    })
    const note = wrapper.findAll('.summary-item')[2]!.find('.summary-figure .summary-note')
    expect(note.text()).toBe('理論値 0.8回')
  })

  it('ゾロ目割合の枠内に理論値を添える', () => {
    const wrapper = mount(StatsSummary, { props: { stats: makeStats() }, global })
    // 「ゾロ目割合」の枠内で、統計値と同じ行（.summary-figure）に置く
    const note = wrapper.findAll('.summary-item')[3]!.find('.summary-figure .summary-note')
    expect(note.text()).toBe('理論値 8.3%')
    // 計算の解説ページへのリンクになっている
    expect(note.attributes('href')).toBe('/doc/zorome-probability')
  })

  it('補足を添えるのは出目の平均値・ゾロ目回数・ゾロ目割合の3枠だけ', () => {
    const wrapper = mount(StatsSummary, { props: { stats: makeStats() }, global })
    expect(wrapper.findAll('.summary-note')).toHaveLength(3)
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
    // 単位は数値に続けて表示する（間に余分な空白が入らないこと）
    expect(values[0]).toBe('10回')
    expect(values[1]).toBe('60.5')
    expect(values[3]).toBe('10%')
  })

  it('回数には「回」、割合には「%」の単位を数値と別要素で添える', () => {
    const wrapper = mount(StatsSummary, { props: { stats: makeStats() }, global })
    expect(wrapper.findAll('.summary-unit').map((u) => u.text())).toEqual(['回', '回', '%', '%'])
    // 出目の平均値には単位を付けない
    expect(wrapper.findAll('.summary-item')[1]!.find('.summary-unit').exists()).toBe(false)
  })
})
