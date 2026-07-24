import { beforeEach, describe, expect, it } from 'vitest'
import { useDraftCard } from '../../app/composables/useDraftCard'
import { resetTestState } from '../setup/nitroGlobals'

beforeEach(() => {
  resetTestState()
})

describe('useDraftCard', () => {
  it('初期値はnull', () => {
    const draft = useDraftCard()
    expect(draft.value).toBeNull()
  })

  it('設定した値を別呼び出しからも参照できる（状態共有）', () => {
    const first = useDraftCard()
    first.value = { name: '太郎', columns: { B: [], I: [], N: [], G: [], O: [] } }
    const second = useDraftCard()
    expect(second.value?.name).toBe('太郎')
  })
})
