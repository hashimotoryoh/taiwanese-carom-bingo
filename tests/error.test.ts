import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import ErrorPage from '../app/error.vue'
import { NuxtLayoutStub } from './setup/NuxtLayoutStub'
import { clearError, useHead } from './setup/nuxtStubs'

const global = {
  components: { NuxtLayout: NuxtLayoutStub },
}

function mountError(error: { statusCode?: number; statusMessage?: string; message?: string }) {
  return mount(ErrorPage, { global, props: { error } })
}

describe('error.vue', () => {
  it('404はステータスコードを1桁ずつ表示し、見つからない旨を伝える', () => {
    const wrapper = mountError({ statusCode: 404, message: 'Page not found: /unknown' })
    expect(wrapper.findAll('.error-digit').map((d) => d.text())).toEqual(['4', '0', '4'])
    expect(wrapper.find('.page-title').text()).toBe('ページが見つかりません')
    expect(wrapper.text()).toContain(
      'お探しのページは削除されたか、URLが間違っている可能性があります。',
    )
  })

  it('404ではエラーメッセージを表示しない', () => {
    const wrapper = mountError({ statusCode: 404, message: 'Page not found: /unknown' })
    expect(wrapper.find('.error-detail').exists()).toBe(false)
  })

  it('404以外は汎用の文言とエラーメッセージを表示する', () => {
    const wrapper = mountError({ statusCode: 500, message: 'Internal Server Error' })
    expect(wrapper.findAll('.error-digit').map((d) => d.text())).toEqual(['5', '0', '0'])
    expect(wrapper.find('.page-title').text()).toBe('エラーが発生しました')
    expect(wrapper.find('.error-detail').text()).toBe('Internal Server Error')
  })

  it('messageが無い場合はstatusMessageをエラーメッセージとして表示する', () => {
    const wrapper = mountError({ statusCode: 503, statusMessage: 'Service Unavailable' })
    expect(wrapper.find('.error-detail').text()).toBe('Service Unavailable')
  })

  it('ステータスコードが無い場合は500として扱う', () => {
    const wrapper = mountError({})
    expect(wrapper.findAll('.error-digit').map((d) => d.text())).toEqual(['5', '0', '0'])
    expect(wrapper.find('.page-title').text()).toBe('エラーが発生しました')
  })

  it('useHeadにステータスに応じたタイトルを渡す', () => {
    mountError({ statusCode: 404 })
    const notFoundArg = vi.mocked(useHead).mock.calls[0]![0] as () => { title: string }
    expect(notFoundArg().title).toBe('ページが見つかりません | カイルンBINGO')

    vi.mocked(useHead).mockClear()
    mountError({ statusCode: 500 })
    const errorArg = vi.mocked(useHead).mock.calls[0]![0] as () => { title: string }
    expect(errorArg().title).toBe('エラーが発生しました | カイルンBINGO')
  })

  it('戻るボタンはclearErrorでエラーを解除してトップへ遷移する', async () => {
    const wrapper = mountError({ statusCode: 404 })
    await wrapper.find('.btn-primary').trigger('click')
    expect(vi.mocked(clearError)).toHaveBeenCalledWith({ redirect: '/' })
  })
})
