import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import RecordsNamePage from '../../app/pages/records/[name].vue'
import BingoTicket from '../../app/components/BingoTicket.vue'
import ConfirmDialog from '../../app/components/ConfirmDialog.vue'
import ModalOverlay from '../../app/components/ModalOverlay.vue'
import StatsSummary from '../../app/components/StatsSummary.vue'
import { NuxtLinkStub } from '../setup/NuxtLinkStub'
import { useAsyncData, useRoute } from '../setup/nuxtStubs'
import { useBingoApi } from '../../app/composables/useBingoApi'
import { resetTestState } from '../setup/nitroGlobals'
import { makeCard } from '../setup/fixtures'

vi.mock('../../app/composables/useBingoApi', () => ({ useBingoApi: vi.fn() }))

const global = {
  components: { BingoTicket, ConfirmDialog, ModalOverlay, StatsSummary, NuxtLink: NuxtLinkStub },
}

beforeEach(() => {
  resetTestState()
  vi.mocked(useRoute).mockReturnValue({ params: { name: '太郎' } })
})

describe('records/[name].vue', () => {
  it('該当カードが無ければ見つからない旨を表示する', () => {
    vi.mocked(useAsyncData).mockReturnValue({
      data: ref([]),
      status: ref('success'),
      refresh: vi.fn(),
    })
    vi.mocked(useBingoApi).mockReturnValue({} as unknown as ReturnType<typeof useBingoApi>)
    const wrapper = mount(RecordsNamePage, { global })
    expect(wrapper.text()).toContain('太郎さんの記録は見つかりませんでした。')
  })

  it('該当する名前のカードのみ新しい順に表示する', () => {
    const cards = [
      makeCard({ id: 'a', name: '太郎', createdAt: 1 }),
      makeCard({ id: 'b', name: '花子', createdAt: 2 }),
      makeCard({ id: 'c', name: '太郎', createdAt: 3, bingoAchieved: true }),
    ]
    vi.mocked(useAsyncData).mockReturnValue({
      data: ref(cards),
      status: ref('success'),
      refresh: vi.fn(),
    })
    vi.mocked(useBingoApi).mockReturnValue({} as unknown as ReturnType<typeof useBingoApi>)
    const wrapper = mount(RecordsNamePage, { global })
    const tickets = wrapper.findAllComponents(BingoTicket)
    expect(tickets).toHaveLength(2)
    expect(tickets[0]!.props('summary').id).toBe('c')
    expect(wrapper.text()).toContain('ビンゴ達成 1 回')
  })

  it('削除確認ダイアログのOKでdeleteCardしrefreshする', async () => {
    const cards = [makeCard({ id: 'a', name: '太郎' })]
    const refresh = vi.fn()
    const deleteCard = vi.fn().mockResolvedValue(undefined)
    vi.mocked(useAsyncData).mockReturnValue({ data: ref(cards), status: ref('success'), refresh })
    vi.mocked(useBingoApi).mockReturnValue({ deleteCard } as unknown as ReturnType<
      typeof useBingoApi
    >)
    const wrapper = mount(RecordsNamePage, { global })
    await wrapper.findComponent(BingoTicket).vm.$emit('delete', 'a')
    await wrapper.find('.confirm-ok').trigger('click')
    expect(deleteCard).toHaveBeenCalledWith('a')
    expect(refresh).toHaveBeenCalled()
  })
})
