import { beforeEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import DefaultLayout from '../../app/layouts/default.vue'
import AppFooter from '../../app/components/AppFooter.vue'
import AppLogo from '../../app/components/AppLogo.vue'
import ConfettiLayer from '../../app/components/ConfettiLayer.vue'
import ModalOverlay from '../../app/components/ModalOverlay.vue'
import RulesModal from '../../app/components/RulesModal.vue'
import { NuxtLinkStub } from '../setup/NuxtLinkStub'
import { resetTestState } from '../setup/nitroGlobals'
import { useRulesModal } from '../../app/composables/useRulesModal'

const global = {
  components: {
    AppFooter,
    AppLogo,
    ConfettiLayer,
    ModalOverlay,
    RulesModal,
    NuxtLink: NuxtLinkStub,
  },
}

beforeEach(() => {
  resetTestState()
})

describe('layouts/default.vue', () => {
  it('初期状態ではルール説明モーダルを表示しない', () => {
    const wrapper = mount(DefaultLayout, { global })
    expect(wrapper.findComponent(RulesModal).exists()).toBe(false)
  })

  it('ルール説明ボタンでモーダルを開き、closeイベントで閉じる', async () => {
    const wrapper = mount(DefaultLayout, { global })
    await wrapper.find('.rules-btn').trigger('click')
    expect(wrapper.findComponent(RulesModal).exists()).toBe(true)

    await wrapper.findComponent(RulesModal).vm.$emit('close')
    expect(wrapper.findComponent(RulesModal).exists()).toBe(false)
  })

  it('モーダル開閉の状態はuseRulesModalと共有される', async () => {
    const wrapper = mount(DefaultLayout, { global })
    useRulesModal().open()
    await wrapper.vm.$nextTick()
    expect(wrapper.findComponent(RulesModal).exists()).toBe(true)
  })
})
