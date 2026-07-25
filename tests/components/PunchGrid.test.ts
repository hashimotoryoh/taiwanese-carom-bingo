import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import PunchGrid from '../../app/components/PunchGrid.vue'
import { makeCard, makeRoll } from '../setup/fixtures'

describe('PunchGrid', () => {
  it('出目履歴にある番号のマスにpunchedクラスをつける', () => {
    // NUMBERS.B = [1, 2, 3, 4, 5]
    const card = makeCard({ rolls: [makeRoll(1, 100)] })
    const wrapper = mount(PunchGrid, { props: { card } })
    const cells = wrapper.findAll('.punch-cell')
    expect(cells[0]!.classes()).toContain('punched')
    expect(cells[1]!.classes()).not.toContain('punched')
  })

  it('センターマスは常にfreeクラスで固定値101を表示する', () => {
    const card = makeCard()
    const wrapper = mount(PunchGrid, { props: { card } })
    // N列(3番目)・row2(FREE_ROW)のセル = index 2*5 + 2 = 12
    const freeCell = wrapper.findAll('.punch-cell')[12]!
    expect(freeCell.classes()).toContain('free')
    expect(freeCell.find('.cell-num').text()).toBe('101')
  })

  it('アーカイブ済みカードはlockedクラスをつけリーチ演出をしない', () => {
    const card = makeCard({
      archived: true,
      rolls: [makeRoll(1, 100), makeRoll(2, 200), makeRoll(3, 300), makeRoll(4, 400)],
    })
    const wrapper = mount(PunchGrid, { props: { card } })
    expect(wrapper.findAll('.punch-cell')[0]!.classes()).toContain('locked')
    expect(wrapper.find('.reach-part').exists()).toBe(false)
  })

  it('flashCellで指定したマスにパーティクル演出を表示する', () => {
    const card = makeCard()
    const wrapper = mount(PunchGrid, { props: { card, flashCell: { col: 'B', row: 0 } } })
    const cells = wrapper.findAll('.punch-cell')
    expect(cells[0]!.find('.particle-burst').exists()).toBe(true)
    expect(cells[1]!.find('.particle-burst').exists()).toBe(false)
  })

  it('パンチ済みマスにはパンチ日時を表示する', () => {
    const card = makeCard({ rolls: [makeRoll(1, 100)] })
    const wrapper = mount(PunchGrid, { props: { card } })
    expect(wrapper.findAll('.punch-cell')[0]!.find('.cell-date').exists()).toBe(true)
  })
})
