import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import StatsIndexPage from '../../app/pages/stats/index.vue'
import PersonStatsList from '../../app/components/PersonStatsList.vue'
import StatsSummary from '../../app/components/StatsSummary.vue'
import { NuxtLinkStub } from '../setup/NuxtLinkStub'
import { useAsyncData } from '../setup/nuxtStubs'
import { useBingoApi } from '../../app/composables/useBingoApi'
import { resetTestState } from '../setup/nitroGlobals'
import { makeCard, makeRoll } from '../setup/fixtures'

vi.mock('../../app/composables/useBingoApi', () => ({ useBingoApi: vi.fn() }))

const global = { components: { PersonStatsList, StatsSummary, NuxtLink: NuxtLinkStub } }

beforeEach(() => {
  resetTestState()
  vi.mocked(useBingoApi).mockReturnValue({} as unknown as ReturnType<typeof useBingoApi>)
})

describe('stats/index.vue', () => {
  it('読み込み中はローディング表示', () => {
    vi.mocked(useAsyncData).mockReturnValue({ data: ref(undefined), status: ref('pending') })
    const wrapper = mount(StatsIndexPage, { global })
    expect(wrapper.find('.loading').exists()).toBe(true)
  })

  it('記録が無ければ空状態を表示する', () => {
    vi.mocked(useAsyncData).mockReturnValue({ data: ref([]), status: ref('success') })
    const wrapper = mount(StatsIndexPage, { global })
    expect(wrapper.find('.empty').exists()).toBe(true)
    expect(wrapper.findComponent(PersonStatsList).exists()).toBe(false)
  })

  it('同名カードを1人にまとめて統計を集計し最終更新順に並べる', () => {
    const cards = [
      makeCard({ id: 'a1', name: '太郎', createdAt: 1, updatedAt: 100, rolls: [makeRoll(1, 1)] }),
      makeCard({ id: 'a2', name: '太郎', createdAt: 2, updatedAt: 300, rolls: [makeRoll(2, 2)] }),
      makeCard({ id: 'b1', name: '花子', createdAt: 3, updatedAt: 200 }),
    ]
    vi.mocked(useAsyncData).mockReturnValue({ data: ref(cards), status: ref('success') })
    const wrapper = mount(StatsIndexPage, { global })
    const rows = wrapper.findComponent(PersonStatsList).props('rows') as {
      name: string
      stats: { totalRolls: number }
    }[]
    expect(rows.map((r) => r.name)).toEqual(['太郎', '花子'])
    // 太郎は2枚分の出目を合算する
    expect(rows[0]!.stats.totalRolls).toBe(2)
    expect(rows[1]!.stats.totalRolls).toBe(0)
  })

  it('人別の一覧にビンゴカード枚数・最終更新日は表示しない', () => {
    const cards = [makeCard({ id: 'a1', name: '太郎', updatedAt: 100 })]
    vi.mocked(useAsyncData).mockReturnValue({ data: ref(cards), status: ref('success') })
    const wrapper = mount(StatsIndexPage, { global })
    const list = wrapper.findComponent(PersonStatsList)
    // 「ビンゴカードパンチ率」は残るので、枚数表記と最終更新日が無いことで確認する
    expect(list.text()).not.toContain('枚')
    expect(list.text()).not.toContain('最終更新')
  })
})
