import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import RollHistoryTable from '../../app/components/RollHistoryTable.vue'
import { makeCard, makeRoll } from '../setup/fixtures'

describe('RollHistoryTable', () => {
  it('出目履歴を新しい順に表示する', () => {
    const card = makeCard({ rolls: [makeRoll(1, 100), makeRoll(2, 200)] })
    const wrapper = mount(RollHistoryTable, { props: { card } })
    const rows = wrapper.findAll('tbody tr')
    expect(rows).toHaveLength(2)
    expect(rows[0]!.find('.history-value').text()).toContain('2')
  })

  it('ゾロ目にはタグを表示する', () => {
    const card = makeCard({ rolls: [makeRoll(11, 100)] })
    const wrapper = mount(RollHistoryTable, { props: { card } })
    expect(wrapper.find('.zorome-tag').exists()).toBe(true)
  })

  it('lockedでなければ削除ボタンを表示しdeleteを発火する', async () => {
    const card = makeCard({ rolls: [makeRoll(5, 100, 'roll-a')] })
    const wrapper = mount(RollHistoryTable, { props: { card, locked: false } })
    await wrapper.find('.history-delete').trigger('click')
    expect(wrapper.emitted('delete')).toEqual([['roll-a']])
  })

  it('lockedなら削除ボタンを表示しない', () => {
    const card = makeCard({ rolls: [makeRoll(5, 100)] })
    const wrapper = mount(RollHistoryTable, { props: { card, locked: true } })
    expect(wrapper.find('.history-delete').exists()).toBe(false)
  })
})
