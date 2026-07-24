<script setup lang="ts">
defineProps<{
  to: string
  title: string
  meta: string
  badge?: { text: string; kind: 'bingo' | 'archived' } | null
  chips: string[]
}>()
</script>

<template>
  <div class="ticket" @click="navigateTo(to)">
    <span v-if="badge" class="badge" :class="badge.kind">{{ badge.text }}</span>
    <h3>{{ title }}</h3>
    <div class="meta">{{ meta }}</div>
    <div class="stat-row">
      <span v-for="chip in chips" :key="chip" class="stat-chip">{{ chip }}</span>
    </div>
  </div>
</template>
