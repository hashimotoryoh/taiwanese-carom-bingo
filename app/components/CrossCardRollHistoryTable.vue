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

const rolls = computed(() => crossCardRolls(props.cards))

const expanded = ref(false)
const visibleRolls = computed(() =>
  expanded.value ? rolls.value : rolls.value.slice(0, props.initialLimit),
)
const hiddenCount = computed(() => rolls.value.length - visibleRolls.value.length)
</script>

<template>
  <div class="roll-history">
    <table class="history-table">
      <thead>
        <tr>
          <th>日時</th>
          <th>出目</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="roll in visibleRolls" :key="roll.id">
          <td class="history-datetime">{{ fmtDateTime(roll.rolledAt) }}</td>
          <td class="history-value" :class="{ zorome: isZorome(roll.value) }">
            {{ roll.value }}
            <span v-if="isZorome(roll.value)" class="zorome-tag">ゾロ目</span>
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
