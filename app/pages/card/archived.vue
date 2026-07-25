<script setup lang="ts">
import type { BingoCardSummary } from '#shared/types/bingo'

useHead({ title: 'アーカイブ済み一覧 | カイルンBINGO' })

const { data: summaries, status } = useFetch<BingoCardSummary[]>('/api/cards')

const archived = computed(() =>
  (summaries.value ?? []).filter((c) => c.archived).sort((a, b) => b.createdAt - a.createdAt),
)
</script>

<template>
  <div>
    <h2 class="page-title">アーカイブ済みのビンゴカード一覧</h2>
    <p class="page-sub">ビンゴ達成、またはアーカイブされたカードです</p>
    <div class="row" style="margin-bottom: 20px">
      <NuxtLink class="btn btn-secondary" to="/">← 一覧へ戻る</NuxtLink>
    </div>

    <div v-if="status === 'pending'" class="loading">読み込み中...</div>
    <div v-else-if="archived.length === 0" class="empty">
      <p>アーカイブされたビンゴカードはまだありません。</p>
    </div>
    <div v-else class="ticket-grid">
      <BingoTicket v-for="c in archived" :key="c.id" :summary="c" />
    </div>
  </div>
</template>
