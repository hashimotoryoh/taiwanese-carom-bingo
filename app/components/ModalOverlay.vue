<script setup lang="ts">
defineProps<{ modalClass?: string }>()

// オーバーレイ自身（モーダル外側）のクリックで close を発火する
const emit = defineEmits<{ close: [] }>()
</script>

<template>
  <div class="overlay" @click.self="emit('close')">
    <div class="modal" :class="modalClass">
      <slot />
    </div>
  </div>
</template>
