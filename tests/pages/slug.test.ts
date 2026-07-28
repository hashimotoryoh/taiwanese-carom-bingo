import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import SlugPage from '../../app/pages/doc/[slug].vue'
import { NuxtLinkStub } from '../setup/NuxtLinkStub'
import { useHead, useRoute } from '../setup/nuxtStubs'
import { useBreadcrumbsState } from '../../app/composables/useBreadcrumbs'

const global = {
  components: { NuxtLink: NuxtLinkStub },
}

beforeEach(() => {
  vi.mocked(useRoute).mockReturnValue({ params: {} })
})

describe('[slug].vue', () => {
  it('存在するスラッグはマークダウンを HTML に変換して表示する', () => {
    vi.mocked(useRoute).mockReturnValue({ params: { slug: 'd120-expected-value' } })
    const wrapper = mount(SlugPage, { global })
    expect(wrapper.find('.doc-body').exists()).toBe(true)
    // h1 見出しとコードブロックが描画されている
    expect(wrapper.find('.doc-body h1').text()).toBe('120面体サイコロの期待値')
    expect(wrapper.find('.doc-body pre code').exists()).toBe(true)
  })

  it('存在するスラッグでは useHead にドキュメントのタイトルを渡す', () => {
    vi.mocked(useRoute).mockReturnValue({ params: { slug: 'bingo-avg' } })
    mount(SlugPage, { global })
    const arg = vi.mocked(useHead).mock.calls[0]![0] as () => { title: string }
    expect(arg().title).toBe('ビンゴまでの平均カイルン回数 | カイルンBINGO')
  })

  it('存在しないスラッグはフォールバック表示にする', () => {
    vi.mocked(useRoute).mockReturnValue({ params: { slug: 'unknown-slug' } })
    const wrapper = mount(SlugPage, { global })
    expect(wrapper.find('.doc-body').exists()).toBe(false)
    expect(wrapper.text()).toContain('お探しのページは見つかりませんでした。')
  })

  it('存在しないスラッグでは useHead に「見つかりません」タイトルを渡す', () => {
    vi.mocked(useRoute).mockReturnValue({ params: { slug: 'unknown-slug' } })
    mount(SlugPage, { global })
    const arg = vi.mocked(useHead).mock.calls[0]![0] as () => { title: string }
    expect(arg().title).toBe('ページが見つかりません | カイルンBINGO')
  })

  it('パンくずリストにドキュメントのタイトルを登録する', () => {
    vi.mocked(useRoute).mockReturnValue({ params: { slug: 'bingo-avg' } })
    mount(SlugPage, { global })
    expect(useBreadcrumbsState().value).toEqual([
      { label: 'ビンゴカード一覧', to: '/' },
      { label: 'ビンゴまでの平均カイルン回数' },
    ])
  })

  it('存在しないスラッグのパンくずリストは見つからない旨にする', () => {
    vi.mocked(useRoute).mockReturnValue({ params: { slug: 'unknown-slug' } })
    mount(SlugPage, { global })
    expect(useBreadcrumbsState().value).toEqual([
      { label: 'ビンゴカード一覧', to: '/' },
      { label: 'ページが見つかりません' },
    ])
  })
})
