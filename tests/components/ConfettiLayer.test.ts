import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import ConfettiLayer from '../../app/components/ConfettiLayer.vue'
import { useConfetti } from '../../app/composables/useConfetti'
import { resetTestState } from '../setup/nitroGlobals'

beforeEach(() => {
  resetTestState()
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('ConfettiLayer', () => {
  it('fire()するとパーティクルが生成され、時間経過で消える', async () => {
    const wrapper = mount(ConfettiLayer)
    const confetti = useConfetti()
    confetti.fire()
    await wrapper.vm.$nextTick()
    expect(wrapper.findAll('.confetti-piece').length).toBeGreaterThan(0)

    vi.advanceTimersByTime(5000)
    await wrapper.vm.$nextTick()
    expect(wrapper.findAll('.confetti-piece').length).toBe(0)
  })

  it('初期状態ではパーティクルが無い', () => {
    const wrapper = mount(ConfettiLayer)
    expect(wrapper.findAll('.confetti-piece').length).toBe(0)
  })
})
