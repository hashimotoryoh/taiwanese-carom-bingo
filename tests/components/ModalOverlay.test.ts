import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import ModalOverlay from '../../app/components/ModalOverlay.vue'

describe('ModalOverlay', () => {
  it('スロットの内容を描画する', () => {
    const wrapper = mount(ModalOverlay, {
      slots: { default: '<p>中身</p>' },
    })
    expect(wrapper.html()).toContain('中身')
  })

  it('modalClassをmodal要素のクラスに反映する', () => {
    const wrapper = mount(ModalOverlay, { props: { modalClass: 'bingo-modal' } })
    expect(wrapper.find('.modal').classes()).toContain('bingo-modal')
  })

  it('オーバーレイ自身のクリックでcloseを発火する', async () => {
    const wrapper = mount(ModalOverlay)
    await wrapper.find('.overlay').trigger('click')
    expect(wrapper.emitted('close')).toHaveLength(1)
  })

  it('モーダル内のクリックではcloseを発火しない', async () => {
    const wrapper = mount(ModalOverlay, { slots: { default: '<p>中身</p>' } })
    await wrapper.find('.modal').trigger('click')
    expect(wrapper.emitted('close')).toBeUndefined()
  })
})
