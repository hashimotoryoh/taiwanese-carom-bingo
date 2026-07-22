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

function updateCell(col: ColumnKey, row: number, value: number | null) {
  draft.value.columns[col][row] = value
}

function randomFill() {
  COLUMNS.forEach((col) => {
    if (col.key === 'N') {
      const vals = randomUnique(col.min, col.max, GRID_SIZE - 1)
      let vi = 0
      for (let r = 0; r < GRID_SIZE; r++) {
        if (r === FREE_ROW) continue
        draft.value.columns.N[r] = vals[vi++]!
      }
    } else if (col.key === 'O') {
      draft.value.columns.O = randomUnique(col.min, col.max, GRID_SIZE, [FREE_VALUE])
    } else {
      draft.value.columns[col.key] = randomUnique(col.min, col.max, GRID_SIZE)
    }
  })
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
      <button class="btn btn-secondary" @click="randomFill">ランダムに埋める</button>
      <button class="btn btn-primary" @click="toConfirm">確認へ進む</button>
    </div>
  </div>
</template>
