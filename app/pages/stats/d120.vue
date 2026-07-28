<script setup lang="ts">
import type { BingoCard } from '#shared/types/bingo'

definePageMeta({ layout: 'd120' })
useHead({ title: '出目ヒートマップ | カイルンBINGO' })

const api = useBingoApi()
// 統計ページと同じキーなので、そちらを経由して来た場合はキャッシュが効く
const { data: cards, status } = useAsyncData<BingoCard[]>('stats-all', () => api.fetchAllCards())

const stats = computed(() => rollFrequencyStats(cards.value ?? []))
</script>

<template>
  <div class="d120-page-body">
    <header class="d120-head">
      <div>
        <h1>出目ヒートマップ</h1>
        <p>roll frequency heatmap</p>
      </div>
      <NuxtLink to="/stats" class="d120-back">統計データへ戻る</NuxtLink>
    </header>

    <div v-if="status === 'pending'" class="d120-loading">読み込み中...</div>
    <template v-else>
      <div class="d120-viewer">
        <D120Viewer :z-scores="stats.zScores" :counts="stats.counts" :expected="stats.expected" />
      </div>
      <div class="d120-legend-wrap">
        <D120Legend />
      </div>
      <div class="d120-readout">
        <D120Formula :stats="stats" />
      </div>
    </template>
  </div>
</template>

<style scoped>
.d120-page-body {
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
}
.d120-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  padding: 22px 24px 14px;
}
.d120-head h1 {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 0.02em;
}
.d120-head p {
  margin: 2px 0 0;
  font-size: 12px;
  color: #6f7489;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  font-family: 'JetBrains Mono', ui-monospace, monospace;
}
.d120-back {
  color: #a7abc0;
  border: 1px solid rgba(232, 233, 242, 0.12);
  border-radius: 6px;
  padding: 5px 11px;
  font-size: 12px;
  text-decoration: none;
}
.d120-back:hover {
  color: #e8e9f2;
  border-color: #6f7489;
}
.d120-loading {
  flex: 1 1 auto;
  display: grid;
  place-items: center;
  color: #6f7489;
}
.d120-viewer {
  flex: 1 1 auto;
  min-height: 380px;
}
.d120-legend-wrap {
  padding: 4px 24px 18px;
}
.d120-readout {
  border-top: 1px solid rgba(232, 233, 242, 0.06);
  padding: 18px 24px 30px;
}
@media (max-width: 640px) {
  .d120-head {
    padding: 16px 16px 10px;
  }
  .d120-legend-wrap,
  .d120-readout {
    padding-left: 16px;
    padding-right: 16px;
  }
}
</style>
