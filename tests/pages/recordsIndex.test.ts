import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import RecordsIndexPage from '../../app/pages/records/index.vue'
import RecordTicket from '../../app/components/RecordTicket.vue'
import StatsSummary from '../../app/components/StatsSummary.vue'
import { NuxtLinkStub } from '../setup/NuxtLinkStub'
import { useAsyncData } from '../setup/nuxtStubs'
import { useBingoApi } from '../../app/composables/useBingoApi'
import { resetTestState } from '../setup/nitroGlobals'
import { makeCard, makeRoll } from '../setup/fixtures'

vi.mock('../../app/composables/useBingoApi', () => ({ useBingoApi: vi.fn() }))

const global = { components: { RecordTicket, StatsSummary, NuxtLink: NuxtLinkStub } }

beforeEach(() => {
  resetTestState()
  vi.mocked(useBingoApi).mockReturnValue({} as unknown as ReturnType<typeof useBingoApi>)
})

describe('records/index.vue', () => {
  it('読み込み中はローディング表示', () => {
    vi.mocked(useAsyncData).mockReturnValue({ data: ref(undefined), status: ref('pending') })
    const wrapper = mount(RecordsIndexPage, { global })
    expect(wrapper.find('.loading').exists()).toBe(true)
  })

  it('記録が無ければ空状態を表示する', () => {
    vi.mocked(useAsyncData).mockReturnValue({ data: ref([]), status: ref('success') })
    const wrapper = mount(RecordsIndexPage, { global })
    expect(wrapper.find('.empty').exists()).toBe(true)
  })

  it('同名カードを1人として集計し最終更新順に並べる', () => {
    const cards = [
      makeCard({ id: 'a1', name: '太郎', createdAt: 1, updatedAt: 100, rolls: [makeRoll(1, 1)] }),
      makeCard({ id: 'a2', name: '太郎', createdAt: 2, updatedAt: 300, bingoAchieved: true }),
      makeCard({ id: 'b1', name: '花子', createdAt: 3, updatedAt: 200 }),
    ]
    vi.mocked(useAsyncData).mockReturnValue({ data: ref(cards), status: ref('success') })
    const wrapper = mount(RecordsIndexPage, { global })
    const tickets = wrapper.findAllComponents(RecordTicket)
    expect(tickets).toHaveLength(2)
    // 太郎(最終更新300) > 花子(最終更新200)の順
    expect(tickets[0]!.props('title')).toBe('太郎')
    expect(tickets[0]!.props('meta')).toContain('ビンゴカード 2 枚')
    expect(tickets[0]!.props('badge')).toEqual({ text: '1回ビンゴ達成', kind: 'bingo' })
    expect(tickets[1]!.props('title')).toBe('花子')
    expect(tickets[1]!.props('badge')).toBeNull()
  })

  it('アーカイブ済みカードのリーチはカウントしない', () => {
    const cards = [
      makeCard({
        id: 'a1',
        name: '太郎',
        archived: true,
        rolls: [makeRoll(1, 1), makeRoll(2, 2), makeRoll(3, 3), makeRoll(4, 4)],
      }),
    ]
    vi.mocked(useAsyncData).mockReturnValue({ data: ref(cards), status: ref('success') })
    const wrapper = mount(RecordsIndexPage, { global })
    const chips = wrapper.findComponent(RecordTicket).props('chips') as { text: string }[]
    expect(chips.some((c) => c.text.includes('リーチ'))).toBe(false)
  })
})
