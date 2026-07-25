import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import ConfirmDialog from '../../app/components/ConfirmDialog.vue'
import ModalOverlay from '../../app/components/ModalOverlay.vue'

// ConfirmDialogはModalOverlayをNuxtのコンポーネント自動インポートで参照しているため、
// テストでは明示的にグローバル登録する
const global = { components: { ModalOverlay } }

describe('ConfirmDialog', () => {
  it('メッセージとOKラベルを表示する', () => {
    const wrapper = mount(ConfirmDialog, {
      props: { message: '本当に削除しますか？', okLabel: '削除する' },
      global,
    })
    expect(wrapper.text()).toContain('本当に削除しますか？')
    expect(wrapper.text()).toContain('削除する')
  })

  it('OKボタンでconfirmを発火する', async () => {
    const wrapper = mount(ConfirmDialog, { props: { message: 'm', okLabel: 'OK' }, global })
    await wrapper.find('.confirm-ok').trigger('click')
    expect(wrapper.emitted('confirm')).toHaveLength(1)
  })

  it('キャンセルボタンでcancelを発火する', async () => {
    const wrapper = mount(ConfirmDialog, { props: { message: 'm', okLabel: 'OK' }, global })
    await wrapper.find('.btn-secondary').trigger('click')
    expect(wrapper.emitted('cancel')).toHaveLength(1)
  })

  it('オーバーレイのクリック（ModalOverlayのclose）でもcancelを発火する', async () => {
    const wrapper = mount(ConfirmDialog, { props: { message: 'm', okLabel: 'OK' }, global })
    await wrapper.find('.overlay').trigger('click')
    expect(wrapper.emitted('cancel')).toHaveLength(1)
  })
})
