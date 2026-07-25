<script setup lang="ts">
import type { RollDistributionBin } from '#shared/utils/bingo'

const props = defineProps<{ bins: RollDistributionBin[] }>()

// SVGの座標系は実寸（CSSピクセル）に合わせる。文字サイズがCSSの指定どおりに出るようにするため
const root = ref<HTMLElement | null>(null)
const width = useElementWidth(root)
const H = 240
const PAD = { top: 22, right: 14, bottom: 40, left: 34 }
const plotW = computed(() => Math.max(80, width.value - PAD.left - PAD.right))
const plotH = H - PAD.top - PAD.bottom
const BASELINE = PAD.top + plotH

const maxCount = computed(() => Math.max(1, ...props.bins.map((b) => b.count)))
const ticks = computed(() => niceTicks(0, maxCount.value))
// 目盛りの最大値まで縦軸を伸ばし、最も高い棒が罫線からはみ出さないようにする
const yMax = computed(() => Math.max(maxCount.value, ...ticks.value))

function toY(count: number): number {
  return BASELINE - (count / yMax.value) * plotH
}

const slotW = computed(() => plotW.value / Math.max(1, props.bins.length))
const barW = computed(() => slotW.value * 0.66)

const bars = computed(() =>
  props.bins.map((bin, i) => {
    const center = PAD.left + slotW.value * (i + 0.5)
    const y = toY(bin.count)
    return {
      bin,
      center,
      x: center - barW.value / 2,
      y,
      height: BASELINE - y,
      // 最も記録数の多い区間を強調する（記録が無いときは強調しない）
      top: bin.count > 0 && bin.count === maxCount.value,
    }
  }),
)
const gridLines = computed(() => ticks.value.map((value) => ({ value, y: toY(value) })))
// 幅が狭いと横軸ラベルが重なるため、収まる本数まで等間隔に間引く
const axisLabels = computed(() => {
  const max = Math.max(2, Math.floor(plotW.value / 44))
  return sampledIndexes(bars.value.length, max).map((i) => bars.value[i]!)
})
</script>

<template>
  <div ref="root" class="chart">
    <svg
      class="chart-svg"
      :viewBox="`0 0 ${width} ${H}`"
      :height="H"
      role="img"
      aria-label="出目の分布図"
    >
      <g class="chart-grid">
        <g v-for="line in gridLines" :key="line.value">
          <line :x1="PAD.left" :x2="width - PAD.right" :y1="line.y" :y2="line.y" />
          <text class="chart-axis-label" :x="PAD.left - 8" :y="line.y + 4" text-anchor="end">
            {{ line.value }}
          </text>
        </g>
      </g>

      <g class="chart-bars">
        <template v-for="bar in bars" :key="bar.bin.min">
          <rect
            :x="bar.x"
            :y="bar.y"
            :width="barW"
            :height="bar.height"
            rx="3"
            :class="{ top: bar.top }"
          >
            <title>{{ bar.bin.min }}〜{{ bar.bin.max }}: {{ bar.bin.count }}回</title>
          </rect>
          <text
            v-if="bar.bin.count > 0"
            class="chart-bar-value"
            :x="bar.center"
            :y="bar.y - 6"
            text-anchor="middle"
          >
            {{ bar.bin.count }}
          </text>
        </template>
      </g>

      <line
        class="chart-baseline"
        :x1="PAD.left"
        :x2="width - PAD.right"
        :y1="BASELINE"
        :y2="BASELINE"
      />

      <g class="chart-tick-labels">
        <text
          v-for="bar in axisLabels"
          :key="bar.bin.min"
          :x="bar.center"
          :y="BASELINE + 18"
          text-anchor="middle"
        >
          {{ bar.bin.min }}
        </text>
      </g>
    </svg>
    <p class="chart-note">横軸は出目（10刻み）・縦軸はその区間の記録数</p>
  </div>
</template>
