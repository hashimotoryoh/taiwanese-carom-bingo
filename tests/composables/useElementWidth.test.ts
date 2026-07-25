import { afterEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, ref } from 'vue'
import { useElementWidth } from '../../app/composables/useElementWidth'

type ObserverCallback = (entries: { contentRect: { width: number } }[]) => void

const disconnect = vi.fn()
/** 直近に生成されたスタブの通知コールバック（テストから任意の幅を流し込む） */
let notify: ObserverCallback | null = null

function installResizeObserverStub() {
  class ResizeObserverStub {
    constructor(callback: ObserverCallback) {
      notify = callback
    }
    observe() {}
    disconnect = disconnect
  }
  vi.stubGlobal('ResizeObserver', ResizeObserverStub)
}

function mountHost(fallback = 100) {
  const Host = defineComponent({
    setup() {
      const el = ref<HTMLElement | null>(null)
      const width = useElementWidth(el, fallback)
      return () => h('div', { ref: el }, String(width.value))
    },
  })
  return mount(Host, { attachTo: document.body })
}

afterEach(() => {
  vi.unstubAllGlobals()
  notify = null
})

describe('useElementWidth', () => {
  it('ResizeObserverが無い環境ではfallbackのままにする', () => {
    vi.stubGlobal('ResizeObserver', undefined)
    const wrapper = mountHost(320)
    expect(wrapper.text()).toBe('320')
  })

  it('計測された幅を反映する', async () => {
    installResizeObserverStub()
    const wrapper = mountHost()
    notify!([{ contentRect: { width: 480 } }])
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toBe('480')
  })

  it('幅0の通知は無視する（非表示時に潰れないようにする）', async () => {
    installResizeObserverStub()
    const wrapper = mountHost(100)
    notify!([{ contentRect: { width: 0 } }])
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toBe('100')
  })

  it('アンマウント時に監視を解除する', () => {
    installResizeObserverStub()
    const wrapper = mountHost()
    wrapper.unmount()
    expect(disconnect).toHaveBeenCalled()
  })
})
