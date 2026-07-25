import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import RollAverageTrendChart from '../../app/components/RollAverageTrendChart.vue'
import type { RollAveragePoint } from '../../shared/utils/bingo'

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
    const wrapper = mount(RollAverageTrendChart, { props: { points } })
    expect(wrapper.find('polyline.daily').exists()).toBe(true)
    expect(wrapper.find('polyline.cumulative').exists()).toBe(true)
    expect(wrapper.find('polyline.daily').attributes('points')!.split(' ')).toHaveLength(3)
  })

  it('点の数だけマーカーを描き、日付・平均・記録数をツールチップに出す', () => {
    const wrapper = mount(RollAverageTrendChart, { props: { points } })
    const dots = wrapper.findAll('.chart-dots circle')
    expect(dots).toHaveLength(3)
    expect(dots[0]!.find('title').text()).toContain('2026/01/01')
    expect(dots[0]!.find('title').text()).toContain('平均 40')
  })

  it('平均値が高い点ほど上（Y座標が小さい）に描かれる', () => {
    const wrapper = mount(RollAverageTrendChart, { props: { points } })
    const ys = wrapper.findAll('.chart-dots circle').map((c) => Number(c.attributes('cy')))
    // average: 40 → 80 → 20
    expect(ys[1]).toBeLessThan(ys[0]!)
    expect(ys[2]).toBeGreaterThan(ys[0]!)
  })

  it('日付ラベルは点の数に応じて間引かれる', () => {
    const many = Array.from({ length: 30 }, (_, i) =>
      makePoint({ date: new Date(2026, 0, i + 1).getTime() }),
    )
    const wrapper = mount(RollAverageTrendChart, { props: { points: many } })
    const labels = wrapper.findAll('.chart-tick-labels text')
    expect(labels.length).toBeLessThanOrEqual(6)
    expect(labels[0]!.text()).toBe('1/1')
    expect(labels[labels.length - 1]!.text()).toBe('1/30')
  })

  it('点が1つでも描画できる（中央に配置する）', () => {
    const wrapper = mount(RollAverageTrendChart, { props: { points: [makePoint()] } })
    const dots = wrapper.findAll('.chart-dots circle')
    expect(dots).toHaveLength(1)
    expect(Number(dots[0]!.attributes('cx'))).toBeGreaterThan(0)
  })

  it('マイナスを含むレンジでは0の基準線を強調する', () => {
    const withMinus = [
      makePoint({ average: -20, cumulativeAverage: -20 }),
      makePoint({ date: new Date(2026, 0, 2).getTime(), average: 30, cumulativeAverage: 5 }),
    ]
    const wrapper = mount(RollAverageTrendChart, { props: { points: withMinus } })
    expect(wrapper.find('.chart-grid line.zero').exists()).toBe(true)
  })
})
