import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import BingoTicket from '../../app/components/BingoTicket.vue'
import { navigateTo } from '../setup/nuxtStubs'
import { makeSummary } from '../setup/fixtures'

describe('BingoTicket', () => {
  it('進行中カードは名前と最終更新日を表示する', () => {
    const wrapper = mount(BingoTicket, {
      props: { summary: makeSummary({ name: '太郎', punchedCount: 3, rollCount: 5 }) },
    })
    expect(wrapper.text()).toContain('太郎')
    expect(wrapper.text()).toContain('穴 3 個')
    expect(wrapper.text()).toContain('カイルン 5 回')
    expect(wrapper.find('.delete-btn').exists()).toBe(false)
  })

  it('リーチがある場合のみリーチ本数を表示する', () => {
    const withReach = mount(BingoTicket, { props: { summary: makeSummary({ reachCount: 2 }) } })
    expect(withReach.text()).toContain('リーチ 2 本')

    const withoutReach = mount(BingoTicket, { props: { summary: makeSummary({ reachCount: 0 }) } })
    expect(withoutReach.text()).not.toContain('リーチ')
  })

  it('ビンゴ達成済みカードは達成バッジと達成日数を表示する', () => {
    const wrapper = mount(BingoTicket, {
      props: {
        summary: makeSummary({
          archived: true,
          bingoAchieved: true,
          createdAt: 0,
          bingoAchievedAt: 3 * 24 * 60 * 60 * 1000,
        }),
      },
    })
    expect(wrapper.text()).toContain('3日でビンゴ達成')
  })

  it('アーカイブ済み（未達成）カードは削除ボタンを表示しdeleteを発火する', async () => {
    const wrapper = mount(BingoTicket, {
      props: { summary: makeSummary({ archived: true, bingoAchieved: false, id: 'card-1' }) },
    })
    expect(wrapper.text()).toContain('アーカイブ済み')
    await wrapper.find('.delete-btn').trigger('click')
    expect(wrapper.emitted('delete')).toEqual([['card-1']])
  })

  it('カードクリックで詳細ページへ遷移する', async () => {
    const wrapper = mount(BingoTicket, { props: { summary: makeSummary({ id: 'card-9' }) } })
    await wrapper.find('.ticket').trigger('click')
    expect(navigateTo).toHaveBeenCalledWith('/card/card-9')
  })

  it('削除ボタンのクリックはカード詳細への遷移を発生させない（イベント伝播を止める）', async () => {
    const wrapper = mount(BingoTicket, {
      props: { summary: makeSummary({ archived: true, bingoAchieved: false }) },
    })
    await wrapper.find('.delete-btn').trigger('click')
    expect(navigateTo).not.toHaveBeenCalled()
  })
})
