import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import CardIdPage from '../../app/pages/card/[id].vue'
import ConfirmDialog from '../../app/components/ConfirmDialog.vue'
import ModalOverlay from '../../app/components/ModalOverlay.vue'
import PunchGrid from '../../app/components/PunchGrid.vue'
import RollHistoryTable from '../../app/components/RollHistoryTable.vue'
import RollInput from '../../app/components/RollInput.vue'
import RollSummary from '../../app/components/RollSummary.vue'
import StatsSummary from '../../app/components/StatsSummary.vue'
import { NuxtLinkStub } from '../setup/NuxtLinkStub'
import { navigateTo, useFetch, useRoute } from '../setup/nuxtStubs'
import { useBingoApi } from '../../app/composables/useBingoApi'
import { useConfetti } from '../../app/composables/useConfetti'
import { useDraftCard } from '../../app/composables/useDraftCard'
import { resetTestState } from '../setup/nitroGlobals'
import { makeCard, makeRoll } from '../setup/fixtures'

vi.mock('../../app/composables/useBingoApi', () => ({ useBingoApi: vi.fn() }))

const global = {
  components: {
    ConfirmDialog,
    ModalOverlay,
    PunchGrid,
    RollHistoryTable,
    RollInput,
    RollSummary,
    StatsSummary,
    NuxtLink: NuxtLinkStub,
  },
}

const CARD_ID = '11111111-1111-1111-1111-111111111111'

beforeEach(() => {
  resetTestState()
  vi.mocked(useRoute).mockReturnValue({ params: { id: CARD_ID } })
})

describe('card/[id].vue', () => {
  it('読み込み中はローディング表示', () => {
    vi.mocked(useFetch).mockReturnValue({
      data: ref(undefined),
      status: ref('pending'),
      refresh: vi.fn(),
      error: ref(null),
    })
    const wrapper = mount(CardIdPage, { global })
    expect(wrapper.find('.loading').exists()).toBe(true)
  })

  it('カードが見つからなければ一覧へのリンクを表示', () => {
    vi.mocked(useFetch).mockReturnValue({
      data: ref(null),
      status: ref('success'),
      refresh: vi.fn(),
      error: ref(null),
    })
    const wrapper = mount(CardIdPage, { global })
    expect(wrapper.find('.empty').exists()).toBe(true)
  })

  it('進行中カードは出目入力欄とアーカイブボタンを表示する', () => {
    const card = makeCard({ archived: false })
    vi.mocked(useFetch).mockReturnValue({
      data: ref(card),
      status: ref('success'),
      refresh: vi.fn(),
      error: ref(null),
    })
    const wrapper = mount(CardIdPage, { global })
    expect(wrapper.findComponent(RollInput).exists()).toBe(true)
    expect(wrapper.text()).toContain('進行中')
    expect(wrapper.text()).toContain('このカードをアーカイブする')
    expect(wrapper.text()).not.toContain('完全に削除する')
  })

  it('アーカイブ済みカードは出目入力欄の代わりに完全削除ボタンを表示する', () => {
    const card = makeCard({ archived: true })
    vi.mocked(useFetch).mockReturnValue({
      data: ref(card),
      status: ref('success'),
      refresh: vi.fn(),
      error: ref(null),
    })
    const wrapper = mount(CardIdPage, { global })
    expect(wrapper.findComponent(RollInput).exists()).toBe(false)
    expect(wrapper.text()).toContain('アーカイブ済み')
    expect(wrapper.text()).toContain('完全に削除する')
    expect(wrapper.text()).not.toContain('このカードをアーカイブする')
  })

  it('完全削除の確認ダイアログのOKでdeleteCardを呼び一覧へ遷移する', async () => {
    const card = makeCard({ archived: true })
    const deleteCard = vi.fn().mockResolvedValue(undefined)
    vi.mocked(useBingoApi).mockReturnValue({ deleteCard } as unknown as ReturnType<
      typeof useBingoApi
    >)
    vi.mocked(useFetch).mockReturnValue({
      data: ref(card),
      status: ref('success'),
      refresh: vi.fn(),
      error: ref(null),
    })
    const wrapper = mount(CardIdPage, { global })

    await wrapper.find('.btn-danger').trigger('click')
    await wrapper.find('.confirm-ok').trigger('click')
    await vi.waitFor(() => expect(deleteCard).toHaveBeenCalledWith(card.id))
    expect(navigateTo).toHaveBeenCalledWith('/')
  })

  it('完全削除の確認ダイアログをキャンセルするとdeleteCardを呼ばない', async () => {
    const card = makeCard({ archived: true })
    const deleteCard = vi.fn()
    vi.mocked(useBingoApi).mockReturnValue({ deleteCard } as unknown as ReturnType<
      typeof useBingoApi
    >)
    vi.mocked(useFetch).mockReturnValue({
      data: ref(card),
      status: ref('success'),
      refresh: vi.fn(),
      error: ref(null),
    })
    const wrapper = mount(CardIdPage, { global })

    await wrapper.find('.btn-danger').trigger('click')
    await wrapper.findComponent(ConfirmDialog).find('.btn-secondary').trigger('click')
    expect(deleteCard).not.toHaveBeenCalled()
    expect(wrapper.findComponent(ConfirmDialog).exists()).toBe(false)
  })

  it('リーチがあればリーチ本数バナーを表示する', () => {
    // B列(1,2,3,4,5)の4つ・N列free込みで1ラインリーチ状態を作る
    const card = makeCard({
      rolls: [makeRoll(1, 1), makeRoll(2, 2), makeRoll(3, 3), makeRoll(4, 4)],
    })
    vi.mocked(useFetch).mockReturnValue({
      data: ref(card),
      status: ref('success'),
      refresh: vi.fn(),
      error: ref(null),
    })
    const wrapper = mount(CardIdPage, { global })
    expect(wrapper.find('.reach-banner').exists()).toBe(true)
  })

  it('出目記録に成功するとカードを更新しビンゴ達成時は紙吹雪とモーダルを出す', async () => {
    const card = makeCard()
    const achievedCard = makeCard({ bingoAchieved: true, archived: true })
    const recordRoll = vi.fn().mockResolvedValue({
      card: achievedCard,
      achievedNow: true,
      punchedCell: { col: 'B', row: 0 },
    })
    vi.mocked(useBingoApi).mockReturnValue({ recordRoll } as unknown as ReturnType<
      typeof useBingoApi
    >)
    vi.mocked(useFetch).mockReturnValue({
      data: ref(card),
      status: ref('success'),
      refresh: vi.fn(),
      error: ref(null),
    })
    const wrapper = mount(CardIdPage, { global })

    const confetti = useConfetti()
    const before = confetti.trigger.value

    await wrapper.findComponent(RollInput).vm.$emit('record', 5)
    await vi.waitFor(() => expect(wrapper.text()).toContain('ビンゴ達成'))

    expect(recordRoll).toHaveBeenCalledWith(card.id, 5)
    expect(confetti.trigger.value).toBe(before + 1)
    expect(wrapper.find('.bingo-modal').exists()).toBe(true)
  })

  it('出目記録が競合エラーになった場合は最新状態を再取得する', async () => {
    const card = makeCard()
    const refresh = vi.fn()
    const recordRoll = vi.fn().mockRejectedValue(new Error('conflict'))
    vi.mocked(useBingoApi).mockReturnValue({ recordRoll } as unknown as ReturnType<
      typeof useBingoApi
    >)
    vi.mocked(useFetch).mockReturnValue({
      data: ref(card),
      status: ref('success'),
      refresh,
      error: ref(null),
    })
    const wrapper = mount(CardIdPage, { global })

    await wrapper.findComponent(RollInput).vm.$emit('record', 5)
    await vi.waitFor(() => expect(refresh).toHaveBeenCalled())
  })

  it('アーカイブ確認ダイアログのOKでarchiveを呼びカードを更新する', async () => {
    const card = makeCard()
    const archivedCard = makeCard({ archived: true })
    const archive = vi.fn().mockResolvedValue(archivedCard)
    vi.mocked(useBingoApi).mockReturnValue({ archive } as unknown as ReturnType<typeof useBingoApi>)
    vi.mocked(useFetch).mockReturnValue({
      data: ref(card),
      status: ref('success'),
      refresh: vi.fn(),
      error: ref(null),
    })
    const wrapper = mount(CardIdPage, { global })

    await wrapper.find('.btn-danger').trigger('click')
    await wrapper.find('.confirm-ok').trigger('click')
    await vi.waitFor(() => expect(archive).toHaveBeenCalledWith(card.id))
    expect(wrapper.text()).toContain('アーカイブ済み')
  })

  it('ビンゴ達成モーダルの「新しいカードを作成する」でドラフトをクリアし作成ページへ遷移する', async () => {
    const card = makeCard()
    const achievedCard = makeCard({ bingoAchieved: true, archived: true })
    const recordRoll = vi.fn().mockResolvedValue({
      card: achievedCard,
      achievedNow: true,
      punchedCell: null,
    })
    vi.mocked(useBingoApi).mockReturnValue({ recordRoll } as unknown as ReturnType<
      typeof useBingoApi
    >)
    vi.mocked(useFetch).mockReturnValue({
      data: ref(card),
      status: ref('success'),
      refresh: vi.fn(),
      error: ref(null),
    })
    useDraftCard().value = { name: '前回の下書き', columns: { B: [], I: [], N: [], G: [], O: [] } }
    const wrapper = mount(CardIdPage, { global })

    await wrapper.findComponent(RollInput).vm.$emit('record', 5)
    await vi.waitFor(() => expect(wrapper.find('.bingo-modal').exists()).toBe(true))

    await wrapper.find('.btn-gold').trigger('click')
    expect(navigateTo).toHaveBeenCalledWith('/card/create')
    expect(useDraftCard().value).toBeNull()
    expect(wrapper.find('.bingo-modal').exists()).toBe(false)
  })

  it('アンマウント時にフラッシュ演出のタイマーをクリアする', async () => {
    const card = makeCard()
    const recordRoll = vi.fn().mockResolvedValue({
      card: makeCard(),
      achievedNow: false,
      punchedCell: { col: 'B', row: 0 },
    })
    vi.mocked(useBingoApi).mockReturnValue({ recordRoll } as unknown as ReturnType<
      typeof useBingoApi
    >)
    vi.mocked(useFetch).mockReturnValue({
      data: ref(card),
      status: ref('success'),
      refresh: vi.fn(),
      error: ref(null),
    })
    const wrapper = mount(CardIdPage, { global })
    await wrapper.findComponent(RollInput).vm.$emit('record', 5)
    await vi.waitFor(() => expect(recordRoll).toHaveBeenCalled())
    expect(() => wrapper.unmount()).not.toThrow()
  })

  it('出目削除の確認ダイアログのOKでdeleteRollを呼ぶ', async () => {
    const card = makeCard({ rolls: [makeRoll(5, 100, 'roll-1')] })
    const updatedCard = makeCard({ rolls: [] })
    const deleteRoll = vi.fn().mockResolvedValue(updatedCard)
    vi.mocked(useBingoApi).mockReturnValue({ deleteRoll } as unknown as ReturnType<
      typeof useBingoApi
    >)
    vi.mocked(useFetch).mockReturnValue({
      data: ref(card),
      status: ref('success'),
      refresh: vi.fn(),
      error: ref(null),
    })
    const wrapper = mount(CardIdPage, { global })

    await wrapper.findComponent(RollHistoryTable).vm.$emit('delete', 'roll-1')
    await wrapper.find('.confirm-ok').trigger('click')
    await vi.waitFor(() => expect(deleteRoll).toHaveBeenCalledWith(card.id, 'roll-1'))
  })

  it('再読み込みボタンを押すと最新状態を取り直す', async () => {
    const card = makeCard()
    const refresh = vi.fn()
    vi.mocked(useFetch).mockReturnValue({
      data: ref(card),
      status: ref('success'),
      refresh,
      error: ref(null),
    })
    const wrapper = mount(CardIdPage, { global })

    await wrapper.find('button[aria-label="再読み込み"]').trigger('click')
    await vi.waitFor(() => expect(refresh).toHaveBeenCalled())
  })

  it('再読み込み中は全面のローディングに切り替えず、ボタンを無効化する', async () => {
    const card = makeCard()
    const status = ref('success')
    // refresh 中は useFetch の status が pending に戻る
    const refresh = vi.fn().mockImplementation(async () => {
      status.value = 'pending'
      await Promise.resolve()
      status.value = 'success'
    })
    vi.mocked(useFetch).mockReturnValue({
      data: ref(card),
      status,
      refresh,
      error: ref(null),
    })
    const wrapper = mount(CardIdPage, { global })

    const button = wrapper.find('button[aria-label="再読み込み"]')
    button.trigger('click')
    await vi.waitFor(() => expect(refresh).toHaveBeenCalled())

    // カード本体が「読み込み中...」に置き換わって押したボタンごと消えてはいけない
    expect(wrapper.find('.loading').exists()).toBe(false)
    expect(wrapper.find('button[aria-label="再読み込み"]').exists()).toBe(true)
  })

  it('再読み込みが通信エラーで失敗しても直前のカードを保持する', async () => {
    const card = makeCard()
    const data = ref<ReturnType<typeof makeCard> | undefined>(card)
    const error = ref<{ statusCode: number } | null>(null)
    // useFetch は失敗時に data を default（未指定なら undefined）へ戻す
    const refresh = vi.fn().mockImplementation(async () => {
      data.value = undefined
      error.value = { statusCode: 500 }
    })
    vi.mocked(useFetch).mockReturnValue({ data, status: ref('success'), refresh, error })
    const wrapper = mount(CardIdPage, { global })

    await wrapper.find('button[aria-label="再読み込み"]').trigger('click')
    await vi.waitFor(() => expect(refresh).toHaveBeenCalled())

    expect(data.value).toEqual(card)
    expect(wrapper.find('.empty').exists()).toBe(false)
    expect(wrapper.text()).not.toContain('見つかりませんでした')
  })

  it('再読み込みが404ならカードを保持せず見つからない表示にする', async () => {
    const card = makeCard()
    const data = ref<ReturnType<typeof makeCard> | undefined>(card)
    const error = ref<{ statusCode: number } | null>(null)
    // 他の端末で完全削除された場合は404が返る
    const refresh = vi.fn().mockImplementation(async () => {
      data.value = undefined
      error.value = { statusCode: 404 }
    })
    vi.mocked(useFetch).mockReturnValue({ data, status: ref('success'), refresh, error })
    const wrapper = mount(CardIdPage, { global })

    await wrapper.find('button[aria-label="再読み込み"]').trigger('click')
    await vi.waitFor(() => expect(refresh).toHaveBeenCalled())

    expect(data.value).toBeUndefined()
    expect(wrapper.find('.empty').exists()).toBe(true)
  })
})
