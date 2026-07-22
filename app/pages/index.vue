<script setup lang="ts">
import type { BingoCardSummary } from '#shared/types/bingo'

useHead({ title: 'ビンゴカード一覧 | カイルンBINGO' })

const { data: summaries, status, refresh } = useFetch<BingoCardSummary[]>('/api/cards')

// カード詳細ページからの戻り時など、ページがキャッシュから復元された際に最新状態を取得する
onActivated(() => refresh())

const active = computed(() =>
  (summaries.value ?? []).filter((c) => !c.archived).sort((a, b) => b.createdAt - a.createdAt),
)

const draft = useDraftCard()

function gotoCreate() {
  draft.value = null
  navigateTo('/card/create')
}
</script>

<template>
  <div>
    <h2 class="page-title">ビンゴカード一覧</h2>
    <p class="page-sub">カードを選んで進行状況を確認できます</p>
    <div class="row between" style="margin-bottom: 20px">
      <NuxtLink class="btn btn-secondary" to="/card/archived">アーカイブ一覧を見る</NuxtLink>
      <button class="btn btn-primary" @click="gotoCreate">+ 新しいビンゴカードを作成</button>
    </div>

    <div v-if="status === 'pending'" class="loading">読み込み中...</div>
    <div v-else-if="active.length === 0" class="empty">
      <p>まだビンゴカードがありません。最初の1枚を作りましょう。</p>
      <button class="btn btn-primary" @click="gotoCreate">ビンゴカードを作成する</button>
    </div>
    <div v-else class="ticket-grid">
      <BingoTicket v-for="c in active" :key="c.id" :summary="c" />
    </div>
  </div>
</template>
