<script setup lang="ts">
import type { RollDistributionBin } from '#shared/utils/bingo'

const props = defineProps<{ bins: RollDistributionBin[] }>()

// SVGの座標系は実寸（CSSピクセル）に合わせる。文字サイズがCSSの指定どおりに出るようにするため
const root = ref<HTMLElement | null>(null)
const width = useElementWidth(root)
const H = 240
const PAD = { top: 26, right: 14, bottom: 40, left: 34 }
const plotW = computed(() => Math.max(80, width.value - PAD.left - PAD.right))
const plotH = H - PAD.top - PAD.bottom
// 0（期待どおり）を中央に置き、上下対称に偏差を伸ばす
const ZERO_Y = PAD.top + plotH / 2

const totalRolls = computed(() => props.bins.reduce((sum, b) => sum + b.count, 0))
/** 出目が一様に出た場合に1区間へ入るはずの回数 */
const expectedCount = computed(() =>
  props.bins.length === 0 ? 0 : totalRolls.value / props.bins.length,
)

const deviations = computed(() => props.bins.map((bin) => bin.count - expectedCount.value))
// 上下対称にするため、絶対値の最大を基準にする（偏差が無いときも軸が潰れないよう最低1）
const maxAbs = computed(() => Math.max(1, ...deviations.value.map((d) => Math.abs(d))))
const ticks = computed(() => niceTicks(-maxAbs.value, maxAbs.value))
const axisLimit = computed(() => Math.max(maxAbs.value, ...ticks.value.map((t) => Math.abs(t))))

function toY(deviation: number): number {
  return ZERO_Y - (deviation / axisLimit.value) * (plotH / 2)
}

const slotW = computed(() => plotW.value / Math.max(1, props.bins.length))
const barW = computed(() => slotW.value * 0.66)

const bars = computed(() =>
  props.bins.map((bin, i) => {
    const deviation = deviations.value[i]!
    const center = PAD.left + slotW.value * (i + 0.5)
    const y = toY(deviation)
    return {
      bin,
      deviation,
      center,
      x: center - barW.value / 2,
      y: Math.min(y, ZERO_Y),
      height: Math.abs(ZERO_Y - y),
      // 期待より多い区間と少ない区間を色で分ける
      negative: deviation < 0,
      // 値のラベルは棒の外側（正なら上、負なら下）に置く
      labelY: deviation < 0 ? y + 14 : y - 7,
    }
  }),
)
const gridLines = computed(() => ticks.value.map((value) => ({ value, y: toY(value) })))
// 棒が細いと偏差の値が隣とぶつかるため、幅が足りないときは値を出さない（ツールチップでは見られる）
const showBarValues = computed(() => slotW.value >= 24)
// 幅が狭いと横軸ラベルが重なるため、収まる本数まで等間隔に間引く
const axisLabels = computed(() => {
  const max = Math.max(2, Math.floor(plotW.value / 44))
  return sampledIndexes(bars.value.length, max).map((i) => bars.value[i]!)
})

/** 小数第1位までに丸める（0.05 は符号によらず絶対値の大きい側へ寄せる） */
function round1(n: number): number {
  return (Math.sign(n) * Math.round(Math.abs(n) * 10)) / 10
}

/** 偏差の表示（符号を必ず付ける） */
function fmtDeviation(deviation: number): string {
  const rounded = round1(deviation)
  return rounded > 0 ? `+${fmtNum(rounded)}` : fmtNum(rounded)
}
</script>

<template>
  <div ref="root" class="chart">
    <svg
      class="chart-svg"
      :viewBox="`0 0 ${width} ${H}`"
      :height="H"
      role="img"
      aria-label="出目の偏差"
    >
      <g class="chart-grid">
        <g v-for="line in gridLines" :key="line.value">
          <line :x1="PAD.left" :x2="width - PAD.right" :y1="line.y" :y2="line.y" />
          <text class="chart-axis-label" :x="PAD.left - 8" :y="line.y + 4" text-anchor="end">
            {{ fmtNum(line.value) }}
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
            :class="{ negative: bar.negative }"
          >
            <title>
              {{ bar.bin.min }}〜{{ bar.bin.max }}: {{ bar.bin.count }}回（偏差
              {{ fmtDeviation(bar.deviation) }}）
            </title>
          </rect>
          <text
            v-if="showBarValues && bar.deviation !== 0"
            class="chart-bar-value"
            :x="bar.center"
            :y="bar.labelY"
            text-anchor="middle"
          >
            {{ fmtDeviation(bar.deviation) }}
          </text>
        </template>
      </g>

      <!-- 期待どおり（偏差0）の基準線 -->
      <line
        class="chart-baseline"
        :x1="PAD.left"
        :x2="width - PAD.right"
        :y1="ZERO_Y"
        :y2="ZERO_Y"
      />

      <g class="chart-tick-labels">
        <text
          v-for="bar in axisLabels"
          :key="bar.bin.min"
          :x="bar.center"
          :y="H - PAD.bottom + 18"
          text-anchor="middle"
        >
          {{ bar.bin.min }}
        </text>
      </g>
    </svg>
    <p class="chart-note">
      横軸は出目（10刻み）・縦軸は期待度数 {{ fmtNum(round1(expectedCount)) }} 回からの偏差
    </p>
  </div>
</template>
