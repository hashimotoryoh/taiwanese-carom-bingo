/** 目盛りの刻み幅の候補（小さい順に試し、最初に目標本数へ収まったものを使う） */
const TICK_STEPS = [0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 25, 50, 100, 200, 500]

/**
 * 値の並びから、上下に少し余白を足した表示レンジを返す。
 * 値がすべて同じ（レンジ幅0）の場合も `minPadding` の分だけ上下に広げ、線が端に張り付かないようにする。
 */
export function paddedDomain(values: number[], minPadding = 4): { min: number; max: number } {
  if (values.length === 0) return { min: 0, max: 1 }
  const lo = Math.min(...values)
  const hi = Math.max(...values)
  const padding = Math.max(minPadding, (hi - lo) * 0.12)
  return { min: lo - padding, max: hi + padding }
}

/** 指定の刻み幅でレンジ内に収まる目盛り値を昇順で返す */
function ticksAt(min: number, max: number, step: number): number[] {
  const ticks: number[] = []
  for (let v = Math.ceil(min / step) * step; v <= max; v += step) {
    // -0 が「-0」と表示されるのを避ける
    ticks.push(v === 0 ? 0 : v)
  }
  return ticks
}

/**
 * 表示レンジ内に収まる「きりのよい」目盛り値を昇順で返す（目安の本数は `targetCount`）。
 * 刻みを粗くしすぎると目盛りが1本も残らない（例: ±4.15 に刻み5）ため、
 * 2本以上を確保できる範囲で最も粗い刻みを選ぶ。
 */
export function niceTicks(min: number, max: number, targetCount = 4): number[] {
  const span = max - min
  if (!(span > 0)) return [min]
  let finer: number[] | null = null
  for (const step of TICK_STEPS) {
    const ticks = ticksAt(min, max, step)
    if (ticks.length < 2) return finer ?? ticks
    if (ticks.length <= targetCount + 1) return ticks
    finer = ticks
  }
  return finer ?? [min]
}

/**
 * 0〜`count - 1` から最大 `max` 個のインデックスを等間隔で選ぶ（両端は必ず含む）。
 * 点が多いグラフで軸ラベルを間引くのに使う。
 */
export function sampledIndexes(count: number, max: number): number[] {
  if (count <= 0) return []
  if (count <= max) return Array.from({ length: count }, (_, i) => i)
  if (max <= 1) return [0]
  return Array.from({ length: max }, (_, i) => Math.round((i * (count - 1)) / (max - 1)))
}
