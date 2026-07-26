import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import RollSummary from '../../app/components/RollSummary.vue'
import StatsSummary from '../../app/components/StatsSummary.vue'
import { makeCard, makeRoll } from '../setup/fixtures'

describe('RollSummary', () => {
  it('カードの出目からStatsSummaryへ統計を渡して表示する', () => {
    const card = makeCard({ rolls: [makeRoll(10, 100), makeRoll(20, 200)] })
    const wrapper = mount(RollSummary, {
      props: { card },
      global: { components: { StatsSummary } },
    })
    // カード単体のページではラベルを「カイルン回数」にする
    expect(wrapper.findAll('.summary-label')[0]!.text()).toBe('カイルン回数')
    expect(wrapper.findAll('.summary-value')[0]!.text()).toBe('2回')
  })
})
