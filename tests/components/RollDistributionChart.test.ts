import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import RollDistributionChart from '../../app/components/RollDistributionChart.vue'
import { rollDistribution, type RollDistributionBin } from '../../shared/utils/bingo'
import { makeCard, makeRoll } from '../setup/fixtures'

/** 指定した出目に件数を持つ分布を作る */
function makeBins(counts: Record<number, number>): RollDistributionBin[] {
  return rollDistribution([]).map((bin) => ({ ...bin, count: counts[bin.value] ?? 0 }))
}

describe('RollDistributionChart', () => {
  it('1〜120の全出目ぶんの棒を描く', () => {
    const wrapper = mount(RollDistributionChart, { props: { bins: makeBins({ 1: 3 }) } })
    expect(wrapper.findAll('.chart-bars rect')).toHaveLength(120)
  })

  it('期待より少ない出目の棒には negative を付ける', () => {
    // 全120回を出目1に集中させると期待度数は 120 / 120 = 1 回
    const wrapper = mount(RollDistributionChart, { props: { bins: makeBins({ 1: 120 }) } })
    const bars = wrapper.findAll('.chart-bars rect')
    expect(bars[0]!.classes()).not.toContain('negative')
    expect(bars[1]!.classes()).toContain('negative')
  })

  it('偏差が大きい出目ほど棒が高い', () => {
    const wrapper = mount(RollDistributionChart, { props: { bins: makeBins({ 1: 60, 2: 60 }) } })
    const bars = wrapper.findAll('.chart-bars rect')
    expect(Number(bars[0]!.attributes('height'))).toBeGreaterThan(
      Number(bars[2]!.attributes('height')),
    )
  })

  it('正の偏差は基準線より上、負の偏差は下に伸びる', () => {
    const wrapper = mount(RollDistributionChart, { props: { bins: makeBins({ 1: 120 }) } })
    const zeroY = Number(wrapper.find('.chart-baseline').attributes('y1'))
    const bars = wrapper.findAll('.chart-bars rect')
    expect(Number(bars[0]!.attributes('y'))).toBeLessThan(zeroY)
    expect(Number(bars[1]!.attributes('y'))).toBe(zeroY)
    expect(Number(bars[1]!.attributes('height'))).toBeGreaterThan(0)
  })

  it('記録が無ければどの出目も偏差0になる', () => {
    const wrapper = mount(RollDistributionChart, { props: { bins: makeBins({}) } })
    const heights = wrapper.findAll('.chart-bars rect').map((r) => Number(r.attributes('height')))
    expect(heights.every((h) => h === 0)).toBe(true)
    expect(wrapper.findAll('.chart-bars rect.negative')).toHaveLength(0)
  })

  it('ツールチップには記録数と偏差の両方を出す', () => {
    const wrapper = mount(RollDistributionChart, { props: { bins: makeBins({ 11: 120 }) } })
    expect(wrapper.findAll('.chart-bars title')[10]!.text().replace(/\s+/g, ' ')).toBe(
      '11: 120回（偏差 +119）',
    )
  })

  it('棒が細いときは偏差の値を出さない（ツールチップに任せる）', () => {
    const wrapper = mount(RollDistributionChart, { props: { bins: makeBins({ 1: 120 }) } })
    expect(wrapper.findAll('.chart-bar-value')).toHaveLength(0)
  })

  it('横軸は10刻みで、先頭の1も必ず表示する', () => {
    const wrapper = mount(RollDistributionChart, { props: { bins: makeBins({}) } })
    const labels = wrapper.findAll('.chart-tick-labels text').map((t) => t.text())
    expect(labels[0]).toBe('1')
    expect(labels).toContain('120')
    expect(labels.every((l) => l === '1' || Number(l) % 10 === 0)).toBe(true)
  })

  it('scrollableなら棒1本分の幅を確保してSVGを広げる', () => {
    const bins = makeBins({})
    const fit = mount(RollDistributionChart, { props: { bins } })
    const scrollable = mount(RollDistributionChart, { props: { bins, scrollable: true } })
    const fitWidth = Number(fit.find('.chart-svg').attributes('width'))
    const scrollWidth = Number(scrollable.find('.chart-svg').attributes('width'))
    expect(scrollWidth).toBeGreaterThan(fitWidth)
    expect(scrollWidth).toBeGreaterThanOrEqual(120 * 11)
  })

  it('実際の出目から作った分布をそのまま描画できる', () => {
    const card = makeCard({ rolls: [makeRoll(5, 0), makeRoll(5, 1), makeRoll(120, 2)] })
    const wrapper = mount(RollDistributionChart, { props: { bins: rollDistribution([card]) } })
    const bars = wrapper.findAll('.chart-bars rect')
    expect(bars[4]!.classes()).not.toContain('negative')
    expect(bars[0]!.classes()).toContain('negative')
    // 期待度数は 3 / 120 = 0.025 回
    expect(wrapper.text()).toContain('期待度数 0 回からの偏差')
  })
})
