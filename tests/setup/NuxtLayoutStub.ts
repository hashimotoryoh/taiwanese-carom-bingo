import { defineComponent, h } from 'vue'

/** テスト用のNuxtLayoutスタブ。レイアウトは解決せず、スロットの中身だけを描画する */
export const NuxtLayoutStub = defineComponent({
  name: 'NuxtLayout',
  setup(_props, { slots }) {
    return () => h('div', { class: 'nuxt-layout' }, slots.default?.())
  },
})
