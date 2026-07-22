<script setup lang="ts">
import type { BingoCard, ColumnKey } from '#shared/types/bingo'

const props = defineProps<{ card: BingoCard; busy?: boolean }>()

const emit = defineEmits<{ toggle: [col: ColumnKey, row: number] }>()

const rows = Array.from({ length: GRID_SIZE }, (_, r) => r)

const locked = computed(() => props.card.archived)

// リーチライン検出：あと1マスで揃うラインの構成マスを収集
const reach = computed(() =>
  locked.value
    ? { part: new Set<string>(), target: new Set<string>() }
    : reachCells(props.card.punched),
)

function isFree(col: ColumnKey, r: number): boolean {
  return col === 'N' && r === FREE_ROW
}

function cellValue(col: ColumnKey, r: number): number {
  return isFree(col, r) ? FREE_VALUE : props.card.numbers[col][r]!
}

function cellClasses(col: ColumnKey, r: number): string[] {
  const punched = props.card.punched[col][r]
  const key = `${col}:${r}`
  const classes: string[] = []
  if (punched) classes.push('punched')
  else if (isFree(col, r)) classes.push('free')
  if (locked.value) classes.push('locked')
  if (reach.value.part.has(key)) classes.push('reach-part')
  if (reach.value.target.has(key)) classes.push('reach-target')
  return classes
}

function punchDate(col: ColumnKey, r: number): string | null {
  if (!props.card.punched[col][r]) return null
  const ts = props.card.punchedAt?.[col]?.[r]
  return ts ? fmtDate(ts) : null
}
</script>

<template>
  <table class="bingo-table punch-table">
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
          <button
            type="button"
            class="punch-cell"
            :class="cellClasses(col.key, r)"
            :disabled="locked || props.busy"
            @click="emit('toggle', col.key, r)"
          >
            <span class="cell-num">{{ cellValue(col.key, r) }}</span>
            <span v-if="punchDate(col.key, r)" class="cell-date">{{ punchDate(col.key, r) }}</span>
          </button>
        </td>
      </tr>
    </tbody>
  </table>
</template>
