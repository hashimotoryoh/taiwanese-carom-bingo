<script setup lang="ts">
import type { BingoCard } from '#shared/types/bingo'

const route = useRoute()
const name = route.params.name as string

useHead({ title: `${name}の統計データ | カイルンBINGO` })

const api = useBingoApi()
const { data: cards, status } = useAsyncData<BingoCard[]>('records-all', () => api.fetchAllCards())

const personCards = computed(() =>
  (cards.value ?? []).filter((c) => c.name === name).sort((a, b) => b.createdAt - a.createdAt),
)

const stats = computed(() => aggregateRollStats(personCards.value))
const bingoCount = computed(() => personCards.value.filter((c) => c.bingoAchieved).length)

const cardRows = computed(() =>
  personCards.value.map((c) => ({ card: c, stats: computeRollStats(c) })),
)
</script>

<template>
  <div>
    <div v-if="status === 'pending'" class="loading">読み込み中...</div>
    <div v-else-if="personCards.length === 0" class="empty">
      <p>{{ name }}さんの記録は見つかりませんでした。</p>
      <NuxtLink class="btn btn-primary" to="/records">全統計データへ戻る</NuxtLink>
    </div>
    <template v-else>
      <h2 class="page-title">{{ name }}の統計データ</h2>
      <p class="page-sub">
        ビンゴカード {{ personCards.length }} 枚分の記録を集計しています
        <template v-if="bingoCount > 0">・ビンゴ達成 {{ bingoCount }} 回</template>
      </p>
      <div class="row" style="margin-bottom: 20px">
        <NuxtLink class="btn btn-secondary" to="/records">← 全統計データへ戻る</NuxtLink>
      </div>

      <StatsSummary :stats="stats" />

      <h3 class="roll-section-title">ビンゴカード一覧</h3>
      <div class="ticket-grid">
        <RecordTicket
          v-for="{ card: c, stats: cardStats } in cardRows"
          :key="c.id"
          :to="`/card/${c.id}`"
          :title="`${fmtDate(c.createdAt)} 作成`"
          :meta="`最終更新 ${fmtDate(c.updatedAt ?? c.createdAt)}`"
          :badge="
            c.bingoAchieved
              ? { text: '🎉 ビンゴ達成', kind: 'bingo' }
              : c.archived
                ? { text: 'アーカイブ済み', kind: 'archived' }
                : null
          "
          :chips="[
            `カイルン ${cardStats.totalRolls} 回`,
            `ゾロ目割合 ${cardStats.zoromeRatePercent.toFixed(1)}%`,
            `パンチ率 ${cardStats.punchRatePercent.toFixed(1)}%`,
          ]"
        />
      </div>
    </template>
  </div>
</template>
