<script setup lang="ts">
import type { RollFrequencyStats } from '#shared/utils/bingo'

const props = defineProps<{ stats: RollFrequencyStats }>()

const percent = computed(() => (props.stats.probability * 100).toFixed(2))
const totalRolls = computed(() => props.stats.totalRolls.toLocaleString('ja-JP'))
const expected = computed(() => props.stats.expected.toFixed(2))
const sigma = computed(() => props.stats.sigma.toFixed(2))
</script>

<template>
  <dl class="d120-formula">
    <dt>特定の目の出現する確率</dt>
    <dd>
      <span class="eq">p = 1 / 120 =</span> <span class="res">{{ percent }}</span>
      <span class="eq">%</span>
    </dd>
    <dt>カイルン回数</dt>
    <dd>
      <span class="eq">N =</span> <span class="res">{{ totalRolls }}</span>
      <span class="eq">回</span>
    </dd>
    <dt>特定の目の出現回数の期待値</dt>
    <dd>
      <span class="eq">e = N / 120 =</span> <span class="res">{{ expected }}</span>
      <span class="eq">回</span>
    </dd>
    <dt>標準偏差</dt>
    <dd>
      <span class="eq">σ = √(N × p × (1 − p)) =</span> <span class="res">{{ sigma }}</span>
      <span class="eq">回</span>
    </dd>
    <dt>標準化残差</dt>
    <dd><span class="eq">z = (目の出現回数 − e) / σ</span></dd>
  </dl>
</template>

<style scoped>
.d120-formula {
  margin: 0;
  display: grid;
  grid-template-columns: auto auto;
  column-gap: 18px;
  row-gap: 7px;
  align-items: baseline;
  justify-content: center;
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 13px;
}
.d120-formula dt {
  color: #6f7489;
  font-size: 12px;
  text-align: right;
  font-family: 'Zen Kaku Gothic New', sans-serif;
}
.d120-formula dd {
  margin: 0;
  color: #e8e9f2;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
.d120-formula .eq {
  color: #a7abc0;
}
.d120-formula .res {
  font-weight: 600;
}
@media (max-width: 640px) {
  .d120-formula {
    grid-template-columns: 1fr;
    row-gap: 2px;
    justify-items: center;
    text-align: center;
  }
  .d120-formula dt {
    text-align: center;
    margin-top: 8px;
  }
}
</style>
