<script setup lang="ts">
import type { RollAveragePoint } from '#shared/utils/bingo'

const props = defineProps<{ points: RollAveragePoint[] }>()

// SVGの座標系は実寸（CSSピクセル）に合わせる。文字サイズがCSSの指定どおりに出るようにするため
const root = ref<HTMLElement | null>(null)
const width = useElementWidth(root)
const H = 240
const PAD = { top: 16, right: 14, bottom: 34, left: 46 }
const plotW = computed(() => Math.max(80, width.value - PAD.left - PAD.right))
const plotH = H - PAD.top - PAD.bottom

// 期待値の基準線が必ず収まるよう、表示レンジの計算にも期待値を含める
const domain = computed(() =>
  paddedDomain([
    ...props.points.flatMap((p) => [p.average, p.cumulativeAverage]),
    ROLL_EXPECTED_VALUE,
  ]),
)

/** 点のインデックス → X座標（点は日付の間隔によらず等間隔に置く） */
function toX(index: number): number {
  const n = props.points.length
  return n <= 1 ? PAD.left + plotW.value / 2 : PAD.left + (index / (n - 1)) * plotW.value
}

/** 値 → Y座標 */
function toY(value: number): number {
  const { min, max } = domain.value
  return PAD.top + ((max - value) / (max - min)) * plotH
}

const plotted = computed(() =>
  props.points.map((point, i) => ({
    point,
    x: toX(i),
    y: toY(point.average),
    cumulativeY: toY(point.cumulativeAverage),
  })),
)
const dailyLine = computed(() => plotted.value.map((p) => `${p.x},${p.y}`).join(' '))
const cumulativeLine = computed(() => plotted.value.map((p) => `${p.x},${p.cumulativeY}`).join(' '))

const ticks = computed(() =>
  niceTicks(domain.value.min, domain.value.max).map((value) => ({ value, y: toY(value) })),
)
// 日付ラベルが重ならないよう、幅に収まる本数まで等間隔に間引く
const dateLabels = computed(() => {
  const max = Math.min(6, Math.max(2, Math.floor(plotW.value / 56)))
  return sampledIndexes(plotted.value.length, max).map((i) => plotted.value[i]!)
})
</script>

<template>
  <div ref="root" class="chart">
    <svg
      class="chart-svg"
      :viewBox="`0 0 ${width} ${H}`"
      :height="H"
      role="img"
      aria-label="出目の平均値の遷移グラフ"
    >
      <!-- 横罫線と縦軸ラベル -->
      <g class="chart-grid">
        <g v-for="tick in ticks" :key="tick.value">
          <line
            :x1="PAD.left"
            :x2="width - PAD.right"
            :y1="tick.y"
            :y2="tick.y"
            :class="{ zero: tick.value === 0 }"
          />
          <text class="chart-axis-label" :x="PAD.left - 8" :y="tick.y + 4" text-anchor="end">
            {{ fmtNum(tick.value) }}
          </text>
        </g>
      </g>

      <!-- 出目の期待値の基準線 -->
      <line
        class="chart-expected"
        :x1="PAD.left"
        :x2="width - PAD.right"
        :y1="toY(ROLL_EXPECTED_VALUE)"
        :y2="toY(ROLL_EXPECTED_VALUE)"
      />

      <!-- 控えめな日ごとの平均を先に描き、主役の通算平均を上に重ねる -->
      <polyline class="chart-line daily" :points="dailyLine" />

      <g class="chart-dots">
        <circle v-for="p in plotted" :key="p.point.date" :cx="p.x" :cy="p.y" r="3.5">
          <title>
            {{ fmtDate(p.point.date) }} 平均 {{ fmtNum(p.point.average) }}（{{ p.point.count }}回）
          </title>
        </circle>
      </g>

      <polyline class="chart-line cumulative" :points="cumulativeLine" />

      <g class="chart-tick-labels">
        <text
          v-for="p in dateLabels"
          :key="p.point.date"
          :x="p.x"
          :y="H - PAD.bottom + 18"
          text-anchor="middle"
        >
          {{ fmtShortDate(p.point.date) }}
        </text>
      </g>
    </svg>

    <div class="chart-legend">
      <span class="chart-legend-item daily">日ごとの平均</span>
      <span class="chart-legend-item cumulative">通算平均</span>
      <NuxtLink class="chart-legend-item expected" :to="EXPECTED_VALUE_DOC_PATH">
        期待値 {{ ROLL_EXPECTED_VALUE.toFixed(2) }}
      </NuxtLink>
    </div>
  </div>
</template>
