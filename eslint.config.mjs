// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt(
  // カスタムルールをここに追加
  {
    rules: {
      // Prettier が void 要素を self-closing（<br /> 形式）に整形するため、それに合わせる
      'vue/html-self-closing': ['warn', { html: { void: 'always' } }],
    },
  },
)
