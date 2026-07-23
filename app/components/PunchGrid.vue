<script setup lang="ts">
import type { BingoCard, ColumnKey } from '#shared/types/bingo'

const props = defineProps<{
  card: BingoCard
  /** 演出（パーティクル）を発生させるマス。指定時に該当マスへ紙吹雪風のパーティクルを描画する */
  flashCell?: { col: ColumnKey; row: number } | null
}>()

const rows = Array.from({ length: GRID_SIZE }, (_, r) => r)

const PARTICLE_COUNT = 12
const particles = Array.from({ length: PARTICLE_COUNT }, (_, i) => {
  const angle = (360 / PARTICLE_COUNT) * i + Math.random() * 20
  const dist = 26 + Math.random() * 16
  return {
    id: i,
    style: {
      '--dx': `${Math.cos((angle * Math.PI) / 180) * dist}px`,
      '--dy': `${Math.sin((angle * Math.PI) / 180) * dist}px`,
      animationDelay: `${Math.random() * 0.05}s`,
    } as Record<string, string>,
  }
})

const locked = computed(() => props.card.archived)

// パンチ状態・パンチ日時は出目履歴から導出する
const punched = computed(() => buildPunched(props.card))
const punchedAt = computed(() => buildPunchedAt(props.card))

// リーチライン検出：あと1マスで揃うラインの構成マスを収集
const reach = computed(() =>
  locked.value ? { part: new Set<string>(), target: new Set<string>() } : reachCells(punched.value),
)

function isFree(col: ColumnKey, r: number): boolean {
  return col === 'N' && r === FREE_ROW
}

function cellValue(col: ColumnKey, r: number): number {
  return isFree(col, r) ? FREE_VALUE : props.card.numbers[col][r]!
}

function isFlashing(col: ColumnKey, r: number): boolean {
  return props.flashCell?.col === col && props.flashCell?.row === r
}

function cellClasses(col: ColumnKey, r: number): string[] {
  const key = `${col}:${r}`
  const classes: string[] = []
  if (punched.value[col][r]) classes.push('punched')
  else if (isFree(col, r)) classes.push('free')
  if (locked.value) classes.push('locked')
  if (reach.value.part.has(key)) classes.push('reach-part')
  if (reach.value.target.has(key)) classes.push('reach-target')
  return classes
}

function punchDate(col: ColumnKey, r: number): string | null {
  if (!punched.value[col][r]) return null
  const ts = punchedAt.value[col][r]
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
          <div class="punch-cell" :class="cellClasses(col.key, r)">
            <span class="cell-num">{{ cellValue(col.key, r) }}</span>
            <span v-if="punchDate(col.key, r)" class="cell-date">{{ punchDate(col.key, r) }}</span>
            <span v-if="isFlashing(col.key, r)" class="particle-burst" aria-hidden="true">
              <span v-for="p in particles" :key="p.id" class="particle" :style="p.style" />
            </span>
          </div>
        </td>
      </tr>
    </tbody>
  </table>
</template>
