<script setup lang="ts">
import type { RollStats } from '#shared/utils/bingo'

defineProps<{ rows: { name: string; stats: RollStats }[] }>()
</script>

<template>
  <div class="person-stats-list">
    <!-- グリッドは全体集計と共通のまま、compact で控えめな見た目にして区別する -->
    <section
      v-for="row in rows"
      :key="row.name"
      class="person-stats"
      @click="navigateTo(`/stats/${encodeURIComponent(row.name)}`)"
    >
      <h4 class="person-stats-name">{{ row.name }}</h4>
      <StatsSummary :stats="row.stats" compact />
    </section>
  </div>
</template>
