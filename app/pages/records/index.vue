<script setup lang="ts">
import type { BingoCard } from '#shared/types/bingo'

useHead({ title: '全統計データ | カイルンBINGO' })

const api = useBingoApi()
const { data: cards, status } = useAsyncData<BingoCard[]>('records-all', () => api.fetchAllCards())

const overallStats = computed(() => aggregateRollStats(cards.value ?? []))

interface PersonRow {
  name: string
  cardCount: number
  bingoCount: number
  latestActivity: number
  stats: ReturnType<typeof aggregateRollStats>
}

const persons = computed<PersonRow[]>(() => {
  const byName = new Map<string, BingoCard[]>()
  for (const card of cards.value ?? []) {
    const group = byName.get(card.name)
    if (group) group.push(card)
    else byName.set(card.name, [card])
  }
  return [...byName.entries()]
    .map(([name, group]) => ({
      name,
      cardCount: group.length,
      bingoCount: group.filter((c) => c.bingoAchieved).length,
      latestActivity: Math.max(...group.map((c) => c.updatedAt ?? c.createdAt)),
      stats: aggregateRollStats(group),
    }))
    .sort((a, b) => b.latestActivity - a.latestActivity)
})
</script>

<template>
  <div>
    <h2 class="page-title">全統計データ</h2>
    <p class="page-sub">これまでに記録された全員分のカイルンを集計しています</p>
    <div class="row" style="margin-bottom: 20px">
      <NuxtLink class="btn btn-secondary" to="/">← 一覧へ戻る</NuxtLink>
    </div>

    <div v-if="status === 'pending'" class="loading">読み込み中...</div>
    <template v-else>
      <StatsSummary :stats="overallStats" />

      <h3 class="roll-section-title">人別の記録</h3>
      <div v-if="persons.length === 0" class="empty">
        <p>まだ記録がありません。</p>
      </div>
      <div v-else class="ticket-grid">
        <RecordTicket
          v-for="p in persons"
          :key="p.name"
          :to="`/records/${encodeURIComponent(p.name)}`"
          :title="p.name"
          :meta="`ビンゴカード ${p.cardCount} 枚 ・ 最終更新 ${fmtDate(p.latestActivity)}`"
          :badge="p.bingoCount > 0 ? { text: `${p.bingoCount}回ビンゴ達成`, kind: 'bingo' } : null"
          :chips="[
            `カイルン ${p.stats.totalRolls} 回`,
            `ゾロ目割合 ${p.stats.zoromeRatePercent.toFixed(1)}%`,
            `パンチ率 ${p.stats.punchRatePercent.toFixed(1)}%`,
          ]"
        />
      </div>
    </template>
  </div>
</template>
