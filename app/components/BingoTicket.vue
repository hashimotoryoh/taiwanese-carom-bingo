<script setup lang="ts">
import type { BingoCardSummary } from '#shared/types/bingo'

const props = defineProps<{ summary: BingoCardSummary }>()

/** このカードのパンチ率（穴の数 / カイルン回数）。まだ記録が無ければ0% */
const punchRate = computed(() =>
  punchRatePercent(props.summary.punchedCount, props.summary.rollCount),
)
</script>

<template>
  <div class="ticket" @click="navigateTo(`/card/${summary.id}`)">
    <span v-if="summary.bingoAchieved" class="badge bingo">ビンゴ達成</span>
    <span v-else-if="summary.archived" class="badge archived">アーカイブ済み</span>
    <h3>{{ summary.name }}</h3>
    <div class="stat-row">
      <span class="stat-chip">穴 {{ summary.punchedCount }} 個</span>
      <span class="stat-chip">パンチ率 {{ fmtNum(punchRate) }}%</span>
      <!-- アーカイブ済みカードはこれ以上進行しないためリーチは表示しない -->
      <span v-if="!summary.archived && summary.reachCount > 0" class="stat-chip reach">
        リーチ {{ summary.reachCount }} 本
      </span>
    </div>
  </div>
</template>
