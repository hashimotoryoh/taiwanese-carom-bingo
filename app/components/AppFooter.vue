<script setup lang="ts">
const currentYear = new Date().getFullYear()
const commitHash = useRuntimeConfig().public.commitHash
</script>

<template>
  <footer class="app-footer">
    <p class="copyright">
      © {{ currentYear }}
      <a href="https://hashimotoryoh.github.io" target="_blank" rel="noopener noreferrer"
        >Ryoh Hashimoto</a
      >.
    </p>
    <p class="version">{{ commitHash }}</p>
  </footer>
</template>

<style scoped>
.app-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 40px;
  padding: 18px 4px;
  border-top: 3px dashed var(--ink-soft);
  color: var(--ink-soft);
  font-size: 0.85rem;
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
</style>
