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

  it('記録数が多い区間ほど棒が高い', () => {
    const wrapper = mount(RollDistributionChart, { props: { bins: makeBins({ 0: 1, 1: 4 }) } })
    const bars = wrapper.findAll('.chart-bars rect')
    expect(Number(bars[1]!.attributes('height'))).toBeGreaterThan(
      Number(bars[0]!.attributes('height')),
    )
    expect(Number(bars[2]!.attributes('height'))).toBe(0)
  })

  it('最も記録数の多い区間を強調する', () => {
    const wrapper = mount(RollDistributionChart, { props: { bins: makeBins({ 0: 1, 1: 4 }) } })
    const bars = wrapper.findAll('.chart-bars rect')
    expect(bars[1]!.classes()).toContain('top')
    expect(bars[0]!.classes()).not.toContain('top')
  })

  it('記録が無ければどの区間も強調しない', () => {
    const wrapper = mount(RollDistributionChart, { props: { bins: makeBins({}) } })
    expect(wrapper.findAll('.chart-bars rect.top')).toHaveLength(0)
    expect(wrapper.findAll('.chart-bar-value')).toHaveLength(0)
  })

  it('記録数のある区間には件数と区間を示すツールチップを出す', () => {
    const wrapper = mount(RollDistributionChart, { props: { bins: makeBins({ 1: 4 }) } })
    const values = wrapper.findAll('.chart-bar-value')
    expect(values).toHaveLength(1)
    expect(values[0]!.text()).toBe('4')
    expect(wrapper.findAll('.chart-bars title')[1]!.text()).toBe('11〜20: 4回')
  })

  it('実際の出目から作った分布をそのまま描画できる', () => {
    const card = makeCard({ rolls: [makeRoll(5, 0), makeRoll(7, 1), makeRoll(120, 2)] })
    const wrapper = mount(RollDistributionChart, { props: { bins: rollDistribution([card]) } })
    const values = wrapper.findAll('.chart-bar-value').map((v) => v.text())
    expect(values).toEqual(['2', '1'])
  })
})
