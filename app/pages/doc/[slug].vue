<script setup lang="ts">
// マークダウンで書かれたドキュメント（`app/content/docs/*.md`）を
// スラッグ単位で表示する共通ページ。
const route = useRoute()
const slug = computed(() => String(route.params.slug))

const doc = computed(() => getDoc(slug.value))
const bodyHtml = computed(() => (doc.value ? renderMarkdown(doc.value.markdown) : ''))

useHead(() => ({
  title: doc.value
    ? `${doc.value.title} | カイルンBINGO`
    : 'ページが見つかりません | カイルンBINGO',
}))

useBreadcrumbs(() => [{ label: doc.value ? doc.value.title : 'ページが見つかりません' }])
</script>

<template>
  <div>
    <div v-if="doc" class="doc">
      <NuxtLink to="/" class="back-link">← ビンゴカード一覧に戻る</NuxtLink>
      <!-- 信頼できるリポジトリ内のマークダウンのみを描画するため v-html は安全 -->
      <!-- eslint-disable-next-line vue/no-v-html -->
      <article class="doc-body" v-html="bodyHtml" />
    </div>
    <div v-else class="empty">
      <p>お探しのページは見つかりませんでした。</p>
      <NuxtLink class="btn btn-primary" to="/">ビンゴカード一覧に戻る</NuxtLink>
    </div>
  </div>
</template>

<style scoped>
.back-link {
  display: inline-block;
  margin-bottom: 18px;
  color: var(--ink-soft);
  text-decoration: none;
  font-size: 0.85rem;
  font-weight: 700;
}
.back-link:hover {
  text-decoration: underline;
}
.doc-body {
  background: var(--paper);
  border: 3px solid var(--ink);
  border-radius: var(--radius);
  box-shadow: 0 4px 0 var(--shadow);
  padding: 26px 28px;
}
.doc-body :deep(h1) {
  font-size: 1.6rem;
  font-weight: 900;
  margin: 0 0 18px;
  padding-bottom: 12px;
  border-bottom: 3px dashed var(--ink-soft);
}
.doc-body :deep(h2) {
  font-size: 1.2rem;
  font-weight: 900;
  margin: 30px 0 10px;
  color: var(--stamp);
}
.doc-body :deep(h3) {
  font-size: 1rem;
  font-weight: 700;
  margin: 22px 0 8px;
}
.doc-body :deep(p) {
  line-height: 1.85;
  margin: 0 0 14px;
}
.doc-body :deep(ul),
.doc-body :deep(ol) {
  line-height: 1.85;
  margin: 0 0 14px;
  padding-left: 1.4em;
}
.doc-body :deep(li) {
  margin-bottom: 4px;
}
.doc-body :deep(code) {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.86em;
  background: var(--paper-dark);
  padding: 1px 5px;
  border-radius: 5px;
}
.doc-body :deep(pre) {
  background: var(--ink);
  color: var(--paper);
  border-radius: 10px;
  padding: 14px 16px;
  overflow-x: auto;
  margin: 0 0 16px;
}
.doc-body :deep(pre code) {
  background: none;
  color: inherit;
  padding: 0;
  font-size: 0.82rem;
  line-height: 1.7;
}
.doc-body :deep(strong) {
  font-weight: 900;
}
</style>
