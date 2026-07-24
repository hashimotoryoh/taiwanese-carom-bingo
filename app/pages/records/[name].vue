<script setup lang="ts">
import type { BingoCard } from '#shared/types/bingo'

const route = useRoute()
const name = route.params.name as string

useHead({ title: `${name}の統計データ | カイルンBINGO` })

const api = useBingoApi()
const {
  data: cards,
  status,
  refresh,
} = useAsyncData<BingoCard[]>('records-all', () => api.fetchAllCards())

const personCards = computed(() =>
  (cards.value ?? []).filter((c) => c.name === name).sort((a, b) => b.createdAt - a.createdAt),
)

const stats = computed(() => aggregateRollStats(personCards.value))
const bingoCount = computed(() => personCards.value.filter((c) => c.bingoAchieved).length)

const pendingDeleteId = ref<string | null>(null)

async function confirmDelete() {
  if (!pendingDeleteId.value) return
  await api.deleteCard(pendingDeleteId.value)
  pendingDeleteId.value = null
  await refresh()
}
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
        <BingoTicket
          v-for="c in personCards"
          :key="c.id"
          :summary="toSummary(c)"
          @delete="pendingDeleteId = $event"
        />
      </div>
    </template>

    <ConfirmDialog
      v-if="pendingDeleteId"
      message="このビンゴカードを完全に削除します。この操作は元に戻せません。よろしいですか？"
      ok-label="削除する"
      @confirm="confirmDelete"
      @cancel="pendingDeleteId = null"
    />
  </div>
</template>
