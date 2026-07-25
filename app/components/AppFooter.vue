<script setup lang="ts">
const currentYear = new Date().getFullYear()
const commitHash = useRuntimeConfig().public.commitHash
// コミットハッシュが取得できなかった場合はリンクにしない
const hasCommitHash = commitHash !== 'unknown'
// コミットハッシュから GitHub のコミットページ URL を組み立てる
const commitUrl = `https://github.com/hashimotoryoh/taiwanese-carom-bingo/commit/${commitHash}`
</script>

<template>
  <footer class="app-footer">
    <nav class="doc-nav" aria-label="ドキュメント">
      <NuxtLink v-for="d in docList" :key="d.slug" :to="`/${d.slug}`">{{ d.title }}</NuxtLink>
    </nav>
    <div class="app-footer-meta">
      <p class="copyright">
        © {{ currentYear }}
        <a href="https://hashimotoryoh.github.io" target="_blank" rel="noopener noreferrer"
          >Ryoh Hashimoto</a
        >.
      </p>
      <p class="version">
        <a v-if="hasCommitHash" :href="commitUrl" target="_blank" rel="noopener noreferrer">{{
          commitHash
        }}</a>
        <template v-else>{{ commitHash }}</template>
      </p>
    </div>
  </footer>
</template>

<style scoped>
.app-footer {
  margin-top: 40px;
  padding: 18px 4px;
  border-top: 3px dashed var(--ink-soft);
  color: var(--ink-soft);
  font-size: 0.85rem;
}
.doc-nav {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 18px;
  margin-bottom: 14px;
}
.doc-nav a {
  color: var(--ink-soft);
  text-decoration: none;
  font-weight: 700;
}
.doc-nav a:hover {
  color: var(--stamp);
  text-decoration: underline;
}
.app-footer-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}
.app-footer p {
  margin: 0;
}
.copyright a {
  color: var(--stamp);
  text-decoration: none;
  font-weight: 700;
}
.copyright a:hover {
  text-decoration: underline;
}
.version {
  font-family: 'JetBrains Mono', monospace;
  letter-spacing: 0.02em;
}
.version a {
  color: inherit;
  text-decoration: none;
}
.version a:hover {
  text-decoration: underline;
}
</style>
