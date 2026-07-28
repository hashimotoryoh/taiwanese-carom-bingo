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
      <div class="summary-figure">
        <span class="summary-value"
          >{{ stats.totalRolls }}<span class="summary-unit">回</span></span
        >
      </div>
    </div>
    <div class="summary-item">
      <span class="summary-label">出目の平均値</span>
      <div class="summary-figure">
        <span class="summary-value">{{ fmtStat(stats.averageValue) }}</span>
        <NuxtLink class="summary-note" :to="EXPECTED_VALUE_DOC_PATH">
          期待値 {{ ROLL_EXPECTED_VALUE.toFixed(1) }}
        </NuxtLink>
      </div>
    </div>
    <div class="summary-item">
      <span class="summary-label">{{ labelPrefix }}ゾロ目回数</span>
      <div class="summary-figure">
        <span class="summary-value"
          >{{ stats.totalZorome }}<span class="summary-unit">回</span></span
        >
        <NuxtLink class="summary-note" :to="ZOROME_PROBABILITY_DOC_PATH">
          理論値 {{ fmtStat(expectedZoromeCount(stats.totalRolls)) }}回
        </NuxtLink>
      </div>
    </div>
    <div class="summary-item">
      <span class="summary-label">{{ labelPrefix }}ゾロ目割合</span>
      <div class="summary-figure">
        <span class="summary-value"
          >{{ fmtStat(stats.zoromeRatioPercent) }}<span class="summary-unit">%</span></span
        >
        <NuxtLink class="summary-note" :to="ZOROME_PROBABILITY_DOC_PATH">
          理論値 {{ ZOROME_PROBABILITY_PERCENT.toFixed(1) }}%
        </NuxtLink>
      </div>
    </div>
    <div class="summary-item">
      <span class="summary-label">{{ labelPrefix }}ビンゴカードパンチ率</span>
      <div class="summary-figure">
        <span class="summary-value"
          >{{ fmtStat(stats.punchRatePercent) }}<span class="summary-unit">%</span></span
        >
      </div>
    </div>
  </div>
</template>
