import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import AppBreadcrumbs from '../../app/components/AppBreadcrumbs.vue'
import { NuxtLinkStub } from '../setup/NuxtLinkStub'

const global = { components: { NuxtLink: NuxtLinkStub } }

describe('AppBreadcrumbs.vue', () => {
  it('項目が空なら何も描画しない', () => {
    const wrapper = mount(AppBreadcrumbs, { props: { items: [] }, global })
    expect(wrapper.find('nav').exists()).toBe(false)
  })

  it('末尾以外はリンク、末尾は現在地として描画する', () => {
    const wrapper = mount(AppBreadcrumbs, {
      props: {
        items: [
          { label: 'ビンゴカード一覧', to: '/' },
          { label: '全員の統計データ', to: '/stats' },
          { label: '太郎の統計データ' },
        ],
      },
      global,
    })

    const links = wrapper.findAll('a')
    expect(links.map((a) => a.attributes('href'))).toEqual(['/', '/stats'])
    expect(links.map((a) => a.text())).toEqual(['ビンゴカード一覧', '全員の統計データ'])

    const current = wrapper.find('[aria-current="page"]')
    expect(current.text()).toBe('太郎の統計データ')
    expect(wrapper.findAll('li')).toHaveLength(3)
  })

  it('末尾の項目に to があってもリンクにしない', () => {
    const wrapper = mount(AppBreadcrumbs, {
      props: { items: [{ label: 'ビンゴカード一覧', to: '/' }] },
      global,
    })
    expect(wrapper.find('a').exists()).toBe(false)
    expect(wrapper.find('[aria-current="page"]').text()).toBe('ビンゴカード一覧')
  })

  it('ランドマークのラベルは差し替えられる', () => {
    const items = [{ label: 'ビンゴカード一覧' }]
    const def = mount(AppBreadcrumbs, { props: { items }, global })
    expect(def.find('nav').attributes('aria-label')).toBe('パンくずリスト')

    const named = mount(AppBreadcrumbs, { props: { items, label: '下部' }, global })
    expect(named.find('nav').attributes('aria-label')).toBe('下部')
  })
})
