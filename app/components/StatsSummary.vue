<script setup lang="ts">
import type { RollStats } from '#shared/utils/bingo'

withDefaults(
  defineProps<{
    stats: RollStats
    /**
     * 各項目のラベルに付ける接頭辞。複数カードを横断した集計では「通算」を付け、
     * 単一カードのページでは空文字にして「カイルン回数」などにする
     */
    labelPrefix?: string
    /** 控えめな見た目にする。全体集計の下にぶら下がる個人統計データで使い、グリッドは共通のまま差をつける */
    compact?: boolean
  }>(),
  { labelPrefix: '通算', compact: false },
)
</script>

<template>
  <div class="roll-summary" :class="{ compact }">
    <div class="summary-item">
      <span class="summary-label">{{ labelPrefix }}カイルン回数</span>
      <span class="summary-value">{{ stats.totalRolls }}</span>
    </div>
    <div class="summary-item">
      <span class="summary-label">出目の平均値</span>
      <span class="summary-value">{{ fmtNum(stats.averageValue) }}</span>
    </div>
    <div class="summary-item">
      <span class="summary-label">{{ labelPrefix }}ゾロ目回数</span>
      <span class="summary-value">{{ stats.totalZorome }}</span>
    </div>
    <div class="summary-item">
      <span class="summary-label">{{ labelPrefix }}ゾロ目割合</span>
      <span class="summary-value">{{ fmtNum(stats.zoromeRatioPercent) }}%</span>
    </div>
    <div class="summary-item">
      <span class="summary-label">{{ labelPrefix }}ビンゴカードパンチ率</span>
      <span class="summary-value">{{ fmtNum(stats.punchRatePercent) }}%</span>
    </div>
  </div>
</template>
