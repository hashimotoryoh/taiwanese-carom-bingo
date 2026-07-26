import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import ConfirmPage from '../../app/pages/card/confirm.vue'
import ReadonlyGrid from '../../app/components/ReadonlyGrid.vue'
import { NuxtLinkStub } from '../setup/NuxtLinkStub'
import { navigateTo } from '../setup/nuxtStubs'
import { useDraftCard } from '../../app/composables/useDraftCard'
import { useBingoApi } from '../../app/composables/useBingoApi'
import { resetTestState } from '../setup/nitroGlobals'
import { useBreadcrumbsState } from '../../app/composables/useBreadcrumbs'
import { blankDraft } from '../../shared/utils/bingo'
import { makeCard } from '../setup/fixtures'

vi.mock('../../app/composables/useBingoApi', () => ({ useBingoApi: vi.fn() }))

const global = { components: { ReadonlyGrid, NuxtLink: NuxtLinkStub } }

beforeEach(() => {
  resetTestState()
})

describe('card/confirm.vue', () => {
  it('ドラフトが無ければ作成ページへの案内を表示する', () => {
    const wrapper = mount(ConfirmPage, { global })
    expect(wrapper.find('.empty').exists()).toBe(true)
  })

  it('ドラフトがあればお名前とグリッドを表示する', () => {
    useDraftCard().value = { ...blankDraft(), name: '太郎' }
    const wrapper = mount(ConfirmPage, { global })
    expect(wrapper.find('.confirm-name').text()).toBe('太郎')
    expect(wrapper.findComponent(ReadonlyGrid).exists()).toBe(true)
  })

  it('作成完了ボタンで成功すればドラフトをクリアし詳細ページへ遷移する', async () => {
    useDraftCard().value = { ...blankDraft(), name: '太郎' }
    const createCard = vi.fn().mockResolvedValue(makeCard({ id: 'new-card' }))
    vi.mocked(useBingoApi).mockReturnValue({ createCard } as unknown as ReturnType<
      typeof useBingoApi
    >)
    const wrapper = mount(ConfirmPage, { global })
    await wrapper.find('.btn-primary').trigger('click')
    await vi.waitFor(() => expect(navigateTo).toHaveBeenCalledWith('/card/new-card'))
    expect(useDraftCard().value).toBeNull()
  })

  it('作成が失敗すればサーバーのエラーメッセージを表示する', async () => {
    useDraftCard().value = { ...blankDraft(), name: '太郎' }
    const createCard = vi
      .fn()
      .mockRejectedValue({ data: { data: { errors: ['名前が重複しています。'] } } })
    vi.mocked(useBingoApi).mockReturnValue({ createCard } as unknown as ReturnType<
      typeof useBingoApi
    >)
    const wrapper = mount(ConfirmPage, { global })
    await wrapper.find('.btn-primary').trigger('click')
    await vi.waitFor(() => expect(wrapper.find('.errors').exists()).toBe(true))
    expect(wrapper.text()).toContain('名前が重複しています。')
    expect(useDraftCard().value).not.toBeNull()
  })

  it('作成が失敗しエラー詳細が無ければ汎用メッセージを表示する', async () => {
    useDraftCard().value = { ...blankDraft(), name: '太郎' }
    const createCard = vi.fn().mockRejectedValue(new Error('network error'))
    vi.mocked(useBingoApi).mockReturnValue({ createCard } as unknown as ReturnType<
      typeof useBingoApi
    >)
    const wrapper = mount(ConfirmPage, { global })
    await wrapper.find('.btn-primary').trigger('click')
    await vi.waitFor(() =>
      expect(wrapper.text()).toContain(
        'ビンゴカードの作成に失敗しました。もう一度お試しください。',
      ),
    )
  })

  it('パンくずリストに作成ページを経由した階層を登録する', () => {
    mount(ConfirmPage, { global })
    expect(useBreadcrumbsState().value).toEqual([
      { label: 'ビンゴカード一覧', to: '/' },
      { label: 'ビンゴカード作成', to: '/card/create' },
      { label: '作成の確認' },
    ])
  })
})
