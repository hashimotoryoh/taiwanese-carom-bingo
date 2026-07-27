import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import CreatePage from '../../app/pages/card/create.vue'
import ConfirmDialog from '../../app/components/ConfirmDialog.vue'
import ModalOverlay from '../../app/components/ModalOverlay.vue'
import NumberInputGrid from '../../app/components/NumberInputGrid.vue'
import { NuxtLinkStub } from '../setup/NuxtLinkStub'
import { navigateTo, useFetch } from '../setup/nuxtStubs'
import { useDraftCard } from '../../app/composables/useDraftCard'
import { resetTestState } from '../setup/nitroGlobals'
import { useBreadcrumbsState } from '../../app/composables/useBreadcrumbs'
import { makeSummary } from '../setup/fixtures'
import { COLUMNS, FREE_ROW, GRID_SIZE } from '../../shared/utils/bingo'

const global = {
  components: { ConfirmDialog, ModalOverlay, NumberInputGrid, NuxtLink: NuxtLinkStub },
}

beforeEach(() => {
  resetTestState()
  vi.mocked(useFetch).mockReturnValue({ data: ref([]), status: ref('success') })
})

describe('card/create.vue', () => {
  it('未入力のドラフトを新規に用意する', () => {
    const wrapper = mount(CreatePage, { global })
    const draft = useDraftCard()
    expect(draft.value).not.toBeNull()
    expect(draft.value!.columns.B).toEqual([null, null, null, null, null])
    expect(wrapper.find('#card-name-input').exists()).toBe(true)
  })

  it('NumberInputGridのupdateイベントでマス目を更新する', async () => {
    const wrapper = mount(CreatePage, { global })
    await wrapper.findComponent(NumberInputGrid).vm.$emit('update', 'B', 0, 7)
    expect(useDraftCard().value!.columns.B[0]).toBe(7)
  })

  it('ランダムに埋めるを押すと空きマスが全て埋まり重複しない', async () => {
    const wrapper = mount(CreatePage, { global })
    const randomBtn = wrapper.findAll('button').find((b) => b.text() === 'ランダムに埋める')!
    await randomBtn.trigger('click')

    const columns = useDraftCard().value!.columns
    const allValues: number[] = []
    for (const col of COLUMNS) {
      for (let r = 0; r < GRID_SIZE; r++) {
        if (col.key === 'N' && r === FREE_ROW) continue
        const v = columns[col.key][r]
        expect(v).not.toBeNull()
        expect(v).toBeGreaterThanOrEqual(col.min)
        expect(v).toBeLessThanOrEqual(col.max)
        allValues.push(v as number)
      }
    }
    expect(new Set(allValues).size).toBe(allValues.length)
  })

  it('全てクリアするボタンは確認ダイアログを経てドラフトを空にする', async () => {
    const wrapper = mount(CreatePage, { global })
    useDraftCard().value!.columns.B[0] = 10
    const buttons = wrapper.findAll('button')
    await buttons.find((b) => b.text() === '番号を全てクリアする')!.trigger('click')
    expect(wrapper.findComponent(ConfirmDialog).exists()).toBe(true)
    await wrapper.find('.confirm-ok').trigger('click')
    expect(useDraftCard().value!.columns.B[0]).toBeNull()
  })

  it('未入力のまま確認へ進むとエラーを表示し遷移しない', async () => {
    const wrapper = mount(CreatePage, { global })
    const buttons = wrapper.findAll('button')
    await buttons.find((b) => b.text() === '確認へ進む')!.trigger('click')
    expect(wrapper.find('.errors').exists()).toBe(true)
    expect(navigateTo).not.toHaveBeenCalled()
  })

  it('入力済みで確認へ進むと確認ページへ遷移する', async () => {
    const wrapper = mount(CreatePage, { global })
    const draft = useDraftCard().value!
    draft.name = '太郎'
    for (const col of COLUMNS) {
      for (let r = 0; r < GRID_SIZE; r++) {
        if (col.key === 'N' && r === FREE_ROW) continue
        draft.columns[col.key][r] = col.max - r
      }
    }
    const buttons = wrapper.findAll('button')
    await buttons.find((b) => b.text() === '確認へ進む')!.trigger('click')
    expect(navigateTo).toHaveBeenCalledWith('/card/confirm')
  })

  it('アーカイブ済みの名前を候補として表示する', () => {
    vi.mocked(useFetch).mockReturnValue({
      data: ref([makeSummary({ name: '花子', archived: true })]),
      status: ref('success'),
    })
    const wrapper = mount(CreatePage, { global })
    expect(wrapper.text()).toContain('アーカイブ済みの名前からも選べます')
    expect(wrapper.find('#archived-names option').attributes('value')).toBe('花子')
  })

  it('パンくずリストにビンゴカード作成を登録する', () => {
    mount(CreatePage, { global })
    expect(useBreadcrumbsState().value).toEqual([
      { label: 'ビンゴカード一覧', to: '/' },
      { label: 'ビンゴカード作成' },
    ])
  })
})
