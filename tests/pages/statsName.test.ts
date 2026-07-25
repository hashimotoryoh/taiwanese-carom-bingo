import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import StatsNamePage from '../../app/pages/stats/[name].vue'
import BingoTicket from '../../app/components/BingoTicket.vue'
import StatsSummary from '../../app/components/StatsSummary.vue'
import RollAverageTrendChart from '../../app/components/RollAverageTrendChart.vue'
import RollDistributionChart from '../../app/components/RollDistributionChart.vue'
import CrossCardRollHistoryTable from '../../app/components/CrossCardRollHistoryTable.vue'
import { NuxtLinkStub } from '../setup/NuxtLinkStub'
import { useAsyncData, useRoute } from '../setup/nuxtStubs'
import { useBingoApi } from '../../app/composables/useBingoApi'
import { resetTestState } from '../setup/nitroGlobals'
import { makeCard, makeRoll } from '../setup/fixtures'

vi.mock('../../app/composables/useBingoApi', () => ({ useBingoApi: vi.fn() }))

const global = {
  components: {
    BingoTicket,
    StatsSummary,
    RollAverageTrendChart,
    RollDistributionChart,
    CrossCardRollHistoryTable,
    NuxtLink: NuxtLinkStub,
  },
}

beforeEach(() => {
  resetTestState()
  vi.mocked(useRoute).mockReturnValue({ params: { name: '太郎' } })
  vi.mocked(useBingoApi).mockReturnValue({} as unknown as ReturnType<typeof useBingoApi>)
})

describe('stats/[name].vue', () => {
  it('該当カードが無ければ見つからない旨を表示する', () => {
    vi.mocked(useAsyncData).mockReturnValue({ data: ref([]), status: ref('success') })
    const wrapper = mount(StatsNamePage, { global })
    expect(wrapper.text()).toContain('太郎さんの記録は見つかりませんでした。')
  })

  it('該当する名前のカードのみ新しい順に表示する', () => {
    const cards = [
      makeCard({ id: 'a', name: '太郎', createdAt: 1 }),
      makeCard({ id: 'b', name: '花子', createdAt: 2 }),
      makeCard({ id: 'c', name: '太郎', createdAt: 3, bingoAchieved: true }),
    ]
    vi.mocked(useAsyncData).mockReturnValue({ data: ref(cards), status: ref('success') })
    const wrapper = mount(StatsNamePage, { global })
    const tickets = wrapper.findAllComponents(BingoTicket)
    expect(tickets).toHaveLength(2)
    expect(tickets[0]!.props('summary').id).toBe('c')
    expect(wrapper.text()).toContain('ビンゴ達成 1 回')
  })

  it('出目があれば遷移グラフ・分布図・履歴を表示する', () => {
    const cards = [
      makeCard({ id: 'a', name: '太郎', rolls: [makeRoll(1, new Date(2026, 0, 1).getTime())] }),
      makeCard({ id: 'b', name: '花子', rolls: [makeRoll(2, new Date(2026, 0, 2).getTime())] }),
    ]
    vi.mocked(useAsyncData).mockReturnValue({ data: ref(cards), status: ref('success') })
    const wrapper = mount(StatsNamePage, { global })
    expect(wrapper.findComponent(RollAverageTrendChart).exists()).toBe(true)
    expect(wrapper.findComponent(RollDistributionChart).exists()).toBe(true)
    const history = wrapper.findComponent(CrossCardRollHistoryTable)
    expect(history.exists()).toBe(true)
    // 他人のカードは集計に含めない
    expect(history.props('cards').map((c) => c.id)).toEqual(['a'])
    expect(wrapper.findComponent(RollAverageTrendChart).props('points')).toHaveLength(1)
  })

  it('出目が無ければグラフや履歴の代わりに未記録の案内を表示する', () => {
    const cards = [makeCard({ id: 'a', name: '太郎' })]
    vi.mocked(useAsyncData).mockReturnValue({ data: ref(cards), status: ref('success') })
    const wrapper = mount(StatsNamePage, { global })
    expect(wrapper.findComponent(RollAverageTrendChart).exists()).toBe(false)
    expect(wrapper.findComponent(RollDistributionChart).exists()).toBe(false)
    expect(wrapper.findComponent(CrossCardRollHistoryTable).exists()).toBe(false)
    expect(wrapper.text()).toContain('まだ出目が記録されていません。')
  })

  it('全統計データへのリンクは /stats を指す', () => {
    const cards = [makeCard({ id: 'a', name: '太郎' })]
    vi.mocked(useAsyncData).mockReturnValue({ data: ref(cards), status: ref('success') })
    const wrapper = mount(StatsNamePage, { global })
    expect(wrapper.find('a').attributes('href')).toBe('/stats')
  })
})
