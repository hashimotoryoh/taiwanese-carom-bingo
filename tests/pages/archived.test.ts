import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import ArchivedPage from '../../app/pages/card/archived.vue'
import BingoTicket from '../../app/components/BingoTicket.vue'
import ConfirmDialog from '../../app/components/ConfirmDialog.vue'
import ModalOverlay from '../../app/components/ModalOverlay.vue'
import { NuxtLinkStub } from '../setup/NuxtLinkStub'
import { useFetch } from '../setup/nuxtStubs'
import { useBingoApi } from '../../app/composables/useBingoApi'
import { resetTestState } from '../setup/nitroGlobals'
import { makeSummary } from '../setup/fixtures'

vi.mock('../../app/composables/useBingoApi', () => ({ useBingoApi: vi.fn() }))

const global = { components: { BingoTicket, ConfirmDialog, ModalOverlay, NuxtLink: NuxtLinkStub } }

beforeEach(() => {
  resetTestState()
})

describe('card/archived.vue', () => {
  it('アーカイブ済みカードのみ一覧表示する', () => {
    vi.mocked(useFetch).mockReturnValue({
      data: ref([
        makeSummary({ id: 'active', archived: false }),
        makeSummary({ id: 'arc', archived: true }),
      ]),
      status: ref('success'),
      refresh: vi.fn(),
    })
    const wrapper = mount(ArchivedPage, { global })
    const tickets = wrapper.findAllComponents(BingoTicket)
    expect(tickets).toHaveLength(1)
    expect(tickets[0]!.props('summary').id).toBe('arc')
  })

  it('削除確認ダイアログでOKするとdeleteCardしてrefreshする', async () => {
    const deleteCard = vi.fn().mockResolvedValue(undefined)
    const refresh = vi.fn()
    vi.mocked(useBingoApi).mockReturnValue({ deleteCard } as unknown as ReturnType<
      typeof useBingoApi
    >)
    vi.mocked(useFetch).mockReturnValue({
      data: ref([makeSummary({ id: 'arc', archived: true })]),
      status: ref('success'),
      refresh,
    })
    const wrapper = mount(ArchivedPage, { global })
    await wrapper.findComponent(BingoTicket).vm.$emit('delete', 'arc')
    await wrapper.find('.confirm-ok').trigger('click')
    expect(deleteCard).toHaveBeenCalledWith('arc')
    expect(refresh).toHaveBeenCalled()
  })

  it('削除確認ダイアログをキャンセルするとdeleteCardを呼ばない', async () => {
    const deleteCard = vi.fn()
    vi.mocked(useBingoApi).mockReturnValue({ deleteCard } as unknown as ReturnType<
      typeof useBingoApi
    >)
    vi.mocked(useFetch).mockReturnValue({
      data: ref([makeSummary({ id: 'arc', archived: true })]),
      status: ref('success'),
      refresh: vi.fn(),
    })
    const wrapper = mount(ArchivedPage, { global })
    await wrapper.findComponent(BingoTicket).vm.$emit('delete', 'arc')
    await wrapper.findComponent(ConfirmDialog).find('.btn-secondary').trigger('click')
    expect(deleteCard).not.toHaveBeenCalled()
    expect(wrapper.findComponent(ConfirmDialog).exists()).toBe(false)
  })
})
