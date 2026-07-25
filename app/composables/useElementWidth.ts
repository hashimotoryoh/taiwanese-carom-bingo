import { onBeforeUnmount, onMounted, ref, type Ref } from 'vue'

/**
 * 要素の表示幅（CSSピクセル）を追跡する。
 * グラフのSVGは viewBox をこの実寸に合わせることで、拡大縮小による文字の潰れ・肥大を防ぐ。
 * 計測できない環境（テストなど）では `fallback` のままにする。
 */
export function useElementWidth(el: Ref<HTMLElement | null>, fallback = 640): Ref<number> {
  const width = ref(fallback)
  let observer: ResizeObserver | null = null

  onMounted(() => {
    if (!el.value || typeof ResizeObserver === 'undefined') return
    observer = new ResizeObserver((entries) => {
      const measured = entries[0]?.contentRect.width ?? 0
      if (measured > 0) width.value = measured
    })
    observer.observe(el.value)
  })

  onBeforeUnmount(() => {
    observer?.disconnect()
    observer = null
  })

  return width
}
