import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import RollAverageTrendChart from '../../app/components/RollAverageTrendChart.vue'
import { NuxtLinkStub } from '../setup/NuxtLinkStub'
import type { RollAveragePoint } from '../../shared/utils/bingo'

const global = { components: { NuxtLink: NuxtLinkStub } }

function makePoint(overrides: Partial<RollAveragePoint> = {}): RollAveragePoint {
  return {
    date: new Date(2026, 0, 1).getTime(),
    count: 1,
    average: 50,
    cumulativeAverage: 50,
    ...overrides,
  }
}

const points: RollAveragePoint[] = [
  makePoint({ date: new Date(2026, 0, 1).getTime(), count: 2, average: 40, cumulativeAverage: 40 }),
  makePoint({ date: new Date(2026, 0, 2).getTime(), count: 1, average: 80, cumulativeAverage: 60 }),
  makePoint({ date: new Date(2026, 0, 5).getTime(), count: 3, average: 20, cumulativeAverage: 45 }),
]

describe('RollAverageTrendChart', () => {
  it('日ごとの平均と通算平均の2本の折れ線を描く', () => {
    const wrapper = mount(RollAverageTrendChart, { props: { points }, global })
    expect(wrapper.find('polyline.daily').exists()).toBe(true)
    expect(wrapper.find('polyline.cumulative').exists()).toBe(true)
    expect(wrapper.find('polyline.daily').attributes('points')!.split(' ')).toHaveLength(3)
  })

  it('点の数だけマーカーを描き、日付・平均・記録数をツールチップに出す', () => {
    const wrapper = mount(RollAverageTrendChart, { props: { points }, global })
    const dots = wrapper.findAll('.chart-dots circle')
    expect(dots).toHaveLength(3)
    expect(dots[0]!.find('title').text()).toContain('2026/01/01')
    // 割り切れる平均値でも小数第1位まで表示する
    expect(dots[0]!.find('title').text()).toContain('平均 40.0')
  })

  it('平均値が高い点ほど上（Y座標が小さい）に描かれる', () => {
    const wrapper = mount(RollAverageTrendChart, { props: { points }, global })
    const ys = wrapper.findAll('.chart-dots circle').map((c) => Number(c.attributes('cy')))
    // average: 40 → 80 → 20
    expect(ys[1]).toBeLessThan(ys[0]!)
    expect(ys[2]).toBeGreaterThan(ys[0]!)
  })

  it('日付ラベルは点の数に応じて間引かれる', () => {
    const many = Array.from({ length: 30 }, (_, i) =>
      makePoint({ date: new Date(2026, 0, i + 1).getTime() }),
    )
    const wrapper = mount(RollAverageTrendChart, { props: { points: many }, global })
    const labels = wrapper.findAll('.chart-tick-labels text')
    expect(labels.length).toBeLessThanOrEqual(6)
    expect(labels[0]!.text()).toBe('1/1')
    expect(labels[labels.length - 1]!.text()).toBe('1/30')
  })

  it('点が1つでも描画できる（中央に配置する）', () => {
    const wrapper = mount(RollAverageTrendChart, { props: { points: [makePoint()] }, global })
    const dots = wrapper.findAll('.chart-dots circle')
    expect(dots).toHaveLength(1)
    expect(Number(dots[0]!.attributes('cx'))).toBeGreaterThan(0)
  })

  it('期待値の基準線を引き、凡例に値を表示する', () => {
    const wrapper = mount(RollAverageTrendChart, { props: { points }, global })
    expect(wrapper.find('.chart-expected').exists()).toBe(true)
    const legend = wrapper.find('.chart-legend-item.expected')
    expect(legend.text()).toBe('期待値 51.7')
    // 計算の解説ページへのリンクになっている
    expect(legend.attributes('href')).toBe('/doc/d120-expected-value')
  })

  it('平均値が期待値から離れていても基準線はグラフ内に収まる', () => {
    const far = [makePoint({ average: 200, cumulativeAverage: 200 })]
    const wrapper = mount(RollAverageTrendChart, { props: { points: far }, global })
    const y = Number(wrapper.find('.chart-expected').attributes('y1'))
    const dotY = Number(wrapper.find('.chart-dots circle').attributes('cy'))
    expect(y).toBeGreaterThan(dotY)
    expect(y).toBeLessThan(240)
  })

  it('0の基準線を強調する', () => {
    const withMinus = [
      makePoint({ average: -20, cumulativeAverage: -20 }),
      makePoint({ date: new Date(2026, 0, 2).getTime(), average: 30, cumulativeAverage: 5 }),
    ]
    const wrapper = mount(RollAverageTrendChart, { props: { points: withMinus }, global })
    expect(wrapper.find('.chart-grid line.zero').exists()).toBe(true)
  })

  it('目安線は値の範囲によらず常に 0・40・80 の3本', () => {
    const cases: RollAveragePoint[][] = [
      points,
      [makePoint({ average: -30, cumulativeAverage: -30 })],
      [makePoint({ average: 200, cumulativeAverage: 200 })],
      [makePoint({ average: 50.5, cumulativeAverage: 50.5 })],
    ]
    for (const props of cases) {
      const wrapper = mount(RollAverageTrendChart, { props: { points: props }, global })
      expect(wrapper.findAll('.chart-grid .chart-axis-label').map((t) => t.text())).toEqual([
        '0',
        '40',
        '80',
      ])
    }
  })

  it('目安線はどれもグラフの内側に収まる（値が偏っていても切れない）', () => {
    const far = [makePoint({ average: 300, cumulativeAverage: 300 })]
    const wrapper = mount(RollAverageTrendChart, { props: { points: far }, global })
    const ys = wrapper.findAll('.chart-grid line').map((l) => Number(l.attributes('y1')))
    expect(ys).toHaveLength(3)
    for (const y of ys) {
      expect(y).toBeGreaterThan(0)
      expect(y).toBeLessThan(240)
    }
    // 0・40・80 の順に下から並ぶ（値が大きいほどY座標は小さい）
    expect(ys[0]).toBeGreaterThan(ys[1]!)
    expect(ys[1]).toBeGreaterThan(ys[2]!)
  })
})
