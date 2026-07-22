<script setup lang="ts">
import type { ColumnKey } from '#shared/types/bingo'

defineProps<{ columns: Record<ColumnKey, (number | null)[]> }>()

const emit = defineEmits<{ update: [col: ColumnKey, row: number, value: number | null] }>()

const rows = Array.from({ length: GRID_SIZE }, (_, r) => r)

function onInput(col: ColumnKey, row: number, e: Event) {
  const raw = (e.target as HTMLInputElement).value
  emit('update', col, row, raw === '' ? null : parseInt(raw, 10))
}
</script>

<template>
  <table class="bingo-table">
    <thead>
      <tr>
        <th v-for="col in COLUMNS" :key="col.key">
          <div class="col-head-wrap">
            <div class="col-head">{{ col.label }}</div>
            <span class="range-hint">
              {{ col.min }} ~ {{ col.max }}
              <template v-if="col.key === 'O'"><br />(101除く)</template>
            </span>
          </div>
        </th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="r in rows" :key="r">
        <td v-for="col in COLUMNS" :key="col.key" class="num-cell">
          <div v-if="col.key === 'N' && r === FREE_ROW" class="num-cell free">
            <span class="free-num">🔒 {{ FREE_VALUE }}</span>
            <span class="free-tag">固定・変更不可</span>
          </div>
          <input
            v-else
            type="number"
            inputmode="numeric"
            :min="col.min"
            :max="col.max"
            :value="columns[col.key][r] ?? ''"
            :placeholder="`${col.min} ~ ${col.max}`"
            @input="onInput(col.key, r, $event)"
          />
        </td>
      </tr>
    </tbody>
  </table>
</template>
