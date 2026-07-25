import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import IndexPage from '../../app/pages/index.vue'
import BingoTicket from '../../app/components/BingoTicket.vue'
import { NuxtLinkStub } from '../setup/NuxtLinkStub'
import { navigateTo, useFetch } from '../setup/nuxtStubs'
import { resetTestState } from '../setup/nitroGlobals'
import { makeSummary } from '../setup/fixtures'

const global = { components: { BingoTicket, NuxtLink: NuxtLinkStub } }

beforeEach(() => {
  resetTestState()
})

describe('index.vue', () => {
  it('読み込み中はローディング表示のみ', () => {
    vi.mocked(useFetch).mockReturnValue({ data: ref(undefined), status: ref('pending') })
    const wrapper = mount(IndexPage, { global })
    expect(wrapper.find('.loading').exists()).toBe(true)
  })

  it('進行中カードが無ければ空状態を表示する', () => {
    vi.mocked(useFetch).mockReturnValue({
      data: ref([makeSummary({ archived: true })]),
      status: ref('success'),
    })
    const wrapper = mount(IndexPage, { global })
    expect(wrapper.find('.empty').exists()).toBe(true)
  })

  it('進行中カードのみを新しい順に一覧表示する（アーカイブ済みは除外）', () => {
    vi.mocked(useFetch).mockReturnValue({
      data: ref([
        makeSummary({ id: 'old', name: '古い', createdAt: 100, archived: false }),
        makeSummary({ id: 'new', name: '新しい', createdAt: 200, archived: false }),
        makeSummary({ id: 'arc', name: '済み', archived: true }),
      ]),
      status: ref('success'),
    })
    const wrapper = mount(IndexPage, { global })
    const tickets = wrapper.findAllComponents(BingoTicket)
    expect(tickets).toHaveLength(2)
    expect(tickets[0]!.props('summary').id).toBe('new')
    expect(tickets[1]!.props('summary').id).toBe('old')
  })

  it('統計データへのリンクは /stats を指す', () => {
    vi.mocked(useFetch).mockReturnValue({ data: ref([]), status: ref('success') })
    const wrapper = mount(IndexPage, { global })
    const hrefs = wrapper.findAll('a').map((a) => a.attributes('href'))
    expect(hrefs).toContain('/stats')
  })

  it('作成ボタンでドラフトをクリアしてから作成ページへ遷移する', async () => {
    vi.mocked(useFetch).mockReturnValue({ data: ref([]), status: ref('success') })
    const wrapper = mount(IndexPage, { global })
    await wrapper.find('.empty .btn-primary').trigger('click')
    expect(navigateTo).toHaveBeenCalledWith('/card/create')
  })
})
