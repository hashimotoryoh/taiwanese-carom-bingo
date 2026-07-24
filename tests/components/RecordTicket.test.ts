import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import RecordTicket from '../../app/components/RecordTicket.vue'
import { navigateTo } from '../setup/nuxtStubs'

describe('RecordTicket', () => {
  it('タイトル・メタ・チップを表示する', () => {
    const wrapper = mount(RecordTicket, {
      props: {
        to: '/records/taro',
        title: '太郎',
        meta: 'ビンゴカード 2 枚',
        chips: [{ text: '穴 3 個' }, { text: 'リーチ 1 本', reach: true }],
      },
    })
    expect(wrapper.text()).toContain('太郎')
    expect(wrapper.text()).toContain('ビンゴカード 2 枚')
    const chips = wrapper.findAll('.stat-chip')
    expect(chips[0]!.text()).toBe('穴 3 個')
    expect(chips[1]!.classes()).toContain('reach')
  })

  it('badgeが無ければバッジを表示しない', () => {
    const wrapper = mount(RecordTicket, {
      props: { to: '/x', title: 't', meta: 'm', badge: null, chips: [] },
    })
    expect(wrapper.find('.badge').exists()).toBe(false)
  })

  it('badgeがあればkindに応じたクラスで表示する', () => {
    const wrapper = mount(RecordTicket, {
      props: {
        to: '/x',
        title: 't',
        meta: 'm',
        badge: { text: '1回ビンゴ達成', kind: 'bingo' },
        chips: [],
      },
    })
    expect(wrapper.find('.badge').classes()).toContain('bingo')
    expect(wrapper.find('.badge').text()).toBe('1回ビンゴ達成')
  })

  it('クリックでtoへ遷移する', async () => {
    const wrapper = mount(RecordTicket, {
      props: { to: '/records/taro', title: 't', meta: 'm', chips: [] },
    })
    await wrapper.find('.ticket').trigger('click')
    expect(navigateTo).toHaveBeenCalledWith('/records/taro')
  })
})
