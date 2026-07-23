<script setup lang="ts">
import type { BingoCard } from '#shared/types/bingo'

const props = defineProps<{ card: BingoCard; locked?: boolean }>()

const emit = defineEmits<{ delete: [rollId: string] }>()

const rows = computed(() => rollHistory(props.card))
</script>

<template>
  <div class="roll-history">
    <table class="history-table">
      <thead>
        <tr>
          <th>日時</th>
          <th>出目</th>
          <th>パンチされたマス目</th>
          <th v-if="!locked" class="history-action-col" aria-label="操作" />
        </tr>
      </thead>
      <tbody>
        <tr v-for="{ roll, label } in rows" :key="roll.id">
          <td class="history-datetime">{{ fmtDateTime(roll.rolledAt) }}</td>
          <td class="history-value" :class="{ zorome: isZorome(roll.value) }">
            {{ roll.value }}
            <span v-if="isZorome(roll.value)" class="zorome-tag">ゾロ目</span>
          </td>
          <td class="history-cell">{{ label ?? '—' }}</td>
          <td v-if="!locked" class="history-action">
            <button
              type="button"
              class="history-delete"
              aria-label="この記録を削除する"
              @click="emit('delete', roll.id)"
            >
              🗑
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
