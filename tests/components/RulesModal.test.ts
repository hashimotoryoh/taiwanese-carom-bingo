import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import ModalOverlay from '../../app/components/ModalOverlay.vue'
import RulesModal from '../../app/components/RulesModal.vue'

const global = { components: { ModalOverlay } }

describe('RulesModal', () => {
  it('ルール説明を表示する', () => {
    const wrapper = mount(RulesModal, { global })
    expect(wrapper.text()).toContain('あそびかたルール')
    expect(wrapper.text()).toContain('カイルンしたら貯金箱に投入')
  })

  it('閉じるボタンでcloseを発火する', async () => {
    const wrapper = mount(RulesModal, { global })
    await wrapper.find('.modal-close').trigger('click')
    expect(wrapper.emitted('close')).toHaveLength(1)
  })

  it('オーバーレイのクリックでもcloseを発火する', async () => {
    const wrapper = mount(RulesModal, { global })
    await wrapper.find('.overlay').trigger('click')
    expect(wrapper.emitted('close')).toHaveLength(1)
  })
})
