<script setup lang="ts">
defineProps<{
  message: string
  okLabel: string
}>()

const emit = defineEmits<{ confirm: []; cancel: [] }>()
</script>

<template>
  <ModalOverlay modal-class="bingo-modal" @close="emit('cancel')">
    <h3>確認</h3>
    <p>{{ message }}</p>
    <div class="row" style="justify-content: center">
      <button class="btn btn-secondary" @click="emit('cancel')">キャンセル</button>
      <button class="btn confirm-ok" @click="emit('confirm')">{{ okLabel }}</button>
    </div>
  </ModalOverlay>
</template>

<style scoped>
.confirm-ok {
  background: var(--stamp);
  color: var(--paper);
  box-shadow: 0 3px 0 var(--stamp-dark);
}
</style>
