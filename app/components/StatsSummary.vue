<script setup lang="ts">
import type { RollStats } from '#shared/utils/bingo'

withDefaults(
  defineProps<{
    stats: RollStats
    /** カイルン総数の項目ラベル。単一カードのページでは「カイルン回数」に差し替える */
    totalRollsLabel?: string
  }>(),
  { totalRollsLabel: '総カイルン回数' },
)
</script>

<template>
  <div class="roll-summary">
    <div class="summary-item">
      <span class="summary-label">{{ totalRollsLabel }}</span>
      <span class="summary-value">{{ stats.totalRolls }}</span>
    </div>
    <div class="summary-item">
      <span class="summary-label">同日平均カイルン回数</span>
      <span class="summary-value">{{ fmtNum(stats.avgRollsPerDay) }}</span>
    </div>
    <div class="summary-item">
      <span class="summary-label">出目の平均値</span>
      <span class="summary-value">{{ fmtNum(stats.averageValue) }}</span>
    </div>
    <div class="summary-item">
      <span class="summary-label">ゾロ目回数</span>
      <span class="summary-value">{{ stats.totalZorome }}</span>
    </div>
    <div class="summary-item">
      <span class="summary-label">ゾロ目割合</span>
      <span class="summary-value">{{ fmtNum(stats.zoromeRatioPercent) }}%</span>
    </div>
    <div class="summary-item">
      <span class="summary-label">ビンゴカードパンチ率</span>
      <span class="summary-value">{{ fmtNum(stats.punchRatePercent) }}%</span>
    </div>
  </div>
</template>
