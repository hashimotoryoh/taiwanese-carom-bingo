import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import AppFooter from '../../app/components/AppFooter.vue'
import { NuxtLinkStub } from '../setup/NuxtLinkStub'
import { useRuntimeConfig } from '../setup/nuxtStubs'
import { docList } from '../../app/utils/docs'

const global = { components: { NuxtLink: NuxtLinkStub } }

describe('AppFooter', () => {
  it('コミットハッシュが取得できた場合はGitHubへのリンクにする', () => {
    vi.mocked(useRuntimeConfig).mockReturnValue({ public: { commitHash: 'abc1234' } })
    const wrapper = mount(AppFooter, { global })
    const link = wrapper.find('.version a')
    expect(link.exists()).toBe(true)
    expect(link.attributes('href')).toBe(
      'https://github.com/hashimotoryoh/taiwanese-carom-bingo/commit/abc1234',
    )
    expect(link.text()).toBe('abc1234')
  })

  it('コミットハッシュが取得できない場合はリンクにしない', () => {
    vi.mocked(useRuntimeConfig).mockReturnValue({ public: { commitHash: 'unknown' } })
    const wrapper = mount(AppFooter, { global })
    expect(wrapper.find('.version a').exists()).toBe(false)
    expect(wrapper.find('.version').text()).toBe('unknown')
  })

  it('著作権表示に当年を含む', () => {
    vi.mocked(useRuntimeConfig).mockReturnValue({ public: { commitHash: 'unknown' } })
    const wrapper = mount(AppFooter, { global })
    expect(wrapper.find('.copyright').text()).toContain(String(new Date().getFullYear()))
  })

  it('全ドキュメントへのナビゲーションリンクを表示する', () => {
    vi.mocked(useRuntimeConfig).mockReturnValue({ public: { commitHash: 'unknown' } })
    const wrapper = mount(AppFooter, { global })
    const links = wrapper.findAll('.doc-nav a')
    expect(links).toHaveLength(docList.length)
    links.forEach((link, i) => {
      expect(link.attributes('href')).toBe(`/doc/${docList[i]!.slug}`)
      expect(link.text()).toBe(docList[i]!.title)
    })
  })
})
