import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import PersonStatsList from '../../app/components/PersonStatsList.vue'
import StatsSummary from '../../app/components/StatsSummary.vue'
import { navigateTo } from '../setup/nuxtStubs'
import type { RollStats } from '../../shared/utils/bingo'

const global = { components: { StatsSummary } }

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

describe('PersonStatsList', () => {
  it('人ごとに名前と統計タイルのグリッドを表示する', () => {
    const wrapper = mount(PersonStatsList, {
      props: {
        rows: [
          { name: '太郎', stats: makeStats({ totalRolls: 12 }) },
          { name: '花子', stats: makeStats({ totalRolls: 3 }) },
        ],
      },
      global,
    })
    const blocks = wrapper.findAll('.person-stats')
    expect(blocks).toHaveLength(2)
    expect(blocks.map((b) => b.find('.person-stats-name').text())).toEqual(['太郎', '花子'])
    // 全体集計と同じ .roll-summary のタイルグリッドを人ごとに持つ
    expect(wrapper.findAllComponents(StatsSummary)).toHaveLength(2)
    expect(wrapper.findAll('.roll-summary')).toHaveLength(2)
  })

  it('全体集計と区別するため控えめな見た目（compact）で表示する', () => {
    const wrapper = mount(PersonStatsList, {
      props: { rows: [{ name: '太郎', stats: makeStats() }] },
      global,
    })
    expect(wrapper.findComponent(StatsSummary).props('compact')).toBe(true)
    expect(wrapper.find('.roll-summary').classes()).toContain('compact')
  })

  it('全体集計と同じ順番・名称のラベルを表示する', () => {
    const wrapper = mount(PersonStatsList, {
      props: { rows: [{ name: '太郎', stats: makeStats() }] },
      global,
    })
    expect(wrapper.findAll('.summary-label').map((l) => l.text())).toEqual([
      '総カイルン回数',
      '同日平均カイルン回数',
      '出目の平均値',
      'ゾロ目回数',
      'ゾロ目割合',
      'ビンゴカードパンチ率',
    ])
  })

  it('統計値を表示する（小数は第1位まで）', () => {
    const wrapper = mount(PersonStatsList, {
      props: {
        rows: [
          {
            name: '太郎',
            stats: makeStats({
              totalRolls: 12,
              avgRollsPerDay: 2.34,
              averageValue: 60.44,
              totalZorome: 3,
              zoromeRatioPercent: 25,
              punchRatePercent: 41.666,
            }),
          },
        ],
      },
      global,
    })
    expect(wrapper.findAll('.summary-value').map((v) => v.text())).toEqual([
      '12',
      '2.3',
      '60.4',
      '3',
      '25%',
      '41.7%',
    ])
  })

  it('クリックで個人統計データページへ遷移する（名前はURLエンコードする）', async () => {
    const wrapper = mount(PersonStatsList, {
      props: { rows: [{ name: '太郎', stats: makeStats() }] },
      global,
    })
    await wrapper.find('.person-stats').trigger('click')
    expect(navigateTo).toHaveBeenCalledWith('/stats/%E5%A4%AA%E9%83%8E')
  })
})
