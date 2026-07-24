import { defineComponent, h } from 'vue'

/** テスト用のNuxtLinkスタブ。toをhrefとして描画するだけの単純な<a>要素にする */
export const NuxtLinkStub = defineComponent({
  name: 'NuxtLink',
  props: { to: { type: [String, Object], required: true } },
  setup(props, { slots }) {
    return () => h('a', { href: String(props.to) }, slots.default?.())
  },
})
