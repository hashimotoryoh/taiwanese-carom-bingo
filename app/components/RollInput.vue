<script setup lang="ts">
const props = defineProps<{ busy?: boolean }>()

const emit = defineEmits<{ record: [value: number] }>()

const raw = ref('')
const error = ref('')

function submit() {
  if (props.busy) return
  const value = parseInt(raw.value, 10)
  if (raw.value.trim() === '' || Number.isNaN(value)) {
    error.value = '出目を入力してください。'
    return
  }
  if (!isValidRoll(value)) {
    error.value = `出目は ${MIN_ROLL} ~ ${MAX_ROLL} の整数で入力してください。`
    return
  }
  error.value = ''
  emit('record', value)
  raw.value = ''
}
</script>

<template>
  <div class="roll-input">
    <form class="roll-input-row" @submit.prevent="submit">
      <input
        v-model="raw"
        type="number"
        inputmode="numeric"
        :min="MIN_ROLL"
        :max="MAX_ROLL"
        :placeholder="`${MIN_ROLL} ~ ${MAX_ROLL}`"
        aria-label="サイコロの出目"
        @input="error = ''"
      />
      <button class="btn btn-primary" type="submit" :disabled="busy">出目を記録する</button>
    </form>
    <p v-if="error" class="roll-input-error">{{ error }}</p>
    <p v-else class="roll-input-hint">
      サイコロの出目を入力して記録します。カードにある番号なら自動で穴が開きます。
    </p>
  </div>
</template>
