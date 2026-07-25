import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import NumberInputGrid from '../../app/components/NumberInputGrid.vue'
import { blankDraft } from '../../shared/utils/bingo'

describe('NumberInputGrid', () => {
  it('N列センターマスは固定表示で入力不可', () => {
    const wrapper = mount(NumberInputGrid, { props: { columns: blankDraft().columns } })
    expect(wrapper.find('.free').exists()).toBe(true)
    expect(wrapper.find('.free-num').text()).toContain('101')
  })

  it('入力するとcol・row・数値でupdateを発火する', async () => {
    const wrapper = mount(NumberInputGrid, { props: { columns: blankDraft().columns } })
    const bInputs = wrapper.findAll('input')
    await bInputs[0]!.setValue('5')
    expect(wrapper.emitted('update')).toEqual([['B', 0, 5]])
  })

  it('空欄にするとnullでupdateを発火する', async () => {
    const columns = blankDraft().columns
    columns.B[0] = 5
    const wrapper = mount(NumberInputGrid, { props: { columns } })
    const bInputs = wrapper.findAll('input')
    await bInputs[0]!.setValue('')
    expect(wrapper.emitted('update')).toEqual([['B', 0, null]])
  })

  it('既存の値をinputのvalueに反映する', () => {
    const columns = blankDraft().columns
    columns.O[4] = 100
    const wrapper = mount(NumberInputGrid, { props: { columns } })
    const oInputs = wrapper.findAll('input')
    expect((oInputs.at(-1)!.element as HTMLInputElement).value).toBe('100')
  })
})
