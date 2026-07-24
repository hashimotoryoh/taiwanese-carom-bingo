<script setup lang="ts">
defineProps<{
  to: string
  title: string
  meta: string
  badge?: { text: string; kind: 'bingo' | 'archived' } | null
  chips: { text: string; reach?: boolean }[]
}>()
</script>

<template>
  <div class="ticket" @click="navigateTo(to)">
    <span v-if="badge" class="badge" :class="badge.kind">{{ badge.text }}</span>
    <h3>{{ title }}</h3>
    <div class="meta">{{ meta }}</div>
    <div class="stat-row">
      <span v-for="chip in chips" :key="chip.text" class="stat-chip" :class="{ reach: chip.reach }">
        {{ chip.text }}
      </span>
    </div>
  </div>
</template>
