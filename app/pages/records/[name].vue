<script setup lang="ts">
import type { BingoCard } from '#shared/types/bingo'

const route = useRoute()
const name = route.params.name as string

useHead({ title: `${name}さんの記録 | カイルンBINGO` })

const api = useBingoApi()
const { data: cards, status } = useAsyncData<BingoCard[]>('records-all', () => api.fetchAllCards())

const personCards = computed(() =>
  (cards.value ?? []).filter((c) => c.name === name).sort((a, b) => b.createdAt - a.createdAt),
)

const stats = computed(() => aggregateRollStats(personCards.value))
const bingoCount = computed(() => personCards.value.filter((c) => c.bingoAchieved).length)
</script>

<template>
  <div>
    <div v-if="status === 'pending'" class="loading">読み込み中...</div>
    <div v-else-if="personCards.length === 0" class="empty">
      <p>{{ name }}さんの記録は見つかりませんでした。</p>
      <NuxtLink class="btn btn-primary" to="/records">全記録サマリーへ戻る</NuxtLink>
    </div>
    <template v-else>
      <h2 class="page-title">{{ name }}さんの記録サマリー</h2>
      <p class="page-sub">
        ビンゴカード {{ personCards.length }} 枚分の記録を集計しています
        <template v-if="bingoCount > 0">・ビンゴ達成 {{ bingoCount }} 回</template>
      </p>
      <div class="row" style="margin-bottom: 20px">
        <NuxtLink class="btn btn-secondary" to="/records">← 全記録サマリーへ戻る</NuxtLink>
      </div>

      <StatsSummary :stats="stats" />

      <h3 class="roll-section-title">ビンゴカード一覧</h3>
      <div class="ticket-grid">
        <div
          v-for="c in personCards"
          :key="c.id"
          class="ticket"
          @click="navigateTo(`/card/${c.id}`)"
        >
          <span v-if="c.bingoAchieved" class="badge bingo">🎉 ビンゴ達成</span>
          <span v-else-if="c.archived" class="badge archived">アーカイブ済み</span>
          <h3>{{ fmtDate(c.createdAt) }} 作成</h3>
          <div class="meta">最終更新 {{ fmtDate(c.updatedAt ?? c.createdAt) }}</div>
          <div class="stat-row">
            <span class="stat-chip">カイルン {{ c.rolls.length }} 回</span>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
