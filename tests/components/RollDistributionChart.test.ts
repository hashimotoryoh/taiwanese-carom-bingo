import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import RollDistributionChart from '../../app/components/RollDistributionChart.vue'
import { rollDistribution, type RollDistributionBin } from '../../shared/utils/bingo'
import { makeCard, makeRoll } from '../setup/fixtures'

/** 指定した区間インデックスに件数を持つ分布を作る */
function makeBins(counts: Record<number, number>): RollDistributionBin[] {
  return rollDistribution([]).map((bin, i) => ({ ...bin, count: counts[i] ?? 0 }))
}

describe('RollDistributionChart', () => {
  it('区間の数だけ棒を描く', () => {
    const wrapper = mount(RollDistributionChart, { props: { bins: makeBins({ 0: 3 }) } })
    expect(wrapper.findAll('.chart-bars rect')).toHaveLength(12)
  })

  it('期待度数からの偏差を符号付きで表示する', () => {
    // 全24回を2区間で分け合うと期待度数は 24 / 12 = 2 回
    const wrapper = mount(RollDistributionChart, { props: { bins: makeBins({ 0: 6, 1: 18 }) } })
    const values = wrapper.findAll('.chart-bar-value').map((v) => v.text())
    expect(values[0]).toBe('+4')
    expect(values[1]).toBe('+16')
    expect(values[2]).toBe('-2')
    expect(wrapper.text()).toContain('期待度数 2 回からの偏差')
  })

  it('期待より少ない区間の棒には negative を付ける', () => {
    const wrapper = mount(RollDistributionChart, { props: { bins: makeBins({ 0: 6, 1: 18 }) } })
    const bars = wrapper.findAll('.chart-bars rect')
    expect(bars[0]!.classes()).not.toContain('negative')
    expect(bars[2]!.classes()).toContain('negative')
  })

  it('偏差が大きい区間ほど棒が高い', () => {
    const wrapper = mount(RollDistributionChart, { props: { bins: makeBins({ 0: 6, 1: 18 }) } })
    const bars = wrapper.findAll('.chart-bars rect')
    expect(Number(bars[1]!.attributes('height'))).toBeGreaterThan(
      Number(bars[0]!.attributes('height')),
    )
  })

  it('正の偏差は基準線より上、負の偏差は下に伸びる', () => {
    const wrapper = mount(RollDistributionChart, { props: { bins: makeBins({ 0: 6, 1: 18 }) } })
    const zeroY = Number(wrapper.find('.chart-baseline').attributes('y1'))
    const bars = wrapper.findAll('.chart-bars rect')
    // 正の偏差は上端が基準線より上（Y座標が小さい）
    expect(Number(bars[0]!.attributes('y'))).toBeLessThan(zeroY)
    // 負の偏差は上端が基準線と同じで、そこから下へ伸びる
    expect(Number(bars[2]!.attributes('y'))).toBe(zeroY)
    expect(Number(bars[2]!.attributes('height'))).toBeGreaterThan(0)
  })

  it('記録が無ければどの区間も偏差0になる', () => {
    const wrapper = mount(RollDistributionChart, { props: { bins: makeBins({}) } })
    const heights = wrapper.findAll('.chart-bars rect').map((r) => Number(r.attributes('height')))
    expect(heights.every((h) => h === 0)).toBe(true)
    expect(wrapper.findAll('.chart-bars rect.negative')).toHaveLength(0)
  })

  it('ツールチップには記録数と偏差の両方を出す', () => {
    const wrapper = mount(RollDistributionChart, { props: { bins: makeBins({ 1: 24 }) } })
    expect(wrapper.findAll('.chart-bars title')[1]!.text().replace(/\s+/g, ' ')).toBe(
      '11〜20: 24回（偏差 +22）',
    )
  })

  it('実際の出目から作った分布をそのまま描画できる', () => {
    const card = makeCard({ rolls: [makeRoll(5, 0), makeRoll(7, 1), makeRoll(120, 2)] })
    const wrapper = mount(RollDistributionChart, { props: { bins: rollDistribution([card]) } })
    const values = wrapper.findAll('.chart-bar-value').map((v) => v.text())
    // 期待度数は 3 / 12 = 0.25 回
    expect(values[0]).toBe('+1.8')
    expect(values[1]).toBe('-0.3')
    expect(values[11]).toBe('+0.8')
  })
})
