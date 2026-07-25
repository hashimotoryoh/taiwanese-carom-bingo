<script setup lang="ts">
import type { BingoCard, ColumnKey } from '#shared/types/bingo'

const route = useRoute()
const id = route.params.id as string

const {
  data: card,
  status,
  refresh,
  error,
} = useFetch<BingoCard>(`/api/cards/${id}`, {
  key: `card-${id}`,
})

// useFetch は失敗すると card を undefined に戻すため、そのままだとカードが存在するのに
// 「見つかりませんでした」表示に化ける。取得できなかった場合は直前の内容を保持する。
// ただし404は他の端末で削除された場合なので、その時だけは保持せず見つからない扱いにする
async function reloadCard() {
  const previous = card.value
  await refresh()
  if (!card.value && error.value?.statusCode !== 404) card.value = previous
}

useHead(() => ({ title: card.value ? `${card.value.name} | カイルンBINGO` : 'カイルンBINGO' }))

const api = useBingoApi()
const confetti = useConfetti()
const draft = useDraftCard()

const now = Date.now()

const locked = computed(() => !!card.value?.archived)
const reachCount = computed(() =>
  card.value && !card.value.archived ? countReachLines(buildPunched(card.value)) : 0,
)

const justAchievedBingo = ref(false)
const reloading = ref(false)
const confirmingArchive = ref(false)
const confirmingDelete = ref(false)
const busy = ref(false)

// 出目記録時に穴が開いたマスへパーティクル演出を出すためのマス指定
const flashCell = ref<{ col: ColumnKey; row: number } | null>(null)
let flashTimer: ReturnType<typeof setTimeout> | null = null

// 削除確認中の記録ID
const pendingDeleteRollId = ref<string | null>(null)

onBeforeUnmount(() => {
  if (flashTimer) clearTimeout(flashTimer)
})

async function onRecord(value: number) {
  if (!card.value || card.value.archived || busy.value) return
  busy.value = true
  try {
    const res = await api.recordRoll(id, value)
    card.value = res.card
    if (res.punchedCell) {
      flashCell.value = res.punchedCell
      if (flashTimer) clearTimeout(flashTimer)
      flashTimer = setTimeout(() => {
        flashCell.value = null
      }, 900)
    }
    if (res.achievedNow) {
      justAchievedBingo.value = true
      confetti.fire()
    }
  } catch {
    // 他の端末でアーカイブ済みなどの競合時は最新状態を取り直す
    await reloadCard()
  } finally {
    busy.value = false
  }
}

// カードの最新状態をサーバーから取り直す
async function onReload() {
  if (reloading.value) return
  reloading.value = true
  try {
    await reloadCard()
  } finally {
    reloading.value = false
  }
}

async function onDeleteRoll() {
  const rollId = pendingDeleteRollId.value
  pendingDeleteRollId.value = null
  if (!rollId || !card.value || card.value.archived || busy.value) return
  busy.value = true
  try {
    card.value = await api.deleteRoll(id, rollId)
  } catch {
    await reloadCard()
  } finally {
    busy.value = false
  }
}

async function doArchive() {
  confirmingArchive.value = false
  if (!card.value || card.value.archived) return
  card.value = await api.archive(id)
}

async function doDelete() {
  confirmingDelete.value = false
  await api.deleteCard(id)
  await navigateTo('/')
}

function gotoCreateNew() {
  justAchievedBingo.value = false
  draft.value = null
  navigateTo('/card/create')
}
</script>

<template>
  <div>
    <!-- 再読み込み時はボタンごと消えてしまうため、初回読み込み（カード未取得）に限り全面のローディングを出す -->
    <div v-if="!card && status === 'pending'" class="loading">読み込み中...</div>
    <div v-else-if="!card" class="empty">
      <p>指定されたビンゴカードが見つかりませんでした。</p>
      <NuxtLink class="btn btn-primary" to="/">一覧へ戻る</NuxtLink>
    </div>
    <template v-else>
      <div class="row between" style="margin-bottom: 20px">
        <NuxtLink class="btn btn-secondary" to="/">← 一覧へ戻る</NuxtLink>
        <button
          class="btn btn-ghost btn-icon"
          :class="{ 'is-loading': reloading }"
          type="button"
          :disabled="reloading"
          title="再読み込み"
          aria-label="再読み込み"
          @click="onReload"
        >
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M20 12a8 8 0 1 1-2.34-5.66"
              stroke="currentColor"
              stroke-width="2.4"
              stroke-linecap="round"
            />
            <path
              d="M20 3.5V9h-5.5"
              stroke="currentColor"
              stroke-width="2.4"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </button>
      </div>

      <div class="card-head">
        <div class="status-row">
          <span v-if="card.bingoAchieved" class="status-pill bingo">🎉 ビンゴ達成</span>
          <span v-else-if="card.archived" class="status-pill archived">アーカイブ済み</span>
          <span v-else class="status-pill active">進行中</span>
        </div>
        <h2>{{ card.name }}</h2>
        <p class="page-sub" style="margin-bottom: 6px">
          作成日 {{ fmtDate(card.createdAt) }}（{{ daysBetween(card.createdAt, now) }} 日目）・
          {{ locked ? 'アーカイブ日' : '最終更新日' }}
          {{ fmtDate(card.updatedAt ?? card.createdAt) }}
        </p>
      </div>

      <div v-if="!locked && reachCount > 0" class="reach-banner">
        🔥 リーチ {{ reachCount }} 本！光っているマスが開けばビンゴ！
      </div>

      <PunchGrid :card="card" :flash-cell="flashCell" />

      <RollInput v-if="!locked" :busy="busy" @record="onRecord" />

      <section class="roll-section">
        <h3 class="roll-section-title">記録サマリー</h3>
        <RollSummary :card="card" />
        <h3 class="roll-section-title">出目の履歴</h3>
        <p v-if="card.rolls.length === 0" class="roll-empty">まだ出目が記録されていません。</p>
        <RollHistoryTable
          v-else
          :card="card"
          :locked="locked"
          @delete="pendingDeleteRollId = $event"
        />
      </section>

      <div class="row" style="margin-top: 22px; justify-content: flex-end">
        <button v-if="!locked" class="btn btn-danger" @click="confirmingArchive = true">
          このカードをアーカイブする
        </button>
        <button v-else class="btn btn-danger" @click="confirmingDelete = true">
          完全に削除する
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

      <ConfirmDialog
        v-if="confirmingDelete"
        message="このビンゴカードを完全に削除します。この操作は元に戻せません。よろしいですか？"
        ok-label="削除する"
        @confirm="doDelete"
        @cancel="confirmingDelete = false"
      />

      <ConfirmDialog
        v-if="pendingDeleteRollId"
        message="この出目の記録を削除します。対応するマスの穴は（同じ出目が他に無ければ）閉じられます。よろしいですか？"
        ok-label="削除する"
        @confirm="onDeleteRoll"
        @cancel="pendingDeleteRollId = null"
      />
    </template>
  </div>
</template>
