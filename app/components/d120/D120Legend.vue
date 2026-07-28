<script setup lang="ts">
import { D120_BANDS, D120_BAND_BOUNDARIES } from '~/utils/d120Heatmap'
</script>

<template>
  <div class="d120-legend">
    <div class="d120-legend-title">標準化残差 z</div>
    <div class="d120-ramp">
      <i v-for="band in D120_BANDS" :key="band.label" :style="{ background: band.fill }" />
    </div>
    <!-- 目盛りは色帯の切れ目の真下に置く。内部境界はちょうど6つ -->
    <div class="d120-ticks">
      <b
        v-for="(t, i) in D120_BAND_BOUNDARIES"
        :key="t"
        :style="{ left: `${((i + 1) / 7) * 100}%` }"
        >{{ t }}</b
      >
    </div>
  </div>
</template>

<style scoped>
.d120-legend {
  width: min(560px, 100%);
  margin: 0 auto;
}
.d120-legend-title {
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 11px;
  letter-spacing: 0.08em;
  color: #6f7489;
  text-align: center;
  margin-bottom: 7px;
}
.d120-ramp {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
}
.d120-ramp i {
  display: block;
  height: 9px;
  border-radius: 2px;
}
.d120-ticks {
  position: relative;
  height: 20px;
  margin-top: 3px;
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 10px;
  color: #6f7489;
  font-variant-numeric: tabular-nums;
}
.d120-ticks b {
  position: absolute;
  top: 0;
  transform: translateX(-50%);
  font-weight: 400;
  padding-top: 6px;
  white-space: nowrap;
}
.d120-ticks b::before {
  content: '';
  position: absolute;
  top: 0;
  left: 50%;
  width: 1px;
  height: 4px;
  background: rgba(232, 233, 242, 0.12);
}
</style>
