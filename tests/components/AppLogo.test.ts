import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import AppLogo from '../../app/components/AppLogo.vue'

describe('AppLogo', () => {
  it('SVGを描画する', () => {
    const wrapper = mount(AppLogo)
    expect(wrapper.find('svg').exists()).toBe(true)
  })
})
