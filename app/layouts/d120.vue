<script setup lang="ts">
// アプリ本体のデザイン（和紙風）とは切り離した、全画面の黒いレイアウト。
// main.css は全ページにグローバル適用されるので body の背景をここで上書きする。
useHead({ bodyAttrs: { class: 'd120-page' } })
</script>

<template>
  <div class="d120-shell">
    <slot />
  </div>
</template>

<!-- body に効かせる必要があるので scoped にしない -->
<style>
body.d120-page {
  background: #050510;
  color: #e8e9f2;
}
</style>

<style scoped>
.d120-shell {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
</style>
