import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import ReadonlyGrid from '../../app/components/ReadonlyGrid.vue'
import { NUMBERS } from '../setup/fixtures'

describe('ReadonlyGrid', () => {
  it('各マスの番号を表示する', () => {
    const wrapper = mount(ReadonlyGrid, { props: { columns: NUMBERS } })
    expect(wrapper.text()).toContain('1')
    expect(wrapper.text()).toContain('25')
  })

  it('N列センターマスは固定値101を表示する', () => {
    const wrapper = mount(ReadonlyGrid, { props: { columns: NUMBERS } })
    expect(wrapper.find('.free').text()).toBe('101')
  })
})
