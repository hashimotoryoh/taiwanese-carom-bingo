import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import ArchivedPage from '../../app/pages/card/archived.vue'
import BingoTicket from '../../app/components/BingoTicket.vue'
import { NuxtLinkStub } from '../setup/NuxtLinkStub'
import { useFetch } from '../setup/nuxtStubs'
import { resetTestState } from '../setup/nitroGlobals'
import { makeSummary } from '../setup/fixtures'

const global = { components: { BingoTicket, NuxtLink: NuxtLinkStub } }

beforeEach(() => {
  resetTestState()
})

describe('card/archived.vue', () => {
  it('読み込み中はローディング表示', () => {
    vi.mocked(useFetch).mockReturnValue({ data: ref(undefined), status: ref('pending') })
    const wrapper = mount(ArchivedPage, { global })
    expect(wrapper.find('.loading').exists()).toBe(true)
  })

  it('アーカイブ済みカードが無ければ空状態を表示する', () => {
    vi.mocked(useFetch).mockReturnValue({
      data: ref([makeSummary({ archived: false })]),
      status: ref('success'),
    })
    const wrapper = mount(ArchivedPage, { global })
    expect(wrapper.find('.empty').exists()).toBe(true)
  })

  it('アーカイブ済みカードのみ一覧表示する', () => {
    vi.mocked(useFetch).mockReturnValue({
      data: ref([
        makeSummary({ id: 'active', archived: false }),
        makeSummary({ id: 'arc', archived: true }),
      ]),
      status: ref('success'),
    })
    const wrapper = mount(ArchivedPage, { global })
    const tickets = wrapper.findAllComponents(BingoTicket)
    expect(tickets).toHaveLength(1)
    expect(tickets[0]!.props('summary').id).toBe('arc')
  })

  it('一覧では完全削除ボタンを表示しない（削除はカード詳細ページで行う）', () => {
    vi.mocked(useFetch).mockReturnValue({
      data: ref([makeSummary({ id: 'arc', archived: true })]),
      status: ref('success'),
    })
    const wrapper = mount(ArchivedPage, { global })
    expect(wrapper.find('.delete-btn').exists()).toBe(false)
    expect(wrapper.text()).not.toContain('完全に削除')
  })
})
