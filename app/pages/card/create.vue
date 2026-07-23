<script setup lang="ts">
import type { Ref } from 'vue'
import type { BingoCardSummary, ColumnKey, DraftCard } from '#shared/types/bingo'

useHead({ title: 'ビンゴカード作成 | カイルンBINGO' })

const draftState = useDraftCard()
if (!draftState.value) draftState.value = blankDraft()
// 直前で必ず初期化しているため非nullとして扱う
const draft = draftState as Ref<DraftCard>

const { data: summaries } = useFetch<BingoCardSummary[]>('/api/cards')

const archivedNames = computed(() => [
  ...new Set((summaries.value ?? []).filter((c) => c.archived).map((c) => c.name)),
])
const activeNames = computed(() =>
  (summaries.value ?? []).filter((c) => !c.archived).map((c) => c.name),
)

const errors = ref<string[]>([])
const showClearConfirm = ref(false)

function updateCell(col: ColumnKey, row: number, value: number | null) {
  draft.value.columns[col][row] = value
}

function randomFill() {
  // 既に埋まっている値を除外したプールからランダムに補完する
  const existingValues = COLUMNS.flatMap((col) =>
    draft.value.columns[col.key].filter((v): v is number => v !== null),
  )

  COLUMNS.forEach((col) => {
    if (col.key === 'N') {
      // Nセンターマスを除いた空きマスのインデックスを収集
      const emptyRows = []
      for (let r = 0; r < GRID_SIZE; r++) {
        if (r === FREE_ROW) continue
        if (draft.value.columns.N[r] === null) emptyRows.push(r)
      }
      if (emptyRows.length === 0) return
      const vals = randomUnique(col.min, col.max, emptyRows.length, existingValues)
      emptyRows.forEach((r, i) => {
        draft.value.columns.N[r] = vals[i]!
        existingValues.push(vals[i]!)
      })
    } else if (col.key === 'O') {
      const emptyRows = draft.value.columns.O
        .map((v, i) => (v === null ? i : -1))
        .filter((i) => i !== -1)
      if (emptyRows.length === 0) return
      const vals = randomUnique(col.min, col.max, emptyRows.length, [FREE_VALUE, ...existingValues])
      emptyRows.forEach((r, i) => {
        draft.value.columns.O[r] = vals[i]!
        existingValues.push(vals[i]!)
      })
    } else {
      const emptyRows = draft.value.columns[col.key]
        .map((v, i) => (v === null ? i : -1))
        .filter((i) => i !== -1)
      if (emptyRows.length === 0) return
      const vals = randomUnique(col.min, col.max, emptyRows.length, existingValues)
      emptyRows.forEach((r, i) => {
        draft.value.columns[col.key][r] = vals[i]!
        existingValues.push(vals[i]!)
      })
    }
  })
}

function clearAll() {
  draft.value.columns = blankDraft().columns
  showClearConfirm.value = false
}

function toConfirm() {
  draft.value.name = draft.value.name.trim()
  errors.value = validateDraft(draft.value, activeNames.value)
  if (errors.value.length > 0) return
  navigateTo('/card/confirm')
}
</script>

<template>
  <div>
    <h2 class="page-title">ビンゴカード作成</h2>
    <p class="page-sub">
      あなたのお名前を入力して、B・I・N・G・O 各列に好きな数字を設定してください
    </p>

    <div v-if="errors.length > 0" class="errors">
      <strong>入力内容を確認してください</strong>
      <ul>
        <li v-for="e in errors" :key="e">{{ e }}</li>
      </ul>
    </div>

    <div class="name-field">
      <label for="card-name-input">
        あなたのお名前{{ archivedNames.length > 0 ? '（アーカイブ済みの名前からも選べます）' : '' }}
      </label>
      <input
        id="card-name-input"
        v-model="draft.name"
        type="text"
        list="archived-names"
        placeholder="あなたのお名前"
      />
      <datalist id="archived-names">
        <option v-for="n in archivedNames" :key="n" :value="n" />
      </datalist>
    </div>

    <NumberInputGrid :columns="draft.columns" @update="updateCell" />

    <div class="row" style="margin-top: 22px">
      <NuxtLink class="btn btn-secondary" to="/">← 一覧へ戻る</NuxtLink>
      <div class="spacer" />
      <button class="btn btn-danger" @click="showClearConfirm = true">番号を全てクリアする</button>
      <button class="btn btn-secondary" @click="randomFill">ランダムに埋める</button>
      <button class="btn btn-primary" @click="toConfirm">確認へ進む</button>
    </div>

    <ConfirmDialog
      v-if="showClearConfirm"
      message="入力済みの番号を全て削除します。よろしいですか？"
      ok-label="全てクリアする"
      @confirm="clearAll"
      @cancel="showClearConfirm = false"
    />
  </div>
</template>

<style scoped>
.btn-danger {
  background: var(--stamp);
  color: var(--paper);
  box-shadow: 0 3px 0 var(--stamp-dark);
}
</style>
