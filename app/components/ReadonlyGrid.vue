<script setup lang="ts">
import type { ColumnKey } from '#shared/types/bingo'

defineProps<{ columns: Record<ColumnKey, (number | null)[]> }>()

const rows = Array.from({ length: GRID_SIZE }, (_, r) => r)
</script>

<template>
  <table class="bingo-table">
    <thead>
      <tr>
        <th v-for="col in COLUMNS" :key="col.key">
          <div class="col-head-wrap">
            <div class="col-head">{{ col.label }}</div>
          </div>
        </th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="r in rows" :key="r">
        <td v-for="col in COLUMNS" :key="col.key">
          <div class="num-cell" :class="col.key === 'N' && r === FREE_ROW ? 'free' : 'readonly'">
            {{ col.key === 'N' && r === FREE_ROW ? FREE_VALUE : columns[col.key][r] }}
          </div>
        </td>
      </tr>
    </tbody>
  </table>
</template>
