<script setup lang="ts">
import type { BingoCard } from '#shared/types/bingo'

useHead({ title: '出目一覧 | カイルンBINGO' })
useBreadcrumbs(() => [{ label: '統計データ', to: '/stats' }, { label: '出目一覧' }])

const api = useBingoApi()
// 統計ページと同じキーなので、そちらを経由して来た場合はキャッシュが効く
const { data: cards, status } = useAsyncData<BingoCard[]>('stats-all', () => api.fetchAllCards())

const stats = computed(() => rollFrequencyStats(cards.value ?? []))

interface FaceRow {
  value: number
  count: number
  zorome: boolean
}

const rows = computed<FaceRow[]>(() =>
  Array.from({ length: MAX_ROLL }, (_, i) => ({
    value: i + 1,
    count: stats.value.counts[i] ?? 0,
    zorome: isZorome(i + 1),
  })),
)

const unrolledCount = computed(() => rows.value.filter((r) => r.count === 0).length)

type SortKey = 'value' | 'count'
const sortKey = ref<SortKey>('value')
const sortAsc = ref(true)

function toggleSort(key: SortKey) {
  if (sortKey.value === key) {
    sortAsc.value = !sortAsc.value
  } else {
    sortKey.value = key
    sortAsc.value = true
  }
}

const sortedRows = computed(() => {
  const dir = sortAsc.value ? 1 : -1
  return [...rows.value].sort((a, b) => (a[sortKey.value] - b[sortKey.value]) * dir)
})
</script>

<template>
  <div>
    <h2 class="page-title">出目一覧</h2>
    <p class="page-sub">1〜120の目ごとに、これまでの出現回数を確認できます</p>

    <div v-if="status === 'pending'" class="loading">読み込み中...</div>
    <template v-else>
      <div class="roll-summary">
        <div class="summary-item">
          <span class="summary-label">通算カイルン回数</span>
          <div class="summary-figure">
            <span class="summary-value"
              >{{ stats.totalRolls }}<span class="summary-unit">回</span></span
            >
          </div>
        </div>
        <div class="summary-item">
          <span class="summary-label">まだ出ていない目</span>
          <div class="summary-figure">
            <span class="summary-value"
              >{{ unrolledCount }}<span class="summary-unit">/ {{ MAX_ROLL }}</span></span
            >
          </div>
        </div>
      </div>

      <table class="faces-table">
        <thead>
          <tr>
            <th
              class="sortable"
              :class="{ active: sortKey === 'value' }"
              role="button"
              tabindex="0"
              @click="toggleSort('value')"
              @keydown.enter="toggleSort('value')"
              @keydown.space.prevent="toggleSort('value')"
            >
              目
              <span class="sort-arrow">{{ sortKey === 'value' ? (sortAsc ? '▲' : '▼') : '' }}</span>
            </th>
            <th
              class="sortable"
              :class="{ active: sortKey === 'count' }"
              role="button"
              tabindex="0"
              @click="toggleSort('count')"
              @keydown.enter="toggleSort('count')"
              @keydown.space.prevent="toggleSort('count')"
            >
              出現回数
              <span class="sort-arrow">{{ sortKey === 'count' ? (sortAsc ? '▲' : '▼') : '' }}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in sortedRows" :key="row.value" :class="{ unrolled: row.count === 0 }">
            <td class="faces-value" :class="{ zorome: row.zorome }">
              {{ row.value }}
              <span v-if="row.zorome" class="zorome-tag">ゾロ目</span>
            </td>
            <td class="faces-count">{{ row.count }}</td>
          </tr>
        </tbody>
      </table>
    </template>
  </div>
</template>

<style scoped>
.faces-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.86rem;
  margin-top: 20px;
}
.faces-table th,
.faces-table td {
  padding: 8px 10px;
  text-align: left;
  border-bottom: 1px solid rgba(35, 46, 61, 0.1);
}
.faces-table th {
  font-size: 0.72rem;
  color: var(--ink-soft);
  font-weight: 700;
  white-space: nowrap;
}
.faces-table th.sortable {
  cursor: pointer;
  user-select: none;
}
.faces-table th.sortable:hover {
  color: var(--stamp-dark);
}
.faces-table th.sortable:focus-visible {
  outline: 2px solid var(--stamp);
  outline-offset: -2px;
}
.faces-table th.active {
  color: var(--stamp-dark);
}
.sort-arrow {
  display: inline-block;
  width: 0.9em;
  font-size: 0.65rem;
}
.faces-value {
  font-family: 'JetBrains Mono', monospace;
  font-weight: 700;
  color: var(--ink);
}
.faces-value.zorome {
  color: var(--stamp-dark);
}
.faces-count {
  font-family: 'JetBrains Mono', monospace;
  font-weight: 700;
  color: var(--ink);
}
tr.unrolled .faces-count {
  color: var(--ink-soft);
  font-weight: 400;
}
tr.unrolled {
  background: rgba(184, 57, 43, 0.05);
}
</style>
