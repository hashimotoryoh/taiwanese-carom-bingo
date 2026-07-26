<script setup lang="ts">
import type { BingoCard } from '#shared/types/bingo'

useHead({ title: '統計データ | カイルンBINGO' })
useBreadcrumbs(() => [{ label: '統計データ' }])

const api = useBingoApi()
const { data: cards, status } = useAsyncData<BingoCard[]>('stats-all', () => api.fetchAllCards())

const overallStats = computed(() => aggregateRollStats(cards.value ?? []))

const hasRolls = computed(() => overallStats.value.totalRolls > 0)
const averagePoints = computed(() => dailyRollAverages(cards.value ?? []))

const persons = computed(() => {
  const byName = new Map<string, BingoCard[]>()
  for (const card of cards.value ?? []) {
    const group = byName.get(card.name)
    if (group) group.push(card)
    else byName.set(card.name, [card])
  }
  return [...byName.entries()]
    .map(([name, group]) => ({
      name,
      // 並び順の決定にのみ使う（表には出さない）
      latestActivity: Math.max(...group.map((c) => c.updatedAt ?? c.createdAt)),
      stats: aggregateRollStats(group),
    }))
    .sort(
      // 通算カイルン回数の多い順。同数なら最終更新が新しい順にする
      (a, b) => b.stats.totalRolls - a.stats.totalRolls || b.latestActivity - a.latestActivity,
    )
})
</script>

<template>
  <div>
    <h2 class="page-title">統計データ</h2>
    <p class="page-sub">これまでに記録された全員分のカイルンを集計しています</p>
    <div v-if="status === 'pending'" class="loading">読み込み中...</div>
    <template v-else>
      <StatsSummary :stats="overallStats" />

      <template v-if="hasRolls">
        <h3 class="roll-section-title">出目の平均値の遷移</h3>
        <RollAverageTrendChart :points="averagePoints" />
      </template>

      <h3 class="roll-section-title">個人統計データ</h3>
      <div v-if="persons.length === 0" class="empty">
        <p>まだ記録がありません。</p>
      </div>
      <PersonStatsList v-else :rows="persons" />
    </template>
  </div>
</template>
