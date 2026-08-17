import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import StatsFacesPage from '../../app/pages/stats/faces.vue'
import { NuxtLinkStub } from '../setup/NuxtLinkStub'
import { useAsyncData } from '../setup/nuxtStubs'
import { useBingoApi } from '../../app/composables/useBingoApi'
import { resetTestState } from '../setup/nitroGlobals'
import { useBreadcrumbsState } from '../../app/composables/useBreadcrumbs'
import { makeCard, makeRoll } from '../setup/fixtures'

vi.mock('../../app/composables/useBingoApi', () => ({ useBingoApi: vi.fn() }))

const global = {
  components: {
    NuxtLink: NuxtLinkStub,
  },
}

beforeEach(() => {
  resetTestState()
  vi.mocked(useBingoApi).mockReturnValue({} as unknown as ReturnType<typeof useBingoApi>)
})

describe('stats/faces.vue', () => {
  it('読み込み中はローディング表示', () => {
    vi.mocked(useAsyncData).mockReturnValue({ data: ref(undefined), status: ref('pending') })
    const wrapper = mount(StatsFacesPage, { global })
    expect(wrapper.find('.loading').exists()).toBe(true)
  })

  it('記録が無ければ全ての目の出現回数が0件で、120目すべてが未出目になる', () => {
    vi.mocked(useAsyncData).mockReturnValue({ data: ref([]), status: ref('success') })
    const wrapper = mount(StatsFacesPage, { global })
    const rows = wrapper.findAll('tbody tr')
    expect(rows).toHaveLength(120)
    expect(rows.every((r) => r.classes('unrolled'))).toBe(true)
    expect(wrapper.text()).toContain('120/ 120')
  })

  it('出目の出現回数を正しく集計する', () => {
    const cards = [
      makeCard({
        id: 'a',
        name: '太郎',
        rolls: [makeRoll(1, 1), makeRoll(1, 2), makeRoll(97, 3)],
      }),
    ]
    vi.mocked(useAsyncData).mockReturnValue({ data: ref(cards), status: ref('success') })
    const wrapper = mount(StatsFacesPage, { global })
    const rows = wrapper.findAll('tbody tr')
    // 1行目=目1（2回）、97行目=目97（1回）
    expect(rows[0]!.find('.faces-count').text()).toBe('2')
    expect(rows[0]!.classes('unrolled')).toBe(false)
    expect(rows[96]!.find('.faces-count').text()).toBe('1')
    expect(wrapper.text()).toContain('118/ 120')
  })

  it('ゾロ目の目にはタグを表示する', () => {
    vi.mocked(useAsyncData).mockReturnValue({ data: ref([]), status: ref('success') })
    const wrapper = mount(StatsFacesPage, { global })
    const rows = wrapper.findAll('tbody tr')
    expect(rows[10]!.find('.faces-value').text()).toContain('11')
    expect(rows[10]!.find('.zorome-tag').exists()).toBe(true)
    expect(rows[0]!.find('.zorome-tag').exists()).toBe(false)
  })

  it('出現回数の見出しクリックで降順・昇順を切り替える', async () => {
    const cards = [
      makeCard({ id: 'a', name: '太郎', rolls: [makeRoll(1, 1), makeRoll(1, 2), makeRoll(2, 3)] }),
    ]
    vi.mocked(useAsyncData).mockReturnValue({ data: ref(cards), status: ref('success') })
    const wrapper = mount(StatsFacesPage, { global })
    const headers = wrapper.findAll('th.sortable')
    const countHeader = headers[1]!
    await countHeader.trigger('click')
    let rows = wrapper.findAll('tbody tr')
    // 出現回数の昇順（0回の目が先頭）
    expect(rows[0]!.find('.faces-count').text()).toBe('0')

    await countHeader.trigger('click')
    rows = wrapper.findAll('tbody tr')
    // 再クリックで降順（目1が2回で先頭）
    expect(rows[0]!.find('.faces-value').text()).toContain('1')
    expect(rows[0]!.find('.faces-count').text()).toBe('2')
  })

  it('見出しはキーボード（Enter/Space）操作でもソートを切り替えられる', async () => {
    const cards = [
      makeCard({ id: 'a', name: '太郎', rolls: [makeRoll(1, 1), makeRoll(1, 2), makeRoll(2, 3)] }),
    ]
    vi.mocked(useAsyncData).mockReturnValue({ data: ref(cards), status: ref('success') })
    const wrapper = mount(StatsFacesPage, { global })
    const headers = wrapper.findAll('th.sortable')
    const countHeader = headers[1]!
    expect(countHeader.attributes('tabindex')).toBe('0')
    expect(countHeader.attributes('role')).toBe('button')

    await countHeader.trigger('keydown.enter')
    let rows = wrapper.findAll('tbody tr')
    expect(rows[0]!.find('.faces-count').text()).toBe('0')

    await countHeader.trigger('keydown.space')
    rows = wrapper.findAll('tbody tr')
    expect(rows[0]!.find('.faces-count').text()).toBe('2')
  })

  it('パンくずリストに統計データと出目一覧を登録する', () => {
    vi.mocked(useAsyncData).mockReturnValue({ data: ref([]), status: ref('success') })
    mount(StatsFacesPage, { global })
    expect(useBreadcrumbsState().value).toEqual([
      { label: 'ビンゴカード一覧', to: '/' },
      { label: '統計データ', to: '/stats' },
      { label: '出目一覧' },
    ])
  })
})
