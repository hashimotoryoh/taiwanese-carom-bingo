<script setup lang="ts">
import type { BingoCard } from '#shared/types/bingo'

const props = withDefaults(
  defineProps<{
    cards: BingoCard[]
    /** 折りたたみ時に表示する件数 */
    initialLimit?: number
  }>(),
  { initialLimit: 30 },
)

const rows = computed(() => crossCardRollHistory(props.cards))
// カードが1枚だけなら、どのカードの記録かは自明なので列ごと省く
const showCardColumn = computed(() => props.cards.length > 1)

const expanded = ref(false)
const visibleRows = computed(() =>
  expanded.value ? rows.value : rows.value.slice(0, props.initialLimit),
)
const hiddenCount = computed(() => rows.value.length - visibleRows.value.length)
</script>

<template>
  <div class="roll-history">
    <table class="history-table">
      <thead>
        <tr>
          <th>日時</th>
          <th>出目</th>
          <th>パンチされたマス目</th>
          <th v-if="showCardColumn">カード</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in visibleRows" :key="row.roll.id">
          <td class="history-datetime">{{ fmtDateTime(row.roll.rolledAt) }}</td>
          <td class="history-value" :class="{ zorome: isZorome(row.roll.value) }">
            {{ row.roll.value }}
            <span v-if="isZorome(row.roll.value)" class="zorome-tag">ゾロ目</span>
          </td>
          <td class="history-cell">{{ row.label ?? '—' }}</td>
          <td v-if="showCardColumn" class="history-card">
            <NuxtLink :to="`/card/${row.cardId}`">{{ fmtDate(row.cardCreatedAt) }} 作成</NuxtLink>
          </td>
        </tr>
      </tbody>
    </table>
    <div v-if="hiddenCount > 0" class="history-more">
      <button type="button" class="btn btn-secondary" @click="expanded = true">
        残り {{ hiddenCount }} 件を表示する
      </button>
    </div>
  </div>
</template>
