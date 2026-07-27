import { toValue, watchEffect, type MaybeRefOrGetter } from 'vue'

/** パンくずリストの1項目。末尾（現在地）はリンクにしないため `to` は省略できる */
export interface BreadcrumbItem {
  label: string
  to?: string
}

/** すべてのページに共通する先頭項目（トップページ＝ビンゴカード一覧） */
export const HOME_BREADCRUMB: BreadcrumbItem = { label: 'ビンゴカード一覧', to: '/' }

/** レイアウトがページの上下に描画するパンくずリストの内容（全ページ共通） */
export function useBreadcrumbsState() {
  return useState<BreadcrumbItem[]>('breadcrumbs', () => [HOME_BREADCRUMB])
}

/**
 * ページ側から呼び出して、そのページのパンくずリストを登録する。
 * 先頭のトップページ項目はこの関数が付けるため、呼び出し側はそれ以降だけを渡す。
 * 非同期に読み込むカード名などを反映できるよう、getter や ref も受け取れる。
 */
export function useBreadcrumbs(trail: MaybeRefOrGetter<BreadcrumbItem[]>): void {
  const state = useBreadcrumbsState()
  watchEffect(() => {
    state.value = [HOME_BREADCRUMB, ...toValue(trail)]
  })
}
