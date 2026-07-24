<script setup lang="ts">
import type { RollStats } from '#shared/utils/bingo'

defineProps<{ stats: RollStats }>()

/** 小数は最大1桁で表示する */
function fmtNum(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1)
}
</script>

<template>
  <div class="roll-summary">
    <div class="summary-item">
      <span class="summary-label">出目の平均値</span>
      <span class="summary-value">{{ fmtNum(stats.averageValue) }}</span>
    </div>
    <div class="summary-item">
      <span class="summary-label">総カイルン回数</span>
      <span class="summary-value">{{ stats.totalRolls }}</span>
    </div>
    <div class="summary-item">
      <span class="summary-label">同日平均カイルン回数</span>
      <span class="summary-value">{{ fmtNum(stats.avgRollsPerDay) }}</span>
    </div>
    <div class="summary-item">
      <span class="summary-label">総ゾロ目回数</span>
      <span class="summary-value">{{ stats.totalZorome }}</span>
    </div>
    <div class="summary-item">
      <span class="summary-label">ゾロ目割合</span>
      <span class="summary-value">{{ fmtNum(stats.zoromeRatioPercent) }}%</span>
    </div>
    <div class="summary-item">
      <span class="summary-label">パンチ率</span>
      <span class="summary-value">{{ fmtNum(stats.punchRatePercent) }}%</span>
    </div>
  </div>
</template>
