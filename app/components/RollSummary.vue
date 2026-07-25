<script setup lang="ts">
import type { BingoCard } from '#shared/types/bingo'

const props = defineProps<{ card: BingoCard }>()

const stats = computed(() => computeRollStats(props.card))
</script>

<template>
  <!-- カード単体のページでは「通算」を付けず「カイルン回数」などにする -->
  <StatsSummary :stats="stats" label-prefix="" />
</template>
