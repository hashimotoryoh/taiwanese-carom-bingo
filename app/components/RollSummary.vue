<script setup lang="ts">
import type { BingoCard } from '#shared/types/bingo'

const props = defineProps<{ card: BingoCard }>()

const stats = computed(() => computeRollStats(props.card))
</script>

<template>
  <StatsSummary :stats="stats" total-rolls-label="カイルン回数" />
</template>
