<script setup lang="ts">
const rules = useRulesModal()
// パンくずリストの内容は各ページが useBreadcrumbs で登録する
const breadcrumbs = useBreadcrumbsState()
</script>

<template>
  <div class="app-shell">
    <header class="top">
      <NuxtLink to="/" class="brand">
        <div class="balls" aria-hidden="true">
          <AppLogo />
        </div>
        <div>
          <h1>カイルンBINGO</h1>
          <small>TAIWANESE CAROM BINGO</small>
        </div>
      </NuxtLink>
      <button class="rules-btn" @click="rules.open()">ルール説明</button>
    </header>

    <AppBreadcrumbs :items="breadcrumbs" class="breadcrumbs-top" />

    <slot />

    <AppBreadcrumbs
      :items="breadcrumbs"
      label="パンくずリスト（ページ下部）"
      class="breadcrumbs-bottom"
    />

    <AppFooter />

    <RulesModal v-if="rules.isOpen.value" @close="rules.close()" />
    <ConfettiLayer />
  </div>
</template>

<style scoped>
.breadcrumbs-top {
  margin-bottom: 18px;
}
.breadcrumbs-bottom {
  margin-top: 32px;
}
</style>
