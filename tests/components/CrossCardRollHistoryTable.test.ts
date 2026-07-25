import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import CrossCardRollHistoryTable from '../../app/components/CrossCardRollHistoryTable.vue'
import { NuxtLinkStub } from '../setup/NuxtLinkStub'
import { makeCard, makeRoll } from '../setup/fixtures'

const global = { components: { NuxtLink: NuxtLinkStub } }

describe('CrossCardRollHistoryTable', () => {
  it('複数カードの出目履歴を新しい順に表示する', () => {
    const cards = [
      makeCard({ id: 'a', rolls: [makeRoll(1, 100)] }),
      makeCard({ id: 'b', rolls: [makeRoll(2, 300)] }),
    ]
    const wrapper = mount(CrossCardRollHistoryTable, { props: { cards }, global })
    const rows = wrapper.findAll('tbody tr')
    expect(rows).toHaveLength(2)
    expect(rows[0]!.find('.history-value').text()).toContain('2')
  })

  it('カードが複数あるときは記録元カードへのリンクを表示する', () => {
    const cards = [
      makeCard({ id: 'a', createdAt: new Date(2026, 0, 1).getTime(), rolls: [makeRoll(1, 100)] }),
      makeCard({ id: 'b', rolls: [makeRoll(2, 50)] }),
    ]
    const wrapper = mount(CrossCardRollHistoryTable, { props: { cards }, global })
    const link = wrapper.find('.history-card a')
    expect(link.attributes('href')).toBe('/card/a')
    expect(link.text()).toBe('2026/01/01 作成')
  })

  it('カードが1枚だけならカード列を表示しない', () => {
    const cards = [makeCard({ rolls: [makeRoll(1, 100)] })]
    const wrapper = mount(CrossCardRollHistoryTable, { props: { cards }, global })
    expect(wrapper.find('.history-card').exists()).toBe(false)
    expect(wrapper.findAll('thead th')).toHaveLength(3)
  })

  it('ゾロ目にはタグを表示する', () => {
    const cards = [makeCard({ rolls: [makeRoll(11, 100)] })]
    const wrapper = mount(CrossCardRollHistoryTable, { props: { cards }, global })
    expect(wrapper.find('.zorome-tag').exists()).toBe(true)
  })

  it('初期表示は指定件数までに抑え、ボタンで残りを表示する', async () => {
    const rolls = Array.from({ length: 5 }, (_, i) => makeRoll(i + 1, i * 100))
    const cards = [makeCard({ rolls })]
    const wrapper = mount(CrossCardRollHistoryTable, {
      props: { cards, initialLimit: 2 },
      global,
    })
    expect(wrapper.findAll('tbody tr')).toHaveLength(2)
    expect(wrapper.find('.history-more button').text()).toBe('残り 3 件を表示する')

    await wrapper.find('.history-more button').trigger('click')
    expect(wrapper.findAll('tbody tr')).toHaveLength(5)
    expect(wrapper.find('.history-more').exists()).toBe(false)
  })

  it('件数が上限以下なら展開ボタンを出さない', () => {
    const cards = [makeCard({ rolls: [makeRoll(1, 100)] })]
    const wrapper = mount(CrossCardRollHistoryTable, { props: { cards, initialLimit: 30 }, global })
    expect(wrapper.find('.history-more').exists()).toBe(false)
  })
})
