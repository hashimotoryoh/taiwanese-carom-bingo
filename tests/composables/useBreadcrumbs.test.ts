import { beforeEach, describe, expect, it } from 'vitest'
import { effectScope, nextTick, ref } from 'vue'
import {
  HOME_BREADCRUMB,
  useBreadcrumbs,
  useBreadcrumbsState,
} from '../../app/composables/useBreadcrumbs'
import { resetTestState } from '../setup/nitroGlobals'

beforeEach(() => {
  resetTestState()
})

describe('useBreadcrumbs', () => {
  it('初期状態は一覧ページのみ', () => {
    expect(useBreadcrumbsState().value).toEqual([HOME_BREADCRUMB])
  })

  it('登録した項目の先頭に一覧ページを付ける', () => {
    useBreadcrumbs(() => [{ label: 'アーカイブ済み一覧' }])
    expect(useBreadcrumbsState().value).toEqual([HOME_BREADCRUMB, { label: 'アーカイブ済み一覧' }])
  })

  it('参照元が変化すると内容も追従する', async () => {
    const name = ref('読み込み中')
    useBreadcrumbs(() => [{ label: name.value }])
    expect(useBreadcrumbsState().value).toEqual([HOME_BREADCRUMB, { label: '読み込み中' }])

    name.value = '太郎'
    await nextTick()
    expect(useBreadcrumbsState().value).toEqual([HOME_BREADCRUMB, { label: '太郎' }])
  })

  it('ページの離脱後は追従を止める', async () => {
    const name = ref('太郎')
    const scope = effectScope()
    scope.run(() => useBreadcrumbs(() => [{ label: name.value }]))
    scope.stop()

    name.value = '花子'
    await nextTick()
    expect(useBreadcrumbsState().value).toEqual([HOME_BREADCRUMB, { label: '太郎' }])
  })

  it('状態は同じキーで共有される', () => {
    useBreadcrumbs(() => [{ label: 'ビンゴカード作成' }])
    expect(useBreadcrumbsState().value).toBe(useBreadcrumbsState().value)
    expect(useBreadcrumbsState().value.at(-1)).toEqual({ label: 'ビンゴカード作成' })
  })
})
