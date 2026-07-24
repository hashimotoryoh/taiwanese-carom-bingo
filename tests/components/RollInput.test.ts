import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import RollInput from '../../app/components/RollInput.vue'

describe('RollInput', () => {
  it('未入力で送信するとエラーを表示しrecordを発火しない', async () => {
    const wrapper = mount(RollInput)
    await wrapper.find('form').trigger('submit')
    expect(wrapper.text()).toContain('出目を入力してください。')
    expect(wrapper.emitted('record')).toBeUndefined()
  })

  it('範囲外の値はエラーを表示しrecordを発火しない', async () => {
    const wrapper = mount(RollInput)
    await wrapper.find('input').setValue(121)
    await wrapper.find('form').trigger('submit')
    expect(wrapper.text()).toContain('出目は 1 ~ 120 の整数で入力してください。')
    expect(wrapper.emitted('record')).toBeUndefined()
  })

  it('有効な値はrecordを発火し入力欄をクリアする', async () => {
    const wrapper = mount(RollInput)
    const input = wrapper.find('input')
    await input.setValue(42)
    await wrapper.find('form').trigger('submit')
    expect(wrapper.emitted('record')).toEqual([[42]])
    expect((input.element as HTMLInputElement).value).toBe('')
  })

  it('busy中は送信してもrecordを発火しない', async () => {
    const wrapper = mount(RollInput, { props: { busy: true } })
    await wrapper.find('input').setValue(42)
    await wrapper.find('form').trigger('submit')
    expect(wrapper.emitted('record')).toBeUndefined()
    expect(wrapper.find('button').attributes('disabled')).toBeDefined()
  })

  it('入力し直すとエラー表示をクリアする', async () => {
    const wrapper = mount(RollInput)
    await wrapper.find('form').trigger('submit')
    expect(wrapper.text()).toContain('出目を入力してください。')
    await wrapper.find('input').trigger('input')
    expect(wrapper.text()).not.toContain('出目を入力してください。')
  })
})
