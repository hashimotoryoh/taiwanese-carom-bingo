import { beforeEach, describe, expect, it } from 'vitest'
import { useConfetti } from '../../app/composables/useConfetti'
import { resetTestState } from '../setup/nitroGlobals'

beforeEach(() => {
  resetTestState()
})

describe('useConfetti', () => {
  it('初期値は0', () => {
    const { trigger } = useConfetti()
    expect(trigger.value).toBe(0)
  })

  it('fire()を呼ぶたびにインクリメントする', () => {
    const { trigger, fire } = useConfetti()
    fire()
    fire()
    expect(trigger.value).toBe(2)
  })

  it('複数回呼び出しても状態を共有する（同一キーのuseState）', () => {
    const a = useConfetti()
    const b = useConfetti()
    a.fire()
    expect(b.trigger.value).toBe(1)
  })
})
