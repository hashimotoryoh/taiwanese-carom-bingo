/**
 * Nuxtが提供する（npm importできない）コンポーザブルのテスト用スタブ。
 * app配下のVueコンポーネントには unplugin-auto-import 経由でこのモジュールから注入される
 * （vitest.config.ts の AutoImport 設定を参照）。
 * 各テストは `vi.mocked(useFetch).mockReturnValue(...)` のように戻り値を差し替える。
 */
import { vi } from 'vitest'

export const navigateTo = vi.fn()
export const useRoute = vi.fn(() => ({ params: {} }))
export const useHead = vi.fn()
export const useFetch = vi.fn()
export const useAsyncData = vi.fn()
export const useRuntimeConfig = vi.fn(() => ({ public: { commitHash: 'unknown' } }))
export const clearError = vi.fn()
