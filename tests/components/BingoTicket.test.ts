import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import BingoTicket from '../../app/components/BingoTicket.vue'
import { navigateTo } from '../setup/nuxtStubs'
import { makeSummary } from '../setup/fixtures'

describe('BingoTicket', () => {
  it('名前・穴の数・パンチ率を表示する', () => {
    const wrapper = mount(BingoTicket, {
      props: { summary: makeSummary({ name: '太郎', punchedCount: 3, rollCount: 5 }) },
    })
    expect(wrapper.text()).toContain('太郎')
    expect(wrapper.text()).toContain('穴 3 個')
    expect(wrapper.text()).toContain('パンチ率 60%')
  })

  it('カイルン回数・日付は表示しない', () => {
    const wrapper = mount(BingoTicket, {
      props: { summary: makeSummary({ punchedCount: 3, rollCount: 5 }) },
    })
    expect(wrapper.text()).not.toContain('カイルン 5 回')
    expect(wrapper.text()).not.toContain('作成日')
    expect(wrapper.text()).not.toContain('最終更新')
  })

  it('記録が無ければパンチ率は0%とする', () => {
    const wrapper = mount(BingoTicket, {
      props: { summary: makeSummary({ punchedCount: 0, rollCount: 0 }) },
    })
    expect(wrapper.text()).toContain('パンチ率 0%')
  })

  it('リーチがある場合のみリーチ本数を表示する', () => {
    const withReach = mount(BingoTicket, { props: { summary: makeSummary({ reachCount: 2 }) } })
    expect(withReach.text()).toContain('リーチ 2 本')

    const withoutReach = mount(BingoTicket, { props: { summary: makeSummary({ reachCount: 0 }) } })
    expect(withoutReach.text()).not.toContain('リーチ')
  })

  it('アーカイブ済みカードのリーチは表示しない', () => {
    const wrapper = mount(BingoTicket, {
      props: { summary: makeSummary({ archived: true, reachCount: 2 }) },
    })
    expect(wrapper.text()).not.toContain('リーチ')
  })

  it('ビンゴ達成済みカードは日数なしの達成バッジを表示する', () => {
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
    const badge = wrapper.find('.badge')
    expect(badge.classes()).toContain('bingo')
    expect(badge.text()).toBe('ビンゴ達成')
  })

  it('アーカイブ済み（未達成）カードはアーカイブバッジのみで削除ボタンを持たない', () => {
    const wrapper = mount(BingoTicket, {
      props: { summary: makeSummary({ archived: true, bingoAchieved: false }) },
    })
    expect(wrapper.find('.badge').text()).toBe('アーカイブ済み')
    expect(wrapper.find('.delete-btn').exists()).toBe(false)
  })

  it('進行中カードはバッジを表示しない', () => {
    const wrapper = mount(BingoTicket, { props: { summary: makeSummary() } })
    expect(wrapper.find('.badge').exists()).toBe(false)
  })

  it('カードクリックで詳細ページへ遷移する', async () => {
    const wrapper = mount(BingoTicket, { props: { summary: makeSummary({ id: 'card-9' }) } })
    await wrapper.find('.ticket').trigger('click')
    expect(navigateTo).toHaveBeenCalledWith('/card/card-9')
  })
})
