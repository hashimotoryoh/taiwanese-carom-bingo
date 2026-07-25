import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import PersonStatsTable from '../../app/components/PersonStatsTable.vue'
import { navigateTo } from '../setup/nuxtStubs'
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

describe('PersonStatsTable', () => {
  it('決められた順番の見出しを表示する', () => {
    const wrapper = mount(PersonStatsTable, { props: { rows: [] } })
    expect(wrapper.findAll('thead th').map((th) => th.text())).toEqual([
      '名前',
      '総カイルン回数',
      '同日平均カイルン回数',
      '出目の平均値',
      'ゾロ目回数',
      'ゾロ目割合',
      'ビンゴカードパンチ率',
    ])
  })

  it('人ごとに統計値を1行で表示する（小数は第1位まで）', () => {
    const wrapper = mount(PersonStatsTable, {
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
    })
    const rows = wrapper.findAll('tbody tr')
    expect(rows).toHaveLength(1)
    expect(rows[0]!.find('.stats-name').text()).toBe('太郎')
    expect(rows[0]!.findAll('td').map((td) => td.text())).toEqual([
      '12',
      '2.3',
      '60.4',
      '3',
      '25%',
      '41.7%',
    ])
  })

  it('各値に見出しをdata-labelとして持たせる（狭い画面での縦積み表示用）', () => {
    const wrapper = mount(PersonStatsTable, {
      props: { rows: [{ name: '太郎', stats: makeStats() }] },
    })
    expect(wrapper.findAll('tbody td').map((td) => td.attributes('data-label'))).toEqual([
      '総カイルン回数',
      '同日平均カイルン回数',
      '出目の平均値',
      'ゾロ目回数',
      'ゾロ目割合',
      'ビンゴカードパンチ率',
    ])
  })

  it('行クリックで個人統計データページへ遷移する（名前はURLエンコードする）', async () => {
    const wrapper = mount(PersonStatsTable, {
      props: { rows: [{ name: '太郎', stats: makeStats() }] },
    })
    await wrapper.find('.stats-row').trigger('click')
    expect(navigateTo).toHaveBeenCalledWith('/stats/%E5%A4%AA%E9%83%8E')
  })
})
