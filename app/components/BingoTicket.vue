<script setup lang="ts">
import type { BingoCardSummary } from '#shared/types/bingo'

const props = defineProps<{ summary: BingoCardSummary }>()

const emit = defineEmits<{ delete: [id: string] }>()

const now = Date.now()

const bingoDays = computed(() => {
  const s = props.summary
  return daysBetween(s.createdAt, s.bingoAchievedAt ?? s.updatedAt ?? s.createdAt)
})
</script>

<template>
  <div class="ticket" @click="navigateTo(`/card/${summary.id}`)">
    <template v-if="summary.archived">
      <span v-if="summary.bingoAchieved" class="badge bingo">{{ bingoDays }}日でビンゴ達成</span>
      <span v-else class="badge archived">アーカイブ済み</span>
      <h3>{{ summary.name }}</h3>
      <div class="meta">作成日 {{ fmtDate(summary.createdAt) }}</div>
      <div v-if="summary.bingoAchieved && summary.bingoAchievedAt" class="meta">
        ビンゴ達成日 {{ fmtDate(summary.bingoAchievedAt) }} ・ 達成まで
        {{ daysBetween(summary.createdAt, summary.bingoAchievedAt) }} 日
      </div>
      <div class="stat-row">
        <span class="stat-chip">穴 {{ summary.punchedCount }} 個</span>
      </div>
      <button type="button" class="delete-btn" @click.stop="emit('delete', summary.id)">
        🗑 完全に削除
      </button>
    </template>
    <template v-else>
      <h3>{{ summary.name }}</h3>
      <div class="meta">
        最終更新 {{ fmtDate(summary.updatedAt ?? summary.createdAt) }} ・ 作成から
        {{ daysBetween(summary.createdAt, now) }} 日経過
      </div>
      <div class="stat-row">
        <span class="stat-chip">穴 {{ summary.punchedCount }} 個</span>
        <span v-if="summary.reachCount > 0" class="stat-chip reach">
          リーチ {{ summary.reachCount }} 本
        </span>
      </div>
    </template>
  </div>
</template>
