import { beforeEach, describe, expect, it } from 'vitest'
import { useRulesModal } from '../../app/composables/useRulesModal'
import { resetTestState } from '../setup/nitroGlobals'

beforeEach(() => {
  resetTestState()
})

describe('useRulesModal', () => {
  it('初期状態は閉じている', () => {
    const { isOpen } = useRulesModal()
    expect(isOpen.value).toBe(false)
  })

  it('open()で開き、close()で閉じる', () => {
    const modal = useRulesModal()
    modal.open()
    expect(modal.isOpen.value).toBe(true)
    modal.close()
    expect(modal.isOpen.value).toBe(false)
  })

  it('複数呼び出し間で開閉状態を共有する', () => {
    const a = useRulesModal()
    const b = useRulesModal()
    a.open()
    expect(b.isOpen.value).toBe(true)
  })
})
