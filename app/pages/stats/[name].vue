<script setup lang="ts">
import type { BingoCard } from '#shared/types/bingo'

const route = useRoute()
const name = route.params.name as string

useHead({ title: `${name}の統計データ | カイルンBINGO` })
useBreadcrumbs(() => [
  { label: '全員の統計データ', to: '/stats' },
  { label: `${name}の統計データ` },
])

const api = useBingoApi()
const { data: cards, status } = useAsyncData<BingoCard[]>('stats-all', () => api.fetchAllCards())

const personCards = computed(() =>
  (cards.value ?? []).filter((c) => c.name === name).sort((a, b) => b.createdAt - a.createdAt),
)

const stats = computed(() => aggregateRollStats(personCards.value))
const bingoCount = computed(() => personCards.value.filter((c) => c.bingoAchieved).length)

const hasRolls = computed(() => stats.value.totalRolls > 0)
const averagePoints = computed(() => dailyRollAverages(personCards.value))
</script>

<template>
  <div>
    <div v-if="status === 'pending'" class="loading">読み込み中...</div>
    <div v-else-if="personCards.length === 0" class="empty">
      <p>{{ name }}さんの記録は見つかりませんでした。</p>
      <NuxtLink class="btn btn-primary" to="/stats">全員の統計データへ戻る</NuxtLink>
    </div>
    <template v-else>
      <h2 class="page-title">{{ name }}の統計データ</h2>
      <p class="page-sub">
        ビンゴカード {{ personCards.length }} 枚分の記録を集計しています
        <template v-if="bingoCount > 0">・ビンゴ達成 {{ bingoCount }} 回</template>
      </p>
      <div class="row" style="margin-bottom: 20px">
        <NuxtLink class="btn btn-secondary" to="/stats">← 全員の統計データへ戻る</NuxtLink>
      </div>

      <StatsSummary :stats="stats" />

      <template v-if="hasRolls">
        <h3 class="roll-section-title">出目の平均値の遷移</h3>
        <RollAverageTrendChart :points="averagePoints" />

        <h3 class="roll-section-title">出目の履歴</h3>
        <CrossCardRollHistoryTable :cards="personCards" />
      </template>
      <template v-else>
        <h3 class="roll-section-title">出目の記録</h3>
        <p class="roll-empty">まだ出目が記録されていません。</p>
      </template>

      <h3 class="roll-section-title">ビンゴカード一覧</h3>
      <div class="ticket-grid">
        <BingoTicket v-for="c in personCards" :key="c.id" :summary="toSummary(c)" />
      </div>
    </template>
  </div>
</template>
