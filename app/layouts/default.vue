<script setup lang="ts">
const rules = useRulesModal()
</script>

<template>
  <div class="app-shell">
    <header class="top">
      <div class="brand">
        <div class="balls" aria-hidden="true">
          <AppLogo />
        </div>
        <div>
          <h1>カイルンBINGO</h1>
          <small>TAIWANESE CAROM BINGO</small>
        </div>
      </div>
      <button class="rules-btn" @click="rules.open()">ルール説明</button>
    </header>

    <slot />

    <AppFooter />

    <RulesModal v-if="rules.isOpen.value" @close="rules.close()" />
    <ConfettiLayer />
  </div>
</template>
