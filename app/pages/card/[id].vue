<script setup lang="ts">
import type { BingoCard, ColumnKey } from '#shared/types/bingo'

const route = useRoute()
const id = route.params.id as string

const {
  data: card,
  status,
  refresh,
} = useFetch<BingoCard>(`/api/cards/${id}`, {
  key: `card-${id}`,
})

useHead(() => ({ title: card.value ? `${card.value.name} | カイルンBINGO` : 'カイルンBINGO' }))

const api = useBingoApi()
const confetti = useConfetti()
const draft = useDraftCard()

const now = Date.now()

const locked = computed(() => !!card.value?.archived)
const reachCount = computed(() =>
  card.value && !card.value.archived ? countReachLines(card.value.punched) : 0,
)

const justAchievedBingo = ref(false)
const confirmingArchive = ref(false)
const busy = ref(false)

async function onToggle(col: ColumnKey, row: number) {
  if (!card.value || card.value.archived || busy.value) return
  busy.value = true
  try {
    const res = await api.punch(id, col, row)
    card.value = res.card
    if (res.achievedNow) {
      justAchievedBingo.value = true
      confetti.fire()
      await refreshNuxtData()
    }
  } catch {
    // 他の端末でアーカイブ済みなどの競合時は最新状態を取り直す
    await refresh()
  } finally {
    busy.value = false
  }
}

async function doArchive() {
  confirmingArchive.value = false
  if (!card.value || card.value.archived) return
  card.value = await api.archive(id)
  await refreshNuxtData()
}

function gotoCreateNew() {
  justAchievedBingo.value = false
  draft.value = null
  navigateTo('/card/create')
}
</script>

<template>
  <div>
    <div v-if="status === 'pending'" class="loading">読み込み中...</div>
    <div v-else-if="!card" class="empty">
      <p>指定されたビンゴカードが見つかりませんでした。</p>
      <NuxtLink class="btn btn-primary" to="/">一覧へ戻る</NuxtLink>
    </div>
    <template v-else>
      <div class="card-head">
        <div class="status-row">
          <span v-if="card.bingoAchieved" class="status-pill bingo">🎉 ビンゴ達成</span>
          <span v-else-if="card.archived" class="status-pill archived">アーカイブ済み</span>
          <span v-else class="status-pill active">進行中</span>
        </div>
        <h2>{{ card.name }}</h2>
        <p class="page-sub" style="margin-bottom: 6px">
          作成日 {{ fmtDate(card.createdAt) }}（{{ daysBetween(card.createdAt, now) }} 日経過）・
          {{ locked ? 'アーカイブ日' : '最終更新日' }}
          {{ fmtDate(card.updatedAt ?? card.createdAt) }}
        </p>
      </div>

      <div v-if="!locked && reachCount > 0" class="reach-banner">
        🔥 リーチ {{ reachCount }} 本！光っているマスが開けばビンゴ！
      </div>

      <PunchGrid :card="card" :busy="busy" @toggle="onToggle" />
      <p v-if="!locked" class="punch-legend">
        マスをタップして穴を開ける・もう一度タップで元に戻せます
      </p>

      <div class="row" style="margin-top: 22px">
        <NuxtLink class="btn btn-secondary" to="/">← 一覧へ戻る</NuxtLink>
        <div class="spacer" />
        <button v-if="!locked" class="btn btn-danger" @click="confirmingArchive = true">
          このカードをアーカイブする
        </button>
      </div>

      <ModalOverlay
        v-if="justAchievedBingo"
        modal-class="bingo-modal"
        @close="justAchievedBingo = false"
      >
        <div class="big-emoji">🎉🎊</div>
        <h3>ビンゴ達成!</h3>
        <p>
          このカードはアーカイブされました。貯金箱の中身をすべて受け取りましょう。<br />
          新しいビンゴカードを作りますか?
        </p>
        <div class="row" style="justify-content: center">
          <NuxtLink class="btn btn-secondary" to="/">一覧へ戻る</NuxtLink>
          <button class="btn btn-gold" @click="gotoCreateNew">新しいカードを作成する</button>
        </div>
      </ModalOverlay>

      <ConfirmDialog
        v-if="confirmingArchive"
        message="このビンゴカードをアーカイブします。よろしいですか？"
        ok-label="アーカイブする"
        @confirm="doArchive"
        @cancel="confirmingArchive = false"
      />
    </template>
  </div>
</template>
